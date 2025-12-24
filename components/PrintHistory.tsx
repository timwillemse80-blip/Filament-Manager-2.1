
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Filament, PrintJob, Printer, AppSettings, CostBreakdown, OtherMaterial } from '../types';
import { parseGcodeFile, GCodeStats } from '../services/gcodeParser';
// Added ArrowRight to the lucide-react imports
import { Clock, Scale, Calendar, FileCode, CheckCircle2, XCircle, Plus, ChevronRight, ArrowRight, Euro, AlertCircle, Save, Trash2, Search, X, RefreshCw, Printer as PrinterIcon, FileText, Zap, Hammer, Coins, Disc, Wrench, Percent, Tag, ArrowUpFromLine, Crown, Box, Package, Ruler, Sparkles, Info, AlertTriangle, Pipette, Trash } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Helper voor kleurgelijkheid
const getRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const getColorDistance = (hex1: string, hex2: string) => {
  const rgb1 = getRgb(hex1);
  const rgb2 = getRgb(hex2);
  if (!rgb1 || !rgb2) return 1000;
  return Math.sqrt(Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2));
};

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
  viewingJob: PrintJob | null;
  setViewingJob: (job: PrintJob | null) => void;
}

const FilamentPicker = ({ filaments, selectedId, onChange }: { filaments: Filament[], selectedId: string, onChange: (id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { t, tColor } = useLanguage();
  const selectedFilament = filaments.find(f => f.id === selectedId);
  const filtered = filaments.filter(f => !searchTerm || `${f.brand} ${f.colorName} ${f.shortId}`.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isOpen) {
    return (
      <div className="w-full bg-slate-100 dark:bg-slate-800 border border-blue-500 rounded-xl shadow-sm animate-fade-in z-20 relative">
        <div className="flex items-center p-2 border-b border-slate-200 dark:border-slate-700 gap-2">
           <Search size={16} className="text-slate-400" />
           <input autoFocus type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 bg-transparent outline-none text-sm dark:text-white" placeholder={t('searchPlaceholder')} />
           <button onClick={() => setIsOpen(false)} className="text-slate-400"><X size={16} /></button>
        </div>
        <div className="max-h-48 overflow-y-auto">
           {filtered.map(f => (
             <div key={f.id} onClick={() => { onChange(f.id); setIsOpen(false); }} className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 flex items-center justify-between">
               <div className="flex flex-col"><span className="text-sm font-bold dark:text-white">{f.brand} {tColor(f.colorName)}</span><span className="text-[10px] text-slate-500">{f.material} • {f.weightRemaining}g</span></div>
               <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: f.colorHex }} />
             </div>
           ))}
        </div>
      </div>
    );
  }
  return (
    <button onClick={() => setIsOpen(true)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl p-3 text-sm dark:text-white text-left flex items-center justify-between transition-all hover:border-blue-400">
      <span className="truncate flex items-center gap-2">
        {selectedFilament ? <><div className="w-3 h-3 rounded-full border shadow-sm" style={{ backgroundColor: selectedFilament.colorHex }} /><span>{selectedFilament.brand} {tColor(selectedFilament.colorName)}</span></> : <span className="text-slate-400 italic">-- {t('selectBrand')} --</span>}
      </span>
      <ChevronRight size={14} className="rotate-90 text-slate-400" />
    </button>
  );
};

export const PrintHistory: React.FC<PrintHistoryProps> = ({ filaments, materials, history, printers, onSaveJob, onDeleteJob, settings, isAdmin, onUnlockPro, viewingJob, setViewingJob }) => {
  const [showModal, setShowModal] = useState(false);
  const [parsing, setParsing] = useState(false);
  const { t, tColor } = useLanguage();
  
  const [jobName, setJobName] = useState('');
  const [printTime, setPrintTime] = useState('');
  const [status, setStatus] = useState<'success' | 'fail'>('success');
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [materialSlots, setMaterialSlots] = useState<any[]>([]);
  const [rawGcodeStats, setRawGcodeStats] = useState<GCodeStats | null>(null);

  // Smart Matching Logic with Unit/Slot separation
  const suggestFilament = (type: string, colorHex?: string, printerId?: string) => {
    const printer = printers.find(p => p.id === printerId);
    const THRESHOLD = 65; 

    if (printer && printer.hasAMS) {
      const amsMatches = printer.amsSlots
        .map((slot, idx) => {
           const filament = filaments.find(f => f.id === slot.filamentId);
           const unitNumber = Math.floor(idx / 4) + 1;
           const slotInUnit = (idx % 4) + 1;
           return { filament, unitNumber, slotInUnit };
        })
        .filter(m => m.filament && m.filament.material.toLowerCase().includes(type.toLowerCase()));
      
      if (colorHex && amsMatches.length > 0) {
        const bestAms = amsMatches.sort((a, b) => getColorDistance(colorHex, a.filament!.colorHex) - getColorDistance(colorHex, b.filament!.colorHex))[0];
        if (bestAms && getColorDistance(colorHex, bestAms.filament!.colorHex) < THRESHOLD) {
           return { id: bestAms.filament!.id, source: 'ams', unit: bestAms.unitNumber, slot: bestAms.slotInUnit };
        }
      } else if (amsMatches.length > 0) {
        return { id: amsMatches[0].filament!.id, source: 'ams', unit: amsMatches[0].unitNumber, slot: amsMatches[0].slotInUnit };
      }
    }

    const stockMatches = filaments.filter(f => f.material.toLowerCase().includes(type.toLowerCase()));
    if (colorHex && stockMatches.length > 0) {
      const bestStock = stockMatches.sort((a, b) => getColorDistance(colorHex, a.colorHex) - getColorDistance(colorHex, b.colorHex))[0];
      return { id: bestStock.id, source: 'stock' };
    } else if (stockMatches.length > 0) {
      return { id: stockMatches[0].id, source: 'stock' };
    }

    return null;
  };

  useEffect(() => {
    if (rawGcodeStats) {
       const matchedSlots = rawGcodeStats.materials.map((m) => {
         const suggestion = suggestFilament(m.type, m.color, selectedPrinterId);
         return {
           detectedType: m.type,
           detectedColor: m.color,
           weight: m.weight,
           waste: 0, // Nieuwe waste kolom, standaard 0
           assignedFilamentId: suggestion?.id || '',
           matchSource: suggestion?.source,
           matchUnit: suggestion?.unit,
           matchSlot: suggestion?.slot
         };
       });
       setMaterialSlots(matchedSlots);
    }
  }, [selectedPrinterId, rawGcodeStats]);

  const processFile = async (file: File) => {
    setParsing(true);
    setShowModal(true);
    setJobName(file.name.replace(/\.(gcode|bgcode)$/i, '').replace(/_/g, ' '));
    try {
      const stats = await parseGcodeFile(file);
      setPrintTime(stats.estimatedTime);
      setRawGcodeStats(stats);
    } catch (e: any) {
      alert("Fout: " + e.message);
    } finally {
      setParsing(false);
    }
  };

  const handleSave = () => {
    if (!jobName) return alert("Vul een naam in.");
    const deductions: any[] = [];
    const usedFilaments: any[] = [];
    let totalCost = 0;
    let totalWeightFinal = 0;

    materialSlots.forEach(slot => {
      if (slot.assignedFilamentId) {
        const f = filaments.find(fil => fil.id === slot.assignedFilamentId);
        if (f) {
          const totalSlotWeight = Number(slot.weight) + Number(slot.waste);
          const cost = (totalSlotWeight * (f.price || 0)) / f.weightTotal;
          totalCost += cost;
          totalWeightFinal += totalSlotWeight;
          deductions.push({ id: f.id, amount: totalSlotWeight });
          usedFilaments.push({ filamentId: f.id, amount: totalSlotWeight, colorHex: f.colorHex });
        }
      }
    });

    const newJob: PrintJob = {
      id: crypto.randomUUID(),
      name: jobName,
      date: new Date().toISOString(),
      printTime,
      totalWeight: totalWeightFinal,
      calculatedCost: totalCost,
      status,
      printerId: selectedPrinterId,
      usedFilaments,
      costBreakdown: { filamentCost: totalCost, electricityCost: 0, depreciationCost: 0, laborCost: 0 }
    };

    onSaveJob(newJob, deductions);
    setShowModal(false);
    setRawGcodeStats(null);
  };

  return (
    <div className="space-y-6 animate-fade-in relative h-full flex flex-col">
       <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('recentActivity')}</h3>
       </div>

       <div 
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) processFile(file); }}
          className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed p-10 text-center cursor-pointer hover:border-blue-500 transition-all group"
          onClick={() => document.getElementById('hist-file')?.click()}
       >
          <input type="file" id="hist-file" className="hidden" accept=".gcode,.bgcode" onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
             <FileCode size={32} />
          </div>
          <h3 className="text-lg font-bold dark:text-white">{t('logPrint')}</h3>
          <p className="text-slate-500 text-sm">{t('dragDrop')}</p>
       </div>

       <div className="flex-1 overflow-y-auto space-y-4">
          {history.length === 0 ? (
             <div className="py-20 text-center text-slate-400 italic text-sm">{t('noHistory')}</div>
          ) : history.map(job => {
            const printer = printers.find(p => p.id === job.printerId);
            return (
              <div key={job.id} onClick={() => setViewingJob(job)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-all">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${job.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {job.status === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate dark:text-white">{job.name}</h4>
                    {printer && (
                       <div className="flex gap-1.5 mt-1">
                          <span className="text-[8px] font-black bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase">{printer.brand}</span>
                          <span className="text-[8px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase">{printer.model}</span>
                       </div>
                    )}
                    <div className="flex gap-2 text-[10px] text-slate-500 mt-1 font-medium uppercase tracking-tighter">
                       <span>{job.totalWeight.toFixed(1)}g</span>
                       <span>•</span>
                       <span className="text-blue-500 font-bold">€{job.calculatedCost.toFixed(2)}</span>
                    </div>
                 </div>
                 <Trash2 size={16} className="text-slate-300 hover:text-red-500" onClick={(e) => { e.stopPropagation(); onDeleteJob(job.id); }} />
              </div>
            );
          })}
       </div>

       {showModal && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                   <h2 className="text-xl font-bold dark:text-white">{t('logPrint')}</h2>
                   <button onClick={() => { setShowModal(false); setRawGcodeStats(null); }}><X size={24} className="text-slate-400" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Projectnaam</label>
                         <input type="text" value={jobName} onChange={e => setJobName(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{t('printer')}</label>
                         <select value={selectedPrinterId} onChange={(e) => setSelectedPrinterId(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 dark:text-white outline-none">
                            <option value="">Kies printer...</option>
                            {printers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.brand} {p.model})</option>)}
                         </select>
                      </div>
                   </div>

                   {materialSlots.length > 1 && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex gap-3 animate-fade-in">
                         <AlertTriangle size={24} className="text-amber-600 shrink-0" />
                         <p className="text-xs text-amber-700 dark:text-amber-400 font-bold leading-relaxed">
                            <strong>Multi-color G-code</strong> bevat vaak enkel het model-gewicht. Vul de <strong>Waste</strong> kolom handmatig in (Flush, Poop & Tower) voor een kloppende voorraad.
                         </p>
                      </div>
                   )}

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verbruik per Materiaal</label>
                      {materialSlots.map((slot, index) => {
                         const totalForSlot = (Number(slot.weight) || 0) + (Number(slot.waste) || 0);
                         return (
                            <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                               <div className="flex justify-between items-center mb-3">
                                  <div className="flex items-center gap-2">
                                     {slot.detectedColor && <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: slot.detectedColor }} />}
                                     <span className="text-[11px] font-black dark:text-slate-300 uppercase">{slot.detectedType}</span>
                                  </div>
                                  {slot.matchSource === 'ams' ? (
                                     <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-200 uppercase">AMS {slot.matchUnit} - SLOT {slot.matchSlot}</span>
                                  ) : slot.matchSource === 'stock' ? (
                                     <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 uppercase">VOORRAAD MATCH</span>
                                  ) : (
                                     <span className="text-[9px] text-red-400 font-bold uppercase">GEEN MATCH</span>
                                  )}
                               </div>
                               
                               <div className="space-y-4">
                                  <FilamentPicker filaments={filaments} selectedId={slot.assignedFilamentId} onChange={(id) => {
                                     const newSlots = [...materialSlots];
                                     newSlots[index].assignedFilamentId = id;
                                     newSlots[index].matchSource = 'manual';
                                     setMaterialSlots(newSlots);
                                  }} />
                                  
                                  <div className="grid grid-cols-3 gap-3">
                                     <div className="relative">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Model (g)</label>
                                        <input type="number" value={slot.weight} onChange={(e) => { const n = [...materialSlots]; n[index].weight = e.target.value; setMaterialSlots(n); }} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold text-sm text-center dark:text-white" />
                                     </div>
                                     <div className="relative">
                                        <label className="text-[9px] font-bold text-orange-500 uppercase mb-1 block">Waste (g)</label>
                                        <input type="number" value={slot.waste} onChange={(e) => { const n = [...materialSlots]; n[index].waste = e.target.value; setMaterialSlots(n); }} className="w-full bg-white dark:bg-slate-900 border-2 border-orange-500/30 dark:border-orange-500/20 focus:border-orange-500 rounded-lg p-2 font-black text-sm text-center dark:text-orange-400 text-orange-600 outline-none" placeholder="0" />
                                     </div>
                                     <div className="flex flex-col justify-end pb-2">
                                        <div className="flex items-center gap-2 text-slate-400">
                                           <ArrowRight size={14}/>
                                           <span className="font-black text-sm dark:text-white">{totalForSlot.toFixed(1)}g</span>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                               
                               <button onClick={() => setMaterialSlots(materialSlots.filter((_, i) => i !== index))} className="mt-4 text-[10px] font-bold text-red-500 flex items-center gap-1 hover:underline">
                                  <Trash2 size={12} /> Verwijder slot
                               </button>
                            </div>
                         );
                      })}
                      <button onClick={() => setMaterialSlots([...materialSlots, { detectedType: 'PLA', weight: 0, waste: 0, assignedFilamentId: '' }])} className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400 text-[10px] font-black uppercase hover:border-blue-500 hover:text-blue-500 transition-all">+ Slot Toevoegen</button>
                   </div>
                </div>
                
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50">
                   <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                      <Save size={20} /> Opslaan & Voorraad Bijwerken
                   </button>
                </div>
             </div>
          </div>,
          document.body
       )}
    </div>
  );
};
