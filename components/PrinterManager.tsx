
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
  "Creality": ["K1 Max", "K1C", "K1", "Ender 3 V3", "Ender 3 V3 Plus", "CR-10 SE"],
  "Prusa Research": ["MK4S", "MK4", "MK3S+", "XL (5 Toolhead)", "XL (2 Toolhead)", "Mini+"],
  "Anycubic": ["Kobra 3 Combo", "Kobra 2 Pro", "Kobra 2 Max"],
  "Elegoo": ["Neptune 4 Max", "Neptune 4 Plus", "Saturn 4 Ultra"],
  "Flashforge": ["Adventurer 5M Pro", "Adventurer 5M"],
  "Qidi Tech": ["Q1 Pro", "X-Max 3"],
  "Voron": ["Voron 2.4", "Voron Trident"],
  "UltiMaker": ["S7", "S5", "Method XL"]
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
    newSlots[selectingSlot.slotIndex] = {
       slotNumber: selectingSlot.slotIndex + 1,
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

  const FilamentSelector = ({ filaments, onSelect, onClose }: { filaments: Filament[], onSelect: (id: string) => void, onClose: () => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { tColor } = useLanguage();
    const filtered = filaments.filter(f => !searchTerm || `${f.brand} ${f.colorName} ${f.material}`.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
         <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
               <Search className="text-slate-400" size={20} />
               <input autoFocus type="text" className="flex-1 bg-transparent outline-none dark:text-white" placeholder={t('searchPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               <button onClick={onClose}><X className="text-slate-500" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
               {filtered.map(f => (
                  <div key={f.id} onClick={() => onSelect(f.id)} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0">
                     <div className="w-8 h-8 rounded-full border border-slate-200 shadow-sm flex-shrink-0" style={{ backgroundColor: f.colorHex }} />
                     <div className="flex-1 min-w-0">
                        <div className="font-bold dark:text-white truncate">{f.brand} {tColor(f.colorName)}</div>
                        <div className="text-xs text-slate-500">{f.material} • {f.weightRemaining}g</div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    );
  };

  const renderSlot = (printer: Printer, slotIndex: number, label: string) => {
      const slot = printer.amsSlots?.[slotIndex] || { slotNumber: slotIndex + 1, filamentId: null };
      const loadedFilament = slot.filamentId ? filaments.find(f => f.id === slot.filamentId) : null;

      return (
        <div key={slotIndex} className="flex flex-col gap-1 w-full">
           <span className="text-[9px] text-slate-400 font-black uppercase text-center mb-1">{label}</span>
           <div 
             onClick={() => setSelectingSlot({ printerId: printer.id, slotIndex: slotIndex })}
             className={`aspect-[3/4] rounded-lg border-2 flex flex-col items-center justify-center p-1 cursor-pointer transition-all relative overflow-hidden group shadow-sm ${loadedFilament ? 'border-transparent' : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-800'}`}
             style={loadedFilament ? { backgroundColor: loadedFilament.colorHex } : undefined}
           >
              {loadedFilament ? (
                 <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => { e.stopPropagation(); clearSlot(printer.id, slotIndex); }}>
                       <div className="bg-black/40 hover:bg-red-500 text-white rounded-full p-1"><X size={10}/></div>
                    </div>
                    <div className="mt-auto relative z-10 text-center w-full pb-1">
                       <span className="text-[9px] font-black text-white block truncate px-1 drop-shadow-md">{loadedFilament.brand}</span>
                    </div>
                 </>
              ) : <Plus size={16} className="text-slate-300" />}
           </div>
        </div>
      );
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      <div className="flex justify-between items-center">
         <h3 className="text-xl font-bold dark:text-white text-slate-800 flex items-center gap-2"><PrinterIcon size={24} /> {t('printers')}</h3>
         <button onClick={() => setEditingPrinter({ name: '', brand: '', model: '', hasAMS: true, amsCount: 1, amsSlots: [] })} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg"><Plus size={20} /> {t('addPrinter')}</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {printers.map(printer => (
            <div key={printer.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
               <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                     <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 text-blue-600 dark:text-blue-400"><PrinterIcon size={20} /></div>
                     <div className="min-w-0">
                        <h4 className="font-bold dark:text-white leading-tight truncate">{printer.name}</h4>
                        <div className="flex gap-2 mt-1">
                           <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">{printer.brand}</span>
                           <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{printer.model}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-1">
                     <button onClick={() => setEditingPrinter(printer)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"><Edit2 size={16}/></button>
                     <button onClick={() => onDelete(printer.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  </div>
               </div>

               <div className="p-5 bg-slate-50 dark:bg-slate-900/30">
                  {printer.hasAMS ? (
                     <div className="space-y-6">
                        {Array.from({ length: printer.amsCount || 1 }).map((_, unitIdx) => (
                           <div key={unitIdx} className="bg-white dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                              <div className="flex items-center gap-2 mb-3">
                                 <CircleDashed size={14} className="text-blue-500" />
                                 <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">CFS/AMS UNIT {unitIdx + 1}</span>
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                 {[0, 1, 2, 3].map(slotIdx => renderSlot(printer, (unitIdx * 4) + slotIdx, `Slot ${slotIdx + 1}`))}
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="max-w-[100px]">{renderSlot(printer, 0, t('activeFilament'))}</div>
                  )}
               </div>
            </div>
         ))}
      </div>

      {editingPrinter && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
               <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <h2 className="text-xl font-bold dark:text-white">{editingPrinter.id ? t('editPrinter') : t('addPrinter')}</h2>
                  <button onClick={() => setEditingPrinter(null)}><X size={24} className="text-slate-400" /></button>
               </div>
               <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <input type="text" value={editingPrinter.name} onChange={e => setEditingPrinter({...editingPrinter, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 dark:text-white" placeholder="Printer Naam" />
                  <div className="grid grid-cols-2 gap-4">
                     <select value={editingPrinter.brand} onChange={e => setEditingPrinter({...editingPrinter, brand: e.target.value, model: ''})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 dark:text-white">
                        <option value="">Kies Merk...</option>
                        {Object.keys(PRINTER_PRESETS).sort().map(b => <option key={b} value={b}>{b}</option>)}
                     </select>
                     <select value={editingPrinter.model} onChange={e => setEditingPrinter({...editingPrinter, model: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 dark:text-white">
                        <option value="">Kies Model...</option>
                        {editingPrinter.brand && PRINTER_PRESETS[editingPrinter.brand]?.map(m => <option key={m} value={m}>{m}</option>)}
                     </select>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                     <label className="text-sm font-bold dark:text-white">{t('hasAMS')}</label>
                     <input type="checkbox" checked={editingPrinter.hasAMS} onChange={e => setEditingPrinter({...editingPrinter, hasAMS: e.target.checked})} className="w-6 h-6 accent-blue-600" />
                  </div>
                  {editingPrinter.hasAMS && (
                     <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Aantal AMS/CFS Units</label>
                        <input type="range" min="1" max="4" value={editingPrinter.amsCount || 1} onChange={e => setEditingPrinter({...editingPrinter, amsCount: parseInt(e.target.value)})} className="w-full accent-blue-600" />
                        <div className="text-center font-bold dark:text-white mt-1">{editingPrinter.amsCount || 1} Unit(s)</div>
                     </div>
                  )}
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2"><Save size={20}/> {t('saveChanges')}</button>
               </form>
            </div>
         </div>
      )}

      {selectingSlot && <FilamentSelector filaments={filaments} onSelect={handleFilamentSelect} onClose={() => setSelectingSlot(null)} />}
    </div>
  );
};
