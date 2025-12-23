import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Filament, FilamentMaterial, AiSuggestion, Location, Supplier } from '../types';
import { analyzeSpoolImage, suggestSettings } from '../services/geminiService';
import { Camera as CameraIcon, Loader2, Sparkles, X, Save, RefreshCw, Link as LinkIcon, Euro, Layers, Check, QrCode, Edit2, Download, Image as ImageIcon, FileText, Share2, ToggleLeft, ToggleRight, ScanLine, Eraser, AlertTriangle, Printer, Calculator, Scale, Mail, Send, ExternalLink, Plus, Zap, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showLabel, setShowLabel] = useState(initialShowLabel);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [preferLogo, setPreferLogo] = useState(true);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showWeighHelper, setShowWeighHelper] = useState(false);
  const [grossWeight, setGrossWeight] = useState<number | ''>('');
  const [selectedSpoolType, setSelectedSpoolType] = useState<string>('Generic (Plastic Normaal)');
  const [tareWeight, setTareWeight] = useState<number>(230);
  const [isScannerCollapsed, setIsScannerCollapsed] = useState(!!initialData);

  const [spoolWeights, setSpoolWeights] = useState<Record<string, number>>({
    "Generic (Plastic Normaal)": 230,
    "Generic (Karton)": 140,
    "Generic (MasterSpool/Refill)": 0
  });

  const availableBrands = useMemo(() => {
    const combined = new Set([...COMMON_BRANDS, ...(existingBrands || [])]);
    return Array.from(combined).sort((a, b) => a.localeCompare(b));
  }, [existingBrands]);

  const availableMaterials = useMemo(() => {
     return Object.values(FilamentMaterial).sort();
  }, []);

  useEffect(() => {
    const generateQr = async () => {
      const shortId = initialData?.shortId || formData.shortId;
      if (!shortId || !showLabel) return;
      try {
        // Gebruik een HTTPS link zodat de systeem-camera de app direct kan openen
        const url = `https://filamentmanager.nl/s/${shortId.toUpperCase()}`;
        const qrDataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: 'H', margin: 1, width: 500 });
        setQrCodeUrl(qrDataUrl);
      } catch(e) { console.error(e); }
    };
    generateQr();
  }, [initialData?.shortId, formData.shortId, showLabel]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processImage = async (rawBase64: string) => {
    setIsAnalyzing(true);
    try {
      const result: any = await analyzeSpoolImage(rawBase64);
      if (!result.brand && !result.material && !result.colorName) { alert(t('none')); return; }

      let aiBrand = result.brand;
      let matchedBrand = availableBrands.find(b => b.toLowerCase() === aiBrand?.toLowerCase());
      if (matchedBrand) aiBrand = matchedBrand;
      setIsCustomBrand(!matchedBrand && !!aiBrand);
      
      let aiMaterial = result.material || formData.material;
      let aiColor = result.colorName || formData.colorName;
      let aiHex = result.colorHex;

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
    } catch (error: any) { alert(error.message); } finally { setIsAnalyzing(false); }
  };

  const startCamera = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({ quality: 90, resultType: CameraResultType.Base64, source: CameraSource.Camera, width: 1500 });
        if (image.base64String) await processImage(image.base64String);
        return;
      } catch (e) {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
           <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {isEditMode ? t('formEditTitle') : t('formNewTitle')}
           </h2>
           <button onClick={onCancel} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 scrollbar-hide">
           {!isEditMode && (
              <div className={`bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-lg relative overflow-hidden transition-all duration-300 ${isScannerCollapsed ? 'p-3' : 'p-6'}`}>
                 <div className="relative z-10 flex flex-col">
                    <div className={`flex items-center justify-between ${isScannerCollapsed ? 'mb-0' : 'mb-4'}`}>
                       <div className="flex items-center gap-3">
                          <div className={`${isScannerCollapsed ? 'p-1.5' : 'p-2.5'} bg-white/20 rounded-xl backdrop-blur-md`}>
                             <ScanLine size={isScannerCollapsed ? 18 : 24} />
                          </div>
                          <h3 className="font-bold text-sm md:text-base leading-tight">{t('scanTitle')}</h3>
                       </div>
                       <button type="button" onClick={() => setIsScannerCollapsed(!isScannerCollapsed)}>{isScannerCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</button>
                    </div>
                    {!isScannerCollapsed ? (
                       <button type="button" onClick={startCamera} className="w-full bg-white text-blue-700 font-black py-3.5 rounded-xl flex items-center justify-center gap-3 active:scale-[0.98]">
                          {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <CameraIcon size={20} />}
                          {isAnalyzing ? t('analyzingFilament') : t('lookupMode')}
                       </button>
                    ) : (
                       <button type="button" onClick={startCamera} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-100 mt-2 pl-1"><CameraIcon size={14} /> {t('lookupMode')}</button>
                    )}
                 </div>
              </div>
           )}

           <form onSubmit={(e) => { e.preventDefault(); onSave(formData as Filament); }} className="space-y-5 pb-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('brand')}</label>
                 {isCustomBrand ? (
                    <input type="text" required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/30 rounded-xl p-3 dark:text-white" />
                 ) : (
                    <select required value={formData.brand} onChange={e => e.target.value === 'CUSTOM' ? setIsCustomBrand(true) : setFormData({...formData, brand: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 dark:text-white outline-none">
                       <option value="">{t('selectBrand')}</option>
                       {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                       <option value="CUSTOM">{t('otherBrand')}</option>
                    </select>
                 )}
              </div>

              {/* Materiaal Veld */}
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('material')}</label>
                 <select required value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 dark:text-white outline-none">
                    {availableMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
              </div>

              {/* Kleur Veld - Volledig Onder Elkaar voor Mobiel */}
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('color')}</label>
                 <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                       <select required value={formData.colorName} onChange={(e) => { const v = e.target.value; const c = COMMON_COLORS.find(x=>x.name===v); setFormData({...formData, colorName: v, colorHex: c?.hex || formData.colorHex}); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 dark:text-white outline-none">
                          {COMMON_COLORS.map(c => <option key={c.name} value={c.name}>{tColor(c.name)}</option>)}
                       </select>
                    </div>
                    <div className="flex-shrink-0">
                       <input type="color" value={formData.colorHex} onChange={e => setFormData({...formData, colorHex: e.target.value})} className="w-14 h-12 rounded-xl border border-slate-300 dark:border-slate-600 p-1 cursor-pointer" />
                    </div>
                 </div>
              </div>

              {/* Voorraad Veld */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                 <div className="flex justify-between items-center"><h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('stock')}</h4><button type="button" onClick={() => setShowWeighHelper(true)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-1.5"><Scale size={14} /> {t('weighHelper')}</button></div>
                 <div className="flex flex-col gap-3">
                    <div className="relative"><input type="number" required value={formData.weightRemaining} onChange={e => setFormData({...formData, weightRemaining: parseFloat(e.target.value)})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-8 dark:text-white outline-none" /><span className="absolute left-3 top-3.5 text-slate-400 text-xs">g</span></div>
                 </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"><Save size={20} />{isEditMode ? t('saveChanges') : t('addToInventory')}</button>
           </form>
        </div>
      </div>
    </div>
  );
};