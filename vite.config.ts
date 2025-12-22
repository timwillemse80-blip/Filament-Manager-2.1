
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ''),
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
