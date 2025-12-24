
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
            text: `You are an expert in 3D-printing materials. Analyze this image of a filament spool or label very accurately:
            1. Identify the BRAND. Look at text and known logos (like Bambu Lab, Polymaker, eSun, etc.).
            2. Identify the MATERIAL (PLA, PETG, ABS, etc.).
            3. Identify the COLOR. Look at text on the label (e.g. "Galaxy Black") AND at the physical color of the filament. Provide a clear color name in English and a corresponding HEX code that best represents the color.
            4. Look for recommended Nozzle and Bed TEMPERATURES.
            5. Search for a unique 4-character code (Short ID) starting with # or standing alone.
            
            Provide the result strictly in JSON format.` 
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
            colorName: { type: Type.STRING, description: "Accurate color name in English" },
            colorHex: { type: Type.STRING, description: "Visually matching HEX code" },
            tempNozzle: { type: Type.NUMBER },
            tempBed: { type: Type.NUMBER },
            shortId: { type: Type.STRING },
          },
          required: ["brand", "material", "colorName"]
        }
      }
    });

    if (!response.text) throw new Error("No text received from AI");
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error.message || "AI Analysis failed.");
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
          { text: "Scan this label for a unique 4-character ID (Short ID). Return only the code in JSON format." }
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
      contents: `Provide recommended temperatures for ${brand} ${material} filament in JSON format.`,
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
