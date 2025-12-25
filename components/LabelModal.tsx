
import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, Download, Check, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Filament } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

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

  const generateQrWithIcon = async (text: string) => {
    const canvas = document.createElement('canvas');
    const size = 800; 
    canvas.width = size;
    canvas.height = size;

    // Gebruik level 'M' voor minder complexiteit (grotere blokjes)
    // Margin 2 zorgt voor een betere 'quiet zone' voor de scanner
    await QRCode.toCanvas(canvas, text, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      }
    });

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const centerX = size / 2;
      const centerY = size / 2;
      // Iets kleiner icoon (20% ipv 25%) voor minder dataverlies
      const iconContainerSize = size * 0.20;
      
      // Teken een witte cirkel achter het icoon voor contrast
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, iconContainerSize / 2 + 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(centerX, centerY);
      const scale = (iconContainerSize * 0.8) / 24;
      ctx.scale(scale, scale);
      ctx.translate(-12, -12);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3; // Iets dikkere lijnen voor het icoon
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Teken Filament Icoon
      ctx.beginPath();
      ctx.arc(12, 12, 9, 0, Math.PI * 1.6);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(21, 12);
      ctx.lineTo(21, 4);
      ctx.lineTo(15, 4);
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(12, 12, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  };

  useEffect(() => {
    const code = (filament.shortId || filament.id.substring(0, 4)).toUpperCase();
    const url = `https://filamentmanager.nl/?code=${code}`;
    generateQrWithIcon(url).then(setQrDataUrl).catch(console.error);
  }, [filament]);

  const handlePrint = async () => {
    if (!labelRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(labelRef.current, { 
        scale: 4, 
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
        scale: 4, 
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1221]/98 backdrop-blur-xl p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg flex flex-col items-center">
        
        <div className="text-center mb-8">
           <h2 className="text-white text-xl font-black mb-1 uppercase tracking-widest">Etiket Preview</h2>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Geoptimaliseerd voor scans</p>
        </div>

        <div 
          ref={labelRef}
          style={{ 
            width: '620px', 
            height: '290px', 
            fontFamily: 'Arial, Helvetica, sans-serif',
            backgroundColor: '#ffffff'
          }}
          className="rounded-none flex items-stretch shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-12 relative select-none overflow-hidden origin-center scale-[0.45] xs:scale-[0.55] sm:scale-[0.75] md:scale-1"
        >
          <div className="w-[260px] flex items-center justify-center p-6 border-r-2 border-black">
             {qrDataUrl ? (
               <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
             ) : (
               <div className="w-full h-full bg-slate-100 animate-pulse" />
             )}
          </div>

          <div className="flex-1 flex flex-col p-8 text-black">
             <div className="flex-1">
                <div style={{ fontSize: '36px' }} className="font-bold uppercase leading-none mb-4 tracking-normal">
                  {filament.brand}
                </div>
                <div className="space-y-1">
                   <div style={{ fontSize: '28px' }} className="font-black uppercase tracking-wide">
                     {filament.material}
                   </div>
                   <div style={{ fontSize: '22px' }} className="font-medium opacity-90">
                     {tColor(filament.colorName)}
                   </div>
                </div>
             </div>

             <div className="flex justify-end items-end mt-auto pt-4 border-t-4 border-black">
                <div style={{ fontSize: '115px' }} className="font-bold leading-[0.5] tracking-tighter">
                   {filament.shortId || filament.id.substring(0, 4).toUpperCase()}
                </div>
             </div>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3 -mt-20 sm:-mt-10 md:mt-0 pb-10">
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
          <button 
            onClick={onClose}
            className="w-full py-3 text-slate-400 hover:text-white font-bold text-sm"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
};
