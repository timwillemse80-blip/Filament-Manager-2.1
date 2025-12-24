
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Menu & Tabs
    dashboard: "Dashboard",
    inventory: "Inventory",
    printHistory: "Print History",
    printers: "Printers",
    shopping: "Shopping List",
    printPreview: "Print Preview",
    showcaseTitle: "Showcase",
    supportTitle: "Support Project",
    settings: "Settings",
    admin: "Admin Panel",
    menu: "Menu",
    menuManagement: "Management",
    menuTools: "Tools",
    menuPremium: "Premium",
    becomePro: "Become PRO",
    userRatingText: "Users rate us with a",
    madeBy: "Made by",
    notifications: "Notifications",

    // Forms
    formNewTitle: "New Filament",
    formEditTitle: "Edit Filament",
    scanTitle: "AI Scanner",
    lookupMode: "Scan Label",
    analyzingFilament: "Analyzing...",
    brand: "Brand",
    selectBrand: "Select Brand",
    material: "Material",
    color: "Color",
    weightRemainingLabel: "Current Weight",
    tempNozzle: "Nozzle Temp (°C)",
    addToInventory: "Add to Inventory",
    saveChanges: "Save Changes",
    price: "Price",
    weightTotal: "Total Weight",
    location: "Location",
    supplier: "Supplier",
    notes: "Notes",

    // Print Preview
    dropGcode: "Drop G-code here or click to upload",
    autoCalculatedDesc: "Inventory and AMS slots are automatically checked.",
    configuration: "Configuration",
    printQuantity: "Print Quantity",
    waitingForPrinter: "Waiting for Printer",
    waitingForPrinterDesc: "Select a printer to check AMS slots.",
    readyToPrint: "Ready to Print",
    notReadyToPrint: "Not Ready",
    checkAlertsBelow: "Check the alerts below.",
    checkStock: "Stock Check",
    totalRequired: "Total Required",
    noMatchingSpool: "No matching spool found",
    inStock: "In Stock",
    insufficientStock: "Insufficient Stock",
    proposedSlot: "Proposed Slot",
    slot: "Slot",
    loadFromStock: "Load from stock",
    notInAms: "This color is not in the AMS",
    selectPrinterFirst: "Select a printer first...",
    perfectMatch: "Perfect Match",

    // Settings Sections
    tabGeneral: "General",
    tabNotifications: "Notifications",
    tabManagement: "Management",
    tabAccount: "Account",
    tabPro: "PRO",
    appearance: "Appearance",
    winterEdition: "Winter Edition",
    winterEditionDesc: "Snowflakes on the dashboard",
    language: "Language",
    aboutApp: "About the App",
    help: "Help & Support",
    privacyPolicy: "Privacy Policy",
    donateButton: "Buy me a coffee",
    lowStockWarning: "Low Stock Warning",
    unusedWarning: "Unused Warning",
    days: "days",
    enableUpdateNotifications: "Receive notifications about new versions",
    logout: "Logout",
    tabData: "Data Management",
    backupCreate: "Create Backup",
    backupRestore: "Restore Backup",
    dangerZone: "Danger Zone",
    deleteAccount: "Delete Account",
    deleteAccountDesc: "Permanently remove all your data from our database.",
    cancelDeletion: "Cancel Deletion",
    requestSent: "Request submitted",
    requestCancelled: "Request cancelled",
    confirmCancelDeletion: "Are you sure you want to withdraw the deletion request?",
    proTools: "PRO Calculator Tools",
    proToolsDesc: "Set your rates for automatic cost calculation here.",
    electricityRate: "Electricity Price ($/kWh)",
    hourlyRate: "Hourly Rate / Labor ($/h)",
    profitMargin: "Profit Margin (%)",
    roundToNine: "Round prices to .x9",
    proFeatureLocked: "PRO Feature Locked",
    upgradeToUnlock: "Upgrade to PRO to use this",
    locationManager: "Location Manager",
    addLocation: "Add Location",
    supplierManager: "Supplier Manager",
    addSupplier: "Add Supplier",
    confirmBackup: "Are you sure you want to import a backup? Your current data will be overwritten.",

    // Common Actions
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    back: "Back",
    name: "Name",
    description: "Description",
    website: "Website",
    none: "None",

    // Colors
    zwart: "Black", wit: "White", grijs: "Grey", zilver: "Silver", rood: "Red", blauw: "Blue", 
    groen: "Green", geel: "Yellow", oranje: "Orange", paars: "Purple", roze: "Pink", goud: "Gold", 
    brons: "Bronze", transparant: "Transparent", naturel: "Natural", "glow in the dark": "Glow in the Dark", regenboog: "Rainbow"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tColor: (color: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language: Language = 'en';

  const t = (key: string): string => {
    if (!key) return '';
    return translations[language][key] || key;
  };

  const tColor = (color: string): string => {
    if (!color) return '';
    const lowerColor = color.toLowerCase();
    return translations[language][lowerColor] || color;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: () => {}, t, tColor }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
