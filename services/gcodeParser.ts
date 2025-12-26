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

const readChunk = (file: File, start: number, end: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const blob = file.slice(start, end);
    reader.onload = (e) => resolve(e.target?.result as string || "");
    reader.onerror = () => reject(new Error("Read error"));
    reader.readAsText(blob);
  });
};

const splitValues = (str: string): string[] => {
  if (!str) return [];
  const separator = str.includes(';') ? ';' : ',';
  return str.split(separator).map(s => s.trim().replace(/['"]/g, '')).filter(s => s !== '');
};

const formatSeconds = (seconds: number): string => {
  if (isNaN(seconds)) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const parseGcodeFile = async (file: File): Promise<GCodeStats> => {
  if (file.name.toLowerCase().endsWith('.3mf')) {
     throw new Error("A .3mf file is a project file (ZIP) and cannot be read directly. Slice the file and save it as '.gcode' or '.gcode.3mf' (as plain text).");
  }

  const CHUNK_SIZE = 1024 * 1024; 
  const fileSize = file.size;
  
  const headText = await readChunk(file, 0, Math.min(CHUNK_SIZE, fileSize));
  
  let tailText = "";
  if (fileSize > CHUNK_SIZE) {
    tailText = await readChunk(file, Math.max(0, fileSize - CHUNK_SIZE), fileSize);
  }

  const text = headText + "\n" + tailText;
  
  const stats: GCodeStats = {
    estimatedTime: "",
    totalWeight: 0,
    materials: []
  };

  const totalWeightMatch = text.match(/;\s*(?:total|model)\s+filament\s+used\s*(?:\[g\])?\s*[:=]\s*([\d\.,]+)/i);
  let explicitTotalWeight = 0;
  if (totalWeightMatch && totalWeightMatch[1]) {
      explicitTotalWeight = parseFloat(totalWeightMatch[1].replace(',', '.'));
  }

  const weightMatchG = text.match(/;\s*filament\s+used\s*\[g\]\s*=\s*(.*)/i);
  const lengthMatchCura = text.match(/Filament used:\s*([\d\.]+)m/i);
  const lengthMatchMm = text.match(/filament\s+used\s*\[mm\]\s*=\s*(.*)/i);
  const volMatchCm3 = text.match(/filament\s+used\s*\[cm3\]\s*=\s*(.*)/i);

  let calculatedSumWeight = 0;

  if (weightMatchG) {
    const valString = weightMatchG[1];
    if (!valString.toLowerCase().includes('total')) {
        const weights = splitValues(valString).map(w => parseFloat(w.replace(',', '.')));
        calculatedSumWeight = weights.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
        weights.forEach(w => {
            stats.materials.push({ type: 'Unknown', weight: isNaN(w) ? 0 : w });
        });
    }
  } else if (volMatchCm3) {
    const vols = splitValues(volMatchCm3[1]).map(v => parseFloat(v.replace(',', '.')));
    const weights = vols.map(v => v * 1.24);
    calculatedSumWeight = weights.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
    weights.forEach(w => {
        stats.materials.push({ type: 'Unknown', weight: parseFloat(w.toFixed(2)) });
    });
  } else if (lengthMatchMm) {
    const mms = splitValues(lengthMatchMm[1]).map(v => parseFloat(v.replace(',', '.')));
    const weights = mms.map(mm => mm * 0.00298);
    calculatedSumWeight = weights.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
     weights.forEach(w => {
        stats.materials.push({ type: 'Unknown', weight: parseFloat(w.toFixed(2)) });
    });
  } else if (lengthMatchCura) {
    const meters = parseFloat(lengthMatchCura[1]);
    const estimatedGrams = meters * 3.0; 
    calculatedSumWeight = estimatedGrams;
    stats.materials.push({ type: 'Unknown', weight: estimatedGrams });
  }

  if (explicitTotalWeight > calculatedSumWeight + 0.1) { 
      const wasteWeight = explicitTotalWeight - calculatedSumWeight;
      
      if (stats.materials.length === 1) {
          stats.materials[0].weight = explicitTotalWeight;
      } else {
          stats.materials.push({
              type: 'Flush / Tower / Extra',
              weight: parseFloat(wasteWeight.toFixed(2)),
              color: '#777777' 
          });
      }
      stats.totalWeight = explicitTotalWeight;
  } else {
      stats.totalWeight = Math.max(explicitTotalWeight, calculatedSumWeight);
  }

  const typeMatch = text.match(/filament_type\s*=\s*(.*)/i);
  if (typeMatch) {
    const types = splitValues(typeMatch[1]);
    types.forEach((t, index) => {
        if (stats.materials[index]) {
            stats.materials[index].type = t;
        } else if (stats.materials.length === 0 && index === 0 && calculatedSumWeight === 0) {
            stats.materials.push({ type: t, weight: explicitTotalWeight });
        }
    });
  }

  const colorMatch = text.match(/filament_colour\s*=\s*(.*)/i);
  if (colorMatch) {
     const colors = splitValues(colorMatch[1]);
     colors.forEach((c, index) => {
        if (stats.materials[index]) {
            stats.materials[index].color = c;
        }
     });
  }

  const patterns = [
      /estimated printing time\s*(?:\([^\)]+\))?\s*=\s*(.*)/i, 
      /model printing time\s*=\s*(.*)/i,
      /total estimated time\s*=\s*(.*)/i,
      /Build time\s*:\s*(.*)/i,
      /Print time\s*:\s*(.*)/i,
      /print_time\s*=\s*(\d+)s?/i,
      /estimated_seconds\s*=\s*(\d+)/i,
      /\;?\s*TIME\s*:\s*([\d\.]+)/i
  ];

  let foundTime = "";
  
  for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
          let val = match[1].trim();
          if (/^[\d\.]+s?$/.test(val)) {
              val = val.replace('s', '');
              foundTime = formatSeconds(parseFloat(val));
          } else {
              val = val.replace(/(\d+)s\s*$/, '$1s').trim(); 
              if (val) foundTime = val;
          }
          if (foundTime) break;
      }
  }

  stats.estimatedTime = foundTime;

  if (stats.materials.length === 0 && stats.totalWeight > 0) {
      stats.materials.push({ type: 'PLA', weight: stats.totalWeight });
  }

  if (stats.totalWeight === 0) {
      throw new Error("Could not find filament weight in the G-code file.");
  } else {
      return stats;
  }
};