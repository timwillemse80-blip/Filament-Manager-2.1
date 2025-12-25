
import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, Download, Check, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Filament } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Logo } from './Logo';

interface LabelModalProps {
  filament: Filament;
  onClose: () => void;
}

export const LabelModal: React.FC<LabelModalProps> = ({ filament, onClose }) => {
  const { t, tColor } = useLanguage();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateQR = async () => {
      try {
        // Gebruik de shortId of de eerste 4 tekens van het ID
        const code = filament.shortId || filament.id.substring(0, 4).toUpperCase();
        const url = `filament://${code}`;
        
        const dataUrl = await QRCode.toDataURL(url, {
          width: 600, 
          margin: 0, // Geen marge in de QR zelf, regelen we met CSS
          errorCorrectionLevel: 'M', // Medium error correction is optimaal voor deze grootte
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error(err);
      }
    };
    generateQR();
  }, [filament]);

  const handlePrint = async () => {
    if (!labelRef.current) return;
    setIsGenerating(true);
    
    try {
      const canvas = await html2canvas(labelRef.current, { 
        scale: 5, // Extreem hoge schaal voor messcherpe QR en tekst
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: 620,
        height: 290
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [62, 29],
        compress: true
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 62, 29);
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveImage = async () => {
    if (!labelRef.current || isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(labelRef.current, { 
        scale: 5, 
        backgroundColor: '#ffffff',
        useCORS: true,
        width: 620,
        height: 290
      });
      const link = document.createElement('a');
      link.download = `label-${filament.brand}-${filament.shortId || 'code'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1221]/98 backdrop-blur-xl p-4 animate-fade-in">
      <div className="w-full max-w-lg flex flex-col items-center">
        
        {/* Preview Header */}
        <div className="text-center mb-6">
           <h2 className="text-white text-xl font-black mb-1 uppercase tracking-tighter">Label Preview</h2>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{filament.brand} • {filament.material}</p>
        </div>

        {/* Optimale Label Container */}
        <div 
          ref={labelRef}
          style={{ width: '620px', height: '290px' }}
          className="bg-white rounded-none flex items-stretch shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-12 relative select-none overflow-hidden origin-center scale-[0.5] sm:scale-[0.7] md:scale-1"
        >
          {/* QR Code Sectie (Links) - Maximale ruimte zonder logo-overlay voor beste scanbaarheid */}
          <div className="w-[260px] flex items-center justify-center bg-white p-4">
             {qrDataUrl ? (
               <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
             ) : (
               <div className="w-full h-full bg-slate-50 animate-pulse" />
             )}
          </div>

          {/* Informatie Sectie (Rechts) */}
          <div className="flex-1 flex flex-col justify-between py-6 pr-8 pl-2">
             <div className="space-y-1">
                <div className="flex items-center justify-between">
                   <h3 className="text-black font-black text-4xl leading-none uppercase italic tracking-tighter truncate max-w-[280px]">
                     {filament.brand}
                   </h3>
                </div>
                <div className="pt-2">
                   <p className="text-black font-extrabold text-2xl leading-tight uppercase">
                     {filament.material}
                   </p>
                   <p className="text-black font-bold text-xl leading-tight">
                     {tColor(filament.colorName)}
                   </p>
                </div>
             </div>
             
             {/* Grote ID code onderin met extra padding om clipping te voorkomen */}
             <div className="flex justify-end items-baseline gap-2">
                <span className="text-black font-black text-[92px] tracking-tighter leading-[0.7] pb-4">
                  {filament.shortId || filament.id.substring(0, 4).toUpperCase()}
                </span>
             </div>
          </div>

          {/* Kleine App Logo Branding in de hoek (Niet in de QR) */}
          <div className="absolute top-4 right-4 opacity-10">
             <Logo className="w-8 h-8 text-black" strokeWidth={4} />
          </div>
        </div>

        {/* Acties */}
        <div className="w-full max-w-sm space-y-3 -mt-24 sm:-mt-16 md:mt-0">
          <button 
            onClick={handlePrint}
            disabled={isGenerating}
            className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 text-lg disabled:opacity-70"
          >
            {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Printer size={24} />}
            Print naar Labelprinter
          </button>
          <button 
            onClick={handleSaveImage}
            disabled={isGenerating}
            className={`w-full ${isSaved ? 'bg-emerald-600' : 'bg-[#2563eb] hover:bg-[#1d4ed8]'} text-white font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 text-lg disabled:opacity-70`}
          >
            {isGenerating ? <Loader2 size={24} className="animate-spin" /> : isSaved ? <Check size={24} /> : <Download size={24} />}
            {isSaved ? 'Opgeslagen!' : 'Opslaan als Afbeelding'}
          </button>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-2"
        >
          <X size={32} />
        </button>
      </div>
    </div>
  );
};
