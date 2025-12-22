
import { createClient } from '@supabase/supabase-js';

/**
 * Helper om variabelen schoon te maken (verwijdert onbedoelde quotes of spaties)
 */
const cleanEnvVar = (val: any): string => {
  if (!val) return '';
  let str = String(val);
  // Verwijder quotes aan begin/eind en trim spaties
  return str.replace(/^['"]|['"]$/g, '').trim();
};

// De gegevens die je hebt opgegeven
const USER_SUPABASE_URL = 'https://znghpqfdxulxjqzpbjss.supabase.co';
const USER_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZ2hwcWZkeHVseGpxenBianNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTExNDUsImV4cCI6MjA4MDg4NzE0NX0.nOn0g3gffI-zzz2kbn0SrQJHphmsGeTkQDyOHDhrP7I';

// Kijk in import.meta.env (Vite) of process.env (Vite Define)
const supabaseUrl = cleanEnvVar(
  (import.meta as any).env?.VITE_SUPABASE_URL || 
  (process as any).env?.VITE_SUPABASE_URL || 
  USER_SUPABASE_URL
);

const supabaseKey = cleanEnvVar(
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  (process as any).env?.VITE_SUPABASE_ANON_KEY || 
  USER_SUPABASE_KEY
);

// Debug logging (alleen in dev mode zichtbaar in console)
if (!supabaseUrl.startsWith('http')) {
  console.error("CRITISCHE FOUT: Supabase URL is nog steeds ongeldig:", supabaseUrl);
}

// Initialiseer de client met de beste beschikbare data
export const supabase = createClient(
  supabaseUrl,
  supabaseKey || 'missing-key'
);
