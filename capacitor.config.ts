import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.filamentmanager.app',
  appName: 'Filament Manager',
  webDir: 'dist',
  server: {
    // Set the server URL to your own domain for a consistent PWA/Native experience.
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