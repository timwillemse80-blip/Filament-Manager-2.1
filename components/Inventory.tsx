
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Filament, Location, Supplier, OtherMaterial } from '../types';
/* Added ChevronRight to imports */
import { Edit2, Trash2, Weight, MapPin, Truck, ShoppingCart, Euro, Layers, QrCode, ArrowLeft, Package, Search, ArrowUpDown, CheckSquare, Square, X, Filter, Globe, Wrench, Box, Plus, Lock, Crown, ArrowRight, Maximize2, ZoomIn, ScanLine, Loader2, Camera, Sparkles, Construction, ChevronRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '../contexts/LanguageContext';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { lookupSpoolFromImage } from '../services/geminiService';

interface InventoryProps {
  filaments: Filament[];
  materials: OtherMaterial[];
  locations: Location[];
  suppliers: Supplier[];
  onEdit: (item: Filament | OtherMaterial, type: 'filament' | 'material') => void;
  onQuickAdjust: (id: string, amount: number) => void;
  onMaterialAdjust: (id: string, amount: number) => void;
  onDelete: (id: string, type: 'filament' | 'material') => void;
  onBatchDelete?: (ids: string[], type: 'filament' | 'material') => void;
  onNavigate: (view: any) => void;
  onShowLabel: (id: string) => void;
  threshold: number;
  activeGroupKey: string | null;
  onSetActiveGroupKey: (key: string | null) => void;
  isAdmin?: boolean;
  onAddClick: (type: 'filament' | 'material') => void;
  onUnlockPro?: () => void;
}

type SortOption = 'name-asc' | 'name-desc' | 'weight-asc' | 'weight-desc' | 'date-new' | 'date-old';
type InventoryTab = 'filament' | 'material';

const normalizeForGrouping = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/) 
    .sort()       
    .join('');    
};

const getBaseMaterial = (str: string) => {
  if (!str) return '';
  const s = str.toLowerCase();
  if (s.includes('pla')) return 'pla';
  if (s.includes('petg')) return 'petg';
  if (s.includes('abs')) return 'abs';
  if (s.includes('asa')) return 'asa';
  if (s.includes('tpu')) return 'tpu';
  if (s.includes('nylon') || s.includes('pa')) return 'nylon';
  if (s.includes('pc')) return 'pc';
  if (s.includes('hips')) return 'hips';
  if (s.includes('pva')) return 'pva';
  return normalizeForGrouping(str);
};

const getDomain = (url?: string) => {
  if (!url) return null;
  try {
    let hostname = new URL(url).hostname;
    hostname = hostname.replace(/^www\./, '');
    return hostname;
  } catch (e) {
    return url.substring(0, 20) + '...';
  }
};

export const Inventory: React.FC<InventoryProps> = ({ 
  filaments, materials, locations, suppliers, onEdit, onQuickAdjust, onMaterialAdjust, onDelete, onBatchDelete,
  onNavigate, onShowLabel, threshold, activeGroupKey, onSetActiveGroupKey, isAdmin, onAddClick, onUnlockPro
}) => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('filament');
  const [filter, setFilter] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const { t, tColor } = useLanguage();

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Web Camera State
  const [showWebCamera, setShowWebCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomedImage(null); };
    if (zoomedImage) { document.body.style.overflow = 'hidden'; window.addEventListener('keydown', handleEsc); }
    else { document.body.style.overflow = ''; window.removeEventListener('keydown', handleEsc); }
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handleEsc); };
  }, [zoomedImage]);

  const availableFilamentMaterials = useMemo(() => {
    const mats = new Set(filaments.map(f => f.material).filter(Boolean));
    return Array.from(mats).sort();
  }, [filaments]);

  const filteredFilaments = filaments.filter(f => {
    const lowerFilter = filter.toLowerCase().trim();
    if (lowerFilter.startsWith('#')) return f.shortId?.toLowerCase() === lowerFilter.substring(1);
    if (lowerFilter.length === 4 && f.shortId?.toLowerCase() === lowerFilter) return true;
    const matchesSearch = f.brand.toLowerCase().includes(lowerFilter) || f.colorName.toLowerCase().includes(lowerFilter) || f.material.toLowerCase().includes(lowerFilter) || (f.shortId && f.shortId.toLowerCase().includes(lowerFilter));
    const matchesMaterial = selectedMaterial ? f.material === selectedMaterial : true;
    return matchesSearch && matchesMaterial;
  });

  const groupedFilaments = useMemo(() => {
    const groups: Record<string, Filament[]> = {};
    filteredFilaments.forEach(f => {
      const b = normalizeForGrouping(f.brand);
      const m = getBaseMaterial(f.material); 
      const c = normalizeForGrouping(f.colorName);
      const key = `${b}-${m}-${c}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    return groups;
  }, [filteredFilaments]);

  const sortedGroups = useMemo(() => {
    return Object.entries(groupedFilaments).sort(([, itemsA], [, itemsB]) => {
      const listA = itemsA as Filament[]; const listB = itemsB as Filament[];
      const firstA = listA[0]; const firstB = listB[0];
      const weightA = listA.reduce((sum, f) => sum + f.weightRemaining, 0);
      const weightB = listB.reduce((sum, f) => sum + f.weightRemaining, 0);
      switch (sortBy) {
        case 'name-asc': return firstA.brand.localeCompare(firstB.brand) || firstA.colorName.localeCompare(firstB.colorName);
        case 'name-desc': return firstB.brand.localeCompare(firstA.brand) || firstB.colorName.localeCompare(firstA.colorName);
        case 'weight-asc': return weightA - weightB;
        case 'weight-desc': return weightB - weightA;
        case 'date-new': return new Date(firstB.purchaseDate).getTime() - new Date(firstA.purchaseDate).getTime();
        case 'date-old': return new Date(firstA.purchaseDate).getTime() - new Date(firstB.purchaseDate).getTime();
        default: return 0;
      }
    });
  }, [groupedFilaments, sortBy]);

  const processScanResult = async (base64String: string) => {
    setIsScanning(true);
    try {
       const foundId = await lookupSpoolFromImage(base64String);
       if (foundId) {
          setFilter(foundId); onSetActiveGroupKey(null);
          const match = filaments.find(f => f.shortId?.toLowerCase() === foundId.toLowerCase());
          if (match) onEdit(match, 'filament');
       } else alert(t('lookupNotFound'));
    } catch (e: any) { alert(t('failed')); } finally { setIsScanning(false); }
  };

  const handleQuickScan = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await CapacitorCamera.getPhoto({ quality: 90, resultType: CameraResultType.Base64, source: CameraSource.Camera, width: 1200 });
        if (image.base64String) await processScanResult(image.base64String);
      } catch (e) { console.warn("Camera cancelled"); }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) { videoRef.current.srcObject = stream; setShowWebCamera(true); }
      } catch (e) { alert("Camera toegang geweigerd."); }
    }
  };

  const stopWebCamera = () => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    setShowWebCamera(false);
  };

  const captureWebImage = () => {
     if (!videoRef.current || !canvasRef.current) return;
     const ctx = canvasRef.current.getContext('2d'); if (!ctx) return;
     canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight;
     ctx.drawImage(videoRef.current, 0, 0);
     const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.85).split(',')[1];
     stopWebCamera(); processScanResult(base64Image);
  };

  const toggleSelection = (id: string) => {
     const newSet = new Set(selectedIds);
     if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
     setSelectedIds(newSet);
  };

  const renderFilamentCard = (filament: Filament) => {
    const percentage = Math.max(0, Math.min(100, (filament.weightRemaining / filament.weightTotal) * 100));
    const locName = locations.find(l => l.id === filament.locationId)?.name;
    const supName = suppliers.find(s => s.id === filament.supplierId)?.name;
    const isSelected = selectedIds.has(filament.id);
    let progressColor = percentage <= threshold ? 'bg-red-500' : percentage <= 35 ? 'bg-orange-500' : 'bg-green-500';

    return (
      <div key={filament.id} onClick={() => isSelectionMode && toggleSelection(filament.id)} className={`bg-white dark:bg-slate-800 rounded-xl border p-5 shadow-sm transition-all relative overflow-hidden ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'}`} style={{ borderTop: `6px solid ${filament.colorHex}` }}>
        <div className="flex items-center gap-3 mb-4">
           <div className="w-10 h-10 rounded-full border bg-slate-50 dark:bg-slate-700 flex items-center justify-center relative">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: filament.colorHex }} />
           </div>
           <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 dark:text-white truncate">{filament.brand} {tColor(filament.colorName)}</h3>
              <div className="flex gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter"><span>{filament.material}</span>{filament.shortId && <span>#{filament.shortId}</span>}</div>
           </div>
           {!isSelectionMode && <button onClick={(e) => { e.stopPropagation(); onShowLabel(filament.id); }} className="text-slate-300 hover:text-blue-500"><QrCode size={18}/></button>}
        </div>
        <div className="flex justify-between items-center text-xs mb-1"><span>{filament.weightRemaining}g</span><span>{percentage.toFixed(0)}%</span></div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-4"><div className={`h-full ${progressColor}`} style={{ width: `${percentage}%` }} /></div>
        <div className="space-y-1 text-[10px] text-slate-500">
           {locName && <div className="flex items-center gap-1"><MapPin size={10}/> {locName}</div>}
           {supName && <div className="flex items-center gap-1"><Truck size={10}/> {supName}</div>}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
           <button onClick={(e) => { e.stopPropagation(); onEdit(filament, 'filament'); }} className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-[10px] font-bold uppercase">{t('edit')}</button>
           <button onClick={(e) => { e.stopPropagation(); onDelete(filament.id, 'filament'); }} className="px-2 py-1.5 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14}/></button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
         <button onClick={() => setActiveTab('filament')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${activeTab === 'filament' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>{t('filaments')}</button>
         <button onClick={() => setActiveTab('material')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${activeTab === 'material' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>{t('materials')} {!isAdmin && <Lock size={12} className="inline ml-1 text-amber-500"/>}</button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
         <div className="relative flex-1 flex gap-2">
            <div className="relative flex-1">
               <input type="text" placeholder={t('searchPlaceholder')} value={filter} onChange={e => { setFilter(e.target.value); onSetActiveGroupKey(null); }} className="w-full bg-white dark:bg-slate-800 border rounded-xl p-4 pl-5 pr-12 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
               <button onClick={handleQuickScan} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-500">{isScanning ? <Loader2 size={20} className="animate-spin"/> : <ScanLine size={20}/>}</button>
            </div>
            <button onClick={() => onAddClick(activeTab)} className="p-4 bg-blue-600 text-white rounded-xl shadow-lg"><Plus size={24}/></button>
         </div>
      </div>

      {activeTab === 'filament' && (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Added explicit type mapping for items to fix length/map errors */}
            {Object.entries(groupedFilaments).map(([key, items]: [string, Filament[]]) => {
               if (items.length > 1 && !isSelectionMode && !activeGroupKey) return (
                 <div key={key} onClick={() => onSetActiveGroupKey(key)} className="bg-white dark:bg-slate-800 p-5 rounded-xl border-t-8 shadow-sm cursor-pointer hover:shadow-md transition-all flex items-center justify-between" style={{ borderTopColor: items[0].colorHex }}>
                    <div><h3 className="font-bold dark:text-white">{items[0].brand}</h3><p className="text-xs text-slate-500">{tColor(items[0].colorName)} ({items.length}x)</p></div>
                    <ChevronRight size={20} className="text-slate-300"/>
                 </div>
               );
               if (activeGroupKey && key !== activeGroupKey) return null;
               return items.map(f => renderFilamentCard(f));
            })}
         </div>
      )}

      {showWebCamera && (
         <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fade-in">
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center"><div className="w-72 h-72 border-2 border-white/30 rounded-[40px] relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500/50 shadow-[0_0_15px_blue] animate-scanner-scan"/></div></div>
            <button onClick={stopWebCamera} className="absolute top-8 right-8 text-white p-3"><X size={28}/></button>
            <div className="absolute bottom-16 left-0 right-0 flex justify-center"><button onClick={captureWebImage} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"><div className="w-16 h-16 bg-white rounded-full"/></button></div>
            <canvas ref={canvasRef} className="hidden" />
         </div>
      )}

      {zoomedImage && createPortal(
         <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in" onClick={() => setZoomedImage(null)}>
            <img src={zoomedImage} className="max-w-full max-h-full rounded-xl shadow-2xl" alt="Zoomed" />
         </div>, document.body
      )}
    </div>
  );
};
