
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Filament, PrintJob, Printer, AppSettings, CostBreakdown, OtherMaterial } from '../types';
import { parseGcodeFile, GCodeStats } from '../services/gcodeParser';
import { Clock, Scale, Calendar, FileCode, CheckCircle2, XCircle, Plus, ChevronRight, Euro, AlertCircle, Save, Trash2, Search, X, RefreshCw, Printer as PrinterIcon, FileText, Zap, Hammer, Coins, Disc, Wrench, Percent, Tag, ArrowUpFromLine, Crown, Box, Package, Ruler } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PrintHistoryProps {
  filaments: Filament[];
  materials: OtherMaterial[];
  history: PrintJob[];
  printers: Printer[];
  onSaveJob: (job: PrintJob, filamentDeductions: { id: string, amount: number }[]) => void;
  onDeleteJob: (id: string) => void;
  settings?: AppSettings;
  isAdmin?: boolean;
  onUnlockPro?: () => void;
}

interface FilamentPickerProps {
  filaments: Filament[];
  selectedId: string;
  onChange: (id: string) => void;
}

const FilamentPicker: React.FC<FilamentPickerProps> = ({ filaments, selectedId, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { t, tColor } = useLanguage();

  const selectedFilament = filaments.find(f => f.id === selectedId);

  const filteredFilaments = useMemo(() => {
    if (!searchTerm) return filaments;
    const lower = searchTerm.toLowerCase();
    return filaments.filter(f => 
      (f.shortId && f.shortId.toLowerCase().includes(lower)) ||
      f.brand.toLowerCase().includes(lower) ||
      f.colorName.toLowerCase().includes(lower) ||
      f.material.toLowerCase().includes(lower)
    );
  }, [filaments, searchTerm]);

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  if (isOpen) {
    return (
      <div className="w-full bg-slate-100 dark:bg-slate-800 border border-blue-500 rounded-lg shadow-sm animate-fade-in z-20 relative">
        <div className="flex items-center p-2 border-b border-slate-200 dark:border-slate-700 gap-2">
           <Search size={16} className="text-slate-400" />
           <input 
             ref={inputRef}
             type="text" 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="flex-1 bg-transparent outline-none text-sm dark:text-white"
             placeholder={t('searchPlaceholder')}
           />
           <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
             <X size={16} />
           </button>
        </div>
        <div className="max-h-48 overflow-y-auto">
           {filteredFilaments.length === 0 ? (
             <div className="p-3 text-xs text-slate-500 text-center">{t('none')}</div>
           ) : (
             filteredFilaments.map(f => (
               <div 
                 key={f.id} 
                 onClick={() => handleSelect(f.id)}
                 className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 flex items-center justify-between group"
               >
                 <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                       {f.shortId && <span className="text-blue-600 dark:text-blue-400 font-mono mr-1">[#{f.shortId}]</span>}
                       {f.brand} <span className="font-normal">{tColor(f.colorName)}</span>
                    </span>
                    <span className="text-[10px] text-slate-500">{f.material} • {f.weightRemaining}g</span>
                 </div>
                 {f.colorHex && (
                   <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-sm" style={{ backgroundColor: f.colorHex }} />
                 )}
               </div>
             ))
           )}
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={handleOpen}
      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm dark:text-white text-left flex items-center justify-between hover:border-slate-400 transition-colors"
    >
      <span className="truncate flex items-center gap-2">
        {selectedFilament ? (
           <>
             {selectedFilament.colorHex && <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: selectedFilament.colorHex }} />}
             <span>
                {selectedFilament.shortId && <span className="font-mono text-slate-500 mr-1">#{selectedFilament.shortId}</span>}
                {selectedFilament.brand} {tColor(selectedFilament.colorName)}
             </span>
           </>
        ) : (
           <span className="text-slate-400 italic">-- {t('selectBrand')} --</span>
        )}
      </span>
      <ChevronRight size={14} className="rotate-90 text-slate-400 flex-shrink-0"/>
    </button>
  );
};

const MaterialPicker = ({ materials, selectedId, onChange }: { materials: OtherMaterial[], selectedId: string, onChange: (id: string) => void }) => {
   const { t } = useLanguage();
   const [isOpen, setIsOpen] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');
   
   const selected = materials.find(m => m.id === selectedId);
   const filtered = materials.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

   if (isOpen) {
      return (
         <div className="w-full bg-slate-100 dark:bg-slate-800 border border-blue-500 rounded-lg shadow-sm animate-fade-in z-20 relative">
            <div className="flex items-center p-2 border-b border-slate-200 dark:border-slate-700 gap-2">
               <Search size={16} className="text-slate-400" />
               <input 
                  autoFocus
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm dark:text-white"
                  placeholder={t('searchMaterial')}
               />
               <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={16} /></button>
            </div>
            <div className="max-h-48 overflow-y-auto">
               {filtered.length === 0 ? <div className="p-3 text-xs text-slate-500 text-center">{t('none')}</div> : filtered.map(m => (
                  <div key={m.id} onClick={() => { onChange(m.id); setIsOpen(false); }} className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                     <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{m.name}</div>
                     <div className="text-[10px] text-slate-500">{m.category} • {m.quantity} {m.unit} op voorraad</div>
                  </div>
               ))}
            </div>
         </div>
      );
   }

   return (
      <button onClick={() => setIsOpen(true)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm dark:text-white text-left flex items-center justify-between hover:border-slate-400 transition-colors">
         <span className="truncate">{selected ? selected.name : <span className="text-slate-400 italic">-- {t('selectMaterial')} --</span>}</span>
         <ChevronRight size={14} className="rotate-90 text-slate-400 flex-shrink-0"/>
      </button>
   );
};

const parseTimeToHours = (timeStr: string): number => {
   if (!timeStr) return 0;
   let totalHours = 0;
   const hMatch = timeStr.match(/(\d+)h/);
   const mMatch = timeStr.match(/(\d+)m/);
   
   if (hMatch) totalHours += parseInt(hMatch[1]);
   if (mMatch) totalHours += parseInt(mMatch[1]) / 60;
   
   return totalHours;
};

const getCompatibleUnits = (stockUnit: string) => {
    switch (stockUnit.toLowerCase()) {
        case 'meter': return ['m', 'cm', 'mm'];
        case 'liter': return ['l', 'ml', 'cl'];
        case 'gram': return ['g', 'kg'];
        default: return [];
    }
};

const getConversionFactor = (fromUnit: string, toUnit: string) => {
    if (toUnit === 'meter') {
        if (fromUnit === 'cm') return 0.01;
        if (fromUnit === 'mm') return 0.001;
        return 1;
    }
    if (toUnit === 'liter') {
        if (fromUnit === 'ml') return 0.001;
        if (fromUnit === 'cl') return 0.01;
        return 1;
    }
    if (toUnit === 'gram') {
        if (fromUnit === 'kg') return 1000;
        return 1;
    }
    return 1;
};

export const PrintHistory: React.FC<PrintHistoryProps> = ({ filaments, materials, history, printers, onSaveJob, onDeleteJob, settings, isAdmin, onUnlockPro }) => {
  const [showModal, setShowModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const { t } = useLanguage();
  
  const [viewingJob, setViewingJob] = useState<PrintJob | null>(null);

  const [jobName, setJobName] = useState('');
  const [printTime, setPrintTime] = useState('');
  const [status, setStatus] = useState<'success' | 'fail'>('success');
  const [overrideTotalWeight, setOverrideTotalWeight] = useState<number | ''>('');
  const [assemblyTime, setAssemblyTime] = useState<number>(0); 
  const [isAssemblyRequired, setIsAssemblyRequired] = useState(false);
  
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');

  const [materialSlots, setMaterialSlots] = useState<{
     detectedType: string;
     detectedColor?: string;
     weight: number;
     assignedFilamentId: string;
  }[]>([{ detectedType: 'PLA', weight: 0, assignedFilamentId: '' }]);

  const [otherMaterialSlots, setOtherMaterialSlots] = useState<{
     tempId: string;
     materialId: string;
     quantity: number;
     inputUnit?: string;
  }[]>([]);

  useEffect(() => {
      if (overrideTotalWeight === '' || overrideTotalWeight <= 0) return;
      const currentSum = materialSlots.filter(s => s.detectedType !== 'Rest / Afval / Flush').reduce((acc, curr) => acc + curr.weight, 0);
      const diff = Number(overrideTotalWeight) - currentSum;
      
      if (diff > 0.5) {
          const hasWasteSlot = materialSlots.some(s => s.detectedType === 'Rest / Afval / Flush');
          if (!hasWasteSlot) {
              setMaterialSlots(prev => [...prev, {
                  detectedType: 'Rest / Afval / Flush',
                  weight: Number(diff.toFixed(2)),
                  assignedFilamentId: '',
                  detectedColor: '#555555'
              }]);
          } else {
              setMaterialSlots(prev => prev.map(s => 
                  s.detectedType === 'Rest / Afval / Flush' ? { ...s, weight: Number(diff.toFixed(2)) } : s
              ));
          }
      } else {
          setMaterialSlots(prev => prev.filter(s => s.detectedType !== 'Rest / Afval / Flush'));
      }
  }, [overrideTotalWeight]);

  useEffect(() => {
      if (selectedPrinterId && materialSlots.length > 0) {
          const printer = printers.find(p => p.id === selectedPrinterId);
          if (printer) {
              const updatedSlots = materialSlots.map((ms, index) => {
                  if (ms.detectedType === 'Rest / Afval / Flush') return ms; 
                  const printerSlot = printer.amsSlots.find(s => s.slotNumber === index + 1);
                  if (printerSlot && printerSlot.filamentId) {
                      return { ...ms, assignedFilamentId: printerSlot.filamentId };
                  }
                  return ms;
              });
              if (JSON.stringify(updatedSlots) !== JSON.stringify(materialSlots)) {
                  setMaterialSlots(updatedSlots);
              }
          }
      }
  }, [selectedPrinterId, printers]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const processFile = async (file: File) => {
    setParsing(true);
    setShowModal(true);
    setJobName(file.name.replace(/\.(gcode|bgcode|mqc)$/i, '').replace(/_/g, ' '));
    setOverrideTotalWeight('');
    setAssemblyTime(0);
    setIsAssemblyRequired(false);
    setOtherMaterialSlots([]);
    
    try {
      const stats = await parseGcodeFile(file);
      setPrintTime(stats.estimatedTime);
      
      const newSlots = stats.materials.map(m => ({
        detectedType: m.type,
        detectedColor: m.color,
        weight: m.weight,
        assignedFilamentId: ''
      }));
      setMaterialSlots(newSlots);
      
      if (selectedPrinterId) {
          const printer = printers.find(p => p.id === selectedPrinterId);
          if (printer) {
              const mappedSlots = newSlots.map((ms, index) => {
                  if (ms.detectedType === 'Rest / Afval / Flush') return ms;
                  const printerSlot = printer.amsSlots.find(s => s.slotNumber === index + 1);
                  return (printerSlot && printerSlot.filamentId) ? { ...ms, assignedFilamentId: printerSlot.filamentId } : ms;
              });
              setMaterialSlots(mappedSlots);
          }
      }
      
      if (Math.abs(stats.totalWeight - newSlots.reduce((a,b) => a + b.weight, 0)) < 0.1) {
          setOverrideTotalWeight(stats.totalWeight);
      }

    } catch (e: any) {
      alert("Fout: " + e.message);
      if (materialSlots.length === 0) {
          setMaterialSlots([{ detectedType: 'PLA', weight: 0, assignedFilamentId: '' }]);
      }
    } finally {
      setParsing(false);
    }
  };

  const handleSave = () => {
    if (!jobName) {
      alert("Vul een naam in.");
      return;
    }
    
    const validAssignments = materialSlots.every(slot => 
        slot.weight === 0 || 
        slot.assignedFilamentId || 
        slot.detectedType.includes('Afval') || 
        slot.detectedType.includes('Flush')
    );
    
    if (!validAssignments) {
      if(!confirm("Niet alle slots zijn gekoppeld. Doorgaan?")) return;
    }

    const totalWeight = materialSlots.reduce((acc, curr) => acc + curr.weight, 0);
    const printHours = parseTimeToHours(printTime);
    
    let totalFilamentCost = 0;
    let electricityCost = 0;
    let depreciationCost = 0;
    let laborCost = 0;
    let materialCost = 0;

    const deductions: { id: string, amount: number }[] = [];
    const usedFilamentsMeta: any[] = [];
    const usedOtherMaterials: { materialId: string, quantity: number }[] = [];

    materialSlots.forEach(slot => {
        if (slot.weight > 0 && slot.assignedFilamentId) {
            const filament = filaments.find(f => f.id === slot.assignedFilamentId);
            if (filament) {
                const costPerGram = (filament.price || 0) / filament.weightTotal;
                totalFilamentCost += slot.weight * costPerGram;
                deductions.push({ id: filament.id, amount: slot.weight });
                usedFilamentsMeta.push({
                    filamentId: filament.id,
                    amount: slot.weight,
                    colorHex: filament.colorHex
                });
            }
        }
    });

    otherMaterialSlots.forEach(slot => {
        if (slot.materialId && slot.quantity > 0) {
            const mat = materials.find(m => m.id === slot.materialId);
            if (mat) {
                let deductionAmount = slot.quantity;
                if (slot.inputUnit && slot.inputUnit !== mat.unit) {
                    const factor = getConversionFactor(slot.inputUnit, mat.unit);
                    deductionAmount = slot.quantity * factor;
                }
                materialCost += (mat.price || 0) * deductionAmount;
                usedOtherMaterials.push({ materialId: mat.id, quantity: deductionAmount });
            }
        }
    });

    if (settings) {
        let powerWatts = 0;
        let machineHourlyCost = 0;
        if (selectedPrinterId) {
            const printer = printers.find(p => p.id === selectedPrinterId);
            if (printer) {
                if (printer.powerWatts) powerWatts = printer.powerWatts;
                if (printer.purchasePrice && printer.lifespanHours && printer.lifespanHours > 0) {
                    machineHourlyCost = printer.purchasePrice / printer.lifespanHours;
                }
            }
        }
        if (powerWatts > 0 && settings.electricityRate) {
            const kWh = (powerWatts / 1000) * printHours;
            electricityCost = kWh * settings.electricityRate;
        }
        if (machineHourlyCost > 0) depreciationCost = machineHourlyCost * printHours;
        if (settings.hourlyRate && isAssemblyRequired && assemblyTime > 0) {
            laborCost = settings.hourlyRate * (assemblyTime / 60);
        }
    }

    const totalCost = totalFilamentCost + electricityCost + depreciationCost + laborCost + materialCost;

    const newJob: PrintJob = {
        id: crypto.randomUUID(),
        name: jobName,
        date: new Date().toISOString(),
        printTime: printTime,
        totalWeight: totalWeight,
        calculatedCost: totalCost,
        status: status,
        printerId: selectedPrinterId,
        usedFilaments: usedFilamentsMeta,
        costBreakdown: { filamentCost: totalFilamentCost, electricityCost, depreciationCost, laborCost, materialCost },
        assemblyTime: isAssemblyRequired ? assemblyTime : 0,
        usedOtherMaterials: usedOtherMaterials
    };

    onSaveJob(newJob, deductions);
    setShowModal(false);
    setJobName('');
    setPrintTime('');
    setOverrideTotalWeight('');
    setSelectedPrinterId('');
    setAssemblyTime(0);
    setIsAssemblyRequired(false);
    setMaterialSlots([{ detectedType: 'PLA', weight: 0, assignedFilamentId: '' }]);
    setOtherMaterialSlots([]);
  };

  const handleExportCSV = () => {
     if (!isAdmin) {
        if (onUnlockPro) onUnlockPro();
        else alert(t('proComingSoonMsg'));
        return;
     }
     if (!history.length) return;
     const headers = [t('date'), t('name'), t('status'), t('printTime'), `${t('totalWeight')} (g)`, `${t('totalValue')} (€)`, t('printer'), "Filamenten"];
     const rows = history.map(job => {
        const date = new Date(job.date).toLocaleDateString();
        const printerName = job.printerId ? printers.find(p => p.id === job.printerId)?.name : t('unknown');
        const filamentsStr = job.usedFilaments.map(uf => {
           const f = filaments.find(fil => fil.id === uf.filamentId);
           return f ? `${f.brand} ${f.colorName}` : t('unknown');
        }).join(' + ');
        return [ date, `"${job.name.replace(/"/g, '""')}"`, job.status, job.printTime || '', job.totalWeight.toFixed(1), job.calculatedCost.toFixed(2), `"${printerName}"`, `"${filamentsStr}"` ].join(',');
     });
     const csvContent = [headers.join(','), ...rows].join('\n');
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.setAttribute('download', `print-history-${new Date().toISOString().split('T')[0]}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const profitMargin = settings?.profitMargin || 0;
  const netCost = viewingJob?.calculatedCost || 0;
  const rawSellPrice = netCost * (1 + profitMargin / 100);
  let finalSellPrice = rawSellPrice;
  let roundingAmount = 0;

  if (settings?.roundToNine) {
      let candidate = (Math.floor(rawSellPrice * 10) / 10) + 0.09;
      if (candidate < rawSellPrice) candidate += 0.10;
      finalSellPrice = candidate;
      roundingAmount = finalSellPrice - rawSellPrice;
  }

  const showSellPrice = (profitMargin > 0) || settings?.roundToNine || (settings?.electricityRate || 0) > 0 || (settings?.hourlyRate || 0) > 0;

  return (
    <div className="space-y-6 animate-fade-in relative h-full flex flex-col">
       <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('recentActivity')}</h3>
          {history.length > 0 && (
             <button onClick={handleExportCSV} className="text-xs bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border border-amber-200 dark:border-amber-800">
                <Crown size={12} fill="currentColor"/> <span>PRO {t('exportCsv')}</span>
             </button>
          )}
       </div>

       <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400'}
          `}
          onClick={() => setShowModal(true)}
       >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
             <FileCode size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t('logPrint')}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">{t('dragDrop')}</p>
       </div>

       <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
             {sortedHistory.length === 0 && <div className="text-center py-10 text-slate-400">{t('noHistory')}</div>}
             {sortedHistory.map(job => (
                <div 
                  key={job.id} 
                  onClick={() => setViewingJob(job)}
                  className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-sm group hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-colors"
                >
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${job.status === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                      {job.status === 'success' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <h4 className="font-bold text-slate-800 dark:text-white truncate pr-2">{job.name}</h4>
                         <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(job.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                         <div className="flex -space-x-1.5">
                            {job.usedFilaments.map((f, idx) => (
                                <div key={idx} className="w-4 h-4 rounded-full border border-white dark:border-slate-800 shadow-sm" style={{ backgroundColor: f.colorHex }} title={`${f.amount}g`} />
                            ))}
                         </div>
                         <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{job.totalWeight.toFixed(1)}g</span>
                         {job.usedOtherMaterials && job.usedOtherMaterials.length > 0 && (
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-md flex items-center gap-1"><Box size={10} /> {job.usedOtherMaterials.length}</span>
                         )}
                         {job.printTime && (
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md flex items-center gap-1"><Clock size={10} /> {job.printTime}</span>
                         )}
                      </div>
                   </div>
                   <div className="text-right flex flex-col items-end gap-2">
                      <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-end gap-1"><Euro size={12} /> {job.calculatedCost.toFixed(2)}</div>
                      <button 
                         onClick={(e) => { e.stopPropagation(); onDeleteJob(job.id); }}
                         className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                         title={t('delete')}
                      >
                         <Trash2 size={16} />
                      </button>
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* View Details Modal via PORTAL */}
       {viewingJob && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-hidden">
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative max-h-[90vh] flex flex-col">
                <button 
                   onClick={() => setViewingJob(null)} 
                   className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white z-10"
                >
                   <X size={20} />
                </button>

                <div className="p-6 overflow-y-auto">
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 truncate pr-6">{viewingJob.name}</h3>
                   <div className="text-sm text-slate-500 mb-6">{new Date(viewingJob.date).toLocaleString()}</div>

                   <div className="flex justify-center mb-6">
                      <div className="text-center w-full">
                         {showSellPrice ? (
                            <div className="space-y-4">
                               <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                  <span className="block text-xl font-bold text-slate-600 dark:text-slate-300">€{netCost.toFixed(2)}</span>
                                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{t('netCost')}</span>
                               </div>
                               <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                                  <span className="block text-4xl font-bold text-green-600 dark:text-green-400">€{finalSellPrice.toFixed(2)}</span>
                                  <span className="text-xs text-green-600/70 dark:text-green-400/70 uppercase tracking-widest font-bold flex items-center justify-center gap-1">{t('sellPrice')} <Tag size={12}/></span>
                               </div>
                            </div>
                         ) : (
                            <div>
                               <span className="block text-4xl font-bold text-slate-800 dark:text-white">€{netCost.toFixed(2)}</span>
                               <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">{t('totalCosts')}</span>
                            </div>
                         )}
                      </div>
                   </div>

                   <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      {viewingJob.costBreakdown ? (
                         <>
                            <div className="flex justify-between items-center text-sm">
                               <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><Disc size={14} className="text-blue-500"/> {t('filament')}</span>
                               <span className="font-medium dark:text-white">€{viewingJob.costBreakdown.filamentCost.toFixed(2)}</span>
                            </div>
                            {(viewingJob.costBreakdown.materialCost || 0) > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><Box size={14} className="text-indigo-500"/> {t('materials')}</span>
                                    <span className="font-medium dark:text-white">€{viewingJob.costBreakdown.materialCost?.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm">
                               <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><Zap size={14} className="text-yellow-500"/> {t('electricity')}</span>
                               <span className="font-medium dark:text-white">€{viewingJob.costBreakdown.electricityCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                               <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><Coins size={14} className="text-orange-500"/> {t('depreciation')}</span>
                               <span className="font-medium dark:text-white">€{viewingJob.costBreakdown.depreciationCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                               <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><Hammer size={14} className="text-purple-500"/> {t('labor')}</span>
                               <span className="font-medium dark:text-white">€{viewingJob.costBreakdown.laborCost.toFixed(2)}</span>
                            </div>
                            {profitMargin > 0 && (
                               <div className="flex justify-between items-center text-sm pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><Percent size={14} className="text-green-500"/> {t('profitMarginLabel')}</span>
                                  <span className="font-medium text-green-600 dark:text-green-400">{profitMargin}%</span>
                               </div>
                            )}
                            {roundingAmount > 0.001 && (
                               <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2"><ArrowUpFromLine size={14} className="text-slate-400"/> {t('rounding')}</span>
                                  <span className="font-medium text-green-600 dark:text-green-400">+€{roundingAmount.toFixed(2)}</span>
                               </div>
                            )}
                         </>
                      ) : (
                         <div className="text-center text-sm text-slate-400 italic py-2">{t('noDetailedCost')}</div>
                      )}
                   </div>

                   {viewingJob.usedOtherMaterials && viewingJob.usedOtherMaterials.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Package size={12}/> {t('usedMaterials')}</h4>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 space-y-1">
                                {viewingJob.usedOtherMaterials.map((um, idx) => {
                                    const mat = materials.find(m => m.id === um.materialId);
                                    const displayQty = um.quantity < 1 ? um.quantity.toFixed(2) : um.quantity;
                                    return (
                                        <div key={idx} className="text-xs flex justify-between items-center dark:text-slate-300">
                                            <span>{mat ? mat.name : t('unknownMaterial')}</span>
                                            <span className="font-mono text-slate-500">{displayQty} {mat?.unit || 'st'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                   )}

                   <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{t('details')}</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                         <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                            <span className="block text-slate-500">{t('weight')}</span>
                            <span className="font-bold dark:text-white">{viewingJob.totalWeight.toFixed(1)}g</span>
                         </div>
                         <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                            <span className="block text-slate-500">{t('duration')}</span>
                            <span className="font-bold dark:text-white">{viewingJob.printTime || '-'}</span>
                         </div>
                         {viewingJob.assemblyTime !== undefined && viewingJob.assemblyTime > 0 && (
                            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded col-span-2 flex items-center justify-between">
                                <span className="text-slate-500">{t('assemblyTimeLabel')}</span>
                                <span className="font-bold dark:text-white">{viewingJob.assemblyTime} {t('minutes')}</span>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>,
          document.body
       )}

       {/* Modal for Adding/Editing via PORTAL */}
       {showModal && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-hidden">
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                   <h2 className="text-xl font-bold dark:text-white text-slate-800">{t('logPrint')}</h2>
                   <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><XCircle size={24} /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-5">
                   {parsing && (
                      <div className="flex items-center justify-center py-4 text-blue-500 gap-2">
                         <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                         <span>{t('analyzing')}</span>
                      </div>
                   )}

                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('printer')}</label>
                      <div className="relative">
                         <select 
                            value={selectedPrinterId}
                            onChange={(e) => setSelectedPrinterId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                         >
                            <option value="">{t('selectPrinter')}</option>
                            {printers.map(p => (
                               <option key={p.id} value={p.id}>{p.name} ({p.model})</option>
                            ))}
                         </select>
                         <PrinterIcon size={18} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                      </div>
                   </div>

                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('projectName')}</label>
                      <input 
                        type="text" 
                        value={jobName} 
                        onChange={e => setJobName(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        placeholder={t('projectNamePlaceholder')}
                     />
                   </div>

                   <div className="flex gap-4">
                      <div className="flex-1">
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('timeOptional')}</label>
                         <input 
                           type="text" 
                           value={printTime} 
                           onChange={e => setPrintTime(e.target.value)} 
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                           placeholder={t('exampleTime')}
                         />
                      </div>
                      <div className="flex-1">
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('status')}</label>
                         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button onClick={() => setStatus('success')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${status === 'success' ? 'bg-green-500 text-white shadow' : 'text-slate-500 dark:text-slate-400'}`}>{t('success')}</button>
                            <button onClick={() => setStatus('fail')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${status === 'fail' ? 'bg-red-500 text-white shadow' : 'text-slate-500 dark:text-slate-400'}`}>{t('failed')}</button>
                         </div>
                      </div>
                   </div>

                   <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                         <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Wrench size={14} className="text-blue-500" /> {t('assemblyTimeLabel')}?</label>
                            <input type="checkbox" checked={isAssemblyRequired} onChange={(e) => { setIsAssemblyRequired(e.target.checked); if (!e.target.checked) setAssemblyTime(0); }} className="w-5 h-5 accent-blue-600 rounded" />
                         </div>
                         {isAssemblyRequired && (
                            <div className="flex items-center gap-2 animate-fade-in">
                               <input type="number" value={assemblyTime} onChange={e => setAssemblyTime(Number(e.target.value))} className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm dark:text-white" />
                               <span className="text-sm text-slate-600 dark:text-slate-400">{t('minutes')}</span>
                            </div>
                         )}
                   </div>

                   <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                      <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1 block flex items-center gap-2"><Scale size={14}/> {t('overrideWeight')}</label>
                      <div className="flex items-center gap-2">
                          <input type="number" value={overrideTotalWeight} onChange={e => setOverrideTotalWeight(e.target.value === '' ? '' : Number(e.target.value))} className="flex-1 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg p-2 text-sm dark:text-white" placeholder={t('autoCalculated')} />
                          <span className="text-sm text-slate-500">g</span>
                      </div>
                   </div>

                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex justify-between">
                         <span>{t('usedMaterials')}</span>
                         <span className="text-blue-500 cursor-pointer" onClick={() => setMaterialSlots([...materialSlots, { detectedType: 'PLA', weight: 0, assignedFilamentId: '' }])}>+ {t('addSlot')}</span>
                      </label>
                      <div className="space-y-3">
                         {materialSlots.map((slot, index) => (
                            <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                               <div className="flex justify-between text-xs text-slate-400 mb-2">
                                  <span className="flex items-center gap-1">{slot.detectedColor && (<div className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: slot.detectedColor }}/>)}{t('slot')} {index + 1}: {slot.detectedType}</span>
                                  {materialSlots.length > 1 && (<button onClick={() => setMaterialSlots(materialSlots.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-500">{t('delete')}</button>)}
                               </div>
                               <div className="flex gap-2 items-start">
                                  <div className="w-24 relative">
                                      <input type="number" value={slot.weight} onChange={e => { const newSlots = [...materialSlots]; newSlots[index].weight = parseFloat(e.target.value) || 0; setMaterialSlots(newSlots); }} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 pl-2 pr-6 text-sm dark:text-white" />
                                      <span className="absolute right-2 top-2 text-xs text-slate-400">g</span>
                                  </div>
                                  <div className="flex-1">
                                      <FilamentPicker filaments={filaments} selectedId={slot.assignedFilamentId} onChange={(id) => { const newSlots = [...materialSlots]; newSlots[index].assignedFilamentId = id; setMaterialSlots(newSlots); }} />
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex justify-between items-center">
                            <span>{t('otherMaterials')}</span>
                            <button onClick={() => setOtherMaterialSlots([...otherMaterialSlots, { tempId: crypto.randomUUID(), materialId: '', quantity: 1 }])} className="text-blue-500 text-xs flex items-center gap-1"><Plus size={14} /> {t('add')}</button>
                        </label>
                        <div className="space-y-2">
                            {otherMaterialSlots.map((slot, index) => {
                                const selectedMat = materials.find(m => m.id === slot.materialId);
                                const compatibleUnits = selectedMat ? getCompatibleUnits(selectedMat.unit) : [];
                                return (
                                    <div key={slot.tempId} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="flex-1 min-w-0">
                                            <MaterialPicker materials={materials} selectedId={slot.materialId} onChange={(id) => { const mat = materials.find(m => m.id === id); const units = mat ? getCompatibleUnits(mat.unit) : []; const newSlots = [...otherMaterialSlots]; newSlots[index].materialId = id; newSlots[index].inputUnit = units.length > 0 ? units[0] : undefined; setOtherMaterialSlots(newSlots); }} />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <input type="number" value={slot.quantity} onChange={e => { const newSlots = [...otherMaterialSlots]; newSlots[index].quantity = parseFloat(e.target.value) || 0; setOtherMaterialSlots(newSlots); }} className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm dark:text-white text-center" placeholder="0" />
                                            {compatibleUnits.length > 0 ? (
                                                <select value={slot.inputUnit || compatibleUnits[0]} onChange={e => { const newSlots = [...otherMaterialSlots]; newSlots[index].inputUnit = e.target.value; setOtherMaterialSlots(newSlots); }} className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm dark:text-white appearance-none text-center">
                                                    {compatibleUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                                </select>
                                            ) : (<span className="text-xs text-slate-500 w-10 truncate text-center">{selectedMat ? selectedMat.unit : '-'}</span>)}
                                        </div>
                                        <button onClick={() => setOtherMaterialSlots(otherMaterialSlots.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                                    </div>
                                );
                            })}
                        </div>
                   </div>
                   
                   <input type="file" onChange={handleFileSelect} className="hidden" id="manual-file-upload" accept=".gcode,.bgcode" />
                   <label htmlFor="manual-file-upload" className="block text-center text-xs text-blue-500 hover:underline cursor-pointer">{t('manualEntry')}</label>
                </div>
                
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                   <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"><Save size={18} /> {t('saveUpdate')}</button>
                </div>
             </div>
          </div>,
          document.body
       )}
    </div>
  );
};
