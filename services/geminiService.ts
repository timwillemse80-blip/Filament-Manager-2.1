
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

/**
 * Schont een base64 string op door alle mogelijke 'data:...base64,' headers te verwijderen.
 */
const getRawBase64 = (base64Image: string): string => {
  if (!base64Image) return "";
  // Verwijdert alles tot en met de laatste komma (bijv. "data:image/jpeg;base64,")
  const matches = base64Image.match(/^data:.*?;base64,(.*)$/);
  if (matches && matches[1]) return matches[1];
  
  // Als er geen header is, maar wel een komma (soms bij web-canvas)
  if (base64Image.includes(',')) return base64Image.split(',')[1];
  
  return base64Image;
};

export const analyzeSpoolImage = async (base64Image: string): Promise<AiSuggestion> => {
  try {
    const rawData = getRawBase64(base64Image);
    
    if (!rawData || rawData.length < 100) {
      throw new Error("Ongeldige afbeeldingsdata ontvangen. Probeer het opnieuw.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: rawData } },
          { text: "Analyseer deze filament spoel afbeelding. Geef JSON terug met: brand, material, colorName (NL), colorHex, tempNozzle (number), tempBed (number), shortId (zoek naar een 4-cijferige code beginnend met # of losstaand)." }
        ]
      },
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
            shortId: { type: Type.STRING },
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

export const lookupSpoolFromImage = async (base64Image: string): Promise<string | null> => {
  try {
    const rawData = getRawBase64(base64Image);
    if (!rawData) return null;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: rawData } },
          { text: "Zoek op dit label naar een unieke 4-cijferige ID (Short ID). Geef enkel de code terug in JSON formaat." }
        ]
      },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortId: { type: Type.STRING },
          }
        }
      }
    });

    const result = JSON.parse(cleanJsonString(response.text || "{}"));
    return result.shortId || null;
  } catch (error) {
    return null;
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
