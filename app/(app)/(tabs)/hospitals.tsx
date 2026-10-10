import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { hospitalsService } from '../../../src/services/api/hospitalsService';
import { Hospital } from '../../../src/types/medical.types';
import { HospitalCard } from '../../../src/components/cards/HospitalCard';
import { SymptomSearchBar } from '../../../src/components/forms/SymptomSearchBar';
import { useTranslation } from 'react-i18next';

export default function HospitalsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [search, setSearch] = useState('');

  const { data: hospitals = [], isLoading } = useQuery({
    queryKey: ['hospitals', search],
    queryFn: () => hospitalsService.getNearbyHospitals(undefined, undefined, search),
  });

  const handleHospitalPress = (hospital: Hospital) => {
    router.push(`/(app)/hospitals/${hospital.id}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('hospitals.title', 'Hospitals')}</Text>
      </View>

      <View style={styles.searchBarWrapper}>
        <SymptomSearchBar
          interactive
          placeholder={t('hospitals.search_placeholder') || 'Search hospitals'}
          onSubmit={setSearch}
          onClear={() => setSearch('')}
        />
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={hospitals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          ListEmptyComponent={
            search ? (
              <Text style={styles.emptyText}>
                {t('hospitals.no_results', { query: search }) || `No hospitals match "${search}".`}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <HospitalCard hospital={item} onPress={() => handleHospitalPress(item)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  searchBarWrapper: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  listContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingTop: Spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
