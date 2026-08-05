import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize, Layout } from '@theme';
import {
  EMERGENCY_PROTOCOLS,
  getProtocolStepsForAge,
} from '../../../src/services/protocols/emergency-protocols.data';
import { EmergencyStepCard } from '../../../src/components/medical/EmergencyStepCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';

const ImageMap: Record<string, any> = {
  cpr: require('../../../src/assets/images/emergency/CPR.png'),
  choking: require('../../../src/assets/images/emergency/Choking.png'),
  'severe-bleeding': require('../../../src/assets/images/emergency/Severe Bleeding.png'),
  burns: require('../../../src/assets/images/emergency/Burns.png'),
  'heat-stroke': require('../../../src/assets/images/emergency/Heat Stroke.png'),
  'heat-exhaustion': require('../../../src/assets/images/emergency/Heat Exhaustion.png'),
  unconscious: require('../../../src/assets/images/emergency/Unconscious.png'),
};

export default function EmergencyProtocolScreen() {
  const { t } = useTranslation();
  const { protocol: protocolId } = useLocalSearchParams<{ protocol: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const protocol = EMERGENCY_PROTOCOLS[protocolId];

  if (!protocol) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>{t('[protocol].protocol_not_found') || 'Protocol not found.'}</Text>
      </SafeAreaView>
    );
  }

  const steps = getProtocolStepsForAge(protocol, 'adult');
  const hasPediatricVariant = Boolean(protocol.steps.child || protocol.steps.infant);
  const imageSource = ImageMap[protocol.id];

  return (
    <View style={styles.container}>
      {/* Header Wrapper for Status Bar */}
      <View
        style={{
          backgroundColor: Colors.surface,
          paddingTop: insets.top,
        }}
      >
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
            {protocol.title}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {imageSource && (
          <View style={[styles.bannerContainer, { backgroundColor: protocol.color + '15' }]}>
            <Image source={imageSource} style={styles.bannerImage} resizeMode="cover" />
            <View style={styles.fadeOverlay}>
              {Array.from({ length: 40 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    top: `${(i / 40) * 100}%`,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  }}
                />
              ))}
            </View>
            <View style={styles.descriptionOverlay}>
              <Text style={styles.descriptionTextOnImage}>{protocol.description}</Text>
            </View>
          </View>
        )}

        {hasPediatricVariant && (
          <TouchableOpacity
            style={styles.pediatricButton}
            onPress={() => router.push(`/(app)/pediatric/${protocol.id}`)}
            accessibilityRole="button"
            accessibilityLabel="Switch to Pediatric Version"
            activeOpacity={0.8}
          >
            <View style={styles.pediatricIconBg}>
              <MaterialCommunityIcons name="human-child" color={Colors.primary} size={24} />
            </View>
            <View style={styles.pediatricBannerTextContainer}>
              <Text style={styles.pediatricBannerTitle}>
                {t('[protocol].treating_a_child_or_infant') || 'Treating a child or infant?'}
              </Text>
              <Text style={styles.pediatricBannerSub}>
                {t('[protocol].view_pediatric_guidelines') || 'Tap to view guidelines'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" color={Colors.surface} size={24} />
          </TouchableOpacity>
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
    paddingRight: Spacing.base,
    paddingLeft: 5,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
    height: 60,
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
    paddingBottom: Layout.tabBarHeight + Spacing.xl,
  },
  bannerContainer: {
    width: '100%',
    height: 220,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  descriptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    paddingBottom: Spacing.md,
  },
  descriptionTextOnImage: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: Colors.surface,
    lineHeight: 18 * 1.5,
  },
  pediatricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  pediatricIconBg: {
    backgroundColor: Colors.surface,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pediatricBannerTextContainer: {
    flex: 1,
  },
  pediatricBannerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.surface,
  },
  pediatricBannerSub: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.surface,
    opacity: 0.9,
    marginTop: 2,
  },
  stepsContainer: {
    gap: 0,
    paddingHorizontal: Spacing.base,
  },
});
