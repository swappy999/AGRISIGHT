import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.agrisight.app",
  appName: "AgriSight",
  webDir: "out",
  server: {
    androidScheme: "http",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0f5238",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0f5238",
    },
    Camera: {
      permissionsType: "prompt",
    },
    Geolocation: {
      permissionsType: "prompt",
    },
  },
};

export default config;
