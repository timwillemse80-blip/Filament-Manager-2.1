
import React, { useState, useMemo, useEffect } from 'react';
import { Filament, AppSettings } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Copy, Check, Globe, Eye, Share2, Filter, Info, ShieldCheck } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

interface ShowcaseModalProps {
  filaments: Filament[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
  onPreview: (filters: string[]) => void;
  userId?: string;
}

export const ShowcaseModal: React.FC<ShowcaseModalProps> = ({ filaments, settings, onUpdateSettings, onClose, onPreview, userId }) => {
  const { t } = useLanguage();
  const [activeMaterials, setActiveMaterials] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Extract unique materials
  const uniqueMaterials = useMemo(() => {
    const materials = new Set(filaments.map(f => f.material).filter(Boolean));
    return Array.from(materials).sort();
  }, [filaments]);

  const generateLink = () => {
     if (!userId) return "Log in om te delen";
     let url = `${window.location.origin}/?shop=${userId}`;
     if (activeMaterials.length > 0) {
        const joined = activeMaterials.map(m => encodeURIComponent(m)).join(',');
        url += `&materials=${joined}`;
     }
     return url;
  };

  const handleCopy = async () => {
     const link = generateLink();
     await navigator.clipboard.writeText(link);
     setCopiedLink(true);
     setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
     const link = generateLink();
     if (Capacitor.isNativePlatform()) {
        await Share.share({
           title: settings.showcasePublicName || 'Mijn Filament Voorraad',
           text: 'Bekijk mijn 3D filament voorraad:',
           url: link,
           dialogTitle: 'Deel Voorraad'
        });
     } else {
        handleCopy();
     }
  };

  const toggleMaterial = (mat: string) => {
     setActiveMaterials(prev => {
        if (prev.includes(mat)) return prev.filter(m => m !== mat);
        return [...prev, mat];
     });
  };

  // Ensure showcase is enabled when using this modal
  useEffect(() => {
     if (!settings.showcaseEnabled) {
        onUpdateSettings({ ...settings, showcaseEnabled: true });
     }
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
       <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
             <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <Globe size={20} className="text-blue-500" /> {t('showcaseTitle')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Deel je voorraad met anderen</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                <X size={24} />
             </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
             
             {/* Name Input */}
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('showcaseName')}</label>
                <input 
                   type="text" 
                   value={settings.showcasePublicName || ''}
                   onChange={(e) => onUpdateSettings({ ...settings, showcasePublicName: e.target.value })}
                   placeholder="bv. Tim's 3D Shop"
                   className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
             </div>

             {/* Filter Section */}
             <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                   <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <Filter size={14} /> Welk filament tonen?
                   </label>
                   <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                      {activeMaterials.length === 0 ? "Alles Tonen" : `${activeMaterials.length} Geselecteerd`}
                   </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                   {uniqueMaterials.map(mat => {
                      const isSelected = activeMaterials.includes(mat);
                      return (
                         <button 
                            key={mat}
                            onClick={() => toggleMaterial(mat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                               isSelected 
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                            }`}
                         >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                            {mat}
                         </button>
                      );
                   })}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic flex items-center gap-1">
                   <Info size={10} /> Selecteer materialen om de link te filteren. Niets geselecteerd = Alles zichtbaar.
                </p>
             </div>

             {/* Link & Actions */}
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Jouw Unieke Link</label>
                <div className="flex gap-2 mb-4">
                   <div className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center overflow-hidden">
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate select-all">{generateLink()}</span>
                   </div>
                   <button 
                      onClick={handleCopy}
                      className={`px-4 rounded-xl flex items-center justify-center transition-all font-bold ${
                         copiedLink 
                            ? 'bg-green-500 text-white shadow-lg scale-105' 
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                      }`}
                      title="Kopieer Link"
                   >
                      {copiedLink ? <Check size={20}/> : <Copy size={20}/>}
                   </button>
                   {Capacitor.isNativePlatform() && (
                      <button 
                         onClick={handleShare}
                         className="px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                      >
                         <Share2 size={20} />
                      </button>
                   )}
                </div>

                <button 
                   onClick={() => onPreview(activeMaterials)}
                   className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                   <Eye size={20} /> {t('previewShowcase')}
                </button>
             </div>

             <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-900/30 flex items-start gap-2">
                <ShieldCheck size={16} className="text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-green-800 dark:text-green-300 leading-tight">
                   <strong>Privacy Info:</strong> Bezoekers zien alleen merk, materiaal, kleur en beschikbaarheid. Prijzen, locaties en notities blijven altijd privé.
                </p>
             </div>

          </div>
       </div>
    </div>
  );
};
