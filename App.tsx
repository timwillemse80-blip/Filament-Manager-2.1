
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
import { FeedbackPage } from './components/FeedbackPage';
import { ShowcasePreview } from './components/ShowcasePreview';
import { ShowcaseModal } from './components/ShowcaseModal'; 
import { AuthScreen } from './components/AuthScreen';
import { AdminPanel } from './components/AdminPanel';
import { PullToRefresh } from './components/PullToRefresh';
import { ProModal } from './components/ProModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { NotificationPage } from './components/NotificationPage';
import { PrintPreview } from './components/PrintPreview';
import { LabelModal } from './components/LabelModal';
import { Package, Plus, MapPin, Truck, Settings as SettingsIcon, Bell, Menu, X, ShoppingCart, LogOut, AlertTriangle, Download, RefreshCw, PartyPopper, WifiOff, History, CheckCircle2, Printer as PrinterIcon, LayoutDashboard, Sparkles, ChevronLeft, Lock, ShieldCheck, Coffee, Snowflake, MessageSquare, ThumbsUp, Clock, Globe, PanelLeftClose, PanelLeftOpen, Crown, Hammer, LifeBuoy, Star, Box, AlertCircle, HardHat, Shield, QrCode, ArrowLeft } from 'lucide-react';
import { Logo } from './components/Logo';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from './services/supabase';
import { LanguageProvider as LanguageContextProvider, useLanguage } from './contexts/LanguageContext';
import { LogoProvider } from './contexts/LogoContext';
import { DISCORD_INVITE_URL } from './constants';

const generateShortId = () => Math.random().toString(36).substring(2, 6).toUpperCase();

const APP_VERSION = "2.1.34"; 
const ADMIN_EMAILS = ["timwillemse@hotmail.com"];

interface NavButtonProps {
  view: ViewState;
  setView: (view: ViewState) => void;
  target: ViewState;
  icon: React.ReactNode;
  label: string;
  count?: number;
  onClick?: () => void;
  className?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ 
  view, setView, target, icon, label, count, onClick, className 
}) => (
  <button 
    onClick={() => {
      setView(target);
      if (onClick) onClick();
    }}
    className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-sm font-medium ${
      view === target 
        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white hover:bg-slate-50 dark:hover:bg-slate-800'
    } ${className || ''}`}
    title={label} 
  >
    <span className="mt-0.5 shrink-0">{icon}</span>
    <span className="text-left flex-1 break-words">{label}</span>
    {count !== undefined && count > 0 && (
      <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center shadow-sm shrink-0">
        {count}
      </span>
    )}
  </button>
);

interface MenuHeaderProps {
  children: React.ReactNode;
}

const MenuHeader: React.FC<MenuHeaderProps> = ({ children }) => (
  <div className="px-3 mt-6 mb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] select-none">
    {children}
  </div>
);

interface SidebarContentProps {
  view: ViewState;
  setView: (view: ViewState) => void;
  filaments: Filament[];
  lowStockCount: number;
  onClose: () => void;
  t: (key: string) => string;
  isAdmin: boolean;
  isPremium: boolean;
  onBecomePro: () => void;
  onOpenShowcase: () => void;
  adminBadgeCount: number;
  avgRating: number;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ 
  view, setView, filaments, lowStockCount, onClose, t, isAdmin, isPremium,
  onBecomePro, onOpenShowcase, adminBadgeCount, avgRating 
}) => {
  return (
    <div className="flex flex-col h-full p-4 pb-8 lg:p-6 lg:pb-12 overflow-x-hidden">
      <div className="flex justify-between items-center mb-4 lg:hidden">
         <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <Logo className="w-full h-full" />
          </div>
          <h2 className="font-bold text-lg dark:text-white text-slate-800">{t('menu')}</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"><X size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <MenuHeader>{t('menuManagement')}</MenuHeader>
        <div className="space-y-1">
          <NavButton onClick={onClose} view={view} setView={setView} target="dashboard" icon={<LayoutDashboard size={18} className="text-blue-500" />} label={t('dashboard')} />
          <NavButton onClick={onClose} view={view} setView={setView} target="inventory" icon={<Package size={18} className="text-violet-500" />} label={t('inventory')} />
          <NavButton onClick={onClose} view={view} setView={setView} target="history" icon={<History size={18} className="text-emerald-500" />} label={t('printHistory')} />
          <NavButton onClick={onClose} view={view} setView={setView} target="printers" icon={<PrinterIcon size={18} className="text-pink-500" />} label={t('printers')} />
        </div>

        <MenuHeader>{t('menuTools')}</MenuHeader>
        <div className="space-y-1">
          <NavButton onClick={onClose} view={view} setView={setView} target="shopping" icon={<ShoppingCart size={18} className="text-orange-500" />} label={t('shopping')} count={lowStockCount} />
          <NavButton onClick={onClose} view={view} setView={setView} target="print-preview" icon={<QrCode size={18} className="text-blue-400" />} label={t('printPreview')} />
        </div>

        <MenuHeader>{t('menuPremium')}</MenuHeader>
        <div className="space-y-2 px-1">
          <button
              onClick={() => {
                  onClose();
                  if(!isPremium) onBecomePro();
                  else onOpenShowcase();
              }}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white hover:bg-slate-50 dark:hover:bg-slate-800 group`}
          >
              <span className="mt-0.5 shrink-0"><Globe size={18} className="text-cyan-500" /></span>
              <span className="flex-1 text-left break-words">{t('showcaseTitle')}</span>
              <span className="ml-2 flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 shadow-sm uppercase tracking-tighter">PRO</span>
                {!isPremium && <Lock size={12} className="text-slate-400 group-hover:text-amber-500 transition-colors" />}
              </span>
          </button>

          {!isPremium && (
            <button 
              onClick={() => {
                onClose();
                onBecomePro();
              }} 
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-md transform active:scale-[0.98]"
            >
              <Crown size={18} fill="currentColor" className="shrink-0" />
              <span className="flex-1 text-left"> {t('becomePro')}</span>
            </button>
          )}
          {isPremium && !isAdmin && (
            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-3">
               <Crown size={16} className="text-amber-500" fill="currentColor" />
               <span className="text-xs font-bold text-amber-700 dark:text-amber-400">PRO Membership Active</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 pb-2">
         <NavButton onClick={onClose} view={view} setView={setView} target="support" icon={<Coffee size={18} className="text-amber-500" />} label={t('supportTitle')} className={view !== 'support' ? "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}/>
         
         <div className="flex items-center gap-1 group">
            <NavButton onClick={onClose} view={view} setView={setView} target="settings" icon={<SettingsIcon size={18} className="text-slate-500 dark:text-slate-400" />} label={t('settings')} />
            {isAdmin && (
              <button 
                onClick={() => { onClose(); setView('admin'); }}
                className={`p-2 rounded-lg transition-all flex-shrink-0 ${view === 'admin' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'}`}
                title={t('admin')}
              >
                <ShieldCheck size={20} />
                {adminBadgeCount > 0 && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></div>}
              </button>
            )}
         </div>
         
         <button 
            onClick={() => {
              onClose();
              setView('feedback');
            }}
            className="w-full mx-0 mt-2 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-800 group"
         >
            <div className="flex gap-1 mb-1">
               {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={14} fill={s <= Math.round(avgRating || 5) ? "#fbbf24" : "none"} className={`transition-transform group-hover:scale-110 ${s <= Math.round(avgRating || 5) ? "text-amber-400" : "text-slate-300 dark:text-slate-700"}`} style={{ transitionDelay: `${s * 50}ms` }} />
               ))}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
               {t('userRatingText')} <span className="text-amber-500 dark:text-amber-400 ml-0.5">{(avgRating || 5.0).toFixed(1)}</span>
            </p>
         </button>

        <div className="flex flex-col items-center pt-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest opacity-80 text-center">
          <span>{t('madeBy')}</span>
          <span>Tim_of_Tom</span>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { t, tColor } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [materials, setMaterials] = useState<OtherMaterial[]>([]); 
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]); 
  const [printers, setPrinters] = useState<Printer[]>([]); 
  const [globalBrands, setGlobalBrands] = useState<string[]>([]);
  const [globalMaterials, setGlobalMaterials] = useState<string[]>([]);
  const [spoolWeights, setSpoolWeights] = useState<any[]>([]);
  const [adminBadgeCount, setAdminBadgeCount] = useState(0);
  const [avgRating, setAvgRating] = useState<number>(5.0);
  const [pendingScanCode, setPendingScanCode] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('filament_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return { 
      lowStockThreshold: 20, 
      theme: 'dark', 
      unusedWarningDays: 90, 
      enableWeeklyEmail: false, 
      enableUpdateNotifications: true,
      electricityRate: 0.35,
      hourlyRate: 2.0,
      profitMargin: 20,
      roundToNine: true
    };
  });

  const [view, setView] = useState<ViewState>('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [showLabelOnly, setShowLabelOnly] = useState(false); 
  const [showMaterialModal, setShowMaterialModal] = useState(false); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isSnowEnabled, setIsSnowEnabled] = useState(true);
  const [showProModal, setShowProModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false); 
  const [updateInfo, setUpdateInfo] = useState<{ version: string, notes: string, downloadUrl?: string } | null>(null);
  
  const [showBackToast, setShowBackToast] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);

  const [viewingJob, setViewingJob] = useState<PrintJob | null>(null);

  const [showShowcaseModal, setShowShowcaseModal] = useState(false);
  const [showShowcasePreview, setShowShowcasePreview] = useState(false);
  const [previewFilters, setPreviewFilters] = useState<string[]>([]);
  const [publicViewData, setPublicViewData] = useState<{ filaments: Filament[], name?: string, filters?: string[] } | null>(null);

  useEffect(() => {
    localStorage.setItem('filament_settings', JSON.stringify(settings));
  }, [settings]);

  const viewRef = useRef(view);
  const isSidebarOpenRef = useRef(isSidebarOpen);
  const showModalRef = useRef(showModal);
  const showMaterialModalRef = useRef(showMaterialModal);
  const showProModalRef = useRef(showProModal);
  const showShowcaseModalRef = useRef(showShowcaseModal);
  const showShowcasePreviewRef = useRef(showShowcasePreview);
  const showWelcomeRef = useRef(showWelcome);
  const showExitConfirmRef = useRef(showExitConfirm);
  const activeGroupKeyRef = useRef(activeGroupKey);
  const viewingJobRef = useRef(viewingJob);
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    viewRef.current = view;
    isSidebarOpenRef.current = isSidebarOpen;
    showModalRef.current = showModal;
    showMaterialModalRef.current = showMaterialModal;
    showProModalRef.current = showProModal;
    showShowcaseModalRef.current = showShowcaseModal;
    showShowcasePreviewRef.current = showShowcasePreview;
    showWelcomeRef.current = showWelcome;
    showExitConfirmRef.current = showExitConfirm;
    activeGroupKeyRef.current = activeGroupKey;
    viewingJobRef.current = viewingJob;
  }, [view, isSidebarOpen, showModal, showMaterialModal, showProModal, showShowcaseModal, showShowcasePreview, showWelcome, showExitConfirm, activeGroupKey, viewingJob]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Listener voor Deep Linking (QR code scans die de app openen)
    const urlListener = CapacitorApp.addListener('appUrlOpen', data => {
      const url = data.url;
      if (url.startsWith('filament://')) {
        const code = url.split('://')[1]?.toUpperCase();
        if (code) {
           setPendingScanCode(code);
        }
      }
    });

    const backButtonListener = CapacitorApp.addListener('backButton', () => {
      if (showExitConfirmRef.current) {
        setShowExitConfirm(false);
        return;
      }
      if (showWelcomeRef.current) {
        setShowWelcome(false);
        return;
      }
      if (showProModalRef.current) {
        setShowProModal(false);
        return;
      }
      if (showShowcasePreviewRef.current) {
        setShowShowcasePreview(false);
        return;
      }
      if (showShowcaseModalRef.current) {
        setShowShowcaseModal(false);
        return;
      }
      if (showModalRef.current) {
        setShowModal(false);
        setEditingId(null);
        setShowLabelOnly(false);
        return; 
      }
      if (showMaterialModalRef.current) {
        setShowMaterialModal(false);
        setEditingId(null);
        return;
      }
      if (viewingJobRef.current) {
        setViewingJob(null);
        return;
      }
      if (isSidebarOpenRef.current) {
        setSidebarOpen(false);
        return;
      }
      if (viewRef.current === 'inventory' && activeGroupKeyRef.current) {
        setActiveGroupKey(null);
        return;
      }
      if (viewRef.current !== 'dashboard') {
        setView('dashboard');
        lastBackPressRef.current = 0;
        return;
      }
      if (viewRef.current === 'dashboard') {
        const now = Date.now();
        const BACK_PRESS_TIMEOUT = 2000;
        if (now - lastBackPressRef.current < BACK_PRESS_TIMEOUT) {
            setShowExitConfirm(true);
            setShowBackToast(false);
            if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
        } else {
            lastBackPressRef.current = now;
            setShowBackToast(true);
            if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = window.setTimeout(() => setShowBackToast(false), BACK_PRESS_TIMEOUT);
        }
      }
    });

    return () => {
      backButtonListener.then(l => l.remove());
      urlListener.then(l => l.remove());
    };
  }, []);

  // Effect om pending scans af te handelen zodra filaments geladen zijn
  useEffect(() => {
    if (pendingScanCode && filaments.length > 0) {
       const match = filaments.find(f => f.shortId?.toUpperCase() === pendingScanCode || f.id.startsWith(pendingScanCode));
       if (match) {
          setEditingId(match.id);
          setShowModal(true);
          setView('inventory');
       } else {
          console.warn("Scan code matched no inventory items:", pendingScanCode);
       }
       setPendingScanCode(null);
    }
  }, [pendingScanCode, filaments]);

  const isAdmin = useMemo(() => {
     const email = session?.user?.email?.toLowerCase();
     return email && ADMIN_EMAILS.includes(email);
  }, [session]);

  const isPremium = useMemo(() => isAdmin || isPro, [isAdmin, isPro]);

  const existingBrands = useMemo(() => {
    return Array.from(new Set(filaments.map(f => f.brand)));
  }, [filaments]);

  const fetchData = async (uid?: string) => {
    const userId = uid || session?.user?.id;
    if (!userId) return;
    try {
      const { data: pData } = await supabase.from('profiles').select('is_pro').eq('id', userId).single();
      if (pData) setIsPro(pData.is_pro);

      const { data: fData } = await supabase.from('filaments').select('*').eq('user_id', userId);
      if (fData) setFilaments(fData);
      const { data: mData } = await supabase.from('other_materials').select('*').eq('user_id', userId);
      if (mData) setMaterials(mData);
      const { data: lData } = await supabase.from('locations').select('*').eq('user_id', userId);
      if (lData) setLocations(lData);
      const { data: sData } = await supabase.from('suppliers').select('*').eq('user_id', userId);
      if (sData) setSuppliers(sData);
      const { data: jData } = await supabase.from('print_jobs').select('*').eq('user_id', userId);
      if (jData) setPrintJobs(jData);
      const { data: prData } = await supabase.from('printers').select('*').eq('user_id', userId);
      if (prData) setPrinters(prData);
      
      const { data: gbData } = await supabase.from('brands').select('name');
      if (gbData) setGlobalBrands(gbData.map(b => b.name));
      const { data: gmData } = await supabase.from('materials').select('name');
      if (gmData) setGlobalMaterials(gmData.map(m => m.name));
      
      const { data: swData } = await supabase.from('spool_weights').select('*').order('name');
      if (swData) setSpoolWeights(swData);

      const { data: feedbackData } = await supabase.from('feedback').select('rating');
      if (feedbackData && feedbackData.length > 0) {
         const rated = feedbackData.filter(f => f.rating > 0);
         if (rated.length > 0) {
            const sum = rated.reduce((acc, f) => acc + f.rating, 0);
            setAvgRating(sum / rated.length);
         }
      }
    } catch (error) { console.error('Error fetching data:', error); }
  };

  useEffect(() => {
    let profileSubscription: any = null;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        fetchData(s.user.id);
        profileSubscription = supabase
          .channel(`public:profiles:id=eq.${s.user.id}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles',
            filter: `id=eq.${s.user.id}`
          }, payload => {
            const wasPro = isPro;
            setIsPro(payload.new.is_pro);
            if (payload.new.is_pro && !wasPro) {
               alert("Congratulations! Your account has just been upgraded to PRO.");
            }
          })
          .subscribe();
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) fetchData(s.user.id);
      else {
        setFilaments([]);
        setIsPro(false);
        if (profileSubscription) supabase.removeChannel(profileSubscription);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (profileSubscription) supabase.removeChannel(profileSubscription);
    };
  }, []);

  const handleSaveFilament = async (filament: Filament | Filament[]) => {
    const userId = session?.user?.id;
    if (!userId) return;
    try {
      const items = Array.isArray(filament) ? filament : [filament];
      const payload = items.map(item => ({
        ...item,
        user_id: userId,
        shortId: item.shortId || generateShortId()
      }));
      const { error } = await supabase.from('filaments').upsert(payload);
      if (error) throw error;
      setShowModal(false);
      setEditingId(null);
      fetchData();
    } catch (e: any) { alert("Error saving: " + e.message); }
  };

  const handleSaveMaterial = async (material: OtherMaterial) => {
    const userId = session?.user?.id;
    if (!userId) return;
    try {
      const { error } = await supabase.from('other_materials').upsert({ ...material, user_id: userId });
      if (error) throw error;
      setShowMaterialModal(false);
      setEditingId(null);
      fetchData();
    } catch (e: any) { alert("Error saving: " + e.message); }
  };

  const handleSavePrinter = async (printer: Printer) => {
    const userId = session?.user?.id;
    if (!userId) return;
    try {
      const { error } = await supabase.from('printers').upsert({ ...printer, user_id: userId });
      if (error) throw error;
      fetchData();
    } catch (e: any) { alert("Error saving printer: " + e.message); }
  };

  const handleDeletePrinter = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      const { error } = await supabase.from('printers').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) { alert("Error deleting printer: " + e.message); }
  };

  const handleSaveLocation = async (loc: Location) => {
    const userId = session?.user?.id;
    if (!userId) return;
    try {
      const { error } = await supabase.from('locations').upsert({ ...loc, user_id: userId });
      if (error) throw error;
      fetchData();
    } catch (e: any) { alert("Error saving location: " + e.message); }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) { alert("Error deleting location: " + e.message); }
  };

  const handleSaveSupplier = async (sup: Supplier) => {
    const userId = session?.user?.id;
    if (!userId) return;
    try {
      const { error } = await supabase.from('suppliers').upsert({ ...sup, user_id: userId });
      if (error) throw error;
      fetchData();
    } catch (e: any) { alert("Error saving supplier: " + e.message); }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) { alert("Error deleting supplier: " + e.message); }
  };

  const handleDeleteItem = async (id: string, type: 'filament' | 'material') => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      const table = type === 'filament' ? 'filaments' : 'other_materials';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) { alert("Error deleting: " + e.message); }
  };

  const handleBatchDelete = async (ids: string[], type: 'filament' | 'material') => {
    if (!confirm(`Are you sure you want to delete these ${ids.length} items?`)) return;
    try {
      const table = type === 'filament' ? 'filaments' : 'other_materials';
      const { error } = await supabase.from(table).delete().in('id', ids);
      if (error) throw error;
      fetchData();
    } catch (e: any) { alert("Batch delete failed: " + e.message); }
  };

  const handleQuickAdjust = async (id: string, amount: number) => {
    const filament = filaments.find(f => f.id === id);
    if (!filament) return;
    const newWeight = Math.max(0, filament.weightRemaining - amount);
    try {
      const { error } = await supabase.from('filaments').update({ weightRemaining: newWeight }).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) { console.error(e); }
  };

  const handleMaterialAdjust = async (id: string, amount: number) => {
    const mat = materials.find(m => m.id === id);
    if (!mat) return;
    const newQty = Math.max(0, mat.quantity + amount);
    try {
      const { error } = await supabase.from('other_materials').update({ quantity: newQty }).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) { console.error(e); }
  };

  const handleSaveJob = async (job: PrintJob, filamentDeductions: { id: string, amount: number }[]) => {
    const userId = session?.user?.id;
    if (!userId) return;
    try {
      const sanitizedJob = {
        ...job,
        user_id: userId,
        printerId: job.printerId === '' ? null : job.printerId
      };
      const { error: jobError } = await supabase.from('print_jobs').insert(sanitizedJob);
      if (jobError) throw jobError;
      const stockUpdates: Promise<any>[] = [];
      for (const deduction of filamentDeductions) {
        const filament = filaments.find(f => f.id === deduction.id);
        if (filament) {
          const newWeight = Math.max(0, filament.weightRemaining - deduction.amount);
          stockUpdates.push(supabase.from('filaments').update({ weightRemaining: newWeight }).eq('id', deduction.id));
        }
      }
      if (job.usedOtherMaterials) {
        for (const usedMat of job.usedOtherMaterials) {
          const material = materials.find(m => m.id === usedMat.materialId);
          if (material) {
            const newQty = Math.max(0, material.quantity - usedMat.quantity);
            stockUpdates.push(supabase.from('other_materials').update({ quantity: newQty }).eq('id', usedMat.materialId));
          }
        }
      }
      await Promise.all(stockUpdates);
      fetchData();
    } catch (e: any) { alert("Fout bij opslaan: " + e.message); }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      const job = printJobs.find(j => j.id === id);
      if (!job) return;
      const stockUpdates: Promise<any>[] = [];
      if (job.usedFilaments) {
        for (const uf of job.usedFilaments) {
          const filament = filaments.find(f => f.id === uf.filamentId);
          if (filament) {
            const newWeight = filament.weightRemaining + uf.amount;
            stockUpdates.push(supabase.from('filaments').update({ weightRemaining: newWeight }).eq('id', uf.filamentId));
          }
        }
      }
      if (job.usedOtherMaterials) {
        for (const um of job.usedOtherMaterials) {
          const material = materials.find(m => m.id === um.materialId);
          if (material) {
            const newQty = material.quantity + um.quantity;
            stockUpdates.push(supabase.from('other_materials').update({ quantity: newQty }).eq('id', um.materialId));
          }
        }
      }
      if (stockUpdates.length > 0) await Promise.all(stockUpdates);
      const { error } = await supabase.from('print_jobs').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) { alert("Fout bij verwijderen: " + e.message); }
  };

  const totalLowStock = filaments.filter(f => (f.weightRemaining / f.weightTotal) * 100 <= settings.lowStockThreshold).length + materials.filter(m => m.minStock && m.quantity <= m.minStock).length;
  const editingFilament = useMemo(() => filaments.find(f => f.id === editingId), [editingId, filaments]);
  const editingMaterial = useMemo(() => materials.find(m => m.id === editingId), [editingId, materials]);

  if (isLoading) return <div className="h-screen w-full flex items-center justify-center dark:bg-slate-900"><RefreshCw className="animate-spin text-blue-600" size={48} /></div>;
  if (!session) return <AuthScreen onOfflineLogin={() => {}} />;

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900 flex">
      <aside className={`hidden lg:flex flex-col w-72 bg-white dark:bg-slate-950 border-r dark:border-slate-800 transition-all duration-300 ${isDesktopSidebarOpen ? 'translate-x-0' : '-translate-x-full w-0 overflow-hidden'}`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b dark:border-slate-800">
          <Logo className="w-8 h-8 shrink-0" />
          <span className="font-bold text-lg dark:text-white truncate">Filament Manager</span>
        </div>
        <SidebarContent 
          view={view} setView={setView} filaments={filaments} lowStockCount={totalLowStock} onClose={() => {}} t={t} isAdmin={isAdmin} isPremium={isPremium}
          onBecomePro={() => setShowProModal(true)} onOpenShowcase={() => setShowShowcaseModal(true)} adminBadgeCount={adminBadgeCount} avgRating={avgRating} 
        />
      </aside>

      {isSidebarOpen && (
        <div className="lg:hidden inset-0 z-40 flex fixed">
          <div className="bg-black/60 inset-0 backdrop-blur-sm fixed" onClick={() => setSidebarOpen(false)}></div>
          <div className="bg-white dark:bg-slate-950 w-80 h-full relative">
            <SidebarContent 
              view={view} setView={setView} filaments={filaments} lowStockCount={totalLowStock} onClose={() => setSidebarOpen(false)} t={t} isAdmin={isAdmin} isPremium={isPremium}
              onBecomePro={() => setShowProModal(true)} onOpenShowcase={() => setShowShowcaseModal(true)} adminBadgeCount={adminBadgeCount} avgRating={avgRating} 
            />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 justify-between gap-2">
          <div className="flex items-center gap-1">
             <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500"><Menu size={24} /></button>
             {view !== 'dashboard' && (
                <button onClick={() => { if (activeGroupKey) setActiveGroupKey(null); else setView('dashboard'); }} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors" title={t('back')}>
                   <ChevronLeft size={24} strokeWidth={3} />
                </button>
             )}
          </div>
          <h1 className="dark:text-white flex-1 font-bold px-2 truncate text-center md:text-left">{t(view)}</h1>
          <div className="shrink-0 flex items-center gap-1">
             <button onClick={() => setView('notifications')} className={`p-2 rounded-full relative transition-colors ${updateInfo ? 'text-blue-600' : 'text-slate-400'}`} title="Notifications">
                <Bell size={20} className={updateInfo ? 'animate-pulse' : ''} />
             </button>
             <button onClick={() => setIsSnowEnabled(!isSnowEnabled)} className={`p-2 rounded-full transition-colors ${isSnowEnabled ? 'bg-sky-100 text-sky-600' : 'text-slate-400'}`} title={t('winterEdition')}>
                <Snowflake size={20} />
             </button>
          </div>
        </header>

        <PullToRefresh onRefresh={() => fetchData()} className="flex-1 p-4 md:p-8 overflow-auto">
           {view === 'dashboard' && <Dashboard filaments={filaments} materials={materials} onNavigate={setView} isAdmin={isPremium} history={printJobs} isSnowEnabled={isSnowEnabled} onBecomePro={() => setShowProModal(true)} onInspectItem={(id) => { setEditingId(id); setView('inventory'); setActiveGroupKey(null); }} />}
           {view === 'inventory' && <Inventory filaments={filaments} materials={materials} locations={locations} suppliers={suppliers} onEdit={(item, type) => { setEditingId(item.id); type === 'filament' ? setShowModal(true) : setShowMaterialModal(true); }} onQuickAdjust={handleQuickAdjust} onMaterialAdjust={handleMaterialAdjust} onDelete={handleDeleteItem} onBatchDelete={handleBatchDelete} onNavigate={setView} onShowLabel={(id) => { setEditingId(id); setShowLabelOnly(true); }} threshold={settings.lowStockThreshold} activeGroupKey={activeGroupKey} onSetActiveGroupKey={setActiveGroupKey} isAdmin={isPremium} onAddClick={(type) => { setEditingId(null); type === 'filament' ? setShowModal(true) : setShowMaterialModal(true); }} onUnlockPro={() => setShowProModal(true)} />}
           {view === 'history' && <PrintHistory filaments={filaments} materials={materials} history={printJobs} printers={printers} onSaveJob={handleSaveJob} onDeleteJob={handleDeleteJob} settings={settings} isAdmin={isPremium} onUnlockPro={() => setShowProModal(true)} viewingJob={viewingJob} setViewingJob={setViewingJob} />}
           {view === 'printers' && <PrinterManager printers={printers} filaments={filaments} onSave={handleSavePrinter} onDelete={handleDeletePrinter} isAdmin={isPremium} onLimitReached={() => setShowProModal(true)} />}
           {view === 'shopping' && <ShoppingList filaments={filaments} materials={materials} threshold={settings.lowStockThreshold} />}
           {view === 'notifications' && <NotificationPage updateInfo={updateInfo} />}
           {view === 'admin' && isAdmin && <AdminPanel onClose={() => setView('dashboard')} />}
           {view === 'settings' && <Settings settings={settings} filaments={filaments} onUpdate={setSettings} onExport={() => {}} onImport={() => {}} locations={locations} suppliers={suppliers} onSaveLocation={handleSaveLocation} onDeleteLocation={handleDeleteLocation} onSaveSupplier={handleSaveSupplier} onDeleteSupplier={handleDeleteSupplier} onLogout={() => supabase.auth.signOut()} isAdmin={isPremium} currentVersion={APP_VERSION} updateInfo={updateInfo} />}
           {view === 'support' && <SupportPage isAdmin={isAdmin} />}
           {view === 'feedback' && <FeedbackPage />}
           {view === 'print-preview' && <PrintPreview filaments={filaments} printers={printers} onNavigate={setView} />}
        </PullToRefresh>
      </main>

      {showModal && <FilamentForm initialData={editingFilament} locations={locations} suppliers={suppliers} existingBrands={existingBrands} spoolWeights={spoolWeights} onSave={handleSaveFilament} onSaveLocation={() => fetchData()} onSaveSupplier={() => fetchData()} onCancel={() => { setShowModal(false); setEditingId(null); }} isAdmin={isAdmin} />}
      {showLabelOnly && editingFilament && <LabelModal filament={editingFilament} onClose={() => { setShowLabelOnly(false); setEditingId(null); }} />}
      {showMaterialModal && <MaterialForm initialData={editingMaterial} locations={locations} suppliers={suppliers} onSave={handleSaveMaterial} onCancel={() => { setShowMaterialModal(false); setEditingId(null); }} />}
      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}
      {showShowcaseModal && isPremium && <ShowcaseModal filaments={filaments} settings={settings} onUpdateSettings={setSettings} onClose={() => setShowShowcaseModal(false)} onPreview={(filters) => { setPreviewFilters(filters); setShowShowcasePreview(true); }} userId={session.user.id} />}
      {showShowcasePreview && <ShowcasePreview filaments={filaments} onClose={() => setShowShowcasePreview(false)} publicName={settings.showcasePublicName} initialFilters={previewFilters} isAdminPreview={true} />}
    </div>
  );
};

const App = () => (
  <LanguageContextProvider>
    <LogoProvider>
      <AppContent />
    </LogoProvider>
  </LanguageContextProvider>
);

export default App;
