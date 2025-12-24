
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Filament, Location, Supplier, OtherMaterial } from '../types';
import { Edit2, Trash2, Weight, MapPin, Truck, ShoppingCart, Euro, Layers, QrCode, ArrowLeft, Package, Search, ArrowUpDown, CheckSquare, Square, X, Filter, Globe, Wrench, Box, Plus, Lock, Crown, ArrowRight, Maximize2, ZoomIn, ScanLine, Loader2, Camera, Sparkles, Construction, ChevronRight, LayoutList, LayoutGrid, AlertTriangle } from 'lucide-react';
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
type ViewMode = 'list' | 'grid' | 'grouped';

const normalizeForGrouping = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
};

const getBaseMaterial = (str: string) => {
  if (!str) return '';
  const s = str.toLowerCase();
  if (s.includes('pla')) return 'PLA';
  if (s.includes('petg')) return 'PETG';
  if (s.includes('abs')) return 'ABS';
  if (s.includes('asa')) return 'ASA';
  if (s.includes('tpu')) return 'TPU';
  return str.toUpperCase();
};

export const Inventory: React.FC<InventoryProps> = ({ 
  filaments, materials, locations, suppliers, onEdit, onQuickAdjust, onMaterialAdjust, onDelete, onBatchDelete,
  onNavigate, onShowLabel, threshold, activeGroupKey, onSetActiveGroupKey, isAdmin, onAddClick, onUnlockPro
}) => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('filament');
  // Changed default view mode to 'grouped' as requested
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [filter, setFilter] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date-new');
  const { t, tColor } = useLanguage();

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const [showWebCamera, setShowWebCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const filteredFilaments = filaments.filter(f => {
    const lowerFilter = filter.toLowerCase().trim();
    const matchesSearch = f.brand.toLowerCase().includes(lowerFilter) || 
                         f.colorName.toLowerCase().includes(lowerFilter) || 
                         f.material.toLowerCase().includes(lowerFilter) || 
                         (f.shortId && f.shortId.toLowerCase().includes(lowerFilter));
    const matchesMaterial = selectedMaterial ? f.material === selectedMaterial : true;
    return matchesSearch && matchesMaterial;
  });

  const sortedFilaments = useMemo(() => {
    return [...filteredFilaments].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.brand.localeCompare(b.brand) || a.colorName.localeCompare(b.colorName);
        case 'name-desc': return b.brand.localeCompare(a.brand) || b.colorName.localeCompare(a.colorName);
        case 'weight-asc': return a.weightRemaining - b.weightRemaining;
        case 'weight-desc': return b.weightRemaining - a.weightRemaining;
        case 'date-new': return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        case 'date-old': return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        default: return 0;
      }
    });
  }, [filteredFilaments, sortBy]);

  const groupedFilaments = useMemo(() => {
    const groups: Record<string, Filament[]> = {};
    sortedFilaments.forEach(f => {
      const b = normalizeForGrouping(f.brand);
      const m = getBaseMaterial(f.material); 
      const c = normalizeForGrouping(f.colorName);
      const key = `${b}-${m}-${c}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    return groups;
  }, [sortedFilaments]);

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

  const renderFilamentCard = (filament: Filament) => {
    const percentage = Math.max(0, Math.min(100, (filament.weightRemaining / filament.weightTotal) * 100));
    const locName = locations.find(l => l.id === filament.locationId)?.name;
    let progressColor = percentage <= threshold ? 'bg-red-500' : percentage <= 35 ? 'bg-orange-500' : 'bg-green-500';

    return (
      <div key={filament.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm transition-all relative overflow-hidden" style={{ borderTop: `6px solid ${filament.colorHex}` }}>
        <div className="flex items-center gap-3 mb-4">
           <div className="w-10 h-10 rounded-full border bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: filament.colorHex }} />
           </div>
           <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 dark:text-white truncate">{filament.brand} {tColor(filament.colorName)}</h3>
              <div className="flex gap-2 text-[10px] font-bold text-slate-500 uppercase"><span>{filament.material}</span>{filament.shortId && <span>#{filament.shortId}</span>}</div>
           </div>
           <button onClick={() => onShowLabel(filament.id)} className="text-slate-300 hover:text-blue-500 transition-colors"><QrCode size={18}/></button>
        </div>
        <div className="flex justify-between items-center text-xs mb-1 font-bold text-slate-600 dark:text-slate-400"><span>{filament.weightRemaining}g / {filament.weightTotal}g</span><span>{percentage.toFixed(0)}%</span></div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-4 shadow-inner"><div className={`h-full ${progressColor} transition-all duration-500`} style={{ width: `${percentage}%` }} /></div>
        <div className="space-y-1 text-[10px] text-slate-500 font-medium">
           {locName && <div className="flex items-center gap-1"><MapPin size={10}/> {locName}</div>}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
           <button onClick={() => onEdit(filament, 'filament')} className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 transition-colors">{t('edit')}</button>
           <button onClick={() => onDelete(filament.id, 'filament')} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={14}/></button>
        </div>
      </div>
    );
  };

  const renderMaterialCard = (mat: OtherMaterial) => {
     const isLow = mat.minStock !== undefined && mat.minStock > 0 && mat.quantity <= mat.minStock;
     const materialImageUrl = mat.image ? (mat.image.startsWith('data:') ? mat.image : `data:image/jpeg;base64,${mat.image}`) : null;
     
     return (
        <div key={mat.id} className={`bg-white dark:bg-slate-800 rounded-xl border p-5 shadow-sm transition-all ${isLow ? 'border-red-300 dark:border-red-900/50 bg-red-50/10' : 'border-slate-200 dark:border-slate-700'}`}>
           <div className="flex items-center gap-3 mb-4">
              <div 
                className={`w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 overflow-hidden ${materialImageUrl ? 'cursor-zoom-in' : ''}`}
                onClick={() => materialImageUrl && setZoomedImage(materialImageUrl)}
              >
                 {materialImageUrl ? <img src={materialImageUrl} className="w-full h-full object-cover" /> : <Box size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                 <h3 className="font-bold text-slate-800 dark:text-white truncate">{mat.name}</h3>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{mat.category}</span>
              </div>
              {isLow && <AlertTriangle size={18} className="text-red-500 animate-pulse" />}
           </div>
           <div className="flex justify-between items-end">
              <div>
                 <span className={`text-2xl font-black ${isLow ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{mat.quantity}</span>
                 <span className="text-xs text-slate-500 ml-1 font-bold">{mat.unit}</span>
              </div>
              <div className="flex gap-1">
                 <button onClick={() => onMaterialAdjust(mat.id, -1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg font-bold dark:text-white">-</button>
                 <button onClick={() => onMaterialAdjust(mat.id, 1)} className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg font-bold">+</button>
              </div>
           </div>
           <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
              <button onClick={() => onEdit(mat, 'material')} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-[10px] font-black uppercase">{t('edit')}</button>
              <button onClick={() => onDelete(mat.id, 'material')} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14}/></button>
           </div>
        </div>
     );
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      {/* Tab Switcher */}
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl shadow-inner">
         <button onClick={() => setActiveTab('filament')} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'filament' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>{t('filaments')}</button>
         <button onClick={() => setActiveTab('material')} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'material' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>{t('materials')}</button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3">
         <div className="relative flex-1 flex gap-2">
            <div className="relative flex-1">
               <input type="text" placeholder={t('searchPlaceholder')} value={filter} onChange={e => { setFilter(e.target.value); onSetActiveGroupKey(null); }} className="w-full bg-white dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 pl-5 pr-12 outline-none shadow-sm dark:text-white transition-all" />
               <button onClick={handleQuickScan} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-500 transition-colors">{isScanning ? <Loader2 size={20} className="animate-spin"/> : <ScanLine size={20}/>}</button>
            </div>
            <button onClick={() => onAddClick(activeTab)} className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg transition-all active:scale-95"><Plus size={24}/></button>
         </div>
         
         <div className="flex gap-2">
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-white dark:bg-slate-800 border rounded-xl px-4 py-2 text-sm font-bold dark:text-white outline-none shadow-sm">
               <option value="date-new">Nieuwste eerst</option>
               <option value="date-old">Oudste eerst</option>
               <option value="name-asc">Naam (A-Z)</option>
               <option value="name-desc">Naam (Z-A)</option>
               <option value="weight-desc">Meeste gewicht</option>
               <option value="weight-asc">Minste gewicht</option>
            </select>
            {activeTab === 'filament' && (
               <div className="flex bg-white dark:bg-slate-800 rounded-xl border p-1 shadow-sm">
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-400'}`}><LayoutGrid size={20}/></button>
                  <button onClick={() => setViewMode('grouped')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grouped' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-400'}`}><Layers size={20}/></button>
               </div>
            )}
         </div>
      </div>

      {/* Filament Display */}
      {activeTab === 'filament' && (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {viewMode === 'grouped' && !activeGroupKey ? (
               Object.entries(groupedFilaments).map(([key, items]: [string, Filament[]]) => {
                  const totalGroupWeight = items.reduce((acc, curr) => acc + curr.weightRemaining, 0);
                  const first = items[0];
                  
                  return (
                    <div key={key} onClick={() => onSetActiveGroupKey(key)} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-t-8 shadow-sm cursor-pointer hover:shadow-md transition-all flex items-center justify-between group" style={{ borderTopColor: first.colorHex }}>
                      <div className="flex-1 min-w-0 pr-4">
                         <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-black dark:text-white group-hover:text-blue-500 transition-colors truncate">{first.brand}</h3>
                         </div>
                         <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded uppercase">{first.material}</span>
                            <p className="text-xs text-slate-500 font-bold uppercase">{tColor(first.colorName)}</p>
                         </div>
                         <div className="mt-2 flex items-center gap-2">
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                               {items.length}x <span className="mx-1 opacity-30">•</span> Totaal: {Math.round(totalGroupWeight)}g
                            </span>
                         </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform shrink-0"/>
                    </div>
                  );
               })
            ) : (
               <>
                  {activeGroupKey && (
                     <div className="col-span-full flex items-center gap-2 mb-2 animate-fade-in">
                        <button onClick={() => onSetActiveGroupKey(null)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 hover:text-blue-500 transition-colors"><ArrowLeft size={18}/></button>
                        <span className="font-black dark:text-white uppercase tracking-widest text-xs">Groep overzicht</span>
                     </div>
                  )}
                  {(activeGroupKey ? groupedFilaments[activeGroupKey] : sortedFilaments).map(f => renderFilamentCard(f))}
               </>
            )}
         </div>
      )}

      {/* Material Display */}
      {activeTab === 'material' && (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {materials.map(mat => renderMaterialCard(mat))}
            {materials.length === 0 && (
               <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 animate-fade-in">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300"><Box size={40}/></div>
                  <div className="space-y-1">
                     <h3 className="font-bold dark:text-white">Geen materialen gevonden</h3>
                     <p className="text-sm text-slate-500">Voeg boutjes, moeren of onderdelen toe om ze hier te beheren.</p>
                  </div>
               </div>
            )}
         </div>
      )}

      {/* Camera UI */}
      {showWebCamera && (
         <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fade-in">
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center"><div className="w-72 h-72 border-2 border-white/30 rounded-[40px] relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500/50 shadow-[0_0_15px_blue] animate-scanner-scan"/></div></div>
            <button onClick={stopWebCamera} className="absolute top-8 right-8 text-white p-3 bg-white/10 backdrop-blur-md rounded-full"><X size={28}/></button>
            <div className="absolute bottom-16 left-0 right-0 flex justify-center"><button onClick={captureWebImage} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center shadow-2xl transition-transform active:scale-90"><div className="w-16 h-16 bg-white rounded-full"/></button></div>
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
