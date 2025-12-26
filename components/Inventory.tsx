import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Filament, Location, Supplier, OtherMaterial, AiSuggestion } from '../types';
import { Edit2, Trash2, Weight, MapPin, Truck, ShoppingCart, Euro, Layers, QrCode, ArrowLeft, Package, Search, ArrowUpDown, CheckSquare, Square, X, Filter, Globe, Wrench, Box, Plus, Lock, Crown, ArrowRight, Maximize2, ZoomIn, ScanLine, Loader2, Camera, Sparkles, Construction, PackageCheck, Clock } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '../contexts/LanguageContext';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { lookupSpoolFromImage, analyzeSpoolImage } from '../services/geminiService';

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
  onAddClick: (type: 'filament' | 'material', preFill?: Partial<Filament>) => void;
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
  const [isAiAdding, setIsAiAdding] = useState(false);
  
  // Camera Refs
  const hiddenAiInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showWebCamera, setShowWebCamera] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomedImage(null);
    };

    if (zoomedImage) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    } else {
      document.body.style.overflow = '';
      // Fixed: Property 'removeOverride' does not exist on type 'Window', changed to removeEventListener
      window.removeEventListener('keydown', handleEsc);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [zoomedImage]);

  const availableFilamentMaterials = useMemo(() => {
    const mats = new Set(filaments.map(f => f.material).filter(Boolean));
    return Array.from(mats).sort();
  }, [filaments]);

  const filteredFilaments = filaments.filter(f => {
    const lowerFilter = filter.toLowerCase().trim();
    if (lowerFilter.startsWith('#')) {
       const id = lowerFilter.substring(1);
       return f.shortId?.toLowerCase() === id;
    }
    if (lowerFilter.length === 4 && f.shortId?.toLowerCase() === lowerFilter) {
       return true;
    }

    const matchesSearch = 
      f.brand.toLowerCase().includes(lowerFilter) || 
      f.colorName.toLowerCase().includes(lowerFilter) ||
      f.material.toLowerCase().includes(lowerFilter) ||
      (f.shortId && f.shortId.toLowerCase().includes(lowerFilter));
    
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
      const listA = itemsA as Filament[];
      const listB = itemsB as Filament[];
      const firstA = listA[0];
      const firstB = listB[0];
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

  const sortItems = (items: Filament[]) => {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.shortId?.localeCompare(b.shortId || '') || 0; 
        case 'name-desc': return b.shortId?.localeCompare(a.shortId || '') || 0;
        case 'weight-asc': return a.weightRemaining - b.weightRemaining;
        case 'weight-desc': return b.weightRemaining - a.weightRemaining;
        case 'date-new': return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        case 'date-old': return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        default: return 0;
      }
    });
  };

  const filteredMaterials = materials.filter(m => {
     const matchesSearch = 
        m.name.toLowerCase().includes(filter.toLowerCase()) || 
        m.category.toLowerCase().includes(filter.toLowerCase());
     return matchesSearch;
  });

  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'weight-asc': return a.quantity - b.quantity;
        case 'weight-desc': return b.quantity - a.quantity;
        case 'date-new': return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        case 'date-old': return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        default: return 0;
      }
  });

  const handleOpenUrl = (url: string) => {
    if (!url) return;
    if (Capacitor.isNativePlatform()) {
      window.open(url, '_system');
    } else {
      window.open(url, '_blank');
    }
  };

  const processScanResult = async (base64String: string) => {
    setIsScanning(true);
    try {
       const foundId = await lookupSpoolFromImage(base64String);
       if (foundId) {
          const cleanId = foundId.replace('#', '').trim();
          setFilter(cleanId);
          onSetActiveGroupKey(null);
          const match = filaments.find(f => f.shortId?.toLowerCase() === cleanId.toLowerCase());
          if (match) {
             onShowLabel(match.id);
          }
       } else {
          alert(t('lookupNotFound'));
       }
    } catch (e: any) {
       alert(t('failed'));
    } finally {
       setIsScanning(false);
    }
  };

  const handleQuickScan = async () => {
     if (isScanning) return;
     
     if (Capacitor.isNativePlatform()) {
        try {
           const image = await CapacitorCamera.getPhoto({
              quality: 85,
              allowEditing: false,
              resultType: CameraResultType.Base64,
              source: CameraSource.Camera,
              width: 1200,
              correctOrientation: true
           });

           if (image.base64String) {
              await processScanResult(image.base64String);
           }
           return;
        } catch (e: any) {
           if (e.message?.includes('User cancelled')) return;
           console.warn("Native camera failed, falling back to web camera.", e);
        }
     }

     setShowWebCamera(true);
     try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
           video: { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
           } 
        });
        if (videoRef.current) {
           videoRef.current.srcObject = stream;
        }
     } catch (err: any) {
        console.error("Web camera error:", err);
        alert(t('failed') + ": Camera not accessible.");
        setShowWebCamera(false);
     }
  };

  const processAiImage = async (base64Data: string) => {
    setIsAiAdding(true);
    try {
      const suggestion = await analyzeSpoolImage(base64Data);
      onAddClick('filament', suggestion);
    } catch (e: any) {
      alert(t('aiError') + "\n\n" + e.message);
    } finally {
      setIsAiAdding(false);
    }
  };

  const handleAiAddScan = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Prompt,
          width: 1200,
          correctOrientation: true
        });

        if (image.base64String) {
          processAiImage(image.base64String);
        }
        return;
      } catch (error: any) {
        if (error.message?.includes('User cancelled')) return;
      }
    }

    hiddenAiInputRef.current?.click();
  };

  const handleAiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        processAiImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const stopWebCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
       const stream = videoRef.current.srcObject as MediaStream;
       stream.getTracks().forEach(track => track.stop());
    }
    setShowWebCamera(false);
  };

  const captureWebImage = () => {
     if (!videoRef.current || !canvasRef.current) return;
     const context = canvasRef.current.getContext('2d');
     if (!context) return;
     const videoWidth = videoRef.current.videoWidth;
     const videoHeight = videoRef.current.videoHeight;
     canvasRef.current.width = videoWidth;
     canvasRef.current.height = videoHeight;
     context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
     const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.85).split(',')[1];
     stopWebCamera();
     processScanResult(base64Image);
  };

  const toggleSelection = (id: string) => {
     const newSet = new Set(selectedIds);
     if (newSet.has(id)) newSet.delete(id);
     else newSet.add(id);
     setSelectedIds(newSet);
  };

  const handleBatchDelete = () => {
     if (onBatchDelete) {
        onBatchDelete(Array.from(selectedIds), activeTab);
        setIsSelectionMode(false);
        setSelectedIds(new Set());
     }
  };

  const getLocationName = (id?: string) => locations.find(l => l.id === id)?.name || null;
  const getSupplierName = (id?: string) => suppliers.find(s => s.id === id)?.name || null;

  const renderFilamentCard = (filament: Filament) => {
    const percentage = Math.max(0, Math.min(100, (filament.weightRemaining / filament.weightTotal) * 100));
    const locName = getLocationName(filament.locationId);
    const supName = getSupplierName(filament.supplierId);
    const safeColor = filament.colorHex || '#000000';
    const isSelected = selectedIds.has(filament.id);
    const shopDomain = getDomain(filament.shopUrl);

    let progressColor = 'bg-green-500';
    if (percentage <= threshold) progressColor = 'bg-red-500';
    else if (percentage <= 35) progressColor = 'bg-orange-500';
    else if (percentage <= 60) progressColor = 'bg-yellow-400';

    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`buy ${filament.brand} ${filament.material} ${filament.colorName} filament`)}`;
    const actionUrl = filament.shopUrl || googleSearchUrl;
    const hasShopUrl = !!filament.shopUrl;

    return (
      <div 
        key={filament.id} 
        onClick={() => { if (isSelectionMode) toggleSelection(filament.id); }}
        className={`bg-white dark:bg-slate-800 rounded-xl border p-5 pt-3 shadow-sm hover:shadow-md transition-shadow flex flex-col relative group overflow-hidden ${isSelectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'}`}
        style={{ borderTopWidth: '6px', borderTopColor: safeColor }}
      >
        {isSelectionMode && (
           <div className="absolute top-3 right-3 z-10 text-blue-500">
              {isSelected ? <CheckSquare size={24} fill="currentColor" className="text-white" /> : <Square size={24} className="text-slate-300" />}
           </div>
        )}

        {filament.is_ordered && !isSelectionMode && (
           <div className="absolute top-3 right-12 z-10 bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
              <Truck size={10} /> ORDERED
           </div>
        )}

        <button onClick={(e) => { e.stopPropagation(); onShowLabel(filament.id); }} className={`absolute top-4 right-4 text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400 transition-colors p-1 ${isSelectionMode ? 'hidden' : ''}`} title={t('printLabel')}>
          <QrCode size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4 mt-2">
           <div className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 shadow-sm flex-shrink-0 relative flex items-center justify-center overflow-hidden">
              <div className="rounded-full flex items-center justify-center" style={{ backgroundColor: safeColor, width: `${Math.max(25, percentage)}%`, height: `${Math.max(25, percentage)}%`, boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)' }}>
                <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
              </div>
           </div>
            <div className="flex-1 min-w-0 pr-8">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight truncate">{filament.brand} {tColor(filament.colorName)}</h3>
              <div className="mt-1 flex gap-1">
                <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{filament.material}</span>
                {filament.shortId && <span className="inline-block text-[11px] font-mono px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400">#{filament.shortId}</span>}
              </div>
            </div>
        </div>

        <div className="flex justify-between items-center mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1"><Weight size={12} /><span>{filament.weightRemaining}g</span></div>
          <span>{percentage.toFixed(0)}%</span>
        </div>

        <div className={`flex gap-1 mb-2 ${isSelectionMode ? 'opacity-50 pointer-events-none' : ''}`}>
          {[-10, -50, -100].map(amount => (
             <button key={amount} onClick={(e) => { e.stopPropagation(); onQuickAdjust(filament.id, Math.abs(amount)); }} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 text-[10px] rounded transition-colors">
                {amount}g
              </button>
          ))}
        </div>

        <div className="mb-4">
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${percentage}%` }} />
          </div>
        </div>

        <div className="space-y-1.5 mb-4 text-xs text-slate-500 dark:text-slate-400 flex-1">
          {locName && <div className="flex items-center gap-2"><MapPin size={12} className="text-blue-500 shrink-0" /><span className="truncate">{locName}</span></div>}
          {supName && <div className="flex items-center gap-2"><Truck size={12} className="text-emerald-500 shrink-0" /><span className="truncate">{supName}</span></div>}
          {shopDomain && (
             <div className="flex items-center gap-2">
                <Globe size={12} className="text-purple-500 shrink-0" />
                <a href={filament.shopUrl} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenUrl(filament.shopUrl!); }} className="truncate hover:text-blue-500 hover:underline cursor-pointer">{shopDomain}</a>
             </div>
          )}
           {filament.price && <div className="flex items-center gap-2"><Euro size={12} className="text-slate-400 shrink-0" /><span>{filament.price.toFixed(2)}</span></div>}
        </div>

        <div className={`flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700 mt-auto ${isSelectionMode ? 'opacity-50 pointer-events-none' : ''}`}>
          <button onClick={(e) => { e.stopPropagation(); handleOpenUrl(actionUrl); }} className={`p-2 rounded-lg transition-colors flex items-center justify-center ${hasShopUrl ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`} title={hasShopUrl ? t('order') : t('searchGoogle')}>
            {hasShopUrl ? <ShoppingCart size={16} /> : <Search size={16} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(filament, 'filament'); }} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-1">
            <Edit2 size={14} /> {t('edit')}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(filament.id, 'filament'); }} className="px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderMaterialCard = (material: OtherMaterial) => {
    const locName = getLocationName(material.locationId);
    const supName = getSupplierName(material.supplierId);
    const isSelected = selectedIds.has(material.id);
    const shopDomain = getDomain(material.shopUrl);
    const isLow = material.minStock !== undefined && material.quantity <= material.minStock;
    const imageUrl = material.image ? (material.image.startsWith('data:') ? material.image : `data:image/jpeg;base64,${material.image}`) : null;

    return (
      <div 
        key={material.id} 
        onClick={() => { if (isSelectionMode) toggleSelection(material.id); }}
        className={`bg-white dark:bg-slate-800 rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col relative group ${isSelectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'}`}
      >
        {isSelectionMode && (
           <div className="absolute top-3 right-3 z-10 text-blue-500">
              {isSelected ? <CheckSquare size={24} fill="currentColor" className="text-white" /> : <Square size={24} className="text-slate-300" />}
           </div>
        )}

        {material.is_ordered && !isSelectionMode && (
           <div className="absolute top-3 right-3 z-10 bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
              <Truck size={10} /> ORDERED
           </div>
        )}

        <div className="flex items-start gap-4 mb-4">
           <div 
              onClick={(e) => { if (imageUrl) { e.stopPropagation(); setZoomedImage(imageUrl); } }}
              className={`w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0 text-indigo-500 overflow-hidden relative border border-slate-100 dark:border-slate-700 ${imageUrl ? 'cursor-zoom-in ring-offset-2 hover:ring-2 ring-blue-500 transition-all' : ''}`}
           >
              {imageUrl ? (
                 <>
                    <img src={imageUrl} alt={material.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                       <ZoomIn size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                 </>
              ) : (
                 <Box size={24} />
              )}
           </div>
           
           <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight truncate">{material.name}</h3>
              <div className="mt-1 flex gap-2 items-center">
                 <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{material.category}</span>
                 {isLow && <span className="text-[10px] font-bold text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-800">{t('lowStock')}</span>}
              </div>
           </div>
        </div>

        <div className="flex items-center justify-between mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
           <div className="text-center">
              <span className="block text-2xl font-bold text-slate-800 dark:text-white">{material.quantity}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">{material.unit}</span>
           </div>
           <div className={`flex gap-1 ${isSelectionMode ? 'opacity-50 pointer-events-none' : ''}`}>
              <button onClick={(e) => { e.stopPropagation(); onMaterialAdjust(material.id, -1); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-slate-600 dark:text-slate-300">-</button>
              <button onClick={(e) => { e.stopPropagation(); onMaterialAdjust(material.id, 1); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors font-bold">+</button>
           </div>
        </div>

        <div className="space-y-1.5 mb-4 text-xs text-slate-500 dark:text-slate-400 flex-1">
          {locName && <div className="flex items-center gap-2"><MapPin size={12} className="text-blue-500 shrink-0" /><span className="truncate">{locName}</span></div>}
          {supName && <div className="flex items-center gap-2"><Truck size={12} className="text-emerald-500 shrink-0" /><span className="truncate">{supName}</span></div>}
          {shopDomain && (
             <div className="flex items-center gap-2">
                <Globe size={12} className="text-purple-500 shrink-0" />
                <a href={material.shopUrl} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenUrl(material.shopUrl!); }} className="truncate hover:text-blue-500 hover:underline cursor-pointer">{shopDomain}</a>
             </div>
          )}
        </div>

        <div className={`flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700 mt-auto ${isSelectionMode ? 'opacity-50 pointer-events-none' : ''}`}>
          {material.shopUrl && (
             <button onClick={(e) => { e.stopPropagation(); handleOpenUrl(material.shopUrl!); }} className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                <ShoppingCart size={16} />
             </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onEdit(material, 'material'); }} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-1">
            <Edit2 size={14} /> {t('edit')}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(material.id, 'material'); }} className="px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderGroupCard = (groupKey: string, items: Filament[]) => {
    const firstItem = items[0];
    const totalWeight = items.reduce((acc, curr) => acc + curr.weightRemaining, 0);
    const count = items.length;
    const safeColor = firstItem.colorHex || '#000000';
    const baseMaterial = getBaseMaterial(firstItem.material).toUpperCase();

    return (
      <div 
        key={groupKey}
        onClick={() => onSetActiveGroupKey(groupKey)}
        className="cursor-pointer bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 pt-3 shadow-sm hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col relative group overflow-hidden"
        style={{ borderTopWidth: '6px', borderTopColor: safeColor }}
      >
        <div className="absolute top-0 right-0 p-2 bg-slate-100 dark:bg-slate-700 rounded-bl-xl border-l border-b border-slate-200 dark:border-slate-600">
           <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold text-xs">
              <Layers size={14} />
              <span>{count}x</span>
           </div>
        </div>

        <div className="flex items-center gap-3 mb-4 mt-2">
            <div className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 flex items-center justify-center relative">
                 <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: safeColor }} />
                  <div className="absolute -bottom-1 -right-1 bg-slate-800 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800">
                    {count}
                  </div>
            </div>
            <div className="flex-1 min-w-0 pr-8">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight truncate">{firstItem.brand} {tColor(firstItem.colorName)}</h3>
              <div className="mt-1"><span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{baseMaterial}</span></div>
            </div>
        </div>

        <div className="mt-auto">
           <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <span className="flex items-center gap-2"><Weight size={14}/> {t('totalWeight')}</span>
              <span className="font-bold text-slate-800 dark:text-white">{(totalWeight / 1000).toFixed(2)} kg</span>
           </div>
           <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-center">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center justify-center gap-1 group-hover:underline">{t('viewSpools')} ({count}) <Package size={12} /></span>
           </div>
        </div>
      </div>
    );
  };

  const FabButton = () => {
     if (!isAdmin && activeTab === 'material') return null;
     return createPortal(
        <button
           onClick={() => onAddClick(activeTab)}
           className="fixed bottom-24 right-6 bg-blue-600 hover:bg-blue-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-[60]"
           title="New Item"
        >
           <Plus size={28} />
        </button>,
        document.body
     );
  };

  const ImageZoomOverlay = () => {
    if (!zoomedImage) return null;
    return createPortal(
      <div 
         className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
         onClick={() => setZoomedImage(null)}
         style={{ height: '100dvh' }}
      >
         <button 
            className="absolute top-8 right-8 text-white hover:text-slate-300 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90 z-[10000]"
            onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
            aria-label="Close"
         >
            <X size={32} />
         </button>
         <div 
           className="relative w-full h-full flex items-center justify-center"
           onClick={(e) => e.stopPropagation()}
         >
            <img 
               src={zoomedImage} 
               className="max-w-full max-h-[85dvh] rounded-2xl shadow-2xl border-2 border-white/5 object-contain animate-fade-in select-none" 
               alt="Zoomed" 
               draggable={false}
            />
            <div 
               className="absolute inset-0 -z-10 w-full h-full" 
               onClick={() => setZoomedImage(null)}
            />
         </div>
      </div>,
      document.body
    );
  };

  if (activeTab === 'filament' && activeGroupKey && groupedFilaments[activeGroupKey]) {
    const groupItems = groupedFilaments[activeGroupKey];
    const sortedGroupItems = sortItems(groupItems);
    const firstItem = groupItems[0];
    const safeColor = firstItem.colorHex || '#000000';
    const baseMaterial = getBaseMaterial(firstItem.material).toUpperCase();

    return (
      <div className="space-y-6 animate-fade-in relative pb-16">
        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-20">
           <button onClick={() => { onSetActiveGroupKey(null); setIsSelectionMode(false); setSelectedIds(new Set()); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-300"><ArrowLeft size={24} /></button>
           <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-4 flex-1">
               <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm" style={{ backgroundColor: safeColor }} />
               <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">{firstItem.brand} {tColor(firstItem.colorName)}</h2>
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                     <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-bold">{baseMaterial}</span>
                     <span>•</span>
                     <span>{groupItems.length} {t('items')}</span>
                  </div>
               </div>
           </div>
           <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }} className={`p-2 rounded-lg transition-colors ${isSelectionMode ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800'}`} title="Selection Mode">
              <CheckSquare size={20} />
           </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           {sortedGroupItems.map(f => renderFilamentCard(f))}
        </div>
        {isSelectionMode && selectedIds.size > 0 && (
           <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-96 bg-slate-900 text-white p-3 rounded-xl shadow-2xl flex items-center justify-between z-30 animate-fade-in">
              <span className="font-bold text-sm ml-2">{selectedIds.size} {t('selected')}</span>
              <button onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><Trash2 size={16} /> {t('delete')}</button>
           </div>
        )}
        <FabButton />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
         <button 
            onClick={() => { setActiveTab('filament'); setIsSelectionMode(false); setSelectedIds(new Set()); }} 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'filament' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
         >
            <Layers size={16} /> {t('filaments')}
         </button>
         <button 
            onClick={() => { setActiveTab('material'); setIsSelectionMode(false); setSelectedIds(new Set()); }} 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'material' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
         >
            <Box size={16} /> {t('materials')} {!isAdmin && <Lock size={12} className="text-amber-500 ml-1" />}
         </button>
      </div>

      {activeTab === 'filament' && (
         <>
            {availableFilamentMaterials.length > 0 && (
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button onClick={() => setSelectedMaterial(null)} className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors border ${!selectedMaterial ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                     {t('all')}
                  </button>
                  {availableFilamentMaterials.map(mat => (
                     <button key={mat} onClick={() => setSelectedMaterial(mat)} className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors border ${selectedMaterial === mat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                        {mat}
                     </button>
                  ))}
               </div>
            )}

            <div className="flex flex-col md:flex-row gap-3">
               <div className="relative flex-1 flex gap-2">
                  <div className="relative flex-1">
                     <input 
                        type="text" 
                        placeholder={t('searchPlaceholder')}
                        value={filter}
                        onChange={e => { setFilter(e.target.value); onSetActiveGroupKey(null); }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-4 pl-5 pr-12 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                     />
                     <button 
                        onClick={handleQuickScan}
                        disabled={isScanning}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-500 transition-colors"
                        title={t('scanLabel')}
                     >
                        {isScanning ? <Loader2 size={20} className="animate-spin" /> : <ScanLine size={20} />}
                     </button>
                  </div>
                  
                  <button 
                    onClick={handleAiAddScan}
                    disabled={isAiAdding}
                    className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50"
                    title="AI Scan & Add"
                  >
                    {isAiAdding ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />}
                    <span className="hidden md:inline font-bold">{t('aiAdd')}</span>
                  </button>

                  <button 
                     onClick={() => onAddClick('filament')}
                     className="p-4 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-500 transition-colors flex items-center justify-center"
                     title={t('newFilament')}
                  >
                     <Plus size={24} />
                  </button>
                  
                  <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }} className={`p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors ${isSelectionMode ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:white'}`} title="Batch selection">
                     <CheckSquare size={24} />
                  </button>
               </div>
               <div className="relative min-w-[180px]">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="w-full h-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-4 pl-10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none cursor-pointer text-sm">
                     <option value="name-asc">{t('sortNameAsc')}</option>
                     <option value="name-desc">{t('sortNameDesc')}</option>
                     <option value="weight-asc">{t('sortWeightAsc')}</option>
                     <option value="weight-desc">{t('sortWeightDesc')}</option>
                     <option value="date-new">{t('sortDateNew')}</option>
                     <option value="date-old">{t('sortDateOld')}</option>
                  </select>
                  <ArrowUpDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               {sortedGroups.map(([key, items]) => {
                  if (isSelectionMode) return items.map(item => renderFilamentCard(item));
                  if (items.length > 1) return renderGroupCard(key, items);
                  else return renderFilamentCard(items[0]);
               })}
            </div>
            
            {filteredFilaments.length === 0 && (
               <div className="text-center py-20 text-slate-500"><p>{t('noFilaments')}</p></div>
            )}
         </>
      )}

      {activeTab === 'material' && (
         <>
            {!isAdmin ? (
               <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in space-y-6">
                  <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center relative">
                     <Box size={40} className="text-amber-600 dark:text-amber-400 opacity-50" />
                     <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-amber-200 dark:border-amber-800">
                        <Lock size={20} className="text-amber-500" />
                     </div>
                  </div>
                  <div className="max-w-xs">
                     <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('materials')} (PRO)</h3>
                     <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        Track your inventory of bolts, nuts, glue, electronics, and other parts. All in one place.
                     </p>
                  </div>
                  <button 
                     onClick={onUnlockPro}
                     className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 flex items-center gap-2 transform transition-transform active:scale-95"
                  >
                     <Crown size={18} fill="currentColor" />
                     {t('becomePro')}
                  </button>
               </div>
            ) : (
               <>
                  <div className="flex flex-col md:flex-row gap-3">
                     <div className="relative flex-1 flex gap-2">
                        <div className="relative flex-1">
                           <input 
                              type="text" 
                              placeholder={t('search')}
                              value={filter}
                              onChange={e => setFilter(e.target.value)}
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-4 pl-5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                           />
                        </div>
                        <button 
                           onClick={() => onAddClick('material')}
                           className="p-4 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-500 transition-colors flex items-center justify-center"
                           title={t('newMaterial')}
                        >
                           <Plus size={24} />
                        </button>

                        <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }} className={`p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors ${isSelectionMode ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:white'}`} title="Batch selection">
                           <CheckSquare size={24} />
                        </button>
                     </div>
                     <div className="relative min-w-[180px]">
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="w-full h-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-4 pl-10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none cursor-pointer text-sm">
                           <option value="name-asc">{t('sortNameAsc')}</option>
                           <option value="name-desc">{t('sortNameDesc')}</option>
                           <option value="weight-asc">{t('sortWeightAsc')}</option>
                           <option value="weight-desc">{t('sortWeightDesc')}</option>
                           <option value="date-new">{t('sortDateNew')}</option>
                           <option value="date-old">{t('sortDateOld')}</option>
                        </select>
                        <ArrowUpDown size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                     {sortedMaterials.map(m => renderMaterialCard(m))}
                  </div>

                  {filteredMaterials.length === 0 && (
                     <div className="text-center py-20 text-slate-500"><p>{t('noMaterials')}</p></div>
                  )}
               </>
            )}
         </>
      )}

      <FabButton />
      <ImageZoomOverlay />

      {isSelectionMode && selectedIds.size > 0 && (
         <div className="fixed bottom-24 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-96 bg-slate-900 text-white p-3 rounded-xl shadow-2xl flex items-center justify-between z-30 animate-fade-in border border-slate-700">
            <div className="flex items-center gap-3">
               <button onClick={() => setSelectedIds(new Set())} className="p-1 hover:bg-slate-700 rounded"><X size={16}/></button>
               <span className="font-bold text-sm">{selectedIds.size} {t('selected')}</span>
            </div>
            <button onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
               <Trash2 size={16} /> {t('delete')}
            </button>
         </div>
      )}

      <input 
        type="file" 
        ref={hiddenAiInputRef} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        onChange={handleAiFileChange} 
      />

      {showWebCamera && (
         <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fade-in">
            <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden">
               <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="h-full w-full object-cover"
               />
               
               <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-72 h-72 border-2 border-white/50 rounded-[40px] relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scanner-scan" />
                  </div>
               </div>
               
               <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
                  <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                     <Sparkles size={18} className="text-blue-400" />
                     <span className="text-white text-xs font-bold uppercase tracking-widest">{t('scanTitle')}</span>
                  </div>
                  <button 
                    onClick={stopWebCamera}
                    className="bg-white/10 backdrop-blur-md text-white p-3 rounded-full border border-white/20 hover:bg-white/20 transition-all active:scale-90"
                  >
                    <X size={24} />
                  </button>
               </div>
               
               <div className="absolute bottom-16 left-0 right-0 px-8 flex justify-center items-center gap-8">
                  <button 
                     onClick={captureWebImage}
                     disabled={isScanning}
                     className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center shadow-2xl transition-transform active:scale-90 group disabled:opacity-50"
                  >
                     {isScanning ? (
                        <Loader2 className="animate-spin text-white" size={32} />
                     ) : (
                        <div className="w-16 h-16 rounded-full bg-white group-hover:bg-blue-50 transition-colors shadow-inner" />
                     )}
                  </button>
               </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
         </div>
      )}
    </div>
  );
};