
import React, { useState, useEffect } from 'react';
import { MessageSquare, Lightbulb, Mail, Send, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../services/supabase';
import { Capacitor } from '@capacitor/core';

type HelpTab = 'feedback' | 'suggestions' | 'contact';

export const HelpPage = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<HelpTab>('feedback');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Input states
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [rating, setRating] = useState(0);
  const [suggestionMsg, setSuggestionMsg] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  
  // Update state
  const [existingFeedbackId, setExistingFeedbackId] = useState<number | null>(null);

  // Helper to get system info
  const getSystemInfo = () => {
    const appVersion = localStorage.getItem('app_version') || 'Onbekend';
    const platform = Capacitor.getPlatform();
    return `\n\n--------------------------------\nApp Versie: ${appVersion}\nPlatform: ${platform}\n--------------------------------`;
  };

  // Helper to open mailto
  const openMail = (subject: string, body: string) => {
    const fullBody = encodeURIComponent(body + getSystemInfo());
    const encodedSubject = encodeURIComponent(subject);
    
    if (Capacitor.isNativePlatform()) {
       window.open(`mailto:info@filamentmanager.nl?subject=${encodedSubject}&body=${fullBody}`, '_system');
    } else {
       window.open(`mailto:info@filamentmanager.nl?subject=${encodedSubject}&body=${fullBody}`);
    }
    
    setStatus('success');
  };

  // Check for existing feedback on mount
  useEffect(() => {
     const checkExistingFeedback = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
           const { data, error } = await supabase
              .from('feedback')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
           
           if (data && !error) {
              // Found existing feedback! Pre-fill form
              const cleanMsg = data.message.split('--------------------------------')[0].trim();
              setFeedbackMsg(cleanMsg);
              setRating(data.rating);
              setExistingFeedbackId(data.id);
           }
        }
     };
     checkExistingFeedback();
  }, []);

  // 1. Handle Feedback (Database + Mail fallback)
  const submitFeedback = async () => {
    if (!feedbackMsg.trim()) return;
    setIsSending(true);
    setStatus('idle');

    try {
        const fullMessage = `${feedbackMsg}${getSystemInfo()}`;
        const platform = Capacitor.getPlatform();
        const userAgent = navigator.userAgent;
        
        let error;

        if (existingFeedbackId) {
           const { error: updateError } = await supabase.from('feedback').update({
              message: fullMessage,
              rating,
              created_at: new Date().toISOString(),
              platform: platform,
              user_agent: userAgent
           }).eq('id', existingFeedbackId);
           error = updateError;
        } else {
           const { error: insertError } = await supabase.from('feedback').insert({
              message: fullMessage,
              rating,
              created_at: new Date().toISOString(),
              platform: platform,
              user_agent: userAgent
           });
           error = insertError;
        }

        if (error) throw error;

        setStatus('success');
        if (!existingFeedbackId) {
           setFeedbackMsg('');
           setRating(0);
        }
        localStorage.setItem('feedback_status', 'given');

    } catch (e: any) {
        console.error("Feedback failed, falling back to mail", e);
        openMail(`Feedback Filament Manager (${rating}/5)`, feedbackMsg);
        setFeedbackMsg('');
        setRating(0);
    } finally {
        setIsSending(false);
    }
  };

  // 2. Handle Suggestions (Mail Only)
  const submitSuggestion = () => {
     if (!suggestionMsg.trim()) return;
     openMail("Suggestie Filament Manager", suggestionMsg);
     setSuggestionMsg('');
  };

  // 3. Handle Contact (Mail Only)
  const submitContact = () => {
     if (!contactMsg.trim()) return;
     const body = `Naam: ${contactName}\n\nBericht:\n${contactMsg}`;
     openMail("Vraag/Contact Filament Manager", body);
     setContactMsg('');
     setContactName('');
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-fade-in pt-4">
       {/* Header */}
       <div className="text-center space-y-4 mb-8">
          <div className="inline-block relative">
             <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shadow-sm mx-auto transform rotate-3">
                {activeTab === 'feedback' && <MessageSquare size={40} className="text-blue-600 dark:text-blue-400" strokeWidth={2} />}
                {activeTab === 'suggestions' && <Lightbulb size={40} className="text-yellow-600 dark:text-yellow-400" strokeWidth={2} />}
                {activeTab === 'contact' && <Mail size={40} className="text-green-600 dark:text-green-400" strokeWidth={2} />}
             </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{t('helpTitle')}</h2>
       </div>

       {/* Tabs */}
       <div className="flex justify-center mb-6 px-4">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex w-full max-w-md">
             <button onClick={() => { setActiveTab('feedback'); setStatus('idle'); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'feedback' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                {t('feedback')}
             </button>
             <button onClick={() => { setActiveTab('suggestions'); setStatus('idle'); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'suggestions' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                {t('suggestions')}
             </button>
             <button onClick={() => { setActiveTab('contact'); setStatus('idle'); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'contact' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                {t('contact')}
             </button>
          </div>
       </div>

       {/* Main Card */}
       <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 mx-4">
          <div className="p-8 space-y-6">
             
             {/* Status Messages */}
             {status === 'success' && (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                   <CheckCircle2 size={24} />
                   <span className="font-bold">{activeTab === 'feedback' ? t('feedbackSent') : t('emailSent')}</span>
                </div>
             )}

             {/* FEEDBACK FORM */}
             {activeTab === 'feedback' && (
                <div className="space-y-6 animate-fade-in">
                   {existingFeedbackId && (
                      <div className="text-xs text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-center">
                         {t('alreadyFeedback')}
                      </div>
                   )}
                   <p className="text-center text-slate-600 dark:text-slate-300 text-sm">{t('feedbackSubtitle')}</p>
                   <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                         <button key={star} onClick={() => setRating(star)} className={`transition-transform hover:scale-110 active:scale-95 ${rating >= star ? 'text-yellow-400' : 'text-slate-200 dark:text-slate-700'}`}>
                            <Star size={32} fill={rating >= star ? "currentColor" : "none"} strokeWidth={2} />
                         </button>
                      ))}
                   </div>
                   <textarea
                      value={feedbackMsg}
                      onChange={(e) => setFeedbackMsg(e.target.value)}
                      placeholder={t('feedbackPlaceholder')}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 min-h-[150px] outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-y"
                   />
                   <button onClick={submitFeedback} disabled={!feedbackMsg.trim() || isSending} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      <Send size={20} /> {existingFeedbackId ? t('saveChanges') : t('feedbackSend')}
                   </button>
                </div>
             )}

             {/* SUGGESTIONS FORM */}
             {activeTab === 'suggestions' && (
                <div className="space-y-6 animate-fade-in">
                   <p className="text-center text-slate-600 dark:text-slate-300 text-sm">{t('suggestionDesc')}</p>
                   <textarea
                      value={suggestionMsg}
                      onChange={(e) => setSuggestionMsg(e.target.value)}
                      placeholder={t('suggestionPlaceholder')}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 min-h-[150px] outline-none focus:ring-2 focus:ring-yellow-500 dark:text-white resize-y"
                   />
                   <button onClick={submitSuggestion} disabled={!suggestionMsg.trim()} className="w-full bg-yellow-500 hover:bg-yellow-400 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      <Mail size={20} /> {t('send')}
                   </button>
                </div>
             )}

             {/* CONTACT FORM */}
             {activeTab === 'contact' && (
                <div className="space-y-6 animate-fade-in">
                   <p className="text-center text-slate-600 dark:text-slate-300 text-sm">{t('contactDesc')}</p>
                   <input 
                      type="text" 
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder={t('contactNamePlaceholder')}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 outline-none focus:ring-2 focus:ring-green-500 dark:text-white"
                   />
                   <textarea
                      value={contactMsg}
                      onChange={(e) => setContactMsg(e.target.value)}
                      placeholder={t('contactMessagePlaceholder')}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 min-h-[150px] outline-none focus:ring-2 focus:ring-green-500 dark:text-white resize-y"
                   />
                   <button onClick={submitContact} disabled={!contactMsg.trim()} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      <Mail size={20} /> {t('send')}
                   </button>
                </div>
             )}

          </div>
       </div>
    </div>
  );
};
