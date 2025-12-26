import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // View Titles & Navigation
    dashboard: "Dashboard",
    inventory: "Inventory",
    history: "Print History",
    printers: "Printers",
    shopping: "Shopping List",
    settings: "Settings",
    notifications: "Notifications",
    admin: "Admin Dashboard",
    support: "Support Project",
    feedback: "Feedback",
    help: "Help & Contact",
    install: "Install App",
    'print-preview': "Print Preview",
    printPreview: "Print Preview",
    printHistory: "Print History",
    menu: "Menu",
    menuManagement: "Management",
    menuTools: "Tools",
    menuPremium: "Premium Features",
    madeBy: "Created by",
    userRatingText: "User Rating",
    back: "Back",
    version: "Version",
    close: "Close",
    
    // Dashboard
    allStockedMsg: "Everything is well stocked!",
    everythingOk: "No low stock alerts",
    totalValue: "Total Value",
    totalWeight: "Total Weight",
    totalSpools: "Spools",
    lowStock: "Low Stock",
    materialDistribution: "Material Distribution",
    lowestStock: "Lowest Stock",
    investmentBrand: "Investment per Brand",
    successRate: "Success Rate",
    noData: "No data available",
    winterEdition: "Winter Edition",
    winterEditionDesc: "Enable snow effects",

    // Filament & Material Common
    filament: "Filament",
    filaments: "Filaments",
    material: "Material",
    materials: "Other Materials",
    brand: "Brand",
    color: "Color",
    location: "Location",
    supplier: "Supplier",
    price: "Price",
    date: "Purchase Date",
    stock: "Stock",
    category: "Category",
    unit: "Unit",
    notes: "Notes",
    shopUrl: "Shop URL",
    quantity: "Quantity",
    name: "Name",
    status: "Status",
    action: "Action",
    unknown: "Unknown",
    none: "None",
    all: "All",
    items: "items",
    selected: "selected",
    lowStockLabel: "Low Stock",

    // Forms
    formEditTitle: "Edit Item",
    formNewTitle: "New Filament",
    addToInventory: "Add to Inventory",
    saveChanges: "Save Changes",
    selectBrand: "Select Brand",
    otherBrand: "Other / Custom...",
    otherMaterial: "Other / Custom...",
    colorNamePlaceholder: "Color name (e.g. Galaxy Black)",
    weightTotalLabel: "Starting Weight (g)",
    weightRemainingLabel: "Remaining Weight (g)",
    weighHelper: "Weigh Helper",
    grossWeight: "Gross Weight (Spool + Filament)",
    spoolType: "Select Spool Type",
    apply: "Apply",
    optional: "Optional",
    exampleLocation: "e.g. Shelf A",
    exampleSupplier: "e.g. Amazon",
    exampleWebsite: "e.g. amazon.com",

    // Print History & Logging
    logPrint: "Log a Print",
    recentActivity: "Recent Activity",
    noHistory: "No print history found.",
    confirmDelete: "Are you sure you want to delete this item?",
    projectName: "Project Name",
    projectNamePlaceholder: "What are you printing?",
    timeOptional: "Print Duration",
    exampleTime: "e.g. 2h 45m",
    success: "Success",
    failed: "Failed",
    overrideWeight: "Manual Weight Override",
    autoCalculated: "Auto-calculated from G-code",
    addSlot: "Add Filament Slot",
    multiColorWasteWarning: "Using multiple colors increases waste (flush/poop). Make sure to account for this in the weights.",
    slot: "Slot",
    amsMatch: "AMS Match",
    stockMatch: "Stock Match",
    netWeight: "Net Weight (Model)",
    wasteWeight: "Waste Weight (Flush)",
    otherMaterials: "Other Parts & Materials",
    manualEntry: "Manual Entry / Select File",
    saveUpdate: "Save & Update Stock",
    exportCsv: "Export CSV",
    netCost: "Net Production Cost",
    sellPrice: "Recommended Sell Price",
    totalCosts: "Total Costs",
    electricity: "Electricity",
    depreciation: "Machine Depreciation",
    labor: "Labor / Assembly",
    profitMarginLabel: "Profit Margin",
    rounding: "Psychological Rounding",
    noDetailedCost: "No detailed cost breakdown available.",
    usedMaterials: "Used Materials",
    unknownMaterial: "Unknown Material",
    details: "Details",
    weight: "Weight",
    duration: "Duration",
    assemblyTimeLabel: "Assembly Time",
    minutes: "minutes",
    analyzingGcode: "Analyzing G-code file...",
    dragDrop: "Drag and drop your G-code file or click here",
    selectMaterial: "Select Material",
    proComingSoonMsg: "Exporting to CSV is coming soon for PRO users.",
    delete: "Delete",
    edit: "Edit",
    add: "Add",

    // Print Preview & Tools
    dropGcode: "Drop your .gcode or .bgcode file here",
    selectPrinterFirst: "Select a printer first",
    printQuantity: "Print Quantity",
    checkStock: "Pre-print Stock Check",
    requiredFilament: "Required Material",
    totalRequired: "Total needed",
    inStock: "In Stock",
    insufficientStock: "Insufficient Stock",
    colorMismatch: "Color Difference",
    noMatchingSpool: "No matching material found in stock",
    readyToPrint: "Ready to Print",
    notReadyToPrint: "Action Required",
    checkAlertsBelow: "Check the warnings below before starting.",

    // Showcase
    showcaseTitle: "Public Showcase",
    showcaseSubtitle: "Share your available stock with others",
    showcaseName: "Public Shop Name",
    showcaseFilterLabel: "Filter Public View",
    showcaseEverything: "Everything",
    showcaseFilterDesc: "Only selected materials will be visible to the public.",
    showcaseLinkTitle: "Your Public Link",
    showcasePrivacyTitle: "Privacy First",
    showcasePrivacyDesc: "Prices, notes, and specific storage locations are NEVER shared publicy.",
    publicStock: "Available Stock",
    filtered: "Filtered",
    availableItems: "Items currently available",
    loginClose: "Login / Close",
    copyLink: "Copy Link",
    previewShowcase: "Preview Public View",

    // Support
    supportPageTitle: "Support the Project",
    supportPageSubtitle: "Help keep the Filament Manager ad-free and evolving.",
    donateButton: "Buy me a coffee",
    serverCosts: "Server Costs",
    serverCostsDesc: "Help cover the hosting and AI database fees.",
    development: "Active Development",
    developmentDesc: "New features and improvements every month.",
    adFree: "100% Ad-Free",
    adFreeDesc: "No distractions, just your tools.",
    thankYouNote: "Thank you for being part of this community!",
    supportTitle: "Support Project",

    // Settings
    tabGeneral: "General",
    tabNotifications: "Alerts",
    tabManagement: "Database",
    tabAccount: "Account",
    tabPro: "PRO Tools",
    tabData: "Data & Backup",
    appearance: "Appearance",
    aboutApp: "About App",
    privacyPolicy: "Privacy Policy",
    logout: "Log Out",
    backupCreate: "Create Backup",
    backupRestore: "Restore Backup",
    confirmBackup: "This will overwrite your local data. Are you sure?",
    dangerZone: "Danger Zone",
    deleteAccount: "Delete Account",
    deleteAccountDesc: "Permanently delete your account and all associated data.",
    requestSent: "Deletion request sent. Your data will be deleted within 48 hours.",
    requestCancelled: "Deletion request cancelled.",
    cancelDeletion: "Cancel Request",
    confirmCancelDeletion: "Are you sure you want to cancel the deletion request?",
    proTools: "Production Calculator",
    proToolsDesc: "Configure rates for electricity, machine time, and labor for automated cost calculation.",
    electricityRate: "Electricity Rate (€/kWh)",
    hourlyRate: "Markup / Hourly Rate (€)",
    profitMargin: "Default Profit Margin (%)",
    roundToNine: "Round to .x9",
    exampleElectricityRate: "e.g. 0.35",
    exampleHourlyRate: "e.g. 2.50",
    proFeatureLocked: "PRO Feature",
    upgradeToUnlock: "Upgrade to unlock advanced tools",
    becomePro: "Get PRO Membership",
    lowStockWarning: "Low Stock Alert Threshold",
    unusedWarning: "Unused Filament Warning",
    days: "days",
    enableUpdateNotifications: "Notify me of app updates",

    // Notifications
    notificationsSubtitle: "Updates and system alerts",
    noNotifications: "No new notifications",
    allCaughtUp: "You're all caught up!",
    newUpdate: "New Update!",
    versionActive: "Version %v is now live",
    whatsNew: "What's new?",
    installed: "Updated",
    autoUpdateMsg: "Updates are applied automatically on start.",
    publishedOn: "Published on",
    security: "Secure",
    securityDesc: "Your data is encrypted and stored safely.",
    speed: "Performance",
    speedDesc: "Optimized for mobile and desktop use.",

    // AI & Search
    aiAdd: "AI Scan & Add",
    aiScanLabel: "AI Label Scanner",
    aiAnalyzing: "Analyzing Label...",
    aiAnalyzingDesc: "Please wait, Gemini AI is reading the data.",
    aiError: "AI failed to read the label.",
    lookupNotFound: "Could not identify this spool.",
    scanTitle: "Scan Label",
    search: "Search",
    searchPlaceholder: "Search brand, color, material...",
    searchMaterial: "Search parts or category...",
    filter: "Filter",
    
    // Inventory Common
    newFilament: "New Filament",
    newMaterial: "New Material",
    noFilaments: "No filaments found in stock.",
    noMaterials: "No other materials found.",
    printLabel: "Print Smart Label",
    order: "Order More",
    searchGoogle: "Search on Google",
    viewSpools: "View individual spools",
    allStocked: "All Stocked!",
    allStockedDesc: "You don't need to order anything right now.",
    sortNameAsc: "Name (A-Z)",
    sortNameDesc: "Name (Z-A)",
    sortWeightAsc: "Weight (Low-High)",
    sortWeightDesc: "Weight (High-Low)",
    sortDateNew: "Purchase Date (Newest)",
    sortDateOld: "Purchase Date (Oldest)",

    // Management
    locationManager: "Storage Locations",
    supplierManager: "Suppliers",
    addLocation: "Add Location",
    addSupplier: "Add Supplier",
    noLocations: "No locations defined yet.",
    noSuppliers: "No suppliers defined yet.",
    save: "Save",
    cancel: "Cancel",

    // Printer Manager
    addPrinter: "Add Printer",
    editPrinter: "Edit Printer",
    printerName: "Printer Name",
    printerNamePlaceholder: "e.g. Voron 2.4",
    printerModel: "Model",
    selectModel: "Select Model",
    activeFilament: "Active Spool",
    hasAMS: "Equipped with CFS/AMS (Multi-material)",
    printerSpecs: "Production Costs (PRO)",
    printerPower: "Avg. Power (Watts)",
    printerCost: "Purchase Price (€)",
    printerLifespan: "Est. Lifespan (Hours)",
    selectPrinter: "Select a printer...",
    amsUnits: "Number of Units",
    amsUnitsDesc: "4 slots per unit",

    // Pro Features (ProModal)
    upgradeProTitle: "Go PRO",
    proToolkitSubtitle: "The complete toolkit for serious makers",
    proComingSoonHeader: "Under Development",
    proComingSoonDesc: "These features are being rolled out gradually to PRO members.",
    featureUnlimitedTitle: "Unlimited Inventory",
    featureUnlimitedDesc: "Remove all limits on filaments and materials.",
    featureCalcTitle: "Advanced Cost Calculator",
    featureCalcDesc: "Automated sell price generation based on power and labor.",
    featureMaterialsTitle: "Material Inventory",
    featureMaterialsDesc: "Track bolts, nuts, and other non-filament parts.",
    featureShowcaseTitle: "Public Showcase",
    featureShowcaseDesc: "Share a direct link to your available stock.",
    featureExportTitle: "CSV & Data Export",
    featureExportDesc: "Export your print history and stock for external tracking.",
    proKeepInformed: "Keep me informed",

    // Help & Contact
    suggestions: "Suggestions",
    contact: "Contact",
    suggestionDesc: "Have a great idea for the app? Let us know!",
    suggestionPlaceholder: "Describe your idea here...",
    contactDesc: "Questions or technical issues? Send us a message.",
    contactMessagePlaceholder: "How can we help you?",
    emailSent: "Message sent! We'll get back to you soon.",
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
  const [language] = useState<Language>('en');

  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  const t = (key: string): string => {
    if (!key) return '';
    return translations[language][key] || key;
  };

  const tColor = (color: string): string => {
    return color; 
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
