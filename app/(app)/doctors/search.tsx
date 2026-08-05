import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { SymptomSearchBar } from '../../../src/components/forms/SymptomSearchBar';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { autoRecord } = useLocalSearchParams<{ autoRecord?: string }>();

  const handleSubmit = (query: string) => {
    router.push({
      pathname: '/(app)/symptom/results',
      params: { q: query },
    });
  };

  const suggestions = [
    { key: 'search.fever_cold' as const },
    { key: 'search.allergies' as const },
    { key: 'search.child_health' as const },
    { key: 'search.weight' as const },
    { key: 'search.skin_problems' as const },
    { key: 'search.hair_loss' as const },
    { key: 'search.acidity' as const },
    { key: 'search.diarrhoea' as const },
    { key: 'search.nose_ear_throat' as const },
    { key: 'search.stress_depression' as const },
    { key: 'search.joint_pain' as const },
    { key: 'search.stomach_pain' as const },
    { key: 'search.headache' as const },
    { key: 'search.eye_problems' as const },
    { key: 'search.hormonal' as const },
    { key: 'search.sexual_health' as const },
    { key: 'search.menstrual' as const },
    { key: 'search.pregnancy' as const },
    { key: 'search.kidney' as const },
    { key: 'search.chest_heart' as const },
    { key: 'search.breathing_asthma' as const },
    { key: 'search.uti' as const },
    { key: 'search.diabetes' as const },
    { key: 'search.blood_pressure' as const },
  ];

  const handleChipPress = (label: string) => {
    router.push({
      pathname: '/(app)/symptom/results',
      params: { q: label },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header — white status bar area + search bar row */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.searchRow}>
          {/* Circular back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Reuse SymptomSearchBar in interactive mode */}
          <View style={styles.searchBarWrapper}>
            <SymptomSearchBar interactive autoFocus onSubmit={handleSubmit} />
          </View>
        </View>
      </View>

      {/* Suggestions */}
      <ScrollView
        style={styles.suggestionsScroll}
        contentContainerStyle={[
          styles.suggestionsContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.suggestionsTitle}>
          {t('search.suggestions_title') || 'Common health concerns'}
        </Text>
        <View style={styles.chipsContainer}>
          {suggestions.map((s) => {
            const label = t(s.key);
            return (
              <TouchableOpacity
                key={s.key}
                style={styles.chip}
                onPress={() => handleChipPress(label)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // White header area that covers status bar
  headerWrapper: {
    backgroundColor: Colors.surface,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    gap: Spacing.base,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrapper: {
    flex: 1,
  },
  suggestionsScroll: {
    flex: 1,
  },
  suggestionsContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  suggestionsTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
});
