import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize, Layout } from '@theme';
import {
  EMERGENCY_PROTOCOLS,
  getProtocolStepsForAge,
} from '../../../src/services/protocols/emergency-protocols.data';
import { EmergencyStepCard } from '../../../src/components/medical/EmergencyStepCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function PediatricProtocolScreen() {
  const { t } = useTranslation();
  const { protocol: protocolId } = useLocalSearchParams<{ protocol: string }>();
  const router = useRouter();
  const [ageBand, setAgeBand] = useState<'child' | 'infant'>('child');

  const protocol = EMERGENCY_PROTOCOLS[protocolId];

  if (!protocol) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>{t('[protocol].protocol_not_found') || 'Protocol not found.'}</Text>
      </SafeAreaView>
    );
  }

  const steps = getProtocolStepsForAge(protocol, ageBand);

  // Check if there's actually a difference from adult (for information banner)
  const hasSpecificVariant =
    ageBand === 'child' ? Boolean(protocol.steps.child) : Boolean(protocol.steps.infant);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" color={Colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('pediatric.treating_child_infant', 'Treating Child or Infant')}
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, ageBand === 'child' && styles.activeTab]}
          onPress={() => setAgeBand('child')}
          accessibilityRole="button"
          accessibilityState={{ selected: ageBand === 'child' }}
        >
          <Text style={[styles.tabText, ageBand === 'child' && styles.activeTabText]}>
            {t('[protocol].child_1_yr_puberty') || 'Child (1 yr - Puberty)'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, ageBand === 'infant' && styles.activeTab]}
          onPress={() => setAgeBand('infant')}
          accessibilityRole="button"
          accessibilityState={{ selected: ageBand === 'infant' }}
        >
          <Text style={[styles.tabText, ageBand === 'infant' && styles.activeTabText]}>
            {t('[protocol].infant_under_1_yr') || 'Infant (Under 1 yr)'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!hasSpecificVariant && (
          <View style={styles.infoBanner}>
            <MaterialCommunityIcons name="information" color={Colors.secondary} size={20} />
            <Text style={styles.infoBannerText}>
              {t('[protocol].standard_protocol_applies_for_') ||
                'Standard protocol applies for this age group.'}
            </Text>
          </View>
        )}

        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <EmergencyStepCard
              key={step.id}
              step={step}
              stepIndex={index + 1}
              totalSteps={steps.length}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
    backgroundColor: Colors.surface,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.secondary,
  },
  tabText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  activeTabText: {
    fontFamily: FontFamily.bold,
    color: Colors.secondary,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Layout.tabBarHeight + Spacing.xl,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.secondary,
    lineHeight: FontSize.sm * 1.5,
  },
  stepsContainer: {
    gap: Spacing.xs,
  },
});
