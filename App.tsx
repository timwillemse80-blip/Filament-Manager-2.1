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
import { PullToRefresh } from './components/PullToRefresh';
import { ProModal } from './components/ProModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { NotificationPage } from './components/NotificationPage';
import { Package, Plus, MapPin, Truck, Settings as SettingsIcon, Bell, Menu, X, ShoppingCart, LogOut, AlertTriangle, Download, RefreshCw, PartyPopper, WifiOff, History, CheckCircle2, Printer as PrinterIcon, LayoutDashboard, Sparkles, ChevronRight, Lock, ShieldCheck, Coffee, Snowflake, MessageSquare, ThumbsUp, Clock, Globe, PanelLeftClose, PanelLeftOpen, Crown, Hammer, LifeBuoy, Star, Box, AlertCircle, HardHat, Shield } from 'lucide-react';
import { Logo } from './components/Logo';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from './services/supabase';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LogoProvider } from './contexts/LogoContext';
import { DISCORD_INVITE_URL } from './constants';

const generateShortId = () => Math.random().toString(36).substring(2, 6).toUpperCase();

const APP_VERSION = "2.1.23"; 
const FREE_TIER_LIMIT = 50; 
const FREE_PRINTER_LIMIT = 2; 

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
  onBecomePro: () => void;
  onOpenShowcase: () => void;
  adminBadgeCount: number;
  avgRating: number;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ 
  view, setView, filaments, lowStockCount, onClose, t, isAdmin, 
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
        </div>

        <MenuHeader>{t('menuPremium')}</MenuHeader>
        <div className="space-y-2 px-1">
          <button
              onClick={() => {
                  onClose();
                  if(!isAdmin) onBecomePro();
                  else onOpenShowcase();
              }}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white hover:bg-slate-50 dark:hover:bg-slate-800 group`}
          >
              <span className="mt-0.5 shrink-0"><Globe size={18} className="text-cyan-500" /></span>
              <span className="flex-1 text-left break-words">{t('showcaseTitle')}</span>
              <span className="ml-2 flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 shadow-sm uppercase tracking-tighter">PRO</span>
                {!isAdmin && <Lock size={12} className="text-slate-400 group-hover:text-amber-500 transition-colors" />}
              </span>
          </button>

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
         
         <div className="mx-1 mt-2 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="flex gap-1 mb-1">
               {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={14} fill={s <= Math.round(avgRating || 5) ? "#fbbf24" : "none"} className={s <= Math.round(avgRating || 5) ? "text-amber-400" : "text-slate-300 dark:text-slate-700"} />
               ))}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-tight">
               {t('userRatingText')} <span className="text-amber-500 dark:text-amber-400 ml-0.5">{(avgRating || 5.0).toFixed(1)}</span>
            </p>
         </div>

        <div className="flex flex-col items-center pt-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest opacity-80 text-center">
          <span>{t('madeBy')}</span>
          <span>Tim_of_Tom</span>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { t } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [materials, setMaterials] = useState<OtherMaterial[]>([]); 
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]); 
  const [printers, setPrinters] = useState<Printer[]>([]); 
  const [adminBadgeCount, setAdminBadgeCount] = useState(0);
  const [avgRating, setAvgRating] = useState<number>(5.0);
  const [settings, setSettings] = useState<AppSettings>({ lowStockThreshold: 20, theme: 'dark', unusedWarningDays: 90, enableWeeklyEmail: false, enableUpdateNotifications: true });
  const [view, setView] = useState<ViewState>('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isSnowEnabled, setIsSnowEnabled] = useState(true);
  const [showProModal, setShowProModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string, notes: string } | null>(null);
  
  const [showShowcaseModal, setShowShowcaseModal] = useState(false);
  const [showShowcasePreview, setShowShowcasePreview] = useState(false);
  const [previewFilters, setPreviewFilters] = useState<string[]>([]);
  const [publicViewData, setPublicViewData] = useState<{ filaments: Filament[], name?: string, filters?: string[] } | null>(null);

  const isAdmin = useMemo(() => {
     const email = session?.user?.email?.toLowerCase();
     return email && ADMIN_EMAILS.includes(email);
  }, [session]);

  const existingBrands = useMemo(() => {
    return Array.from(new Set(filaments.map(f => f.brand)));
  }, [filaments]);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('filament_welcome_seen');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }

    // Check for app updates
    const checkUpdates = async () => {
      try {
        const res = await fetch('/version.json');
        const data = await res.json();
        if (data.version && data.version !== APP_VERSION) {
          setUpdateInfo({ version: data.version, notes: data.releaseNotes });
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

    // Deep link handling
    CapacitorApp.addListener('appUrlOpen', (data: any) => {
       const url = data.url;
       if (url.startsWith('filament://')) {
          const shortId = url.split('filament://')[1];
          if (shortId) {
             handleSpoolDeepLink(shortId);
          }
       }
    });

  }, []);

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
      const { data: pData } = await supabase.from('printers').select('*').eq('user_id', userId);
      if (pData) setPrinters(pData);
      
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
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) fetchData(s.user.id);
      setIsLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) fetchData(s.user.id);
      else setFilaments([]);
    });
    return () => subscription.unsubscribe();
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
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900 flex">
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
          onBecomePro={() => setShowProModal(true)} 
          onOpenShowcase={() => setShowShowcaseModal(true)} 
          adminBadgeCount={adminBadgeCount} 
          avgRating={avgRating} 
        />
      </aside>

      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative w-80 bg-white dark:bg-slate-950 h-full">
            <SidebarContent 
              view={view} 
              setView={setView} 
              filaments={filaments} 
              lowStockCount={totalLowStock} 
              onClose={() => setSidebarOpen(false)} 
              t={t} 
              isAdmin={isAdmin} 
              onBecomePro={() => setShowProModal(true)} 
              onOpenShowcase={() => setShowShowcaseModal(true)}
              adminBadgeCount={adminBadgeCount} 
              avgRating={avgRating} 
            />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-950 border-b dark:border-slate-800 flex items-center px-4 justify-between gap-2">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500"><Menu size={24} /></button>
          <h1 className="font-bold dark:text-white flex-1 px-2 truncate">{t(view)}</h1>
          
          <div className="flex items-center gap-1 shrink-0">
             <button 
                onClick={() => setView('notifications')}
                className={`p-2 rounded-full relative transition-colors ${updateBadgeCount > 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title="Meldingen"
             >
                <Bell size={20} className={updateBadgeCount > 0 ? 'animate-pulse' : ''} />
                {updateBadgeCount > 0 && (
                   <span className="absolute top-0 right-0 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
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

        <PullToRefresh onRefresh={() => fetchData()} className="flex-1 overflow-auto p-4 md:p-8">
           {view === 'dashboard' && <Dashboard filaments={filaments} materials={materials} onNavigate={setView} isAdmin={isAdmin} history={printJobs} isSnowEnabled={isSnowEnabled} onBecomePro={() => setShowProModal(true)} onInspectItem={(id) => { setEditingId(id); setView('inventory'); setActiveGroupKey(null); }} />}
           {view === 'inventory' && <Inventory filaments={filaments} materials={materials} locations={locations} suppliers={suppliers} onEdit={(item, type) => { setEditingId(item.id); type === 'filament' ? setShowModal(true) : setShowMaterialModal(true); }} onQuickAdjust={handleQuickAdjust} onMaterialAdjust={handleMaterialAdjust} onDelete={handleDeleteItem} onBatchDelete={handleBatchDelete} onNavigate={setView} onShowLabel={(id) => { setEditingId(id); setShowModal(true); }} threshold={settings.lowStockThreshold} activeGroupKey={activeGroupKey} onSetActiveGroupKey={setActiveGroupKey} isAdmin={isAdmin} onAddClick={(type) => { setEditingId(null); type === 'filament' ? setShowModal(true) : setShowMaterialModal(true); }} onUnlockPro={() => setShowProModal(true)} />}
           {view === 'history' && <PrintHistory filaments={filaments} materials={materials} history={printJobs} printers={printers} onSaveJob={() => fetchData()} onDeleteJob={() => fetchData()} isAdmin={isAdmin} onUnlockPro={() => setShowProModal(true)} />}
           {view === 'printers' && <PrinterManager printers={printers} filaments={filaments} onSave={() => fetchData()} onDelete={() => fetchData()} isAdmin={isAdmin} onLimitReached={() => setShowProModal(true)} />}
           {view === 'shopping' && <ShoppingList filaments={filaments} materials={materials} threshold={settings.lowStockThreshold} />}
           {view === 'notifications' && <NotificationPage updateInfo={settings.enableUpdateNotifications ? updateInfo : null} />}
           {view === 'admin' && isAdmin && <AdminPanel />}
           {view === 'settings' && <Settings settings={settings} filaments={filaments} onUpdate={setSettings} onExport={() => {}} onImport={() => {}} locations={locations} suppliers={suppliers} onSaveLocation={() => fetchData()} onDeleteLocation={() => fetchData()} onSaveSupplier={() => fetchData()} onDeleteSupplier={() => fetchData()} onLogout={() => supabase.auth.signOut()} isAdmin={isAdmin} currentVersion={APP_VERSION} onOpenShowcase={(filters) => { setPreviewFilters(filters || []); setShowShowcasePreview(true); }} onBecomePro={() => setShowProModal(true)} />}
           {view === 'support' && <SupportPage isAdmin={isAdmin} />}
        </PullToRefresh>
      </main>

      {/* MODALS */}
      {showModal && (
        <FilamentForm 
          initialData={editingFilament}
          locations={locations}
          suppliers={suppliers}
          existingBrands={existingBrands}
          onSave={handleSaveFilament}
          onSaveLocation={(loc) => fetchData()}
          onSaveSupplier={(sup) => fetchData()}
          onCancel={() => { setShowModal(false); setEditingId(null); }}
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
      
      {showShowcaseModal && isAdmin && (
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
    </div>
  );
};

const App = () => (<LanguageProvider><LogoProvider><AppContent /></LogoProvider></LanguageProvider>);
export default App;