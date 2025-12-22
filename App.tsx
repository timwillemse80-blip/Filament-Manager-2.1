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
import { Package, Plus, MapPin, Truck, Settings as SettingsIcon, Bell, Menu, X, ShoppingCart, LogOut, AlertTriangle, Download, RefreshCw, PartyPopper, WifiOff, History, CheckCircle2, Printer as PrinterIcon, LayoutDashboard, Sparkles, ChevronRight, Lock, ShieldCheck, Coffee, Snowflake, MessageSquare, ThumbsUp, Clock, Globe, PanelLeftClose, PanelLeftOpen, Crown, Hammer, LifeBuoy, Star, Box, AlertCircle, HardHat, Shield } from 'lucide-react';
import { Logo } from './components/Logo';
import { CreatorLogo } from './components/CreatorLogo';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from './services/supabase';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LogoProvider } from './contexts/LogoContext';
import { DISCORD_INVITE_URL } from './constants';

const generateShortId = () => Math.random().toString(36).substring(2, 6).toUpperCase();

const APP_VERSION = "2.1.17"; 
const FREE_TIER_LIMIT = 50; 
const FREE_PRINTER_LIMIT = 2; 

const ADMIN_EMAILS = ["timwillemse@hotmail.com"];

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

const SidebarContent = ({ view, setView, filaments, lowStockCount, onClose, t, isAdmin, onBecomePro, onOpenShowcase, adminBadgeCount }: any) => {
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

      <div className="space-y-1 flex-1 overflow-y-auto">
        <NavButton onClick={onClose} view={view} setView={setView} target="dashboard" icon={<LayoutDashboard size={18} />} label={t('dashboard')} />
        <NavButton onClick={onClose} view={view} setView={setView} target="inventory" icon={<Package size={18} />} label={t('inventory')} />
        <NavButton onClick={onClose} view={view} setView={setView} target="history" icon={<History size={18} />} label={t('printHistory')} />
        <NavButton onClick={onClose} view={view} setView={setView} target="printers" icon={<PrinterIcon size={18} />} label={t('printers')} />
        <NavButton onClick={onClose} view={view} setView={setView} target="shopping" icon={<ShoppingCart size={18} />} label={t('shopping')} count={lowStockCount} />
        
        <button
            onClick={() => {
                onClose();
                if(!isAdmin) onBecomePro();
                else onOpenShowcase();
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-sm font-medium whitespace-nowrap text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800`}
        >
            <Globe size={18} />
            <span>{t('showcaseTitle')}</span>
            {!isAdmin && <Lock size={12} className="ml-auto text-amber-500" />}
        </button>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3 pb-2">
         {!isAdmin && (
            <button onClick={onBecomePro} className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-md transform active:scale-95">
               <Crown size={18} fill="currentColor" />
               <span>{t('becomePro')}</span>
            </button>
         )}
         
         <NavButton onClick={onClose} view={view} setView={setView} target="support" icon={<Coffee size={18} className="text-amber-500" />} label={t('supportTitle')} className={view !== 'support' ? "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}/>
         <NavButton onClick={onClose} view={view} setView={setView} target="help" icon={<LifeBuoy size={18} className="text-purple-500" />} label={t('help')} className={view !== 'help' ? "bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 text-purple-700 dark:text-purple-400" : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"}/>
         
         {isAdmin && (
            <NavButton onClick={onClose} view={view} setView={setView} target="admin" icon={<ShieldCheck size={18} />} label={t('admin')} count={adminBadgeCount} className={view !== 'admin' ? "bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"}/>
         )}
         <NavButton onClick={onClose} view={view} setView={setView} target="settings" icon={<SettingsIcon size={18} />} label={t('settings')} />
         
        <div className="flex flex-col items-center pt-2">
          <CreatorLogo className="h-10 w-auto text-slate-800 dark:text-white" />
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
  const [settings, setSettings] = useState<AppSettings>({ lowStockThreshold: 20, theme: 'dark', unusedWarningDays: 90, enableWeeklyEmail: false });
  const [view, setView] = useState<ViewState>('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isSnowEnabled, setIsSnowEnabled] = useState(true);
  const [showProModal, setShowProModal] = useState(false);

  const isAdmin = useMemo(() => {
     const email = session?.user?.email?.toLowerCase();
     return email && ADMIN_EMAILS.includes(email);
  }, [session]);

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

  // --- AUTO LOGOUT ON PROFILE CHANGE (PRO STATUS) ---
  useEffect(() => {
    if (!session?.user?.id) return;

    // Listen for changes specifically to the current user's profile
    const channel = supabase
      .channel('profile-monitor')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${session.user.id}`
        },
        (payload) => {
          // Detect if is_pro changed
          console.log("Profiel gewijzigd door beheerder:", payload.new);
          alert("Je account-status is gewijzigd door de beheerder. Je wordt nu uitgelogd om de wijzigingen door te voeren.");
          // Small timeout to allow the alert to be read
          setTimeout(() => {
            supabase.auth.signOut();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const lowStockFilaments = filaments.filter(f => (f.weightRemaining / f.weightTotal) * 100 <= settings.lowStockThreshold);
  const lowStockMaterials = materials.filter(m => m.minStock !== undefined && m.minStock > 0 && m.quantity <= m.minStock);
  const totalLowStock = lowStockFilaments.length + lowStockMaterials.length;

  if (isLoading) return <div className="h-screen w-full flex items-center justify-center dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div>;
  if (!session) return <AuthScreen onOfflineLogin={() => {}} />;

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900 flex">
      <aside className={`hidden lg:flex flex-col w-72 bg-white dark:bg-slate-950 border-r dark:border-slate-800 transition-all duration-300 ${isDesktopSidebarOpen ? 'translate-x-0' : '-translate-x-full w-0 overflow-hidden'}`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b dark:border-slate-800">
          <Logo className="w-8 h-8" />
          <span className="font-bold text-lg dark:text-white truncate">Filament Manager</span>
        </div>
        <SidebarContent view={view} setView={setView} filaments={filaments} lowStockCount={totalLowStock} onClose={() => {}} t={t} isAdmin={isAdmin} onBecomePro={() => setShowProModal(true)} adminBadgeCount={adminBadgeCount} />
      </aside>

      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative w-80 bg-white dark:bg-slate-950 h-full">
            <SidebarContent view={view} setView={setView} filaments={filaments} lowStockCount={totalLowStock} onClose={() => setSidebarOpen(false)} t={t} isAdmin={isAdmin} onBecomePro={() => setShowProModal(true)} adminBadgeCount={adminBadgeCount} />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-950 border-b dark:border-slate-800 flex items-center px-4 justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500"><Menu size={24} /></button>
          <h1 className="font-bold dark:text-white truncate">{t(view)}</h1>
          <button onClick={() => setIsSnowEnabled(!isSnowEnabled)} className={`p-2 rounded-full ${isSnowEnabled ? 'bg-sky-100 text-sky-600' : 'text-slate-400'}`}><Snowflake size={20} /></button>
        </header>

        <PullToRefresh onRefresh={() => fetchData()} className="flex-1 overflow-auto p-4 md:p-8">
           {view === 'dashboard' && <Dashboard filaments={filaments} materials={materials} onNavigate={setView} isAdmin={isAdmin} history={printJobs} isSnowEnabled={isSnowEnabled} onBecomePro={() => setShowProModal(true)} />}
           {view === 'inventory' && <Inventory filaments={filaments} materials={materials} locations={locations} suppliers={suppliers} onEdit={(item, type) => { setEditingId(item.id); type === 'filament' ? setShowModal(true) : setShowMaterialModal(true); }} onQuickAdjust={(id, amt) => fetchData()} onMaterialAdjust={(id, amt) => fetchData()} onDelete={() => {}} onNavigate={setView} onShowLabel={() => {}} threshold={settings.lowStockThreshold} activeGroupKey={null} onSetActiveGroupKey={() => {}} isAdmin={isAdmin} onAddClick={(type) => type === 'filament' ? setShowModal(true) : setShowMaterialModal(true)} />}
           {view === 'history' && <PrintHistory filaments={filaments} materials={materials} history={printJobs} printers={printers} onSaveJob={() => fetchData()} onDeleteJob={() => fetchData()} isAdmin={isAdmin} />}
           {view === 'printers' && <PrinterManager printers={printers} filaments={filaments} onSave={() => fetchData()} onDelete={() => fetchData()} isAdmin={isAdmin} />}
           {view === 'admin' && isAdmin && <AdminPanel />}
           {view === 'settings' && <Settings settings={settings} filaments={filaments} onUpdate={setSettings} onExport={() => {}} onImport={() => {}} locations={locations} suppliers={suppliers} onSaveLocation={() => {}} onDeleteLocation={() => {}} onSaveSupplier={() => {}} onDeleteSupplier={() => {}} onLogout={() => supabase.auth.signOut()} isAdmin={isAdmin} currentVersion={APP_VERSION} />}
        </PullToRefresh>
      </main>
      {showProModal && <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-900 p-8 rounded-2xl max-w-sm text-center shadow-2xl"><Crown size={48} className="mx-auto text-amber-500 mb-4" /><h3 className="text-xl font-bold dark:text-white">Word PRO</h3><p className="text-slate-500 my-4">Deze functie is binnenkort beschikbaar!</p><button onClick={() => setShowProModal(false)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Sluiten</button></div></div>}
    </div>
  );
};

const App = () => (<LanguageProvider><LogoProvider><AppContent /></LogoProvider></LanguageProvider>);
export default App;