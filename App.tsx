
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Filament, Location, Supplier, AppSettings, PrintJob, Printer, ViewState, OtherMaterial } from './types';
import { Inventory } from './components/Inventory';
import { FilamentForm } from './components/FilamentForm';
import { MaterialForm } from './components/MaterialForm';
import { LocationManager } from './components/LocationManager';
import { SupplierManager } from './components/SupplierManager';
import { PrinterManager } from './components/PrinterManager'; 
import { ShoppingList } from './components/ShoppingList';
import { Settings } from './components/Settings';
import { PrintHistory } from './components/PrintHistory'; 
import { Dashboard } from './components/Dashboard'; 
import { SupportPage } from './components/SupportPage'; 
import { HelpPage } from './components/HelpPage'; 
import { ShowcasePreview } from './components/ShowcasePreview';
import { ShowcaseModal } from './components/ShowcaseModal'; 
import { AuthScreen } from './components/AuthScreen';
import { AdminPanel } from './components/AdminPanel';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { PullToRefresh } from './components/PullToRefresh';
import { InstallPage } from './components/InstallPage'; 
import { Package, Plus, MapPin, Truck, Settings as SettingsIcon, Bell, Menu, X, ShoppingCart, LogOut, AlertTriangle, Download, RefreshCw, PartyPopper, WifiOff, History, CheckCircle2, Printer as PrinterIcon, LayoutDashboard, Sparkles, ChevronRight, Lock, ShieldCheck, Coffee, Snowflake, MessageSquare, ThumbsUp, Clock, Globe, PanelLeftClose, PanelLeftOpen, Crown, Hammer, LifeBuoy, Star, Box, AlertCircle, HardHat, ExternalLink, Key, Database, Info } from 'lucide-react';
import { Logo } from './components/Logo';
import { CreatorLogo } from './components/CreatorLogo';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { supabase, isSupabaseConfigured } from './services/supabase';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LogoProvider } from './contexts/LogoContext';
import { DISCORD_INVITE_URL } from './constants';

const generateShortId = () => Math.random().toString(36).substring(2, 6).toUpperCase();

// --- CONFIGURATION ---
const APP_VERSION = "2.2.0"; 
const ADMIN_EMAILS = ["timwillemse@hotmail.com"];
const FREE_TIER_LIMIT = 50; 
const FREE_PRINTER_LIMIT = 2;

// Add missing isNewerVersion helper function
const isNewerVersion = (oldVer: string, newVer: string): boolean => {
  const oldParts = oldVer.split('.').map(Number);
  const newParts = newVer.split('.').map(Number);
  const length = Math.max(oldParts.length, newParts.length);
  for (let i = 0; i < length; i++) {
    const oldP = oldParts[i] || 0;
    const newP = newParts[i] || 0;
    if (newP > oldP) return true;
    if (newP < oldP) return false;
  }
  return false;
};

// --- MISSING CONFIG SCREEN ---
const MissingConfigScreen = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-900/20">
            <Database size={40} />
          </div>
          <h1 className="text-3xl font-black mb-2">Supabase Koppelen</h1>
          <p className="text-slate-400">De app kan je database nog niet vinden. Volg deze stappen om het op te lossen:</p>
        </div>
        <div className="space-y-4">
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex gap-4">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center font-black shrink-0">1</div>
            <div>
              <h3 className="font-bold mb-1">Ga naar Supabase.com</h3>
              <p className="text-xs text-slate-400">Log in en open je project. Ga naar <strong>Settings</strong> (tandwiel) &gt; <strong>API</strong>.</p>
            </div>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex gap-4">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center font-black shrink-0">2</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold mb-1">Kopieer de gegevens</h3>
              <p className="text-xs text-slate-400 mb-2">Je hebt twee waarden nodig:</p>
              <div className="space-y-2">
                <div className="bg-slate-900 p-2 rounded border border-slate-700 font-mono text-[10px] truncate">VITE_SUPABASE_URL</div>
                <div className="bg-slate-900 p-2 rounded border border-slate-700 font-mono text-[10px] truncate">VITE_SUPABASE_ANON_KEY</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex gap-4">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center font-black shrink-0">3</div>
            <div>
              <h3 className="font-bold mb-1">Plak in Vercel</h3>
              <p className="text-xs text-slate-400">Ga naar je Vercel Dashboard &gt; <strong>Settings</strong> &gt; <strong>Environment Variables</strong> en voeg beide toe.</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-xl flex gap-3 items-start">
          <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-100 leading-relaxed">
            Nadat je de variabelen hebt toegevoegd in Vercel, moet je een <strong>Redeploy</strong> doen (bij 'Deployments') om de wijzigingen door te voeren.
          </p>
        </div>
        <button onClick={() => window.location.reload()} className="w-full py-4 bg-white text-slate-900 font-black rounded-xl shadow-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
          <RefreshCw size={20} /> Controleer opnieuw
        </button>
      </div>
    </div>
  );
};

const NavButton = ({ view, setView, target, icon, label, count, onClick, className }: any) => (
  <button 
    onClick={() => {
      setView(target);
      if (onClick) onClick();
    }}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-sm font-medium whitespace-nowrap ${
      view === target 
        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
    } ${className || ''}`}
    title={label} 
  >
    {icon}
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold min-w-[20px] text-center shadow-sm">
        {count}
      </span>
    )}
  </button>
);

const DiscordIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.0777.0777 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z"/>
  </svg>
);

const SidebarContent = ({ view, setView, filaments, lowStockCount, onClose, t, appVersion, isOffline, onLogout, isAdmin, isPro, onBecomePro, onOpenShowcase, adminBadgeCount, averageRating }: any) => {
  const usagePct = Math.min(100, (filaments.length / FREE_TIER_LIMIT) * 100);
  const isNearLimit = filaments.length >= FREE_TIER_LIMIT;
  const isProActive = isAdmin || isPro;

  const handleOpenDiscord = () => {
     if (Capacitor.isNativePlatform()) { window.open(DISCORD_INVITE_URL, '_system'); } 
     else { window.open(DISCORD_INVITE_URL, '_blank'); }
  };

  return (
    <div className="flex flex-col h-full p-4 pb-8 lg:p-6 lg:pb-12 overflow-x-hidden">
      <div className="flex justify-between items-center mb-4 lg:hidden">
         <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center"><Logo className="w-full h-full" /></div>
          <h2 className="font-bold text-lg dark:text-white text-slate-800">{t('menu')}</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"><X size={24} /></button>
      </div>

      <div className="space-y-1 flex-1 overflow-y-auto">
        <NavButton onClick={onClose} view={view} setView={setView} target="dashboard" icon={<LayoutDashboard size={18} />} label={t('dashboard')} />
        <NavButton onClick={onClose} view={view} setView={setView} target="inventory" icon={<Package size={18} />} label={t('inventory')} />
        <NavButton onClick={onClose} view={view} setView={setView} target="history" icon={<History size={18} />} label={t('printHistory')} />
        <NavButton onClick={onClose} view={view} setView={setView} target="printers" icon={<PrinterIcon size={18} />} label={t('printers')} />
        <NavButton onClick={onClose} view={view} setView={setView} target="shopping" icon={<ShoppingCart size={18} />} label={t('shopping')} count={lowStockCount > 0 ? lowStockCount : undefined} />
        
        <button
            onClick={() => {
                onClose();
                if(!isProActive) onBecomePro();
                else onOpenShowcase();
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-sm font-medium whitespace-nowrap text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800`}
        >
            <Globe size={18} />
            <span>{t('showcaseTitle')}</span>
            {!isProActive && <Lock size={12} className="ml-auto text-amber-500" />}
        </button>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3 pb-2">
         {!isProActive && (
            <button onClick={onBecomePro} className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-md transform active:scale-95">
               <Crown size={18} fill="currentColor" />
               <span>{t('becomePro')}</span>
            </button>
         )}
         {!isProActive && (
           <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-2.5">
              <div className="flex justify-between text-xs mb-1.5 font-medium text-slate-600 dark:text-slate-400">
                 <span>{t('storageLimit')}</span>
                 <span className={isNearLimit ? "text-orange-500 font-bold" : ""}>{filaments.length} / {FREE_TIER_LIMIT}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                 <div className={`h-full rounded-full transition-all duration-500 ${isNearLimit ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${usagePct}%` }} />
              </div>
           </div>
         )}
         <NavButton onClick={onClose} view={view} setView={setView} target="support" icon={<Coffee size={18} className="text-amber-500" />} label={t('supportTitle')} className={view !== 'support' ? "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}/>
         <NavButton onClick={onClose} view={view} setView={setView} target="help" icon={<LifeBuoy size={18} className="text-purple-500" />} label={t('help')} className={view !== 'help' ? "bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 text-purple-700 dark:text-purple-400" : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"}/>
         
         <button onClick={handleOpenDiscord} className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-sm font-medium text-[#5865F2] hover:bg-[#5865F2]/10 whitespace-nowrap">
            <DiscordIcon size={18} />
            <span>Discord Community</span>
         </button>

         {isAdmin && (
            <NavButton onClick={onClose} view={view} setView={setView} target="admin" icon={<ShieldCheck size={18} />} label={t('admin')} count={adminBadgeCount} className={view !== 'admin' ? "bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"}/>
         )}
         <NavButton onClick={onClose} view={view} setView={setView} target="settings" icon={<SettingsIcon size={18} />} label={t('settings')} />
         
         {averageRating > 0 && (
            <button onClick={() => { setView('help'); onClose(); }} className="w-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded-lg text-center transition-all border border-transparent hover:border-slate-200 dark:border-slate-700 group">
               <div className="flex justify-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(star => <Star key={star} size={14} className={star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-slate-300 dark:text-slate-600"} />)}
               </div>
               <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight group-hover:text-blue-500 transition-colors">{t('userRatingText')} <span className="text-yellow-500 font-bold">{averageRating.toFixed(1)}</span></p>
            </button>
         )}
         
        <div className="flex flex-col items-center pt-2">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 font-medium">{t('madeBy')}</p>
          <CreatorLogo className="h-10 w-auto text-slate-800 dark:text-white" />
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { t, tColor } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  // Data State
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [materials, setMaterials] = useState<OtherMaterial[]>([]); 
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]); 
  const [printers, setPrinters] = useState<Printer[]>([]); 
  
  const [adminBadgeCount, setAdminBadgeCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  const [settings, setSettings] = useState<AppSettings>({ 
    lowStockThreshold: 20, theme: 'dark', unusedWarningDays: 90, enableWeeklyEmail: false
  });
  
  const [view, setView] = useState<ViewState>('dashboard');
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openInLabelMode, setOpenInLabelMode] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('desktop_sidebar_open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarOpen((prev: boolean) => {
      const newState = !prev;
      localStorage.setItem('desktop_sidebar_open', JSON.stringify(newState));
      return newState;
    });
  };
  
  const [publicShopMode, setPublicShopMode] = useState<string | null>(null); 
  const [publicShopFilters, setPublicShopFilters] = useState<string[]>([]);
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [isSnowEnabled, setIsSnowEnabled] = useState(() => {
    const saved = localStorage.getItem('snow_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showProModal, setShowProModal] = useState(false);
  const [showExitToast, setShowExitToast] = useState(false);

  const toggleSnow = () => {
    setIsSnowEnabled((prev: boolean) => {
        const newVal = !prev;
        localStorage.setItem('snow_enabled', JSON.stringify(newVal));
        return newVal;
    });
  };

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean; title: string; message: string; cancelLabel?: string; confirmLabel?: string; onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Refs for Event Listener
  const viewRef = useRef(view);
  const sidebarRef = useRef(isSidebarOpen);
  const notificationsRef = useRef(showNotifications);
  const modalOpenRef = useRef(showModal || showMaterialModal || showProModal);

  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { sidebarRef.current = isSidebarOpen; }, [isSidebarOpen]);
  useEffect(() => { notificationsRef.current = showNotifications; }, [showNotifications]);
  useEffect(() => { modalOpenRef.current = showModal || showMaterialModal || showProModal; }, [showModal, showMaterialModal, showProModal]);

  // Check if Supabase config is valid
  if (!isSupabaseConfigured) { return <MissingConfigScreen />; }

  const isAdmin = useMemo(() => {
     const userEmail = session?.user?.email;
     if (!userEmail) return false;
     return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === userEmail.toLowerCase());
  }, [session]);

  const isProActive = isAdmin || isPro;

  const handleUpdateSettings = (newSettings: AppSettings) => {
     setSettings(newSettings);
     localStorage.setItem('settings', JSON.stringify(newSettings));
  };

  // Back Button Logic
  useEffect(() => {
    let lastBackPressTime = 0;
    const setupBackButton = async () => {
      await CapacitorApp.removeAllListeners();
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (modalOpenRef.current) {
           setShowModal(false); setShowMaterialModal(false); setShowProModal(false);
           setEditingId(null); setOpenInLabelMode(false);
           return;
        }
        if (sidebarRef.current) { setSidebarOpen(false); return; }
        if (notificationsRef.current) { setShowNotifications(false); return; }
        if (viewRef.current !== 'dashboard') { setView('dashboard'); return; }
        const now = Date.now();
        if (now - lastBackPressTime < 2000) { CapacitorApp.exitApp(); } 
        else { lastBackPressTime = now; setShowExitToast(true); setTimeout(() => setShowExitToast(false), 2000); }
      });
    };
    setupBackButton();
  }, []);

  useEffect(() => {
    const fetchGlobalStats = async () => {
        const { data: ratings } = await supabase.from('feedback').select('rating');
        if (ratings && ratings.length > 0) {
            const valid = ratings.filter(r => r.rating > 0);
            if (valid.length > 0) {
                const sum = valid.reduce((acc, curr) => acc + curr.rating, 0);
                setAverageRating(sum / valid.length);
            }
        }
        if (isAdmin) {
            const { count: feedbackCount } = await supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('is_read', false);
            const { count: requestCount } = await supabase.from('deletion_requests').select('*', { count: 'exact', head: true });
            setAdminBadgeCount((feedbackCount || 0) + (requestCount || 0));
        }
    };
    fetchGlobalStats();
  }, [isAdmin]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const checkUpdate = async () => {
        try {
            const res = await fetch('/version.json');
            const data = await res.json();
            if (isNewerVersion(APP_VERSION, data.version)) { setUpdateAvailable(data); }
        } catch(e) {}
    };
    checkUpdate();
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
       const params = new URLSearchParams(window.location.search);
       const shopUser = params.get('shop');
       if (shopUser) {
           setPublicShopMode(shopUser);
           const matParam = params.get('materials');
           if (matParam) setPublicShopFilters(matParam.split(',').map(decodeURIComponent));
           await fetchData(false, shopUser); 
           setIsLoading(false); return; 
       }
       const offlinePref = localStorage.getItem('filament_offline_mode');
       if (offlinePref === 'true') {
          setIsOffline(true); fetchData(true); setIsLoading(false); return;
       }
       const keepLoggedIn = localStorage.getItem('filament_keep_logged_in');
       const { data: { session: localSession } } = await supabase.auth.getSession();
       if (localSession) {
          if (keepLoggedIn === null) { await supabase.auth.signOut(); setSession(null); } 
          else { setSession(localSession); await fetchProStatus(localSession.user.id); fetchData(false, localSession.user.id); }
       } else { setSession(null); }
       setIsLoading(false);
    };
    initializeAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'SIGNED_OUT') { setSession(null); setIsOffline(false); setFilaments([]); setIsPro(false); } 
      else if (session) { setSession(session); setIsOffline(false); await fetchProStatus(session.user.id); fetchData(false, session.user.id); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProStatus = async (uid: string) => {
     const { data, error } = await supabase.from('profiles').select('is_pro').eq('id', uid).single();
     if (data) setIsPro(!!data.is_pro);
  };

  const fetchData = async (offline = isOffline, explicitUserId?: string) => {
    try {
      if (offline) {
        const f = localStorage.getItem('local_filaments'); if (f) setFilaments(JSON.parse(f));
        const m = localStorage.getItem('local_materials'); if (m) setMaterials(JSON.parse(m));
        const l = localStorage.getItem('local_locations'); if (l) setLocations(JSON.parse(l));
        const s = localStorage.getItem('local_suppliers'); if (s) setSuppliers(JSON.parse(s));
      } else {
        const uid = explicitUserId || session?.user?.id;
        if (!uid) return;
        const { data: fData } = await supabase.from('filaments').select('*').eq('user_id', uid); if (fData) setFilaments(fData);
        const { data: mData } = await supabase.from('other_materials').select('*').eq('user_id', uid); if (mData) setMaterials(mData);
        const { data: lData } = await supabase.from('locations').select('*').eq('user_id', uid); if (lData) setLocations(lData);
        const { data: sData } = await supabase.from('suppliers').select('*').eq('user_id', uid); if (sData) setSuppliers(sData);
        const { data: jData } = await supabase.from('print_jobs').select('*').eq('user_id', uid); if (jData) setPrintJobs(jData);
        const { data: pData } = await supabase.from('printers').select('*').eq('user_id', uid); if (pData) setPrinters(pData);
      }
      const localSettings = localStorage.getItem('settings'); if (localSettings) setSettings(JSON.parse(localSettings));
    } catch (error) { console.error('Error fetching data:', error); }
  };

  const handleRefresh = async () => { await fetchData(isOffline); if (session) fetchProStatus(session.user.id); };
  
  const handleLogout = async () => {
    try {
        localStorage.removeItem('filament_keep_logged_in');
        sessionStorage.removeItem('filament_session_active');
        await supabase.auth.signOut();
        setSession(null); setFilaments([]); setMaterials([]); setPrintJobs([]); setPrinters([]); setLocations([]); setSuppliers([]); setIsPro(false);
    } catch (e) { console.error("Logout error", e); }
  };

  const uniqueBrands = useMemo(() => {
    const brands = new Set(filaments.map(f => f.brand).filter(Boolean));
    return Array.from(brands).sort();
  }, [filaments]);

  const handleSaveFilament = async (data: Filament | Filament[]) => {
    if (!session && !isOffline) return;
    const itemsToAdd = Array.isArray(data) ? data.length : 1;
    if (!isProActive && !editingId && (filaments.length + itemsToAdd) > FREE_TIER_LIMIT) { setShowModal(false); setShowProModal(true); return; }
    const items = Array.isArray(data) ? data : [data];
    const processedItems = items.map(f => ({ ...f, user_id: session ? session.user.id : 'offline-user', shortId: f.shortId || generateShortId() }));
    try {
      if (isOffline) {
        const current = [...filaments];
        processedItems.forEach(item => { const idx = current.findIndex(f => f.id === item.id); if (idx >= 0) current[idx] = item; else current.push(item); });
        setFilaments(current); localStorage.setItem('local_filaments', JSON.stringify(current));
      } else {
        const { error } = await supabase.from('filaments').upsert(processedItems);
        if (error) throw error; await fetchData(false);
      }
      setShowModal(false); setEditingId(null); setOpenInLabelMode(false);
    } catch (e: any) { alert("Save failed: " + e.message); }
  };

  const handleSaveMaterial = async (data: OtherMaterial) => {
     if (!session && !isOffline) return;
     const processed = { ...data, user_id: session ? session.user.id : 'offline-user' };
     try {
        if (isOffline) {
           const current = [...materials];
           const idx = current.findIndex(m => m.id === data.id); if (idx >= 0) current[idx] = processed; else current.push(processed);
           setMaterials(current); localStorage.setItem('local_materials', JSON.stringify(current));
        } else {
           const { error } = await supabase.from('other_materials').upsert(processed);
           if (error) { if (error.message.includes('does not exist')) alert("Fout: Tabel 'other_materials' ontbreekt."); else throw error; } 
           else await fetchData(false);
        }
        setShowMaterialModal(false); setEditingId(null);
     } catch (e: any) { alert("Save failed: " + e.message); }
  };

  const handleSaveLocation = async (loc: Location) => {
      if (!session && !isOffline) return;
      const processed = { ...loc, user_id: session ? session.user.id : 'offline-user' };
      if (isOffline) {
         const current = [...locations]; const idx = current.findIndex(l => l.id === loc.id); if (idx >= 0) current[idx] = processed; else current.push(processed);
         setLocations(current); localStorage.setItem('local_locations', JSON.stringify(current));
      } else {
         const { error } = await supabase.from('locations').upsert(processed);
         if (error) alert("Fout: " + error.message); else fetchData(false);
      }
  };

  const handleDeleteLocation = async (id: string) => {
      if (isOffline) {
         const updated = locations.filter(l => l.id !== id); setLocations(updated); localStorage.setItem('local_locations', JSON.stringify(updated));
      } else {
         const { error } = await supabase.from('locations').delete().eq('id', id);
         if (error) alert("Fout: " + error.message); else setLocations(prev => prev.filter(l => l.id !== id));
      }
  };

  const handleSaveSupplier = async (sup: Supplier) => {
      if (!session && !isOffline) return;
      const processed = { ...sup, user_id: session ? session.user.id : 'offline-user' };
      if (isOffline) {
         const current = [...suppliers]; const idx = current.findIndex(s => s.id === sup.id); if (idx >= 0) current[idx] = processed; else current.push(processed);
         setSuppliers(current); localStorage.setItem('local_suppliers', JSON.stringify(current));
      } else {
         const { error } = await supabase.from('suppliers').upsert(processed);
         if (error) alert("Fout: " + error.message); else fetchData(false);
      }
  };

  const handleDeleteSupplier = async (id: string) => {
      if (isOffline) {
         const updated = suppliers.filter(s => s.id !== id); setSuppliers(updated); localStorage.setItem('local_suppliers', JSON.stringify(updated));
      } else {
         const { error } = await supabase.from('suppliers').delete().eq('id', id);
         if (error) alert("Fout: " + error.message); else setSuppliers(prev => prev.filter(s => s.id !== id));
      }
  };

  const handleSavePrinter = async (printer: Printer) => {
    if (!session && !isOffline) return;
    const isNew = !printers.some(p => p.id === printer.id);
    if (!isProActive && isNew && printers.length >= FREE_PRINTER_LIMIT) { setShowProModal(true); return; }
    const processed = { ...printer, user_id: session ? session.user.id : 'offline-user' };
    try {
        if (isOffline) {
            const current = [...printers]; const idx = current.findIndex(p => p.id === printer.id); if (idx >= 0) current[idx] = processed; else current.push(processed);
            setPrinters(current); localStorage.setItem('local_printers', JSON.stringify(current));
        } else {
            const { error } = await supabase.from('printers').upsert(processed); if (error) throw error; await fetchData(false);
        }
    } catch (e: any) { alert("Fout: " + e.message); }
  };

  const handleDeletePrinter = async (id: string) => {
      if (!confirm(t('deleteMessage'))) return;
      try {
          if (isOffline) {
              const updated = printers.filter(p => p.id !== id); setPrinters(updated); localStorage.setItem('local_printers', JSON.stringify(updated));
          } else {
              const { error } = await supabase.from('printers').delete().eq('id', id); if (error) throw error; setPrinters(prev => prev.filter(p => p.id !== id));
          }
      } catch (e: any) { alert("Fout: " + e.message); }
  };

  const handleQuickAdjust = async (id: string, amount: number) => {
    const target = filaments.find(f => f.id === id); if (!target) return;
    const newWeight = Math.max(0, target.weightRemaining - amount);
    if (isOffline) {
       const updated = filaments.map(f => f.id === id ? { ...f, weightRemaining: newWeight } : f);
       setFilaments(updated); localStorage.setItem('local_filaments', JSON.stringify(updated));
    } else {
       if (!session) return; setFilaments(prev => prev.map(f => f.id === id ? { ...f, weightRemaining: newWeight } : f));
       await supabase.from('filaments').update({ weightRemaining: newWeight }).eq('id', id);
    }
  };

  const handleMaterialAdjust = async (id: string, amount: number) => {
     const target = materials.find(m => m.id === id); if (!target) return;
     const newQty = Math.max(0, target.quantity + amount);
     if (isOffline) {
        const updated = materials.map(m => m.id === id ? { ...m, quantity: newQty } : m);
        setMaterials(updated); localStorage.setItem('local_materials', JSON.stringify(updated));
     } else {
        if (!session) return; setMaterials(prev => prev.map(m => m.id === id ? { ...m, quantity: newQty } : m));
        await supabase.from('other_materials').update({ quantity: newQty }).eq('id', id);
     }
  };

  const handleSavePrintJob = async (job: PrintJob, filamentDeductions: { id: string, amount: number }[]) => {
     if (!session && !isOffline) return;
     const processedJob = { ...job, user_id: session ? session.user.id : 'offline-user' };
     setPrintJobs(prev => [processedJob, ...prev]);
     const updatedFilaments = [...filaments];
     filamentDeductions.forEach(d => {
        const idx = updatedFilaments.findIndex(f => f.id === d.id);
        if (idx >= 0) updatedFilaments[idx] = { ...updatedFilaments[idx], weightRemaining: Math.max(0, updatedFilaments[idx].weightRemaining - d.amount) };
     });
     setFilaments(updatedFilaments);
     const materialDeductions = job.usedOtherMaterials || [];
     const updatedMaterials = [...materials];
     materialDeductions.forEach(d => {
        const idx = updatedMaterials.findIndex(m => m.id === d.materialId);
        if (idx >= 0) updatedMaterials[idx] = { ...updatedMaterials[idx], quantity: Math.max(0, updatedMaterials[idx].quantity - d.quantity) };
     });
     setMaterials(updatedMaterials);
     if (isOffline) {
        localStorage.setItem('local_print_jobs', JSON.stringify([processedJob, ...printJobs]));
        localStorage.setItem('local_filaments', JSON.stringify(updatedFilaments));
        localStorage.setItem('local_materials', JSON.stringify(updatedMaterials));
     } else {
        try {
           await supabase.from('print_jobs').insert(processedJob);
           for (const d of filamentDeductions) {
              const currentF = updatedFilaments.find(f => f.id === d.id);
              if (currentF) await supabase.from('filaments').update({ weightRemaining: currentF.weightRemaining }).eq('id', d.id);
           }
           for (const d of materialDeductions) {
              const currentM = updatedMaterials.find(m => m.id === d.materialId);
              if (currentM) await supabase.from('other_materials').update({ quantity: currentM.quantity }).eq('id', d.materialId);
           }
        } catch (e: any) { alert("Fout: " + e.message); }
     }
  };

  const handleDeletePrintJob = async (id: string) => {
     const job = printJobs.find(j => j.id === id); if (!job) return;
     if (!confirm(t('deleteMessage') + "\n\n" + t('stockRestoredMessage'))) return;
     const filamentRestores: {id: string, amount: number}[] = [];
     const materialRestores: {id: string, amount: number}[] = [];
     job.usedFilaments.forEach(uf => filamentRestores.push({ id: uf.filamentId, amount: uf.amount }));
     if (job.usedOtherMaterials) job.usedOtherMaterials.forEach(um => materialRestores.push({ id: um.materialId, amount: um.quantity }));
     const newFilaments = [...filaments];
     filamentRestores.forEach(r => { const idx = newFilaments.findIndex(f => f.id === r.id); if (idx !== -1) newFilaments[idx] = { ...newFilaments[idx], weightRemaining: newFilaments[idx].weightRemaining + r.amount }; });
     const newMaterials = [...materials];
     materialRestores.forEach(r => { const idx = newMaterials.findIndex(m => m.id === r.id); if (idx !== -1) newMaterials[idx] = { ...newMaterials[idx], quantity: newMaterials[idx].quantity + r.amount }; });
     setFilaments(newFilaments); setMaterials(newMaterials); setPrintJobs(prev => prev.filter(j => j.id !== id));
     if (isOffline) {
        localStorage.setItem('local_filaments', JSON.stringify(newFilaments)); localStorage.setItem('local_materials', JSON.stringify(newMaterials)); localStorage.setItem('local_print_jobs', JSON.stringify(printJobs.filter(j => j.id !== id)));
     } else {
        try {
           await supabase.from('print_jobs').delete().eq('id', id);
           for (const r of filamentRestores) { const current = newFilaments.find(f => f.id === r.id); if (current) await supabase.from('filaments').update({ weightRemaining: current.weightRemaining }).eq('id', r.id); }
           for (const r of materialRestores) { const current = newMaterials.find(m => m.id === r.id); if (current) await supabase.from('other_materials').update({ quantity: current.quantity }).eq('id', r.id); }
        } catch (e) { console.error("Delete failed", e); }
     }
  };

  const performDeleteFilament = async (id: string) => {
    try {
      if (isOffline) { const updated = filaments.filter(f => f.id !== id); setFilaments(updated); localStorage.setItem('local_filaments', JSON.stringify(updated)); } 
      else { await supabase.from('filaments').delete().eq('id', id); setFilaments(prev => prev.filter(f => f.id !== id)); }
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    } catch (e: any) { alert("Delete failed: " + e.message); }
  };

  const performDeleteMaterial = async (id: string) => {
     try {
        if (isOffline) { const updated = materials.filter(m => m.id !== id); setMaterials(updated); localStorage.setItem('local_materials', JSON.stringify(updated)); } 
        else { await supabase.from('other_materials').delete().eq('id', id); setMaterials(prev => prev.filter(m => m.id !== id)); }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
     } catch (e: any) { alert("Delete failed: " + e.message); }
  };

  const handleDeleteItem = (id: string, type: 'filament' | 'material') => {
    setConfirmDialog({ isOpen: true, title: t('deleteTitle'), message: t('deleteMessage'), confirmLabel: t('delete'), cancelLabel: t('cancel'), onConfirm: () => type === 'filament' ? performDeleteFilament(id) : performDeleteMaterial(id) });
  };

  const lowStockFilaments = filaments.filter(f => (f.weightRemaining / f.weightTotal) * 100 <= settings.lowStockThreshold);
  const lowStockMaterials = materials.filter(m => m.minStock !== undefined && m.minStock > 0 && m.quantity <= m.minStock);
  const totalLowStock = lowStockFilaments.length + lowStockMaterials.length;

  if (isLoading) return <div className="h-screen w-full bg-slate-900 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div>;
  if (publicShopMode) return <ShowcasePreview filaments={filaments} onClose={() => { window.history.pushState({}, '', window.location.pathname); window.location.reload(); }} publicName={settings.showcasePublicName} initialFilters={publicShopFilters} isAdminPreview={false} />;
  if (!session && !isOffline) return <AuthScreen onOfflineLogin={() => { setIsOffline(true); localStorage.setItem('filament_offline_mode', 'true'); fetchData(true); }} />;

  return (
        <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans flex">
          <aside className={`hidden lg:flex flex-col fixed top-0 bottom-0 z-20 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${isDesktopSidebarOpen ? 'w-72' : 'w-0 -translate-x-full opacity-0 overflow-hidden border-none'}`}>
            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div className="w-8 h-8 flex items-center justify-center"><Logo className="w-full h-full" /></div>
                <span className="font-bold text-lg truncate">Filament Manager</span>
            </div>
            <SidebarContent view={view} setView={setView} filaments={filaments} lowStockCount={totalLowStock} onClose={() => {}} t={t} appVersion={APP_VERSION} isOffline={isOffline} onLogout={handleLogout} isAdmin={isAdmin} isPro={isPro} onBecomePro={() => setShowProModal(true)} onOpenShowcase={() => setShowModal(true)} adminBadgeCount={adminBadgeCount} averageRating={averageRating}/>
          </aside>
          {isSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40 flex">
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
              <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-950"><SidebarContent view={view} setView={setView} filaments={filaments} lowStockCount={totalLowStock} onClose={() => setSidebarOpen(false)} t={t} appVersion={APP_VERSION} isOffline={isOffline} onLogout={handleLogout} isAdmin={isAdmin} isPro={isPro} onBecomePro={() => setShowProModal(true)} onOpenShowcase={() => setShowModal(true)} adminBadgeCount={adminBadgeCount} averageRating={averageRating}/></div>
            </div>
          )}
          <main className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all ${isDesktopSidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>
             <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3">
                   <button onClick={() => window.innerWidth >= 1024 ? toggleDesktopSidebar() : setSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><Menu size={24} /></button>
                   <div className={`flex items-center gap-3 ${isDesktopSidebarOpen ? 'lg:hidden' : ''}`}><div className="w-8 h-8"><Logo className="w-full h-full" /></div><h1 className="font-bold text-lg truncate">Filament Manager</h1></div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={toggleSnow} className={`p-2 rounded-full transition-colors ${isSnowEnabled ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/30' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Snowflake size={20} /></button>
                    <div className="relative" ref={notificationRef}>
                        <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2 rounded-full relative transition-colors ${showNotifications ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}><Bell size={24} />{(updateAvailable || totalLowStock > 0) && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>}</button>
                    </div>
                </div>
             </div>
             <PullToRefresh onRefresh={handleRefresh} className="flex-1 overflow-auto p-4 md:p-8">
                {view === 'dashboard' && <Dashboard filaments={filaments} materials={materials} onNavigate={setView} isAdmin={isProActive} history={printJobs} isSnowEnabled={isSnowEnabled} onInspectItem={(id) => { setEditingId(id); setShowModal(true); }} onBecomePro={() => setShowProModal(true)} />}
                {view === 'inventory' && <Inventory filaments={filaments} materials={materials} locations={locations} suppliers={suppliers} onEdit={(item, type) => { setEditingId(item.id); type === 'filament' ? setShowModal(true) : setShowMaterialModal(true); }} onQuickAdjust={handleQuickAdjust} onMaterialAdjust={handleMaterialAdjust} onDelete={handleDeleteItem} onNavigate={setView} onShowLabel={(id) => { setEditingId(id); setOpenInLabelMode(true); setShowModal(true); }} threshold={settings.lowStockThreshold} activeGroupKey={activeGroupKey} onSetActiveGroupKey={setActiveGroupKey} isAdmin={isProActive} onAddClick={(type) => { setEditingId(null); type === 'filament' ? setShowModal(true) : setShowMaterialModal(true); }} onUnlockPro={() => setShowProModal(true)} />}
                {view === 'history' && <PrintHistory filaments={filaments} materials={materials} history={printJobs} printers={printers} onSaveJob={handleSavePrintJob} onDeleteJob={handleDeletePrintJob} settings={settings} isAdmin={isProActive} onUnlockPro={() => setShowProModal(true)} />}
                {view === 'printers' && <PrinterManager printers={printers} filaments={filaments} onSave={handleSavePrinter} onDelete={handleDeletePrinter} isAdmin={isProActive} onLimitReached={() => setShowProModal(true)} />}
                {view === 'shopping' && <ShoppingList filaments={filaments} materials={materials} threshold={settings.lowStockThreshold} />}
                {view === 'settings' && <Settings settings={settings} filaments={filaments} onUpdate={handleUpdateSettings} onExport={() => {}} onImport={() => {}} locations={locations} suppliers={suppliers} onSaveLocation={handleSaveLocation} onDeleteLocation={handleDeleteLocation} onSaveSupplier={handleSaveSupplier} onDeleteSupplier={handleDeleteSupplier} onLogout={handleLogout} isAdmin={isProActive} onBecomePro={() => setShowProModal(true)} currentVersion={APP_VERSION} />}
                {view === 'support' && <SupportPage isAdmin={isAdmin} />}
                {view === 'help' && <HelpPage />}
                {view === 'admin' && isAdmin && <AdminPanel />}
             </PullToRefresh>
          </main>
          {showModal && <FilamentForm initialData={editingId ? filaments.find(f => f.id === editingId) : undefined} locations={locations} suppliers={suppliers} existingBrands={uniqueBrands} onSave={handleSaveFilament} onSaveLocation={handleSaveLocation} onSaveSupplier={handleSaveSupplier} onCancel={() => { setShowModal(false); setEditingId(null); setOpenInLabelMode(false); }} initialShowLabel={openInLabelMode} onSetHandlesBackButton={(handles) => {}} />}
          {showMaterialModal && <MaterialForm initialData={editingId ? materials.find(m => m.id === editingId) : undefined} locations={locations} suppliers={suppliers} onSave={handleSaveMaterial} onCancel={() => { setShowMaterialModal(false); setEditingId(null); }} />}
          {showProModal && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-fade-in"><div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border text-center relative"><button onClick={() => setShowProModal(false)} className="absolute top-4 right-4 text-slate-400"><X size={20} /></button><div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600"><HardHat size={32} /></div><h3 className="text-xl font-bold mb-2">{t('proComingSoonTitle')}</h3><p className="text-sm text-slate-500 mb-6 leading-relaxed">{t('proComingSoonMsg')}</p><button onClick={() => setShowProModal(false)} className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl">{t('close')}</button></div></div>}
          {confirmDialog.isOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-fade-in"><div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border"><h3 className="text-xl font-bold mb-2">{confirmDialog.title}</h3><p className="text-sm text-slate-500 mb-6">{confirmDialog.message}</p><div className="flex justify-end gap-3"><button onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 font-bold">{confirmDialog.cancelLabel || t('cancel')}</button><button onClick={confirmDialog.onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold">{confirmDialog.confirmLabel || 'OK'}</button></div></div></div>}
          {showExitToast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg z-[100] animate-fade-in text-sm font-medium">Druk nogmaals om af te sluiten</div>}
        </div>
  );
};

const App = () => {
  return (
    <LanguageProvider>
      <LogoProvider>
        <AppContent />
      </LogoProvider>
    </LanguageProvider>
  );
};

export default App;
