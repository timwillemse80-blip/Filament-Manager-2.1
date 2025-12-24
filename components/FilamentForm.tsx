
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Filament, FilamentMaterial, Location, Supplier } from '../types';
import { analyzeSpoolImage, suggestSettings } from '../services/geminiService';
import { X, Save, RefreshCw, Link as LinkIcon, Euro, Layers, Check, Edit2, Scale, Plus, Zap, ChevronDown, MapPin, Truck, Thermometer, FileText, ExternalLink, Disc, Sparkles, Camera, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../services/supabase';
import { COMMON_BRANDS, COMMON_COLORS } from '../constants';
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

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

export const FilamentForm: React.FC<FilamentFormProps> = ({ 
  initialData, locations, suppliers, existingBrands, onSave, onSaveLocation, onSaveSupplier, onCancel
}) => {
  const { t, tColor } = useLanguage();
  
  // Local state for free-text inputs that will be converted to IDs during save
  const [locationName, setLocationName] = useState(() => {
    return locations.find(l => l.id === initialData?.locationId)?.name || '';
  });
  const [supplierName, setSupplierName] = useState(() => {
    return suppliers.find(s => s.id === initialData?.supplierId)?.name || '';
  });

  const [formData, setFormData] = useState<Partial<Filament>>(initialData || {
    brand: '',
    material: FilamentMaterial.PLA,
    colorName: 'Black',
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
  const [grossWeight, setGrossWeight] = useState<number | ''>('');
  const [selectedSpoolType, setSelectedSpoolType] = useState<string>('Generic (Plastic Normal)');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiScanning, setIsAiScanning] = useState(false);

  const spoolWeights: Record<string, number> = {
    "Bambu Lab (Reusable)": 250,
    "Generic (Plastic Normal)": 230,
    "Generic (Cardboard)": 140,
    "Generic (MasterSpool/Refill)": 0
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalLocationId = initialData?.locationId || null;
    let finalSupplierId = initialData?.supplierId || null;

    // 1. Handle Location creation/mapping
    if (locationName.trim()) {
      const existingLoc = locations.find(l => l.name.toLowerCase() === locationName.trim().toLowerCase());
      if (existingLoc) {
        finalLocationId = existingLoc.id;
      } else {
        // Create new location
        const newLoc: Location = { id: crypto.randomUUID(), name: locationName.trim() };
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('locations').insert({ ...newLoc, user_id: user.id });
          onSaveLocation(newLoc);
          finalLocationId = newLoc.id;
        }
      }
    } else {
      finalLocationId = null;
    }

    // 2. Handle Supplier creation/mapping
    if (supplierName.trim()) {
      const existingSup = suppliers.find(s => s.name.toLowerCase() === supplierName.trim().toLowerCase());
      if (existingSup) {
        finalSupplierId = existingSup.id;
      } else {
        // Create new supplier
        const newSup: Supplier = { id: crypto.randomUUID(), name: supplierName.trim() };
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('suppliers').insert({ ...newSup, user_id: user.id });
          onSaveSupplier(newSup);
          finalSupplierId = newSup.id;
        }
      }
    } else {
      finalSupplierId = null;
    }

    // 3. Construct final filament object
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
    if (grossWeight !== '') {
      const tare = spoolWeights[selectedSpoolType] || 0;
      const net = Math.max(0, grossWeight - tare);
      setFormData({ ...formData, weightRemaining: net });
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
    setIsAiScanning(true);
    try {
      let base64Image = '';
      
      if (Capacitor.isNativePlatform()) {
        const image = await CapacitorCamera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
          width: 1024
        });
        base64Image = image.base64String || '';
      } else {
        // Simple file upload fallback for web testing if camera isn't direct
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        base64Image = await new Promise((resolve) => {
          input.onchange = (e: any) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
          };
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
    } catch (error) {
      console.error("AI Scan failed:", error);
      alert(t('aiError'));
    } finally {
      setIsAiScanning(false);
    }
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

          {/* Row 1: Brand & Material */}
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
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
                <datalist id="brands-list">
                  {COMMON_BRANDS.map(b => <option key={b} value={b} />)}
                </datalist>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('material')}</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  required 
                  value={formData.material} 
                  onChange={e => setFormData({...formData, material: e.target.value})}
                  className="flex-1 bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                  type="button" 
                  onClick={handleAutoSettings}
                  disabled={isAnalyzing}
                  className="p-3 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-colors border border-slate-700"
                >
                  <RefreshCw size={20} className={isAnalyzing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Color */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('color')}</label>
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

          {/* Row 3: Weights */}
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

          {/* Row 4: Temperatures */}
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
                <span className="absolute right-3 top-3 text-slate-500">°C</span>
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
                <span className="absolute right-3 top-3 text-slate-500">°C</span>
              </div>
            </div>
          </div>

          {/* Row 5: Location & Supplier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('location')}</label>
              <div className="relative">
                <input 
                  list="locations-list"
                  type="text" 
                  value={locationName} 
                  onChange={e => setLocationName(e.target.value)}
                  placeholder="bv. Stelling A"
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
                <datalist id="locations-list">
                  {locations.map(l => <option key={l.id} value={l.name} />)}
                </datalist>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('supplier')}</label>
              <div className="relative">
                <input 
                  list="suppliers-list"
                  type="text" 
                  value={supplierName} 
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="bv. Amazon"
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
                <datalist id="suppliers-list">
                  {suppliers.map(s => <option key={s.id} value={s.name} />)}
                </datalist>
              </div>
            </div>
          </div>

          {/* Row 6: Price & URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('price')} (€)</label>
              <div className="relative flex items-center bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden pr-3">
                <span className="p-3 text-slate-500">€</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.price || ''} 
                  onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                  className="flex-1 bg-transparent py-3 text-white outline-none"
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('shopUrl')}</label>
              <div className="flex gap-2">
                <div className="flex-1 relative flex items-center bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden pr-3">
                  <div className="p-3"><LinkIcon size={16} className="text-slate-500"/></div>
                  <input 
                    type="text" 
                    value={formData.shopUrl || ''} 
                    onChange={e => setFormData({...formData, shopUrl: e.target.value})}
                    className="flex-1 bg-transparent py-3 text-white outline-none text-xs"
                    placeholder="https://..."
                  />
                </div>
                {formData.shopUrl && (
                  <button 
                    type="button" 
                    onClick={() => window.open(formData.shopUrl, '_blank')}
                    className="p-3 bg-slate-800 text-blue-400 rounded-lg hover:text-blue-300 transition-colors border border-slate-700"
                  >
                    <ExternalLink size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('notes')}</label>
            <textarea 
              value={formData.notes || ''} 
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-[#1e293b] border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-colors min-h-[120px] resize-none"
            />
          </div>

          {/* Submit Button */}
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

      {/* Weigh Helper Modal */}
      {showWeighHelper && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#0f172a] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col">
               <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3"><Scale size={24} className="text-blue-500" /> {t('weighHelper')}</h3>
                  <button onClick={() => setShowWeighHelper(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
               </div>
               <div className="p-6 space-y-6">
                  <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20">
                     <label className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2 block">{t('grossWeight')}</label>
                     <div className="flex items-center gap-4">
                        <input type="number" autoFocus value={grossWeight} onChange={e => setGrossWeight(e.target.value === '' ? '' : parseFloat(e.target.value))} className="flex-1 bg-[#1e293b] border-2 border-blue-500/30 rounded-xl p-4 text-2xl font-black text-white outline-none focus:border-blue-500" />
                        <span className="text-xl font-bold text-slate-500">gram</span>
                     </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">{t('spoolType')}</label>
                    <select 
                      value={selectedSpoolType} 
                      onChange={e => setSelectedSpoolType(e.target.value)} 
                      className="w-full bg-[#1e293b] border border-slate-700 rounded-xl p-3 outline-none text-white appearance-none"
                    >
                      {Object.keys(spoolWeights).map(k => <option key={k} value={k}>{k} ({spoolWeights[k]}g)</option>)}
                    </select>
                  </div>
                  <button onClick={handleApplyWeight} disabled={grossWeight === ''} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg active:scale-[0.98] disabled:opacity-50">
                    {t('apply')}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
