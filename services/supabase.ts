import { createClient } from '@supabase/supabase-js';

// We are using hardcoded values directly to prevent connection issues in this specific environment.
const SUPABASE_URL = 'https://znghpqfdxulxjqzpbjss.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZ2hwcWZkeHVseGpxenBianNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTExNDUsImV4cCI6MjA4MDg4NzE0NX0.nOn0g3gffI-zzz2kbn0SrQJHphmsGeTkQDyOHDhrP7I';

// Initialize the Supabase client.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);