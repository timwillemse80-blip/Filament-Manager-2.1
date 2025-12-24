import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Filament, FilamentMaterial, AiSuggestion, Location, Supplier } from '../types';
import { analyzeSpoolImage, suggestSettings } from '../services/geminiService';
import { Camera as CameraIcon, Loader2, Sparkles, X, Save, RefreshCw, Link as LinkIcon, Euro, Layers, Check, QrCode, Edit2, Download, Image as ImageIcon, FileText, Share2, ToggleLeft, ToggleRight, ScanLine, Eraser, AlertTriangle, Printer, Calculator, Scale, Mail, Send, ExternalLink, Plus, Zap, ChevronDown, ChevronUp, Construction } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { App as CapacitorApp } from '@capacitor/app';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../services/supabase';
import { COMMON_BRANDS, BRAND_DOMAINS, COMMON_COLORS, ENGLISH_COLOR_MAP } from '../constants';

interface FilamentFormProps {
  initialData?: Filament;
  locations: Location[];
  suppliers: Supplier[];
  existingBrands?: string[];
  onSave: (filament: Filament | Filament[]) => void;
  onSaveLocation: (loc: Location) => void;
  onSaveSupplier: (sup: Supplier) => void;
  onCancel: () => void;
  initialShowLabel?: boolean;
  onSetHandlesBackButton?: (handles: boolean) => void;
}

const APP_LOGO_URI = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 24 24' fill='none' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12 L21 3.5' stroke='%23F97316'/%3E%3Cpath d='M21 3.5 L15 3.5' stroke='%23F97316'/%3E%3Cpath d='M21 12a9 9 0 1 1-6.219-8.56' stroke='%233B82F6'/%3E%3Ccircle cx='12' cy='12' r='2.5' fill='%231E40AF' stroke='none'/%3E%3C/svg%3E";

export const FilamentForm: React.FC<FilamentFormProps> = ({ 
  initialData, locations, suppliers, existingBrands, onSave, onSaveLocation, onSaveSupplier, onCancel, initialShowLabel = false, onSetHandlesBackButton
}) => {
  const { t, tColor } = useLanguage();
  const [formData, setFormData] = useState<Partial<Filament>>(initialData || {
    brand: '',
    material: FilamentMaterial.PLA,
    colorName: 'Zwart',
    colorHex: '#000000',
    weightTotal: 1000,
    weightRemaining: 1000,
    tempNozzle: 200,
    tempBed: 60,
    notes: '',
    locationId: '',
    supplierId: '',
    shopUrl: '',
    price: undefined,
    shortId: undefined
  });

  const isEditMode = !!initialData;
  const [quantity, setQuantity] = useState(1);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isCustomMaterial, setIsCustomMaterial] = useState(false);
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [showLabel, setShowLabel] = useState(initialShowLabel);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [preferLogo, setPreferLogo] = useState(true);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showWeighHelper, setShowWeighHelper] = useState(false);
  const [showAiMaintenance, setShowAiMaintenance] = useState(false);
  const [grossWeight, setGrossWeight] = useState<number | ''>('');
  const [selectedSpoolType, setSelectedSpoolType] = useState<string>('Generic (Plastic Normaal)');
  const [tareWeight, setTareWeight] = useState<number>(230);
  const [isScannerCollapsed, setIsScannerCollapsed] = useState(!!initialData);

  const [spoolWeights, setSpoolWeights] = useState<Record<string, number>>({
    "Generic (Plastic Normaal)": 230,
    "Generic (Karton)": 140,
    "Generic (MasterSpool/Refill)": 0
  });

  const [dbBrands, setDbBrands] = useState<string[]>([]);
  const [dbMaterials, setDbMaterials] = useState<string[]>([]);
  const [showContribute, setShowContribute] = useState(false);
  const [contributeForm, setContributeForm] = useState({ brand: '', type: '', weight: '' });

  const labelRef = useRef<HTMLDivElement>(null); 
  const formDataRef = useRef(formData);
  const showLabelRef = useRef(showLabel);
  const initialDataRef = useRef(initialData);

  const availableBrands = useMemo(() => {
    const combined = new Set([...COMMON_BRANDS, ...dbBrands, ...(existingBrands || [])]);
    return Array.from(combined).sort((a, b) => a.localeCompare(b));
  }, [dbBrands, existingBrands]);

  const availableMaterials = useMemo(() => {
     const combined = new Set([...Object.values(FilamentMaterial), ...dbMaterials]);
     return Array.from(combined).sort();
  }, [dbMaterials]);

  useEffect(() => {
     const loadData = async () => {
        try {
           const { data: weightsData } = await supabase.from('spool_weights').select('*');
           if (weightsData && weightsData.length > 0) {
              const weightsMap: Record<string, number> = {};
              weightsData.forEach((item: any) => { weightsMap[item.name] = item.weight; });
              setSpoolWeights(prev => ({ ...prev, ...weightsMap }));
           }
           const { data: brandsData } = await supabase.from('brands').select('name');
           if (brandsData) setDbBrands(brandsData.map(b => b.name));
           const { data: materialsData } = await supabase.from('materials').select('name');
           if (materialsData) setDbMaterials(materialsData.map(m => m.name));
        } catch (e) { console.error(e); }
     };
     loadData();
  }, []);

  useEffect(() => {
     if (formData.brand && showWeighHelper) {
        const brandLower = formData.brand.toLowerCase();
        let bestMatch = '';
        if (brandLower.includes('bambu')) bestMatch = "Bambu Lab (Reusable)";
        else if (brandLower.includes('prusa')) bestMatch = "Prusament";
        else if (brandLower.includes('esun')) bestMatch = "eSun (Zwart Plastic)";
        else if (brandLower.includes('sunlu')) bestMatch = "Sunlu (Plastic)";
        else if (brandLower.includes('polymaker')) bestMatch = "Polymaker (Karton)";
        if (bestMatch && spoolWeights[bestMatch]) {
           setSelectedSpoolType(bestMatch);
           setTareWeight(spoolWeights[bestMatch]);
        }
     }
  }, [formData.brand, showWeighHelper, spoolWeights]);

  const handleApplyWeight = () => {
     if (grossWeight && typeof grossWeight === 'number') {
        const net = Math.max(0, grossWeight - tareWeight);
        setFormData(prev => ({ ...prev, weightRemaining: net }));
        setShowWeighHelper(false);
     }
  };

  const handleSendContribution = () => {
     if (!contributeForm.brand || !contributeForm.weight) return;
     const subject = encodeURIComponent(`Nieuwe Spoel Gewicht Suggestie`);
     const body = encodeURIComponent(`Merk: ${contributeForm.brand}\nType: ${contributeForm.type}\nGewicht: ${contributeForm.weight}g`);
     window.open(`mailto:info@filamentmanager.nl?subject=${subject}&body=${body}`, Capacitor.isNativePlatform() ? '_system' : undefined);
     setShowContribute(false);
  };

  const handleOpenShopUrl = () => {
    if (!formData.shopUrl) return;
    let url = formData.shopUrl;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    window.open(url, Capacitor.isNativePlatform() ? '_system' : '_blank');
  };

  useEffect(() => {
    formDataRef.current = formData;
    showLabelRef.current = showLabel;
    initialDataRef.current = initialData;
  }, [formData, showLabel, initialData]);

  const triggerSubmit = () => {
    const baseFilament: Filament = {
      id: initialData?.id || crypto.randomUUID(),
      shortId: initialData?.shortId,
      purchaseDate: initialData?.purchaseDate || new Date().toISOString(),
      brand: formData.brand!,
      material: formData.material!,
      colorName: formData.colorName!,
      colorHex: formData.colorHex!,
      weightTotal: Number(formData.weightTotal),
      weightRemaining: Number(formData.weightRemaining),
      tempNozzle: Number(formData.tempNozzle),
      tempBed: Number(formData.tempBed),
      notes: formData.notes,
      locationId: formData.locationId || null,
      supplierId: formData.supplierId || null,
      shopUrl: formData.shopUrl,
      price: formData.price ? Number(formData.price) : undefined
    };

    if (initialData) onSave(baseFilament);
    else {
      if (quantity > 1) {
        const newFilaments: Filament[] = [];
        for (let i = 0; i < quantity; i++) {
          newFilaments.push({ ...baseFilament, id: crypto.randomUUID() });
        }
        onSave(newFilaments);
      } else onSave({ ...baseFilament, id: crypto.randomUUID() });
    }
  };

  const checkIsDirty = () => {
    const fd = formDataRef.current;
    const id = initialDataRef.current;
    if (!id) return !!fd.brand || !!fd.notes || (fd.weightRemaining !== 1000);
    return fd.brand !== id.brand || fd.material !== id.material || fd.colorName !== id.colorName || fd.colorHex !== id.colorHex || fd.weightRemaining !== id.weightRemaining;
  };

  const attemptClose = () => checkIsDirty() ? setShowUnsavedDialog(true) : onCancel();

  useEffect(() => {
    if (initialData) {
      if (initialData.brand && !availableBrands.includes(initialData.brand)) setIsCustomBrand(true);
      if (initialData.material && !availableMaterials.includes(initialData.material)) setIsCustomMaterial(true);
      if (initialData.colorName && !COMMON_COLORS.some(c => c.name === initialData.colorName)) setIsCustomColor(true);
    }
  }, [initialData, availableBrands, availableMaterials]);

  useEffect(() => {
    const generateQr = async () => {
      const shortId = initialData?.shortId || formData.shortId;
      if (!shortId || !showLabel) return;
      try {
        const qrDataUrl = await QRCode.toDataURL(`filament://${shortId}`, { errorCorrectionLevel: 'H', margin: 1, width: 500 });
        setQrCodeUrl(qrDataUrl);
      } catch(e) { console.error(e); }
    };
    generateQr();
  }, [initialData?.shortId, formData.shortId, showLabel]);

  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processImage = async (rawBase64: string) => {
    setIsScanning(true);
    setIsAnalyzing(true);
    setShowCamera(false); 
    try {
      const result: any = await analyzeSpoolImage(rawBase64);
      if (!result.brand && !result.material && !result.colorName) { alert(t('none')); return; }

      let aiBrand = result.brand;
      let matchedBrand = availableBrands.find(b => b.toLowerCase() === aiBrand?.toLowerCase());
      if (matchedBrand) aiBrand = matchedBrand;
      setIsCustomBrand(!matchedBrand && !!aiBrand);
      
      let aiMaterial = result.material || formData.material;
      let matchedMaterial = availableMaterials.find(m => m.toLowerCase() === aiMaterial?.toLowerCase());
      if (matchedMaterial) aiMaterial = matchedMaterial;
      setIsCustomMaterial(!matchedMaterial && !!aiMaterial);

      let aiColor = result.colorName || formData.colorName;
      let aiHex = result.colorHex;
      if (aiColor && ENGLISH_COLOR_MAP[aiColor.toLowerCase().trim()]) {
         const entry = ENGLISH_COLOR_MAP[aiColor.toLowerCase().trim()];
         aiColor = entry.name;
         if (!aiHex || aiHex === '#000000') aiHex = entry.hex;
      }
      let matchedColor = COMMON_COLORS.find(c => c.name.toLowerCase() === aiColor?.toLowerCase());
      if (matchedColor) { aiColor = matchedColor.name; if (!aiHex || aiHex === '#000000') aiHex = matchedColor.hex; }
      setIsCustomColor(!matchedColor && !!aiColor);

      setFormData(prev => ({
        ...prev,
        brand: aiBrand,
        material: aiMaterial,
        colorName: aiColor,
        colorHex: aiHex || prev.colorHex,
        tempNozzle: result.tempNozzle || prev.tempNozzle,
        tempBed: result.tempBed || prev.tempBed
      }));
      setIsScannerCollapsed(true);
    } catch (error: any) { alert(error.message); } finally { setIsScanning(false); setIsAnalyzing(false); }
  };

  const startCamera = async () => {
    // INTERCEPT: Show maintenance alert
    setShowAiMaintenance(true);
    return;
    
    // Original logic below (currently bypassed)
    /*
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({ quality: 90, resultType: CameraResultType.Base64, source: CameraSource.Camera, width: 1500 });
        if (image.base64String) await processImage(image.base64String);
        return;
      } catch (e) {}
    }
    setShowWebCamera(true);
    */
  };

  const [showWebCamera, setShowWebCamera] = useState(false);
  const stopWebCamera = () => { if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop()); setShowWebCamera(false); };
  const captureWebImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    processImage(canvasRef.current.toDataURL('image/jpeg', 0.85));
    stopWebCamera();
  };

  const handleAutoSettings = async () => {
    if (!formData.brand || !formData.material) return;
    setIsAnalyzing(true);
    try {
      const res = await suggestSettings(formData.brand, formData.material);
      setFormData(prev => ({ ...prev, tempNozzle: res.tempNozzle || prev.tempNozzle, tempBed: res.tempBed || prev.tempBed }));
    } catch (e) {} finally { setIsAnalyzing(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
           <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 {isEditMode ? <Edit2 size={20} className="text-blue-500" /> : <Plus size={24} className="text-blue-500" />}
                 {isEditMode ? t('formEditTitle') : t('formNewTitle')}
              </h2>
           </div>
           <button onClick={attemptClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 scrollbar-hide">
           
           {/* Smart AI Scanner Section with Collapse/Expand */}
           {!isEditMode && (
              <div className={`bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-lg relative overflow-hidden transition-all duration-300 ${isScannerCollapsed ? 'p-3' : 'p-6'}`}>
                 {!isScannerCollapsed && (
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                       <Sparkles size={100} />
                    </div>
                 )}
                 
                 <div className="relative z-10 flex flex-col">
                    <div className={`flex items-center justify-between ${isScannerCollapsed ? 'mb-0' : 'mb-4'}`}>
                       <div className="flex items-center gap-3">
                          <div className={`${isScannerCollapsed ? 'p-1.5' : 'p-2.5'} bg-white/20 rounded-xl backdrop-blur-md border border-white/20`}>
                             <ScanLine size={isScannerCollapsed ? 18 : 24} />
                          </div>
                          <div className={isScannerCollapsed ? 'flex items-center gap-2' : ''}>
                             <h3 className="font-bold text-sm md:text-base leading-tight">{t('scanTitle')}</h3>
                             {!isScannerCollapsed && <p className="text-[10px] md:text-xs text-blue-100 opacity-80">{t('scanDesc')}</p>}
                          </div>
                       </div>
                       <button 
                          type="button" 
                          onClick={() => setIsScannerCollapsed(!isScannerCollapsed)}
                          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                       >
                          {isScannerCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                       </button>
                    </div>
                    
                    {!isScannerCollapsed ? (
                       <button 
                          type="button"
                          onClick={startCamera}
                          disabled={isAnalyzing}
                          className="w-full bg-white text-blue-700 font-black py-3.5 rounded-xl shadow-md hover:bg-blue-50 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98] disabled:opacity-50"
                       >
                          {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <CameraIcon size={20} />}
                          {isAnalyzing ? t('analyzingFilament') : t('lookupMode')}
                       </button>
                    ) : (
                       <button 
                          type="button"
                          onClick={startCamera}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-100 hover:text-white mt-2 pl-1 transition-colors"
                       >
                          <CameraIcon size={14} /> {t('lookupMode')}
                       </button>
                    )}
                 </div>
              </div>
           )}

           <form onSubmit={(e) => { e.preventDefault(); triggerSubmit(); }} className="space-y-5 pb-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex justify-between items-center">
                    <span>{t('brand')}</span>
                    {isCustomBrand && <button type="button" onClick={() => setIsCustomBrand(false)} className="text-blue-500 text-[10px] hover:underline">{t('selectBrand')}</button>}
                 </label>
                 {isCustomBrand ? (
                    <input type="text" required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/30 rounded-xl p-3 outline-none focus:border-blue-500 dark:text-white" />
                 ) : (
                    <select required value={formData.brand} onChange={e => e.target.value === 'CUSTOM' ? setIsCustomBrand(true) : setFormData({...formData, brand: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none">
                       <option value="">{t('selectBrand')}</option>
                       {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                       <option value="CUSTOM">{t('otherBrand')}</option>
                    </select>
                 )}
              </div>

              {/* Responsieve layout voor Materiaal en Kleur */}
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('material')}</label>
                    {isCustomMaterial ? (
                       <input type="text" required value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/30 rounded-xl p-3 outline-none focus:border-blue-500 dark:text-white" />
                    ) : (
                       <select required value={formData.material} onChange={e => e.target.value === 'CUSTOM' ? setIsCustomMaterial(true) : setFormData({...formData, material: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none">
                          {availableMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                          <option value="CUSTOM">{t('otherMaterial')}</option>
                       </select>
                    )}
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('color')}</label>
                    <div className="flex gap-2 w-full">
                       {isCustomColor ? (
                          <input type="text" required value={formData.colorName} onChange={e => setFormData({...formData, colorName: e.target.value})} className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/30 rounded-xl p-3 outline-none focus:border-blue-500 dark:text-white" />
                       ) : (
                          <select required value={formData.colorName} onChange={(e) => { const v = e.target.value; if(v==='CUSTOM') setIsCustomColor(true); else { const c = COMMON_COLORS.find(x=>x.name===v); setFormData({...formData, colorName: v, colorHex: c?.hex || formData.colorHex}); } }} className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none">
                             {COMMON_COLORS.map(c => <option key={c.name} value={c.name}>{tColor(c.name)}</option>)}
                             <option value="CUSTOM">{t('otherColor')}</option>
                          </select>
                       )}
                       <input type="color" value={formData.colorHex} onChange={e => { const h=e.target.value; const m=COMMON_COLORS.find(x=>x.hex.toLowerCase()===h.toLowerCase()); setFormData({...formData, colorHex: h, colorName: m ? m.name : formData.colorName}); if(!m) setIsCustomColor(true); }} className="w-12 h-12 rounded-xl border border-slate-300 dark:border-slate-600 p-1 flex-shrink-0 cursor-pointer" />
                    </div>
                 </div>
              </div>

              {/* Responsieve layout voor Voorraad */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                 <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('stock')}</h4>
                    <button type="button" onClick={() => setShowWeighHelper(true)} className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-1.5"><Scale size={14} /> {t('weighHelper')}</button>
                 </div>
                 <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-bold text-slate-500 uppercase">{t('weightTotalLabel')}</label>
                       <div className="relative"><input type="number" required value={formData.weightTotal} onChange={e => setFormData({...formData, weightTotal: parseFloat(e.target.value)})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-8 dark:text-white outline-none" /><span className="absolute left-3 top-3.5 text-slate-400 text-xs">g</span></div>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-500 uppercase">{t('weightRemainingLabel')}</label>
                       <div className="relative"><input type="number" required value={formData.weightRemaining} onChange={e => setFormData({...formData, weightRemaining: parseFloat(e.target.value)})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-8 dark:text-white outline-none" /><span className="absolute left-3 top-3.5 text-slate-400 text-xs">g</span></div>
                    </div>
                 </div>
              </div>

              {/* Responsieve layout voor Instellingen */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                 <div className="flex justify-between items-center"><h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Instellingen</h4><button type="button" onClick={handleAutoSettings} disabled={!formData.brand || !formData.material || isAnalyzing} className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-800 flex items-center gap-1.5"><Zap size={14} /> AI</button></div>
                 <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">{t('tempNozzle')}</label><input type="number" value={formData.tempNozzle} onChange={e => setFormData({...formData, tempNozzle: parseInt(e.target.value)})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 dark:text-white outline-none" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">{t('tempBed')}</label><input type="number" value={formData.tempBed} onChange={e => setFormData({...formData, tempBed: parseInt(e.target.value)})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 dark:text-white outline-none" /></div>
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-3">
                 <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"><Save size={20} />{isEditMode ? t('saveChanges') : t('addToInventory')}</button>
              </div>
           </form>
        </div>
      </div>
      
      {showWebCamera && (
         <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fade-in">
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center"><div className="w-72 h-72 border-2 border-white/50 rounded-[40px] relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scanner-scan" /></div></div>
            <button onClick={stopWebCamera} className="absolute top-8 right-8 bg-white/10 backdrop-blur-md text-white p-3 rounded-full"><X size={24} /></button>
            <div className="absolute bottom-16 left-0 right-0 flex justify-center"><button onClick={captureWebImage} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"><div className="w-16 h-16 rounded-full bg-white" /></button></div>
            <canvas ref={canvasRef} className="hidden" />
         </div>
      )}

      {showWeighHelper && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center"><h3 className="text-xl font-bold dark:text-white flex items-center gap-3"><Scale size={24} className="text-blue-500" /> {t('weighHelper')}</h3><button onClick={() => setShowWeighHelper(false)}><X size={24} /></button></div>
               <div className="p-6 space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                     <label className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-2 block">{t('grossWeight')}</label>
                     <div className="flex items-center gap-4"><input type="number" autoFocus value={grossWeight} onChange={e => setGrossWeight(e.target.value === '' ? '' : parseFloat(e.target.value))} className="flex-1 bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 text-2xl font-black dark:text-white outline-none" /><span className="text-xl font-bold text-slate-400">gram</span></div>
                  </div>
                  <div><label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">{t('spoolType')}</label><select value={selectedSpoolType} onChange={e => { const k=e.target.value; setSelectedSpoolType(k); setTareWeight(spoolWeights[k]||0); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none dark:text-white appearance-none">{Object.keys(spoolWeights).sort().map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                  <button onClick={handleApplyWeight} disabled={grossWeight === ''} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg active:scale-[0.98] disabled:opacity-50">{t('apply')}</button>
               </div>
            </div>
         </div>
      )}

      {showAiMaintenance && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-8 text-center shadow-2xl border border-slate-200 dark:border-slate-800">
               <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Construction size={40} className="text-amber-600 dark:text-amber-400" />
               </div>
               <h2 className="text-xl font-black dark:text-white mb-2">{t('aiCameraUnavailable')}</h2>
               <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                  {t('aiCameraUnavailableDesc')}
               </p>
               <button 
                  onClick={() => setShowAiMaintenance(false)}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]"
               >
                  {t('close')}
               </button>
            </div>
         </div>
      )}

      {showUnsavedDialog && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in"><div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-8 text-center"><div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertTriangle size={40} className="text-amber-500" /></div><h2 className="text-2xl font-black dark:text-white mb-2">Niet opgeslagen!</h2><p className="text-slate-500 mb-8">Wil je de wijzigingen opslaan voordat je afsluit?</p><div className="flex flex-col gap-3"><button onClick={triggerSubmit} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg">Opslaan en Sluiten</button><button onClick={onCancel} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-red-600 font-bold rounded-2xl">Weggooien</button><button onClick={() => setShowUnsavedDialog(false)} className="text-slate-400 font-bold text-sm">Nee, ga terug</button></div></div></div>
      )}

    </div>
  );
};