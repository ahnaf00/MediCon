import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development' || process.env.NODE_ENV === 'development';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? 'Medicon (Dev)' : 'Medicon',
  slug: 'medicon',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_DEV ? 'com.anonymous.medicon.dev' : 'com.anonymous.medicon',
  },
  android: {
    package: IS_DEV ? 'com.anonymous.medicon.dev' : 'com.anonymous.medicon',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'dummy_api_key_for_development',
      },
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  updates: {
    url: 'https://u.expo.dev/fc59c36e-7707-4744-924a-aad648c925c8',
    enabled: !IS_DEV,
    checkAutomatically: IS_DEV ? 'NEVER' : 'ON_LOAD',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  scheme: 'medicon',
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow $(PRODUCT_NAME) to use your location to find nearby hospitals.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'The app accesses your photos to let you share them with your doctors.',
        cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera to scan lab reports.',
      },
    ],
    'expo-document-picker',
    [
      'expo-media-library',
      {
        // Write-only: the app saves prescription images, it never reads the gallery.
        // The read message stays the one expo-image-picker sets above.
        photosPermission: false,
        savePhotosPermission: 'Allow $(PRODUCT_NAME) to save prescription images to your photos.',
        isAccessMediaLocationEnabled: false,
        granularPermissions: ['photo'],
      },
    ],
    'expo-sharing',
    '@react-native-community/datetimepicker',
    'expo-image',
    'expo-secure-store',
    'expo-status-bar',
  ],
  extra: {
    // Resolved per build profile from eas.json; read at runtime via src/constants/config.ts.
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: {
      projectId: 'fc59c36e-7707-4744-924a-aad648c925c8',
    },
  },
});
