
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Filament, FilamentMaterial, AiSuggestion, Location, Supplier } from '../types';
import { analyzeSpoolImage, suggestSettings } from '../services/geminiService';
import { Camera as CameraIcon, Loader2, Sparkles, X, Save, RefreshCw, Link as LinkIcon, Euro, Layers, Check, QrCode, Edit2, Download, Image as ImageIcon, FileText, Share2, ScanLine, AlertTriangle, Printer, Calculator, Scale, Mail, Send, ExternalLink, Plus, Zap, ChevronDown, ChevronUp, MapPin, Truck, Tag } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
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
}

const APP_LOGO_URI = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 24 24' fill='none' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12 L21 3.5' stroke='%23F97316'/%3E%3Cpath d='M21 3.5 L15 3.5' stroke='%23F97316'/%3E%3Cpath d='M21 12a9 9 0 1 1-6.219-8.56' stroke='%233B82F6'/%3E%3Ccircle cx='12' cy='12' r='2.5' fill='%231E40AF' stroke='none'/%3E%3C/svg%3E";

export const FilamentForm: React.FC<FilamentFormProps> = ({ 
  initialData, locations, suppliers, existingBrands, onSave, onSaveLocation, onSaveSupplier, onCancel, initialShowLabel = false
}) => {
  const { t, tColor } = useLanguage();
  const [showLabel, setShowLabel] = useState(initialShowLabel);
  const [showAdvanced, setShowAdvanced] = useState(false);
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
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScannerCollapsed, setIsScannerCollapsed] = useState(!!initialData);
  const [showWeighHelper, setShowWeighHelper] = useState(false);
  const [grossWeight, setGrossWeight] = useState<number | ''>('');
  const [selectedSpoolType, setSelectedSpoolType] = useState<string>('Generic (Plastic Normaal)');
  const [tareWeight, setTareWeight] = useState<number>(230);
  const [spoolWeights, setSpoolWeights] = useState<Record<string, number>>({});

  const labelRef = useRef<HTMLDivElement>(null); 
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const availableBrands = useMemo(() => {
    const combined = new Set([...COMMON_BRANDS, ...(existingBrands || [])]);
    return Array.from(combined).sort((a, b) => a.localeCompare(b));
  }, [existingBrands]);

  const availableMaterials = useMemo(() => {
     return Object.values(FilamentMaterial).sort();
  }, []);

  useEffect(() => {
     const loadWeights = async () => {
        const { data } = await supabase.from('spool_weights').select('*');
        if (data) {
           const map: Record<string, number> = {};
           data.forEach((item: any) => map[item.name] = item.weight);
           setSpoolWeights(map);
        }
     };
     loadWeights();
  }, []);

  useEffect(() => {
    const generateQr = async () => {
      const shortId = initialData?.shortId || formData.shortId;
      if (!shortId) return;
      try {
        // Generate QR on temporary canvas to add logo
        const canvas = document.createElement('canvas');
        const qrSize = 600;
        await QRCode.toCanvas(canvas, `filament://${shortId}`, { 
          errorCorrectionLevel: 'H', 
          margin: 1, 
          width: qrSize,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const logoImg = new Image();
          logoImg.src = APP_LOGO_URI;
          await new Promise((resolve) => {
            logoImg.onload = resolve;
          });

          // Calculate logo size and position
          const logoSize = qrSize * 0.22; // 22% of QR code
          const logoPos = (qrSize - logoSize) / 2;

          // Draw white background for logo (rounded)
          ctx.fillStyle = '#FFFFFF';
          const padding = 8;
          ctx.beginPath();
          ctx.roundRect(logoPos - padding, logoPos - padding, logoSize + padding * 2, logoSize + padding * 2, 20);
          ctx.fill();

          // Draw the logo
          ctx.drawImage(logoImg, logoPos, logoPos, logoSize, logoSize);
          
          setQrCodeUrl(canvas.toDataURL('image/png'));
        }
      } catch(e) { console.error(e); }
    };
    if (showLabel) generateQr();
  }, [initialData?.shortId, formData.shortId, showLabel]);

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
      notes: formData.notes || '',
      locationId: formData.locationId || null,
      supplierId: formData.supplierId || null,
      shopUrl: formData.shopUrl || '',
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

  const startCamera = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({ quality: 90, resultType: CameraResultType.Base64, source: CameraSource.Camera, width: 1500 });
        if (image.base64String) processImage(image.base64String);
        return;
      } catch (e) {}
    }
    setShowWebCamera(true);
  };

  const [showWebCamera, setShowWebCamera] = useState(false);
  const processImage = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const res = await analyzeSpoolImage(base64);
      setFormData(prev => ({
        ...prev,
        brand: res.brand || prev.brand,
        material: res.material || prev.material,
        colorName: res.colorName || prev.colorName,
        colorHex: res.colorHex || prev.colorHex,
        tempNozzle: res.tempNozzle || prev.tempNozzle,
        tempBed: res.tempBed || prev.tempBed,
        shortId: res.shortId || prev.shortId
      }));
      setIsScannerCollapsed(true);
    } catch(e) { alert("AI kon etiket niet lezen."); }
    finally { setIsAnalyzing(false); }
  };

  const captureWebImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx?.drawImage(videoRef.current, 0, 0);
    processImage(canvasRef.current.toDataURL('image/jpeg'));
    setShowWebCamera(false);
  };

  const handleDownloadLabel = async () => {
    if (!labelRef.current) return;
    const canvas = await html2canvas(labelRef.current, { scale: 3, backgroundColor: '#ffffff', useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [40, 20] });
    pdf.addImage(imgData, 'PNG', 0, 0, 40, 20);
    pdf.save(`label-${formData.shortId || 'filament'}.pdf`);
  };

  const handlePrintLabel = async () => {
    if (!labelRef.current) return;
    const canvas = await html2canvas(labelRef.current, { scale: 3, backgroundColor: '#ffffff', useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Label #${formData.shortId}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: white; }
              img { width: 100%; height: auto; display: block; }
              @page { size: 40mm 20mm; margin: 0; }
            </style>
          </head>
          <body>
            <img src="${imgData}" onload="window.print();window.close();">
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (showLabel) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold dark:text-white flex items-center gap-2"><QrCode className="text-blue-500"/> QR Label (40x20mm)</h2>
            <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600"><X size={24}/></button>
          </div>
          <div className="p-8 flex flex-col items-center">
             <div ref={labelRef} className="w-[240px] h-[120px] bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between text-black shadow-inner">
                <div className="flex-1 flex flex-col justify-between h-full min-w-0 pr-2">
                   <div className="min-w-0">
                      <h4 className="font-black text-[11px] truncate uppercase leading-tight">{formData.brand || 'Filament'}</h4>
                      <p className="text-[9px] font-bold text-slate-500 uppercase truncate">{formData.material || 'PLA'}</p>
                      <p className="text-[8px] text-slate-400 font-medium truncate italic">{tColor(formData.colorName || 'Kleur')}</p>
                   </div>
                   <div className="flex items-center gap-1">
                      <img src={APP_LOGO_URI} className="w-4 h-4 object-contain opacity-40" />
                      <span className="text-[12px] font-black text-blue-600">#{formData.shortId || '----'}</span>
                   </div>
                </div>
                <div className="w-[100px] h-[100px] bg-white flex items-center justify-center shrink-0">
                   {qrCodeUrl ? <img src={qrCodeUrl} className="w-full h-full" /> : <div className="animate-pulse bg-slate-100 w-full h-full" />}
                </div>
             </div>
             
             <div className="grid grid-cols-3 gap-3 w-full mt-8">
                <button onClick={handlePrintLabel} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95"><Printer size={18}/> <span className="text-[10px] uppercase">Print</span></button>
                <button onClick={handleDownloadLabel} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95"><Download size={18}/> <span className="text-[10px] uppercase">PDF</span></button>
                <button onClick={() => setShowLabel(false)} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95"><Edit2 size={18}/> <span className="text-[10px] uppercase">{t('edit')}</span></button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
           <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {isEditMode ? <Edit2 size={20} className="text-blue-500" /> : <Plus size={24} className="text-blue-500" />}
              {isEditMode ? t('formEditTitle') : t('formNewTitle')}
           </h2>
           <button onClick={onCancel} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 scrollbar-hide">
           {!isEditMode && (
              <div className={`bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-lg relative overflow-hidden transition-all duration-300 ${isScannerCollapsed ? 'p-3' : 'p-6'}`}>
                 <div className="relative z-10 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/20"><ScanLine size={18} /></div>
                          <h3 className="font-bold text-sm">{t('scanTitle')}</h3>
                       </div>
                       <button type="button" onClick={() => setIsScannerCollapsed(!isScannerCollapsed)}>{isScannerCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</button>
                    </div>
                    {!isScannerCollapsed && (
                       <button type="button" onClick={startCamera} disabled={isAnalyzing} className="w-full bg-white text-blue-700 font-black py-3 rounded-xl shadow-md flex items-center justify-center gap-2">
                          {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <CameraIcon size={20} />}
                          {isAnalyzing ? t('analyzingFilament') : t('lookupMode')}
                       </button>
                    )}
                 </div>
              </div>
           )}

           <form onSubmit={(e) => { e.preventDefault(); triggerSubmit(); }} className="space-y-5">
              {/* Basis Gegevens */}
              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">{t('brand')}</label>
                    <select required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 dark:text-white appearance-none outline-none focus:ring-2 focus:ring-blue-500">
                       <option value="">{t('selectBrand')}</option>
                       {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">{t('material')}</label>
                       <select value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 dark:text-white appearance-none outline-none focus:ring-2 focus:ring-blue-500">
                          {availableMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">{t('color')}</label>
                       <div className="flex gap-2">
                          <select value={formData.colorName} onChange={e => { const c = COMMON_COLORS.find(x => x.name === e.target.value); setFormData({...formData, colorName: e.target.value, colorHex: c?.hex || formData.colorHex}) }} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 dark:text-white appearance-none">
                             {COMMON_COLORS.map(c => <option key={c.name} value={c.name}>{tColor(c.name)}</option>)}
                          </select>
                          <input type="color" value={formData.colorHex} onChange={e => setFormData({...formData, colorHex: e.target.value})} className="w-12 h-12 rounded-xl border border-slate-300 p-1 cursor-pointer" />
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t('weightRemainingLabel')}</label>
                       <div className="relative"><input type="number" required value={formData.weightRemaining} onChange={e => setFormData({...formData, weightRemaining: parseFloat(e.target.value)})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-xl p-3 pl-8 dark:text-white outline-none" /><span className="absolute left-3 top-3.5 text-slate-400 text-xs">g</span></div>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t('tempNozzle')}</label>
                       <input type="number" value={formData.tempNozzle} onChange={e => setFormData({...formData, tempNozzle: parseInt(e.target.value)})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-xl p-3 dark:text-white outline-none" />
                    </div>
                 </div>
              </div>

              {/* Advanced Toggle */}
              <button 
                type="button" 
                onClick={() => setShowAdvanced(!showAdvanced)} 
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
              >
                 <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Tag size={16} className="text-blue-500"/> {t('tabManagement')} & Details
                 </span>
                 {showAdvanced ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
              </button>

              {showAdvanced && (
                 <div className="space-y-4 animate-fade-in p-1">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t('price')} (€)</label>
                          <div className="relative">
                             <input type="number" step="0.01" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 pl-8 dark:text-white outline-none" />
                             <Euro size={14} className="absolute left-3 top-4 text-slate-400"/>
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Totaalgewicht (g)</label>
                          <input type="number" value={formData.weightTotal} onChange={e => setFormData({...formData, weightTotal: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 dark:text-white outline-none" />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Locatie</label>
                          <div className="relative">
                             <select value={formData.locationId || ''} onChange={e => setFormData({...formData, locationId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 pl-8 dark:text-white appearance-none outline-none">
                                <option value="">{t('none')}</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                             </select>
                             <MapPin size={14} className="absolute left-3 top-4 text-slate-400"/>
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Leverancier</label>
                          <div className="relative">
                             <select value={formData.supplierId || ''} onChange={e => setFormData({...formData, supplierId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 pl-8 dark:text-white appearance-none outline-none">
                                <option value="">{t('none')}</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                             </select>
                             <Truck size={14} className="absolute left-3 top-4 text-slate-400"/>
                          </div>
                       </div>
                    </div>

                    <div>
                       <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Webshop Link</label>
                       <div className="relative">
                          <input type="text" value={formData.shopUrl || ''} onChange={e => setFormData({...formData, shopUrl: e.target.value})} placeholder="https://..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 pl-8 dark:text-white outline-none" />
                          <LinkIcon size={14} className="absolute left-3 top-4 text-slate-400"/>
                       </div>
                    </div>

                    <div>
                       <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Notities</label>
                       <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 dark:text-white outline-none h-20 resize-none" placeholder="bv. Batch nummer, droogtijd, etc." />
                    </div>
                 </div>
              )}

              <div className="pt-4 border-t dark:border-slate-800 flex gap-3">
                 <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"><Save size={20} />{isEditMode ? t('saveChanges') : t('addToInventory')}</button>
                 {isEditMode && <button type="button" onClick={() => setShowLabel(true)} className="px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-blue-50 transition-colors"><QrCode size={24}/></button>}
              </div>
           </form>
        </div>
      </div>

      {showWebCamera && (
         <div className="fixed inset-0 z-[200] bg-black flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="w-64 h-64 border-2 border-white/50 rounded-3xl" />
            </div>
            <button onClick={() => setShowWebCamera(false)} className="absolute top-8 right-8 text-white"><X size={32}/></button>
            <div className="absolute bottom-12 left-0 right-0 flex justify-center"><button onClick={captureWebImage} className="w-20 h-20 bg-white rounded-full border-8 border-slate-300" /></div>
            <canvas ref={canvasRef} className="hidden" />
         </div>
      )}
    </div>
  );
};
