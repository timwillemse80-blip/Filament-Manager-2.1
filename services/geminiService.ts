
import { GoogleGenAI, Type } from "@google/genai";
import { AiSuggestion } from "../types";

// Initialiseer de AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSpoolImage = async (base64Image: string): Promise<AiSuggestion> => {
  try {
    const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { 
            text: `Analyseer de tekst op dit etiket van een 3D printer filament spoel.
            Zoek naar het merk, materiaal, kleur en aanbevolen temperaturen.
            Zoek ook specifiek naar een 4-cijferige unieke code (Short ID) beginnend met # of losstaand.
            Geef het resultaat terug in JSON formaat.` 
          }
        ]
      },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING },
            material: { type: Type.STRING },
            colorName: { type: Type.STRING, description: "Kleurnaam in het Nederlands" },
            colorHex: { type: Type.STRING, description: "Hexadecimale kleurcode" },
            tempNozzle: { type: Type.NUMBER },
            tempBed: { type: Type.NUMBER },
            shortId: { type: Type.STRING },
          },
          required: ["brand", "material", "colorName"]
        }
      }
    });

    if (!response.text) throw new Error("Geen tekst ontvangen van AI");
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error.message || "AI Analyse mislukt.");
  }
};

export const lookupSpoolFromImage = async (base64Image: string): Promise<string | null> => {
  try {
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
          },
          required: ["shortId"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result.shortId || null;
  } catch (error) {
    return null;
  }
};

export const suggestSettings = async (brand: string, material: string): Promise<AiSuggestion> => {
  try {
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
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return {}; 
  }
};
