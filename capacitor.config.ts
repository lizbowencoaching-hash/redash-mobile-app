import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.redash.app',
  appName: 'REDash',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    minVersion: '13.0',
    cordovaSwiftVersion: '5.0'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false
    }
  }
};

export default config;
