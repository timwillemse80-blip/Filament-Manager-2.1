
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // AI Alert
    aiCameraUnavailable: "AI camera temporarily unavailable",
    aiCameraUnavailableDesc: "We are working hard to improve AI features. This feature will be fully available again in a future update!",
    aiScanLabel: "Scan Label with AI",
    aiAnalyzing: "AI is analyzing the label...",
    aiSuccess: "Label analyzed successfully!",
    aiError: "AI could not recognize the label. Please enter data manually.",
    aiMaintenanceTitle: "AI Feature Maintenance",
    aiMaintenanceDesc: "The AI camera feature is currently undergoing scheduled maintenance to improve accuracy and speed. We'll be back online shortly!",
    aiMaintenanceButton: "Got it, thanks!",
    
    // PRO Modal & Features
    upgradeProTitle: "Upgrade to PRO",
    proToolkitSubtitle: "The ultimate toolkit for the serious maker",
    proComingSoonHeader: "Coming Soon",
    proComingSoonDesc: "We are currently hard at work fully developing these features. Become a PRO supporter now and get instant access as soon as they go live!",
    proKeepInformed: "Keep me informed",
    featureUnlimitedTitle: "Unlimited Inventory",
    featureUnlimitedDesc: "Remove the 50 spool limit and add unlimited printers.",
    featureCalcTitle: "Advanced Calculator",
    featureCalcDesc: "Calculate exact costs including electricity, labor, and depreciation.",
    featureMaterialsTitle: "Materials Management",
    featureMaterialsDesc: "Track your bolts, nuts, glue, and electronics stock as well.",
    featureShowcaseTitle: "Public Showcase",
    featureShowcaseDesc: "Share your available colors and materials with customers or friends.",
    featureExportTitle: "Data Export",
    featureExportDesc: "Export your full print history to CSV for Excel.",

    // Menu & Tabs
    inventory: "Inventory",
    filaments: "Filaments",
    materials: "Materials",
    locations: "Locations",
    suppliers: "Suppliers",
    printers: "Printers",
    shopping: "Shopping List",
    settings: "Settings",
    logout: "Logout",
    menu: "Menu",
    menuManagement: "Management",
    menuTools: "Tools",
    menuPremium: "Premium",
    loggedInAs: "Logged in as",
    madeBy: "Made by",
    feedback: "Feedback",
    printHistory: "Logbook",
    dashboard: "Dashboard",
    supportTitle: "Support Project",
    admin: "Admin Dashboard",
    becomePro: "Upgrade to PRO",
    help: "Help & Contact",
    userRatingText: "Users rate us with a",
    showcaseTitle: "Showcase",
    spools: "Spools & Weights",
    requests: "Requests",
    notifications: "Notifications",
    labels: "Print Labels",
    printPreview: "Print Preview",
    
    // Global / Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    back: "Back",
    next: "Next",
    finish: "Finish",
    loading: "Loading...",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    actions: "Actions",
    name: "Name",
    description: "Description",
    optional: "Optional",
    website: "Website",
    date: "Date",
    status: "Status",
    success: "Success",
    failed: "Failed",
    unknown: "Unknown",
    all: "All",
    none: "None",
    selected: "selected",
    send: "Send",
    markAsRead: "Mark as read",
    markAsUnread: "Mark as unread",
    add: "Add",
    filtered: "Filtered",
    stock: "Stock",
    minutes: "minutes",
    slot: "Slot",
    confirmDelete: "Are you sure you want to delete this?",
    lastLogin: "Last Login",
    totalFilament: "Total Filament",
    
    // Feedback Page Specific
    feedbackTitle: "Your opinion matters!",
    feedbackSubtitle: "Help us improve the app by sharing your experience.",
    feedbackPlaceholder: "Write your comment, compliment or suggestion here...",
    feedbackSend: "Send Feedback",
    feedbackSent: "Thank you! Your feedback has been sent.",
    rating: "Rating",

    // Help & Contact Specific
    suggestions: "Suggestions",
    contact: "Contact",
    suggestionDesc: "Got a great idea for a new feature? Let us know!",
    suggestionPlaceholder: "Describe your idea as extensively as possible...",
    contactDesc: "Have a question or running into an issue? Send us a message directly.",
    contactMessagePlaceholder: "Type your question or message here...",
    emailSent: "Your message has been prepared in your email app.",

    // Inventory & Form
    searchPlaceholder: "Search brand, color, material or ID...",
    newFilament: "New Filament",
    formNewTitle: "New Filament",
    formEditTitle: "Edit Filament",
    newMaterial: "New Material",
    allStocked: "Everything is in stock!",
    allStockedDesc: "No items are currently below minimum stock.",
    noFilaments: "No filaments found.",
    noMaterials: "No materials found.",
    weightRemaining: "Remaining",
    viewSpools: "View spools",
    order: "Order",
    searchGoogle: "Search on Google",
    totalWeight: "Total Weight",
    items: "items",
    lowStock: "Low Stock",
    totalValue: "Total Value",
    totalCosts: "Total Costs",
    totalSpools: "Total Spools",
    successRate: "Success Rate",
    materialDistribution: "Material Distribution",
    lowestStock: "Lowest Stock",
    investmentBrand: "Investment per Brand",
    noData: "No data available",
    winterEdition: "Winter Edition",
    proFeatureLocked: "PRO Feature",
    upgradeToUnlock: "Upgrade to unlock",
    printLabel: "Print Label",
    scanLabel: "Scan Label",
    scanInstruction: "Scan the QR code or the label on the spool",
    scanTitle: "Smart Scanner",
    scanDesc: "Scan a spool to find it or add it immediately.",
    lookupMode: "Scan Label",
    lookupFound: "Spool found!",
    lookupNotFound: "No spool found with this ID.",
    
    // Print Preview
    dropGcode: "Drop your G-code here or click to load",
    checkStock: "Stock Check",
    requiredFilament: "Required Filament",
    inStock: "In Stock",
    insufficientStock: "Insufficient Stock",
    inAms: "In CFS/AMS",
    notInAms: "Not in CFS/AMS",
    readyToPrint: "Ready to print!",
    notReadyToPrint: "Not ready to print",
    checkAlertsBelow: "Check the red alerts below.",
    printQuantity: "Print Quantity",
    totalRequired: "Total required",
    selectPrinterFirst: "Select a printer first...",
    noMatchingSpool: "No match found",
    multipleMatches: "Multiple matches",
    configuration: "Configuration",
    waitingForPrinter: "Waiting for printer...",
    waitingForPrinterDesc: "Select a printer to complete stock and AMS check.",
    proposedSlot: "Proposed Slot",
    loadFromStock: "Load from stock",
    perfectMatch: "Perfect match",
    colorMismatch: "Color mismatch",

    // Showcase
    showcaseSubtitle: "Share your stock with others",
    showcaseName: "Your Public Name",
    previewShowcase: "View Preview",
    publicStock: "Public Stock",
    availableItems: "Available items",
    loginClose: "Login / Close",
    showcaseFilterLabel: "Which filament to show?",
    showcaseEverything: "Show Everything",
    showcaseFilterDesc: "Select materials to filter the link. Nothing selected = Everything visible.",
    showcaseLinkTitle: "Your Unique Link",
    showcasePrivacyTitle: "Privacy Info",
    showcasePrivacyDesc: "Visitors only see brand, material, color and availability. Prices, locations and notes stay private.",
    copyLink: "Copy Link",

    // Notifications Page
    notificationsSubtitle: "Stay updated on new features and updates.",
    noNotifications: "No new notifications",
    allCaughtUp: "You're all caught up!",
    newUpdate: "New Update!",
    versionActive: "Version %v is now active",
    installed: "Installed",
    whatsNew: "What's new",
    autoUpdateMsg: "The app was automatically updated to the latest version.",
    publishedOn: "Published on",
    security: "Security",
    securityDesc: "Updates often contain important security improvements.",
    speed: "Speed",
    speedDesc: "We constantly optimize the app for a faster experience.",

    // Logbook
    recentActivity: "Recent Activity",
    exportCsv: "Export CSV",
    logPrint: "Log Print",
    dragDrop: "Drop your G-code here or click to upload",
    noHistory: "No print history found yet.",
    netCost: "Net Cost",
    sellPrice: "Sell Price",
    projectName: "Project Name",
    projectNamePlaceholder: "e.g. Baby Yoda",
    timeOptional: "Time (Optional)",
    exampleTime: "e.g. 2h 45m",
    usedMaterials: "Used Filaments",
    addSlot: "Add Slot",
    manualEntry: "Or enter data manually",
    saveUpdate: "Save & Update Stock",
    analyzing: "Analyzing...",
    analyzingGcode: "Analyzing G-code...",
    analyzingFilament: "Analyzing Filament...",
    overrideWeight: "Override Total Weight",
    autoCalculated: "Calculated automatically",
    details: "Details",
    weight: "Weight",
    duration: "Duration",
    assemblyTimeLabel: "Assembly Time",
    otherMaterials: "Other Materials",
    noExtraMaterials: "No extra materials added.",
    searchMaterial: "Search material...",
    electricity: "Electricity",
    depreciation: "Depreciation",
    labor: "Labor/Markup",
    profitMarginLabel: "Profit Margin",
    rounding: "Rounding",
    noDetailedCost: "No detailed costs available for this print.",
    unknownMaterial: "Unknown material",
    wasteWeight: "Poop / Tower (g)",
    netWeight: "Model (g)",
    multiColorWasteWarning: "Note: G-code files often lack exact waste/flush data per color. Please check and adjust the 'Poop / Tower' values below manually.",
    amsMatch: "CFS/AMS Match",
    stockMatch: "Stock Match",

    // Settings
    tabGeneral: "General",
    tabNotifications: "Notifications",
    tabData: "Data & Backup",
    tabAccount: "Account",
    tabPro: "Pro Tools",
    tabManagement: "Management",
    appearance: "Appearance",
    darkMode: "Dark",
    lightMode: "Light",
    language: "Language",
    lowStockThreshold: "Low Stock Warning",
    unusedWarning: "Long time unused",
    days: "days",
    backupCreate: "Create Backup",
    backupRestore: "Restore Backup",
    dangerZone: "Danger Zone",
    deleteAccount: "Delete Account",
    deleteAccountDesc: "This permanently deletes all your data. This cannot be undone.",
    cancelDeletion: "Cancel Request",
    requestSent: "Request sent. Your data will be deleted within 48 hours.",
    requestCancelled: "Deletion request cancelled.",
    proTools: "Pro Tools",
    proToolsDesc: "Enter your costs here to automatically calculate the selling price of your prints.",
    electricityRate: "Electricity Rate (€/kWh)",
    hourlyRate: "Hourly Rate (€/hour)",
    profitMargin: "Profit Margin (%)",
    roundToNine: "Round to .x9",
    exampleElectricityRate: "e.g. 0.35",
    exampleHourlyRate: "e.g. 2.00",
    roundingLabel: "Rounding",
    privacyPolicy: "Privacy Policy",
    donateButton: "Support Project",
    stayLoggedIn: "Stay logged in",
    locationManager: "Location Management",
    addLocation: "Add Location",
    exampleLocation: "e.g. Workshop",
    noLocations: "No locations found.",
    supplierManager: "Supplier Management",
    addSupplier: "Add Supplier",
    exampleSupplier: "e.g. Amazon",
    exampleWebsite: "e.g. www.amazon.com",
    noSuppliers: "No suppliers found.",
    winterEditionDesc: "Let it snow in the app!",
    aboutApp: "About the app",
    proComingSoonMsg: "This feature will be available soon for PRO members.",
    
    // Support Page
    supportPageTitle: "Support this project",
    supportPageSubtitle: "Help keep the servers online and improve the app.",
    serverCosts: "Server Costs",
    serverCostsDesc: "Your contribution helps directly pay for the database and hosting.",
    development: "Development",
    developmentDesc: "New features like the AI scanner cost time and computing power.",
    adFree: "100% Ad-Free",
    adFreeDesc: "No annoying ads, just tools for makers.",
    thankYouNote: "Thanks for your support!",

    // Forms Common
    brand: "Brand",
    color: "Color",
    material: "Material",
    category: "Category",
    quantity: "Quantity",
    unit: "Unit",
    price: "Price",
    notes: "Notes",
    weightTotalLabel: "Total (g)",
    weightRemainingLabel: "Remaining (g)",
    tempNozzle: "Nozzle (°C)",
    tempBed: "Bed (°C)",
    location: "Location",
    supplier: "Supplier",
    shopUrl: "Shop URL",
    addMultiple: "Add Multiple Spools",
    saveChanges: "Save Changes",
    addToInventory: "Add to Inventory",
    clear: "Clear",
    selectBrand: "Choose brand...",
    otherBrand: "+ Other brand...",
    selectMaterial: "Choose material...",
    otherMaterial: "+ Other material...",
    selectColor: "Choose color...",
    otherColor: "+ Other color...",
    colorNamePlaceholder: "Color Name",
    newLocationPlaceholder: "New location...",
    newSupplierPlaceholder: "New supplier...",
    newLocationOption: "+ New Location...",
    newSupplierOption: "+ New Supplier...",

    // Weigh Helper
    weighHelper: "Weight Helper",
    grossWeight: "Gross Weight",
    spoolType: "Empty Spool Type",
    tareWeight: "Tare Weight",
    apply: "Apply",
    suggestSpool: "Is your spool missing?",
    result: "Result",

    // Auth
    invalidCredentials: "Invalid email or password.",
    exampleEmail: "e.g. info@example.com",
    passwordPlaceholder: "Your password",

    // Colors
    "black": "Black",
    "white": "White",
    "grey": "Grey",
    "silver": "Silver",
    "red": "Red",
    "blue": "Blue",
    "green": "Green",
    "yellow": "Yellow",
    "orange": "Orange",
    "purple": "Purple",
    "pink": "Pink",
    "gold": "Gold",
    "bronze": "Bronze",
    "transparent": "Transparent",
    "natural": "Natural"
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
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

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
    <LanguageContext.Provider value={{ language, setLanguage, t, tColor }}>
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
