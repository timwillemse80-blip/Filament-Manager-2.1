import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.filamentmanager.app',
  appName: 'Filament Manager',
  webDir: 'dist',
  server: {
    // ⚠️ STAP 1: Plak hier jouw Vercel link (zonder slash aan het einde)
    // Bijvoorbeeld: 'https://mijn-filament-app.vercel.app'
    url: 'https://filament-manager-2-0.vercel.app', 
    cleartext: true,
    allowNavigation: ['*']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f172a",
      showSpinner: false,
      androidSplashResourceName: "splash",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;