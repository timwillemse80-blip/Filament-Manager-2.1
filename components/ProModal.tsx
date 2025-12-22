import React from 'react';
import { X, Crown, Calculator, Box, Globe, BarChart3, Infinity as InfinityIcon, Clock, Bell } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ProModalProps {
  onClose: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({ onClose }) => {
  const { t } = useLanguage();

  const features = [
    {
      icon: <InfinityIcon className="text-amber-500" size={20} />,
      title: "Onbeperkte Voorraad",
      desc: "Verwijder de limiet van 50 spoelen en voeg onbeperkt printers toe."
    },
    {
      icon: <Calculator className="text-blue-500" size={20} />,
      title: "Geavanceerde Calculator",
      desc: "Bereken exact je kosten inclusief stroom, arbeid en afschrijving."
    },
    {
      icon: <Box className="text-purple-500" size={20} />,
      title: "Materialen Beheer",
      desc: "Houd ook je boutjes, moeren en elektronica voorraad bij."
    },
    {
      icon: <Globe className="text-emerald-500" size={20} />,
      title: "Publieke Showcase",
      desc: "Deel je beschikbare kleuren en materialen met klanten of vrienden."
    },
    {
      icon: <BarChart3 className="text-orange-500" size={20} />,
      title: "Data Export",
      desc: "Exporteer je volledige printgeschiedenis naar CSV voor Excel."
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative flex flex-col max-h-[90vh]">
        
        {/* Decorative Header */}
        <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 p-8 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-black/10 rounded-full blur-3xl" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-white/30">
              <Crown size={32} fill="white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-1">Upgrade naar PRO</h2>
            <p className="text-amber-100 font-medium">De ultieme toolkit voor de serieuze maker</p>
          </div>
        </div>

        {/* Development Alert */}
        <div className="px-6 pt-6 flex-shrink-0">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 flex gap-4 items-start">
            <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-xl text-blue-600 dark:text-blue-400">
              <Clock size={20} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">Binnenkort Beschikbaar</h4>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed mt-0.5">
                We zijn momenteel druk bezig om deze functies volledig te ontwikkelen. Word nu alvast PRO supporter en krijg direct toegang zodra ze live gaan!
              </p>
            </div>
          </div>
        </div>

        {/* Feature List */}
        <div className="p-6 md:p-8 overflow-y-auto scrollbar-hide">
          <div className="space-y-5">
            {features.map((f, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{f.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer / CTA */}
        <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="text-center">
            <button 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
              onClick={onClose}
            >
              <Bell size={20} fill="white" />
              Hou mij op de hoogte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};