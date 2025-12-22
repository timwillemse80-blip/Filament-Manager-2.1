
import { GoogleGenAI, Type } from "@google/genai";
import { AiSuggestion } from "../types";

/**
 * Image analysis and settings suggestions using Gemini AI.
 * Follows @google/genai coding guidelines.
 */

export const analyzeSpoolImage = async (base64Image: string): Promise<AiSuggestion> => {
  try {
    // Initialization: Must use named parameter and process.env.API_KEY directly.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
    
    // Use gemini-3-flash-preview for text/vision tasks with schema.
    const modelId = 'gemini-3-flash-preview';

    const prompt = `
      Analyseer deze afbeelding van een filament spoel.
      Extracteer de gegevens. Vertaal vreemde talen voor kleurnamen naar het Nederlands (bijv. 'Schwarz' of 'Black' -> 'Zwart').
    `;

    console.log(`Gemini: Starting analysis...`);
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: prompt }
        ]
      },
      config: { 
        responseMimeType: "application/json",
        // Recommended way to configure expected output using responseSchema and Type.
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING, description: 'Merknaam' },
            material: { type: Type.STRING, description: 'Materiaal type (PLA, PETG, etc)' },
            colorName: { type: Type.STRING, description: 'Kleurnaam in het Nederlands' },
            colorHex: { type: Type.STRING, description: 'Geschatte CSS Hex code' },
            tempNozzle: { type: Type.NUMBER, description: 'Nozzle temperatuur' },
            tempBed: { type: Type.NUMBER, description: 'Bed temperatuur' },
          },
          required: ['brand', 'material', 'colorName']
        }
      }
    });

    // Directly access .text property from response.
    if (!response.text) throw new Error("Leeg antwoord van AI");
    return JSON.parse(response.text.trim());

  } catch (error: any) {
    console.error("Gemini Error:", error);
    const msg = error.message || JSON.stringify(error);
    
    if (msg.includes('leaked') || msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
       throw new Error("⛔ API KEY GEBLOKKEERD\n\nGoogle heeft gedetecteerd dat je API sleutel openbaar is geworden en heeft deze geblokkeerd.\n\nOplossing:\n1. Maak direct een nieuwe sleutel aan in Google AI Studio.\n2. Update de 'API_KEY' in Vercel Environment Variables.");
    }

    if (msg.includes('API_KEY_INVALID') || msg.includes('400')) {
        throw new Error("Ongeldige API Key. Controleer in Vercel of de sleutel correct is.");
    }
    
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("AI Limiet bereikt (Rate Limit). Probeer het over een minuutje nog eens.");
    }
    
    throw new Error("AI Analyse mislukt. Probeer de foto opnieuw te maken met betere belichting.");
  }
};

export const suggestSettings = async (brand: string, material: string): Promise<AiSuggestion> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest recommended nozzle and bed temperatures for ${brand} ${material} filament in JSON format.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tempNozzle: { type: Type.NUMBER },
            tempBed: { type: Type.NUMBER }
          }
        }
      }
    });
    return JSON.parse(response.text?.trim() || "{}");
  } catch (error) {
    return {}; 
  }
};
