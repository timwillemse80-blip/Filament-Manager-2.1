import { GoogleGenAI } from "@google/genai";
import { AiSuggestion } from "../types";

let aiClient: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (aiClient) return aiClient;

  // Haal de API key op
  let apiKey = process.env.API_KEY || "";
  
  // 1. Verwijder quotes als de gebruiker die per ongeluk in Vercel heeft gezet (bv "AIza...")
  // 2. Verwijder spaties voor/achter
  apiKey = apiKey.replace(/^['"]|['"]$/g, '').trim();

  if (!apiKey) {
    console.error("Gemini API Key missing!");
    throw new Error("API Key is niet ingesteld. Controleer 'VITE_API_KEY' in Vercel.");
  }

  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
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
    const modelId = 'gemini-2.5-flash';

    const prompt = `
      Analyseer deze afbeelding van een filament spoel.
      Extracteer gegevens in JSON:
      - brand: Merknaam.
      - material: Materiaal type (PLA, PETG, etc).
      - colorName: Kleurnaam. Vertaal vreemde talen (Duits, Engels, etc) naar het Nederlands (bijv. 'Schwarz' of 'Black' -> 'Zwart', 'Rot' -> 'Rood', 'Gelb' -> 'Geel').
      - colorHex: Geschatte CSS Hex code.
      - tempNozzle: Nozzle temp (getal).
      - tempBed: Bed temp (getal).
      - notes: Leeg laten.
      Output alleen JSON.
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
      config: { responseMimeType: "application/json" }
    });

    if (!response.text) throw new Error("Leeg antwoord van AI");
    return JSON.parse(cleanJsonString(response.text));

  } catch (error: any) {
    console.error("Gemini Error:", error);
    const msg = error.message || JSON.stringify(error);
    
    // Check specifiek op de "leaked key" error van Google
    if (msg.includes('leaked') || msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
       throw new Error("⛔ API KEY GEBLOKKEERD\n\nGoogle heeft gedetecteerd dat je API sleutel openbaar is geworden en heeft deze geblokkeerd.\n\nOplossing:\n1. Maak direct een nieuwe sleutel aan in Google AI Studio.\n2. Update de 'API_KEY' in Vercel Environment Variables.");
    }

    if (msg.includes('API_KEY_INVALID') || msg.includes('400')) {
        throw new Error("Ongeldige API Key. Controleer in Vercel of de sleutel correct is en geen spaties bevat.");
    }
    
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("AI Limiet bereikt (Rate Limit). Probeer het over een minuutje nog eens.");
    }
    
    throw new Error("AI Analyse mislukt. Probeer de foto opnieuw te maken met betere belichting.");
  }
};

export const suggestSettings = async (brand: string, material: string): Promise<AiSuggestion> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Return JSON with avg tempNozzle and tempBed for ${brand} ${material} filament.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonString(response.text || "{}"));
  } catch (error) {
    return {}; 
  }
};