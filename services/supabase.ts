
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

// De URL die je hebt opgegeven
const USER_SUPABASE_URL = 'https://znghpqfdxulxjqzpbjss.supabase.co';

// Kijk in import.meta.env (Vite) of process.env (Vite Define)
const supabaseUrl = cleanEnvVar(
  (import.meta as any).env?.VITE_SUPABASE_URL || 
  (process as any).env?.VITE_SUPABASE_URL || 
  USER_SUPABASE_URL
);

const supabaseKey = cleanEnvVar(
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  (process as any).env?.VITE_SUPABASE_ANON_KEY || 
  ''
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
