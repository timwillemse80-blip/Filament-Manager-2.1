import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.filamentmanager.app',
  appName: 'Filament Manager',
  webDir: 'dist',
  server: {
    // We stellen de server URL in op je eigen domein. 
    // Dit zorgt voor een consistente ervaring tussen de web-versie en de app.
    url: 'https://filamentmanager.nl',
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