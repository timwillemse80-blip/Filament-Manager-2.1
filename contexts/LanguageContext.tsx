import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'nl' | 'en' | 'de' | 'fr' | 'es';

const translations = {
  nl: {
    // Menu
    inventory: "Voorraad",
    locations: "Locaties",
    suppliers: "Leveranciers",
    printers: "Printers (AMS)",
    shopping: "Inkooplijst",
    settings: "Instellingen",
    logout: "Uitloggen",
    menu: "Menu",
    loggedInAs: "Ingelogd als",
    madeBy: "Gemaakt door",
    feedback: "Feedback",
    printHistory: "Logboek",
    dashboard: "Dashboard",
    support: "Steun Project",
    admin: "Admin Dashboard",
    becomePro: "Word PRO",
    help: "Hulp & Contact",
    userRatingText: "Gebruikers beoordelen ons met een",
    
    // Global / Common
    save: "Opslaan",
    cancel: "Annuleren",
    delete: "Verwijder",
    edit: "Bewerk",
    close: "Sluiten",
    back: "Terug",
    next: "Volgende",
    finish: "Afronden",
    loading: "Laden...",
    search: "Zoeken",
    filter: "Filteren",
    sort: "Sorteren",
    actions: "Acties",
    name: "Naam",
    description: "Omschrijving",
    optional: "Optioneel",
    website: "Website",
    date: "Datum",
    status: "Status",
    success: "Gelukt",
    failed: "Mislukt",
    unknown: "Onbekend",
    all: "Alles",
    none: "Geen",
    selected: "geselecteerd",
    send: "Versturen",
    markAsRead: "Markeer als gelezen",
    markAsUnread: "Markeer als ongelezen",
    
    // Examples / Placeholders
    exampleLocation: "bv. Kast A, Plank 2",
    exampleSupplier: "bv. 123-3D, Amazon",
    exampleWebsite: "www.voorbeeld.nl",
    exampleBrand: "bv. PolyMaker",
    exampleSpoolType: "bv. Karton, Plastic",
    exampleWeight: "bv. 140",
    exampleElectricityRate: "bv. 0.35",
    exampleHourlyRate: "bv. 15.00",
    exampleShowcaseName: "Mijn 3D Shop",
    projectNamePlaceholder: "Projectnaam",
    exampleTime: "bv. 2h 30m",
    exampleEmail: "naam@voorbeeld.nl",
    passwordPlaceholder: "••••••••",

    // Dashboard & Stats
    totalSpools: "Totaal Spoelen",
    totalValue: "Totale Waarde",
    totalWeight: "Totaal Gewicht",
    lowStock: "Bijna Leeg",
    items: "items",
    successRate: "Succes Ratio",
    materialDistribution: "Materiaal Verdeling",
    lowestStock: "Laagste Voorraad",
    investmentBrand: "Investering per Merk",
    noData: "Geen data beschikbaar",
    winterEdition: "Winter Editie",
    storageLimit: "Opslag Limiet",
    printerLimit: "Printer Limiet",
    limitReached: "Limiet bereikt",
    limitReachedFilamentBody: "Je hebt de limiet van 50 spoelen bereikt. Upgrade naar PRO voor onbeperkte opslag.",
    limitReachedPrinterBody: "Je hebt de limiet van 2 printers bereikt. Upgrade naar PRO om meer printers toe te voegen.",
    
    // Notifications & Updates
    offlineMode: "Offline Modus",
    notifications: "Meldingen",
    newUpdate: "Nieuwe Update",
    updateDetails: "Tik voor details",
    refillStock: "Vul je voorraad aan",
    noNotifications: "Geen nieuwe meldingen",
    updateAvailable: "Update Beschikbaar",
    updateNow: "Update Nu",
    later: "Later",
    
    // Actions
    searchPlaceholder: "Zoek op merk, kleur, materiaal of ID...",
    newFilament: "Nieuw Filament",
    exportCsv: "Exporteer CSV",
    importBackup: "Importeer Backup",
    exportBackup: "Exporteer Backup",
    
    // Printers
    printerName: "Printer Naam",
    printerModel: "Model",
    hasAMS: "Heeft AMS/CFS Systeem?",
    amsUnits: "Aantal AMS Units",
    slots: "Slots",
    slot: "Slot",
    emptySlot: "Leeg",
    activeFilament: "Actief Filament",
    addPrinter: "Printer Toevoegen",
    noPrinters: "Nog geen printers toegevoegd.",
    addFirstPrinter: "Voeg je eerste printer toe",
    printerSpecs: "Specificaties & Kosten",
    
    // Locations & Suppliers
    locationManager: "Locatie Beheer",
    addLocation: "Nieuwe Locatie",
    noLocations: "Nog geen locaties aangemaakt.",
    supplierManager: "Leverancier Beheer",
    addSupplier: "Nieuwe Leverancier",
    noSuppliers: "Nog geen leveranciers aangemaakt.",
    
    // Inventory & Shopping
    weightRemaining: "Resterend",
    viewSpools: "Bekijk spoelen",
    order: "Bestellen",
    searchGoogle: "Zoeken op Google",
    filament: "Filament",
    action: "Actie",
    allStocked: "Alles is op voorraad!",
    noFilaments: "Geen filamenten gevonden.",
    
    // Print History / Logging
    logPrint: "Print Loggen",
    recentActivity: "Recente Activiteit",
    dragDrop: "Sleep je .gcode bestand hierheen",
    manualEntry: "Of klik hier om handmatig te kiezen",
    noHistory: "Nog geen prints gelogd.",
    projectName: "Project Naam",
    printTime: "Tijd",
    timeOptional: "Tijd (Optioneel)",
    overrideWeight: "Totaal Gewicht (Override)",
    autoCalculated: "Automatisch berekend",
    usedMaterials: "Gebruikte Materialen",
    addSlot: "Slot Toevoegen",
    saveUpdate: "Opslaan & Voorraad Updaten",
    analyzing: "Analyseren...",
    
    // Forms
    formEditTitle: "Filament Bewerken",
    formNewTitle: "Nieuw Filament",
    brand: "Merk",
    color: "Kleur",
    material: "Materiaal",
    price: "Prijs",
    notes: "Notities",
    weightTotalLabel: "Totaal (g)",
    weightRemainingLabel: "Resterend (g)",
    tempNozzle: "Nozzle (°C)",
    tempBed: "Bed (°C)",
    location: "Locatie",
    supplier: "Leverancier",
    shopUrl: "Winkel URL",
    addMultiple: "Aantal Spoelen Toevoegen",
    saveChanges: "Wijzigingen Opslaan",
    addToInventory: "Toevoegen aan Voorraad",
    clear: "Wissen",
    selectBrand: "Kies merk...",
    otherBrand: "+ Ander merk...",
    selectMaterial: "Kies materiaal...",
    otherMaterial: "+ Ander...",
    selectColor: "Kies kleur...",
    otherColor: "+ Andere kleur...",
    colorNamePlaceholder: "Kleurnaam",
    newLocationPlaceholder: "Nieuwe locatie...",
    newSupplierPlaceholder: "Nieuwe leverancier...",
    newLocationOption: "+ Nieuwe Locatie...",
    newSupplierOption: "+ Nieuwe Leverancier...",
    
    // Scanner
    scanTitle: "Scan Filament",
    scanDesc: "Richt je camera op de sticker van de spoel.",
    startScan: "Start Scanner",
    processing: "Verwerken...",
    autoSettings: "Auto-Settings",
    
    // Weigh Helper
    weighHelper: "Weeg Hulp",
    grossWeight: "Bruto Gewicht",
    spoolType: "Type Lege Spoel",
    tareWeight: "Tarra Gewicht",
    apply: "Overnemen",
    suggestSpool: "Staat jouw spoel er niet tussen?",
    
    // Public / Showcase
    showcaseTitle: "Showcase",
    showcaseDesc: "Deel je voorraad met klanten (zonder prijzen/gewichten).",
    showcaseName: "Jouw Publieke Naam",
    enableShowcase: "Activeer Showcase Link",
    previewShowcase: "Bekijk Preview",
    publicStock: "Filament Voorraad",
    availableItems: "Beschikbare materialen en kleuren",
    loginClose: "Login / Sluiten",
    showcasePrivacyWarning: "Let op: Als je dit inschakelt, wordt een deel van je voorraad (merk, materiaal, kleur, gewicht) openbaar zichtbaar voor iedereen met de link. Persoonlijke details zoals prijs, locatie en notities blijven privé. Wil je doorgaan?",
    
    // Dialogs / Modals
    unsavedTitle: "Onopgeslagen wijzigingen",
    unsavedMsg: "Je hebt wijzigingen gemaakt die nog niet zijn opgeslagen.",
    saveAndClose: "Opslaan & Sluiten",
    discard: "Niet Opslaan",
    keepEditing: "Annuleren (Verder werken)",
    exitTitle: "App Afsluiten",
    exitMessage: "Weet je zeker dat je de app wilt afsluiten?",
    deleteTitle: "Verwijderen",
    deleteMessage: "Weet je zeker dat je dit item wilt verwijderen?",
    closeApp: "Afsluiten",
    
    // PRO / Coming Soon
    proFeatureLocked: "PRO Functie",
    proComingSoonTitle: "PRO Functie in Ontwikkeling",
    proComingSoonMsg: "We zijn nog druk bezig om deze functies te verbeteren en klaar te maken voor gebruik. Binnenkort beschikbaar!",
    upgradeToUnlock: "Upgrade om te ontgrendelen",
    
    // Sort Options
    sortNameAsc: "Naam (A-Z)",
    sortNameDesc: "Naam (Z-A)",
    sortWeightAsc: "Gewicht (Laag-Hoog)",
    sortWeightDesc: "Gewicht (Hoog-Laag)",
    sortDateNew: "Nieuwste eerst",
    sortDateOld: "Oudste eerst",

    // Labels
    printLabel: "Print Label",
    share: "Delen",
    text: "Tekst",
    logo: "Logo",

    // Settings
    tabGeneral: "Algemeen",
    tabNotifications: "Meldingen",
    tabData: "Data & Backup",
    tabAccount: "Account",
    tabPro: "Pro Tools",
    tabManagement: "Beheer",
    appearance: "Weergave",
    darkMode: "Donker",
    lightMode: "Licht",
    language: "Taal",
    lowStockWarning: "Laag Voorraad Waarschuwing",
    unusedWarning: "Lang niet gebruikt",
    days: "dagen",
    backupCreate: "Backup Maken",
    backupRestore: "Backup Terugzetten",
    dangerZone: "Gevarenzone",
    deleteAccount: "Account Verwijderen",
    cancelDeletion: "Verzoek Annuleren",
    deleteAccountDesc: "Dit dient een verzoek in om al je gegevens permanent te verwijderen.",
    deleteAccountConfirm: "Weet je het zeker? Dit kan niet ongedaan worden gemaakt.",
    requestSent: "Verzoek Verstuurd",
    requestCancelled: "Verzoek Geannuleerd",
    proTools: "Tools & Calculator",
    electricityRate: "Stroomprijs (€/kWh)",
    printerPower: "Verbruik (Watt)",
    printerCost: "Aanschaf (€)",
    printerLifespan: "Levensduur (Uren)",
    hourlyRate: "Uurtarief / Opslag (€/u)",
    profitMargin: "Winstmarge (%)",
    netCost: "Netto Kosten",
    sellPrice: "Advies Verkoopprijs",
    roundToNine: "Psychologische Prijs (.x9)",
    rounding: "Afronding",
    privacyPolicy: "Privacyverklaring",
    supportTitle: "Steun Project",
    donateButton: "Steun Project",
    stayLoggedIn: "Ingelogd blijven",
    
    // Support & Feedback
    supportPageTitle: "Help Filament Manager Groeien!",
    supportPageSubtitle: "Jouw steun houdt de servers draaiende.",
    whySupport: "Waarom steunen?",
    serverCosts: "Serverkosten",
    serverCostsDesc: "Database and hosting kosten geld.",
    development: "Ontwikkeling",
    developmentDesc: "Nieuwe functies bouwen kost tijd.",
    adFree: "Altijd Reclamevrij",
    adFreeDesc: "Ik wil de app schoon houden.",
    thankYouNote: "Elke bijdrage wordt enorm gewaardeerd!",
    feedbackTitle: "Jouw mening telt",
    feedbackSubtitle: "Wat vind je van de App?",
    feedbackPlaceholder: "Type hier je bericht...",
    feedbackSent: "Bedankt! Je feedback is verstuurd.",
    feedbackSend: "Verstuur Feedback",
    rating: "Beoordeling",
    feedbackPromptTitle: "Loop je ergens tegenaan?",
    feedbackPromptText: "Laat het ons weten zodat we de app kunnen verbeteren.",
    giveFeedback: "Feedback geven",
    
    // Help Tabs
    suggestions: "Suggesties",
    contact: "Contact",
    suggestionPlaceholder: "Ik heb een idee voor...",
    suggestionDesc: "Wat kunnen we verbeteren of toevoegen aan de app?",
    contactDesc: "Heb je een vraag of hulp nodig? Stuur ons een bericht.",
    contactMessagePlaceholder: "Waar kunnen we je mee helpen?",
    emailSent: "Mail app geopend!",
  },
  en: {
    inventory: "Inventory",
    locations: "Locations",
    suppliers: "Suppliers",
    printers: "Printers",
    shopping: "Shopping List",
    settings: "Settings",
    logout: "Log Out",
    menu: "Menu",
    loggedInAs: "Logged in as",
    madeBy: "Created by",
    feedback: "Feedback",
    printHistory: "Print History",
    dashboard: "Dashboard",
    support: "Support Project",
    admin: "Admin Dashboard",
    becomePro: "Become PRO",
    help: "Help & Contact",
    userRatingText: "Users rate us with a",
    
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
    
    exampleLocation: "e.g. Cabinet A, Shelf 2",
    exampleSupplier: "e.g. Amazon, 3DJake",
    exampleWebsite: "www.example.com",
    exampleBrand: "e.g. PolyMaker",
    exampleSpoolType: "e.g. Cardboard, Plastic",
    exampleWeight: "e.g. 140",
    exampleElectricityRate: "e.g. 0.35",
    exampleHourlyRate: "e.g. 15.00",
    exampleShowcaseName: "My 3D Shop",
    projectNamePlaceholder: "Project Name",
    exampleTime: "e.g. 2h 30m",
    exampleEmail: "name@example.com",
    passwordPlaceholder: "••••••••",

    totalSpools: "Total Spools",
    totalValue: "Total Value",
    totalWeight: "Total Weight",
    lowStock: "Low Stock",
    items: "items",
    successRate: "Success Rate",
    materialDistribution: "Material Distribution",
    lowestStock: "Lowest Stock",
    investmentBrand: "Investment by Brand",
    noData: "No data available",
    winterEdition: "Winter Edition",
    storageLimit: "Storage Limit",
    printerLimit: "Printer Limit",
    limitReached: "Limit Reached",
    limitReachedFilamentBody: "You have reached the limit of 50 spools. Upgrade to PRO for unlimited storage.",
    limitReachedPrinterBody: "You have reached the limit of 2 printers. Upgrade to PRO to add more printers.",
    
    offlineMode: "Offline Mode",
    notifications: "Notifications",
    newUpdate: "New Update",
    updateDetails: "Tap for details",
    refillStock: "Refill your stock",
    noNotifications: "No new notifications",
    updateAvailable: "Update Available",
    updateNow: "Update Now",
    later: "Later",
    
    searchPlaceholder: "Search brand, color, material...",
    newFilament: "New Filament",
    exportCsv: "Export CSV",
    importBackup: "Import Backup",
    exportBackup: "Export Backup",
    
    printerName: "Printer Name",
    printerModel: "Model",
    hasAMS: "Has AMS/CFS System?",
    amsUnits: "AMS Units Count",
    slots: "Slots",
    slot: "Slot",
    emptySlot: "Empty",
    activeFilament: "Active Filament",
    addPrinter: "Add Printer",
    noPrinters: "No printers added yet.",
    addFirstPrinter: "Add your first printer",
    printerSpecs: "Specs & Cost",
    
    locationManager: "Location Manager",
    addLocation: "New Location",
    noLocations: "No locations created yet.",
    supplierManager: "Supplier Manager",
    addSupplier: "New Supplier",
    noSuppliers: "No suppliers created yet.",
    
    weightRemaining: "Remaining",
    viewSpools: "View spools",
    order: "Order",
    searchGoogle: "Search on Google",
    filament: "Filament",
    action: "Action",
    allStocked: "Everything is in stock!",
    noFilaments: "No filaments found.",
    
    logPrint: "Log Print",
    recentActivity: "Recent Activity",
    dragDrop: "Drag your .gcode file here",
    manualEntry: "Or click here to select manually",
    noHistory: "No prints logged yet.",
    projectName: "Project Name",
    printTime: "Time",
    timeOptional: "Time (Optional)",
    overrideWeight: "Total Weight (Override)",
    autoCalculated: "Auto calculated",
    usedMaterials: "Used Materials",
    addSlot: "Add Slot",
    saveUpdate: "Save & Update Stock",
    analyzing: "Analyzing...",
    
    formEditTitle: "Edit Filament",
    formNewTitle: "New Filament",
    brand: "Brand",
    color: "Color",
    material: "Material",
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
    selectBrand: "Select brand...",
    otherBrand: "+ Other brand...",
    selectMaterial: "Select material...",
    otherMaterial: "+ Other...",
    selectColor: "Select color...",
    otherColor: "+ Other color...",
    colorNamePlaceholder: "Color Name",
    newLocationPlaceholder: "New location...",
    newSupplierPlaceholder: "New supplier...",
    newLocationOption: "+ New Location...",
    newSupplierOption: "+ New Supplier...",
    
    scanTitle: "Scan Filament",
    scanDesc: "Point your camera at the spool label.",
    startScan: "Start Scanner",
    processing: "Processing...",
    autoSettings: "Auto-Settings",
    
    weighHelper: "Weigh Helper",
    grossWeight: "Gross Weight",
    spoolType: "Empty Spool Type",
    tareWeight: "Tare Weight",
    apply: "Apply",
    suggestSpool: "Spool not listed?",
    
    showcaseTitle: "Showcase",
    showcaseDesc: "Share your inventory with customers.",
    showcaseName: "Your Public Name",
    enableShowcase: "Enable Showcase Link",
    previewShowcase: "View Preview",
    publicStock: "Filament Inventory",
    availableItems: "Available materials and colors",
    loginClose: "Login / Close",
    showcasePrivacyWarning: "Warning: Enabling this will make parts of your inventory (brand, material, color, weight) publicly visible to anyone with the link. Personal details like price, location, and notes remain private. Do you want to continue?",
    
    unsavedTitle: "Unsaved Changes",
    unsavedMsg: "You have unsaved changes.",
    saveAndClose: "Save & Close",
    discard: "Discard",
    keepEditing: "Cancel",
    exitTitle: "Exit App",
    exitMessage: "Are you sure you want to close the app?",
    deleteTitle: "Delete Item",
    deleteMessage: "Are you sure you want to delete this?",
    closeApp: "Exit",
    
    proFeatureLocked: "PRO Feature",
    proComingSoonTitle: "PRO Feature in Development",
    proComingSoonMsg: "We are currently working hard to improve these features and make them ready for use. Coming soon!",
    upgradeToUnlock: "Upgrade to unlock",
    
    sortNameAsc: "Name (A-Z)",
    sortNameDesc: "Name (Z-A)",
    sortWeightAsc: "Weight (Low-High)",
    sortWeightDesc: "Weight (High-Low)",
    sortDateNew: "Newest first",
    sortDateOld: "Oldest first",

    printLabel: "Print Label",
    share: "Share",
    text: "Text",
    logo: "Logo",

    tabGeneral: "General",
    tabNotifications: "Notifications",
    tabData: "Data & Backup",
    tabAccount: "Account",
    tabPro: "Pro Tools",
    tabManagement: "Management",
    appearance: "Appearance",
    darkMode: "Dark",
    lightMode: "Licht",
    language: "Language",
    lowStockWarning: "Low Stock Warning",
    unusedWarning: "Unused Warning",
    days: "days",
    backupCreate: "Create Backup",
    backupRestore: "Restore Backup",
    dangerZone: "Danger Zone",
    deleteAccount: "Delete Account",
    cancelDeletion: "Cancel Request",
    deleteAccountDesc: "Request to permanently delete all your data.",
    deleteAccountConfirm: "Are you sure? This cannot be undone.",
    requestSent: "Request Sent",
    requestCancelled: "Request Cancelled",
    proTools: "Tools & Calculator",
    electricityRate: "Power Rate (€/kWh)",
    printerPower: "Power Usage (Watts)",
    printerCost: "Printer Cost (€)",
    printerLifespan: "Lifespan (Hours)",
    hourlyRate: "Hourly Rate (€/h)",
    profitMargin: "Profit Margin (%)",
    netCost: "Net Cost",
    sellPrice: "Suggested Sell Price",
    roundToNine: "Psychological Price (.x9)",
    rounding: "Rounding",
    privacyPolicy: "Privacy Policy",
    supportTitle: "Support Project",
    donateButton: "Buy me a Coffee",
    stayLoggedIn: "Stay Logged In",
    
    supportPageTitle: "Help Filament Manager Grow!",
    supportPageSubtitle: "Your support keeps the servers running.",
    whySupport: "Why support?",
    serverCosts: "Server Costs",
    serverCostsDesc: "Database and hosting cost money.",
    development: "Development",
    developmentDesc: "Building new features takes time.",
    adFree: "Always Ad-Free",
    adFreeDesc: "I want to keep the app clean.",
    thankYouNote: "Every contribution is appreciated!",
    feedbackTitle: "Your opinion matters",
    feedbackSubtitle: "What do you think of the App?",
    feedbackPlaceholder: "Type your message here...",
    feedbackSent: "Thanks! Feedback sent.",
    feedbackSend: "Send Feedback",
    rating: "Rating",
    feedbackPromptTitle: "Running into issues?",
    feedbackPromptText: "Let us know so we can improve.",
    giveFeedback: "Give Feedback",

    suggestions: "Suggestions",
    contact: "Contact",
    suggestionPlaceholder: "I have an idea for...",
    suggestionDesc: "How can we improve or add to the app?",
    contactDesc: "Do you have a question or need help? Send us a message.",
    contactMessagePlaceholder: "How can we help you?",
    emailSent: "Mail app opened!",
  },
  de: {},
  fr: {},
  es: {}
};

const colorTranslations: Record<string, Record<string, string>> = {
  nl: {
    "Zwart": "Zwart", "Wit": "Wit", "Grijs": "Grijs", "Zilver": "Zilver", "Rood": "Rood", "Blauw": "Blauw", "Groen": "Groen", "Geel": "Geel", "Oranje": "Oranje", "Paars": "Paars", "Roze": "Roze", "Goud": "Goud", "Brons": "Brons", "Transparant": "Transparant", "Naturel": "Naturel", "Glow in the Dark": "Glow in the Dark", "Regenboog": "Regenboog"
  },
  en: {
    "Zwart": "Black", "Wit": "White", "Grijs": "Gray", "Zilver": "Silver", "Rood": "Red", "Blauw": "Blue", "Groen": "Green", "Geel": "Yellow", "Oranje": "Orange", "Paars": "Purple", "Roze": "Pink", "Goud": "Gold", "Brons": "Bronze", "Transparant": "Transparent", "Naturel": "Natural", "Glow in the Dark": "Glow in the Dark", "Regenboog": "Rainbow"
  },
  de: {
    "Zwart": "Schwarz", "Wit": "Weiß", "Grijs": "Grau", "Zilver": "Silber", "Rood": "Rot", "Blauw": "Blau", "Groen": "Grün", "Geel": "Gelb", "Oranje": "Orange", "Paars": "Lila", "Roze": "Rosa", "Goud": "Gold", "Brons": "Bronze", "Transparant": "Transparent", "Naturel": "Natur", "Glow in the Dark": "Nachleuchtend", "Regenboog": "Regenbogen"
  },
  fr: {
    "Zwart": "Noir", "Wit": "Blanc", "Grijs": "Gris", "Zilver": "Argent", "Rood": "Rouge", "Blauw": "Bleu", "Groen": "Vert", "Geel": "Jaune", "Oranje": "Orange", "Paars": "Violet", "Roze": "Rose", "Goud": "Or", "Brons": "Bronze", "Transparant": "Transparent", "Naturel": "Naturel", "Glow in the Dark": "Phosphorescent", "Regenboog": "Arc-en-ciel"
  },
  es: {
    "Zwart": "Negro", "Wit": "Blanco", "Grijs": "Gris", "Zilver": "Plata", "Rood": "Rojo", "Blauw": "Azul", "Groen": "Verde", "Geel": "Amarillo", "Oranje": "Naranja", "Paars": "Púrpura", "Roze": "Rosa", "Goud": "Oro", "Brons": "Bronce", "Transparant": "Transparente", "Naturel": "Natural", "Glow in the Dark": "Fosforescente", "Regenboog": "Arcoíris"
  }
};

type TranslationKey = keyof typeof translations.nl;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tColor: (color: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper function to detect device language
const getDeviceLanguage = (): Language => {
  // 1. Check local storage first (user preference override)
  const savedLang = localStorage.getItem('app_language') as Language;
  if (savedLang && ['nl', 'en', 'de', 'fr', 'es'].includes(savedLang)) {
    return savedLang;
  }

  // 2. Check browser/device language
  if (typeof navigator !== 'undefined' && navigator.language) {
    const browserLang = navigator.language.split('-')[0]; // e.g. "en-US" -> "en"
    if (['nl', 'en', 'de', 'fr', 'es'].includes(browserLang)) {
      return browserLang as Language;
    }
  }

  // 3. Fallback to English
  return 'en';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with the detection logic
  const [language, setLanguageState] = useState<Language>(getDeviceLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    // @ts-ignore - Dynamic access
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const tColor = (color: string): string => {
    if (!color) return "";
    const translated = colorTranslations[language]?.[color];
    return translated || color;
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