
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
import { Package, Plus, MapPin, Truck, Settings as SettingsIcon, Bell, Menu, X, ShoppingCart, LogOut, AlertTriangle, Download, RefreshCw, PartyPopper, WifiOff, History, CheckCircle2, Printer as PrinterIcon, LayoutDashboard, Sparkles, ChevronLeft, Lock, ShieldCheck, Coffee, Snowflake, MessageSquare, ThumbsUp, Clock, Globe, PanelLeftClose, PanelLeftOpen, Crown, Hammer, LifeBuoy, Star, Box, AlertCircle, HardHat, Shield, QrCode, ArrowLeft, ChevronRight } from 'lucide-react';
import { Logo } from './components/Logo';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from './services/supabase';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LogoProvider } from './contexts/LogoContext';
import { DISCORD_INVITE_URL } from './constants';

const generateShortId = () => Math.random().toString(36).substring(2, 6).toUpperCase();

const APP_VERSION = "2.2.0"; 
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
               <span className="text-xs font-bold text-amber-700 dark:text-amber-400">PRO Lidmaatschap Actief</span>
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
  const { t, tColor, language } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [materials, setMaterials] = useState<OtherMaterial[]>([]); 
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]); 
  const [printers, setPrinters] = useState<Printer[]>([]); 
  const [adminBadgeCount, setAdminBadgeCount] = useState(0);
  const [avgRating, setAvgRating] = useState<number>(5.0);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const defaultSettings: AppSettings = { 
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
    const saved = localStorage.getItem('filament_settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return defaultSettings;
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
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  
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
        return;
      }

      if (viewRef.current === 'dashboard') {
        setShowExitConfirm(true);
      }
    });

    return () => {
      backButtonListener.then(l => l.remove());
    };
  }, []);

  const isAdmin = useMemo(() => {
     const email = session?.user?.email?.toLowerCase();
     return email && ADMIN_EMAILS.includes(email);
  }, [session]);

  const isPremium = useMemo(() => isAdmin || isPro, [isAdmin, isPro]);

  const existingBrands = useMemo(() => {
    return Array.from(new Set(filaments.map(f => f.brand)));
  }, [filaments]);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('filament_welcome_seen');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }

    const checkUpdates = async () => {
      try {
        const res = await fetch('/version.json');
        const data = await res.json();
        if (data.version && data.version !== APP_VERSION) {
          const translatedNotes = typeof data.releaseNotes === 'object' 
            ? (data.releaseNotes[language] || data.releaseNotes['en'] || "")
            : data.releaseNotes;

          setUpdateInfo({ 
            version: data.version, 
            notes: translatedNotes,
            downloadUrl: data.downloadUrl
          });
          
          if (settings.enableUpdateNotifications) {
            setShowUpdateToast(true);
            setTimeout(() => setShowUpdateToast(false), 5000);
          }
        }
      } catch (e) {
        console.warn("Update check failed", e);
      }
    };
    checkUpdates();

    const params = new URLSearchParams(window.location.search);
    const shopId = params.get('shop');
    if (shopId) {
      const fetchPublicStock = async () => {
        setIsLoading(true);
        try {
          const { data: fData } = await supabase.from('filaments').select('*').eq('user_id', shopId);
          const { data: sData } = await supabase.from('profiles').select('showcase_name').eq('id', shopId).single();
          
          if (fData) {
            const filters = params.get('materials')?.split(',') || [];
            setPublicViewData({
              filaments: fData,
              name: sData?.showcase_name || 'Gedeelde Voorraad',
              filters: filters
            });
          }
        } catch (e) {
          console.error("Public fetch error", e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPublicStock();
    }

    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive && session?.user?.id) {
        fetchData(session.user.id);
      }
    });

    CapacitorApp.addListener('appUrlOpen', (data: any) => {
       const url = data.url;
       if (url.startsWith('filament://')) {
          const shortId = url.split('filament://')[1];
          if (shortId) {
             handleSpoolDeepLink(shortId);
          }
       }
    });

  }, [session, settings.enableUpdateNotifications, language]);

  const handleSpoolDeepLink = (shortId: string) => {
     const spool = filaments.find(f => f.shortId?.toLowerCase() === shortId.toLowerCase());
     if (spool) {
        setEditingId(spool.id);
        setView('inventory');
        setShowModal(true);
     }
  };

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
               alert("Gefeliciteerd! Je account is zojuist geupgrade naar PRO. Alle functies zijn nu ontgrendeld.");
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
  }, [isPro]);

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
    } catch (e: any) {
      alert("Fout bij opslaan: " + e.message);
    }
  };

  const handleSaveMaterial = async (material: OtherMaterial) => {
    const userId = session?.user?.id;
    if (!userId) return;

    try {
      const { error } = await supabase.from('other_materials').upsert({
        ...material,
        user_id: userId
      });
      if (error) throw error;
      
      setShowMaterialModal(false);
      setEditingId(null);
      fetchData();
    } catch (e: any) {
      alert("Fout bij opslaan: " + e.message);
    }
  };

  const handleDeleteItem = async (id: string, type: 'filament' | 'material') => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      const table = type === 'filament' ? 'filaments' : 'other_materials';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) {
      alert("Fout bij verwijderen: " + e.message);
    }
  };

  const handleBatchDelete = async (ids: string[], type: 'filament' | 'material') => {
    if (!confirm(`Weet je zeker dat je deze ${ids.length} items wilt verwijderen?`)) return;
    try {
      const table = type === 'filament' ? 'filaments' : 'other_materials';
      const { error } = await supabase.from(table).delete().in('id', ids);
      if (error) throw error;
      fetchData();
    } catch (e: any) {
      alert("Batch verwijderen mislukt: " + e.message);
    }
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

  const lowStockFilaments = filaments.filter(f => (f.weightRemaining / f.weightTotal) * 100 <= settings.lowStockThreshold);
  const lowStockMaterials = materials.filter(m => m.minStock !== undefined && m.minStock > 0 && m.quantity <= m.minStock);
  const totalLowStock = lowStockFilaments.length + lowStockMaterials.length;

  const updateBadgeCount = (settings.enableUpdateNotifications && updateInfo) ? 1 : 0;

  const editingFilament = useMemo(() => filaments.find(f => f.id === editingId), [editingId, filaments]);
  const editingMaterial = useMemo(() => materials.find(m => m.id === editingId), [editingId, materials]);

  const handleCloseWelcome = () => {
    localStorage.setItem('filament_welcome_seen', 'true');
    setShowWelcome(false);
  };

  if (isLoading) return <div className="h-screen w-full flex items-center justify-center dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div>;
  
  if (publicViewData) {
    return (
      <ShowcasePreview 
        filaments={publicViewData.filaments} 
        onClose={() => setPublicViewData(null)} 
        publicName={publicViewData.name}
        initialFilters={publicViewData.filters}
      />
    );
  }

  if (!session) return <AuthScreen onOfflineLogin={() => {}} />;

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-900 flex">
      <aside className={`hidden lg:flex flex-col w-72 bg-white dark:bg-slate-950 border-r dark:border-slate-800 transition-all duration-300 ${isDesktopSidebarOpen ? 'translate-x-0' : '-translate-x-full w-0 overflow-hidden'}`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b dark:border-slate-800">
          <Logo className="w-8 h-8 shrink-0" />
          <span className="font-bold text-lg dark:text-white truncate">Filament Manager</span>
        </div>
        <SidebarContent 
          view={view} 
          setView={setView} 
          filaments={filaments} 
          lowStockCount={totalLowStock} 
          onClose={() => {}} 
          t={t} 
          isAdmin={isAdmin} 
          isPremium={isPremium}
          onBecomePro={() => setShowProModal(true)} 
          onOpenShowcase={() => setShowShowcaseModal(true)} 
          adminBadgeCount={adminBadgeCount} 
          avgRating={avgRating} 
        />
      </aside>

      {isSidebarOpen && (
        <div className="lg:hidden inset-0 z-40 flex fixed">
          <div className="bg-black/60 inset-0 backdrop-blur-sm fixed" onClick={() => setSidebarOpen(false)}></div>
          <div className="bg-white dark:bg-slate-950 w-80 h-full relative">
            <SidebarContent 
              view={view} 
              setView={setView} 
              filaments={filaments} 
              lowStockCount={totalLowStock} 
              onClose={() => setSidebarOpen(false)} 
              t={t} 
              isAdmin={isAdmin} 
              isPremium={isPremium}
              onBecomePro={() => setShowProModal(true)} 
              onOpenShowcase={() => setShowShowcaseModal(true)}
              adminBadgeCount={adminBadgeCount} 
              avgRating={avgRating} 
            />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col h-full">
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
             <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500"><Menu size={24} /></button>
             {view !== 'dashboard' && (
                <button 
                  onClick={() => {
                     if (activeGroupKey) setActiveGroupKey(null);
                     else setView('dashboard');
                  }}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                  title={t('back')}
                >
                   <ChevronLeft size={24} strokeWidth={3} />
                </button>
             )}
          </div>
          <h1 className="dark:text-white flex-1 font-bold px-2 truncate text-center md:text-left">{t(view)}</h1>
          
          <div className="shrink-0 flex items-center gap-1">
             <button 
                onClick={() => setView('notifications')}
                className={`p-2 rounded-full relative transition-colors ${updateBadgeCount > 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title="Meldingen"
             >
                <Bell size={20} className={updateBadgeCount > 0 ? 'animate-pulse' : ''} />
                {updateBadgeCount > 0 && (
                   <span className="bg-blue-500 border-white dark:border-slate-950 border-2 rounded-full w-4 h-4 flex items-center justify-center font-bold text-white text-[10px] absolute top-0 right-0">
                      {updateBadgeCount}
                   </span>
                )}
             </button>

             <button 
                onClick={() => setIsSnowEnabled(!isSnowEnabled)} 
                className={`p-2 rounded-full transition-colors ${isSnowEnabled ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title={t('winterEdition')}
             >
                <Snowflake size={20} />
             </button>
          </div>
        </header>

        <PullToRefresh onRefresh={() => fetchData()} className="flex-1 p-4 md:p-8 overflow-auto">
           {view === 'dashboard' && <Dashboard filaments={filaments} materials={materials} onNavigate={setView} isAdmin={isPremium} history={printJobs} isSnowEnabled={isSnowEnabled} onBecomePro={() => setShowProModal(true)} onInspectItem={(id) => { setEditingId(id); setView('inventory'); setActiveGroupKey(null); }} />}
           {view === 'inventory' && <Inventory filaments={filaments} materials={materials} locations={locations} suppliers={suppliers} onEdit={(item, type) => { setEditingId(item.id); type === 'filament' ? setShowModal(true) : setShowMaterialModal(true); }} onQuickAdjust={handleQuickAdjust} onMaterialAdjust={handleMaterialAdjust} onDelete={handleDeleteItem} onBatchDelete={handleBatchDelete} onNavigate={setView} onShowLabel={(id) => { setEditingId(id); setShowLabelOnly(true); setShowModal(true); }} threshold={settings.lowStockThreshold} activeGroupKey={activeGroupKey} onSetActiveGroupKey={setActiveGroupKey} isAdmin={isPremium} onAddClick={(type) => { setEditingId(null); type === 'filament' ? setShowModal(true) : setShowMaterialModal(true); }} onUnlockPro={() => setShowProModal(true)} />}
           {view === 'history' && <PrintHistory filaments={filaments} materials={materials} history={printJobs} printers={printers} onSaveJob={() => fetchData()} onDeleteJob={() => fetchData()} settings={settings} isAdmin={isPremium} onUnlockPro={() => setShowProModal(true)} viewingJob={viewingJob} setViewingJob={setViewingJob} />}
           {view === 'printers' && <PrinterManager printers={printers} filaments={filaments} onSave={() => fetchData()} onDelete={() => fetchData()} isAdmin={isPremium} onLimitReached={() => setShowProModal(true)} />}
           {view === 'shopping' && <ShoppingList filaments={filaments} materials={materials} threshold={settings.lowStockThreshold} />}
           {view === 'notifications' && <NotificationPage updateInfo={settings.enableUpdateNotifications ? updateInfo : null} />}
           {view === 'admin' && isAdmin && <AdminPanel onClose={() => setView('dashboard')} />}
           {view === 'settings' && <Settings settings={settings} filaments={filaments} onUpdate={setSettings} onExport={() => {}} onImport={() => {}} locations={locations} suppliers={suppliers} onSaveLocation={() => fetchData()} onDeleteLocation={() => fetchData()} onSaveSupplier={() => fetchData()} onDeleteSupplier={() => fetchData()} onLogout={() => supabase.auth.signOut()} isAdmin={isPremium} currentVersion={APP_VERSION} onOpenShowcase={(filters) => { setPreviewFilters(filters || []); setShowShowcasePreview(true); }} onBecomePro={() => setShowProModal(true)} updateInfo={updateInfo} userId={session?.user?.id} />}
           {view === 'support' && <SupportPage isAdmin={isAdmin} />}
           {view === 'feedback' && <FeedbackPage />}
           
           {view === 'print-preview' && (
              <PrintPreview 
                filaments={filaments} 
                printers={printers} 
                onNavigate={setView}
              />
           )}
        </PullToRefresh>
      </main>

      {showModal && (
        <FilamentForm 
          initialData={editingFilament}
          initialShowLabel={showLabelOnly}
          locations={locations}
          suppliers={suppliers}
          existingBrands={existingBrands}
          onSave={handleSaveFilament}
          onSaveLocation={(loc) => fetchData()}
          onSaveSupplier={(sup) => fetchData()}
          onCancel={() => { setShowModal(false); setEditingId(null); setShowLabelOnly(false); }}
        />
      )}

      {showMaterialModal && (
        <MaterialForm 
          initialData={editingMaterial}
          locations={locations}
          suppliers={suppliers}
          onSave={handleSaveMaterial}
          onCancel={() => { setShowMaterialModal(false); setEditingId(null); }}
        />
      )}
      
      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}
      
      {showShowcaseModal && isPremium && (
        <ShowcaseModal 
          filaments={filaments} 
          settings={settings} 
          onUpdateSettings={setSettings} 
          onClose={() => setShowShowcaseModal(false)} 
          onPreview={(filters) => { 
            setPreviewFilters(filters); 
            setShowShowcasePreview(true); 
          }} 
          userId={session.user.id}
        />
      )}

      {showShowcasePreview && (
        <ShowcasePreview 
          filaments={filaments} 
          onClose={() => setShowShowcasePreview(false)} 
          publicName={settings.showcasePublicName}
          initialFilters={previewFilters}
          isAdminPreview={true}
        />
      )}

      {showWelcome && <WelcomeScreen onComplete={handleCloseWelcome} />}

      {showUpdateToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] w-[90%] max-w-sm animate-bounce-in">
           <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-blue-400">
              <div className="flex items-center gap-3">
                 <div className="bg-white/20 p-2 rounded-lg">
                    <Sparkles size={20} />
                 </div>
                 <div>
                    <h4 className="font-bold text-sm">Update Beschikbaar!</h4>
                    <p className="text-[10px] opacity-90">Versie {updateInfo?.version} staat klaar.</p>
                 </div>
              </div>
              <button 
                onClick={() => { setShowUpdateToast(false); setView('notifications'); }}
                className="bg-white text-blue-600 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase flex items-center gap-1"
              >
                 Bekijk <ChevronRight size={12}/>
              </button>
           </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-md p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Logo className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">App afsluiten?</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Weet je zeker dat je de Filament Manager wilt afsluiten?</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} /> Terug naar App
              </button>
              <button 
                onClick={() => CapacitorApp.exitApp()}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
              >
                Afsluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => (<LanguageProvider><LogoProvider><AppContent /></LogoProvider></LanguageProvider>);
export default App;
