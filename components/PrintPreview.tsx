import React, { useState, useMemo } from 'react';
import { Filament, Printer } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { FileCode, Loader2, CheckCircle2, AlertTriangle, XCircle, Printer as PrinterIcon, Package, Disc, ChevronRight, Layers, Trash2, Sparkles, ArrowRight } from 'lucide-react';
import { parseGcodeFile } from '../services/gcodeParser';

interface PrintPreviewProps {
  filaments: Filament[];
  printers: Printer[];
  onNavigate: (view: any) => void;
}

// Helper to calculate color similarity
const getRgb = (hex: string) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const getColorDistance = (hex1: string, hex2: string) => {
  const rgb1 = getRgb(hex1);
  const rgb2 = getRgb(hex2);
  if (!rgb1 || !rgb2) return 1000;
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
};

export const PrintPreview: React.FC<PrintPreviewProps> = ({ filaments, printers, onNavigate }) => {
  const { t, tColor } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedPrinterId, setSelectedPrinterId] = useState('');
  const [parsedData, setParsedData] = useState<{
    fileName: string;
    totalWeight: number;
    materials: { type: string; weight: number; color?: string }[];
  } | null>(null);

  const selectedPrinter = useMemo(() => 
    printers.find(p => p.id === selectedPrinterId), [printers, selectedPrinterId]
  );

  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    try {
      const stats = await parseGcodeFile(file);
      setParsedData({
        fileName: file.name,
        totalWeight: stats.totalWeight,
        materials: stats.materials
      });
    } catch (e: any) {
      alert(e.message || "Fout bij laden van bestand.");
    } finally {
      setIsParsing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  // Improved matching logic: Type + Color Similarity
  const findBestProposal = (type: string, gcodeColorHex?: string, printer?: Printer) => {
    const COLOR_MATCH_THRESHOLD = 60; // Distance threshold for "perfect" or "good" match

    // Helper to score a filament
    const scoreFilament = (f: Filament) => {
      if (!f.material.toLowerCase().includes(type.toLowerCase())) return -1;
      let score = 100;
      if (gcodeColorHex && f.colorHex) {
        const dist = getColorDistance(gcodeColorHex, f.colorHex);
        score -= (dist / 5); // Subtract score based on color distance
      }
      return score;
    };

    // 1. Check AMS Slots
    if (printer && printer.hasAMS) {
      const amsMatches = printer.amsSlots
        .map(slot => {
          const f = filaments.find(fil => fil.id === slot.filamentId);
          return f ? { filament: f, slot: slot.slotNumber, score: scoreFilament(f) } : null;
        })
        .filter(m => m !== null && m.score > 0)
        .sort((a, b) => b!.score - a!.score);

      if (amsMatches.length > 0) {
        const best = amsMatches[0]!;
        const dist = gcodeColorHex && best.filament.colorHex ? getColorDistance(gcodeColorHex, best.filament.colorHex) : 0;
        return { 
          filament: best.filament, 
          source: 'ams' as const, 
          isPerfect: dist < COLOR_MATCH_THRESHOLD, 
          slot: best.slot 
        };
      }
    }

    // 2. Check Stock
    const stockMatches = filaments
      .map(f => ({ filament: f, score: scoreFilament(f) }))
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score);

    if (stockMatches.length > 0) {
      const best = stockMatches[0];
      const dist = gcodeColorHex && best.filament.colorHex ? getColorDistance(gcodeColorHex, best.filament.colorHex) : 0;
      return { 
        filament: best.filament, 
        source: 'stock' as const, 
        isPerfect: dist < COLOR_MATCH_THRESHOLD 
      };
    }

    return null;
  };

  const results = useMemo(() => {
    if (!parsedData) return [];

    return parsedData.materials.map(m => {
      const proposal = findBestProposal(m.type, m.color, selectedPrinter);
      const totalReq = m.weight * quantity;
      const hasStock = proposal ? proposal.filament.weightRemaining >= totalReq : false;
      
      return {
        ...m,
        totalReq,
        proposal,
        hasStock
      };
    });
  }, [parsedData, filaments, quantity, selectedPrinter]);

  const allOk = !!selectedPrinter && results.length > 0 && results.every(r => r.hasStock && (selectedPrinter.hasAMS ? r.proposal?.source === 'ams' : true));

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20 px-1">
      
      {!parsedData ? (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`
            bg-white dark:bg-slate-800 rounded-3xl border-4 border-dashed p-12 text-center transition-all cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'}
          `}
          onClick={() => document.getElementById('gcode-upload')?.click()}
        >
          <input 
            type="file" 
            id="gcode-upload" 
            className="hidden" 
            accept=".gcode,.bgcode" 
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
          />
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
            {isParsing ? <Loader2 size={40} className="animate-spin" /> : <FileCode size={40} />}
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('dropGcode')}</h3>
          <p className="text-slate-500 dark:text-slate-400">{t('autoCalculatedDesc')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div className="flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400">
                   <FileCode size={24} />
                </div>
                <div className="min-w-0">
                   <h3 className="font-bold text-lg dark:text-white truncate">{parsedData.fileName}</h3>
                   <p className="text-sm text-slate-500">{parsedData.totalWeight.toFixed(1)}g {t('totalWeight')}</p>
                </div>
             </div>
             <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => setParsedData(null)}
                  className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
               <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t('configuration')}</h4>
                  
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('printQuantity')}</label>
                        <div className="flex items-center bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full overflow-hidden">
                           <button 
                              onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
                           >-</button>
                           <input 
                              type="number" 
                              value={quantity} 
                              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                              className="min-w-0 flex-1 text-center bg-transparent font-black text-lg dark:text-white outline-none"
                           />
                           <button 
                              onClick={() => setQuantity(quantity + 1)} 
                              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-sm"
                           >+</button>
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('printers')}</label>
                        <select 
                           value={selectedPrinterId}
                           onChange={(e) => setSelectedPrinterId(e.target.value)}
                           className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                           <option value="">{t('selectPrinterFirst')}</option>
                           {printers.map(p => (
                             <option key={p.id} value={p.id}>
                               {p.name} ({p.brand} {p.model})
                             </option>
                           ))}
                        </select>
                     </div>
                  </div>
               </div>

               {!selectedPrinter ? (
                  <div className="p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center text-center shadow-sm">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center mb-3">
                       <PrinterIcon size={28} />
                    </div>
                    <h4 className="font-bold text-slate-500">{t('waitingForPrinter')}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">{t('waitingForPrinterDesc')}</p>
                  </div>
               ) : (
                  <div className={`p-6 rounded-2xl border-2 flex flex-col items-center text-center shadow-lg transition-all ${allOk ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'}`}>
                    {allOk ? (
                       <>
                          <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mb-3 shadow-green-500/40 shadow-lg">
                             <CheckCircle2 size={28} strokeWidth={3} />
                          </div>
                          <h4 className="font-black text-green-700 dark:text-green-400 uppercase tracking-tighter text-lg">{t('readyToPrint')}</h4>
                       </>
                    ) : (
                       <>
                          <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center mb-3 shadow-red-500/40 shadow-lg">
                             <AlertTriangle size={28} strokeWidth={3} />
                          </div>
                          <h4 className="font-black text-red-700 dark:text-red-400 uppercase tracking-tighter text-lg">{t('notReadyToPrint')}</h4>
                          <p className="text-[10px] text-red-600/70 dark:text-red-400/70 mt-1 font-medium">{t('checkAlertsBelow')}</p>
                       </>
                    )}
                  </div>
               )}
            </div>

            <div className="md:col-span-2 space-y-4">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('checkStock')}</h4>
               
               <div className="space-y-4">
                  {results.map((res, idx) => (
                     <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group">
                        {/* Header Materiaal uit G-code */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
                           <div className="flex items-center gap-2">
                              {res.color && <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{backgroundColor: res.color}} />}
                              <span className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{res.type}</span>
                           </div>
                           <div className="text-right">
                              <span className="text-[10px] font-black text-slate-400 uppercase block leading-none mb-1">{t('totalRequired')}</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">{res.totalReq.toFixed(1)}g</span>
                           </div>
                        </div>
                        
                        <div className="p-5 flex flex-col sm:flex-row gap-6 relative">
                           {/* Voorstel / Voorraad Item */}
                           <div className="flex-1 flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${res.hasStock ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                                 <Package size={24} />
                              </div>
                              <div className="min-w-0">
                                 <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{t('stock')}</span>
                                    {res.proposal?.isPerfect && <span className="text-[9px] font-black bg-emerald-500 text-white px-1.5 rounded flex items-center gap-1 uppercase tracking-tighter"><Sparkles size={8}/> {t('perfectMatch')}</span>}
                                 </div>
                                 <h5 className="font-bold text-sm truncate dark:text-white leading-tight">
                                    {res.proposal ? `${res.proposal.filament.brand} ${tColor(res.proposal.filament.colorName)}` : t('noMatchingSpool')}
                                 </h5>
                                 <div className="flex items-center gap-1.5 mt-1">
                                    {res.hasStock ? (
                                       <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                          <CheckCircle2 size={10} /> {t('inStock')} ({Math.round(res.proposal?.filament.weightRemaining || 0)}g)
                                       </span>
                                    ) : (
                                       <span className="text-[11px] text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                                          <XCircle size={10} /> {t('insufficientStock')}
                                       </span>
                                    )}
                                 </div>
                              </div>
                           </div>

                           {/* AMS / CFS Voorstel Koppeling */}
                           {selectedPrinter?.hasAMS && (
                              <div className="flex-1 flex items-center gap-4 border-l border-slate-100 dark:border-slate-700 pl-6 border-dashed">
                                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${res.proposal?.source === 'ams' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                                    <Disc size={24} />
                                 </div>
                                 <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-0.5">{t('proposedSlot')}</span>
                                    {res.proposal?.source === 'ams' ? (
                                       <div className="flex items-center gap-2">
                                          <h5 className="font-black text-lg text-blue-600 dark:text-blue-400 leading-none">{t('slot')} {res.proposal.slot}</h5>
                                          <div className="bg-blue-500 text-white p-0.5 rounded-full"><CheckCircle2 size={12}/></div>
                                       </div>
                                    ) : (
                                       <div className="flex flex-col">
                                          <h5 className="font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                             <AlertTriangle size={14} /> {t('loadFromStock')}
                                          </h5>
                                          <p className="text-[9px] text-slate-400 font-medium">{t('notInAms')}</p>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           )}

                           {/* Pijltje visueel op desktop */}
                           <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-200 dark:text-slate-700">
                              <ArrowRight size={20} />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};