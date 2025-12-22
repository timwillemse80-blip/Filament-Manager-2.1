import { createClient } from '@supabase/supabase-js';

// Gebruik de variabelen die door Vite worden geïnjecteerd
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'placeholder') {
  console.warn("Supabase configuratie ontbreekt. De app werkt in Offline Modus.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);