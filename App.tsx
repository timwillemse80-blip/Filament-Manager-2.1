
import React, { useState, useEffect, useMemo } from 'react';
import { Filament, Location, Supplier, AppSettings, PrintJob, Printer, ViewState, OtherMaterial } from './types';
import { Inventory } from './components/Inventory';
import { FilamentForm } from './components/FilamentForm';
import { MaterialForm } from './components/MaterialForm';
import { PrinterManager } from './components/PrinterManager'; 
import { ShoppingList } from './components/ShoppingList';
import { Settings } from './components/Settings';
import { PrintHistory } from './components/PrintHistory'; 
import { Dashboard } from './components/Dashboard'; 
import { SupportPage } from './components/SupportPage'; 
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
import { Package, Plus, MapPin, Truck, Settings as SettingsIcon, Bell, Menu, X, ShoppingCart, LogOut, AlertTriangle, RefreshCw, History, Printer as PrinterIcon, LayoutDashboard, Sparkles, ChevronLeft, Lock, ShieldCheck, Coffee, Snowflake, Globe, Crown, Star, ChevronRight, ArrowLeft } from 'lucide-react';
import { Logo } from './components/Logo';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from './services/supabase';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LogoProvider } from './contexts/LogoContext';

const generateShortId = () => Math.random().toString(36).substring(2, 6).toUpperCase();
const APP_VERSION = "2.2.2"; 
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

const NavButton: React.FC<NavButtonProps> = ({ view, setView, target, icon, label, count, onClick, className }) => (
  <button 
    onClick={() => { setView(target); if (onClick) onClick(); }}
    className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-sm font-medium ${
      view === target 
        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white hover:bg-slate-50 dark:hover:bg-slate-800'
    } ${className || ''}`}
  >
    <span className="mt-0.5 shrink-0">{icon}</span>
    <span className="text-left flex-1 break-words">{label}</span>
    {count !== undefined && count > 0 && (
      <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center shadow-sm shrink-0">{count}</span>
    )}
  </button>
);

const SidebarContent: React.FC<any> = ({ view, setView, filaments, lowStockCount, onClose, t, isAdmin, isPremium, onBecomePro, onOpenShowcase, adminBadgeCount, avgRating }) => (
  <div className="flex flex-col h-full p-4 pb-8 lg:p-6 lg:pb-12 overflow-x-hidden bg-white dark:bg-slate-950">
    <div className="flex justify-between items-center mb-6 lg:hidden">
      <div className="flex items-center gap-3">
        <Logo className="w-8 h-8" />
        <h2 className="font-bold text-lg dark:text-white text-slate-800">{t('menu')}</h2>
      </div>
      <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"><X size={24} /></button>
    </div>
    <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6">
      <div>
        <div className="px-3 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('menuManagement')}</div>
        <div className="space-y-1">
          <NavButton onClick={onClose} view={view} setView={setView} target="dashboard" icon={<LayoutDashboard size={18} className="text-blue-500" />} label={t('dashboard')} />
          <NavButton onClick={onClose} view={view} setView={setView} target="inventory" icon={<Package size={18} className="text-violet-500" />} label={t('inventory')} />
          <NavButton onClick={onClose} view={view} setView={setView} target="history" icon={<History size={18} className="text-emerald-500" />} label={t('printHistory')} />
          <NavButton onClick={onClose} view={view} setView={setView} target="printers" icon={<PrinterIcon size={18} className="text-pink-500" />} label={t('printers')} />
        </div>
      </div>
      <div>
        <div className="px-3 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('menuTools')}</div>
        <div className="space-y-1">
          <NavButton onClick={onClose} view={view} setView={setView} target="shopping" icon={<ShoppingCart size={18} className="text-orange-500" />} label={t('shopping')} count={lowStockCount} />
          <NavButton onClick={onClose} view={view} setView={setView} target="print-preview" icon={<Globe size={18} className="text-blue-400" />} label={t('printPreview')} />
        </div>
      </div>
      <div>
        <div className="px-3 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('menuPremium')}</div>
        <div className="space-y-2">
          <button onClick={() => { onClose(); isPremium ? onOpenShowcase() : onBecomePro(); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Globe size={18} className="text-cyan-500" />
            <span className="flex-1 text-left">{t('showcaseTitle')}</span>
            {!isPremium && <Lock size={12} className="text-slate-400" />}
          </button>
          {!isPremium && (
            <button onClick={() => { onClose(); onBecomePro(); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 shadow-md">
              <Crown size={18} fill="currentColor" /> {t('becomePro')}
            </button>
          )}
        </div>
      </div>
    </div>
    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
      <NavButton onClick={onClose} view={view} setView={setView} target="support" icon={<Coffee size={18} className="text-amber-500" />} label={t('supportTitle')} />
      <NavButton onClick={onClose} view={view} setView={setView} target="settings" icon={<SettingsIcon size={18} />} label={t('settings')} />
      {isAdmin && <NavButton onClick={onClose} view={view} setView={setView} target="admin" icon={<ShieldCheck size={18} className="text-emerald-500" />} label="Admin" />}
    </div>
  </div>
);

const AppContent = () => {
  const { t, language } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [materials, setMaterials] = useState<OtherMaterial[]>([]); 
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]); 
  const [printers, setPrinters] = useState<Printer[]>([]); 
  const [avgRating, setAvgRating] = useState<number>(5.0);
  const [view, setView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [isSnowEnabled, setIsSnowEnabled] = useState(true);
  const [viewingJob, setViewingJob] = useState<PrintJob | null>(null);
  const [showShowcaseModal, setShowShowcaseModal] = useState(false);
  const [showShowcasePreview, setShowShowcasePreview] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('filament_settings');
    return saved ? JSON.parse(saved) : { lowStockThreshold: 20, theme: 'dark', unusedWarningDays: 90, enableUpdateNotifications: true };
  });

  useEffect(() => { localStorage.setItem('filament_settings', JSON.stringify(settings)); }, [settings]);

  const isAdmin = useMemo(() => session?.user?.email?.toLowerCase() && ADMIN_EMAILS.includes(session.user.email.toLowerCase()), [session]);
  const isPremium = useMemo(() => isAdmin || isPro, [isAdmin, isPro]);

  const handleBackAction = () => {
    if (showExitConfirm) { setShowExitConfirm(false); return; }
    if (showModal) { setShowModal(false); setEditingId(null); return; }
    if (showMaterialModal) { setShowMaterialModal(false); setEditingId(null); return; }
    if (showProModal) { setShowProModal(false); return; }
    if (showShowcasePreview) { setShowShowcasePreview(false); return; }
    if (showShowcaseModal) { setShowShowcaseModal(false); return; }
    if (isSidebarOpen) { setSidebarOpen(false); return; }
    if (viewingJob) { setViewingJob(null); return; }
    if (view === 'inventory' && activeGroupKey) { setActiveGroupKey(null); return; }
    if (view !== 'dashboard') { setView('dashboard'); return; }
    if (Capacitor.isNativePlatform()) { setShowExitConfirm(true); }
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const backListener = CapacitorApp.addListener('backButton', handleBackAction);
    return () => { backListener.then(l => l.remove()); };
  }, [view, isSidebarOpen, showModal, showMaterialModal, showProModal, showShowcaseModal, showShowcasePreview, viewingJob, activeGroupKey, showExitConfirm]);

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
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s); if (s) fetchData(s.user.id);
      setIsLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s); if (s) fetchData(s.user.id); else { setFilaments([]); setIsPro(false); }
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  const totalLowStock = filaments.filter(f => (f.weightRemaining / f.weightTotal) * 100 <= settings.lowStockThreshold).length + materials.filter(m => m.minStock !== undefined && m.minStock > 0 && m.quantity <= m.minStock).length;

  if (isLoading) return <div className="h-screen w-full flex items-center justify-center dark:bg-slate-900"><RefreshCw className="animate-spin text-blue-600" size={48} /></div>;
  if (!session) return <AuthScreen onOfflineLogin={() => {}} />;

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative w-80 h-full shadow-2xl animate-slide-in-left">
            <SidebarContent view={view} setView={setView} filaments={filaments} lowStockCount={totalLowStock} onClose={() => setSidebarOpen(false)} t={t} isAdmin={isAdmin} isPremium={isPremium} onBecomePro={() => setShowProModal(true)} onOpenShowcase={() => setShowShowcaseModal(true)} avgRating={avgRating} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-950 border-r dark:border-slate-800">
        <div className="h-16 flex items-center gap-3 px-6 border-b dark:border-slate-800">
          <Logo className="w-8 h-8" />
          <span className="font-bold text-lg dark:text-white">Filament Manager</span>
        </div>
        <SidebarContent view={view} setView={setView} filaments={filaments} lowStockCount={totalLowStock} onClose={() => {}} t={t} isAdmin={isAdmin} isPremium={isPremium} onBecomePro={() => setShowProModal(true)} onOpenShowcase={() => setShowShowcaseModal(true)} avgRating={avgRating} />
      </aside>

      <main className="flex-1 min-w-0 flex flex-col relative">
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 justify-between sticky top-0 z-30">
          <div className="flex items-center gap-1">
             <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><Menu size={26} /></button>
             {view !== 'dashboard' && <button onClick={() => { if (activeGroupKey) setActiveGroupKey(null); else setView('dashboard'); }} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"><ChevronLeft size={24} strokeWidth={3} /></button>}
          </div>
          <h1 className="dark:text-white flex-1 font-bold px-2 truncate text-center md:text-left">{t(view)}</h1>
          <div className="shrink-0 flex items-center gap-1">
             <button onClick={() => setView('notifications')} className={`p-2 rounded-full relative ${updateInfo ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}><Bell size={20} />{updateInfo && <span className="bg-blue-500 border-white border-2 rounded-full w-3 h-3 absolute top-1 right-1"></span>}</button>
             <button onClick={() => setIsSnowEnabled(!isSnowEnabled)} className={`p-2 rounded-full ${isSnowEnabled ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/20' : 'text-slate-400'}`}><Snowflake size={20} /></button>
          </div>
        </header>

        <PullToRefresh onRefresh={() => fetchData()} className="flex-1 p-4 md:p-8 overflow-auto">
           {view === 'dashboard' && <Dashboard filaments={filaments} materials={materials} onNavigate={setView} isAdmin={isPremium} history={printJobs} isSnowEnabled={isSnowEnabled} onBecomePro={() => setShowProModal(true)} onInspectItem={(id) => { setEditingId(id); setView('inventory'); setActiveGroupKey(null); }} />}
           {view === 'inventory' && <Inventory filaments={filaments} materials={materials} locations={locations} suppliers={suppliers} onEdit={(item, type) => { setEditingId(item.id); type === 'filament' ? setShowModal(true) : setShowMaterialModal(true); }} onQuickAdjust={() => fetchData()} onMaterialAdjust={() => fetchData()} onDelete={() => fetchData()} onNavigate={setView} onShowLabel={(id) => { setEditingId(id); setShowModal(true); }} threshold={settings.lowStockThreshold} activeGroupKey={activeGroupKey} onSetActiveGroupKey={setActiveGroupKey} isAdmin={isPremium} onAddClick={(type) => { setEditingId(null); type === 'filament' ? setShowModal(true) : setShowMaterialModal(true); }} />}
           {view === 'history' && <PrintHistory filaments={filaments} materials={materials} history={printJobs} printers={printers} onSaveJob={() => fetchData()} onDeleteJob={() => fetchData()} settings={settings} isAdmin={isPremium} viewingJob={viewingJob} setViewingJob={setViewingJob} />}
           {view === 'printers' && <PrinterManager printers={printers} filaments={filaments} onSave={() => fetchData()} onDelete={() => fetchData()} isAdmin={isPremium} />}
           {view === 'shopping' && <ShoppingList filaments={filaments} materials={materials} threshold={settings.lowStockThreshold} />}
           {view === 'notifications' && <NotificationPage updateInfo={updateInfo} />}
           {view === 'admin' && isAdmin && <AdminPanel onClose={() => setView('dashboard')} />}
           {view === 'settings' && <Settings settings={settings} filaments={filaments} onUpdate={setSettings} onExport={() => {}} onImport={() => {}} locations={locations} suppliers={suppliers} onSaveLocation={() => fetchData()} onDeleteLocation={() => fetchData()} onSaveSupplier={() => fetchData()} onDeleteSupplier={() => fetchData()} onLogout={() => supabase.auth.signOut()} isAdmin={isPremium} currentVersion={APP_VERSION} onBecomePro={() => setShowProModal(true)} userId={session?.user?.id} />}
           {view === 'feedback' && <FeedbackPage />}
           {view === 'print-preview' && <PrintPreview filaments={filaments} printers={printers} onNavigate={setView} />}
        </PullToRefresh>
      </main>

      {showModal && <FilamentForm initialData={filaments.find(f => f.id === editingId)} locations={locations} suppliers={suppliers} onSave={() => { setShowModal(false); setEditingId(null); fetchData(); }} onSaveLocation={() => fetchData()} onSaveSupplier={() => fetchData()} onCancel={() => { setShowModal(false); setEditingId(null); }} />}
      {showMaterialModal && <MaterialForm initialData={materials.find(m => m.id === editingId)} locations={locations} suppliers={suppliers} onSave={() => { setShowMaterialModal(false); setEditingId(null); fetchData(); }} onCancel={() => { setShowMaterialModal(false); setEditingId(null); }} />}
      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}
      {showShowcaseModal && isPremium && <ShowcaseModal filaments={filaments} settings={settings} onUpdateSettings={setSettings} onClose={() => setShowShowcaseModal(false)} onPreview={() => setShowShowcasePreview(true)} userId={session.user.id} />}
      {showShowcasePreview && <ShowcasePreview filaments={filaments} onClose={() => setShowShowcasePreview(false)} publicName={settings.showcasePublicName} isAdminPreview={true} />}
      {showWelcome && <WelcomeScreen onComplete={() => { localStorage.setItem('filament_welcome_seen', 'true'); setShowWelcome(false); }} />}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl p-8 text-center border border-slate-200 dark:border-slate-800 animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">App afsluiten?</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Weet je zeker dat je de Filament Manager wilt afsluiten?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setShowExitConfirm(false)} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2"><ArrowLeft size={20} /> Terug naar App</button>
              <button onClick={() => CapacitorApp.exitApp()} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-2xl">Afsluiten</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => (<LanguageProvider><LogoProvider><AppContent /></LogoProvider></LanguageProvider>);
export default App;
