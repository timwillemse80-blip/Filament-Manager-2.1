
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://znghpqfdxulxjqzpbjss.supabase.co'),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZ2hwcWZkeHVseGpxenBianNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTExNDUsImV4cCI6MjA4MDg4NzE0NX0.nOn0g3gffI-zzz2kbn0SrQJHphmsGeTkQDyOHDhrP7I'),
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
