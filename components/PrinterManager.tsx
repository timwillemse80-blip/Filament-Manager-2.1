import React, { useState, useMemo } from 'react';
import { Printer, Filament } from '../types';
import { Plus, Edit2, Trash2, Printer as PrinterIcon, X, Save, CircleDashed, ChevronRight, Search, RefreshCw, Disc, Coins, Hourglass, Crown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PrinterManagerProps {
  printers: Printer[];
  filaments: Filament[];
  onSave: (printer: Printer) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
  onLimitReached?: () => void;
}

// --- Printer Database ---
const PRINTER_PRESETS: Record<string, string[]> = {
  "Bambu Lab": ["X1 Carbon", "X1E", "P1S", "P1P", "A1", "A1 Mini"],
  "Creality": [
    "K1 Max", "K1C", "K1", "K1 SE", 
    "Ender 3 V3", "Ender 3 V3 Plus", "Ender 3 V3 KE", "Ender 3 V3 SE", 
    "Ender 3 S1 Pro", "Ender 3 S1 Plus",
    "CR-10 SE", "CR-M4", "CR-10 Smart Pro", 
    "Halot-Mage Pro", "Halot-Mage S", "Sermoon D3"
  ],
  "Prusa Research": ["MK4S", "MK4", "MK3S+", "XL (5 Toolhead)", "XL (2 Toolhead)", "XL (1 Toolhead)", "Mini+", "SL1S Speed"],
  "Anycubic": [
    "Kobra 3 Combo", "Kobra 2 Pro", "Kobra 2 Max", "Kobra 2 Plus", "Kobra 2 Neo", 
    "Photon Mono M5s", "Photon Mono M5s Pro", "Photon Mono X 6Ks", "Vyper"
  ],
  "Elegoo": [
    "Neptune 4 Max", "Neptune 4 Plus", "Neptune 4 Pro", "Neptune 4", 
    "Neptune 3 Pro", "Neptune 3 Plus", "Neptune 3 Max",
    "Saturn 4 Ultra", "Saturn 3 Ultra", "Mars 5 Ultra", "Mars 4 Max"
  ],
  "Flashforge": ["Adventurer 5M Pro", "Adventurer 5M", "Guider 3", "Guider 3 Ultra", "Creator 4", "Finder 3"],
  "Qidi Tech": ["Q1 Pro", "X-Max 3", "X-Plus 3", "X-Smart 3"],
  "Sovol": ["SV08", "SV07 Plus", "SV07", "SV06 Plus", "SV06", "SV04 (IDEX)"],
  "Voron": ["Voron 2.4", "Voron Trident", "Voron 0.2", "Switchwire"],
  "Klipper (Generic)": ["Custom Build", "Converted Printer"],
  "Formlabs": ["Form 4", "Form 4B", "Form 3+", "Form 3L"],
  "UltiMaker": ["S7", "S5", "S3", "2+ Connect", "Method XL", "Method X"],
  "Phrozen": ["Sonic Mega 8K S", "Sonic Mighty 8K", "Sonic Mini 8K S"],
  "RatRig": ["V-Core 4", "V-Core 3.1", "V-Minion"],
  "Snapmaker": ["J1s", "Artisan", "2.0 A350T"]
};

export const PrinterManager: React.FC<PrinterManagerProps> = ({ printers, filaments, onSave, onDelete, isAdmin, onLimitReached }) => {
  const { t } = useLanguage();
  const [editingPrinter, setEditingPrinter] = useState<Partial<Printer> | null>(null);
  const [selectingSlot, setSelectingSlot] = useState<{ printerId: string, slotIndex: number } | null>(null);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPrinter) {
      let slots = editingPrinter.amsSlots || [];
      const amsCount = editingPrinter.amsCount || 1;
      const requiredSlots = editingPrinter.hasAMS ? (amsCount * 4) : 1;

      if (slots.length !== requiredSlots) {
          const newSlots = Array(requiredSlots).fill(null).map((_, i) => {
              if (i < slots.length) return slots[i];
              return { slotNumber: i + 1, filamentId: null };
          });
          slots = newSlots;
      }

      const brand = editingPrinter.brand || t('unknown');
      const model = editingPrinter.model || '';
      const finalName = editingPrinter.name?.trim() || `${brand} ${model}`;

      onSave({
        id: editingPrinter.id || crypto.randomUUID(),
        name: finalName,
        brand: brand,
        model: model,
        hasAMS: !!editingPrinter.hasAMS,
        amsCount: amsCount,
        amsSlots: slots,
        powerWatts: editingPrinter.powerWatts,
        purchasePrice: editingPrinter.purchasePrice,
        lifespanHours: editingPrinter.lifespanHours
      });
      setEditingPrinter(null);
      setIsCustomBrand(false);
      setIsCustomModel(false);
    }
  };

  const handleFilamentSelect = (filamentId: string) => {
    if (!selectingSlot) return;
    
    const printer = printers.find(p => p.id === selectingSlot.printerId);
    if (!printer) return;

    let newSlots = [...(printer.amsSlots || [])];
    if (selectingSlot.slotIndex >= newSlots.length) {
       const requiredLength = selectingSlot.slotIndex + 1;
       const expansion = Array(requiredLength - newSlots.length).fill(null).map((_, i) => ({ 
           slotNumber: newSlots.length + i + 1, 
           filamentId: null 
       }));
       newSlots = [...newSlots, ...expansion];
    }

    newSlots[selectingSlot.slotIndex] = {
       ...newSlots[selectingSlot.slotIndex],
       filamentId: filamentId
    };

    onSave({ ...printer, amsSlots: newSlots });
    setSelectingSlot(null);
  };

  const clearSlot = (printerId: string, slotIndex: number) => {
    const printer = printers.find(p => p.id === printerId);
    if (!printer) return;
    const newSlots = [...(printer.amsSlots || [])];
    if (newSlots[slotIndex]) {
        newSlots[slotIndex] = { ...newSlots[slotIndex], filamentId: null };
        onSave({ ...printer, amsSlots: newSlots });
    }
  };

  const handleAddClick = () => {
     if (!isAdmin && printers.length >= 2) {
        if (onLimitReached) onLimitReached();
        return;
     }

     setEditingPrinter({ name: '', brand: '', model: '', hasAMS: true, amsCount: 1, amsSlots: [], powerWatts: 300, purchasePrice: 0, lifespanHours: 20000 });
     setIsCustomBrand(false);
     setIsCustomModel(false);
  };

  const FilamentSelector = ({ filaments, onSelect, onClose }: { filaments: Filament[], onSelect: (id: string) => void, onClose: () => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { tColor } = useLanguage();

    const filtered = useMemo(() => {
      if (!searchTerm) return filaments;
      const lower = searchTerm.toLowerCase();
      return filaments.filter(f => 
        (f.shortId && f.shortId.toLowerCase().includes(lower)) ||
        f.brand.toLowerCase().includes(lower) ||
        f.colorName.toLowerCase().includes(lower) ||
        f.material.toLowerCase().includes(lower)
      );
    }, [filaments, searchTerm]);

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
         <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
               <Search className="text-slate-400" size={20} />
               <input 
                 autoFocus
                 type="text" 
                 className="flex-1 bg-transparent outline-none dark:text-white"
                 placeholder={t('searchPlaceholder')}
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
               <button onClick={onClose}><X className="text-slate-500" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
               {filtered.map(f => (
                  <div 
                     key={f.id} 
                     onClick={() => onSelect(f.id)}
                     className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                     <div className="w-8 h-8 rounded-full border border-slate-200 shadow-sm flex-shrink-0" style={{ backgroundColor: f.colorHex }} />
                     <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 dark:text-white truncate">
                           {f.brand} {tColor(f.colorName)}
                        </div>
                        <div className="text-xs text-slate-500">
                           {f.material} • {f.weightRemaining}g
                           {f.shortId && <span className="ml-1 font-mono text-blue-500">#{f.shortId}</span>}
                        </div>
                     </div>
                     <ChevronRight size={16} className="text-slate-300" />
                  </div>
               ))}
               {filtered.length === 0 && <div className="text-center p-4 text-slate-400">{t('none')}</div>}
            </div>
         </div>
      </div>
    );
  };

  const renderSlot = (printer: Printer, slotIndex: number, label?: string) => {
      const slots = printer.amsSlots || [];
      const slot = slots[slotIndex] || { slotNumber: slotIndex + 1, filamentId: null };
      const loadedFilament = slot.filamentId ? filaments.find(f => f.id === slot.filamentId) : null;

      return (
        <div key={slotIndex} className="flex flex-col gap-1 relative w-full">
           {label && <span className="text-[10px] text-slate-400 font-bold uppercase text-center mb-1 block">{label}</span>}
           <div 
             onClick={() => setSelectingSlot({ printerId: printer.id, slotIndex: slotIndex })}
             className={`
               aspect-[3/4] rounded-lg border-2 flex flex-col items-center justify-center p-1 cursor-pointer transition-all relative overflow-hidden group shadow-sm w-full
               ${loadedFilament ? 'border-transparent' : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800'}
             `}
             style={loadedFilament ? { backgroundColor: loadedFilament.colorHex } : undefined}
           >
              {loadedFilament ? (
                 <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => { e.stopPropagation(); clearSlot(printer.id, slotIndex); }}>
                       <div className="bg-black/40 hover:bg-red-500 text-white rounded-full p-1 backdrop-blur-sm transition-colors"><X size={10}/></div>
                    </div>
                    <div className="mt-auto relative z-10 text-center w-full pb-1">
                       <span className="text-[10px] font-bold text-white block truncate px-1 shadow-black drop-shadow-md">{loadedFilament.brand}</span>
                       <span className="text-[9px] text-white/90 block shadow-black drop-shadow-md">{loadedFilament.material}</span>
                    </div>
                 </>
              ) : (
                 <div className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400">
                    <Plus size={20} />
                 </div>
              )}
           </div>
        </div>
      );
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      <div className="flex justify-between items-center">
         <h3 className="text-xl font-bold dark:text-white text-slate-800 flex items-center gap-2">
            <PrinterIcon size={24} /> {t('printers')}
         </h3>
         <button 
            onClick={handleAddClick} 
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-transform active:scale-95"
         >
            <Plus size={20} /> {t('addPrinter')}
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {printers.map(printer => (
            <div key={printer.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
               <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                     <div className="bg-white dark:bg-slate-700 p-2 rounded-lg text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-600">
                        <PrinterIcon size={24} />
                     </div>
                     <div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">{printer.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{printer.brand} {printer.model}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-1">
                     <button onClick={() => { setEditingPrinter(printer); setIsCustomBrand(false); setIsCustomModel(false); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><Edit2 size={18}/></button>
                     <button onClick={() => onDelete(printer.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18}/></button>
                  </div>
               </div>

               <div className="p-4 bg-slate-50 dark:bg-slate-900/30 flex-1">
                  {printer.hasAMS ? (
                     <div className="space-y-4">
                        {Array.from({ length: printer.amsCount || 1 }).map((_, unitIndex) => (
                           <div key={unitIndex}>
                              <div className="flex items-center gap-2 mb-2">
                                 <CircleDashed size={14} className="text-slate-400" />
                                 <span className="text-xs font-bold text-slate-500 uppercase">AMS Unit {unitIndex + 1}</span>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                 {[0, 1, 2, 3].map(offset => renderSlot(printer, (unitIndex * 4) + offset, `Slot ${offset + 1}`))}
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <Disc size={14} className="text-slate-400" />
                           <span className="text-xs font-bold text-slate-500 uppercase">{t('activeFilament')}</span>
                        </div>
                        <div className="max-w-[100px]">
                           {renderSlot(printer, 0)}
                        </div>
                     </div>
                  )}
               </div>
            </div>
         ))}
      </div>

      {editingPrinter && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <h2 className="text-xl font-bold dark:text-white text-slate-800">{editingPrinter.id ? t('editPrinter') : t('addPrinter')}</h2>
                  <button onClick={() => setEditingPrinter(null)} className="text-slate-400 hover:text-white"><X size={24}/></button>
               </div>
               
               <div className="p-6 overflow-y-auto space-y-4">
                  <form id="printerForm" onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('printerName')}</label>
                        <input 
                           type="text" 
                           value={editingPrinter.name} 
                           onChange={e => setEditingPrinter({...editingPrinter, name: e.target.value})} 
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder={t('projectNamePlaceholder')}
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('brand')}</label>
                           {isCustomBrand ? (
                              <div className="flex gap-2">
                                 <input 
                                    type="text" 
                                    value={editingPrinter.brand} 
                                    onChange={e => setEditingPrinter({...editingPrinter, brand: e.target.value})} 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 dark:text-white text-sm"
                                    placeholder={t('brand')}
                                 />
                                 <button type="button" onClick={() => setIsCustomBrand(false)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg"><RefreshCw size={18}/></button>
                              </div>
                           ) : (
                              <select 
                                 value={editingPrinter.brand || ''} 
                                 onChange={e => { 
                                    if(e.target.value === 'CUSTOM') setIsCustomBrand(true); 
                                    else setEditingPrinter({...editingPrinter, brand: e.target.value, model: ''}); 
                                 }} 
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
                              >
                                 <option value="">{t('selectBrand')}</option>
                                 {Object.keys(PRINTER_PRESETS).sort().map(b => <option key={b} value={b}>{b}</option>)}
                                 <option value="CUSTOM">{t('otherBrand')}</option>
                              </select>
                           )}
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('printerModel')}</label>
                           {isCustomModel || isCustomBrand ? (
                              <div className="flex gap-2">
                                 <input 
                                    type="text" 
                                    value={editingPrinter.model} 
                                    onChange={e => setEditingPrinter({...editingPrinter, model: e.target.value})} 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 dark:text-white text-sm"
                                    placeholder={t('printerModel')}
                                 />
                                 {!isCustomBrand && <button type="button" onClick={() => setIsCustomModel(false)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg"><RefreshCw size={18}/></button>}
                              </div>
                           ) : (
                              <select 
                                 value={editingPrinter.model || ''} 
                                 onChange={e => { if(e.target.value === 'CUSTOM') setIsCustomModel(true); else setEditingPrinter({...editingPrinter, model: e.target.value}); }} 
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
                                 disabled={!editingPrinter.brand}
                              >
                                 <option value="">{t('selectMaterial')}</option>
                                 {editingPrinter.brand && PRINTER_PRESETS[editingPrinter.brand]?.map(m => <option key={m} value={m}>{m}</option>)}
                                 <option value="CUSTOM">{t('otherMaterial')}</option>
                              </select>
                           )}
                        </div>
                     </div>

                     <div className={`bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 relative overflow-hidden ${!isAdmin ? 'opacity-70 grayscale' : ''}`}>
                        {!isAdmin && (
                           <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px]">
                              <div className="bg-amber-100 dark:bg-amber-900/50 px-3 py-1.5 rounded-full flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-sm">
                                 <Crown size={12} fill="currentColor"/> PRO Feature
                              </div>
                           </div>
                        )}
                        
                        <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase mb-3 flex items-center gap-1">
                           <Coins size={14} /> {t('printerSpecs')}
                        </h4>
                        
                        <div className="grid grid-cols-3 gap-3">
                           <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block" title={t('printerPower')}>{t('printerPower')}</label>
                              <div className="relative">
                                 <input 
                                    type="number" 
                                    disabled={!isAdmin}
                                    value={editingPrinter.powerWatts || ''} 
                                    onChange={e => setEditingPrinter({...editingPrinter, powerWatts: Number(e.target.value)})}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm dark:text-white pl-6"
                                    placeholder="300"
                                 />
                                 <RefreshCw size={12} className="absolute left-2 top-2.5 text-slate-400" />
                              </div>
                           </div>
                           <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block" title={t('printerCost')}>{t('printerCost')}</label>
                              <div className="relative">
                                 <input 
                                    type="number" 
                                    disabled={!isAdmin}
                                    value={editingPrinter.purchasePrice || ''} 
                                    onChange={e => setEditingPrinter({...editingPrinter, purchasePrice: Number(e.target.value)})}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm dark:text-white pl-6"
                                    placeholder="800"
                                 />
                                 <span className="absolute left-2 top-2.5 text-slate-400 text-xs">€</span>
                              </div>
                           </div>
                           <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block" title={t('printerLifespan')}>{t('printerLifespan')}</label>
                              <div className="relative">
                                 <input 
                                    type="number" 
                                    disabled={!isAdmin}
                                    value={editingPrinter.lifespanHours || ''} 
                                    onChange={e => setEditingPrinter({...editingPrinter, lifespanHours: Number(e.target.value)})}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm dark:text-white pl-6"
                                    placeholder="20000"
                                 />
                                 <Hourglass size={12} className="absolute left-2 top-2.5 text-slate-400" />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                           <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('hasAMS')}</label>
                           <input 
                              type="checkbox" 
                              checked={editingPrinter.hasAMS} 
                              onChange={e => setEditingPrinter({...editingPrinter, hasAMS: e.target.checked})} 
                              className="w-6 h-6 accent-blue-600 rounded cursor-pointer"
                           />
                        </div>

                        {editingPrinter.hasAMS && (
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('amsUnits')}</label>
                              <div className="flex items-center gap-4">
                                 <input 
                                    type="range" 
                                    min="1" 
                                    max="4" 
                                    value={editingPrinter.amsCount || 1} 
                                    onChange={e => setEditingPrinter({...editingPrinter, amsCount: parseInt(e.target.value)})}
                                    className="flex-1 accent-blue-600"
                                 />
                                 <span className="font-bold text-lg w-8 text-center dark:text-white">{editingPrinter.amsCount || 1}</span>
                              </div>
                           </div>
                        )}
                     </div>

                     <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2">
                        <Save size={20}/> {t('saveChanges')}
                     </button>
                  </form>
               </div>
            </div>
         </div>
      )}

      {selectingSlot && (
         <FilamentSelector 
            filaments={filaments} 
            onSelect={handleFilamentSelect} 
            onClose={() => setSelectingSlot(null)} 
         />
      )}

    </div>
  );
};