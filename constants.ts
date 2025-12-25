
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
  { name: "Zwart", hex: "#000000" },
  { name: "Wit", hex: "#FFFFFF" },
  { name: "Grijs", hex: "#808080" },
  { name: "Zilver", hex: "#C0C0C0" },
  { name: "Rood", hex: "#FF0000" },
  { name: "Blauw", hex: "#0000FF" },
  { name: "Groen", hex: "#008000" },
  { name: "Geel", hex: "#FFFF00" },
  { name: "Oranje", hex: "#FFA500" },
  { name: "Paars", hex: "#800080" },
  { name: "Roze", hex: "#FFC0CB" },
  { name: "Goud", hex: "#FFD700" },
  { name: "Brons", hex: "#CD7F32" },
  { name: "Bruin", hex: "#8B4513" },
  { name: "Transparant", hex: "#F0F0F0" },
  { name: "Naturel", hex: "#F5F5DC" },
  { name: "Galaxy Zwart", hex: "#111111" },
  { name: "Glow Green", hex: "#CCFFCC" }
];

export const ENGLISH_COLOR_MAP: Record<string, { name: string, hex: string }> = {
  "black": { name: "Zwart", hex: "#000000" },
  "white": { name: "Wit", hex: "#FFFFFF" },
  "grey": { name: "Grijs", hex: "#808080" },
  "gray": { name: "Grijs", hex: "#808080" },
  "silver": { name: "Zilver", hex: "#C0C0C0" },
  "red": { name: "Rood", hex: "#FF0000" },
  "blue": { name: "Blauw", hex: "#0000FF" },
  "green": { name: "Groen", hex: "#008000" },
  "yellow": { name: "Geel", hex: "#FFFF00" },
  "orange": { name: "Oranje", hex: "#FFA500" },
  "purple": { name: "Paars", hex: "#800080" },
  "pink": { name: "Roze", hex: "#FFC0CB" },
  "gold": { name: "Goud", hex: "#FFD700" },
  "golden": { name: "Goud", hex: "#FFD700" },
  "bronze": { name: "Brons", hex: "#CD7F32" },
  "transparent": { name: "Transparant", hex: "#F0F0F0" },
  "clear": { name: "Transparant", hex: "#F0F0F0" },
  "natural": { name: "Naturel", hex: "#F5F5DC" },
  "rainbow": { name: "Rainbow", hex: "#FF00FF" }
};

export const DISCORD_INVITE_URL = "https://discord.gg/3dVV7rVJ63";
