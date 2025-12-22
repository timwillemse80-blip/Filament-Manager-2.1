
import { GoogleGenAI } from "@google/genai";
import { AiSuggestion } from "../types";

// Volgens de nieuwste richtlijnen: initialiseer de client direct met process.env.API_KEY
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

const cleanJsonString = (str: string): string => {
  if (!str) return "{}";
  let cleaned = str.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
};

export const analyzeSpoolImage = async (base64Image: string): Promise<AiSuggestion> => {
  try {
    const ai = getAiClient();
    const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
    
    // Gebruik gemini-3-flash-preview voor snelle analyse taken
    const modelId = 'gemini-3-flash-preview';

    const prompt = `
      Analyseer deze afbeelding van een filament spoel.
      Extracteer gegevens in JSON:
      - brand: Merknaam.
      - material: Materiaal type (PLA, PETG, etc).
      - colorName: Kleurnaam in het Nederlands.
      - colorHex: Geschatte CSS Hex code.
      - tempNozzle: Nozzle temp (getal).
      - tempBed: Bed temp (getal).
      Output alleen JSON.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: prompt }
        ]
      }],
      config: { 
        responseMimeType: "application/json"
      }
    });

    if (!response.text) throw new Error("Leeg antwoord van AI");
    return JSON.parse(cleanJsonString(response.text));

  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error.message || "AI Analyse mislukt.");
  }
};

export const suggestSettings = async (brand: string, material: string): Promise<AiSuggestion> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Return JSON with avg tempNozzle and tempBed for ${brand} ${material} filament.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonString(response.text || "{}"));
  } catch (error) {
    return {}; 
  }
};
