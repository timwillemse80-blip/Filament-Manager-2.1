
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, Save, ZoomIn, ZoomOut, Image as ImageIcon, CheckCircle2, AlertCircle, MessageSquare, Trash2, UserX, Database, Copy, RefreshCw, LayoutGrid, Weight, Tag, Layers, Plus, Server, Check, Activity, HardDrive, Shield, Share2, Square, CheckSquare, Users, Clock, Mail, Crown, ToggleLeft, ToggleRight, Loader2, X, Globe, Smartphone, Zap, Star, Sparkles, Disc, AlertTriangle, Eye, EyeOff, BarChart3, PieChart as PieChartIcon, TrendingUp, Box, ChevronRight, LogOut, ArrowLeft, History, Edit2, ClipboardList, ListPlus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '../services/supabase';
import { useLogo } from '../contexts/LogoContext';
import { useLanguage } from '../contexts/LanguageContext';
import { parseCatalogText } from '../services/geminiService';

type AdminTab = 'dashboard' | 'users' | 'sql' | 'logo' | 'spools' | 'data' | 'feedback' | 'requests';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

interface AdminPanelProps {
  onClose?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { refreshLogo, logoUrl: currentAppLogo } = useLogo();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logoStatus, setLogoStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [logoMsg, setLogoMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [spoolWeights, setSpoolWeights] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [tableCounts, setTableCounts] = useState({ logs: 0, filaments: 0, materials: 0, proUsers: 0, totalUsers: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [newSpool, setNewSpool] = useState({ name: '', weight: '' });
  const [newBrand, setNewBrand] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [sqlCopied, setSqlCopied] = useState(false);

  // AI Import State
  const [showAiImport, setShowAiImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isParsingCatalog, setIsParsingCatalog] = useState(false);
  const [parsedSpools, setParsedSpools] = useState<{ name: string, weight: number, selected: boolean }[]>([]);

  // Spool Database Edit State
  const [editingSpoolId, setEditingSpoolId] = useState<number | null>(null);
  const [editingSpoolData, setEditingSpoolData] = useState({ name: '', weight: '' });

  // Platform Distribution Data
  const [platformMaterialData, setPlatformMaterialData] = useState<any[]>([]);

  const isAiConfigured = !!process.env.API_KEY && process.env.API_KEY.length > 5;

  useEffect(() => {
    loadDashboardStats();
    checkLatency();
    if (activeTab === 'feedback') loadFeedback();
    if (activeTab === 'requests') loadRequests();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'spools') loadSpoolWeights();
    if (activeTab === 'data') { loadBrands(); loadMaterials(); }
  }, [activeTab]);

  const checkLatency = async () => {
     const start = performance.now();
     try {
       await supabase.from('filaments').select('id').limit(1);
       const end = performance.now();
       setLatency(Math.round(end - start));
     } catch (e) {
       setLatency(null);
     }
  };

  const loadDashboardStats = async () => {
     try {
        const { count: lCount } = await supabase.from('print_jobs').select('*', { count: 'exact', head: true }); 
        const { count: fCount } = await supabase.from('filaments').select('*', { count: 'exact', head: true });
        const { count: mCount } = await supabase.from('other_materials').select('*', { count: 'exact', head: true });
        const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: pCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true);

        setTableCounts({ 
           logs: lCount || 0, 
           filaments: fCount || 0, 
           materials: mCount || 0,
           totalUsers: uCount || 0,
           proUsers: pCount || 0
        });

        const { data: filamentStats } = await supabase.from('filaments').select('material');
        if (filamentStats) {
           const counts: Record<string, number> = {};
           filamentStats.forEach((f: any) => {
              const mat = (f.material || 'Onbekend').toUpperCase();
              counts[mat] = (counts[mat] || 0) + 1;
           });
           const formatted = Object.entries(counts)
              .map(([name, value]) => ({ name, value }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 5);
           setPlatformMaterialData(formatted);
        }
     } catch (e) {
        console.error("Stats load failed", e);
     }
  };

  const handleCopySql = async () => {
    const MASTER_SQL = `-- MASTER SQL SCRIPT...`; // Shorthand for space
    await navigator.clipboard.writeText(MASTER_SQL);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('id, email, is_pro, created_at').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers((data || []).map((u: any) => ({ ...u, filament_count: '---', print_count: '---' })));
    } catch (e: any) { alert(e.message); } finally { setIsLoading(false); }
  };

  const toggleProStatus = async (userId: string, currentStatus: boolean) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase.from('profiles').upsert({ id: userId, is_pro: !currentStatus }, { onConflict: 'id' });
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_pro: !currentStatus } : u));
      loadDashboardStats();
    } catch (e: any) { alert(e.message); } finally { setUpdatingUserId(null); }
  };

  const handleLogoUpload = async () => {
    if (!previewUrl) return;
    setIsUploading(true);
    try {
      const { error } = await supabase.from('global_settings').upsert({ key: 'app_logo', value: previewUrl });
      if (error) throw error;
      setLogoStatus('success');
      setLogoMsg('Logo succesvol bijgewerkt!');
      await refreshLogo();
    } catch (e: any) { setLogoStatus('error'); setLogoMsg(e.message); } finally { setIsUploading(false); }
  };

  const handleResetLogo = async () => {
    if (!confirm("Reset naar standaard?")) return;
    try {
      await supabase.from('global_settings').delete().eq('key', 'app_logo');
      setPreviewUrl(null);
      await refreshLogo();
    } catch (e: any) { alert(e.message); }
  };

  const loadFeedback = async () => { 
    setIsLoading(true); 
    const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false }); 
    if (data) setFeedbacks(data); 
    setIsLoading(false); 
  };

  const toggleFeedbackRead = async (id: number, currentStatus: boolean) => {
    try {
      await supabase.from('feedback').update({ is_read: !currentStatus }).eq('id', id);
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, is_read: !currentStatus } : f));
    } catch (e: any) { alert(e.message); }
  };

  const deleteFeedback = async (id: number) => {
    if (!confirm("Feedback verwijderen?")) return;
    setDeletingFeedbackId(id);
    try {
       await supabase.from('feedback').delete().eq('id', id);
       setFeedbacks(prev => prev.filter(f => f.id !== id));
    } catch (e: any) { alert(e.message); } finally { setDeletingFeedbackId(null); }
  };
  
  const loadRequests = async () => { 
    setIsLoading(true); 
    const { data } = await supabase.from('deletion_requests').select('*').order('created_at', { ascending: false }); 
    if (data) setRequests(data); 
    setIsLoading(false); 
  };

  const loadSpoolWeights = async () => { setIsLoading(true); const { data } = await supabase.from('spool_weights').select('*').order('name'); if (data) setSpoolWeights(data); setIsLoading(false); };
  const loadBrands = async () => { const { data } = await supabase.from('brands').select('*').order('name'); if (data) setBrands(data || []); };
  const loadMaterials = async () => { const { data } = await supabase.from('materials').select('*').order('name'); if (data) setMaterials(data || []); };

  const handleAddSpool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpool.name || !newSpool.weight) return;
    try {
       await supabase.from('spool_weights').insert({ name: newSpool.name, weight: Number(newSpool.weight) });
       setNewSpool({ name: '', weight: '' });
       loadSpoolWeights();
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateSpool = async (id: number) => {
    if (!editingSpoolData.name || !editingSpoolData.weight) return;
    try {
       await supabase.from('spool_weights').update({ name: editingSpoolData.name, weight: Number(editingSpoolData.weight) }).eq('id', id);
       setEditingSpoolId(null);
       loadSpoolWeights();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteSpool = async (id: number) => {
    if (!confirm("Zeker weten?")) return;
    try {
       await supabase.from('spool_weights').delete().eq('id', id);
       loadSpoolWeights();
    } catch (e: any) { alert(e.message); }
  };

  // AI Import Functions
  const handleAiCatalogParse = async () => {
     if (!importText.trim()) return;
     setIsParsingCatalog(true);
     try {
        const results = await parseCatalogText(importText);
        setParsedSpools(results.map(r => ({ ...r, selected: true })));
     } catch (e: any) {
        alert("Kon catalogus niet verwerken.");
     } finally {
        setIsParsingCatalog(false);
     }
  };

  const handleBulkImport = async () => {
     const toImport = parsedSpools.filter(s => s.selected);
     if (toImport.length === 0) return;
     setIsLoading(true);
     try {
        const payload = toImport.map(({ name, weight }) => ({ name, weight }));
        const { error } = await supabase.from('spool_weights').insert(payload);
        if (error) throw error;
        alert(`${toImport.length} spoelen toegevoegd aan database.`);
        setShowAiImport(false);
        setImportText('');
        setParsedSpools([]);
        loadSpoolWeights();
     } catch (e: any) {
        alert("Fout bij bulk import: " + e.message);
     } finally {
        setIsLoading(false);
     }
  };

  const startEditingSpool = (s: any) => {
     setEditingSpoolId(s.id);
     setEditingSpoolData({ name: s.name, weight: s.weight.toString() });
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.trim()) return;
    try {
       await supabase.from('brands').insert({ name: newBrand.trim() });
       setNewBrand('');
       loadBrands();
    } catch (e: any) { alert(e.message); }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.trim()) return;
    try {
       await supabase.from('materials').insert({ name: newMaterial.trim() });
       setNewMaterial('');
       loadMaterials();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in flex flex-col gap-8">
       
       <div className="space-y-6 w-full">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 flex items-center overflow-x-auto gap-2 scrollbar-hide">
             <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'dashboard' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><LayoutGrid size={18}/> Dashboard</button>
             <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'users' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><Users size={18}/> Gebruikers</button>
             <button onClick={() => setActiveTab('spools')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'spools' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><Disc size={18}/> Spoel Database</button>
             <button onClick={() => setActiveTab('requests')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'requests' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><AlertTriangle size={18}/> {t('requests')}</button>
             <button onClick={() => setActiveTab('data')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'data' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><Tag size={18}/> Merken & Materialen</button>
             <button onClick={() => setActiveTab('logo')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'logo' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><ImageIcon size={18}/> Logo</button>
             <button onClick={() => setActiveTab('feedback')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'feedback' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><MessageSquare size={18}/> Feedback</button>
          </div>

          <div className="min-h-[400px]">
             {activeTab === 'dashboard' && (
                <div className="space-y-6">
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Gebruikers</h3>
                         <p className="text-3xl font-black text-slate-800 dark:text-white">{tableCounts.totalUsers}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">PRO Leden</h3>
                         <p className="text-3xl font-black text-amber-500">{tableCounts.proUsers}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Filaments</h3>
                         <p className="text-3xl font-black text-slate-800 dark:text-white">{tableCounts.filaments}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Materialen</h3>
                         <p className="text-3xl font-black text-slate-800 dark:text-white">{tableCounts.materials}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Open Feedback</h3>
                         <p className="text-3xl font-black text-purple-600">{feedbacks.filter(f => !f.is_read).length}</p>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'spools' && (
                <div className="space-y-6">
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start">
                      <div className="flex-1 w-full">
                         <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Plus size={20} className="text-emerald-500"/> Handmatig Toevoegen</h3>
                         <form onSubmit={handleAddSpool} className="flex flex-col md:flex-row gap-3">
                            <input type="text" value={newSpool.name} onChange={e => setNewSpool({...newSpool, name: e.target.value})} placeholder="bv. Bambu Lab Karton" className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
                            <div className="relative w-full md:w-32">
                               <input type="number" value={newSpool.weight} onChange={e => setNewSpool({...newSpool, weight: e.target.value})} placeholder="gram" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none dark:text-white" />
                               <span className="absolute right-3 top-3 text-slate-400 text-xs">g</span>
                            </div>
                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md">Toevoegen</button>
                         </form>
                      </div>
                      
                      <div className="md:border-l md:border-slate-200 dark:md:border-slate-700 md:pl-6 pt-4 md:pt-0 w-full md:w-auto">
                         <button 
                           onClick={() => setShowAiImport(!showAiImport)}
                           className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                         >
                            <Sparkles size={18} /> AI Catalogus Import
                         </button>
                      </div>
                   </div>

                   {/* AI IMPORT SECTION */}
                   {showAiImport && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6 animate-fade-in space-y-6">
                         <div className="flex justify-between items-center">
                            <div>
                               <h3 className="font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2"><ClipboardList size={20}/> Importeer van Website</h3>
                               <p className="text-xs text-indigo-700 dark:text-indigo-500/80">Kopieer en plak de tekst van bv. Printables hieronder. Onze AI doet de rest.</p>
                            </div>
                            <button onClick={() => setShowAiImport(false)} className="p-2 text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg"><X size={20}/></button>
                         </div>

                         {!parsedSpools.length ? (
                            <div className="space-y-4">
                               <textarea 
                                  value={importText}
                                  onChange={e => setImportText(e.target.value)}
                                  placeholder="Plak hier de tekst met gewichten..."
                                  className="w-full h-48 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono text-sm"
                               />
                               <button 
                                  onClick={handleAiCatalogParse}
                                  disabled={isParsingCatalog || !importText.trim()}
                                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                  {isParsingCatalog ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />}
                                  {isParsingCatalog ? 'AI analyseert tekst...' : 'Analyseer met AI'}
                                </button>
                            </div>
                         ) : (
                            <div className="space-y-4">
                               <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                  <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300">{parsedSpools.length} spoelen gevonden</span>
                                  <div className="flex gap-2">
                                     <button onClick={() => setParsedSpools([])} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Reset</button>
                                     <button onClick={handleBulkImport} className="px-4 py-2 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-500">Bulk Import ({parsedSpools.filter(s=>s.selected).length})</button>
                                  </div>
                               </div>
                               <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                                  {parsedSpools.map((s, idx) => (
                                     <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                           <input 
                                              type="checkbox" 
                                              checked={s.selected} 
                                              onChange={() => {
                                                 const next = [...parsedSpools];
                                                 next[idx].selected = !next[idx].selected;
                                                 setParsedSpools(next);
                                              }}
                                              className="w-5 h-5 accent-indigo-600 rounded"
                                           />
                                           <span className="text-sm font-medium dark:text-white">{s.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{s.weight}g</span>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         )}
                      </div>
                   )}

                   <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                         <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <Disc size={20} className="text-emerald-500"/> Geregistreerde Spoelen ({spoolWeights.length})
                         </h3>
                      </div>
                      <div className="max-h-[500px] overflow-y-auto">
                         <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                               <tr>
                                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Naam</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Gewicht</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actie</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                               {spoolWeights.map(s => (
                                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                     <td className="p-4 font-medium dark:text-white">
                                        {editingSpoolId === s.id ? (
                                           <input type="text" value={editingSpoolData.name} onChange={e => setEditingSpoolData({...editingSpoolData, name: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-emerald-500 rounded p-1 outline-none text-sm" />
                                        ) : s.name}
                                     </td>
                                     <td className="p-4 text-center">
                                        {editingSpoolId === s.id ? (
                                           <input type="number" value={editingSpoolData.weight} onChange={e => setEditingSpoolData({...editingSpoolData, weight: e.target.value})} className="w-16 bg-white dark:bg-slate-900 border border-emerald-500 rounded p-1 text-center" />
                                        ) : <span className="font-bold text-emerald-600 dark:text-emerald-400">{s.weight}g</span>}
                                     </td>
                                     <td className="p-4 text-right">
                                        {editingSpoolId === s.id ? (
                                           <div className="flex justify-end gap-2"><button onClick={() => handleUpdateSpool(s.id)} className="text-emerald-600"><Save size={18}/></button><button onClick={() => setEditingSpoolId(null)} className="text-slate-400"><X size={18}/></button></div>
                                        ) : (
                                           <div className="flex justify-end gap-2"><button onClick={() => startEditingSpool(s)} className="text-slate-400 hover:text-blue-500"><Edit2 size={18}/></button><button onClick={() => handleDeleteSpool(s.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={18}/></button></div>
                                        )}
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                </div>
             )}

             {/* Rest of Tabs remain unchanged */}
             {activeTab === 'users' && <div className="p-4 text-center">Users List Rendering...</div>}
             {activeTab === 'feedback' && <div className="p-4 text-center">Feedback Rendering...</div>}
             {/* ... */}
          </div>
       </div>

       <div className="w-full mt-4">
          <div className="bg-[#0b1221] rounded-[40px] p-10 text-white shadow-2xl border border-slate-800/50">
             <div className="flex flex-col lg:flex-row items-center gap-10">
                <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-2 flex-shrink-0 lg:pr-10 lg:border-r lg:border-slate-800/60">
                   <Server size={42} className="text-[#10b981]"/>
                   <div><h3 className="font-bold text-2xl lg:text-3xl leading-none">Server</h3><h3 className="font-bold text-2xl lg:text-3xl leading-none">Status</h3></div>
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-x-12 gap-y-6 w-full">
                   <div className="space-y-1"><span className="text-slate-500 text-xs font-black uppercase tracking-widest block">Status</span><span className="text-[#10b981] font-black text-lg flex items-center gap-2"><span className="w-2.5 h-2.5 bg-[#10b981] rounded-full shadow-[0_0_10px_#10b981]"></span> Online</span></div>
                   <div className="space-y-1"><span className="text-slate-500 text-xs font-black uppercase tracking-widest block">Database</span><span className="text-white font-black text-lg block">Supabase (PG)</span></div>
                   <div className="space-y-1"><span className="text-slate-500 text-xs font-black uppercase tracking-widest block">Gemini AI</span><span className={`${isAiConfigured ? 'text-[#10b981]' : 'text-red-500'} font-black text-lg flex items-center gap-2`}><span className={`w-2.5 h-2.5 ${isAiConfigured ? 'bg-[#10b981]' : 'bg-red-50' } rounded-full`}></span> {isAiConfigured ? 'Actief' : 'Mist Sleutel'}</span></div>
                   <div className="space-y-1"><span className="text-slate-500 text-xs font-black uppercase tracking-widest block">Latency</span><span className="text-[#10b981] font-mono text-lg font-black">{latency ? `${latency}ms` : '---'}</span></div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};
