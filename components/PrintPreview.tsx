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
      alert(e.message || t('aiError'));
    } finally {
      setIsParsing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const findBestProposal = (type: string, gcodeColorHex?: string, printer?: Printer) => {
    const COLOR_MATCH_THRESHOLD = 60;

    const scoreFilament = (f: Filament) => {
      if (!f.material.toLowerCase().includes(type.toLowerCase())) return -1;
      let score = 100;
      if (gcodeColorHex && f.colorHex) {
        const dist = getColorDistance(gcodeColorHex, f.colorHex);
        score -= (dist / 5);
      }
      return score;
    };

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
        
        // Calculate unit and local slot for CFS/AMS display
        const unit = Math.ceil(best.slot / 4);
        const localSlot = ((best.slot - 1) % 4) + 1;

        return { 
          filament: best.filament, 
          source: 'ams' as const, 
          isPerfect: dist < COLOR_MATCH_THRESHOLD, 
          slot: best.slot,
          locationLabel: `CFS/AMS ${unit} - Slot ${localSlot}`
        };
      }
    }

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
        isPerfect: dist < COLOR_MATCH_THRESHOLD,
        locationLabel: t('inventory')
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

  const allReady = results.length > 0 && results.every(r => r.hasStock && r.proposal?.source === 'ams');

  if (!parsedData) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div 
          onDragOver={onDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`
            bg-white dark:bg-slate-800 rounded-3xl border-4 border-dashed p-12 text-center transition-all cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400'}
          `}
          onClick={() => document.getElementById('gcode-upload')?.click()}
        >
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileCode size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{t('printPreview')}</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">{t('dropGcode')}</p>
          <input 
            type="file" 
            id="gcode-upload" 
            className="hidden" 
            accept=".gcode,.bgcode" 
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
          />
        </div>
        
        {isParsing && (
          <div className="flex flex-col items-center gap-3 text-blue-500 font-bold">
            <Loader2 className="animate-spin" size={32} />
            <span>{t('analyzingGcode')}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                <FileCode size={24} />
             </div>
             <div>
                <h2 className="font-bold text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-xs">{parsedData.fileName}</h2>
                <p className="text-xs text-slate-500">{parsedData.totalWeight.toFixed(1)}g total</p>
             </div>
          </div>
          <button onClick={() => setParsedData(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">{t('printers')}</label>
                 <select 
                   value={selectedPrinterId}
                   onChange={e => setSelectedPrinterId(e.target.value)}
                   className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                 >
                   <option value="">{t('selectPrinterFirst')}</option>
                   {printers.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.hasAMS ? '(CFS/AMS)' : ''}</option>
                   ))}
                 </select>
              </div>
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">{t('printQuantity')}</label>
                 <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold dark:text-white">-</button>
                    <div className="flex-1 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-black text-xl dark:text-white">{quantity}</div>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold dark:text-white">+</button>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                 <Package size={16} /> {t('checkStock')}
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                 {results.map((res, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col md:flex-row gap-6">
                       <div className="w-full md:w-48 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-4 md:pb-0 md:pr-4">
                          <span className="text-[10px] font-black uppercase text-slate-400 mb-1">{t('requiredFilament')}</span>
                          <div className="flex items-center gap-2 mb-2">
                             {res.color && <div className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: res.color }} />}
                             <span className="font-bold dark:text-white">{res.type}</span>
                          </div>
                          <div className="text-sm text-slate-500 font-medium">
                             {res.totalReq.toFixed(1)}g <span className="text-[10px] uppercase opacity-60">({t('totalRequired')})</span>
                          </div>
                       </div>

                       <div className="flex-1 flex flex-col justify-center">
                          {res.proposal ? (
                             <div className="flex items-center gap-4">
                                <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-1">
                                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: res.proposal.filament.colorHex }} />
                                      <span className="text-sm font-bold dark:text-slate-200">{res.proposal.filament.brand} {tColor(res.proposal.filament.colorName)}</span>
                                   </div>
                                   <div className="flex flex-wrap gap-2">
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${res.hasStock ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                         {res.hasStock ? <CheckCircle2 size={10}/> : <AlertTriangle size={10}/>}
                                         {res.hasStock ? t('inStock') : t('insufficientStock')}
                                      </span>
                                      
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${res.proposal.source === 'ams' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                         <Disc size={10} />
                                         {res.proposal.locationLabel}
                                      </span>

                                      {!res.proposal.isPerfect && (
                                         <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                                            <Sparkles size={10} /> {t('colorMismatch')}
                                         </span>
                                      )}
                                   </div>
                                </div>
                             </div>
                          ) : (
                             <div className="flex items-center gap-2 text-slate-400 italic text-sm">
                                <XCircle size={18} /> {t('noMatchingSpool')}
                             </div>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className={`p-6 rounded-3xl border-2 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all ${allReady ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-center gap-4 text-center sm:text-left">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${allReady ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    {allReady ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
                 </div>
                 <div>
                    <h3 className={`text-xl font-black ${allReady ? 'text-green-700 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
                       {allReady ? t('readyToPrint') : t('notReadyToPrint')}
                    </h3>
                    <p className="text-sm opacity-70 dark:text-slate-300">
                       {allReady ? 'All materials are available in the CFS/AMS.' : t('checkAlertsBelow')}
                    </p>
                 </div>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                 <button 
                    onClick={() => onNavigate('history')}
                    className="flex-1 sm:flex-none px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98]"
                 >
                    {t('logPrint')} <ArrowRight size={20} />
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};