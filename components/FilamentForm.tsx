import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Filament, Location, Supplier, AiSuggestion } from '../types';
import { 
  Save, X, Trash2, Layers, Tag, MapPin, Truck, Link as LinkIcon, 
  Euro, ExternalLink, Camera, Image as ImageIcon, Sparkles, 
  Thermometer, Weight, Plus, RefreshCw, Loader2, Search, Check,
  ChevronDown, ChevronUp, FileText, Hash, ScanLine
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { analyzeSpoolImage, suggestSettings } from '../services/geminiService';
import { QUICK_COLORS, COMMON_BRANDS, COMMON_MATERIALS } from '../constants';

interface FilamentFormProps {
  initialData?: Partial<Filament>;
  locations: Location[];
  suppliers: Supplier[];
  existingBrands: string[];
  spoolWeights: any[];
  onSave: (filament: Filament | Filament[]) => void;
  onSaveLocation: () => void;
  onSaveSupplier: () => void;
  onCancel: () => void;
  isAdmin?: boolean;
}

export const FilamentForm: React.FC<FilamentFormProps> = ({ 
  initialData, locations, suppliers, existingBrands, spoolWeights, 
  onSave, onCancel, isAdmin 
}) => {
  const { t, tColor } = useLanguage();
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Filament>>(initialData || {
    brand: '',
    material: 'PLA',
    colorName: '',
    colorHex: '#3b82f6',
    weightTotal: 1000,
    weightRemaining: 1000,
    tempNozzle: 210,
    tempBed: 60,
    purchaseDate: new Date().toISOString().split('T')[0],
    price: 0,
    notes: '',
    shopUrl: '',
    locationId: null,
    supplierId: null
  });

  const [multiSpoolCount, setMultiSpoolCount] = useState(1);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [lastScannedImage, setLastScannedImage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Weigh Helper state
  const [showWeighHelper, setShowWeighHelper] = useState(false);
  const [grossWeight, setGrossWeight] = useState<number | ''>('');
  const [selectedSpoolId, setSelectedSpoolId] = useState<string | number | null>(null);
  const [spoolSearch, setSpoolSearch] = useState('');

  // Brand/Material custom state
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isCustomMaterial, setIsCustomMaterial] = useState(false);

  const allBrands = useMemo(() => {
    return Array.from(new Set([...COMMON_BRANDS, ...existingBrands])).sort();
  }, [existingBrands]);

  const filteredSpools = useMemo(() => {
    if (!spoolSearch) return spoolWeights;
    const lower = spoolSearch.toLowerCase();
    return spoolWeights.filter(s => 
      (s.brand && s.brand.toLowerCase().includes(lower)) ||
      (s.name && s.name.toLowerCase().includes(lower))
    );
  }, [spoolWeights, spoolSearch]);

  const handleAiScan = async () => {
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
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
          processImageBase64(image.base64String);
        }
        return;
      } catch (error: any) {
        if (error.message?.includes('User cancelled')) return;
        console.warn("Native camera failed, falling back to browser input.", error);
      }
    }

    hiddenFileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        processImageBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImageBase64 = async (base64Data: string) => {
    setIsAiAnalyzing(true);
    setLastScannedImage(`data:image/jpeg;base64,${base64Data}`);
    try {
      const suggestion = await analyzeSpoolImage(base64Data);
      applyAiSuggestion(suggestion);
    } catch (e: any) {
      alert(t('aiError') + "\n\n" + e.message);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const applyAiSuggestion = (suggestion: AiSuggestion) => {
    setFormData(prev => ({
      ...prev,
      brand: suggestion.brand || prev.brand,
      material: suggestion.material || prev.material,
      colorName: suggestion.colorName || prev.colorName,
      colorHex: suggestion.colorHex || prev.colorHex,
      tempNozzle: suggestion.tempNozzle || prev.tempNozzle,
      tempBed: suggestion.tempBed || prev.tempBed,
      shortId: suggestion.shortId || prev.shortId
    }));
    
    if (suggestion.brand && !allBrands.includes(suggestion.brand)) {
        setIsCustomBrand(true);
    }
    if (suggestion.material && !COMMON_MATERIALS.includes(suggestion.material)) {
        setIsCustomMaterial(true);
    }
  };

  const handleAutoFillSettings = async () => {
    if (!formData.brand || !formData.material) return;
    try {
      const suggestion = await suggestSettings(formData.brand, formData.material);
      setFormData(prev => ({
        ...prev,
        tempNozzle: suggestion.tempNozzle || prev.tempNozzle,
        tempBed: suggestion.tempBed || prev.tempBed
      }));
    } catch (e) {
      console.error("AutoFill error", e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand || !formData.material || !formData.colorName) {
        alert("Please fill in all required fields.");
        return;
    }

    if (!initialData?.id && multiSpoolCount > 1) {
        const items: Filament[] = [];
        for (let i = 0; i < multiSpoolCount; i++) {
            items.push({
                ...formData as Filament,
                id: crypto.randomUUID()
            });
        }
        onSave(items);
    } else {
        onSave({
            ...formData as Filament,
            id: initialData?.id || crypto.randomUUID()
        });
    }
  };

  const handleApplyTare = () => {
    const spool = spoolWeights.find(s => s.id === selectedSpoolId);
    if (spool && typeof grossWeight === 'number') {
        const remaining = Math.max(0, grossWeight - spool.weight);
        setFormData({ ...formData, weightRemaining: remaining });
        setShowWeighHelper(false);
    }
  };

  const handleOpenShop = () => {
    if (!formData.shopUrl) return;
    const url = formData.shopUrl.startsWith('http') ? formData.shopUrl : `https://${formData.shopUrl}`;
    if (Capacitor.isNativePlatform()) {
      window.open(url, '_system');
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
           <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg">
                 <Layers size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-bold dark:text-white text-slate-800">
                    {formData.id ? t('formEditTitle') : t('formNewTitle')}
                 </h2>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <input 
                type="file" 
                ref={hiddenFileInputRef} 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={handleFileChange} 
              />
              
              <button 
                type="button"
                onClick={handleAiScan}
                disabled={isAiAnalyzing}
                className="group relative flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
              >
                {isAiAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <ScanLine size={20} />}
                <span className="font-bold text-sm">AI Scan</span>
              </button>
              <button onClick={onCancel} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                 <X size={24} />
              </button>
           </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 relative">
           {isAiAnalyzing && (
              <div className="absolute inset-0 z-50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
                 <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-3xl flex items-center justify-center mb-4 shadow-xl border border-indigo-200 dark:border-indigo-800">
                    <Loader2 size={40} className="text-indigo-600 dark:text-indigo-400 animate-spin" />
                 </div>
                 <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-300">{t('aiAnalyzing')}</h3>
                 <p className="text-sm text-indigo-600/70 dark:text-indigo-400/60">{t('aiAnalyzingDesc')}</p>
                 {lastScannedImage && (
                    <img src={lastScannedImage} className="w-32 h-32 object-cover rounded-2xl mt-6 border-4 border-white dark:border-slate-800 shadow-2xl transform rotate-3" />
                 )}
              </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block tracking-widest">{t('brand')}</label>
                    <div className="flex gap-2">
                       {isCustomBrand ? (
                          <div className="flex-1 flex gap-2">
                             <input 
                                type="text" 
                                required
                                value={formData.brand} 
                                onChange={e => setFormData({...formData, brand: e.target.value})}
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                placeholder="Brand Name..."
                             />
                             <button type="button" onClick={() => setIsCustomBrand(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"><RefreshCw size={18}/></button>
                          </div>
                       ) : (
                          <select 
                             required
                             value={formData.brand} 
                             onChange={e => { 
                                if(e.target.value === 'CUSTOM') setIsCustomBrand(true);
                                else setFormData({...formData, brand: e.target.value});
                             }}
                             className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                          >
                             <option value="">{t('selectBrand')}</option>
                             {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
                             <option value="CUSTOM">{t('otherBrand')}</option>
                          </select>
                       )}
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block tracking-widest">{t('material')}</label>
                    <div className="flex gap-2">
                       {isCustomMaterial ? (
                          <div className="flex-1 flex gap-2">
                             <input 
                                type="text" 
                                required
                                value={formData.material} 
                                onChange={e => setFormData({...formData, material: e.target.value})}
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                placeholder="Material..."
                             />
                             <button type="button" onClick={() => setIsCustomMaterial(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"><RefreshCw size={18}/></button>
                          </div>
                       ) : (
                          <select 
                             required
                             value={formData.material} 
                             onChange={e => {
                                if(e.target.value === 'CUSTOM') setIsCustomMaterial(true);
                                else setFormData({...formData, material: e.target.value});
                             }}
                             className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                          >
                             {COMMON_MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                             <option value="CUSTOM">{t('otherMaterial')}</option>
                          </select>
                       )}
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-500 uppercase block tracking-widest">{t('color')}</label>
                 <div className="flex flex-wrap gap-2">
                    {QUICK_COLORS.map(c => (
                       <button 
                          key={c.name}
                          type="button"
                          onClick={() => setFormData({...formData, colorName: c.name, colorHex: c.hex})}
                          className={`w-10 h-10 rounded-full border-4 transition-all relative ${formData.colorHex === c.hex ? 'border-blue-500 scale-110 shadow-lg' : 'border-white dark:border-slate-800 hover:scale-105'}`}
                          style={{ backgroundColor: c.hex }}
                       />
                    ))}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                       type="text" 
                       required
                       value={formData.colorName} 
                       onChange={e => setFormData({...formData, colorName: e.target.value})}
                       className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                       placeholder={t('colorNamePlaceholder')}
                    />
                    <div className="flex gap-2">
                       <div className="w-12 h-12 rounded-xl border border-slate-300 dark:border-slate-700 shrink-0" style={{ backgroundColor: formData.colorHex }} />
                       <input 
                          type="color" 
                          value={formData.colorHex} 
                          onChange={e => setFormData({...formData, colorHex: e.target.value})}
                          className="flex-1 h-12 bg-transparent cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 p-1"
                       />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                 <div>
                    <label className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 mb-1.5 block tracking-widest">{t('weightTotalLabel')}</label>
                    <input 
                       type="number" 
                       required
                       value={formData.weightTotal} 
                       onChange={e => setFormData({...formData, weightTotal: parseFloat(e.target.value)})}
                       className="w-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-lg font-bold"
                    />
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-1.5">
                       <label className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 block tracking-widest">{t('weightRemainingLabel')}</label>
                       <button type="button" onClick={() => setShowWeighHelper(true)} className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full hover:bg-blue-500 transition-colors uppercase">Weigh Helper</button>
                    </div>
                    <input 
                       type="number" 
                       required
                       value={formData.weightRemaining} 
                       onChange={e => setFormData({...formData, weightRemaining: parseFloat(e.target.value)})}
                       className="w-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-lg font-bold"
                    />
                 </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                 <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 block tracking-widest flex items-center gap-2">
                       <Thermometer size={14} className="text-red-500" /> Temperatures
                    </label>
                    <button type="button" onClick={handleAutoFillSettings} className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1 hover:underline">
                        <Sparkles size={10} /> AI Suggestion
                    </button>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nozzle</label>
                       <div className="relative">
                          <input 
                             type="number" 
                             value={formData.tempNozzle} 
                             onChange={e => setFormData({...formData, tempNozzle: parseInt(e.target.value)})}
                             className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                          />
                          <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">°C</span>
                       </div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Bed</label>
                       <div className="relative">
                          <input 
                             type="number" 
                             value={formData.tempBed} 
                             onChange={e => setFormData({...formData, tempBed: parseInt(e.target.value)})}
                             className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                          />
                          <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">°C</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-all">
                  <button 
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-colors"
                  >
                     <span className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                        {showAdvanced ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        Extra Details & Options
                     </span>
                     {(!formData.locationId && !formData.supplierId && !formData.shopUrl && !formData.notes) && (
                        <span className="text-[10px] font-bold text-slate-400">Optional</span>
                     )}
                  </button>

                  {showAdvanced && (
                    <div className="p-4 space-y-4 animate-fade-in border-t border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest">{t('location')}</label>
                              <div className="relative">
                                 <select 
                                    value={formData.locationId || ''} 
                                    onChange={e => setFormData({...formData, locationId: e.target.value || null})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                                 >
                                    <option value="">{t('none')}</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                 </select>
                                 <MapPin size={18} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                              </div>
                           </div>
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest">{t('supplier')}</label>
                              <div className="relative">
                                 <select 
                                    value={formData.supplierId || ''} 
                                    onChange={e => setFormData({...formData, supplierId: e.target.value || null})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                                 >
                                    <option value="">{t('none')}</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                 </select>
                                 <Truck size={18} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                              </div>
                           </div>
                        </div>

                        <div>
                           <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest">Short ID (Label Code)</label>
                           <div className="relative">
                              <input 
                                 type="text" 
                                 value={formData.shortId || ''} 
                                 onChange={e => setFormData({...formData, shortId: e.target.value.toUpperCase()})}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white pl-10"
                                 placeholder="e.g. #A1B2"
                                 maxLength={10}
                              />
                              <Hash size={18} className="absolute left-3 top-3.5 text-slate-400" />
                           </div>
                        </div>

                        <div>
                           <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest">{t('shopUrl')}</label>
                           <div className="relative">
                              <input 
                                 type="text" 
                                 value={formData.shopUrl || ''} 
                                 onChange={e => setFormData({...formData, shopUrl: e.target.value})}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white pl-10"
                                 placeholder="https://..."
                              />
                              <LinkIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
                              {formData.shopUrl && (
                                 <button 
                                    type="button" 
                                    onClick={handleOpenShop}
                                    className="absolute right-2 top-2 p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"
                                 >
                                    <ExternalLink size={16}/>
                                 </button>
                              )}
                           </div>
                        </div>

                        <div>
                           <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest">{t('notes')}</label>
                           <div className="relative">
                              <textarea 
                                 value={formData.notes || ''} 
                                 onChange={e => setFormData({...formData, notes: e.target.value})}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white min-h-[80px] pl-10 resize-none"
                                 placeholder="Additional information about this spool..."
                              />
                              <FileText size={18} className="absolute left-3 top-3.5 text-slate-400" />
                           </div>
                        </div>

                        {!formData.id && (
                           <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-800/30">
                              <label className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 mb-2 block tracking-widest flex items-center gap-2">
                                 <Hash size={14}/> Batch Addition
                              </label>
                              <div className="flex items-center gap-4">
                                 <input 
                                    type="range" 
                                    min="1" 
                                    max="10" 
                                    value={multiSpoolCount}
                                    onChange={(e) => setMultiSpoolCount(parseInt(e.target.value))}
                                    className="flex-1 accent-amber-500"
                                 />
                                 <span className="font-black text-xl w-12 text-center text-amber-600 dark:text-amber-400">{multiSpoolCount}x</span>
                              </div>
                              <p className="text-[10px] text-amber-600/70 mt-1">Quickly add multiple identical spools at once.</p>
                           </div>
                        )}
                    </div>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest">{t('price')}</label>
                    <div className="relative">
                        <input 
                           type="number" 
                           step="0.01"
                           value={formData.price || ''} 
                           onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white pl-8"
                        />
                        <Euro size={16} className="absolute left-3 top-3.5 text-slate-400" />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest">{t('date')}</label>
                    <input 
                       type="date" 
                       value={formData.purchaseDate} 
                       onChange={e => setFormData({...formData, purchaseDate: e.target.value})}
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                    />
                 </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
              >
                <Save size={24} />
                {formData.id ? t('saveChanges') : t('addToInventory')}
              </button>

           </form>
        </div>
      </div>

      {/* Weigh Helper Modal */}
      {showWeighHelper && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1221]/95 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
            <div className="bg-[#1e293b] border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-[#1e293b]">
                   <div className="flex items-center gap-3">
                      <div className="bg-blue-600 p-2 rounded-xl text-white">
                         <Weight size={20} />
                      </div>
                      <h2 className="text-xl font-bold text-white">{t('weighHelper')}</h2>
                   </div>
                   <button onClick={() => setShowWeighHelper(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest">{t('grossWeight')}</label>
                       <div className="relative">
                          <input 
                             autoFocus
                             type="number" 
                             value={grossWeight} 
                             onChange={e => setGrossWeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
                             className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 text-white text-3xl font-black text-center"
                             placeholder="0"
                          />
                          <span className="absolute right-4 top-5 text-slate-500 font-black">g</span>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('spoolType')}</label>
                          <div className="relative">
                             <input 
                               type="text" 
                               value={spoolSearch}
                               onChange={e => setSpoolSearch(e.target.value)}
                               className="bg-slate-800 border border-slate-700 rounded-lg p-1.5 pl-7 text-[10px] text-white outline-none w-32 focus:w-40 transition-all"
                               placeholder={t('search')}
                             />
                             <Search size={10} className="absolute left-2 top-2.5 text-slate-500" />
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                          {filteredSpools.length > 0 ? (
                             filteredSpools.map(spool => (
                                <button 
                                   key={spool.id}
                                   type="button"
                                   onClick={() => setSelectedSpoolId(spool.id)}
                                   className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedSpoolId === spool.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-[#1e293b] border-slate-700 text-slate-300 hover:border-slate-50'}`}
                                >
                                   <div className="flex flex-col text-left overflow-hidden pr-2">
                                      <span className="font-bold text-sm truncate">{spool.brand || spool.name}</span>
                                      {(spool.size || spool.spool_material) && (
                                         <span className={`text-[10px] uppercase font-bold opacity-60`}>
                                            {spool.size} • {spool.spool_material}
                                         </span>
                                      )}
                                   </div>
                                   <span className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 ${selectedSpoolId === spool.id ? 'bg-white/20' : 'bg-slate-800'}`}>{spool.weight}g</span>
                                </button>
                             ))
                          ) : (
                             <div className="p-8 text-center text-slate-500 text-sm italic">
                                No spools found in database.
                             </div>
                          )}
                       </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                       <div className="text-3xl font-black text-white text-center">
                          {selectedSpoolId && typeof grossWeight === 'number' ? Math.max(0, grossWeight - spoolWeights.find(s=>s.id===selectedSpoolId)!.weight) : '---'} g
                       </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700">
                    <button 
                       disabled={!selectedSpoolId || grossWeight === ''}
                       onClick={handleApplyTare}
                       className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                       {t('apply')}
                    </button>
                </div>
            </div>
         </div>
      )}

    </div>
  );
};