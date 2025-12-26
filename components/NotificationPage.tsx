import React from 'react';
import { Sparkles, ArrowRight, Bell, Info, ShieldCheck, History, Zap, CheckCircle2, Smartphone, Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';

interface NotificationPageProps {
  updateInfo: { version: string, notes: string, downloadUrl?: string } | null;
}

export const NotificationPage: React.FC<NotificationPageProps> = ({ updateInfo }) => {
  const { t } = useLanguage();

  const handleDownload = () => {
    const url = updateInfo?.downloadUrl || "https://github.com/timwillemse80-blip/Filament-Manager-2.1/releases";
    if (Capacitor.isNativePlatform()) {
      window.open(url, '_system');
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20 pt-4 px-4">
      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-4">
          <Bell size={32} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t('notifications')}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t('notificationsSubtitle')}</p>
      </div>

      {!updateInfo && (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
           <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
             <CheckCircle2 size={32} />
           </div>
           <h3 className="text-lg font-bold text-slate-400">{t('noNotifications')}</h3>
           <p className="text-sm text-slate-400 mt-1">{t('allCaughtUp')}</p>
        </div>
      )}

      {updateInfo && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[32px] shadow-xl text-white relative overflow-hidden group border border-white/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform scale-150">
            <Sparkles size={120} />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{t('newUpdate')}</h3>
                  <p className="text-blue-100 text-sm font-bold opacity-90">{t('versionActive').replace('%v', updateInfo.version)}</p>
                </div>
              </div>
              <div className="hidden sm:block bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border border-emerald-400 uppercase tracking-widest animate-pulse">
                {t('installed')}
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-3 flex items-center gap-2">
                <History size={14} /> {t('whatsNew')}
              </h4>
              <p className="text-base leading-relaxed font-medium whitespace-pre-line">
                {updateInfo.notes}
              </p>
            </div>

            <div className="space-y-4">
                <button 
                    onClick={handleDownload}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 text-lg active:scale-[0.98]"
                >
                    <Smartphone size={24} />
                    Download Latest APK
                </button>
                
                <div className="flex items-center gap-2 text-blue-200/80 text-xs font-bold justify-center pt-2">
                   <CheckCircle2 size={14} className="text-emerald-400" />
                   {t('autoUpdateMsg')}
                </div>
            </div>
            
            <p className="text-[10px] text-center text-blue-200/60 font-bold uppercase tracking-widest">
              {t('publishedOn')} {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-3 text-indigo-600">
            <ShieldCheck size={20} />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-white text-sm">{t('security')}</h4>
          <p className="text-xs text-slate-500 mt-1">{t('securityDesc')}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-3 text-amber-600">
            <Zap size={20} />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-white text-sm">{t('speed')}</h4>
          <p className="text-xs text-slate-500 mt-1">{t('speedDesc')}</p>
        </div>
      </div>
    </div>
  );
};