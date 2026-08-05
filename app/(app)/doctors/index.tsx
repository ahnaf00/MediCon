// 1. IMPORTS
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontFamily, FontSize } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { doctorsService, Doctor } from '../../../src/services/api/doctorsService';
import { DoctorCard } from '../../../src/components/cards/DoctorCard';
import { useTranslation } from 'react-i18next';

// 2. TYPES
/* No external props */

// 3. COMPONENT
export default function DoctorsListScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const insets = useSafeAreaInsets();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const data = await doctorsService.getDoctors(category);
        setDoctors(data);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [category]);

  const renderItem = useCallback(
    ({ item }: { item: Doctor }) => (
      <View style={styles.gridItemContainer}>
        <DoctorCard
          doctor={item}
          variant="online"
          fullWidth
          onPress={() => router.push(`/(app)/doctors/${item.id}`)}
          onBookPress={() =>
            router.push(`/(app)/doctors/booking/digest?doctorId=${item.id}&type=video`)
          }
          hideSectionLabel
        />
      </View>
    ),
    [router],
  );

  return (
    <View style={styles.container}>
      {/* Header Wrapper */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{category ? 'Specialists' : 'Online Doctors'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : doctors.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="doctor" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>
            {t('doctors.no_doctors_found') || 'No doctors found'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={doctors}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, Spacing.md) },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerWrapper: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.base,
    paddingLeft: 5,
    paddingVertical: Spacing.sm,
    height: 60,
    gap: Spacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: 0,
  },
  gridItemContainer: {
    flex: 1,
    paddingHorizontal: Spacing.sm / 2, // Horizontal spacing for 2 columns
    paddingBottom: Spacing.md, // Vertical spacing
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: FontSize.md * 1.5,
  },
});
