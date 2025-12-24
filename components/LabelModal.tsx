
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
        // Deep link URL for the app
        const url = `filament://${filament.shortId || filament.id.substring(0, 4)}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 512, // Higher resolution for cleaner logo overlay
          margin: 1,
          errorCorrectionLevel: 'H', // High error correction is vital when placing logos in the center
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
    
    // Create a temporary window for printing to ensure high quality and correct scale
    const canvas = await html2canvas(labelRef.current, { 
      scale: 3, 
      backgroundColor: '#ffffff',
      useCORS: true // Necessary if the custom logo is from a different origin
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [62, 29] // Standard small label size
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, 62, 29);
    pdf.autoPrint();
    window.open(pdf.output('bloburl'), '_blank');
  };

  const handleSaveImage = async () => {
    if (!labelRef.current || isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(labelRef.current, { 
        scale: 3, 
        backgroundColor: '#ffffff',
        useCORS: true
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
        
        {/* Top Header info matching screenshot */}
        <div className="text-center mb-8">
           <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">{filament.brand}</p>
           <h2 className="text-white text-2xl font-black">{tColor(filament.colorName)} {filament.material}</h2>
        </div>

        {/* The Label Card */}
        <div 
          ref={labelRef}
          className="bg-white rounded-lg p-4 flex items-center gap-4 shadow-2xl mb-10 w-full aspect-[2/1] relative overflow-hidden select-none"
        >
          {/* QR Code Section */}
          <div className="w-1/2 flex items-center justify-center">
             {qrDataUrl ? (
               <div className="relative w-full aspect-square flex items-center justify-center">
                 <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                 
                 {/* App Logo Overlay in center of QR */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[24%] h-[24%] bg-white rounded-full flex items-center justify-center p-0.5 shadow-sm border border-slate-100">
                       <Logo className="w-full h-full" strokeWidth={3} />
                    </div>
                 </div>
               </div>
             ) : (
               <div className="w-full h-full bg-slate-100 animate-pulse rounded" />
             )}
          </div>

          {/* Text Content Section */}
          <div className="w-1/2 flex flex-col justify-between h-full py-1">
             <div className="space-y-0.5">
                <h3 className="text-[#0f172a] font-black text-xl leading-none uppercase truncate">{filament.brand}</h3>
                <p className="text-[#0f172a] font-black text-sm leading-tight">{filament.material}</p>
                <p className="text-slate-500 font-bold text-[10px] leading-tight truncate">{tColor(filament.colorName)}</p>
             </div>
             
             <div className="mt-auto self-end">
                <span className="text-[#0f172a] font-black text-3xl tracking-tighter">
                  {filament.shortId || filament.id.substring(0, 4).toUpperCase()}
                </span>
             </div>
          </div>
        </div>

        {/* Action Buttons matching screenshot */}
        <div className="w-full space-y-3">
          <button 
            onClick={handlePrint}
            className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
          >
            <Printer size={24} />
            Print
          </button>
          <button 
            onClick={handleSaveImage}
            disabled={isGenerating}
            className={`w-full ${isSaved ? 'bg-emerald-600' : 'bg-[#2563eb] hover:bg-[#1d4ed8]'} text-white font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 text-lg disabled:opacity-70`}
          >
            {isGenerating ? <Loader2 size={24} className="animate-spin" /> : isSaved ? <Check size={24} /> : <Download size={24} />}
            {isSaved ? 'Saved!' : 'Save'}
          </button>
        </div>

        {/* Close Button Top Right */}
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
