
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
        const url = `filament://${filament.shortId || filament.id.substring(0, 4)}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 512, 
          margin: 1,
          errorCorrectionLevel: 'H', 
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
      // Forceer resolutie voor exacte 62x29mm verhouding
      const canvas = await html2canvas(labelRef.current, { 
        scale: 3, 
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: 620, // 62mm equivalent
        height: 290  // 29mm equivalent
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
      
      const blobUrl = pdf.output('bloburl');
      window.open(blobUrl, '_blank');
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
        scale: 4, 
        backgroundColor: '#ffffff',
        useCORS: true,
        width: 620,
        height: 290
      });
      const link = document.createElement('a');
      link.download = `label-${filament.brand}-${filament.colorName}.png`;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1221]/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        <div className="text-center mb-8">
           <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">{filament.brand}</p>
           <h2 className="text-white text-2xl font-black">{tColor(filament.colorName)} {filament.material}</h2>
        </div>

        {/* 62mm x 29mm Label Container (fixed pixels for capture) */}
        <div 
          ref={labelRef}
          style={{ width: '620px', height: '290px' }}
          className="bg-white rounded-none p-8 flex items-start gap-8 shadow-2xl mb-10 relative select-none overflow-hidden origin-center scale-[0.5] sm:scale-[0.6] md:scale-1"
        >
          {/* QR Code Section */}
          <div className="w-[200px] flex items-center justify-center self-center">
             {qrDataUrl ? (
               <div className="relative w-full aspect-square flex items-center justify-center">
                 <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                 
                 {/* App Logo Overlay */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[28%] h-[28%] bg-white rounded-full flex items-center justify-center p-0.5 shadow-sm border border-white/50">
                       <Logo className="w-full h-full text-black" strokeWidth={3} />
                    </div>
                 </div>
               </div>
             ) : (
               <div className="w-full h-full bg-slate-50 animate-pulse rounded" />
             )}
          </div>

          {/* Text Content Section */}
          <div className="flex-1 flex flex-col h-full py-2">
             <div className="space-y-2">
                <h3 className="text-[#0f172a] font-black text-4xl leading-tight uppercase italic tracking-tighter truncate">
                  {filament.brand}
                </h3>
                <div className="space-y-1">
                   <p className="text-[#1e293b] font-black text-2xl leading-tight uppercase">
                     {filament.material}
                   </p>
                   <p className="text-slate-500 font-bold text-lg leading-tight">
                     {tColor(filament.colorName)}
                   </p>
                </div>
             </div>
             
             {/* ID Code with extra safe padding for physical printer edges */}
             <div className="absolute bottom-6 right-8 flex justify-end">
                <span className="text-[#0f172a] font-black text-7xl tracking-tighter leading-[0.75] pb-2">
                  {filament.shortId || filament.id.substring(0, 4).toUpperCase()}
                </span>
             </div>
          </div>
        </div>

        <div className="w-full space-y-3 -mt-20 sm:-mt-10 md:mt-0">
          <button 
            onClick={handlePrint}
            disabled={isGenerating}
            className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 text-lg disabled:opacity-70"
          >
            {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Printer size={24} />}
            Print Label (62x29mm)
          </button>
          <button 
            onClick={handleSaveImage}
            disabled={isGenerating}
            className={`w-full ${isSaved ? 'bg-emerald-600' : 'bg-[#2563eb] hover:bg-[#1d4ed8]'} text-white font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 text-lg disabled:opacity-70`}
          >
            {isGenerating ? <Loader2 size={24} className="animate-spin" /> : isSaved ? <Check size={24} /> : <Download size={24} />}
            {isSaved ? 'Saved!' : 'Save Image'}
          </button>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
        >
          <X size={32} />
        </button>
      </div>
    </div>
  );
};
