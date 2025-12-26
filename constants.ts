export const COMMON_BRANDS = [
  "Bambu Lab", "Polymaker", "eSun", "Sunlu", "Prusament", 
  "Creality", "Anycubic", "Elegoo", "Overture", "Hatchbox", 
  "ColorFabb", "Formfutura", "123-3D (Jupiter)", "Real Filament", 
  "Fiberlogy", "Elegoo", "Flashforge", "Devil Design",
  "Spectrum", "Extrudr", "Das Filament", "Fillamentum",
  "Eryone", "Geeetech", "Amazon Basics", "Innofil3D"
].sort();

export const COMMON_MATERIALS = [
  "PLA", "PLA+", "Silk PLA", "PLA-CF", "Matte PLA", "Tough PLA",
  "PETG", "PETG-CF", "PETG-HF", "ABS", "ASA", "TPU (95A)", "TPU (85A)",
  "Nylon (PA)", "PA-CF", "PC", "PC-CF", "PVA", "BVOH",
  "Wood", "Marble", "Glow-in-the-Dark", "HIPS"
];

export const BRAND_DOMAINS: Record<string, string> = {
  "Prusament": "prusa3d.com",
  "eSun": "esun3d.com",
  "Sunlu": "sunlu.com",
  "Bambu Lab": "bambulab.com",
  "Polymaker": "polymaker.com",
  "Eryone": "eryone.com",
  "Overture": "overture3d.com",
  "Hatchbox": "hatchbox3d.com",
  "Creality": "creality.com",
  "Anycubic": "anycubic.com",
  "Formfutura": "formfutura.com",
  "ColorFabb": "colorfabb.com",
  "123-3D (Jupiter)": "123-3d.nl",
  "Real Filament": "real-filament.com",
  "Elegoo": "elegoo.com",
  "Flashforge": "flashforge.com",
  "Amazon Basics": "amazon.com",
  "Geetech": "geeetech.com",
  "Innofil3D": "innofil3d.com",
  "Fiberlogy": "fiberlogy.com",
  "Das Filament": "dasfilament.de",
  "Extrudr": "extrudr.com",
  "Fillamentum": "fillamentum.com",
  "Spectrum": "spectrumfilaments.com",
  "Devil Design": "devildesign.com"
};

export const QUICK_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Grey", hex: "#808080" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Red", hex: "#FF0000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Green", hex: "#008000" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Purple", hex: "#800080" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Bronze", hex: "#CD7F32" },
  { name: "Brown", hex: "#8B4513" },
  { name: "Transparent", hex: "#F0F0F0" },
  { name: "Natural", hex: "#F5F5DC" },
  { name: "Galaxy Black", hex: "#111111" },
  { name: "Glow Green", hex: "#CCFFCC" }
];

export const ENGLISH_COLOR_MAP: Record<string, { name: string, hex: string }> = {
  "black": { name: "Black", hex: "#000000" },
  "white": { name: "White", hex: "#FFFFFF" },
  "grey": { name: "Grey", hex: "#808080" },
  "gray": { name: "Grey", hex: "#808080" },
  "silver": { name: "Silver", hex: "#C0C0C0" },
  "red": { name: "Red", hex: "#FF0000" },
  "blue": { name: "Blue", hex: "#0000FF" },
  "green": { name: "Green", hex: "#008000" },
  "yellow": { name: "Yellow", hex: "#FFFF00" },
  "orange": { name: "Orange", hex: "#FFA500" },
  "purple": { name: "Purple", hex: "#800080" },
  "pink": { name: "Pink", hex: "#FFC0CB" },
  "gold": { name: "Gold", hex: "#FFD700" },
  "golden": { name: "Gold", hex: "#FFD700" },
  "bronze": { name: "Bronze", hex: "#CD7F32" },
  "transparent": { name: "Transparent", hex: "#F0F0F0" },
  "clear": { name: "Transparent", hex: "#F0F0F0" },
  "natural": { name: "Natural", hex: "#F5F5DC" },
  "rainbow": { name: "Rainbow", hex: "#FF00FF" }
};

export const DISCORD_INVITE_URL = "https://discord.gg/3dVV7rVJ63";