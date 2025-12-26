import React, { useState } from 'react';
import { Sparkles, X, Check, Bell, Camera, ShieldCheck, Zap, Smartphone, Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';

interface UpdateModalProps {
  version: string;
  notes: string;
  downloadUrl?: string;
  onClose: (dontShowAgain: boolean) => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ version, notes, downloadUrl, onClose }) => {
  const { t } = useLanguage();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleDownload = () => {
    const url = downloadUrl || "https://github.com/timwillemse80-blip/Filament-Manager-2.1/releases";
    if (Capacitor.isNativePlatform()) {
      window.open(url, '_system');
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative flex flex-col animate-slide-in-up my-auto">
        
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-white/30">
              <Sparkles size={32} fill="white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-1">New Update!</h2>
            <p className="text-blue-100 font-bold opacity-90">Version {version}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[50vh]">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <Bell size={14} /> What's new?
            </h4>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-medium whitespace-pre-line">
              {notes}
            </p>
          </div>

          <div className="mt-6 space-y-4">
             <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                   <Camera size={18} />
                </div>
                <span>The camera scanner is fully restored and faster than ever.</span>
             </div>
             
             <button 
                onClick={handleDownload}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
             >
                <Smartphone size={18} />
                Update APK for Camera Fix
             </button>
          </div>
        </div>

        {/* Footer with checkbox */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            {/* Visual checkbox */}
            <div 
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${dontShowAgain ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-500'}`}
            >
              {dontShowAgain && <Check size={16} className="text-white" strokeWidth={4} />}
            </div>
            {/* Real checkbox hidden for accessibility but handling the click */}
            <input 
              type="checkbox" 
              className="hidden" 
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 select-none">
              I have read this, don't show again
            </span>
          </label>

          <button 
            onClick={() => onClose(dontShowAgain)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] text-lg"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};