import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { hospitalsService } from '../../../src/services/api/hospitalsService';
import { Hospital } from '../../../src/types/medical.types';
import { HospitalCard } from '../../../src/components/cards/HospitalCard';
import { SymptomSearchBar } from '../../../src/components/forms/SymptomSearchBar';
import { useTranslation } from 'react-i18next';

const USE_MOCK_MAP = true; // Temporary flag for Phase 1 without a real API key

export default function HospitalsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [locationStatus, setLocationStatus] = useState<Location.PermissionStatus | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationStatus(status);

        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation(location);
        }
      } catch {
        // Fallback for when location fails (e.g. offline or disabled)
        setLocationStatus(Location.PermissionStatus.DENIED);
      }
    })();
  }, []);

  const { data: hospitals = [], isLoading } = useQuery({
    queryKey: ['hospitals', userLocation?.coords.latitude, userLocation?.coords.longitude],
    queryFn: () => hospitalsService.getNearbyHospitals(userLocation?.coords.latitude, userLocation?.coords.longitude),
    enabled: !!userLocation,
  });

  const handleHospitalPress = (hospital: Hospital) => {
    router.push(`/(app)/hospitals/${hospital.id}`);
  };

  if (!locationStatus) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>
          {t('hospitals.locating_nearby_hospitals', 'Locating nearby hospitals...')}
        </Text>
      </View>
    );
  }

  if (locationStatus !== 'granted' || !userLocation) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="map-marker-off" size={64} color={Colors.textTertiary} />
        <Text style={styles.errorTitle}>
          {t('hospitals.location_unavailable', 'Location Unavailable')}
        </Text>
        <Text style={styles.errorSubtitle}>
          {t('hospitals.we_need_access_to_your_locatio', 'We need access to your location to find nearby hospitals.')}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace('/(app)/(tabs)/hospitals')}
        >
          <Text style={styles.retryButtonText}>{t('hospitals.retry', 'Retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderMap = () => {
    if (USE_MOCK_MAP) {
      return (
        <ImageBackground
          source={require('../../../assets/images/map_placeholder_cropped.jpg')}
          style={styles.map}
          resizeMode="cover"
        >
          {hospitals.map((hospital, index) => {
            const topPositions = ['25%', '45%', '65%'];
            const leftPositions = ['40%', '60%', '20%'];

            return (
              <TouchableOpacity
                key={hospital.id}
                style={[
                  styles.mockMarker,
                  { top: topPositions[index % 3] as any, left: leftPositions[index % 3] as any },
                ]}
                onPress={() => setSelectedHospital(hospital)}
                activeOpacity={0.8}
              >
                <View style={styles.markerContainer}>
                  <MaterialCommunityIcons
                    name="hospital-marker"
                    size={42}
                    color={hospital.hasEmergencyRoom ? Colors.danger : Colors.primary}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </ImageBackground>
      );
    }

    return (
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onPress={() => setSelectedHospital(null)}
      >
        {hospitals.map((hospital) => (
          <Marker
            key={hospital.id}
            coordinate={{ latitude: hospital.latitude, longitude: hospital.longitude }}
            title={hospital.name}
            description={hospital.address}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedHospital(hospital);
            }}
          >
            <View style={styles.markerContainer}>
              <MaterialCommunityIcons
                name="hospital-marker"
                size={36}
                color={hospital.hasEmergencyRoom ? Colors.danger : Colors.primary}
              />
            </View>
          </Marker>
        ))}
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      {renderMap()}

      <View
        style={[styles.floatingHeader, { top: Math.max(insets.top, Spacing.base) + Spacing.sm }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.searchBarWrapper}>
          <SymptomSearchBar interactive placeholder="Search hospitals" />
        </View>
      </View>
      
      {isLoading && (
        <View style={[styles.floatingHeader, { top: Math.max(insets.top, Spacing.base) + 80, justifyContent: 'center' }]}>
           <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}

      {/* Bottom Sheet Overlay for Selected Hospital */}
      {selectedHospital && (
        <View style={styles.bottomOverlay}>
          <HospitalCard
            hospital={selectedHospital}
            onPress={() => handleHospitalPress(selectedHospital)}
            onClose={() => setSelectedHospital(null)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    lineHeight: FontSize.md * 1.5,
  },
  errorTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  errorSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: FontSize.base * 1.5,
  },
  retryButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.surface,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mockMarker: {
    position: 'absolute',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  floatingHeader: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    zIndex: 10,
  },
  searchBarWrapper: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
