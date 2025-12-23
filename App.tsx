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
import { Package, Plus, MapPin, Truck, Settings as SettingsIcon, Bell, Menu, X, ShoppingCart, LogOut, AlertTriangle, Download, RefreshCw, PartyPopper, WifiOff, History, CheckCircle2, Printer as PrinterIcon, LayoutDashboard, Sparkles, ChevronLeft, Lock, ShieldCheck, Coffee, Snowflake, MessageSquare, ThumbsUp, Clock, Globe, PanelLeftClose, PanelLeftOpen, Crown, Hammer, LifeBuoy, Star, Box, AlertCircle, HardHat, Shield, QrCode, ArrowLeft } from 'lucide-react';
import { Logo } from './components/Logo';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from './services/supabase';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LogoProvider } from './contexts/LogoContext';
import { DISCORD_INVITE_URL } from './constants';

const generateShortId = () => Math.random().toString(36).substring(2, 6).toUpperCase();

const APP_VERSION = "2.1.30"; 
const ADMIN_EMAILS = ["timwillemse@hotmail.com"];

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
  const [avgRating, setAvgRating] = useState<number>(5.0);
  
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
  const [isSnowEnabled, setIsSnowEnabled] = useState(true);
  const [showProModal, setShowProModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false); 
  const [updateInfo, setUpdateInfo] = useState<{ version: string, notes: string, downloadUrl?: string } | null>(null);
  const [viewingJob, setViewingJob] = useState<PrintJob | null>(null);
  const [showShowcaseModal, setShowShowcaseModal] = useState(false);
  const [showShowcasePreview, setShowShowcasePreview] = useState(false);
  const [previewFilters, setPreviewFilters] = useState<string[]>([]);
  const [publicViewData, setPublicViewData] = useState<{ filaments: Filament[], name?: string, filters?: string[] } | null>(null);

  // Refs voor consistente data toegang in listeners
  const filamentsRef = useRef<Filament[]>([]);
  useEffect(() => { filamentsRef.current = filaments; }, [filaments]);

  const handleSpoolDeepLink = (shortId: string) => {
     const cleanId = shortId.toUpperCase().trim();
     const spool = filamentsRef.current.find(f => f.shortId?.toUpperCase() === cleanId);
     if (spool) {
        setEditingId(spool.id);
        setView('inventory');
        setActiveGroupKey(null);
        setShowModal(true);
     } else {
        alert(`Spoel met ID #${cleanId} niet gevonden in jouw voorraad.`);
     }
  };

  useEffect(() => {
    localStorage.setItem('filament_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backButtonListener = CapacitorApp.addListener('backButton', () => {
      if (showExitConfirm) { setShowExitConfirm(false); return; }
      if (showWelcome) { setShowWelcome(false); return; }
      if (showProModal) { setShowProModal(false); return; }
      if (showShowcasePreview) { setShowShowcasePreview(false); return; }
      if (showShowcaseModal) { setShowShowcaseModal(false); return; }
      if (showModal) { setShowModal(false); setEditingId(null); return; }
      if (showMaterialModal) { setShowMaterialModal(false); setEditingId(null); return; }
      if (viewingJob) { setViewingJob(null); return; }
      if (isSidebarOpen) { setSidebarOpen(false); return; }
      if (view === 'inventory' && activeGroupKey) { setActiveGroupKey(null); return; }
      if (view !== 'dashboard') { setView('dashboard'); return; }
      setShowExitConfirm(true);
    });

    // Deep Link Listener
    const urlListener = CapacitorApp.addListener('appUrlOpen', (data: any) => {
       const url = data.url;
       let shortId = "";
       
       if (url.startsWith('filament://')) {
          shortId = url.split('filament://')[1];
       } else if (url.includes('/s/')) {
          shortId = url.split('/s/')[1]?.split('?')[0]?.split('#')[0];
       }

       if (shortId) {
          handleSpoolDeepLink(shortId);
       }
    });

    return () => {
      backButtonListener.then(l => l.remove());
      urlListener.then(l => l.remove());
    };
  }, [showExitConfirm, showWelcome, showProModal, showShowcasePreview, showShowcaseModal, showModal, showMaterialModal, viewingJob, isSidebarOpen, view, activeGroupKey]);

  const isAdmin = useMemo(() => {
     const email = session?.user?.email?.toLowerCase();
     return email && ADMIN_EMAILS.includes(email);
  }, [session]);

  const isPremium = useMemo(() => isAdmin || isPro, [isAdmin, isPro]);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('filament_welcome_seen');
    if (!hasSeenWelcome) setShowWelcome(true);

    const checkUpdates = async () => {
      try {
        const res = await fetch('/version.json');
        const data = await res.json();
        if (data.version && data.version !== APP_VERSION) {
          setUpdateInfo({ version: data.version, notes: data.releaseNotes, downloadUrl: data.downloadUrl });
        }
      } catch (e) {}
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
            setPublicViewData({ filaments: fData, name: sData?.showcase_name || 'Gedeelde Voorraad', filters: params.get('materials')?.split(',') || [] });
          }
        } catch (e) {} finally { setIsLoading(false); }
      };
      fetchPublicStock();
    }
  }, [session]);

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
    } catch (error) {}
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
      else { setFilaments([]); setIsPro(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSaveFilament = async (filament: Filament | Filament[]) => {
    const userId = session?.user?.id;
    if (!userId) return;
    try {
      const items = Array.isArray(filament) ? filament : [filament];
      const payload = items.map(item => ({ ...item, user_id: userId, shortId: item.shortId || generateShortId() }));
      const { error } = await supabase.from('filaments').upsert(payload);
      if (error) throw error;
      setShowModal(false); setEditingId(null); fetchData();
    } catch (e: any) { alert("Fout bij opslaan: " + e.message); }
  };

  const handleSaveMaterial = async (material: OtherMaterial) => {
    const userId = session?.user?.id;
    if (!userId) return;
    try {
      const { error } = await supabase.from('other_materials').upsert({ ...material, user_id: userId });
      if (error) throw error;
      setShowMaterialModal(false); setEditingId(null); fetchData();
    } catch (e: any) { alert("Fout bij opslaan: " + e.message); }
  };

  const handleDeleteItem = async (id: string, type: 'filament' | 'material') => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      const table = type === 'filament' ? 'filaments' : 'other_materials';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) { alert("Fout bij verwijderen: " + e.message); }
  };

  const handleQuickAdjust = async (id: string, amount: number) => {
    const filament = filaments.find(f => f.id === id);
    if (!filament) return;
    const newWeight = Math.max(0, filament.weightRemaining - amount);
    try {
      await supabase.from('filaments').update({ weightRemaining: newWeight }).eq('id', id);
      fetchData();
    } catch (e) {}
  };

  const handleMaterialAdjust = async (id: string, amount: number) => {
    const mat = materials.find(m => m.id === id);
    if (!mat) return;
    const newQty = Math.max(0, mat.quantity + amount);
    try {
      await supabase.from('other_materials').update({ quantity: newQty }).eq('id', id);
      fetchData();
    } catch (e) {}
  };

  if (isLoading) return <div className="h-screen w-full flex items-center justify-center dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div>;
  if (publicViewData) return <ShowcasePreview filaments={publicViewData.filaments} onClose={() => setPublicViewData(null)} publicName={publicViewData.name} initialFilters={publicViewData.filters} />;
  if (!session) return <AuthScreen onOfflineLogin={() => {}} />;

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900 flex">
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white dark:bg-slate-950 border-b dark:border-slate-800 h-16 flex items-center px-4 justify-between gap-2">
          <div className="flex items-center gap-1">
             <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-500"><Menu size={24} /></button>
             {view !== 'dashboard' && <button onClick={() => activeGroupKey ? setActiveGroupKey(null) : setView('dashboard')} className="p-2 text-blue-600 dark:text-blue-400 rounded-full"><ChevronLeft size={24} strokeWidth={3} /></button>}
          </div>
          <h1 className="dark:text-white flex-1 font-bold px-2 truncate text-center md:text-left">{t(view)}</h1>
          <div className="shrink-0 flex items-center gap-1">
             <button onClick={() => setView('notifications')} className={`p-2 rounded-full relative ${updateInfo ? 'text-blue-500' : 'text-slate-400'}`}><Bell size={20} />{updateInfo && <span className="bg-blue-500 rounded-full w-2 h-2 absolute top-1 right-1"></span>}</button>
             <button onClick={() => setIsSnowEnabled(!isSnowEnabled)} className={`p-2 rounded-full ${isSnowEnabled ? 'text-sky-400' : 'text-slate-400'}`}><Snowflake size={20} /></button>
          </div>
        </header>

        <PullToRefresh onRefresh={() => fetchData()} className="flex-1 p-4 md:p-8 overflow-auto">
           {view === 'dashboard' && <Dashboard filaments={filaments} materials={materials} onNavigate={setView} isAdmin={isPremium} history={printJobs} isSnowEnabled={isSnowEnabled} onBecomePro={() => setShowProModal(true)} onInspectItem={(id) => { setEditingId(id); setView('inventory'); setActiveGroupKey(null); }} />}
           {view === 'inventory' && <Inventory filaments={filaments} materials={materials} locations={locations} suppliers={suppliers} onEdit={(item, type) => { setEditingId(item.id); type === 'filament' ? setShowModal(true) : setShowMaterialModal(true); }} onQuickAdjust={handleQuickAdjust} onMaterialAdjust={handleMaterialAdjust} onDelete={handleDeleteItem} onNavigate={setView} onShowLabel={(id) => { setEditingId(id); setShowLabelOnly(true); setShowModal(true); }} threshold={settings.lowStockThreshold} activeGroupKey={activeGroupKey} onSetActiveGroupKey={setActiveGroupKey} isAdmin={isPremium} onAddClick={(type) => { setEditingId(null); type === 'filament' ? setShowModal(true) : setShowMaterialModal(true); }} onUnlockPro={() => setShowProModal(true)} />}
           {view === 'history' && <PrintHistory filaments={filaments} materials={materials} history={printJobs} printers={printers} onSaveJob={() => fetchData()} onDeleteJob={() => fetchData()} settings={settings} isAdmin={isPremium} viewingJob={viewingJob} setViewingJob={setViewingJob} />}
           {view === 'shopping' && <ShoppingList filaments={filaments} materials={materials} threshold={settings.lowStockThreshold} />}
           {view === 'settings' && <Settings settings={settings} filaments={filaments} onUpdate={setSettings} onExport={() => {}} onImport={() => {}} locations={locations} suppliers={suppliers} onSaveLocation={() => fetchData()} onDeleteLocation={() => fetchData()} onSaveSupplier={() => fetchData()} onDeleteSupplier={() => fetchData()} onLogout={() => supabase.auth.signOut()} isAdmin={isPremium} currentVersion={APP_VERSION} onBecomePro={() => setShowProModal(true)} updateInfo={updateInfo} />}
        </PullToRefresh>
      </main>

      {showModal && <FilamentForm initialData={filaments.find(f => f.id === editingId)} initialShowLabel={showLabelOnly} locations={locations} suppliers={suppliers} existingBrands={Array.from(new Set(filaments.map(f => f.brand)))} onSave={handleSaveFilament} onSaveLocation={() => fetchData()} onSaveSupplier={() => fetchData()} onCancel={() => { setShowModal(false); setEditingId(null); setShowLabelOnly(false); }} />}
      {showMaterialModal && <MaterialForm initialData={materials.find(m => m.id === editingId)} locations={locations} suppliers={suppliers} onSave={handleSaveMaterial} onCancel={() => { setShowMaterialModal(false); setEditingId(null); }} />}
      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}
      {showWelcome && <WelcomeScreen onComplete={() => { localStorage.setItem('filament_welcome_seen', 'true'); setShowWelcome(false); }} />}
    </div>
  );
};

const App = () => (<LanguageProvider><LogoProvider><AppContent /></LogoProvider></LanguageProvider>);
export default App;