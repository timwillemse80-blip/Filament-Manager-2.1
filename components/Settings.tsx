import React, { useRef, useState, useEffect, useMemo } from 'react';
import { AppSettings, Filament, Location, Supplier } from '../types';
import { Moon, Sun, AlertTriangle, Clock, Download, Upload, RefreshCw, Languages, Info, Smartphone, Loader2, Shield, Calculator, Globe, Eye, Copy, Check, Trash2, Undo2, LayoutGrid, Bell, Database, User, Cpu, Coffee, ExternalLink, Percent, ArrowUpFromLine, Snowflake, Filter, Share2, MessageCircle, Crown, Lock, X, LogOut, Settings2, LifeBuoy, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../services/supabase';
import { DISCORD_INVITE_URL } from '../constants';
import { LocationManager } from './LocationManager';
import { SupplierManager } from './SupplierManager';
import { HelpPage } from './HelpPage';

interface SettingsProps {
  settings: AppSettings;
  filaments: Filament[];
  onUpdate: (settings: AppSettings) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  currentVersion?: string;
  onCheckUpdate?: () => void;
  isCheckingUpdate?: boolean;
  isAdmin?: boolean;
  onOpenShowcase?: (filters?: string[]) => void;
  installPrompt?: any; 
  onInstall?: () => void;
  userId?: string;
  onOpenPrivacy?: () => void; 
  isSnowEnabled?: boolean;
  onToggleSnow?: () => void;
  onBecomePro?: () => void;
  onLogout?: () => void;
  
  // New props for Management Tab
  locations: Location[];
  suppliers: Supplier[];
  onSaveLocation: (loc: Location) => void;
  onDeleteLocation: (id: string) => void;
  onSaveSupplier: (sup: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

type TabKey = 'general' | 'notifications' | 'account' | 'management' | 'pro';

const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/filamentmanager";

const DiscordIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z"/>
  </svg>
);

const DELETE_REASONS_KEYS = [
  "reasonNotUsing",
  "reasonMissingFeatures",
  "reasonTooComplicated",
  "reasonOtherApp",
  "reasonTechnicalIssues",
  "reasonOther"
];

// Helper for generic reasons since they are small enough
const getDeleteReasons = (t: any) => [
  t('reasonNotUsing') || "Ik gebruik de app niet meer",
  t('reasonMissingFeatures') || "Ik mis functionaliteiten",
  t('reasonTooComplicated') || "De app is te ingewikkeld",
  t('reasonOtherApp') || "Ik heb een andere app gevonden",
  t('reasonTechnicalIssues') || "Technische problemen",
  t('reasonOther') || "Anders..."
];

export const Settings: React.FC<SettingsProps> = ({ 
  settings, filaments, onUpdate, onExport, onImport, currentVersion, onCheckUpdate, 
  isCheckingUpdate, isAdmin, onOpenShowcase, installPrompt, onInstall, 
  userId, onOpenPrivacy, isSnowEnabled, onToggleSnow, onBecomePro, onLogout,
  locations, suppliers, onSaveLocation, onDeleteLocation, onSaveSupplier, onDeleteSupplier
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // Deletion Request State
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isLoadingRequest, setIsLoadingRequest] = useState(false);
  
  // New Deletion Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteReasonCustom, setDeleteReasonCustom] = useState("");

  const availableLanguages = [
     { code: 'nl', label: 'NL', name: 'Nederlands' },
     { code: 'en', label: 'EN', name: 'English' },
     { code: 'de', label: 'DE', name: 'Deutsch' },
     { code: 'fr', label: 'FR', name: 'Français' },
     { code: 'es', label: 'ES', name: 'Español' },
  ];

  useEffect(() => {
     const checkPendingRequest = async () => {
        if (!userId) return;
        try {
           const { data, error } = await supabase
              .from('deletion_requests')
              .select('id')
              .eq('user_id', userId)
              .single();
           
           if (data) {
              setHasPendingRequest(true);
           }
        } catch (e) {
           // Ignore 'row not found' error
        }
     };
     checkPendingRequest();
  }, [userId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (confirm(t('confirmBackup'))) {
        onImport(file);
      }
    }
    if (event.target) event.target.value = '';
  };

  const handleDownloadApk = () => {
    const releaseUrl = "https://github.com/timwillemse80-blip/Filament-Manager-2.1/releases/latest";

    if (Capacitor.isNativePlatform()) {
      window.open(releaseUrl, '_system');
    } else {
      window.open(releaseUrl, '_blank');
    }
  };

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

  // Initial handler for button click
  const handleDeletionClick = async () => {
     if (hasPendingRequest) {
        // If already pending, just cancel directly (no modal needed)
        await cancelDeletionRequest();
     } else {
        // If not pending, show the reason modal
        setDeleteReason("");
        setDeleteReasonCustom("");
        setShowDeleteModal(true);
     }
  };

  const cancelDeletionRequest = async () => {
     setIsLoadingRequest(true);
     try {
        if (!confirm(t('confirmCancelDeletion'))) {
           setIsLoadingRequest(false);
           return;
        }

        const { error } = await supabase
           .from('deletion_requests')
           .delete()
           .eq('user_id', userId);

        if (error) throw error;
        
        setHasPendingRequest(false);
        alert(t('requestCancelled'));
     } catch (e: any) {
        alert("Annuleren mislukt: " + e.message);
     } finally {
        setIsLoadingRequest(false);
     }
  };

  const submitDeletionRequest = async () => {
     if (!deleteReason) return;
     
     const finalReason = deleteReason === t('reasonOther') ? deleteReasonCustom : deleteReason;
     
     setIsLoadingRequest(true);
     try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
           const { error } = await supabase.from('deletion_requests').insert({
              email: user.email,
              reason: finalReason || 'Geen reden opgegeven'
           });
           
           if (error) {
              if (error.message.includes('does not exist')) {
                 alert("Systeemfout: Tabel 'deletion_requests' bestaat niet. Neem contact op met de beheerder.");
              } else {
                 throw error;
              }
           } else {
              setHasPendingRequest(true);
              setShowDeleteModal(false);
              alert(t('requestSent'));
           }
        }
     } catch (e: any) {
        alert("Actie mislukt: " + e.message);
     } finally {
        setIsLoadingRequest(false);
     }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-10">
      
      {/* Install Banner (PWA) */}
      {installPrompt && (
         <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-xl shadow-lg flex items-center justify-between text-white transform transition-transform active:scale-[0.99] mb-4">
            <div>
               <h4 className="font-bold text-lg flex items-center gap-2"><Download size={20}/> {t('installApp')}</h4>
               <p className="text-xs text-blue-100 opacity-90">{t('installAppDesc')}</p>
            </div>
            <button onClick={onInstall} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-blue-50 transition-colors">
               {t('install')}
            </button>
         </div>
      )}

      {/* --- Settings Header & Tabs --- */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden flex flex-col min-h-[600px]">
         <div className="p-6 border-b border-slate-200 dark:border-slate-700 pb-0">
            <h3 className="text-2xl font-bold mb-4 dark:text-white text-slate-800">{t('settings')}</h3>
            
            {/* Scrollable Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
               <button 
                  onClick={() => setActiveTab('general')}
                  className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-all text-sm whitespace-nowrap border-b-2 ${activeTab === 'general' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                  <LayoutGrid size={16} /> {t('tabGeneral')}
               </button>
               <button 
                  onClick={() => setActiveTab('notifications')}
                  className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-all text-sm whitespace-nowrap border-b-2 ${activeTab === 'notifications' ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                  <Bell size={16} /> {t('tabNotifications')}
               </button>
               <button 
                  onClick={() => setActiveTab('management')}
                  className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-all text-sm whitespace-nowrap border-b-2 ${activeTab === 'management' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                  <Settings2 size={16} /> {t('tabManagement')}
               </button>
               <button 
                  onClick={() => setActiveTab('account')}
                  className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-all text-sm whitespace-nowrap border-b-2 ${activeTab === 'account' ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                  <User size={16} /> {t('tabAccount')}
               </button>
               
               {/* PRO Tab */}
               <button 
                  onClick={() => setActiveTab('pro')}
                  className={`px-4 py-2 rounded-t-lg font-bold flex items-center gap-2 transition-all text-sm whitespace-nowrap border-b-2 ${activeTab === 'pro' ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-transparent text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'}`}
               >
                  <Crown size={16} fill="currentColor" /> {t('tabPro')}
               </button>
            </div>
         </div>

         {/* --- Tab Content --- */}
         <div className="p-6 flex-1 bg-slate-50 dark:bg-slate-900/30">
            
            {/* === GENERAL TAB === */}
            {activeTab === 'general' && (
               <div className="space-y-6 animate-fade-in">
                  {/* Theme */}
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                     <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400">
                           <Sun size={20} />
                        </div>
                        <h4 className="font-semibold dark:text-white text-slate-800">{t('appearance')}</h4>
                     </div>
                     <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                        <button
                           onClick={() => onUpdate({ ...settings, theme: 'light' })}
                           className={`p-2 rounded-md flex items-center gap-2 transition-colors ${settings.theme === 'light' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                           <Sun size={18} />
                        </button>
                        <button
                           onClick={() => onUpdate({ ...settings, theme: 'dark' })}
                           className={`p-2 rounded-md flex items-center gap-2 transition-colors ${settings.theme === 'dark' ? 'bg-slate-700 shadow text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                           <Moon size={18} />
                        </button>
                     </div>
                  </div>

                  {/* Winter Edition Toggle */}
                  {onToggleSnow && (
                     <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                           <div className="bg-sky-100 dark:bg-sky-900/30 p-2 rounded-full text-sky-600 dark:text-sky-400">
                              <Snowflake size={20} />
                           </div>
                           <div>
                              <h4 className="font-semibold dark:text-white text-slate-800">{t('winterEdition')}</h4>
                              <p className="text-xs text-slate-500">{t('winterEditionDesc')}</p>
                           </div>
                        </div>
                        <button 
                           onClick={onToggleSnow}
                           className={`w-12 h-6 rounded-full transition-colors relative ${isSnowEnabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                           <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${isSnowEnabled ? 'left-7' : 'left-1'}`} />
                        </button>
                     </div>
                  )}

                  {/* Language */}
                  <div className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full text-purple-600 dark:text-purple-400">
                           <Languages size={20} />
                        </div>
                        <h4 className="font-semibold dark:text-white text-slate-800">{t('language')}</h4>
                     </div>
                     <div className="grid grid-cols-5 gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                        {availableLanguages.map((lang) => (
                           <button 
                              key={lang.code}
                              onClick={() => setLanguage(lang.code as any)} 
                              className={`px-2 py-1.5 rounded-md font-bold text-xs transition-colors ${language === lang.code ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                              title={lang.name}
                           >
                              {lang.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* App Version & Links */}
                  <div className="flex flex-col gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-600 dark:text-slate-300">
                              <Info size={20} />
                           </div>
                           <div>
                              <h4 className="font-semibold dark:text-white text-slate-800">{t('aboutApp')}</h4>
                              <p className="text-xs text-slate-500">v{currentVersion || '1.0.0'}</p>
                           </div>
                        </div>
                        
                        {!Capacitor.isNativePlatform() && (
                           <button 
                              onClick={handleDownloadApk}
                              disabled={isDownloading}
                              className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors shadow-sm"
                           >
                              {isDownloading ? <Loader2 size={14} className="animate-spin"/> : <Smartphone size={14} />}
                              APK
                           </button>
                        )}
                     </div>

                     {/* Help & Contact Expandable Section */}
                     <div className="border-t border-slate-100 dark:border-slate-700/50 pt-4">
                        <button 
                           onClick={() => setIsHelpOpen(!isHelpOpen)}
                           className="w-full flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group"
                        >
                           <div className="flex items-center gap-3">
                              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                 <LifeBuoy size={18} />
                              </div>
                              <span className="font-bold text-sm text-slate-800 dark:text-white">{t('help')}</span>
                           </div>
                           {isHelpOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                        </button>

                        {isHelpOpen && (
                           <div className="mt-4 animate-fade-in border-l-2 border-blue-500/20 ml-5 pl-4">
                              <HelpPage />
                           </div>
                        )}
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                        <button 
                           onClick={onOpenPrivacy}
                           className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                           <Shield size={14} /> {t('privacyPolicy')}
                        </button>
                        <button 
                           onClick={openDonationLink}
                           className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                        >
                           <Coffee size={14} /> {t('donateButton')} <ExternalLink size={10} />
                        </button>
                     </div>

                     {/* Discord Button */}
                     <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                        <button 
                           onClick={openDiscord}
                           className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-[#5865F2] hover:bg-[#5865F2]/10 rounded-lg transition-colors"
                        >
                           <DiscordIcon size={16} /> Join Discord
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {/* === MANAGEMENT TAB === */}
            {activeTab === 'management' && (
                <div className="space-y-8 animate-fade-in">
                    <div>
                        <LocationManager 
                            locations={locations} 
                            onSave={onSaveLocation} 
                            onDelete={onDeleteLocation} 
                        />
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <SupplierManager 
                            suppliers={suppliers} 
                            onSave={onSaveSupplier} 
                            onDelete={onDeleteSupplier} 
                        />
                    </div>
                </div>
            )}

            {activeTab === 'notifications' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                     <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={20} className="text-orange-500" />
                        <h4 className="font-semibold dark:text-white text-slate-800">{t('lowStockWarning')}</h4>
                     </div>
                     <div className="flex items-center gap-4">
                        <input
                           type="range"
                           min="5"
                           max="50"
                           step="5"
                           value={settings.lowStockThreshold}
                           onChange={(e) => onUpdate({ ...settings, lowStockThreshold: Number(e.target.value) })}
                           className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="w-16 text-center font-mono font-bold text-lg bg-slate-50 dark:bg-slate-900 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
                           {settings.lowStockThreshold}%
                        </div>
                     </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                     <div className="flex items-center gap-2 mb-4">
                        <Clock size={20} className="text-blue-500" />
                        <h4 className="font-semibold dark:text-white text-slate-800">{t('unusedWarning')}</h4>
                     </div>
                     <div className="flex items-center gap-4">
                        <input
                           type="number"
                           min="30"
                           max="365"
                           step="10"
                           value={settings.unusedWarningDays || 90}
                           onChange={(e) => onUpdate({ ...settings, unusedWarningDays: Number(e.target.value) })}
                           className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 w-24 text-center dark:text-white text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-slate-600 dark:text-slate-300">{t('days')}</span>
                     </div>
                  </div>

                  {/* App Updates Notifications */}
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full text-amber-600 dark:text-amber-400">
                              <Sparkles size={20} />
                           </div>
                           <div>
                              <h4 className="font-semibold dark:text-white text-slate-800">App Updates</h4>
                              <p className="text-xs text-slate-500">{t('enableUpdateNotifications')}</p>
                           </div>
                        </div>
                        <button 
                           onClick={() => onUpdate({ ...settings, enableUpdateNotifications: !settings.enableUpdateNotifications })}
                           className={`w-12 h-6 rounded-full transition-colors relative ${settings.enableUpdateNotifications ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                           <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${settings.enableUpdateNotifications ? 'left-7' : 'left-1'}`} />
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'account' && (
               <div className="space-y-6 animate-fade-in">
                  
                  {/* Logout Section */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-600 dark:text-slate-300">
                           <User size={20} />
                        </div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white">Sessie</h4>
                     </div>
                     
                     <button 
                        onClick={onLogout}
                        className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600"
                     >
                        <LogOut size={18} /> {t('logout')}
                     </button>
                  </div>

                  {/* Data & Backup Section */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full text-green-600 dark:text-green-400">
                           <Database size={20} />
                        </div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white">{t('tabData')}</h4>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                           onClick={onExport}
                           className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                        >
                           <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                              <Download size={20} />
                           </div>
                           <div className="text-left">
                              <div className="font-bold text-slate-800 dark:text-white text-sm">{t('backupCreate')}</div>
                              <div className="text-[10px] text-slate-500">.json export</div>
                           </div>
                        </button>

                        <button
                           onClick={() => fileInputRef.current?.click()}
                           className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-500 bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-100 transition-all group"
                        >
                           <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                              <Upload size={20} />
                           </div>
                           <div className="text-left">
                              <div className="font-bold text-slate-800 dark:text-white text-sm">{t('backupRestore')}</div>
                              <div className="text-[10px] text-slate-500">.json import</div>
                           </div>
                        </button>
                        
                        <input 
                           type="file" 
                           ref={fileInputRef}
                           onChange={handleFileChange}
                           accept=".json"
                           className="hidden"
                        />
                     </div>
                  </div>

                  {/* Danger Zone */}
                  <div className={`p-6 rounded-xl border transition-colors ${hasPendingRequest ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'}`}>
                     <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-full ${hasPendingRequest ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                           <AlertTriangle size={24} />
                        </div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white">{t('dangerZone')}</h4>
                     </div>
                     
                     <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                        {hasPendingRequest ? t('requestSent') : t('deleteAccountDesc')}
                     </p>

                     <button 
                        onClick={handleDeletionClick}
                        disabled={isLoadingRequest}
                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] ${hasPendingRequest ? 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                     >
                        {isLoadingRequest ? (
                           <Loader2 size={18} className="animate-spin" />
                        ) : hasPendingRequest ? (
                           <><Undo2 size={18} /> {t('cancelDeletion')}</>
                        ) : (
                           <><Trash2 size={18} /> {t('deleteAccount')}</>
                        )}
                     </button>
                  </div>
               </div>
            )}

            {activeTab === 'pro' && (
               <div className="space-y-6 animate-fade-in relative">
                  
                  {/* --- CALCULATOR CARD --- */}
                  <div className={`bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 relative overflow-hidden transition-all ${!isAdmin ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                     {/* PRO Badge */}
                     <div className="absolute top-0 right-0 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-bl-xl text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1 z-10 border-b border-l border-amber-200 dark:border-amber-800">
                        <Crown size={12} fill="currentColor" /> PRO
                     </div>

                     <h4 className="font-bold text-lg mb-4 text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <Calculator size={20} /> {t('proTools')}
                     </h4>
                     <p className="text-xs text-slate-500 mb-4 dark:text-slate-400">
                        {t('proToolsDesc')}
                     </p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t('electricityRate')}</label>
                           <input 
                              type="number" 
                              step="0.01" 
                              value={settings.electricityRate ?? ''} 
                              onChange={e => onUpdate({...settings, electricityRate: parseFloat(e.target.value)})}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 dark:text-white"
                              placeholder={t('exampleElectricityRate')}
                           />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{t('hourlyRate')}</label>
                           <input 
                              type="number" 
                              value={settings.hourlyRate ?? ''} 
                              onChange={e => onUpdate({...settings, hourlyRate: parseFloat(e.target.value)})}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 dark:text-white"
                              placeholder={t('exampleHourlyRate')}
                           />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1"><Percent size={12}/> {t('profitMargin')}</label>
                           <input 
                              type="number" 
                              value={settings.profitMargin ?? ''} 
                              onChange={e => onUpdate({...settings, profitMargin: parseFloat(e.target.value)})}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 dark:text-white"
                              placeholder="20"
                           />
                        </div>
                     </div>
                     
                     <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
                        <div className="flex items-center justify-between">
                           <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                              <ArrowUpFromLine size={14}/> {t('roundToNine')}
                           </label>
                           <input 
                              type="checkbox" 
                              checked={settings.roundToNine}
                              onChange={(e) => onUpdate({...settings, roundToNine: e.target.checked})}
                              className="w-5 h-5 accent-blue-600 rounded"
                           />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                           Bijv. €1,46 &rarr; €1,49 | €2,71 &rarr; €2,79
                        </p>
                     </div>
                  </div>

                  {/* --- LOCKED OVERLAY --- */}
                  {!isAdmin && (
                     <div 
                        onClick={onBecomePro}
                        className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors rounded-xl"
                     >
                        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 text-center max-w-xs transform hover:scale-105 transition-transform">
                           <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Lock size={32} />
                           </div>
                           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{t('proFeatureLocked')}</h3>
                           <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                              {t('upgradeToUnlock')}
                           </p>
                        </div>
                     </div>
                  )}
               </div>
            )}

         </div>
      </div>

      {/* --- DELETION REQUEST MODAL --- */}
      {showDeleteModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
               <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                  <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                     <AlertTriangle size={24} /> {t('deleteAccount')}
                  </h3>
                  <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                     <X size={20} />
                  </button>
               </div>
               
               <div className="p-6 space-y-6">
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                     <strong>Let op:</strong> Na bevestiging worden al jouw gegevens (inventaris, instellingen, historie) binnen <strong>48 uur</strong> permanent verwijderd. Dit kan niet ongedaan worden gemaakt.
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Waarom wil je vertrekken? (Verplicht)
                     </label>
                     <select 
                        value={deleteReason} 
                        onChange={(e) => setDeleteReason(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                     >
                        <option value="">Kies een reden...</option>
                        {getDeleteReasons(t).map((r) => (
                           <option key={r} value={r}>{r}</option>
                        ))}
                     </select>
                  </div>

                  {deleteReason === t('reasonOther') && (
                     <div className="animate-fade-in">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                           Licht je keuze toe:
                        </label>
                        <textarea 
                           value={deleteReasonCustom}
                           onChange={(e) => setDeleteReasonCustom(e.target.value)}
                           className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
                           placeholder="Type hier..."
                        />
                     </div>
                  )}
               </div>

               <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                  <button 
                     onClick={() => setShowDeleteModal(false)}
                     className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                     {t('cancel')}
                  </button>
                  <button 
                     onClick={submitDeletionRequest}
                     disabled={!deleteReason || isLoadingRequest}
                     className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                     {isLoadingRequest ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18} />}
                     Definitief Verwijderen
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};