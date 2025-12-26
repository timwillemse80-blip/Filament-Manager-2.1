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
          { text: "Strictly identify the 3D printer filament from this label. Extract the exact Brand, Material (e.g., PLA, PETG, ABS, ASA, TPU), Color Name (in English), most accurate HEX color code, recommended Nozzle Temp (°C), and Bed Temp (°C). If temps are ranges, give the middle value. Look for a 4-character ID code (Short ID) like 'A1B2'. Return ONLY valid JSON." }
        ]
      },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING, description: "The manufacturer brand name" },
            material: { type: Type.STRING, description: "The type of material (PLA, PETG, etc.)" },
            colorName: { type: Type.STRING, description: "Common name of the color in English" },
            colorHex: { type: Type.STRING, description: "Hexadecimal color code representing the filament" },
            tempNozzle: { type: Type.NUMBER, description: "Ideal nozzle temperature in Celsius" },
            tempBed: { type: Type.NUMBER, description: "Ideal bed temperature in Celsius" },
            shortId: { type: Type.STRING, description: "A unique 4-character code found on the label" },
          },
          required: ["brand", "material"]
        }
      }
    });

    const result = JSON.parse(cleanJsonString(response.text || "{}"));
    return result;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error.message || "AI Analysis failed.");
  }
};

export const parseCatalogText = async (text: string): Promise<{ brand: string, size: string, spool_material: string, weight: number }[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following text and extract a list of empty spool weights.
      Return a JSON ARRAY of objects with:
      - brand (e.g. 'Bambu Lab')
      - size (e.g. '1kg' or '250g')
      - spool_material (e.g. 'Plastic', 'Cardboard')
      - weight (number in grams)
      
      TEXT:
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
          { text: "Find a unique 4-character ID code on this label. Return only the code in JSON format." }
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
      contents: `Provide recommended print settings for ${brand} ${material} filament in JSON format.`,
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