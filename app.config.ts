import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';

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
    '@react-native-community/datetimepicker',
    'expo-image',
    'expo-secure-store',
    'expo-status-bar',
  ],
  extra: {
    eas: {
      projectId: 'fc59c36e-7707-4744-924a-aad648c925c8',
    },
  },
});
