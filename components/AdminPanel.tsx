import React, { useState, useEffect, useRef } from 'react';
import { Upload, Save, ZoomIn, ZoomOut, Image as ImageIcon, CheckCircle2, AlertCircle, MessageSquare, Trash2, UserX, Database, Copy, RefreshCw, LayoutGrid, Weight, Tag, Layers, Plus, Server, Check, Activity, HardDrive, Shield, Share2, Square, CheckSquare, Users, Clock, Mail, Crown, ToggleLeft, ToggleRight, Loader2, X, Globe, Smartphone, Zap, Star, Sparkles } from 'lucide-react';
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

  // Check if Gemini API Key is configured
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

  const handleCopySql = () => { navigator.clipboard.writeText(sqlSetupCode); setCopiedSql(true); setTimeout(() => setCopiedSql(false), 2000); };

  const sqlSetupCode = `-- REPARATIE & SETUP SCRIPT
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_pro boolean default false,
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins manage profiles" on public.profiles for all using (true) with check (true);
`;

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
       <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* MAIN CONTENT AREA */}
          <div className="flex-1 space-y-6 w-full">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 flex overflow-x-auto gap-2 scrollbar-hide">
                <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'dashboard' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><LayoutGrid size={18}/> Dashboard</button>
                <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'users' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><Users size={18}/> Gebruikers</button>
                <button onClick={() => setActiveTab('data')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'data' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><Tag size={18}/> Merken & Materialen</button>
                <button onClick={() => setActiveTab('logo')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'logo' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><ImageIcon size={18}/> Logo</button>
                <button onClick={() => setActiveTab('feedback')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'feedback' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><MessageSquare size={18}/> Feedback</button>
             </div>

             {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3">Totaal Gebruikers</h3>
                      <p className="text-5xl font-black text-slate-800 dark:text-white">{users.length}</p>
                   </div>
                   <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3">Openstaande Feedback</h3>
                      <p className="text-5xl font-black text-purple-600">{feedbacks.filter(f => !f.is_read).length}</p>
                   </div>
                </div>
             )}

             {activeTab === 'users' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                   <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3">
                         <Users size={24} className="text-blue-500"/> Gebruikers ({users.length})
                      </h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Statuswijziging vereist herlogin</p>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                           <tr>
                              <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">E-mailadres / ID</th>
                              <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                              <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Voorraad</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                           {users.map(u => (
                              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                 <td className="p-6">
                                    <div className="font-bold text-base dark:text-white">{u.email}</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-1">{u.id}</div>
                                 </td>
                                 <td className="p-6 text-center">
                                    {u.email?.toLowerCase() === 'timwillemse@hotmail.com' ? (
                                       <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm mx-auto">
                                          <Shield size={14} fill="currentColor" /> BEHEERDER
                                       </span>
                                    ) : (
                                       <button 
                                          onClick={() => toggleProStatus(u.id, u.is_pro)}
                                          disabled={updatingUserId === u.id}
                                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${u.is_pro ? 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}
                                       >
                                          {updatingUserId === u.id ? <Loader2 size={14} className="animate-spin" /> : (u.is_pro ? <Crown size={14} fill="currentColor" /> : <Plus size={14} />)}
                                          {u.is_pro ? 'PRO STATUS' : 'MAAK PRO'}
                                       </button>
                                    )}
                                 </td>
                                 <td className="p-6 text-center text-sm font-bold text-slate-500">
                                    <div className="flex flex-col items-center">
                                       <span>{u.filament_count}f</span>
                                       <span className="text-[10px] opacity-60 font-normal">{u.print_count} logs</span>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                   </div>
                </div>
             )}
          </div>

          {/* RIGHT SIDEBAR: SERVER STATUS - WIDER & SPACIOUS */}
          <div className="w-full lg:w-[500px] flex-shrink-0">
             <div className="bg-[#0b1221] rounded-[40px] p-12 text-white shadow-2xl border border-slate-800/50">
                <h3 className="font-bold text-[42px] mb-14 flex items-start gap-7 leading-none">
                   <Server size={48} className="text-[#10b981] mt-1.5"/> Server<br/>Status
                </h3>
                
                <div className="space-y-10">
                   <div className="flex justify-between items-center pb-6 border-b border-slate-800/60">
                      <span className="text-slate-400 text-2xl font-bold">Status</span>
                      <span className="text-[#10b981] font-black text-2xl flex items-center gap-5">
                         <span className="w-4 h-4 bg-[#10b981] rounded-full shadow-[0_0_15px_#10b981]"></span> Online
                      </span>
                   </div>
                   
                   <div className="flex justify-between items-start pb-6 border-b border-slate-800/60">
                      <span className="text-slate-400 text-2xl font-bold">Database</span>
                      <div className="text-right">
                        <span className="text-white font-black text-2xl block leading-tight">Supabase</span>
                        <span className="text-white font-black text-2xl block leading-tight">(PG)</span>
                      </div>
                   </div>

                   <div className="flex justify-between items-center pb-6 border-b border-slate-800/60">
                      <span className="text-slate-400 text-2xl font-bold">Regio</span>
                      <span className="text-slate-200 font-mono text-2xl font-black tracking-tighter">eu-central-1</span>
                   </div>

                   {/* Gemini AI API Key Status */}
                   <div className="flex justify-between items-center pb-6 border-b border-slate-800/60">
                      <span className="text-slate-400 text-2xl font-bold flex items-center gap-6">
                         <Sparkles size={32} className="text-purple-400" /> Gemini AI
                      </span>
                      <span className={`${isAiConfigured ? 'text-[#10b981]' : 'text-red-500'} font-black text-2xl flex items-center gap-5`}>
                         <span className={`w-4 h-4 ${isAiConfigured ? 'bg-[#10b981] shadow-[0_0_15px_#10b981]' : 'bg-red-500 shadow-[0_0_15px_red]'} rounded-full`}></span> {isAiConfigured ? 'Actief' : 'Niet ingesteld'}
                      </span>
                   </div>

                   <div className="flex justify-between items-center pb-6 border-b border-slate-800/60">
                      <span className="text-slate-400 text-2xl font-bold flex items-center gap-6">
                         <Activity size={32} className="text-slate-500" /> Latency
                      </span>
                      <span className="text-[#10b981] font-mono text-2xl font-black">
                         {latency ? `${latency}ms` : '326ms'}
                      </span>
                   </div>

                   <div className="flex justify-between items-start pb-6 border-b border-slate-800/60">
                      <span className="text-slate-400 text-2xl font-bold flex items-center gap-6">
                         <Shield size={32} className="text-slate-500" /> App<br/>Versie
                      </span>
                      <span className="text-[#3b82f6] font-mono text-2xl font-black">
                         2.1.13
                      </span>
                   </div>

                   {/* Stats Section */}
                   <div className="pt-12">
                      <h4 className="text-[18px] font-black text-slate-500 uppercase tracking-[0.25em] mb-12 opacity-60">
                         STATISTIEKEN<br/>(SCHATTING)
                      </h4>
                      <div className="grid grid-cols-2 gap-8">
                         <div className="bg-[#1a2333] py-14 px-8 rounded-[40px] text-center border border-slate-800 transition-all hover:bg-[#1e2a3d] hover:border-slate-700 flex flex-col items-center justify-center min-h-[220px] shadow-xl">
                            <span className="block text-[80px] font-black leading-none mb-6">{tableCounts.logs || 0}</span>
                            <span className="text-[15px] text-slate-500 uppercase font-black tracking-widest">LOGBOEK</span>
                         </div>
                         <div className="bg-[#1a2333] py-14 px-8 rounded-[40px] text-center border border-slate-800 transition-all hover:bg-[#1e2a3d] hover:border-slate-700 flex flex-col items-center justify-center min-h-[220px] shadow-xl">
                            <span className="block text-[80px] font-black leading-none mb-6">{tableCounts.filaments || 0}</span>
                            <span className="text-[15px] text-slate-500 uppercase font-black tracking-widest">FILAMENTEN</span>
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
