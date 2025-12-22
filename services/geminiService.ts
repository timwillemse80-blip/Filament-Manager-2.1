import { GoogleGenAI, Type } from "@google/genai";
import { AiSuggestion } from "../types";

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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: "Analyseer deze filament spoel afbeelding. Geef JSON terug met: brand, material, colorName (NL), colorHex, tempNozzle (number), tempBed (number)." }
        ]
      }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING },
            material: { type: Type.STRING },
            colorName: { type: Type.STRING },
            colorHex: { type: Type.STRING },
            tempNozzle: { type: Type.NUMBER },
            tempBed: { type: Type.NUMBER },
          }
        }
      }
    });

    return JSON.parse(cleanJsonString(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error.message || "AI Analyse mislukt.");
  }
};

export const suggestSettings = async (brand: string, material: string): Promise<AiSuggestion> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Geef aanbevolen temperaturen voor ${brand} ${material} filament in JSON formaat.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tempNozzle: { type: Type.NUMBER },
            tempBed: { type: Type.NUMBER },
          }
        }
      }
    });
    return JSON.parse(cleanJsonString(response.text || "{}"));
  } catch (error) {
    return {}; 
  }
};