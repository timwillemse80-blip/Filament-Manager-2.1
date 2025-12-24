
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, Save, ZoomIn, ZoomOut, Image as ImageIcon, CheckCircle2, AlertCircle, MessageSquare, Trash2, UserX, Database, Copy, RefreshCw, LayoutGrid, Weight, Tag, Layers, Plus, Server, Check, Activity, HardDrive, Shield, Share2, Square, CheckSquare, Users, Clock, Mail, Crown, ToggleLeft, ToggleRight, Loader2, X, Globe, Smartphone, Zap, Star, Sparkles, Disc, AlertTriangle, Eye, EyeOff, BarChart3, PieChart as PieChartIcon, TrendingUp, Box, ChevronRight, LogOut, ArrowLeft, History } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '../services/supabase';
import { useLogo } from '../contexts/LogoContext';
import { useLanguage } from '../contexts/LanguageContext';

type AdminTab = 'dashboard' | 'users' | 'sql' | 'logo' | 'spools' | 'data' | 'feedback' | 'requests';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

const MIGRATION_SQL = `-- 1. ZORG DAT KOLOMMEN BESTAAN
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. VEILIGE SYNC FUNCTIE (Met Foutafhandeling)
-- Deze functie kopieert login data, maar laat de login NOOIT falen.
CREATE OR REPLACE FUNCTION public.sync_user_login()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, last_login)
    VALUES (NEW.id, NEW.email, NEW.last_sign_in_at)
    ON CONFLICT (id) DO UPDATE
    SET last_login = EXCLUDED.last_login,
        email = EXCLUDED.email;
  EXCEPTION WHEN OTHERS THEN
    -- Als er iets misgaat, negeer de fout zodat de gebruiker gewoon kan inloggen
    RETURN NEW;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. HERACTIVEER TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_login();

-- 4. EENMALIGE SYNC VOOR BESTAANDE DATA
INSERT INTO public.profiles (id, email, last_login)
SELECT id, email, last_sign_in_at FROM auth.users
ON CONFLICT (id) DO UPDATE
SET last_login = EXCLUDED.last_login,
    email = EXCLUDED.email;`;

const MASTER_SQL = `-- FULL SETUP SQL (Met Fail-Safe Login Sync)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_pro boolean default false,
  showcase_name text,
  last_login timestamptz default now(),
  created_at timestamptz default now()
);

-- Fail-Safe Sync Functie
CREATE OR REPLACE FUNCTION public.sync_user_login()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, last_login)
    VALUES (NEW.id, NEW.email, NEW.last_sign_in_at)
    ON CONFLICT (id) DO UPDATE
    SET last_login = EXCLUDED.last_login,
        email = EXCLUDED.email;
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_login();

alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles for select using (auth.jwt()->>'email' = 'timwillemse@hotmail.com');
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- [Tabellen (locations, suppliers, filaments, etc.)]
create table if not exists public.locations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);
alter table public.locations enable row level security;
drop policy if exists "Users manage own locations" on public.locations;
create policy "Users manage own locations" on public.locations for all using (auth.uid() = user_id);

create table if not exists public.suppliers (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  website text,
  created_at timestamptz default now()
);
alter table public.suppliers enable row level security;
drop policy if exists "Users manage own suppliers" on public.suppliers;
create policy "Users manage own suppliers" on public.suppliers for all using (auth.uid() = user_id);

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
drop policy if exists "Users manage own filaments" on public.filaments;
create policy "Users manage own filaments" on public.filaments for all using (auth.uid() = user_id);

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
drop policy if exists "Users manage own materials" on public.other_materials;
create policy "Users manage own materials" on public.other_materials for all using (auth.uid() = user_id);

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
drop policy if exists "Users manage own printers" on public.printers;
create policy "Users manage own printers" on public.printers for all using (auth.uid() = user_id);

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
drop policy if exists "Users manage own prints" on public.print_jobs;
create policy "Users manage own prints" on public.print_jobs for all using (auth.uid() = user_id);

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
drop policy if exists "Everyone can send feedback" on public.feedback;
create policy "Everyone can send feedback" on public.feedback for insert with check (true);
drop policy if exists "Admins can view feedback" on public.feedback;
create policy "Admins can view feedback" on public.feedback for select using (true);
drop policy if exists "Admins can update feedback" on public.feedback;
create policy "Admins can update feedback" on public.feedback for update using (true);
drop policy if exists "Admins can delete feedback" on public.feedback;
create policy "Admins can delete feedback" on public.feedback for delete using (true);

create table if not exists public.deletion_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  reason text,
  created_at timestamptz default now()
);
alter table public.deletion_requests enable row level security;
drop policy if exists "Users can request deletion" on public.deletion_requests;
create policy "Users can request deletion" on public.deletion_requests for insert with check (auth.uid() = user_id);
drop policy if exists "Users view own request" on public.deletion_requests;
create policy "Users view own request" on public.deletion_requests for select using (auth.uid() = user_id);
drop policy if exists "Users cancel own request" on public.deletion_requests;
create policy "Users cancel own request" on public.deletion_requests for delete using (auth.uid() = user_id);

create table if not exists public.spool_weights (id bigint generated by default as identity primary key, name text, weight numeric);
create table if not exists public.brands (id bigint generated by default as identity primary key, name text unique);
create table if not exists public.materials (id bigint generated by default as identity primary key, name text unique);
create table if not exists public.global_settings (key text primary key, value text);

alter table public.spool_weights enable row level security;
alter table public.brands enable row level security;
alter table public.materials enable row level security;
alter table public.global_settings enable row level security;

drop policy if exists "Public read access" on public.spool_weights;
create policy "Public read access" on public.spool_weights for select using (true);
drop policy if exists "Public read access brands" on public.brands;
create policy "Public read access brands" on public.brands for select using (true);
drop policy if exists "Public read access materials" on public.materials;
create policy "Public read access materials" on public.materials for select using (true);
drop policy if exists "Public read access global" on public.global_settings;
create policy "Public read access global" on public.global_settings for select using (true);`;

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
  const [migrationCopied, setMigrationCopied] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);

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

        // Load Platform Distribution (Top Materials)
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
    await navigator.clipboard.writeText(MASTER_SQL);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const handleCopyMigration = async () => {
    await navigator.clipboard.writeText(MIGRATION_SQL);
    setMigrationCopied(true);
    setTimeout(() => setMigrationCopied(false), 2000);
    alert("Code gekopieerd! Plak dit in de Supabase SQL Editor.");
  };

  const loadUsers = async () => {
    setIsLoading(true);
    setNeedsMigration(false);
    try {
      // 1. Fetch profiles
      let profilesData: any[] = [];
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, email, is_pro, created_at, last_login')
        .order('created_at', { ascending: false });

      if (pError) {
         if (pError.message.includes('last_login')) {
            console.warn("last_login column missing, attempting fallback.");
            setNeedsMigration(true);
            const { data: fallbackProfiles, error: fError } = await supabase
               .from('profiles')
               .select('id, email, is_pro, created_at')
               .order('created_at', { ascending: false });
            
            if (fError) throw fError;
            profilesData = fallbackProfiles || [];
         } else {
            throw pError;
         }
      } else {
         profilesData = profiles || [];
         // Even if query works, if all are null, maybe needs a sync
         const nullLogins = profilesData.filter(u => !u.last_login).length;
         if (profilesData.length > 0 && nullLogins === profilesData.length) {
            setNeedsMigration(true);
         }
      }
      
      // 2. Fetch filaments to aggregate
      const { data: allFilaments, error: fError } = await supabase
        .from('filaments')
        .select('user_id, weightRemaining');

      if (fError) throw fError;

      // 3. Map everything together
      const mapped = profilesData.map((u: any) => {
        const userFilaments = (allFilaments || []).filter(f => f.user_id === u.id);
        const totalWeight = userFilaments.reduce((sum, f) => sum + (f.weightRemaining || 0), 0);
        
        return {
          ...u,
          filament_count: userFilaments.length,
          total_weight: totalWeight,
          last_login: u.last_login || null
        };
      });

      setUsers(mapped);
    } catch (e: any) {
      console.error("Fout bij laden gebruikers:", e);
      alert("Fout bij laden gebruikers: " + e.message);
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
      loadDashboardStats();
    } catch (e: any) {
      console.error("Pro toggle error details:", e);
      alert(`Fout bij bijwerken PRO status: ${e?.message}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setLogoStatus('idle');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!previewUrl) return;
    setIsUploading(true);
    setLogoStatus('idle');

    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise(resolve => img.onload = resolve);
      
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 400; 
      let w = img.width;
      let h = img.height;
      if (w > h) {
          if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; }
      } else {
          if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, w, h);
      const optimizedBase64 = canvas.toDataURL('image/png');

      const { error } = await supabase
        .from('global_settings')
        .upsert({ key: 'app_logo', value: optimizedBase64 });

      if (error) throw error;
      
      setLogoStatus('success');
      setLogoMsg('Logo succesvol bijgewerkt!');
      await refreshLogo();
    } catch (e: any) {
      setLogoStatus('error');
      setLogoMsg(e.message || 'Fout bij uploaden logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetLogo = async () => {
    if (!confirm("Wil je het aangepaste logo verwijderen en teruggaan naar het standaard logo?")) return;
    try {
      const { error } = await supabase.from('global_settings').delete().eq('key', 'app_logo');
      if (error) throw error;
      setPreviewUrl(null);
      setLogoFile(null);
      await refreshLogo();
      alert("Logo hersteld naar standaard.");
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
      const { error } = await supabase.from('feedback').update({ is_read: !currentStatus }).eq('id', id);
      if (error) throw error;
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, is_read: !currentStatus } : f));
    } catch (e: any) { alert(e.message); }
  };

  const deleteFeedback = async (id: number) => {
    if (!confirm("Feedback definitief verwijderen?")) return;
    setDeletingFeedbackId(id);
    try {
       const { error } = await supabase.from('feedback').delete().eq('id', id);
       if (error) throw error;
       setFeedbacks(prev => prev.filter(f => f.id !== id));
    } catch (e: any) { 
       console.error("Verwijder fout:", e);
       alert("Fout bij verwijderen: " + (e.message || "Onbekende fout. Controleer SQL policies.")); 
    } finally {
       setDeletingFeedbackId(null);
    }
  };
  
  const loadRequests = async () => { 
    setIsLoading(true); 
    const { data } = await supabase.from('deletion_requests').select('*').order('created_at', { ascending: false }); 
    if (data) setRequests(data); 
    setIsLoading(false); 
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Verzoek verwijderen uit lijst?")) return;
    try {
      const { error } = await supabase.from('deletion_requests').delete().eq('id', id);
      if (error) throw error;
      loadRequests();
    } catch (e: any) { alert(e.message); }
  };

  const loadSpoolWeights = async () => { setIsLoading(true); const { data } = await supabase.from('spool_weights').select('*').order('name'); if (data) setSpoolWeights(data); setIsLoading(false); };
  const loadBrands = async () => { const { data } = await supabase.from('brands').select('*').order('name'); if (data) setBrands(data || []); };
  const loadMaterials = async () => { const { data } = await supabase.from('materials').select('*').order('name'); if (data) setMaterials(data || []); };

  const handleAddSpool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpool.name || !newSpool.weight) return;
    try {
       const { error } = await supabase.from('spool_weights').insert({ name: newSpool.name, weight: Number(newSpool.weight) });
       if (error) throw error;
       setNewSpool({ name: '', weight: '' });
       loadSpoolWeights();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteSpool = async (id: number) => {
    if (!confirm("Zeker weten?")) return;
    try {
       const { error } = await supabase.from('spool_weights').delete().eq('id', id);
       if (error) throw error;
       loadSpoolWeights();
    } catch (e: any) { alert(e.message); }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.trim()) return;
    try {
       const { error } = await supabase.from('brands').insert({ name: newBrand.trim() });
       if (error) throw error;
       setNewBrand('');
       loadBrands();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteBrand = async (id: number) => {
    if (!confirm("Zeker weten?")) return;
    try {
       const { error } = await supabase.from('brands').delete().eq('id', id);
       if (error) throw error;
       loadBrands();
    } catch (e: any) { alert(e.message); }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.trim()) return;
    try {
       const { error } = await supabase.from('materials').insert({ name: newMaterial.trim() });
       if (error) throw error;
       setNewMaterial('');
       loadMaterials();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!confirm("Zeker weten?")) return;
    try {
       const { error } = await supabase.from('materials').delete().eq('id', id);
       if (error) throw error;
       loadMaterials();
    } catch (e: any) { alert(e.message); }
  };

  const formatLastLogin = (dateStr: string | null) => {
     if (!dateStr) return <span className="text-slate-400 italic">Geen data</span>;
     const date = new Date(dateStr);
     const now = new Date();
     const isToday = date.toDateString() === now.toDateString();
     
     return (
        <>
           <div className="text-sm dark:text-white font-bold">
              {isToday ? 'Vandaag' : date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' })}
           </div>
           <div className="text-[10px] text-slate-400">
              {date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
           </div>
        </>
     );
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
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                         <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={48} className="text-blue-500" />
                         </div>
                         <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Gebruikers</h3>
                         <p className="text-3xl font-black text-slate-800 dark:text-white">{tableCounts.totalUsers}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                         <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Crown size={48} className="text-amber-500" />
                         </div>
                         <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">PRO Leden</h3>
                         <p className="text-3xl font-black text-amber-500">{tableCounts.proUsers}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                         <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Disc size={48} className="text-emerald-500" />
                         </div>
                         <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Filaments</h3>
                         <p className="text-3xl font-black text-slate-800 dark:text-white">{tableCounts.filaments}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                         <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Box size={48} className="text-purple-500" />
                         </div>
                         <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Materialen</h3>
                         <p className="text-3xl font-black text-slate-800 dark:text-white">{tableCounts.materials}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                         <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <MessageSquare size={48} className="text-purple-600" />
                         </div>
                         <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Open Feedback</h3>
                         <p className="text-3xl font-black text-purple-600">{feedbacks.filter(f => !f.is_read).length}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[32px] shadow-xl text-white relative overflow-hidden group border border-slate-700/50">
                         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform scale-150">
                            <Database size={120} />
                         </div>
                         <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6">
                               <div className="bg-blue-500/20 p-3 rounded-2xl border border-blue-500/30">
                                  <Database size={28} className="text-blue-400" />
                               </div>
                               <div>
                                  <h3 className="text-2xl font-black tracking-tight">Database Setup</h3>
                                  <p className="text-slate-400 text-sm font-bold">Initialiseer of update tabellen</p>
                               </div>
                            </div>
                            <div className="flex flex-col gap-3 mb-8">
                                <button 
                                    onClick={handleCopyMigration}
                                    className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg transform active:scale-[0.98] ${migrationCopied ? 'bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-900/20'}`}
                                >
                                    {migrationCopied ? <Check size={20} /> : <Zap size={20} />}
                                    {migrationCopied ? 'Migration Gekopieerd!' : 'Update Kolommen (Migration)'}
                                </button>
                                <button 
                                    onClick={handleCopySql}
                                    className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg transform active:scale-[0.98] ${sqlCopied ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'}`}
                                >
                                    {sqlCopied ? <Check size={20} /> : <Copy size={20} />}
                                    {sqlCopied ? 'Full SQL Gekopieerd!' : 'Installatie SQL Kopiëren'}
                                </button>
                            </div>
                         </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="text-slate-800 dark:text-white font-bold mb-6 flex items-center gap-2"><PieChartIcon size={20} className="text-blue-500" /> Platform Materiaal Distributie</h3>
                         <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <PieChart>
                                  <Pie
                                     data={platformMaterialData}
                                     cx="50%"
                                     cy="50%"
                                     innerRadius={60}
                                     outerRadius={80}
                                     paddingAngle={5}
                                     dataKey="value"
                                  >
                                     {platformMaterialData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                     ))}
                                  </Pie>
                                  <Tooltip />
                               </PieChart>
                            </ResponsiveContainer>
                         </div>
                         <div className="flex wrap justify-center gap-x-4 gap-y-2 mt-4">
                            {platformMaterialData.map((entry, index) => (
                               <div key={index} className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                  <span>{entry.name}: {entry.value}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                      <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                         <h3 className="text-slate-800 dark:text-white font-bold mb-4 flex items-center gap-2"><Activity size={20} className="text-orange-500" /> Platform Actie Vereist</h3>
                         <div className="space-y-3 flex-1">
                            {requests.length > 0 && (
                               <button onClick={() => setActiveTab('requests')} className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl hover:scale-[1.02] transition-transform group">
                                  <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                                     <AlertTriangle size={20} />
                                     <span className="font-bold">{requests.length} Verwijder verzoeken</span>
                                  </div>
                                  <ChevronRight size={18} className="text-red-300 group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                            {feedbacks.filter(f => !f.is_read).length > 0 && (
                               <button onClick={() => setActiveTab('feedback')} className="w-full flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl hover:scale-[1.02] transition-transform group">
                                  <div className="flex items-center gap-3 text-purple-700 dark:text-purple-400">
                                     <MessageSquare size={20} />
                                     <span className="font-bold">{feedbacks.filter(f => !f.is_read).length} Ongelezen feedback</span>
                                  </div>
                                  <ChevronRight size={18} className="text-purple-300 group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                            {requests.length === 0 && feedbacks.filter(f => !f.is_read).length === 0 && (
                               <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60 min-h-[100px]">
                                  <CheckCircle2 size={48} className="mb-3 text-emerald-500" />
                                  <p className="font-bold">Alles bijgewerkt!</p>
                               </div>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'users' && (
                <div className="space-y-4">
                   {needsMigration && (
                       <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-900/50 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                          <div className="flex items-center gap-4 text-center sm:text-left">
                             <div className="bg-amber-100 dark:bg-amber-800 p-3 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0">
                                <AlertTriangle size={32} />
                             </div>
                             <div>
                                <h4 className="font-bold text-amber-800 dark:text-amber-200 text-lg">Data Sync Vereist</h4>
                                <p className="text-sm text-amber-700 dark:text-amber-300 opacity-80">De 'last_login' kolom ontbreekt of is niet gekoppeld aan de Supabase Auth omgeving.</p>
                             </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                              <button 
                                onClick={handleCopyMigration}
                                className="flex-1 sm:flex-none px-6 py-3 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2"
                              >
                                <Copy size={16} /> Kopieer SQL
                              </button>
                              <button 
                                onClick={() => setActiveTab('sql')}
                                className="flex-1 sm:flex-none px-6 py-3 bg-amber-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-amber-500 transition-colors"
                              >
                                Fix Nu
                              </button>
                          </div>
                       </div>
                   )}

                   <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                         <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <Users size={24} className="text-blue-500"/> Gebruikers ({users.length})
                         </h3>
                         <button 
                            onClick={loadUsers}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                         >
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Vernieuwen</span>
                         </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                              <tr>
                                 <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Gebruiker</th>
                                 <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                 <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">{t('totalFilament')}</th>
                                 <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">{t('lastLogin')}</th>
                                 <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Registratie</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                              {users.map(u => (
                                 <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-6">
                                       <div className="font-bold text-base dark:text-white truncate max-w-[200px]">{u.email || u.id.substring(0,8)}</div>
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
                                    <td className="p-6 text-center">
                                       <div className="font-bold dark:text-white">{((u.total_weight || 0) / 1000).toFixed(1)} kg</div>
                                       <div className="text-[10px] text-slate-400 uppercase font-black">{u.filament_count} spools</div>
                                    </td>
                                    <td className="p-6 text-center">
                                       {formatLastLogin(u.last_login)}
                                    </td>
                                    <td className="p-6 text-center">
                                       <span className="text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</span>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                        {users.length === 0 && !isLoading && (
                           <div className="p-12 text-center text-slate-400 font-bold">
                              Geen gebruikers gevonden.
                           </div>
                        )}
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'logo' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Upload size={24} className="text-indigo-500"/> Logo Uploaden
                      </h3>
                      
                      <div 
                         onClick={() => fileInputRef.current?.click()}
                         className="group relative aspect-square max-w-[250px] mx-auto rounded-3xl border-4 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all overflow-hidden"
                      >
                         {previewUrl ? (
                            <img src={previewUrl} className="w-full h-full object-contain p-4" alt="Preview" />
                         ) : (
                            <>
                               <ImageIcon size={48} className="text-slate-300 group-hover:text-indigo-400 transition-colors mb-4" />
                               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-500">Klik om te uploaden</span>
                            </>
                         )}
                         <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                      </div>

                      <div className="mt-8 space-y-3">
                         <button 
                            onClick={handleLogoUpload}
                            disabled={!previewUrl || isUploading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                         >
                            {isUploading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            Logo Opslaan
                         </button>
                         <button 
                            onClick={handleResetLogo}
                            className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
                         >
                            <RefreshCw size={18} /> Herstel naar Standaard
                         </button>
                      </div>

                      {logoStatus !== 'idle' && (
                         <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${logoStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {logoStatus === 'success' ? <Check size={18}/> : <AlertCircle size={18}/>}
                            <span className="text-sm font-medium">{logoMsg}</span>
                         </div>
                      )}
                   </div>

                   <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
                      <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-8">Huidige Live Logo</h3>
                      <div className="w-48 h-48 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-100 dark:border-slate-700 p-8">
                         {currentAppLogo ? (
                            <img src={currentAppLogo} className="w-full h-full object-contain" alt="Current App Logo" />
                         ) : (
                            <div className="text-slate-300 italic text-sm">Geen aangepast logo ingesteld</div>
                         )}
                      </div>
                      <p className="text-xs text-slate-400 mt-6 max-w-xs">Dit logo verschijnt in de zijbalk, op het inlogscherm en als favicon in de browser.</p>
                   </div>
                </div>
             )}

             {activeTab === 'feedback' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                   <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3">
                         <MessageSquare size={24} className="text-purple-500"/> Gebruikers Feedback ({feedbacks.length})
                      </h3>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                           <tr>
                              <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest w-12 text-center">Status</th>
                              <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Bericht</th>
                              <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Rating</th>
                              <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Datum</th>
                              <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Acties</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                           {feedbacks.map(f => (
                              <tr key={f.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${!f.is_read ? 'bg-purple-50/30 dark:bg-purple-900/5' : ''} ${deletingFeedbackId === f.id ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                 <td className="p-6 text-center">
                                    {f.is_read ? (
                                       <span className="text-slate-400" title="Gelezen"><Eye size={18} /></span>
                                    ) : (
                                       <span className="text-purple-600" title="Nieuw"><EyeOff size={18} /></span>
                                    )}
                                 </td>
                                 <td className="p-6">
                                    <p className="text-sm dark:text-white whitespace-pre-wrap max-w-lg">{f.message}</p>
                                    <div className="text-[10px] text-slate-400 font-mono mt-2 uppercase">{f.platform || 'Onbekend'} • {f.user_id ? f.user_id.substring(0,8) : 'Anoniem'}</div>
                                 </td>
                                 <td className="p-6 text-center">
                                    <div className="flex justify-center gap-0.5">
                                       {[1,2,3,4,5].map(s => (
                                          <Star key={s} size={12} fill={s <= (f.rating || 0) ? "#fbbf24" : "none"} className={s <= (f.rating || 0) ? "text-amber-400" : "text-slate-300 dark:text-slate-700"} />
                                       ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 mt-1 block">{f.rating || 0}/5</span>
                                 </td>
                                 <td className="p-6 text-xs text-slate-400 whitespace-nowrap">
                                    {new Date(f.created_at).toLocaleDateString()}<br/>
                                    {new Date(f.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </td>
                                 <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2">
                                       <button 
                                          onClick={() => toggleFeedbackRead(f.id, f.is_read)}
                                          className={`p-2 rounded-lg transition-colors ${f.is_read ? 'text-slate-400 hover:bg-slate-100' : 'text-purple-600 bg-purple-100 hover:bg-purple-200'}`}
                                          title={f.is_read ? t('markAsUnread') : t('markAsRead')}
                                       >
                                          <Check size={18}/>
                                       </button>
                                       <button 
                                          onClick={() => deleteFeedback(f.id)}
                                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                          disabled={deletingFeedbackId === f.id}
                                          title={t('delete')}
                                       >
                                          {deletingFeedbackId === f.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18}/>}
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                   </div>
                </div>
             )}

             {activeTab === 'requests' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                   <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3">
                         <AlertTriangle size={24} className="text-red-500"/> Account Verwijder Verzoeken ({requests.length})
                      </h3>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                           <tr>
                              <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Gebruiker</th>
                              <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Reden</th>
                              <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Datum</th>
                              <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actie</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                           {requests.map(r => (
                              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                 <td className="p-6 font-bold dark:text-white">{r.email}</td>
                                 <td className="p-6 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">{r.reason}</td>
                                 <td className="p-6 text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                                 <td className="p-6 text-right">
                                    <button onClick={() => handleDeleteRequest(r.id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                                       <Check size={18}/>
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                   </div>
                </div>
             )}

             {activeTab === 'spools' && (
                <div className="space-y-6">
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Plus size={20} className="text-emerald-500"/> Nieuwe Spoel Toevoegen</h3>
                      <form onSubmit={handleAddSpool} className="flex flex-col md:flex-row gap-4">
                         <input 
                           type="text" 
                           value={newSpool.name}
                           onChange={e => setNewSpool({...newSpool, name: e.target.value})}
                           placeholder="Naam (bv. Bambu Lab Karton)"
                           className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                         />
                         <div className="relative w-full md:w-40">
                            <input 
                              type="number" 
                              value={newSpool.weight}
                              onChange={e => setNewSpool({...newSpool, weight: e.target.value})}
                              placeholder="Gewicht"
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                            />
                            <span className="absolute right-3 top-3.5 text-slate-400 text-sm">gram</span>
                         </div>
                         <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg active:scale-95">Toevoegen</button>
                      </form>
                   </div>

                   <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                         <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <Disc size={20} className="text-emerald-500"/> Geregistreerde Spoelen ({spoolWeights.length})
                         </h3>
                      </div>
                      <div className="max-h-[500px] overflow-y-auto">
                         <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                               <tr>
                                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Naam</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Gewicht</th>
                                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actie</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                               {spoolWeights.map(s => (
                                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                     <td className="p-4 font-medium dark:text-white">{s.name}</td>
                                     <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{s.weight}g</td>
                                     <td className="p-4 text-right">
                                        <button onClick={() => handleDeleteSpool(s.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'data' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Plus size={20} className="text-amber-500"/> Nieuw Merk</h3>
                         <form onSubmit={handleAddBrand} className="flex gap-2">
                            <input 
                              type="text" 
                              value={newBrand}
                              onChange={e => setNewBrand(e.target.value)}
                              placeholder="Merknaam..."
                              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                            />
                            <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95">Voeg toe</button>
                         </form>
                      </div>

                      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
                         <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3">
                               <Tag size={20} className="text-amber-500"/> Merken ({brands.length})
                            </h3>
                         </div>
                         <div className="overflow-y-auto">
                            <table className="w-full text-left">
                               <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                  {brands.map(b => (
                                     <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 group">
                                        <td className="p-4 text-sm font-medium dark:text-white">{b.name}</td>
                                        <td className="p-4 text-right">
                                           <button onClick={() => handleDeleteBrand(b.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                                        </td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Plus size={20} className="text-blue-500"/> Nieuw Materiaal Type</h3>
                         <form onSubmit={handleAddMaterial} className="flex gap-2">
                            <input 
                              type="text" 
                              value={newMaterial}
                              onChange={e => setNewMaterial(e.target.value)}
                              placeholder="bv. PETG-CF"
                              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            />
                            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95">Voeg toe</button>
                         </form>
                      </div>

                      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
                         <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3">
                               <Layers size={20} className="text-blue-500"/> Materiaal Types ({materials.length})
                            </h3>
                         </div>
                         <div className="overflow-y-auto">
                            <table className="w-full text-left">
                               <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                  {materials.map(m => (
                                     <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 group">
                                        <td className="p-4 text-sm font-medium dark:text-white">{m.name}</td>
                                        <td className="p-4 text-right">
                                           <button onClick={() => handleDeleteMaterial(m.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                                        </td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   </div>
                </div>
             )}
          </div>
       </div>

       <div className="w-full mt-4">
          <div className="bg-[#0b1221] rounded-[40px] p-10 text-white shadow-2xl border border-slate-800/50">
             <div className="flex flex-col lg:flex-row items-center gap-10">
                
                <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-2 flex-shrink-0 lg:pr-10 lg:border-r lg:border-slate-800/60">
                   <Server size={42} className="text-[#10b981]"/>
                   <div>
                      <h3 className="font-bold text-2xl lg:text-3xl leading-none">Server</h3>
                      <h3 className="font-bold text-2xl lg:text-3xl leading-none">Status</h3>
                   </div>
                </div>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-x-12 gap-y-6 w-full">
                   <div className="space-y-1">
                      <span className="text-slate-500 text-xs font-black uppercase tracking-widest block">Status</span>
                      <span className="text-[#10b981] font-black text-lg flex items-center gap-2">
                         <span className="w-2.5 h-2.5 bg-[#10b981] rounded-full shadow-[0_0_10px_#10b981]"></span> Online
                      </span>
                   </div>
                   
                   <div className="space-y-1">
                      <span className="text-slate-500 text-xs font-black uppercase tracking-widest block">Database</span>
                      <span className="text-white font-black text-lg block">Supabase (PG)</span>
                   </div>

                   <div className="space-y-1">
                      <span className="text-slate-500 text-xs font-black uppercase tracking-widest block">Regio</span>
                      <span className="text-slate-200 font-mono text-lg font-black">eu-central-1</span>
                   </div>

                   <div className="space-y-1">
                      <span className="text-slate-500 text-xs font-black uppercase tracking-widest block flex items-center gap-2"><Sparkles size={12} className="text-purple-400" /> Gemini AI</span>
                      <span className={`${isAiConfigured ? 'text-[#10b981]' : 'text-red-500'} font-black text-lg flex items-center gap-2`}>
                         <span className={`w-2.5 h-2.5 ${isAiConfigured ? 'bg-[#10b981] shadow-[0_0_10px_#10b981]' : 'bg-red-50 shadow-[0_0_10px_red]'} rounded-full`}></span> {isAiConfigured ? 'Actief' : 'Mist Sleutel'}
                      </span>
                   </div>

                   <div className="space-y-1">
                      <span className="text-slate-500 text-xs font-black uppercase tracking-widest block flex items-center gap-2"><Activity size={12} className="text-slate-500" /> Latency</span>
                      <span className="text-[#10b981] font-mono text-lg font-black">{latency ? `${latency}ms` : '---'}</span>
                   </div>

                   <div className="space-y-1">
                      <span className="text-slate-500 text-xs font-black uppercase tracking-widest block flex items-center gap-2"><Shield size={12} className="text-slate-500" /> Versie</span>
                      <span className={`${isAiConfigured ? 'text-[#3b82f6]' : 'text-slate-400'} font-mono text-lg font-black`}>2.1.30</span>
                   </div>
                </div>

                <div className="flex gap-4 flex-shrink-0 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-slate-800/60 pt-8 lg:pt-0 lg:pl-10">
                   <div className="bg-[#1a2333] py-4 px-6 rounded-2xl flex-1 lg:flex-none flex items-center gap-4 border border-slate-800 transition-all hover:border-slate-700 min-w-[140px]">
                      <span className="text-3xl font-black text-white">{tableCounts.logs || 0}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-tight">PRINT<br/>LOGS</span>
                   </div>
                   <div className="bg-[#1a2333] py-4 px-6 rounded-2xl flex-1 lg:flex-none flex items-center gap-4 border border-slate-800 transition-all hover:border-slate-700 min-w-[140px]">
                      <span className="text-3xl font-black text-white">{tableCounts.filaments || 0}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-tight">FILA<br/>MENTEN</span>
                   </div>
                </div>

             </div>
          </div>
       </div>
    </div>
  );
};
