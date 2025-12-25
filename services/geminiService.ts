
import { GoogleGenAI, Type } from "@google/genai";
import { AiSuggestion } from "../types";

const cleanJsonString = (str: string): string => {
  if (!str) return "{}";
  let cleaned = str.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
     return cleaned.substring(firstBracket, lastBracket + 1);
  }
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
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
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

export const parseCatalogText = async (text: string): Promise<{ brand: string, size: string, spool_material: string, weight: number }[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyseer de volgende tekst en extraheer een lijst van lege spoelgewichten.
      Geef een JSON ARRAY terug met objecten die de volgende velden hebben:
      - brand (bv. 'Bambu Lab')
      - size (bv. '1kg' of '250g')
      - spool_material (bv. 'Plastic', 'Cardboard', 'Transparent Plastic')
      - weight (getal in grammen)
      
      TEKST:
      ${text}`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              brand: { type: Type.STRING },
              size: { type: Type.STRING },
              spool_material: { type: Type.STRING },
              weight: { type: Type.NUMBER },
            },
            required: ["brand", "weight"]
          }
        }
      }
    });

    return JSON.parse(cleanJsonString(response.text || "[]"));
  } catch (error) {
    console.error("Catalog Parse Error:", error);
    return [];
  }
};

export const lookupSpoolFromImage = async (base64Image: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
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
