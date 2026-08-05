import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius, Shadows } from '../../../src/theme';
import { useTranslation } from 'react-i18next';

export default function MedicineHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View
        style={{
          backgroundColor: Colors.surface,
          paddingTop: insets.top,
          marginBottom: Spacing.md,
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('medicine.medicine_intelligence') || 'Medicine Intelligence'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          {t('medicine.explore_aidriven_insights_abou') ||
            `Explore AI-driven insights about your medications. Choose an option below to learn more,
                            compare, or check for potential interactions.`}
        </Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(app)/medicine/explainer')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
            <MaterialCommunityIcons name="pill" size={24} color={Colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {t('medicine.medicine_explainer') || 'Medicine Explainer'}
            </Text>
            <Text style={styles.cardDesc}>
              {t('medicine.learn_about_forms_side_effects') ||
                'Learn about forms, side effects, and dietary conflicts.'}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(app)/medicine/compare')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="scale-balance" size={24} color={Colors.warning} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {t('medicine.medicine_comparator') || 'Medicine Comparator'}
            </Text>
            <Text style={styles.cardDesc}>
              {t('medicine.sidebyside_comparison_with_ai_') ||
                'Side-by-side comparison with AI rationale.'}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(app)/medicine/interaction-checker')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color={Colors.danger} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {t('medicine.interaction_checker') || 'Interaction Checker'}
            </Text>
            <Text style={styles.cardDesc}>
              {t('medicine.crossreference_new_meds_with_y') ||
                'Cross-reference new meds with your active prescriptions.'}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.base,
    paddingLeft: 5,
    paddingVertical: Spacing.sm,
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
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxl * 2,
    paddingTop: Spacing.md,
  },
  description: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: FontSize.md * 1.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    ...Shadows.sm,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
});
