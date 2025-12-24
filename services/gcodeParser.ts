
/**
 * Parses the G-code file to extract print statistics.
 * Reads start and end of file to support different slicers (Cura puts stats at the end).
 */
export interface GCodeStats {
  estimatedTime: string; // e.g. "2h 15m"
  totalWeight: number; // Total grams
  materials: {
    type: string; // e.g. PLA
    weight: number; // grams for this specific slot/material
    color?: string; // hex if available in gcode
  }[];
}

// Helper to read file chunks
const readChunk = (file: File, start: number, end: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const blob = file.slice(start, end);
    reader.onload = (e) => resolve(e.target?.result as string || "");
    reader.onerror = () => reject(new Error("Leesfout"));
    reader.readAsText(blob);
  });
};

// Helper to split values by comma OR semicolon and clean them
const splitValues = (str: string): string[] => {
  if (!str) return [];
  const separator = str.includes(';') ? ';' : ',';
  return str.split(separator).map(s => s.trim().replace(/['"]/g, '')).filter(s => s !== '');
};

// Helper to format seconds into readable string "1h 20m"
const formatSeconds = (seconds: number): string => {
  if (isNaN(seconds)) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const parseGcodeFile = async (file: File): Promise<GCodeStats> => {
  if (file.name.toLowerCase().endsWith('.3mf')) {
     throw new Error("Een .3mf bestand is een project-bestand (ZIP) en kan niet direct gelezen worden. Slice het bestand en sla het op als '.gcode'.");
  }

  const CHUNK_SIZE = 1024 * 1024; 
  const fileSize = file.size;
  const headText = await readChunk(file, 0, Math.min(CHUNK_SIZE, fileSize));
  let tailText = "";
  if (fileSize > CHUNK_SIZE) {
    tailText = await readChunk(file, Math.max(0, fileSize - CHUNK_SIZE), fileSize);
  }

  const text = headText + "\n" + tailText;
  const stats: GCodeStats = { estimatedTime: "", totalWeight: 0, materials: [] };

  // 1. Weight Parsing
  const totalWeightMatch = text.match(/;\s*(?:total|model)\s+filament\s+used\s*(?:\[g\])?\s*[:=]\s*([\d\.,]+)/i);
  let explicitTotalWeight = 0;
  if (totalWeightMatch && totalWeightMatch[1]) {
      explicitTotalWeight = parseFloat(totalWeightMatch[1].replace(',', '.'));
  }

  const weightMatchG = text.match(/;\s*filament\s+used\s*\[g\]\s*=\s*(.*)/i);
  const lengthMatchCura = text.match(/Filament used:\s*([\d\.]+)m/i);
  const lengthMatchMm = text.match(/filament\s+used\s*\[mm\]\s*=\s*(.*)/i);

  let calculatedSumWeight = 0;
  let rawWeights: number[] = [];

  if (weightMatchG) {
    rawWeights = splitValues(weightMatchG[1]).map(w => parseFloat(w.replace(',', '.')));
    calculatedSumWeight = rawWeights.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
  } else if (lengthMatchMm) {
    rawWeights = splitValues(lengthMatchMm[1]).map(v => parseFloat(v.replace(',', '.')) * 0.00298);
    calculatedSumWeight = rawWeights.reduce((a, b) => a + b, 0);
  } else if (lengthMatchCura) {
    calculatedSumWeight = parseFloat(lengthMatchCura[1]) * 3.0;
    rawWeights = [calculatedSumWeight];
  }

  // 2. Material Types & Colors
  const typeMatch = text.match(/filament_type\s*[:=]\s*(.*)/i);
  const colorMatch = text.match(/filament_colou?r\s*[:=]\s*(.*)/i);
  
  const types = typeMatch ? splitValues(typeMatch[1]) : [];
  const colors = colorMatch ? splitValues(colorMatch[1]) : [];

  const materialCount = Math.max(rawWeights.length, types.length, colors.length, 1);

  for (let i = 0; i < materialCount; i++) {
    stats.materials.push({
      type: types[i] || 'PLA',
      weight: rawWeights[i] || (i === 0 ? explicitTotalWeight : 0),
      color: colors[i] ? (colors[i].startsWith('#') ? colors[i] : `#${colors[i]}`) : undefined
    });
  }

  // Handle Flush/Waste
  if (explicitTotalWeight > calculatedSumWeight + 0.5 && stats.materials.length > 1) {
    const waste = explicitTotalWeight - calculatedSumWeight;
    stats.materials.push({ type: 'Waste/Flush', weight: parseFloat(waste.toFixed(2)), color: '#777777' });
  }

  stats.totalWeight = Math.max(explicitTotalWeight, calculatedSumWeight);

  // 3. Time Parsing
  const timePatterns = [
    /estimated printing time.*=\s*(.*)/i,
    /total estimated time\s*=\s*(.*)/i,
    /Print time\s*:\s*(.*)/i,
    /print_time\s*=\s*(\d+)/i,
    /TIME:(\d+)/i
  ];

  for (const p of timePatterns) {
    const m = text.match(p);
    if (m && m[1]) {
      stats.estimatedTime = /^\d+$/.test(m[1]) ? formatSeconds(parseInt(m[1])) : m[1].trim();
      break;
    }
  }

  return stats;
};
