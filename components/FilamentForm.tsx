
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Filament, FilamentMaterial, Location, Supplier } from '../types';
import { analyzeSpoolImage, suggestSettings } from '../services/geminiService';
import { X, Save, RefreshCw, Link as LinkIcon, Euro, Layers, Check, Edit2, Scale, Plus, Zap, ChevronDown, ChevronUp, MapPin, Truck, Thermometer, FileText, ExternalLink, Disc, Sparkles, Camera, Loader2, AlertCircle, Construction, Palette, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../services/supabase';
import { COMMON_BRANDS, COMMON_MATERIALS, QUICK_COLORS } from '../constants';
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

interface FilamentFormProps {
  initialData?: Filament;
  locations: Location[];
  suppliers: Supplier[];
  existingBrands?: string[];
  globalBrands?: string[];
  globalMaterials?: string[];
  spoolWeights?: { id: number, name: string, weight: number }[];
  onSave: (filament: Filament | Filament[]) => void;
  onSaveLocation: (loc: Location) => void;
  onSaveSupplier: (sup: Supplier) => void;
  onCancel: () => void;
  initialShowLabel?: boolean;
  isAdmin?: boolean;
}

export const FilamentForm: React.FC<FilamentFormProps> = ({ 
  initialData, locations, suppliers, existingBrands, globalBrands = [], globalMaterials = [], spoolWeights = [], onSave, onSaveLocation, onSaveSupplier, onCancel, isAdmin = false
}) => {
  const { t, tColor } = useLanguage();
  
  const [locationName, setLocationName] = useState(() => {
    return locations.find(l => l.id === initialData?.locationId)?.name || '';
  });
  const [supplierName, setSupplierName] = useState(() => {
    return suppliers.find(s => s.id === initialData?.supplierId)?.name || '';
  });

  const [formData, setFormData] = useState<Partial<Filament>>(initialData || {
    brand: '',
    material: 'PLA',
    colorName: 'Zwart',
    colorHex: '#000000',
    weightTotal: 1000,
    weightRemaining: 1000,
    tempNozzle: 210,
    tempBed: 60,
    notes: '',
    shopUrl: '',
    price: undefined
  });

  const [showWeighHelper, setShowWeighHelper] = useState(false);
  const [showExtraFields, setShowExtraFields] = useState(!!initialData?.locationId || !!initialData?.supplierId || !!initialData?.notes || !!initialData?.shopUrl);
  
  // Weight Helper States
  const [grossWeight, setGrossWeight] = useState<number | ''>('');
  const [spoolSearch, setSpoolSearch] = useState('');
  const [selectedSpoolId, setSelectedSpoolId] = useState<number | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [showAiMaintenance, setShowAiMaintenance] = useState(false);

  const brandsList = useMemo(() => {
    const combined = Array.from(new Set([...COMMON_BRANDS, ...globalBrands]));
    return combined.sort((a, b) => a.localeCompare(b));
  }, [globalBrands]);

  const materialsList = useMemo(() => {
    const list = globalMaterials.length > 0 ? globalMaterials : COMMON_MATERIALS;
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [globalMaterials]);

  // Spool Database Filter
  const filteredSpools = useMemo(() => {
    if (!spoolSearch) return spoolWeights;
    return spoolWeights.filter(s => s.name.toLowerCase().includes(spoolSearch.toLowerCase()));
  }, [spoolWeights, spoolSearch]);

  const selectedSpool = useMemo(() => 
    spoolWeights.find(s => s.id === selectedSpoolId), [spoolWeights, selectedSpoolId]
  );

  const calculatedNet = useMemo(() => {
     if (grossWeight === '' || !selectedSpool) return null;
     return Math.max(0, grossWeight - selectedSpool.weight);
  }, [grossWeight, selectedSpool]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalLocationId = formData.locationId || null;
    let finalSupplierId = formData.supplierId || null;

    const finalFilament: Filament = {
      ...formData as Filament,
      id: initialData?.id || crypto.randomUUID(),
      purchaseDate: initialData?.purchaseDate || new Date().toISOString(),
      locationId: finalLocationId,
      supplierId: finalSupplierId,
      weightTotal: Number(formData.weightTotal),
      weightRemaining: Number(formData.weightRemaining),
      tempNozzle: Number(formData.tempNozzle),
      tempBed: Number(formData.tempBed),
      price: formData.price ? Number(formData.price) : undefined
    };

    onSave(finalFilament);
  };

  const handleApplyWeight = () => {
    if (calculatedNet !== null) {
      setFormData({ ...formData, weightRemaining: Number(calculatedNet.toFixed(1)) });
      setShowWeighHelper(false);
    }
  };

  const handleAutoSettings = async () => {
    if (!formData.brand || !formData.material) return;
    setIsAnalyzing(true);
    try {
      const res = await suggestSettings(formData.brand, formData.material);
      setFormData(prev => ({ 
        ...prev, 
        tempNozzle: res.tempNozzle || prev.tempNozzle, 
        tempBed: res.tempBed || prev.tempBed 
      }));
    } catch (e) {} finally { setIsAnalyzing(false); }
  };

  const handleAiScan = async () => {
    if (!process.env.API_KEY || process.env.API_KEY.length < 5) {
       alert("AI sleutel is niet geconfigureerd. Neem contact op met de beheerder.");
       return;
    }

    const IS_MAINTENANCE = false;
    if (IS_MAINTENANCE && !isAdmin) {
      setShowAiMaintenance(true);
      return;
    }

    setIsAiScanning(true);
    try {
      let base64Image = '';
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await CapacitorCamera.checkPermissions();
          if (status.camera !== 'granted' && status.camera !== 'limited') {
             const requestStatus = await CapacitorCamera.requestPermissions();
             if (requestStatus.camera !== 'granted' && requestStatus.camera !== 'limited') {
                alert("Cameratoegang is vereist voor AI-scannen.");
                setIsAiScanning(false);
                return;
             }
          }

          const image = await CapacitorCamera.getPhoto({
            quality: 85,
            allowEditing: false,
            resultType: CameraResultType.Base64,
            source: CameraSource.Camera,
            width: 1024
          });
          base64Image = image.base64String || '';
        } catch (e: any) {
          if (e.message?.toLowerCase().includes('cancelled')) {
             setIsAiScanning(false);
             return;
          }
          throw e;
        }
      } 
      else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        base64Image = await new Promise((resolve, reject) => {
          input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (!file) {
              resolve('');
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
               const res = reader.result as string;
               resolve(res.split(',')[1]);
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          };
          
          window.addEventListener('focus', () => {
             setTimeout(() => { if (!input.files?.length) resolve(''); }, 1000);
          }, { once: true });

          input.click();
        });
      }

      if (!base64Image) {
        setIsAiScanning(false);
        return;
      }

      const suggestion = await analyzeSpoolImage(base64Image);
      
      if (suggestion) {
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
      }
    } catch (error: any) {
      console.error("AI Scan failed:", error);
      alert(t('aiError'));
    } finally {
      setIsAiScanning(false);
    }
  };

  const selectQuickColor = (color: { name: string, hex: string }) => {
    setFormData({ ...formData, colorName: color.name, colorHex: color.hex });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-[#0f172a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-800">
        
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white">
            {initialData ? t('formEditTitle') : t('formNewTitle')}
          </h2>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto scrollbar-hide max-h-[80vh]">
          
          {/* AI Scan Action */}
          {!initialData && (
             <button 
                type="button"
                onClick={handleAiScan}
                disabled={isAiScanning}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden group"
             >
                {isAiScanning ? (
                   <>
                      <Loader2 className="animate-spin" size={24} />
                      <span>{t('aiAnalyzing')}</span>
                      <div className="absolute inset-0 bg-white/10 animate-pulse" />
                   </>
                ) : (
                   <>
                      <Sparkles className="text-amber-300 group-hover:rotate-12 transition-transform" size={24} />
                      <span>{t('aiScanLabel')}</span>
                      <Camera className="absolute right-4 opacity-20" size={32} />
                   </>
                )}
             </button>
          )}

          {/* Merk & Materiaal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('brand')}</label>
              <div className="relative">
                <input 
                  list="brands-list"
                  type="text" 
                  required 
                  value={formData.brand} 
                  onChange={e => setFormData({...formData, brand: e.target.value})}
                  placeholder="bv. Bambu Lab, eSun..."
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
                <datalist id="brands-list">
                  {brandsList.map(b => <option key={b} value={b} />)}
                </datalist>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('material')}</label>
              <div className="flex gap-2">
                <select 
                  value={formData.material} 
                  onChange={e => setFormData({...formData, material: e.target.value})}
                  className="flex-1 bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors appearance-none"
                >
                  {materialsList.map(m => <option key={m} value={m}>{m}</option>)}
                  <option value="Anders">Anders...</option>
                </select>
                <button 
                  type="button" 
                  onClick={handleAutoSettings}
                  disabled={isAnalyzing}
                  className="p-3 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-colors border border-slate-700"
                  title="Aanbevolen temperaturen ophalen"
                >
                  <RefreshCw size={20} className={isAnalyzing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          </div>

          {/* Kleur Selectie */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <Palette size={14} /> {t('color')}
            </label>
            
            {/* Quick Palette */}
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 mb-2">
              {QUICK_COLORS.map(color => (
                <button
                  key={color.hex + color.name}
                  type="button"
                  onClick={() => selectQuickColor(color)}
                  className={`aspect-square rounded-lg border-2 transition-all transform active:scale-90 ${formData.colorHex === color.hex ? 'border-blue-500 scale-110 shadow-lg z-10' : 'border-slate-800 hover:border-slate-600'}`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <div className="flex-1 relative flex items-center bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden pr-3">
                <div className="p-3">
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: formData.colorHex }} />
                </div>
                <input 
                  type="text" 
                  required 
                  value={formData.colorName} 
                  onChange={e => setFormData({...formData, colorName: e.target.value})}
                  className="flex-1 bg-transparent py-3 text-white outline-none"
                  placeholder="Kleurnaam..."
                />
              </div>
              <div className="relative group">
                <input 
                  type="color" 
                  value={formData.colorHex} 
                  onChange={e => setFormData({...formData, colorHex: e.target.value})}
                  className="w-14 h-full rounded-lg border border-slate-700 p-1 bg-[#1e293b] cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('weightTotalLabel')}</label>
              <input 
                type="number" 
                required 
                value={formData.weightTotal} 
                onChange={e => setFormData({...formData, weightTotal: parseFloat(e.target.value)})}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('weightRemainingLabel')}</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  step="0.1"
                  required 
                  value={formData.weightRemaining} 
                  onChange={e => setFormData({...formData, weightRemaining: parseFloat(e.target.value)})}
                  className="flex-1 bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                  type="button" 
                  onClick={() => setShowWeighHelper(true)}
                  className="p-3 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-colors border border-slate-700"
                >
                  <Scale size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Temperaturen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('tempNozzle')}</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.tempNozzle} 
                  onChange={e => setFormData({...formData, tempNozzle: parseInt(e.target.value)})}
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
                <span className="absolute right-3 top-3 text-slate-500 font-bold">°C</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('tempBed')}</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.tempBed} 
                  onChange={e => setFormData({...formData, tempBed: parseInt(e.target.value)})}
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
                <span className="absolute right-3 top-3 text-slate-500 font-bold">°C</span>
              </div>
            </div>
          </div>

          {/* Meer Opties - Accordion */}
          <div className="pt-2">
             <button 
                type="button"
                onClick={() => setShowExtraFields(!showExtraFields)}
                className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors group"
             >
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                      {showExtraFields ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                   </div>
                   <span className="text-sm font-bold text-slate-300 group-hover:text-white">Meer Opties</span>
                </div>
                <div className="flex gap-2">
                   {!formData.locationId && <MapPin size={14} className="text-slate-500" />}
                   {!formData.supplierId && <Truck size={14} className="text-slate-500" />}
                   {formData.shopUrl && <LinkIcon size={14} className="text-blue-500" />}
                </div>
             </button>

             {showExtraFields && (
                <div className="mt-4 p-5 bg-slate-800/30 rounded-2xl border border-slate-700/50 space-y-6 animate-fade-in">
                   
                   {/* Locatie & Leverancier */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                           <MapPin size={10} /> {t('location')}
                        </label>
                        <select 
                           value={formData.locationId || ''} 
                           onChange={e => setFormData({...formData, locationId: e.target.value || undefined})}
                           className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                        >
                           <option value="">-- {t('none')} --</option>
                           {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                           <Truck size={10} /> {t('supplier')}
                        </label>
                        <select 
                           value={formData.supplierId || ''} 
                           onChange={e => setFormData({...formData, supplierId: e.target.value || undefined})}
                           className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                        >
                           <option value="">-- {t('none')} --</option>
                           {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                   </div>

                   {/* Prijs & Shop URL */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <Euro size={10} /> {t('price')}
                         </label>
                         <div className="relative">
                            <input 
                               type="number" 
                               step="0.01"
                               value={formData.price || ''} 
                               onChange={e => setFormData({...formData, price: e.target.value === '' ? undefined : parseFloat(e.target.value)})}
                               placeholder="0.00"
                               className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 pl-8"
                            />
                            <span className="absolute left-3 top-3.5 text-slate-500 font-bold text-sm">€</span>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <LinkIcon size={10} /> {t('shopUrl')}
                         </label>
                         <input 
                            type="text" 
                            value={formData.shopUrl || ''} 
                            onChange={e => setFormData({...formData, shopUrl: e.target.value})}
                            placeholder="https://shop.com/..."
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500"
                         />
                      </div>
                   </div>

                   {/* Notities */}
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                         <FileText size={10} /> {t('notes')}
                      </label>
                      <textarea 
                         value={formData.notes || ''} 
                         onChange={e => setFormData({...formData, notes: e.target.value})}
                         placeholder="bv. Batch nummer, speciale instellingen..."
                         className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 h-24 resize-none"
                      />
                   </div>
                </div>
             )}
          </div>

          <div className="pt-4 sticky bottom-0 bg-[#0f172a] pb-2">
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Save size={20} /> {initialData ? t('saveChanges') : t('addToInventory')}
            </button>
          </div>
        </form>
      </div>

      {showAiMaintenance && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Construction size={40} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{t('aiMaintenanceTitle')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              {t('aiMaintenanceDesc')}
            </p>
            <button 
              onClick={() => setShowAiMaintenance(false)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg transition-all transform active:scale-[0.98]"
            >
              {t('aiMaintenanceButton')}
            </button>
          </div>
        </div>
      )}

      {/* --- REIMAGINED WEIGH HELPER WITH SPOOL DB --- */}
      {showWeighHelper && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#0f172a] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3"><Scale size={24} className="text-blue-500" /> {t('weighHelper')}</h3>
                  <button onClick={() => setShowWeighHelper(false)} className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
               </div>
               
               <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide">
                  {/* Brutogewicht Invoer */}
                  <div className="bg-blue-500/10 p-6 rounded-2xl border border-blue-500/20">
                     <label className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2 block">{t('grossWeight')} (Spoel + Filament)</label>
                     <div className="flex items-center gap-4">
                        <input 
                           type="number" 
                           autoFocus 
                           value={grossWeight} 
                           onChange={e => setGrossWeight(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                           className="flex-1 bg-[#1e293b] border-2 border-blue-500/30 rounded-xl p-4 text-3xl font-black text-white outline-none focus:border-blue-500 shadow-inner" 
                           placeholder="0"
                        />
                        <span className="text-xl font-bold text-slate-500">gram</span>
                     </div>
                  </div>
                  
                  {/* Spool DB Search & Picker */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Disc size={12}/> {t('spoolType')} (Tare Gewicht)
                    </label>
                    
                    <div className="relative">
                       <input 
                          type="text"
                          value={spoolSearch}
                          onChange={e => setSpoolSearch(e.target.value)}
                          placeholder="Zoek merk of type spoel..."
                          className="w-full bg-[#1e293b] border border-slate-700 rounded-xl p-3 pl-10 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                       />
                       <Search size={16} className="absolute left-3 top-3.5 text-slate-500" />
                    </div>

                    <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 scrollbar-hide">
                       {filteredSpools.length > 0 ? (
                          filteredSpools.map(spool => (
                             <button 
                                key={spool.id}
                                type="button"
                                onClick={() => setSelectedSpoolId(spool.id)}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedSpoolId === spool.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-[#1e293b] border-slate-700 text-slate-300 hover:border-slate-500'}`}
                             >
                                <span className="font-bold text-sm truncate pr-2">{spool.name}</span>
                                <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${selectedSpoolId === spool.id ? 'bg-white/20' : 'bg-slate-800'}`}>{spool.weight}g</span>
                             </button>
                          ))
                       ) : (
                          <div className="p-8 text-center text-slate-500 text-sm italic">
                             Geen spoelen gevonden in de database.
                          </div>
                       )}
                    </div>
                  </div>
               </div>

               {/* Footer met resultaat */}
               <div className="p-6 bg-slate-900/80 border-t border-slate-800">
                  {calculatedNet !== null ? (
                     <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center px-2">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Restant Filament</span>
                              <span className="text-3xl font-black text-green-400">{calculatedNet.toFixed(1)} <span className="text-sm">gram</span></span>
                           </div>
                           <div className="text-right flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Correctie</span>
                              <span className="text-lg font-bold text-slate-400">-{selectedSpool?.weight}g</span>
                           </div>
                        </div>
                        <button onClick={handleApplyWeight} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                          <Check size={20} /> {t('apply')}
                        </button>
                     </div>
                  ) : (
                     <div className="text-center p-4 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                        <p className="text-slate-500 text-sm">Vul een gewicht in en kies een spoel om te berekenen.</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
