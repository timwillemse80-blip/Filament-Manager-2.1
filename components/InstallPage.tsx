import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { Download, CheckCircle2, Wifi, Zap, Share, PlusSquare, ArrowRight, Smartphone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface InstallPageProps {
  onInstall: () => void;
  installPrompt: any;
  onClose: () => void;
}

export const InstallPage: React.FC<InstallPageProps> = ({ onInstall, installPrompt, onClose }) => {
  const { t } = useLanguage();
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Detect if already installed/standalone
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isInStandaloneMode);
  }, []);

  const handleDownloadApk = () => {
    const releaseUrl = "https://github.com/timwillemse80/Filament-Manager-2.1";
    window.open(releaseUrl, '_blank');
  };

  if (isStandalone) {
     return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
           <div className="text-center max-w-md w-full">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 size={48} className="text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">App is geïnstalleerd!</h1>
              <p className="text-slate-600 dark:text-slate-400 mb-8">Je gebruikt de app al in volledige modus.</p>
              <button onClick={onClose} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-500 transition-colors">
                 Ga naar Dashboard
              </button>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-600 to-transparent opacity-10 pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20 pointer-events-none" />
      
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-10 animate-fade-in">
         
         <div className="p-8 text-center border-b border-slate-100 dark:border-slate-700/50">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
               <Logo className="w-16 h-16" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Filament Manager</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">De ultieme app voor je 3D voorraad.</p>
         </div>

         <div className="p-8 space-y-6">
            <div className="space-y-4">
               <div className="flex items-center gap-4 text-left">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                     <Wifi size={24} />
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-800 dark:text-white">Offline Modus</h3>
                     <p className="text-xs text-slate-500 dark:text-slate-400">Werkt ook zonder internetverbinding.</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 text-left">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
                     <Zap size={24} />
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-800 dark:text-white">Supersnel</h3>
                     <p className="text-xs text-slate-500 dark:text-slate-400">Start direct op, net als een native app.</p>
                  </div>
               </div>
            </div>

            <div className="pt-4 space-y-3">
               {installPrompt ? (
                  <>
                    <button 
                       onClick={onInstall}
                       className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg animate-pulse-soft"
                    >
                       <Download size={24} /> Installeer App
                    </button>
                    {!isIOS && (
                        <button 
                           onClick={handleDownloadApk}
                           className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                           <Smartphone size={18} /> Download APK (Android)
                        </button>
                    )}
                  </>
               ) : isIOS ? (
                  <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 text-left">
                     <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-sm">Installeren op iOS:</h4>
                     <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-decimal pl-4">
                        <li>Tik onderin op de <strong>Deel-knop</strong> <Share size={12} className="inline"/></li>
                        <li>Scroll omlaag en kies <strong>"Zet op beginscherm"</strong> <PlusSquare size={12} className="inline"/></li>
                        <li>Tik op <strong>"Voeg toe"</strong>.</li>
                     </ol>
                  </div>
               ) : (
                  <div className="text-center space-y-3">
                     <p className="text-sm text-slate-500 mb-2">Je browser ondersteunt automatische installatie niet of de app is al geïnstalleerd.</p>
                     
                     <button 
                        onClick={handleDownloadApk}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                     >
                        <Smartphone size={20} /> Download APK
                     </button>

                     <button onClick={onClose} className="text-blue-500 font-bold text-sm hover:underline flex items-center justify-center gap-1">
                        Ga direct naar de webversie <ArrowRight size={14}/>
                     </button>
                  </div>
               )}
            </div>
         </div>
      </div>
      
      <p className="mt-8 text-xs text-slate-400 text-center max-w-xs leading-relaxed">
         Deze app gebruikt de nieuwste PWA-technologie voor een app-store ervaring direct vanuit je browser.
      </p>
    </div>
  );
};