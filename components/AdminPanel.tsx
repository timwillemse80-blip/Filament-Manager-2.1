
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Save, ZoomIn, ZoomOut, Image as ImageIcon, CheckCircle2, AlertCircle, MessageSquare, Trash2, UserX, Database, Copy, RefreshCw, LayoutGrid, Weight, Tag, Layers, Plus, Server, Check, Activity, HardDrive, Shield, Share2, Square, CheckSquare, Users, Clock, Mail, Crown, ToggleLeft, ToggleRight, Loader2, X, Globe, Smartphone, Zap, Star } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useLogo } from '../contexts/LogoContext';
import { useLanguage } from '../contexts/LanguageContext';

type AdminTab = 'dashboard' | 'users' | 'sql' | 'logo' | 'spools' | 'data' | 'feedback' | 'requests';

export const AdminPanel: React.FC = () => {
  const { refreshLogo } = useLogo();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logoStatus, setLogoStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [logoMsg, setLogoMsg] = useState('');
  const [cropScale, setCropScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [spoolWeights, setSpoolWeights] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [tableCounts, setTableCounts] = useState({ logs: 0, filaments: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [newSpool, setNewSpool] = useState({ name: '', weight: '' });
  const [newBrand, setNewBrand] = useState('');
  const [newMaterial, setNewMaterial] = useState('');

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
     await supabase.from('filaments').select('id').limit(1);
     const end = performance.now();
     setLatency(Math.round(end - start));
  };

  const loadDashboardStats = async () => {
     const { count: lCount } = await supabase.from('print_jobs').select('*', { count: 'exact', head: true }); 
     const { count: fCount } = await supabase.from('filaments').select('*', { count: 'exact', head: true });
     setTableCounts({ logs: lCount || 0, filaments: fCount || 0 });
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('admin_user_stats').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (e: any) {
      console.error("Fout bij laden gebruikers:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProStatus = async (userId: string, currentStatus: boolean) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId, 
          is_pro: !currentStatus
        }, { onConflict: 'id' });

      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_pro: !currentStatus } : u));
    } catch (e: any) {
      console.error("Pro toggle error details:", e);
      const errorMsg = e?.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
      alert(`Fout bij bijwerken PRO status: ${errorMsg}\n\nTip: Kopieer en voer het nieuwe SQL script uit om je database te repareren.`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const loadFeedback = async () => { setIsLoading(true); const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false }); if (data) setFeedbacks(data); setIsLoading(false); };
  const loadRequests = async () => { setIsLoading(true); const { data } = await supabase.from('deletion_requests').select('*').order('created_at', { ascending: false }); if (data) setRequests(data); setIsLoading(false); };
  const loadSpoolWeights = async () => { const { data } = await supabase.from('spool_weights').select('*').order('name'); if (data) setSpoolWeights(data); };
  const loadBrands = async () => { const { data } = await supabase.from('brands').select('*').order('name'); if (data) setBrands(data); };
  const loadMaterials = async () => { const { data } = await supabase.from('materials').select('*').order('name'); if (data) setMaterials(data); };

  const handleDeleteFeedback = async (id: number) => {
    if (!confirm("Weet je het zeker?")) return;
    try {
      const { error } = await supabase.from('feedback').delete().eq('id', id);
      if (error) throw error;
      loadFeedback();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Weet je het zeker? Dit verwijderd alleen het verzoek uit deze lijst, niet het account.")) return;
    try {
      const { error } = await supabase.from('deletion_requests').delete().eq('id', id);
      if (error) throw error;
      loadRequests();
    } catch (e: any) { alert(e.message); }
  };

  const handleAddSpool = async () => {
    if (!newSpool.name || !newSpool.weight) return;
    try {
      const { error } = await supabase.from('spool_weights').insert({
        name: newSpool.name,
        weight: Number(newSpool.weight)
      });
      if (error) throw error;
      setNewSpool({ name: '', weight: '' });
      loadSpoolWeights();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteSpool = async (id: number) => {
    if (!confirm("Weet je het zeker?")) return;
    try {
      const { error } = await supabase.from('spool_weights').delete().eq('id', id);
      if (error) throw error;
      loadSpoolWeights();
    } catch (e: any) { alert(e.message); }
  };

  const handleAddBrand = async () => {
    if (!newBrand) return;
    try {
      const { error } = await supabase.from('brands').insert({ name: newBrand });
      if (error) throw error;
      setNewBrand('');
      loadBrands();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteBrand = async (id: number) => {
    if (!confirm("Weet je het zeker?")) return;
    try {
      const { error } = await supabase.from('brands').delete().eq('id', id);
      if (error) throw error;
      loadBrands();
    } catch (e: any) { alert(e.message); }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial) return;
    try {
      const { error } = await supabase.from('materials').insert({ name: newMaterial });
      if (error) throw error;
      setNewMaterial('');
      loadMaterials();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!confirm("Weet je het zeker?")) return;
    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
      loadMaterials();
    } catch (e: any) { alert(e.message); }
  };

  const handleCopySql = () => { navigator.clipboard.writeText(sqlSetupCode); setCopiedSql(true); setTimeout(() => setCopiedSql(false), 2000); };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { 
      setLogoFile(file); 
      setPreviewUrl(URL.createObjectURL(file)); 
      setLogoStatus('idle'); 
    }
  };

  const handleSaveLogo = async () => {
    if (!logoFile || !previewUrl) return;
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(logoFile);
      reader.onload = async () => {
        const { error } = await supabase.from('global_settings').upsert({ key: 'app_logo', value: reader.result as string }, { onConflict: 'key' });
        if (error) throw error;
        setLogoStatus('success');
        setLogoMsg('Logo opgeslagen!');
        await refreshLogo();
      };
    } catch (e: any) { 
      setLogoStatus('error'); 
      setLogoMsg(e.message); 
    } finally { 
      setIsUploading(false); 
    }
  };

  const sqlSetupCode = `-- REPARATIE & SETUP SCRIPT (Voer dit uit in Supabase SQL Editor)

-- 1. ZORG DAT PROFILES TABEL KLOPT
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_pro boolean default false,
  updated_at timestamptz default now()
);

-- Voeg kolom toe als deze ontbreekt (voor bestaande tabellen)
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- RLS Instellen
alter table public.profiles enable row level security;
drop policy if exists "Users view own profile" on public.profiles;
drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins manage profiles" on public.profiles for all using (true) with check (true);

-- 2. ENABLE REALTIME VOOR AUTO-LOGOUT BIJ STATUSWIJZIGING
-- Zorgt dat gebruikers direct uitloggen als hun PRO status wijzigt
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.profiles;

-- 3. ANDERE TABELLEN REPAREREN (INDIEN NODIG)
alter table public.locations enable row level security;
drop policy if exists "Users manage own locations" on public.locations;
create policy "Users manage own locations" on public.locations for all using (auth.uid() = user_id);

alter table public.suppliers enable row level security;
drop policy if exists "Users manage own suppliers" on public.suppliers;
create policy "Users manage own suppliers" on public.suppliers for all using (auth.uid() = user_id);

alter table public.filaments enable row level security;
drop policy if exists "Users manage own filaments" on public.filaments;
create policy "Users manage own filaments" on public.filaments for all using (auth.uid() = user_id);

-- 4. ADMIN VIEW VERVERSEN
drop view if exists public.admin_user_stats;
create view public.admin_user_stats as
select
  u.id,
  u.email,
  u.created_at,
  coalesce(p.is_pro, false) as is_pro,
  (select count(*) from public.filaments f where f.user_id = u.id) as filament_count,
  (select count(*) from public.print_jobs pr where pr.user_id = u.id) as print_count
from auth.users u
left join public.profiles p on p.id = u.id;
grant select on public.admin_user_stats to authenticated;
`;

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
       <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 flex overflow-x-auto gap-2 scrollbar-hide">
                <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'dashboard' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><LayoutGrid size={18}/> Dashboard</button>
                <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'users' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><Users size={18}/> Gebruikers</button>
                <button onClick={() => setActiveTab('sql')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'sql' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><Database size={18}/> SQL Setup</button>
                <button onClick={() => setActiveTab('data')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'data' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><Tag size={18}/> Merken & Materialen</button>
                <button onClick={() => setActiveTab('logo')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'logo' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><ImageIcon size={18}/> Logo</button>
                <button onClick={() => setActiveTab('spools')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'spools' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><Weight size={18}/> Spoel Gewichten</button>
                <button onClick={() => setActiveTab('feedback')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'feedback' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><MessageSquare size={18}/> Feedback</button>
                <button onClick={() => setActiveTab('requests')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'requests' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><UserX size={18}/> Verzoeken</button>
             </div>

             {activeTab === 'dashboard' && (
                <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="text-slate-500 text-sm font-bold uppercase mb-2">Geregistreerde Gebruikers</h3>
                         <p className="text-3xl font-black text-slate-800 dark:text-white">{users.length}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="text-slate-500 text-sm font-bold uppercase mb-2">Openstaande Feedback</h3>
                         <p className="text-3xl font-black text-purple-600">{feedbacks.filter(f => !f.is_read).length}</p>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'users' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                   <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                         <Users size={20} className="text-blue-500"/> Gebruikers ({users.length})
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Gebruiker logt automatisch uit bij wijziging status</p>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                           <tr>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Gebruiker</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Data</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                           {users.map(u => (
                              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                 <td className="p-4">
                                    <div className="font-bold text-sm dark:text-white">{u.email}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{u.id}</div>
                                 </td>
                                 <td className="p-4 text-center">
                                    {u.email?.toLowerCase() === 'timwillemse@hotmail.com' ? (
                                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm mx-auto">
                                          <Shield size={12} fill="currentColor" /> BEHEERDER
                                       </span>
                                    ) : (
                                       <button 
                                          onClick={(e) => { e.preventDefault(); toggleProStatus(u.id, u.is_pro); }}
                                          disabled={updatingUserId === u.id}
                                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all relative z-10 ${u.is_pro ? 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}
                                       >
                                          {updatingUserId === u.id ? <Loader2 size={12} className="animate-spin" /> : (u.is_pro ? <Crown size={12} fill="currentColor" /> : <Plus size={12} />)}
                                          {u.is_pro ? 'PRO' : 'Maak PRO'}
                                       </button>
                                    )}
                                 </td>
                                 <td className="p-4 text-center text-xs font-bold text-slate-500 uppercase">
                                    {u.filament_count}f • {u.print_count}l
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                   </div>
                </div>
             )}

             {activeTab === 'sql' && (
                <div className="space-y-4 animate-fade-in">
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="font-bold text-lg dark:text-white mb-2 flex items-center gap-2"><Database size={20} className="text-blue-500"/> Reparatie SQL Script</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Voer dit script uit in de SQL Editor van Supabase om de 'updated_at' fout op te lossen, de PRO rechten te activeren én de automatische logout functie in te schakelen.</p>
                      <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-700 relative group">
                           <div className="flex justify-between items-center mb-2">
                              <p className="text-slate-500 font-bold uppercase">SQL Master Script</p>
                              <button onClick={handleCopySql} className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors border border-slate-700">
                                 {copiedSql ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                 <span className="text-[10px] font-bold">{copiedSql ? 'Gekopieerd!' : 'Kopieer SQL'}</span>
                              </button>
                           </div>
                           <pre className="whitespace-pre-wrap">{sqlSetupCode}</pre>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'data' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                   {/* BRANDS */}
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="font-bold text-lg dark:text-white mb-4 flex items-center gap-2"><Tag size={20} className="text-blue-500"/> Merken Beheer</h3>
                      <div className="flex gap-2 mb-4">
                         <input type="text" value={newBrand} onChange={e => setNewBrand(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm dark:text-white" placeholder="Nieuw merk..."/>
                         <button onClick={handleAddBrand} className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg"><Plus size={20}/></button>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                         {brands.map(b => (
                            <div key={b.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                               <span className="text-sm font-medium dark:text-white">{b.name}</span>
                               <button onClick={() => handleDeleteBrand(b.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* MATERIALS */}
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="font-bold text-lg dark:text-white mb-4 flex items-center gap-2"><Layers size={20} className="text-orange-500"/> Materialen Beheer</h3>
                      <div className="flex gap-2 mb-4">
                         <input type="text" value={newMaterial} onChange={e => setNewMaterial(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm dark:text-white" placeholder="Nieuw materiaal..."/>
                         <button onClick={handleAddMaterial} className="bg-orange-600 hover:bg-orange-500 text-white p-2.5 rounded-lg"><Plus size={20}/></button>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                         {materials.map(m => (
                            <div key={m.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                               <span className="text-sm font-medium dark:text-white">{m.name}</span>
                               <button onClick={() => handleDeleteMaterial(m.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'logo' && (
                <div className="space-y-4 animate-fade-in">
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="font-bold text-lg dark:text-white mb-4 flex items-center gap-2"><ImageIcon size={20} className="text-indigo-500"/> App Logo Beheer</h3>
                      
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                         <div className="flex-1 space-y-4 w-full">
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                               Upload hier een afbeelding om het standaard app-logo te vervangen. Dit logo wordt overal in de app en op de labels gebruikt.
                            </p>
                            
                            <div 
                               onClick={() => fileInputRef.current?.click()}
                               className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all group"
                            >
                               <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                               <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4 text-indigo-500 group-hover:scale-110 transition-transform">
                                  <Upload size={32} />
                               </div>
                               <p className="font-bold text-slate-800 dark:text-white">Kies een afbeelding</p>
                               <p className="text-xs text-slate-400 mt-1">PNG, JPG of SVG aanbevolen</p>
                            </div>

                            {logoStatus === 'success' && (
                               <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400 animate-fade-in">
                                  <CheckCircle2 size={18} />
                                  <span className="text-sm font-bold">{logoMsg}</span>
                               </div>
                            )}

                            {logoStatus === 'error' && (
                               <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 animate-fade-in">
                                  <AlertCircle size={18} />
                                  <span className="text-sm font-bold">{logoMsg}</span>
                               </div>
                            )}
                         </div>

                         <div className="w-full md:w-64 space-y-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preview</p>
                            <div className="aspect-square bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner relative">
                               {previewUrl ? (
                                  <img src={previewUrl} className="w-full h-full object-contain p-4" alt="Logo preview" />
                               ) : (
                                  <div className="text-slate-400 flex flex-col items-center gap-2">
                                     <ImageIcon size={48} className="opacity-20" />
                                     <span className="text-[10px] font-bold opacity-40">GEEN LOGO GEKOZEN</span>
                                  </div>
                               )}
                            </div>

                            <button 
                               onClick={handleSaveLogo}
                               disabled={!logoFile || isUploading}
                               className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                               {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                               Opslaan & Toepassen
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'spools' && (
                <div className="space-y-4 animate-fade-in">
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="font-bold text-lg dark:text-white mb-4 flex items-center gap-2"><Weight size={20} className="text-green-500"/> Spoel Gewichten Beheer</h3>
                      
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-6">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="md:col-span-1">
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Naam (bv. Bambu Reusable)</label>
                               <input type="text" value={newSpool.name} onChange={e => setNewSpool({...newSpool, name: e.target.value})} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm dark:text-white" placeholder="Naam"/>
                            </div>
                            <div>
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Gewicht (gram)</label>
                               <input type="number" value={newSpool.weight} onChange={e => setNewSpool({...newSpool, weight: e.target.value})} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm dark:text-white" placeholder="250"/>
                            </div>
                            <button onClick={handleAddSpool} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all">
                               <Plus size={18}/> Toevoegen
                            </button>
                         </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                              <tr>
                                 <th className="p-4 text-xs font-bold text-slate-500 uppercase">Naam</th>
                                 <th className="p-4 text-xs font-bold text-slate-500 uppercase">Gewicht</th>
                                 <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actie</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                              {spoolWeights.map(s => (
                                 <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="p-4 text-sm font-medium dark:text-white">{s.name}</td>
                                    <td className="p-4 text-sm font-mono text-slate-500">{s.weight}g</td>
                                    <td className="p-4 text-right">
                                       <button onClick={() => handleDeleteSpool(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'feedback' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in">
                   <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                         <MessageSquare size={20} className="text-purple-500"/> Gebruikers Feedback ({feedbacks.length})
                      </h3>
                      <button onClick={loadFeedback} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"><RefreshCw size={16}/></button>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                           <tr>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Datum & Gebruiker</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Score</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Bericht</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actie</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                           {feedbacks.map(f => (
                              <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                 <td className="p-4 whitespace-nowrap">
                                    <div className="text-xs font-bold dark:text-white">{new Date(f.created_at).toLocaleDateString()}</div>
                                    <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{f.user_id}</div>
                                 </td>
                                 <td className="p-4">
                                    <div className="flex gap-0.5">
                                       {[1, 2, 3, 4, 5].map(s => (
                                          <Star key={s} size={10} fill={s <= f.rating ? "#fbbf24" : "none"} className={s <= f.rating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"} />
                                       ))}
                                    </div>
                                 </td>
                                 <td className="p-4">
                                    <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-md whitespace-pre-wrap">{f.message}</div>
                                 </td>
                                 <td className="p-4 text-right">
                                    <button onClick={() => handleDeleteFeedback(f.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                 </td>
                              </tr>
                           ))}
                           {feedbacks.length === 0 && (
                              <tr>
                                 <td colSpan={4} className="p-8 text-center text-slate-400 text-sm italic">Geen feedback gevonden.</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                   </div>
                </div>
             )}

             {activeTab === 'requests' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in">
                   <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                         <UserX size={20} className="text-red-500"/> Verwijderverzoeken ({requests.length})
                      </h3>
                      <button onClick={loadRequests} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"><RefreshCw size={16}/></button>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                           <tr>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Datum</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase">Reden</th>
                              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actie</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                           {requests.map(r => (
                              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                 <td className="p-4 text-xs font-bold dark:text-white">
                                    {new Date(r.created_at).toLocaleDateString()}
                                 </td>
                                 <td className="p-4 text-sm font-medium dark:text-slate-200">
                                    {r.email}
                                 </td>
                                 <td className="p-4">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 italic max-w-md">{r.reason || "Geen reden opgegeven"}</div>
                                 </td>
                                 <td className="p-4 text-right">
                                    <button onClick={() => handleDeleteRequest(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                 </td>
                              </tr>
                           ))}
                           {requests.length === 0 && (
                              <tr>
                                 <td colSpan={4} className="p-8 text-center text-slate-400 text-sm italic">Geen verzoeken gevonden.</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                   </div>
                </div>
             )}
          </div>

          {/* RIGHT SIDEBAR: SERVER STATUS */}
          <div className="w-full lg:w-80 space-y-6">
             <div className="bg-[#0b1221] rounded-2xl p-7 text-white shadow-2xl border border-slate-800/50">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
                   <Server size={22} className="text-[#10b981]"/> Server Status
                </h3>
                
                <div className="space-y-5">
                   <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                      <span className="text-slate-400 text-sm font-medium">Status</span>
                      <span className="text-[#10b981] font-bold text-sm flex items-center gap-2">
                         <span className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></span> Online
                      </span>
                   </div>
                   
                   <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                      <span className="text-slate-400 text-sm font-medium">Database</span>
                      <span className="text-white font-bold text-sm">Supabase (PG)</span>
                   </div>

                   <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                      <span className="text-slate-400 text-sm font-medium">Regio</span>
                      <span className="text-slate-200 font-mono text-sm">eu-central-1</span>
                   </div>

                   <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                      <span className="text-slate-400 text-sm flex items-center gap-2">
                         <Activity size={16} className="text-slate-500" /> Latency
                      </span>
                      <span className="text-[#10b981] font-mono text-sm font-bold">
                         {latency ? `${latency}ms` : '...'}
                      </span>
                   </div>

                   <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm flex items-center gap-2">
                         <Shield size={16} className="text-slate-500" /> App Versie
                      </span>
                      <span className="text-[#3b82f6] font-mono text-sm font-bold">
                         2.1.13
                      </span>
                   </div>

                   {/* Stats Section */}
                   <div className="pt-6">
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 opacity-70">
                         STATISTIEKEN (SCHATTING)
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-[#1a2333] p-4 rounded-xl text-center border border-slate-800 transition-colors hover:bg-[#1e2a3d]">
                            <span className="block text-2xl font-black mb-0.5">{tableCounts.logs}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Logboek</span>
                         </div>
                         <div className="bg-[#1a2333] p-4 rounded-xl text-center border border-slate-800 transition-colors hover:bg-[#1e2a3d]">
                            <span className="block text-2xl font-black mb-0.5">{tableCounts.filaments}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Filamenten</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};
