import React from 'react';
import { Coffee, Heart, Star, Sparkles, Zap, ShieldCheck, Rocket, Server } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '../contexts/LanguageContext';
import { DISCORD_INVITE_URL } from '../constants';

const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/filamentmanager";

const DiscordIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z"/>
  </svg>
);

interface SupportPageProps {
  isAdmin?: boolean;
}

export const SupportPage: React.FC<SupportPageProps> = ({ isAdmin }) => {
  const { t } = useLanguage();

  const openDonationLink = () => {
    if (Capacitor.isNativePlatform()) {
       window.open(BUY_ME_A_COFFEE_URL, '_system');
    } else {
       window.open(BUY_ME_A_COFFEE_URL, '_blank');
    }
  };

  const openDiscord = () => {
    if (Capacitor.isNativePlatform()) {
       window.open(DISCORD_INVITE_URL, '_system');
    } else {
       window.open(DISCORD_INVITE_URL, '_blank');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20 pt-4 px-4">
      {/* Header */}
      <div className="text-center space-y-4">
         <div className="inline-block relative">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shadow-sm mx-auto animate-pulse-soft">
               <Coffee size={40} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="absolute -top-2 -right-2">
               <Heart size={24} className="text-red-500 fill-red-500 animate-bounce" />
            </div>
         </div>
         
         <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            {t('supportPageTitle')}
         </h2>
         <p className="text-slate-600 dark:text-slate-300 text-lg max-w-md mx-auto leading-relaxed">
            {t('supportPageSubtitle')}
         </p>
      </div>

      {/* Main Support Cards */}
      <div className="grid md:grid-cols-2 gap-4">
         {/* Coffee / Donation */}
         <button 
            onClick={openDonationLink}
            className="group relative bg-gradient-to-br from-amber-400 to-orange-500 p-1 rounded-3xl shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
         >
            <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 h-full flex flex-col items-center text-center relative z-10">
               <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400">
                  <Coffee size={28} />
               </div>
               <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('donateButton')}</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
                  {t('serverCostsDesc')}
               </p>
               <span className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm font-bold">
                  {t('donateButton')} <Heart size={14} className="fill-current" />
               </span>
            </div>
         </button>

         {/* Discord Community */}
         <button 
            onClick={openDiscord}
            className="group relative bg-gradient-to-br from-[#5865F2] to-[#404EED] p-1 rounded-3xl shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
         >
            <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 h-full flex flex-col items-center text-center relative z-10">
               <div className="w-14 h-14 bg-[#5865F2]/10 rounded-2xl flex items-center justify-center mb-4 text-[#5865F2]">
                  <DiscordIcon size={28} />
               </div>
               <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Join Discord</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
                  Discuss features, report bugs, or share your prints with the community.
               </p>
               <span className="inline-flex items-center gap-2 bg-[#5865F2]/10 text-[#5865F2] px-4 py-2 rounded-full text-sm font-bold">
                  Join Now <Rocket size={14} />
               </span>
            </div>
         </button>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
         <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
            <Server size={24} className="text-blue-500 mb-3" />
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">{t('serverCosts')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('serverCostsDesc')}</p>
         </div>
         
         <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
            <Sparkles size={24} className="text-purple-500 mb-3" />
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">{t('development')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('developmentDesc')}</p>
         </div>

         <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
            <ShieldCheck size={24} className="text-green-500 mb-3" />
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">{t('adFree')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('adFreeDesc')}</p>
         </div>
      </div>

      <div className="text-center pt-4 pb-8">
         <p className="text-slate-400 text-sm italic">
            "{t('thankYouNote')}" <br/> - Tim
         </p>
      </div>
    </div>
  );
};