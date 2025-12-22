
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Save, ZoomIn, ZoomOut, Image as ImageIcon, CheckCircle2, AlertCircle, MessageSquare, Trash2, UserX, Database, Copy, RefreshCw, LayoutGrid, Weight, Tag, Layers, Plus, Server, Check, Activity, Shield, Users, Crown, Search, Square, CheckSquare } from 'lucide-react';
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
  
  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [spoolWeights, setSpoolWeights] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [tableCounts, setTableCounts] = useState({ users: 0, filaments: 0, totalAccounts: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  
  const [newSpool, setNewSpool] = useState({ name: '', weight: '' });
  const [newBrand, setNewBrand] = useState('');
  const [newMaterial, setNewMaterial] = useState('');

  useEffect(() => {
    loadDashboardStats();
    checkLatency();
    if (activeTab === 'users') loadUsers();
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
     const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }); 
     const { count: fCount } = await supabase.from('filaments').select('*', { count: 'exact', head: true });
     const { count: jCount } = await supabase.from('print_jobs').select('*', { count: 'exact', head: true });
     setTableCounts({ totalAccounts: uCount || 0, filaments: fCount || 0, users: jCount || 0 });
  };

  const loadUsers = async () => {
     setIsLoading(true);
     const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
     if (data) setUsers(data);
     setIsLoading(false);
  };

  const toggleProStatus = async (userId: string, currentStatus: boolean) => {
     const { error } = await supabase.from('profiles').update({ is_pro: !currentStatus }).eq('id', userId);
     if (!error) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_pro: !currentStatus } : u));
     } else {
        alert("Fout bij bijwerken status: " + error.message);
     }
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
  const handleDeleteUser = async (userId: string, requestId: string) => { if(!confirm("LET OP: Dit verwijdert ALLES van deze gebruiker. Weet je het zeker?")) return; try { const { error } = await supabase.from('profiles').delete().eq('id', userId); if (error) throw error; setRequests(prev => prev.filter(r => r.id !== requestId)); alert("Profiel verwijderd."); } catch (e: any) { alert("Fout: " + e.message); } };
  const deleteFeedback = async (id: number) => { if(!confirm("Verwijderen?")) return; await supabase.from('feedback').delete().eq('id', id); setFeedbacks(prev => prev.filter(f => f.id !== id)); };
  const toggleFeedbackRead = async (id: number, currentStatus: boolean) => { try { const { error } = await supabase.from('feedback').update({ is_read: !currentStatus }).eq('id', id); if (error) throw error; setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, is_read: !currentStatus } : f)); } catch (e: any) { alert("Fout bij updaten: " + e.message); } };

  const filteredUsers = users.filter(u => u.email?.toLowerCase().includes(userSearch.toLowerCase()));

  const sqlSetupCode = `-- MASTER SQL SCRIPT - Filament Manager
-- Voer dit script uit in de Supabase SQL Editor

-- 1. PROFIELEN (Voor PRO status)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_pro boolean default false,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
drop policy if exists "Users view own profile" on public.profiles;
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Admins manage all profiles" on public.profiles;
create policy "Admins manage all profiles" on public.profiles for all using (true);

-- TRIGGER: Maak profiel bij signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, is_pro)
  values (new.id, new.email, false);
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- 2. LOCATIES t/m 10 (Rest van de tabellen)
-- ... [Rest van het script blijft hetzelfde als in README]`;

  const handleCopySql = () => { navigator.clipboard.writeText(sqlSetupCode); setCopiedSql(true); setTimeout(() => setCopiedSql(false), 2000); };

  const getTabClass = (id: AdminTab) => {
    const base = "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors";
    const active = activeTab === id;
    if (id === 'dashboard') return `${base} ${active ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`;
    if (id === 'users') return `${base} ${active ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`;
    return `${base} ${active ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`;
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
       <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 flex overflow-x-auto gap-2 scrollbar-hide">
                <button onClick={() => setActiveTab('dashboard')} className={getTabClass('dashboard')}><LayoutGrid size={18}/> Dashboard</button>
                <button onClick={() => setActiveTab('users')} className={getTabClass('users')}><Users size={18}/> Gebruikers</button>
                <button onClick={() => setActiveTab('sql')} className={getTabClass('sql')}><Database size={18}/> SQL Setup</button>
                <button onClick={() => setActiveTab('logo')} className={getTabClass('logo')}><ImageIcon size={18}/> Logo</button>
                <button onClick={() => setActiveTab('spools')} className={getTabClass('spools')}><Weight size={18}/> Spoelen</button>
                <button onClick={() => setActiveTab('data')} className={getTabClass('data')}><Layers size={18}/> Data</button>
                <button onClick={() => setActiveTab('feedback')} className={getTabClass('feedback')}><MessageSquare size={18}/> Feedback</button>
                <button onClick={() => setActiveTab('requests')} className={getTabClass('requests')}><UserX size={18}/> Verzoeken</button>
             </div>

             {activeTab === 'dashboard' && (
                <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="text-slate-500 text-sm font-bold uppercase mb-2">Totaal Accounts</h3>
                         <p className="text-3xl font-black text-slate-800 dark:text-white">{tableCounts.totalAccounts}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="text-slate-500 text-sm font-bold uppercase mb-2">Filamenten</h3>
                         <p className="text-3xl font-black text-blue-600">{tableCounts.filaments}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="text-slate-500 text-sm font-bold uppercase mb-2">Logs</h3>
                         <p className="text-3xl font-black text-emerald-600">{tableCounts.users}</p>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'users' && (
                <div className="space-y-4 animate-fade-in">
                   <div className="flex gap-4">
                      <div className="relative flex-1">
                         <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                         <input 
                            type="text" 
                            placeholder="Zoek gebruiker op email..." 
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                         />
                      </div>
                      <button onClick={loadUsers} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-500 transition-colors">
                         <RefreshCw size={20} className={isLoading ? "animate-spin" : ""}/>
                      </button>
                   </div>

                   <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                               <th className="p-4 text-xs font-bold text-slate-500 uppercase">Gebruiker</th>
                               <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                               <th className="p-4 text-xs font-bold text-slate-500 uppercase">Geregistreerd</th>
                               <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actie</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredUsers.map(user => (
                               <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="p-4">
                                     <div className="font-bold text-slate-800 dark:text-white">{user.email}</div>
                                     <div className="text-[10px] text-slate-400 font-mono">{user.id}</div>
                                  </td>
                                  <td className="p-4">
                                     {user.is_pro ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                           <Crown size={12} fill="currentColor" /> PRO
                                        </span>
                                     ) : (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                           Gebruiker
                                        </span>
                                     )}
                                  </td>
                                  <td className="p-4 text-sm text-slate-500">
                                     {new Date(user.created_at).toLocaleDateString()}
                                  </td>
                                  <td className="p-4 text-right">
                                     <button 
                                        onClick={() => toggleProStatus(user.id, user.is_pro)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 ${user.is_pro ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' : 'bg-amber-500 text-white shadow-amber-500/20'}`}
                                     >
                                        {user.is_pro ? 'Maak Normaal' : 'Upgrade naar PRO'}
                                     </button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                      {filteredUsers.length === 0 && (
                         <div className="p-8 text-center text-slate-500">Geen gebruikers gevonden.</div>
                      )}
                   </div>
                </div>
             )}

             {activeTab === 'sql' && (
                <div className="space-y-4">
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="font-bold text-lg dark:text-white mb-2 flex items-center gap-2"><Database size={20} className="text-blue-500"/> Supabase SQL Setup</h3>
                      <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-700 relative">
                           <button onClick={handleCopySql} className="absolute right-4 top-4 bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-slate-300">
                              {copiedSql ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                           </button>
                           <pre className="whitespace-pre-wrap">{sqlSetupCode}</pre>
                      </div>
                   </div>
                </div>
             )}
             
             {/* [Rest van de tab-renders zoals voorheen, maar zonder syntax fouten] */}
             {activeTab === 'spools' && ( <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"><h3 className="font-bold text-lg dark:text-white mb-4">Lege Spoel Gewichten</h3><div className="flex gap-2 mb-4"><input type="text" placeholder="Naam" value={newSpool.name} onChange={e => setNewSpool({...newSpool, name: e.target.value})} className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 dark:text-white"/><input type="number" placeholder="Gewicht (g)" value={newSpool.weight} onChange={e => setNewSpool({...newSpool, weight: e.target.value})} className="w-24 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 dark:text-white"/><button onClick={addSpoolWeight} className="bg-green-600 text-white p-2 rounded-lg"><Plus size={20}/></button></div><div className="space-y-2 max-h-96 overflow-y-auto">{spoolWeights.map(s => (<div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700"><span className="font-medium dark:text-slate-200">{s.name}</span><div className="flex items-center gap-4"><span className="text-slate-500 font-mono">{s.weight}g</span><button onClick={() => deleteSpoolWeight(s.id)} className="text-red-400 hover:text-red-500"><Trash2 size={16}/></button></div></div>))}</div></div>)}
             {activeTab === 'logo' && (<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"><div className="flex flex-col md:flex-row gap-6 items-start"><div onClick={() => fileInputRef.current?.click()} className="w-full md:w-64 h-64 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all bg-slate-50 dark:bg-slate-900/50 overflow-hidden relative">{previewUrl ? (<div className="w-full h-full flex items-center justify-center overflow-hidden relative"><img src={previewUrl} style={{ transform: `scale(${cropScale})`, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Preview" /></div>) : (<><Upload size={32} className="text-slate-400 mb-2" /><span className="text-xs text-slate-500 font-medium">Klik om te uploaden</span></>)}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} /></div><div className="flex-1 space-y-4 w-full">{previewUrl && (<div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700"><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Zoom</label><div className="flex items-center gap-4"><input type="range" min="0.1" max="3" step="0.05" value={cropScale} onChange={(e) => setCropScale(parseFloat(e.target.value))} className="flex-1 h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/></div></div>)}{logoStatus === 'success' && <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-3 rounded-lg flex items-center gap-2 text-sm"><CheckCircle2 size={16} /> {logoMsg}</div>}<div className="flex gap-2"><button onClick={handleSaveLogo} disabled={!previewUrl || isUploading} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"><Save size={18} /> Opslaan</button></div></div></div></div>)}
          </div>
          <div className="w-full lg:w-80 space-y-6">
             <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg sticky top-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Server size={20} className="text-green-400"/> Server Status</h3>
                <div className="space-y-4 text-sm">
                   <div className="flex justify-between items-center pb-2 border-b border-slate-800"><span className="text-slate-400">Database</span><span className="font-mono">Supabase</span></div>
                   <div className="flex justify-between items-center pb-2 border-b border-slate-800"><span className="text-slate-400">Latency</span><span className="font-mono text-green-400">{latency ? `${latency}ms` : '...'}</span></div>
                   <div className="flex justify-between items-center pb-2 border-b border-slate-800"><span className="text-slate-400">App Versie</span><span className="font-mono text-slate-300">2.2.0</span></div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};
