
import { createClient } from '@supabase/supabase-js';

// We gebruiken hier direct de door jou verstrekte gegevens om verbindingsproblemen te voorkomen
const SUPABASE_URL = 'https://znghpqfdxulxjqzpbjss.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZ2hwcWZkeHVseGpxenBianNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTExNDUsImV4cCI6MjA4MDg4NzE0NX0.nOn0g3gffI-zzz2kbn0SrQJHphmsGeTkQDyOHDhrP7I';

// Initialiseer de client direct met de hardcoded waarden
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
