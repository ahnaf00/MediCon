import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { hospitalsService } from '../../../src/services/api/hospitalsService';
import { Hospital } from '../../../src/types/medical.types';
import { Doctor } from '../../../src/services/api/doctorsService';
import { DoctorCard } from '../../../src/components/cards/DoctorCard';
import { Modal } from '../../../src/components/ui/Modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function HospitalDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoModalConfig, setInfoModalConfig] = useState<{
    visible: boolean;
    title: string;
    content: string;
  }>({
    visible: false,
    title: '',
    content: '',
  });
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (!id) throw new Error('No hospital ID provided');

        const details = await hospitalsService.getHospitalDetails(id);
        setHospital(details.hospital);
        setDoctors(details.doctors);
      } catch {
        setError('Failed to load hospital details. Please check your connection.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !hospital) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text style={styles.errorText}>{error || 'Hospital not found.'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('[id].go_back') || 'Go Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const IMAGE_HEIGHT = 280;
  const HEADER_OFFSET = insets.top + IMAGE_HEIGHT * 0.3;
  const SPACER_HEIGHT = IMAGE_HEIGHT - HEADER_OFFSET - 24;

  const borderRadius = scrollY.interpolate({
    inputRange: [0, Math.max(1, SPACER_HEIGHT)],
    outputRange: [0, BorderRadius.xl],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* 1. Fixed Background Image */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: IMAGE_HEIGHT }}>
        {hospital.imageUrl ? (
          <Image source={{ uri: hospital.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <MaterialCommunityIcons name="hospital-building" size={48} color={Colors.primary} />
          </View>
        )}
      </View>

      {/* 2. Floating Back Button */}
      <TouchableOpacity
        style={[styles.floatingBackButton, { top: insets.top + Spacing.sm, zIndex: 10 }]}
        onPress={() => router.back()}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      {/* 3. Animated Native ScrollView */}
      <Animated.ScrollView
        style={{ flex: 1, marginTop: HEADER_OFFSET }}
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
      >
        {/* Index 0: Transparent Spacer */}
        <View style={{ height: SPACER_HEIGHT }} />

        {/* Index 1: Main Hospital Name Card (Unchanged) */}
        <View style={styles.stickyHeader}>
          <Text style={styles.name}>{hospital.name}</Text>
        </View>

        {/* Index 2: Scrollable Content (Key Details & Available Doctors) */}
        <Animated.View
          style={[
            styles.scrollableContent,
            {
              paddingBottom: insets.bottom + Spacing.xl,
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
            },
          ]}
        >
          <View style={styles.tagsContainer}>
            {hospital.hasEmergencyRoom && (
              <View style={[styles.imageBadge, styles.imageBadgeDanger]}>
                <MaterialCommunityIcons name="heart-pulse" size={12} color={Colors.surface} />
                <Text style={styles.imageBadgeDangerText}>
                  {t('[id].er_available') || 'Emergency Room Available'}
                </Text>
              </View>
            )}
            {hospital.isOpen24x7 && (
              <View style={styles.imageBadge}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.primary} />
                <Text style={styles.imageBadgeText}>{t('[id].24x7_open') || '24x7 Open'}</Text>
              </View>
            )}
          </View>

          {/* 2-column info grid */}
          <View style={styles.infoGrid}>
            {/* Address — full width */}
            <View style={[styles.infoTile, styles.infoTileFullWidth]}>
              <View style={styles.infoTileIcon}>
                <MaterialCommunityIcons name="map-marker" size={18} color={Colors.primary} />
              </View>
              <View style={styles.infoTileContent}>
                <Text style={styles.infoTileLabel}>Address</Text>
                <Text style={styles.infoTileValue} numberOfLines={2}>
                  {hospital.address}
                </Text>
              </View>
            </View>

            {/* Phone */}
            <View style={styles.infoTile}>
              <View style={styles.infoTileIcon}>
                <MaterialCommunityIcons name="phone" size={16} color={Colors.primary} />
              </View>
              <View style={styles.infoTileContent}>
                <View style={styles.labelRow}>
                  <Text style={styles.infoTileLabel}>Contact</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setInfoModalConfig({
                        visible: true,
                        title: 'Contact',
                        content:
                          'The general reception/front-desk number of the hospital. You call this for booking an appointment, asking about visiting hours, inquiring about a department, billing and administrative queries.',
                      })
                    }
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialCommunityIcons
                      name="help-circle-outline"
                      size={14}
                      color={Colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.infoTileValue}>{hospital.contactNumber}</Text>
              </View>
            </View>

            {/* Emergency */}
            {hospital.emergencyNumber ? (
              <View style={[styles.infoTile, styles.infoTileDanger]}>
                <View style={[styles.infoTileIcon, styles.infoTileIconDanger]}>
                  <MaterialCommunityIcons name="ambulance" size={16} color={Colors.danger} />
                </View>
                <View style={styles.infoTileContent}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.infoTileLabel, { color: 'rgba(208, 42, 65, 0.6)' }]}>
                      Emergency
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setInfoModalConfig({
                          visible: true,
                          title: 'Emergency',
                          content:
                            'A dedicated hotline routed directly to the ER triage desk — bypassing reception entirely. You call this when someone is having a life-threatening situation, you need an ambulance dispatched immediately, or a patient needs to be pre-alerted before arrival so the ER team is ready.',
                        })
                      }
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MaterialCommunityIcons
                        name="help-circle-outline"
                        size={14}
                        color="rgba(208, 42, 65, 0.6)"
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.infoTileValue, { color: Colors.danger }]}>
                    {hospital.emergencyNumber}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.infoTile, { opacity: 0 }]} />
            )}
          </View>

          <Text style={styles.sectionTitle}>
            {t('[id].available_doctors') || 'Available Doctors'}
          </Text>

          {doctors.length > 0 ? (
            <View style={styles.doctorsGrid}>
              {doctors.map((item) => (
                <View key={item.id} style={styles.doctorCardWrapper}>
                  <DoctorCard
                    doctor={item}
                    variant="online"
                    fullWidth
                    onPress={() => router.push(`/(app)/doctors/${item.id}`)}
                    onBookPress={() =>
                      router.push(`/(app)/doctors/booking/digest?doctorId=${item.id}&type=video`)
                    }
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t('[id].no_doctors_currently_listed_fo') ||
                  'No doctors currently listed for this hospital.'}
              </Text>
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>

      <Modal
        visible={infoModalConfig.visible}
        onClose={() => setInfoModalConfig((prev) => ({ ...prev, visible: false }))}
        title={infoModalConfig.title}
      >
        <Text style={styles.modalContentText}>{infoModalConfig.content}</Text>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.5,
  },
  backButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.surface,
  },
  floatingBackButton: {
    position: 'absolute',
    left: Spacing.base,
    backgroundColor: Colors.surface,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContainer: {
    backgroundColor: Colors.background,
  },
  imageContainer: {
    width: '100%',
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyHeader: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    zIndex: 2,
  },
  scrollableContent: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    marginTop: -24,
    paddingTop: 24,
    zIndex: 1,
  },
  name: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: 20, // matches Spacing.base (16) + Spacing.xs (4) from hospital name
  },
  infoTile: {
    flex: 1,
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: Colors.tertiary,
  },
  infoTileFullWidth: {
    flexBasis: '100%',
  },
  infoTileDanger: {
    backgroundColor: 'rgba(208, 42, 65, 0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(208, 42, 65, 0.2)',
  },
  infoTileIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoTileIconDanger: {
    backgroundColor: 'rgba(208, 42, 65, 0.1)',
  },
  infoTileContent: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  infoTileLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  infoTileValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  imageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.tertiary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  imageBadgeDanger: {
    backgroundColor: Colors.danger,
  },
  imageBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  imageBadgeDangerText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.surface,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginTop: 0,
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  modalContentText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: FontSize.md * 1.5,
  },
  doctorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  doctorCardWrapper: {
    width: '48%',
    marginBottom: Spacing.md,
  },
});
