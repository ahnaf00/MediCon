import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { symptomTriageService } from '../../../src/services/ai/symptomTriageService';
import { Doctor } from '../../../src/services/api/doctorsService';
import { DoctorCard } from '../../../src/components/cards/DoctorCard';
import { DraggableBottomSheet } from '../../../src/components/ui/DraggableBottomSheet';

type FilterType = 'all' | 'male' | 'female';

export default function SymptomResultsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { q } = useLocalSearchParams();
  const query = typeof q === 'string' ? q : '';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGender, setFilterGender] = useState<FilterType>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const results = await symptomTriageService.searchDoctorsBySymptom(query);
        if (isMounted) setDoctors(results);
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDoctors();
    return () => {
      isMounted = false;
    };
  }, [query]);

  // Mock gender filtering based on names for demo purposes
  const filteredDoctors = doctors.filter((doc) => {
    if (filterGender === 'all') return true;
    const name = doc.fullName.toLowerCase();
    const isFemale = name.includes('sarah') || name.includes('emily') || name.includes('lisa');
    if (filterGender === 'female') return isFemale;
    if (filterGender === 'male') return !isFemale;
    return true;
  });

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

  const count = filteredDoctors.length;
  const doctorWord = count === 1 ? 'doctor' : 'doctors';
  const resultsCountText =
    filterGender === 'all'
      ? `${count} ${doctorWord} available`
      : filterGender === 'male'
        ? `${count} male ${doctorWord} available`
        : `${count} female ${doctorWord} available`;

  return (
    <View style={styles.container}>
      {/* Header — matching My Reports / Departments */}
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {query || t('results.ai_recommendations') || 'Results'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, Spacing.md) },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.resultsCount}>{resultsCountText}</Text>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setIsFilterOpen(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="tune-variant" size={20} color={Colors.textPrimary} />
                <Text style={styles.filterButtonText}>Filter doctors</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t('results.no_matching_doctors_found_for_') ||
                  'No matching doctors found for these symptoms.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Filter Bottom Sheet */}
      <DraggableBottomSheet visible={isFilterOpen} onClose={() => setIsFilterOpen(false)}>
        <View style={styles.filterContent}>
          {(['all', 'male', 'female'] as FilterType[]).map((type, index, array) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterOption, index === array.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => {
                setFilterGender(type);
                setIsFilterOpen(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  filterGender === type && styles.filterOptionTextActive,
                ]}
              >
                {type === 'all'
                  ? 'All doctors'
                  : type === 'male'
                    ? 'Male doctors'
                    : 'Female doctors'}
              </Text>
              {filterGender === type && (
                <MaterialCommunityIcons name="check" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </DraggableBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerWrapper: {
    backgroundColor: Colors.surface,
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: 0,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  resultsCount: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  filterButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  gridItemContainer: {
    flex: 1,
    paddingHorizontal: Spacing.sm / 2, // Horizontal spacing for 2 columns
    paddingBottom: Spacing.md, // Vertical spacing
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.5,
  },
  filterContent: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  filterOptionText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  filterOptionTextActive: {
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
});
