
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Save, ZoomIn, ZoomOut, Image as ImageIcon, CheckCircle2, AlertCircle, MessageSquare, Trash2, UserX, Database, Copy, RefreshCw, LayoutGrid, Weight, Tag, Layers, Plus, Server, Check, Activity, HardDrive, Shield, Share2, Square, CheckSquare } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useLogo } from '../contexts/LogoContext';
import { useLanguage } from '../contexts/LanguageContext';

type AdminTab = 'dashboard' | 'sql' | 'logo' | 'spools' | 'data' | 'feedback' | 'requests';

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
  const [spoolWeights, setSpoolWeights] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [tableCounts, setTableCounts] = useState({ users: 0, filaments: 0, storage: '0 MB' });
  const [isLoading, setIsLoading] = useState(false);
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
     const { count: uCount } = await supabase.from('print_jobs').select('*', { count: 'exact', head: true }); 
     const { count: fCount } = await supabase.from('filaments').select('*', { count: 'exact', head: true });
     setTableCounts({ users: uCount || 0, filaments: fCount || 0, storage: 'Check Supabase' });
  };

  const loadFeedback = async () => { setIsLoading(true); const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false }); if (data) setFeedbacks(data); setIsLoading(false); };
  const loadRequests = async () => { setIsLoading(true); const { data } = await supabase.from('deletion_requests').select('*').order('created_at', { ascending: false }); if (data) setRequests(data); setIsLoading(false); };
  const loadSpoolWeights = async () => { const { data } = await supabase.from('spool_weights').select('*').order('name'); if (data) setSpoolWeights(data); };
  const loadBrands = async () => { const { data } = await supabase.from('brands').select('*').order('name'); if (data) setBrands(data); };
  const loadMaterials = async () => { const { data } = await supabase.from('materials').select('*').order('name'); if (data) setMaterials(data); };

  const addSpoolWeight = async () => { if (!newSpool.name || !newSpool.weight) return; const { error } = await supabase.from('spool_weights').insert({ name: newSpool.name, weight: parseFloat(newSpool.weight) }); if (!error) { setNewSpool({ name: '', weight: '' }); loadSpoolWeights(); } else alert(error.message); };
  const deleteSpoolWeight = async (id: number) => { if (confirm("Verwijderen?")) { await supabase.from('spool_weights').delete().eq('id', id); loadSpoolWeights(); } };
  const addBrand = async () => { if (!newBrand) return; const { error } = await supabase.from('brands').insert({ name: newBrand }); if (!error) { setNewBrand(''); loadBrands(); } else alert(error.message); };
  const deleteBrand = async (id: number) => { if (confirm("Verwijderen?")) { await supabase.from('brands').delete().eq('id', id); loadBrands(); } };
  const addMaterial = async () => { if (!newMaterial) return; const { error } = await supabase.from('materials').insert({ name: newMaterial }); if (!error) { setNewMaterial(''); loadMaterials(); } else alert(error.message); };
  const deleteMaterial = async (id: number) => { if (confirm("Verwijderen?")) { await supabase.from('materials').delete().eq('id', id); loadMaterials(); } };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { const file = e.target.files[0]; setLogoFile(file); const reader = new FileReader(); reader.onload = (ev) => { setPreviewUrl(ev.target?.result as string); }; reader.readAsDataURL(file); setCropScale(1); setLogoStatus('idle'); } };
  const handleSaveLogo = async () => { if (!previewUrl) return; setIsUploading(true); setLogoStatus('idle'); try { const img = new Image(); img.src = previewUrl; await new Promise(r => img.onload = r); const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); if (!ctx) throw new Error("Canvas context failed"); canvas.width = 512; canvas.height = 512; const cx = canvas.width / 2; const cy = canvas.height / 2; const baseScale = Math.min(canvas.width / img.width, canvas.height / img.height); const finalScale = baseScale * cropScale; const drawW = img.width * finalScale; const drawH = img.height * finalScale; ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH); const base64 = canvas.toDataURL('image/png'); const { error } = await supabase.from('global_settings').upsert({ key: 'app_logo', value: base64 }, { onConflict: 'key' }); if (error) throw error; await refreshLogo(); setLogoStatus('success'); setLogoMsg("Logo succesvol bijgewerkt!"); setLogoFile(null); setPreviewUrl(null); } catch (e: any) { console.error(e); setLogoStatus('error'); setLogoMsg("Upload mislukt: " + e.message); } finally { setIsUploading(false); } };
  const handleDeleteUser = async (userId: string, requestId: string) => { if(!confirm("LET OP: Dit verwijdert ALLES van deze gebruiker. Weet je het zeker?")) return; try { const { error } = await supabase.rpc('delete_user_completely', { target_user_id: userId }); if (error) throw error; setRequests(prev => prev.filter(r => r.id !== requestId)); alert("Gebruiker verwijderd."); } catch (e: any) { alert("Fout: " + e.message); } };
  const deleteFeedback = async (id: number) => { if(!confirm("Verwijderen?")) return; await supabase.from('feedback').delete().eq('id', id); setFeedbacks(prev => prev.filter(f => f.id !== id)); };
  const toggleFeedbackRead = async (id: number, currentStatus: boolean) => { try { const { error } = await supabase.from('feedback').update({ is_read: !currentStatus }).eq('id', id); if (error) throw error; setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, is_read: !currentStatus } : f)); } catch (e: any) { alert("Fout bij updaten: " + e.message); } };

  const sqlSetupCode = `-- MASTER SQL SCRIPT - Filament Manager
-- Voer dit script uit in de Supabase SQL Editor

-- 1. LOCATIES
create table if not exists public.locations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);
alter table public.locations enable row level security;
create policy "Users manage own locations" on public.locations for all using (auth.uid() = user_id);

-- 2. LEVERANCIERS
create table if not exists public.suppliers (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  website text,
  created_at timestamptz default now()
);
alter table public.suppliers enable row level security;
create policy "Users manage own suppliers" on public.suppliers for all using (auth.uid() = user_id);

-- 3. FILAMENTEN
create table if not exists public.filaments (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  brand text not null,
  material text not null,
  "colorName" text,
  "colorHex" text,
  "weightTotal" numeric default 1000,
  "weightRemaining" numeric default 1000,
  "tempNozzle" numeric,
  "tempBed" numeric,
  price numeric,
  notes text,
  "purchaseDate" timestamptz default now(),
  "locationId" uuid references public.locations(id) on delete set null,
  "supplierId" uuid references public.suppliers(id) on delete set null,
  "shopUrl" text,
  "shortId" text
);
alter table public.filaments enable row level security;
create policy "Users manage own filaments" on public.filaments for all using (auth.uid() = user_id);

-- 4. OVERIGE MATERIALEN
create table if not exists public.other_materials (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  quantity numeric default 0,
  unit text,
  "minStock" numeric default 0,
  price numeric,
  "locationId" uuid references public.locations(id) on delete set null,
  "supplierId" uuid references public.suppliers(id) on delete set null,
  "shopUrl" text,
  notes text,
  "purchaseDate" timestamptz default now(),
  image text
);
alter table public.other_materials enable row level security;
create policy "Users manage own materials" on public.other_materials for all using (auth.uid() = user_id);

-- 5. PRINTERS
create table if not exists public.printers (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  brand text,
  model text,
  "hasAMS" boolean default false,
  "amsCount" smallint default 0,
  "amsSlots" jsonb default '[]'::jsonb,
  "powerWatts" numeric default 300,
  "purchasePrice" numeric default 0,
  "lifespanHours" numeric default 20000,
  "ipAddress" text,
  "apiKey" text,
  "webcamUrl" text
);
alter table public.printers enable row level security;
create policy "Users manage own printers" on public.printers for all using (auth.uid() = user_id);

-- 6. PRINT LOGBOEK
create table if not exists public.print_jobs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  date timestamptz default now(),
  "printTime" text,
  "totalWeight" numeric,
  "calculatedCost" numeric,
  status text,
  "printerId" uuid references public.printers(id) on delete set null,
  "assemblyTime" numeric default 0,
  "costBreakdown" jsonb,
  "usedFilaments" jsonb,
  "usedOtherMaterials" jsonb
);
alter table public.print_jobs enable row level security;
create policy "Users manage own prints" on public.print_jobs for all using (auth.uid() = user_id);

-- 7. FEEDBACK & VERZOEKEN
create table if not exists public.feedback (
  id bigint generated by default as identity primary key,
  created_at timestamptz default now(),
  message text not null,
  rating smallint,
  user_id uuid references auth.users(id) on delete cascade,
  "is_read" boolean default false,
  platform text,
  user_agent text
);
alter table public.feedback enable row level security;
create policy "Anyone can insert feedback" on public.feedback for insert with check (true);
create policy "Admins can select feedback" on public.feedback for select using (true);
create policy "Admins can update feedback" on public.feedback for update using (true);
create policy "Admins can delete feedback" on public.feedback for delete using (true);

create table if not exists public.deletion_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  reason text,
  created_at timestamptz default now()
);
alter table public.deletion_requests enable row level security;
create policy "Users create requests" on public.deletion_requests for insert with check (auth.uid() = user_id);
create policy "Users see own requests" on public.deletion_requests for select using (auth.uid() = user_id);
create policy "Users delete own requests" on public.deletion_requests for delete using (auth.uid() = user_id);
create policy "Admins see all requests" on public.deletion_requests for select using (true);

-- 8. GLOBAL SETTINGS
create table if not exists public.global_settings (key text primary key, value text);
alter table public.global_settings enable row level security;
create policy "Everyone can read global" on public.global_settings for select using (true);
create policy "Admins can manage global" on public.global_settings for all using (true);

-- 9. BRANDS & MATERIALS
create table if not exists public.brands (id bigint generated by default as identity primary key, name text unique);
create table if not exists public.materials (id bigint generated by default as identity primary key, name text unique);
create table if not exists public.spool_weights (id bigint generated by default as identity primary key, name text, weight numeric);
alter table public.brands enable row level security;
alter table public.materials enable row level security;
alter table public.spool_weights enable row level security;
create policy "Brands read" on public.brands for select using (true);
create policy "Materials read" on public.materials for select using (true);
create policy "Spools read" on public.spool_weights for select using (true);
`;

  const handleCopySql = () => { navigator.clipboard.writeText(sqlSetupCode); setCopiedSql(true); setTimeout(() => setCopiedSql(false), 2000); };

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
       <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 flex overflow-x-auto gap-2 scrollbar-hide">
                <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'dashboard' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><LayoutGrid size={18}/> Dashboard</button>
                <button onClick={() => setActiveTab('sql')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'sql' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><Database size={18}/> SQL Setup</button>
                <button onClick={() => setActiveTab('logo')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'logo' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><ImageIcon size={18}/> Logo</button>
                <button onClick={() => setActiveTab('spools')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'spools' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><Weight size={18}/> Spoel Gewichten</button>
                <button onClick={() => setActiveTab('data')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'data' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><Layers size={18}/> Merken & Materialen</button>
                <button onClick={() => setActiveTab('feedback')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'feedback' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><MessageSquare size={18}/> Feedback</button>
                <button onClick={() => setActiveTab('requests')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'requests' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><UserX size={18}/> Verzoeken</button>
             </div>

             {activeTab === 'dashboard' && (
                <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="text-slate-500 text-sm font-bold uppercase mb-2">Filamenten in Database</h3>
                         <p className="text-3xl font-black text-slate-800 dark:text-white">~{tableCounts.filaments}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="text-slate-500 text-sm font-bold uppercase mb-2">Openstaande Feedback</h3>
                         <p className="text-3xl font-black text-purple-600">{feedbacks.length > 0 ? feedbacks.filter(f => !f.is_read).length : '-'}</p>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'sql' && (
                <div className="space-y-4 animate-fade-in">
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="font-bold text-lg dark:text-white mb-2 flex items-center gap-2">
                         <Database size={20} className="text-blue-500"/> Supabase SQL Setup
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                         Kopieer dit script en voer het uit in de <strong>SQL Editor</strong> van jouw Supabase project om alle tabellen en rechten in één keer goed te zetten.
                      </p>
                      <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-700 relative group">
                           <div className="flex justify-between items-center mb-2 sticky left-0 right-0">
                              <p className="text-slate-500 font-bold uppercase flex items-center gap-2">SQL Master Script</p>
                              <button onClick={handleCopySql} className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors border border-slate-700">
                                 {copiedSql ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                 <span className="text-[10px] font-bold">{copiedSql ? 'Gekopieerd!' : 'Kopieer SQL'}</span>
                              </button>
                           </div>
                           <pre className="whitespace-pre-wrap">{sqlSetupCode}</pre>
                      </div>
                   </div>
                </div>
             )}
             
             {activeTab === 'spools' && ( <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"><h3 className="font-bold text-lg dark:text-white mb-4">Lege Spoel Gewichten</h3><div className="flex gap-2 mb-4"><input type="text" placeholder="Naam (bv. eSun Plastic)" value={newSpool.name} onChange={e => setNewSpool({...newSpool, name: e.target.value})} className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 dark:text-white"/><input type="number" placeholder="Gewicht (g)" value={newSpool.weight} onChange={e => setNewSpool({...newSpool, weight: e.target.value})} className="w-24 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 dark:text-white"/><button onClick={addSpoolWeight} className="bg-green-600 text-white p-2 rounded-lg"><Plus size={20}/></button></div><div className="space-y-2 max-h-96 overflow-y-auto">{spoolWeights.map(s => (<div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700"><span className="font-medium dark:text-slate-200">{s.name}</span><div className="flex items-center gap-4"><span className="text-slate-500 font-mono">{s.weight}g</span><button onClick={() => deleteSpoolWeight(s.id)} className="text-red-400 hover:text-red-500"><Trash2 size={16}/></button></div></div>))}</div></div>)}
             {activeTab === 'data' && ( <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"><h3 className="font-bold text-lg dark:text-white mb-4 flex items-center gap-2"><Tag size={18}/> Merken</h3><div className="flex gap-2 mb-4"><input type="text" placeholder="Nieuw Merk..." value={newBrand} onChange={e => setNewBrand(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 dark:text-white"/><button onClick={addBrand} className="bg-blue-600 text-white p-2 rounded-lg"><Plus size={20}/></button></div><div className="space-y-2 max-h-96 overflow-y-auto">{brands.map(b => (<div key={b.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700"><span className="dark:text-slate-200">{b.name}</span><button onClick={() => deleteBrand(b.id)} className="text-red-400 hover:text-red-500"><Trash2 size={14}/></button></div>))}</div></div><div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"><h3 className="font-bold text-lg dark:text-white mb-4 flex items-center gap-2"><Layers size={18}/> Materialen</h3><div className="flex gap-2 mb-4"><input type="text" placeholder="Nieuw Materiaal..." value={newMaterial} onChange={e => setNewMaterial(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 dark:text-white"/><button onClick={addMaterial} className="bg-blue-600 text-white p-2 rounded-lg"><Plus size={20}/></button></div><div className="space-y-2 max-h-96 overflow-y-auto">{materials.map(m => (<div key={m.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700"><span className="dark:text-slate-200">{m.name}</span><button onClick={() => deleteMaterial(m.id)} className="text-red-400 hover:text-red-500"><Trash2 size={14}/></button></div>))}</div></div></div>)}
             {activeTab === 'logo' && (<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"><div className="flex flex-col md:flex-row gap-6 items-start"><div onClick={() => fileInputRef.current?.click()} className="w-full md:w-64 h-64 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all bg-slate-50 dark:bg-slate-900/50 overflow-hidden relative">{previewUrl ? (<div className="w-full h-full flex items-center justify-center overflow-hidden relative"><img src={previewUrl} style={{ transform: `scale(${cropScale})`, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transition: 'transform 0.1s ease-out' }} alt="Preview" /></div>) : (<><Upload size={32} className="text-slate-400 mb-2" /><span className="text-xs text-slate-500 font-medium">Klik om te uploaden</span></>)}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} /></div><div className="flex-1 space-y-4 w-full">{previewUrl && (<div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700"><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Schalen (Zoom)</label><div className="flex items-center gap-4"><ZoomOut size={18} className="text-slate-400" /><input type="range" min="0.1" max="3" step="0.05" value={cropScale} onChange={(e) => setCropScale(parseFloat(e.target.value))} className="flex-1 h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/><ZoomIn size={18} className="text-slate-400" /></div></div>)}{logoStatus === 'success' && <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-3 rounded-lg flex items-center gap-2 text-sm"><CheckCircle2 size={16} /> {logoMsg}</div>}<div className="flex gap-2"><button onClick={handleSaveLogo} disabled={!previewUrl || isUploading} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"><Save size={18} /> Opslaan</button>{previewUrl && <button onClick={() => { setPreviewUrl(null); setLogoFile(null); setLogoStatus('idle'); }} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-bold">Annuleren</button>}</div></div></div></div>)}
             {(activeTab === 'feedback' || activeTab === 'requests') && (<div className="space-y-4"><div className="flex justify-between items-center"><h3 className="font-bold text-lg dark:text-white">{activeTab === 'feedback' ? 'Feedback' : 'Verzoeken'}</h3><button onClick={activeTab === 'feedback' ? loadFeedback : loadRequests} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><RefreshCw size={18}/></button></div>{activeTab === 'feedback' && feedbacks.map(f => (<div key={f.id} className={`bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm relative transition-opacity ${f.is_read ? 'opacity-60 border-slate-100 bg-slate-50 dark:bg-slate-900' : 'border-slate-200'}`}><div className="flex justify-between items-start mb-2"><div className="font-bold text-yellow-500 flex items-center gap-1">{f.rating}/5</div><div className="flex gap-2"><button onClick={() => toggleFeedbackRead(f.id, f.is_read)} className={`p-1.5 rounded transition-colors ${f.is_read ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : 'text-slate-400 hover:text-green-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`} title={f.is_read ? t('markAsUnread') : t('markAsRead')}>{f.is_read ? <CheckSquare size={16} /> : <Square size={16} />}</button><button onClick={() => deleteFeedback(f.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"><Trash2 size={16}/></button></div></div><p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{f.message}</p><div className="mt-2 text-xs text-slate-400">{new Date(f.created_at).toLocaleString()} • {f.platform}</div></div>))}{activeTab === 'requests' && requests.map(r => (<div key={r.id} className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/30 flex justify-between items-center"><div><div className="font-bold text-red-800 dark:text-red-200">{r.email}</div><div className="text-xs text-red-600 dark:text-red-400">Reden: {r.reason}</div></div><button onClick={() => handleDeleteUser(r.user_id, r.id)} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">Verwijder</button></div>))}</div>)}
          </div>
          <div className="w-full lg:w-80 space-y-6"><div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg sticky top-6"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Server size={20} className="text-green-400"/> Server Status</h3><div className="space-y-4"><div className="flex justify-between items-center pb-2 border-b border-slate-800"><span className="text-slate-400 text-sm">Status</span><span className="text-green-400 font-bold text-sm flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online</span></div><div className="flex justify-between items-center pb-2 border-b border-slate-800"><span className="text-slate-400 text-sm">Database</span><span className="font-mono text-sm">Supabase (PG)</span></div><div className="flex justify-between items-center pb-2 border-b border-slate-800"><span className="text-slate-400 text-sm">Regio</span><span className="font-mono text-sm">eu-central-1</span></div><div className="flex justify-between items-center pb-2 border-b border-slate-800"><span className="text-slate-400 text-sm flex items-center gap-2"><Activity size={14}/> Latency</span><span className={`font-mono text-sm ${latency && latency < 200 ? 'text-green-400' : 'text-yellow-400'}`}>{latency ? `${latency}ms` : '...'}</span></div><div className="flex justify-between items-center pb-2 border-b border-slate-800"><span className="text-slate-400 text-sm flex items-center gap-2"><Shield size={14}/> App Versie</span><span className="font-mono text-sm text-slate-300">{localStorage.getItem('app_version') || '2.0.2'}</span></div><div className="pt-2"><h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Statistieken (Schatting)</h4><div className="grid grid-cols-2 gap-2"><div className="bg-slate-800 p-2 rounded text-center"><span className="block text-xl font-bold">{tableCounts.users || '-'}</span><span className="text-[10px] text-slate-500">Logboek</span></div><div className="bg-slate-800 p-2 rounded text-center"><span className="block text-xl font-bold">{tableCounts.filaments}</span><span className="text-[10px] text-slate-500">Filamenten</span></div></div></div></div></div></div>
       </div>
    </div>
  );
};
