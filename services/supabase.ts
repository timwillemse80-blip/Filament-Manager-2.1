
import { createClient } from '@supabase/supabase-js';

// Haal variabelen op en verwijder eventuele onzichtbare spaties of quotes
const rawUrl = process.env.VITE_SUPABASE_URL || '';
const rawKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseUrl = rawUrl.replace(/['"]/g, '').trim();
const supabaseKey = rawKey.replace(/['"]/g, '').trim();

// Controleer of de configuratie aanwezig is
export const isSupabaseConfigured = 
  supabaseUrl.length > 0 && 
  supabaseUrl.startsWith('http') && 
  supabaseKey.length > 0 &&
  supabaseKey !== 'no-key-configured';

// Gebruik een geldige URL om de constructor niet te laten crashen
const finalUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const finalKey = isSupabaseConfigured ? supabaseKey : 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey);
