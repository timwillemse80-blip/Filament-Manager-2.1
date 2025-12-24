
import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Mail, Lock, ArrowRight, Check, AlertCircle, ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react';
import { supabase } from '../services/supabase';
import { PrivacyPolicy } from './PrivacyPolicy';

interface AuthScreenProps {
  onOfflineLogin: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onOfflineLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true); 
  
  // Privacy Policy Modal State
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Check URL for errors coming from Supabase redirects (e.g. expired links)
  useEffect(() => {
    const handleHashError = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('error_description')) {
        try {
          const params = new URLSearchParams(hash.substring(1));
          const errorDesc = params.get('error_description');
          if (errorDesc) {
            setError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
            // Clear hash to clean up URL
            window.history.replaceState(null, '', window.location.pathname);
          }
        } catch (e) {
          // ignore parsing errors
        }
      }
      
      // Handle Password Recovery link click (type=recovery)
      if (hash && hash.includes('type=recovery')) {
         setMessage("You are logged in via a recovery link. Please update your password in Settings.");
      }
    };

    handleHashError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      if (isResettingPassword) {
        // --- Password Reset Flow ---
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin, // Redirect back to this app
        });
        if (resetError) throw resetError;
        setMessage("Check your email for recovery instructions.");
        setIsResettingPassword(false); // Go back to login view to show message
      } else if (isRegistering) {
        // --- Sign Up Flow ---
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (signUpError) throw signUpError;
        
        if (data.user && !data.session) {
          setMessage("Registration successful! Check your email to confirm your account.");
          setIsRegistering(false);
        }
      } else {
        // --- Sign In Flow ---
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        // Save preference and current session flag
        localStorage.setItem('filament_keep_logged_in', keepLoggedIn ? 'true' : 'false');
        sessionStorage.setItem('filament_session_active', 'true');
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || "An error occurred.";
      
      // Detailed error translation for better UX
      if (msg.includes('Database error granting user')) {
          msg = "Database-fout bij inloggen. Voer de 'Login Reparatie' SQL code uit in je Supabase SQL Editor.";
      } else if (msg.includes('Invalid login credentials')) {
          msg = "Onjuist e-mailadres of wachtwoord.";
      } else if (msg.includes('Invalid API key')) {
          msg = 'Database configuratiefout. Neem contact op met de beheerder.';
      } else if (msg.includes('Failed to fetch')) {
          msg = 'Kan geen verbinding maken met de server. Controleer je internet.';
      } else if (msg.includes('Rate limit exceeded')) {
          msg = 'Te veel pogingen. Probeer het later opnieuw.';
      } else if (msg.includes('User not found')) {
          msg = 'Geen account gevonden met dit e-mailadres.';
      }
      
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Logic ---

  const renderHeader = () => {
    if (isResettingPassword) return 'Reset Password';
    if (isRegistering) return 'Create Account';
    return 'Log in to your inventory';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in relative">
        
        {/* Header */}
        <div className="bg-slate-100 dark:bg-slate-900/50 p-8 text-center border-b border-slate-200 dark:border-slate-700 relative">
          {isResettingPassword && (
            <button 
              onClick={() => { setIsResettingPassword(false); setError(null); }}
              className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="w-20 h-20 mx-auto mb-4 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md p-4">
            <Logo className="w-full h-full" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Filament Manager
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {renderHeader()}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl flex flex-col gap-2 animate-pulse-soft">
               <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                  <AlertCircle size={18} />
                  <span>Let op</span>
               </div>
               <p className="text-sm text-red-600 dark:text-red-300 pl-6.5 leading-snug">
                 {error}
               </p>
            </div>
          )}
          {message && (
             <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
              <div className="bg-green-200 dark:bg-green-800 p-1 rounded-full text-green-700 dark:text-green-300"><Check size={14} /></div>
              <span className="text-sm text-green-800 dark:text-green-200 font-medium">{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g. info@example.com"
                  required
                />
                <div className="absolute left-3 top-3.5 text-slate-400">
                  <Mail size={18} />
                </div>
              </div>
            </div>

            {!isResettingPassword && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Wachtwoord</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg py-3 pl-10 pr-10 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Wachtwoord"
                    required={!isResettingPassword}
                  />
                  <div className="absolute left-3 top-3.5 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                   {/* Keep Logged In Checkbox */}
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${keepLoggedIn ? 'bg-blue-600 border-blue-600' : 'border-slate-400 bg-transparent group-hover:border-blue-500'}`}>
                         {keepLoggedIn && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      <input 
                         type="checkbox" 
                         className="hidden" 
                         checked={keepLoggedIn}
                         onChange={e => setKeepLoggedIn(e.target.checked)}
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium select-none">Blijf ingelogd</span>
                   </label>

                   {!isRegistering && (
                      <button 
                        type="button"
                        onClick={() => { setIsResettingPassword(true); setError(null); setMessage(null); }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Wachtwoord vergeten?
                      </button>
                   )}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isResettingPassword ? 'Stuur Herstellink' : (isRegistering ? 'Account Aanmaken' : 'Inloggen')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        {!isResettingPassword && (
          <div className="bg-slate-50 dark:bg-slate-900 p-4 text-center border-t border-slate-200 dark:border-slate-700 flex flex-col gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isRegistering ? 'Heb je al een account?' : 'Nog geen account?'}
              <button 
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError(null);
                  setMessage(null);
                }}
                className="ml-2 font-bold text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
              >
                {isRegistering ? 'Log In' : 'Nu registreren'}
              </button>
            </p>
            
            {/* Privacy Link */}
            <button 
               onClick={() => setShowPrivacy(true)}
               className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center gap-1 hover:underline"
            >
               <Shield size={12} /> Privacybeleid
            </button>
          </div>
        )}
        
        {isResettingPassword && (
           <div className="bg-slate-50 dark:bg-slate-900 p-4 text-center border-t border-slate-200 dark:border-slate-700">
             <button 
                onClick={() => { setIsResettingPassword(false); setError(null); setMessage(null); }}
                className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
             >
               Terug naar inloggen
             </button>
           </div>
        )}
      </div>

      {/* Modal */}
      {showPrivacy && (
         <PrivacyPolicy onClose={() => setShowPrivacy(false)} />
      )}
    </div>
  );
};
