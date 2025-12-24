import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'nl' | 'en' | 'de' | 'fr' | 'es';

const translations: Record<Language, Record<string, string>> = {
  nl: {
    // Menu & Tabs
    dashboard: "Dashboard",
    inventory: "Voorraad",
    printHistory: "Logboek",
    printers: "Printers",
    shopping: "Inkooplijst",
    printPreview: "Print Preview",
    showcaseTitle: "Showcase",
    supportTitle: "Steun Project",
    settings: "Instellingen",
    admin: "Admin Dashboard",
    menu: "Menu",
    menuManagement: "Overzicht & Beheer",
    menuTools: "Tools",
    menuPremium: "Premium",
    becomePro: "Word PRO",
    userRatingText: "Gebruikers beoordelen ons met een",
    madeBy: "Gemaakt door",
    notifications: "Notificaties",
    
    // Help & Contact
    helpTitle: "Help & Contact",
    feedback: "Feedback",
    suggestions: "Suggesties",
    contact: "Contact",
    feedbackSubtitle: "Laat ons weten wat je vindt van de app.",
    feedbackPlaceholder: "Type hier je bericht...",
    feedbackSend: "Feedback Versturen",
    feedbackSent: "Bedankt voor je feedback!",
    alreadyFeedback: "Je hebt al feedback gegeven. Je kunt het hieronder aanpassen.",
    suggestionDesc: "Heb je een goed idee voor een nieuwe functie of verbetering? We horen het graag!",
    suggestionPlaceholder: "Beschrijf je idee zo uitgebreid mogelijk...",
    contactDesc: "Heb je een specifieke vraag of heb je ergens hulp bij nodig? Stuur ons een bericht.",
    contactNamePlaceholder: "Je naam",
    contactMessagePlaceholder: "Waar kunnen we je mee helpen?",
    emailSent: "Je bericht is verzonden. We nemen zo snel mogelijk contact op.",
    rating: "Beoordeling",
    send: "Versturen",

    // Inventory & Stock
    all: "Alles",
    filaments: "Filamenten",
    materials: "Materialen",
    searchPlaceholder: "Zoek op merk, kleur of ID...",
    newFilament: "Nieuw Filament",
    newMaterial: "Nieuw Materiaal",
    noFilaments: "Geen filamenten gevonden",
    noMaterials: "Geen materialen gevonden",
    viewSpools: "Bekijk spoelen",
    selected: "geselecteerd",
    selectionMode: "Selectie Modus",
    batchSelection: "Batch Selectie",
    printLabel: "Label Printen",
    scanLabel: "Snel Zoeken (Camera)",
    lookupNotFound: "Geen match gevonden voor deze code.",
    aiCameraUnavailable: "AI Camera in onderhoud",
    aiCameraUnavailableDesc: "De AI-scan functie is momenteel niet beschikbaar via de browser. Gebruik de handmatige zoekfunctie of de Android app.",

    // Sorting
    sortNameAsc: "Naam (A-Z)",
    sortNameDesc: "Naam (Z-A)",
    sortWeightAsc: "Gewicht (Laag-Hoog)",
    sortWeightDesc: "Gewicht (Hoog-Laag)",
    sortDateNew: "Datum (Nieuw-Oud)",
    sortDateOld: "Datum (Oud-Nieuw)",

    // Inkooplijst specifiek
    allStocked: "Alles is op voorraad",
    allStockedDesc: "Je hebt momenteel geen filamenten of onderdelen nodig die onder de drempelwaarde vallen.",
    order: "Bestellen",
    searchGoogle: "Google Zoeken",
    weightRemaining: "Restant",
    action: "Actie",

    // Logboek specifiek
    recentActivity: "Recente Activiteit",
    logPrint: "Print Loggen",
    dragDrop: "Sleep hier een .gcode bestand of klik om te uploaden",
    noHistory: "Nog geen prints gelogd",
    projectName: "Project Naam",
    printer: "Printer",
    selectPrinter: "Kies printer...",
    multiColorWarning: "Deze G-code bevat meerdere materialen. We hebben geprobeerd de beste match in je voorraad of AMS te vinden.",
    usagePerMaterial: "Verbruik per Materiaal",
    stockMatch: "Voorraad Match",
    noMatch: "Geen Match",
    modelWeightLabel: "Model Gewicht",
    wasteLabel: "Waste (Poop/Tower)",
    removeSlot: "Slot verwijderen",
    addSlot: "Slot toevoegen",
    saveUpdate: "Opslaan & Voorraad Bijwerken",

    // Kleuren (voor tColor)
    zwart: "Zwart", wit: "Wit", grijs: "Grijs", zilver: "Zilver", rood: "Rood", blauw: "Blauw", 
    groen: "Groen", geel: "Geel", oranje: "Oranje", paars: "Paars", roze: "Roze", goud: "Goud", 
    brons: "Brons", transparant: "Transparant", naturel: "Naturel", "glow in the dark": "Glow in the Dark", regenboog: "Regenbogen",

    // Settings Tabs
    tabGeneral: "Algemeen",
    tabNotifications: "Meldingen",
    tabManagement: "Beheer",
    tabAccount: "Account",
    tabPro: "PRO",

    // Actions & Common
    save: "Opslaan",
    cancel: "Annuleren",
    delete: "Verwijder",
    edit: "Bewerk",
    close: "Sluiten",
    back: "Terug",
    success: "Gelukt",
    failed: "Mislukt",
    loading: "Laden...",
    confirmDelete: "Weet je zeker dat je dit wilt verwijderen?",
    notificationsSubtitle: "Blijf op de hoogte van nieuwe functies en updates.",
    noNotifications: "Geen nieuwe meldingen",
    allCaughtUp: "Je bent helemaal bij!",
    newUpdate: "Nieuwe Update!",
    versionActive: "Versie %v is nu actief",
    whatsNew: "Wat is er nieuw",
    autoUpdateMsg: "De app is automatisch bijgewerkt naar de hoogste versie."
  },
  en: {
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

    // Help & Contact
    helpTitle: "Help & Contact",
    feedback: "Feedback",
    suggestions: "Suggestions",
    contact: "Contact",
    feedbackSubtitle: "Let us know what you think of the app.",
    feedbackPlaceholder: "Type your message here...",
    feedbackSend: "Send Feedback",
    feedbackSent: "Thanks for your feedback!",
    alreadyFeedback: "You have already given feedback. You can adjust it below.",
    suggestionDesc: "Do you have a great idea for a new feature or improvement? We'd love to hear it!",
    suggestionPlaceholder: "Describe your idea in detail...",
    contactDesc: "Do you have a specific question or need help with something? Send us a message.",
    contactNamePlaceholder: "Your name",
    contactMessagePlaceholder: "How can we help you?",
    emailSent: "Your message has been sent. We will contact you as soon as possible.",
    rating: "Rating",
    send: "Send",

    // Inventory & Stock
    all: "All",
    filaments: "Filaments",
    materials: "Materials",
    searchPlaceholder: "Search brand, color or ID...",
    newFilament: "New Filament",
    newMaterial: "New Material",
    noFilaments: "No filaments found",
    noMaterials: "No materials found",
    viewSpools: "View spools",
    selected: "selected",
    selectionMode: "Selection Mode",
    batchSelection: "Batch Selection",
    printLabel: "Print Label",
    scanLabel: "Quick Search (Camera)",
    lookupNotFound: "No match found for this code.",
    aiCameraUnavailable: "AI Camera under maintenance",
    aiCameraUnavailableDesc: "The AI-scan feature is currently unavailable via browser. Please use manual search or the Android app.",

    // Sorting
    sortNameAsc: "Name (A-Z)",
    sortNameDesc: "Name (Z-A)",
    sortWeightAsc: "Weight (Low-High)",
    sortWeightDesc: "Weight (High-Low)",
    sortDateNew: "Date (New-Old)",
    sortDateOld: "Date (Old-New)",

    // Shopping List
    allStocked: "Everything is in stock",
    allStockedDesc: "You currently don't need any filaments or parts that are below the threshold.",
    order: "Order",
    searchGoogle: "Search Google",
    weightRemaining: "Remaining",
    action: "Action",

    // Print History
    recentActivity: "Recent Activity",
    logPrint: "Log Print",
    dragDrop: "Drag and drop a .gcode file here or click to upload",
    noHistory: "No prints logged yet",
    projectName: "Project Name",
    printer: "Printer",
    selectPrinter: "Choose printer...",
    multiColorWarning: "This G-code contains multiple materials. We tried to find the best match in your stock or AMS.",
    usagePerMaterial: "Usage per Material",
    stockMatch: "Stock Match",
    noMatch: "No Match",
    modelWeightLabel: "Model Weight",
    wasteLabel: "Waste (Poop/Tower)",
    removeSlot: "Remove slot",
    addSlot: "Add slot",
    saveUpdate: "Save & Update Stock",

    // Colors
    zwart: "Black", wit: "White", grijs: "Grey", zilver: "Silver", rood: "Red", blauw: "Blue", 
    groen: "Green", geel: "Yellow", oranje: "Orange", paars: "Purple", roze: "Pink", goud: "Gold", 
    brons: "Bronze", transparant: "Transparent", naturel: "Natural", "glow in the dark": "Glow in the Dark", regenboog: "Rainbow",

    tabGeneral: "General",
    tabNotifications: "Notifications",
    tabManagement: "Management",
    tabAccount: "Account",
    tabPro: "PRO",

    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    back: "Back",
    success: "Success",
    failed: "Failed",
    loading: "Loading...",
    confirmDelete: "Are you sure you want to delete this?",
    notificationsSubtitle: "Stay updated with new features and improvements.",
    noNotifications: "No new notifications",
    allCaughtUp: "You're all caught up!",
    newUpdate: "New Update!",
    versionActive: "Version %v is now active",
    whatsNew: "What's New",
    autoUpdateMsg: "The app has been automatically updated to the latest version."
  },
  de: {
    dashboard: "Dashboard",
    inventory: "Inventar",
    printHistory: "Logbuch",
    printers: "Drucker",
    shopping: "Einkaufsliste",
    printPreview: "Druckvorschau",
    showcaseTitle: "Schaukasten",
    supportTitle: "Projekt unterstützen",
    settings: "Einstellungen",
    admin: "Admin-Bereich",
    menu: "Menü",
    menuManagement: "Verwaltung",
    menuTools: "Werkzeuge",
    menuPremium: "Premium",
    becomePro: "PRO werden",
    userRatingText: "Nutzer bewerten uns mit",
    madeBy: "Erstellt von",
    notifications: "Benachrichtigungen",

    // Hilfe & Kontakt
    helpTitle: "Hilfe & Kontakt",
    feedback: "Feedback",
    suggestions: "Vorschläge",
    contact: "Kontakt",
    feedbackSubtitle: "Lassen Sie uns wissen, was Sie von der App halten.",
    feedbackPlaceholder: "Geben Sie hier Ihre Nachricht ein...",
    feedbackSend: "Feedback senden",
    feedbackSent: "Vielen Dank für Ihr Feedback!",
    alreadyFeedback: "Sie haben bereits Feedback gegeben. Sie können es unten anpassen.",
    suggestionDesc: "Haben Sie eine tolle Idee für eine neue Funktion oder Verbesserung? Wir würden uns freuen, davon zu hören!",
    suggestionPlaceholder: "Beschreiben Sie Ihre Idee im Detail...",
    contactDesc: "Haben Sie eine spezielle Frage oder benötigen Sie Hilfe? Senden Sie uns eine Nachricht.",
    contactNamePlaceholder: "Ihr Name",
    contactMessagePlaceholder: "Wie können wir Ihnen helfen?",
    emailSent: "Ihre Nachricht wurde gesendet. Wir werden Sie so schnell wie möglich kontaktieren.",
    rating: "Bewertung",
    send: "Senden",

    // Inventory & Stock
    all: "Alle",
    filaments: "Filamente",
    materials: "Materialien",
    searchPlaceholder: "Suche Marke, Farbe oder ID...",
    newFilament: "Neues Filament",
    newMaterial: "Neues Material",
    noFilaments: "Keine Filamente gefunden",
    noMaterials: "Keine Materialien gefunden",
    viewSpools: "Spulen anzeigen",
    selected: "ausgewählt",
    selectionMode: "Auswahlmodus",
    batchSelection: "Stapel-Auswahl",
    printLabel: "Etikett drucken",
    scanLabel: "Schnellsuche (Kamera)",
    lookupNotFound: "Keine Übereinstimmung für diesen Code gefunden.",
    aiCameraUnavailable: "KI Kamera wird gewartet",
    aiCameraUnavailableDesc: "Die KI-Scan-Funktion ist derzeit nicht über den Browser verfügbar. Bitte verwenden Sie die manuelle Suche oder die Android-App.",

    // Sorting
    sortNameAsc: "Name (A-Z)",
    sortNameDesc: "Name (Z-A)",
    sortWeightAsc: "Gewicht (Niedrig-Hoch)",
    sortWeightDesc: "Gewicht (Hoch-Niedrig)",
    sortDateNew: "Datum (Neu-Alt)",
    sortDateOld: "Datum (Alt-Neu)",

    // Shopping List
    allStocked: "Alles ist auf Lager",
    allStockedDesc: "Aktuell benötigen Sie keine Filamente oder Teile unter dem Schwellenwert.",
    order: "Bestellen",
    searchGoogle: "Google Suche",
    weightRemaining: "Restgewicht",
    action: "Aktion",

    // Print History
    recentActivity: "Kürzliche Aktivitäten",
    logPrint: "Druck protokollieren",
    dragDrop: "Ziehen Sie eine .gcode-Datei hierher oder klicken Sie zum Hochladen",
    noHistory: "Noch keine Drucke protokolliert",
    projectName: "Projektname",
    printer: "Drucker",
    selectPrinter: "Drucker wählen...",
    multiColorWarning: "Dieser G-Code enthält mehrere Materialien. Wir haben versucht, die beste Übereinstimmung in Ihrem Lager oder AMS zu finden.",
    usagePerMaterial: "Verbrauch pro Material",
    stockMatch: "Lager Übereinstimmung",
    noMatch: "Keine Übereinstimmung",
    modelWeightLabel: "Modell Gewicht",
    wasteLabel: "Abfall (Poop/Tower)",
    removeSlot: "Slot entfernen",
    addSlot: "Slot hinzufügen",
    saveUpdate: "Speichern & Lager aktualisieren",

    // Farben
    zwart: "Schwarz", wit: "Weiß", grijs: "Grau", zilver: "Silber", rood: "Rot", blauw: "Blau", 
    groen: "Grün", geel: "Gelb", oranje: "Orange", paars: "Lila", roze: "Rosa", goud: "Gold", 
    brons: "Bronze", transparant: "Transparent", naturel: "Natur", "glow in the dark": "Leuchten im Dunkeln", regenboog: "Regenbogen",

    tabGeneral: "Allgemein",
    tabNotifications: "Meldungen",
    tabManagement: "Verwaltung",
    tabAccount: "Konto",
    tabPro: "PRO",

    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    close: "Schließen",
    back: "Zurück",
    success: "Erfolgreich",
    failed: "Fehlgeschlagen",
    loading: "Laden...",
    confirmDelete: "Sind Sie sicher, dass Sie dies löschen möchten?",
    notificationsSubtitle: "Bleiben Sie over neue Funktionen und Verbesserungen auf dem Laufenden.",
    noNotifications: "Keine neuen Benachrichtigungen",
    allCaughtUp: "Alles ist auf dem neuesten Stand!",
    newUpdate: "Neues Update!",
    versionActive: "Version %v ist jetzt aktiv",
    whatsNew: "Was ist neu",
    autoUpdateMsg: "Die app wurde automatisch aktualisiert."
  },
  fr: {
    dashboard: "Tableau de bord",
    inventory: "Inventaire",
    printHistory: "Historique",
    printers: "Imprimantes",
    shopping: "Liste d'achats",
    printPreview: "Aperçu",
    showcaseTitle: "Vitrine",
    supportTitle: "Soutenir le projet",
    settings: "Paramètres",
    admin: "Admin",
    menu: "Menu",
    menuManagement: "Gestion",
    menuTools: "Outils",
    menuPremium: "Premium",
    becomePro: "Devenir PRO",
    userRatingText: "Les utilisateurs nous notent",
    madeBy: "Fait par",
    notifications: "Notifications",

    // Aide & Contact
    helpTitle: "Aide & Contact",
    feedback: "Feedback",
    suggestions: "Suggestions",
    contact: "Contact",
    feedbackSubtitle: "Dites-nous ce que vous pensez de l'application.",
    feedbackPlaceholder: "Tapez votre message ici...",
    feedbackSend: "Envoyer le feedback",
    feedbackSent: "Merci pour votre feedback !",
    alreadyFeedback: "Vous avez déjà donné votre avis. Vous pouvez le modifier ci-dessous.",
    suggestionDesc: "Vous avez une idée géniale pour une nouvelle fonctionnalité ? Nous aimerions l'entendre !",
    suggestionPlaceholder: "Décrivez votre idée en détail...",
    contactDesc: "Vous avez une question spécifique ou besoin d'aide ? Envoyez-nous un message.",
    contactNamePlaceholder: "Votre nom",
    contactMessagePlaceholder: "Comment pouvons-nous vous aider ?",
    emailSent: "Votre message a été envoyé. Nous vous contacterons dès que possible.",
    rating: "Évaluation",
    send: "Envoyer",

    // Inventory & Stock
    all: "Tout",
    filaments: "Filaments",
    materials: "Matériaux",
    searchPlaceholder: "Rechercher marque, couleur ou ID...",
    newFilament: "Nouveau Filament",
    newMaterial: "Nouveau Materiau",
    noFilaments: "Aucun filament trouvé",
    noMaterials: "Aucun matériau trouvé",
    viewSpools: "Voir bobines",
    selected: "sélectionné",
    selectionMode: "Mode Sélection",
    batchSelection: "Sélection par lot",
    printLabel: "Imprimer l'étiquette",
    scanLabel: "Recherche rapide (Caméra)",
    lookupNotFound: "Aucune correspondance trouvée pour ce code.",
    aiCameraUnavailable: "Caméra IA en maintenance",
    aiCameraUnavailableDesc: "La fonction scan IA est actuellement indisponible via le navigateur. Veuillez utiliser la recherche manuelle ou l'application Android.",

    // Sorting
    sortNameAsc: "Nom (A-Z)",
    sortNameDesc: "Nom (Z-A)",
    sortWeightAsc: "Poids (Bas-Haut)",
    sortWeightDesc: "Poids (Haut-Bas)",
    sortDateNew: "Date (Nouveau-Ancien)",
    sortDateOld: "Date (Ancien-Nouveau)",

    // Liste d'achats
    allStocked: "Tout est en stock",
    allStockedDesc: "Vous n'avez actuellement pas besoin de filaments ou de pièces en dessous du seuil.",
    order: "Commander",
    searchGoogle: "Chercher Google",
    weightRemaining: "Poids restant",
    action: "Action",

    // Print History
    recentActivity: "Activité récente",
    logPrint: "Enregistrer une impression",
    dragDrop: "Faites glisser un fichier .gcode ici ou cliquez pour télécharger",
    noHistory: "Aucune impression enregistrée pour le moment",
    projectName: "Nom du projet",
    printer: "Imprimante",
    selectPrinter: "Choisir l'imprimante...",
    multiColorWarning: "Ce G-code contient plusieurs matériaux. Nous avons essayé de trouver la meilleure correspondance dans votre stock ou AMS.",
    usagePerMaterial: "Utilisation par matériau",
    stockMatch: "Correspondance stock",
    noMatch: "Aucune correspondance",
    modelWeightLabel: "Poids du modèle",
    wasteLabel: "Déchets (Poop/Tower)",
    removeSlot: "Supprimer le slot",
    addSlot: "Ajouter un slot",
    saveUpdate: "Enregistrer et mettre à jour le stock",

    // Couleurs
    zwart: "Noir", wit: "Blanc", grijs: "Gris", zilver: "Argent", rood: "Rouge", blauw: "Bleu", 
    groen: "Vert", geel: "Jaune", oranje: "Orange", paars: "Violet", roze: "Rose", goud: "Or", 
    brons: "Bronze", transparant: "Transparent", naturel: "Naturel", "glow in the dark": "Luminescent", regenboog: "Arc-en-ciel",

    tabGeneral: "Général",
    tabNotifications: "Notifications",
    tabManagement: "Gestion",
    tabAccount: "Compte",
    tabPro: "PRO",

    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    close: "Fermer",
    back: "Retour",
    success: "Succès",
    failed: "Échec",
    loading: "Chargement...",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer ceci?",
    notificationsSubtitle: "Restez au courant des nouvelles fonctionnalités.",
    noNotifications: "Pas de nouvelles notifications",
    allCaughtUp: "Vous êtes à jour !",
    newUpdate: "Nouvelle mise à jour !",
    versionActive: "La version %v est maintenant active",
    whatsNew: "Quoi de neuf",
    autoUpdateMsg: "L'application a été automatiquement mise à jour."
  },
  es: {
    dashboard: "Panel",
    inventory: "Inventario",
    printHistory: "Historial",
    printers: "Impresoras",
    shopping: "Lista de compras",
    printPreview: "Vista previa",
    showcaseTitle: "Vitrina",
    supportTitle: "Apoyar proyecto",
    settings: "Ajustes",
    admin: "Admin",
    menu: "Menú",
    menuManagement: "Gestión",
    menuTools: "Herramientas",
    menuPremium: "Premium",
    becomePro: "Hacerse PRO",
    userRatingText: "Los usuarios nos califican con",
    madeBy: "Hecho por",
    notifications: "Notificaciones",

    // Ayuda & Contacto
    helpTitle: "Ayuda y Contacto",
    feedback: "Feedback",
    suggestions: "Sugerencias",
    contact: "Contacto",
    feedbackSubtitle: "Cuéntanos qué te parece la aplicación.",
    feedbackPlaceholder: "Escribe tu mensaje aquí...",
    feedbackSend: "Enviar feedback",
    feedbackSent: "¡Gracias por tus comentarios!",
    alreadyFeedback: "Ya has enviado tus comentarios. Puedes ajustarlos a continuación.",
    suggestionDesc: "¿Tienes una gran idea para una nueva función o mejora? ¡Nos encantaría escucharla!",
    suggestionPlaceholder: "Describe tu idea en detalle...",
    contactDesc: "¿Tienes alguna pregunta específica o necesitas ayuda? Envíanos un mensaje.",
    contactNamePlaceholder: "Tu nombre",
    contactMessagePlaceholder: "¿Cómo podemos ayudarte?",
    emailSent: "Tu mensaje ha sido enviado. Nos pondremos en contacto contigo lo antes posible.",
    rating: "Calificación",
    send: "Enviar",

    // Inventory & Stock
    all: "Todo",
    filaments: "Filamentos",
    materials: "Materiales",
    searchPlaceholder: "Buscar marca, color o ID...",
    newFilament: "Nuevo Filamento",
    newMaterial: "Nuevo Material",
    noFilaments: "No se encontraron filamentos",
    noMaterials: "No se encontraron materiales",
    viewSpools: "Ver bobinas",
    selected: "seleccionado",
    selectionMode: "Modo Selección",
    batchSelection: "Selección por lotes",
    printLabel: "Imprimir etiqueta",
    scanLabel: "Búsqueda rápida (Cámara)",
    lookupNotFound: "No se encontró coincidencia para este código.",
    aiCameraUnavailable: "Cámara IA en mantenimiento",
    aiCameraUnavailableDesc: "La función de escaneo IA no está disponible actualmente a través del navegador. Por favor, use la búsqueda manual o la aplicación para Android.",

    // Sorting
    sortNameAsc: "Nombre (A-Z)",
    sortNameDesc: "Nombre (Z-A)",
    sortWeightAsc: "Peso (Bajo-Alto)",
    sortWeightDesc: "Peso (Alto-Bajo)",
    sortDateNew: "Fecha (Nuevo-Antiguo)",
    sortDateOld: "Fecha (Antiguo-Nuevo)",

    // Lista de compras
    allStocked: "Todo está en stock",
    allStockedDesc: "Actualmente no necesitas filamentos ni piezas que estén por debajo del umbral.",
    order: "Pedir",
    searchGoogle: "Buscar Google",
    weightRemaining: "Restante",
    action: "Acción",

    // Print History
    recentActivity: "Actividad reciente",
    logPrint: "Registrar impresión",
    dragDrop: "Arrastre un archivo .gcode aquí o haga clic para cargarlo",
    noHistory: "Aún no hay impresiones registradas",
    projectName: "Nombre del proyecto",
    printer: "Impresora",
    selectPrinter: "Elegir impresora...",
    multiColorWarning: "Este G-code contiene múltiples materiales. Intentamos encontrar la mejor coincidencia en su stock o AMS.",
    usagePerMaterial: "Uso por material",
    stockMatch: "Coincidencia de stock",
    noMatch: "Sin coincidencia",
    modelWeightLabel: "Peso del modelo",
    wasteLabel: "Residuos (Poop/Tower)",
    removeSlot: "Eliminar ranura",
    addSlot: "Añadir ranura",
    saveUpdate: "Guardar y actualizar stock",

    // Colores
    zwart: "Negro", wit: "Blanco", grijs: "Gris", zilver: "Plata", rood: "Rojo", blauw: "Azul", 
    groen: "Verde", geel: "Amarillo", oranje: "Naranja", paars: "Morado", roze: "Rosa", goud: "Oro", 
    brons: "Bronce", transparant: "Transparente", naturel: "Natural", "glow in the dark": "Fluorescente", regenboog: "Arcoíris",

    tabGeneral: "General",
    tabNotifications: "Notificaciones",
    tabManagement: "Gestión",
    tabAccount: "Cuenta",
    tabPro: "PRO",

    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    close: "Cerrar",
    back: "Volver",
    success: "Éxito",
    failed: "Error",
    loading: "Cargando...",
    confirmDelete: "¿Estás seguro de que quieres eliminar esto?",
    notificationsSubtitle: "Mantente al día con las nuevas funciones.",
    noNotifications: "No hay notificaciones nuevas",
    allCaughtUp: "¡Estás al día!",
    newUpdate: "¡Nueva actualización!",
    versionActive: "La version %v ya está activa",
    whatsNew: "Novedades",
    autoUpdateMsg: "La aplicación se ha actualizado automáticamente."
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
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'nl';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    if (!key) return '';
    return translations[language][key] || translations['en'][key] || key;
  };

  const tColor = (color: string): string => {
    if (!color) return '';
    const lowerColor = color.toLowerCase();
    return translations[language][lowerColor] || translations['en'][lowerColor] || color;
  };

  return (
    // Fix: Added missing opening tag bracket for LanguageContext.Provider
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