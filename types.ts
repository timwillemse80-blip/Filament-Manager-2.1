
export enum FilamentMaterial {
  PLA = 'PLA',
  PETG = 'PETG',
  ABS = 'ABS',
  TPU = 'TPU',
  ASA = 'ASA',
  NYLON = 'Nylon',
  PC = 'PC',
  HIPS = 'HIPS',
  PVA = 'PVA',
  WOOD = 'Wood',
  SILK = 'Silk PLA',
  CARBON = 'Carbon Fiber'
}

export interface Filament {
  id: string;
  shortId?: string;    // New: 4-char Short ID for labels (e.g., "A1B2")
  brand: string;
  material: string;
  colorName: string;
  colorHex: string;
  weightTotal: number; // in grams
  weightRemaining: number; // in grams
  tempNozzle: number; // °C
  tempBed: number; // °C
  price?: number;      // Price per spool
  notes?: string;
  purchaseDate: string;
  locationId?: string | null; // Allow null for DB compatibility
  supplierId?: string | null; // Allow null for DB compatibility
  shopUrl?: string;
  isOrdered?: boolean; // New: tracking if item is ordered
}

export interface OtherMaterial {
  id: string;
  name: string;
  category: string; // e.g. "Electronica", "Boutjes", "Lijm"
  quantity: number;
  unit: 'stuks' | 'meter' | 'liter' | 'gram' | 'set';
  minStock?: number; // Alert threshold
  locationId?: string | null;
  supplierId?: string | null;
  price?: number; // Price per unit
  shopUrl?: string;
  notes?: string;
  purchaseDate: string;
  image?: string; // Base64 image string
  isOrdered?: boolean; // New: tracking if item is ordered
}

export interface Location {
  id: string;
  name: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  website?: string;
}

export interface Printer {
  id: string;
  name: string;
  brand: string; // e.g. "Bambu Lab"
  model: string; // e.g. "X1 Carbon"
  hasAMS: boolean;
  amsCount?: number; // 1 to 4
  amsSlots: {
    slotNumber: number;
    filamentId: string | null; // null if empty
  }[];
  
  // PRO Cost Calc Data (Specific to this printer)
  powerWatts?: number; // Average power usage
  purchasePrice?: number; // Machine cost
  lifespanHours?: number; // Expected lifespan
  
  // Klipper Integration (Admin Only Feature)
  ipAddress?: string; 
  apiKey?: string; // Moonraker API Key
  webcamUrl?: string; // MJPEG Stream URL
}

export interface AppSettings {
  lowStockThreshold: number; // Percentage (e.g., 20)
  theme: 'light' | 'dark';
  unusedWarningDays: number; // Days (e.g. 90)
  enableWeeklyEmail: boolean;
  enableUpdateNotifications: boolean; // New: Toggle for update alerts
  
  // PRO / Calculator Settings
  electricityRate?: number; // € per kWh (Global)
  hourlyRate?: number; // € per hour (markup) (Global)
  profitMargin?: number; // % Profit Margin
  roundToNine?: boolean; // Round sell price up to nearest .x9
  
  // Showcase Settings
  showcaseEnabled?: boolean;
  showcasePublicName?: string; // e.g. "Tim's 3D Shop"
}

export interface AiSuggestion {
  brand?: string;
  material?: string;
  colorName?: string;
  colorHex?: string;
  tempNozzle?: number;
  tempBed?: number;
  // Added shortId to match data returned by analyzeSpoolImage in geminiService.ts
  shortId?: string;
}

export interface CostBreakdown {
  filamentCost: number;
  electricityCost: number;
  depreciationCost: number;
  laborCost: number;
  materialCost?: number; // Cost of extra materials
}

export interface PrintJob {
  id: string;
  name: string;
  date: string;
  printTime?: string; // e.g. "2h 45m"
  totalWeight: number; // in grams
  calculatedCost: number; // in euros
  status: 'success' | 'fail';
  printerId?: string; // Which printer was used
  assemblyTime?: number; // Minutes spent on manual work
  costBreakdown?: CostBreakdown; // Detailed cost analysis
  // List of filaments used in this print (for multi-color)
  usedFilaments: {
    filamentId: string;
    amount: number; // grams used for this specific filament
    colorHex: string; // snapshot of color for UI
  }[];
  usedOtherMaterials?: {
    materialId: string;
    quantity: number;
  }[];
}

export type ViewState = 'dashboard' | 'inventory' | 'locations' | 'suppliers' | 'printers' | 'shopping' | 'settings' | 'history' | 'support' | 'admin' | 'feedback' | 'install' | 'help' | 'notifications' | 'print-preview';
