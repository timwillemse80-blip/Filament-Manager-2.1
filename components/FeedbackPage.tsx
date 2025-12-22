import React, { useState } from 'react';
import { MessageSquare, Star, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../services/supabase';
import { Capacitor } from '@capacitor/core';

export const FeedbackPage = () => {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    setStatus('idle');

    // Get Technical Info
    const appVersion = localStorage.getItem('app_version') || 'Onbekend';
    const platform = Capacitor.getPlatform();
    const userAgent = navigator.userAgent;

    // Append tech info to message for DB (optional, useful for debugging)
    const fullMessage = `${message}\n\n[System Info]\nVersion: ${appVersion}\nPlatform: ${platform}`;

    try {
      // 1. Try sending to Supabase
      const { error } = await supabase.from('feedback').insert({
        message: fullMessage,
        rating,
        created_at: new Date().toISOString(),
        platform: platform,
        user_agent: userAgent
      });

      if (error) {
         console.error("Supabase Error:", error);
         throw error;
      }

      setStatus('success');
      setMessage('');
      setRating(0);
      
      // Mark feedback as given locally so the prompt stops appearing
      localStorage.setItem('feedback_status', 'given');

    } catch (e: any) {
      console.error("Feedback failed:", e);
      
      let errorMsg = "Kon feedback niet opslaan in database.";
      
      // Check specific error codes/messages
      if (e.message && (e.message.includes('does not exist') || e.code === '42P01')) {
          errorMsg = "De database tabel 'feedback' bestaat nog niet. \n\nGa naar Admin Dashboard -> Feedback tab voor de installatie-code.";
      } else if (e.message && e.message.includes('Could not find the') && e.message.includes('column')) {
          errorMsg = "De database tabel is verouderd (mist kolommen). \n\nGa naar Admin Dashboard -> Feedback tab en voer de SQL code opnieuw uit om de tabel te updaten.";
      } else if (e.message && e.message.includes('policy')) {
          errorMsg = "Geen rechten om feedback te sturen (RLS Policy fout).";
      } else if (e.message) {
          // Show raw error for debugging
          errorMsg += `\nFoutmelding: ${e.message}`;
      }

      // Fallback: Open Mail Client
      if (confirm(`${errorMsg}\n\nWil je in plaats daarvan je mail-app openen?`)) {
         const subject = encodeURIComponent(`Feedback Filament Manager`);
         
         const bodyContent = `
${message}

--------------------------------
App-versie: ${appVersion}
Platform: ${platform}
Rating: ${rating}/5
--------------------------------
`.trim();

         const body = encodeURIComponent(bodyContent);
         
         if (Capacitor.isNativePlatform()) {
            window.open(`mailto:info@filamentmanager.nl?subject=${subject}&body=${body}`, '_system');
         } else {
            window.open(`mailto:info@filamentmanager.nl?subject=${subject}&body=${body}`);
         }
         setStatus('success'); // Mark as handled because sent via mail
         localStorage.setItem('feedback_status', 'given');
      } else {
         setStatus('error');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-20 pt-4">
      
      {/* Header */}
      <div className="text-center space-y-4">
         <div className="inline-block relative">
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center shadow-sm mx-auto transform rotate-3">
               <MessageSquare size={40} className="text-purple-600 dark:text-purple-400" strokeWidth={2} />
            </div>
         </div>
         
         <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            {t('feedbackTitle')}
         </h2>
         <p className="text-slate-600 dark:text-slate-300 text-lg max-w-md mx-auto leading-relaxed">
            {t('feedbackSubtitle')}
         </p>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
         <div className="p-8 space-y-6">
            
            {/* Success Message */}
            {status === 'success' && (
               <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                  <CheckCircle2 size={24} />
                  <span className="font-bold">{t('feedbackSent')}</span>
               </div>
            )}

            {/* Error Message */}
            {status === 'error' && (
               <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                  <AlertCircle size={24} />
                  <span className="font-bold">Er ging iets mis. Probeer het later opnieuw.</span>
               </div>
            )}

            {/* Rating */}
            <div className="flex flex-col items-center gap-3 py-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('rating')}</label>
               <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                     <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`transition-transform hover:scale-110 active:scale-95 ${rating >= star ? 'text-yellow-400' : 'text-slate-200 dark:text-slate-700'}`}
                     >
                        <Star size={32} fill={rating >= star ? "currentColor" : "none"} strokeWidth={2} />
                     </button>
                  ))}
               </div>
            </div>

            {/* Text Area */}
            <textarea
               value={message}
               onChange={(e) => setMessage(e.target.value)}
               placeholder={t('feedbackPlaceholder')}
               className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 min-h-[150px] outline-none focus:ring-2 focus:ring-purple-500 dark:text-white resize-y"
            />

            {/* Submit Button */}
            <button
               onClick={handleSubmit}
               disabled={!message.trim() || isSending}
               className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
               {isSending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                  <>
                     <Send size={20} /> {t('feedbackSend')}
                  </>
               )}
            </button>
         </div>
      </div>
    </div>
  );
};