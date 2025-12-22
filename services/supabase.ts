import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATIE ---
const HARDCODED_URL: string = "https://znghpqfdxulxjqzpbjss.supabase.co"; 
const HARDCODED_KEY: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZ2hwcWZkeHVseGpxenBianNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTExNDUsImV4cCI6MjA4MDg4NzE0NX0.nOn0g3gffI-zzz2kbn0SrQJHphmsGeTkQDyOHDhrP7I";
// --------------------

const getEnv = (key: string) => {
  try {
    // 1. Probeer import.meta.env (Vite standard)
    if (import.meta && (import.meta as any).env && (import.meta as any).env[key]) {
        return (import.meta as any).env[key];
    }
    // 2. Probeer process.env (Node fallback / Polyfill)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
  } catch (e) {
    // ignore errors
  }
  return '';
};

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

const supabaseUrl = (envUrl && envUrl.length > 0) ? envUrl : (HARDCODED_URL || 'https://placeholder.supabase.co');
const supabaseKey = (envKey && envKey.length > 0) ? envKey : (HARDCODED_KEY || 'placeholder');

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Debug logging
if (import.meta && (import.meta as any).env && (import.meta as any).env.DEV && (supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder')) {
    console.warn("Supabase is niet correct geconfigureerd. Controleer je .env bestand.");
}