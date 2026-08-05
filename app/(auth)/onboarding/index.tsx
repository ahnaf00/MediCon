// 1. IMPORTS
import React, { useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
import type { ViewToken } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize, Layout } from '@theme';
import { OnboardingCard } from '../../../src/components/cards/OnboardingCard';
import { useOnboardingStore } from '../../../src/store/onboardingStore';
import { useTranslation } from 'react-i18next';

// 2. TYPES
interface SlideData {
  id: string;
  icon: string;
  title: string;
  description: string;
  accentColor: string;
}

// 3. COMPONENT
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES: SlideData[] = [
  {
    id: 'welcome',
    icon: '🏥',
    title: 'Welcome to MediCon',
    description:
      'Your trusted companion for managing health records, connecting with doctors, and accessing emergency care — all in one place.',
    accentColor: Colors.primary,
  },
  {
    id: 'emergency',
    icon: '🚨',
    title: 'Emergency Protocols',
    description:
      'Access step-by-step first aid guides for CPR, choking, burns, and more — fully offline, no internet required. Help is always at your fingertips.',
    accentColor: Colors.danger,
  },
  {
    id: 'ai',
    icon: '🤖',
    title: 'AI-Powered Insights',
    description:
      'Get intelligent symptom triage, lab report interpretation, and medicine information — designed to inform, never to replace your doctor.',
    accentColor: Colors.secondary,
  },
  {
    id: 'getstarted',
    icon: '🚀',
    title: 'Ready to Get Started?',
    description:
      'Create your profile, add your health information, and take control of your well-being today.',
    accentColor: Colors.primary,
  },
];

export default function OnboardingScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const setHasSeenOnboarding = useOnboardingStore((s) => s.setHasSeenOnboarding);
  const flatListRef = useRef<FlatList<SlideData>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const isFirstSlide = currentIndex === 0;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const [viewabilityConfig] = useState({ viewAreaCoveragePercentThreshold: 50 });

  const scrollToIndex = useCallback((index: number): void => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const handleNext = useCallback((): void => {
    if (!isLastSlide) {
      scrollToIndex(currentIndex + 1);
    }
  }, [currentIndex, isLastSlide, scrollToIndex]);

  const handleBack = useCallback((): void => {
    if (!isFirstSlide) {
      scrollToIndex(currentIndex - 1);
    }
  }, [currentIndex, isFirstSlide, scrollToIndex]);

  const handleComplete = useCallback((): void => {
    setHasSeenOnboarding(true);
    router.replace('/(auth)/login');
  }, [setHasSeenOnboarding, router]);

  const handleSkip = useCallback((): void => {
    setHasSeenOnboarding(true);
    router.replace('/(auth)/login');
  }, [setHasSeenOnboarding, router]);

  const renderItem = useCallback(
    ({ item }: { item: SlideData }): React.JSX.Element => (
      <View style={styles.slide}>
        <OnboardingCard
          icon={item.icon}
          title={item.title}
          description={item.description}
          accentColor={item.accentColor}
        />
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: SlideData): string => item.id, []);

  return (
    <View style={styles.container}>
      {/* Skip button — hidden on last slide */}
      <View style={styles.skipContainer}>
        {!isLastSlide ? (
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            accessibilityHint="Skips the introduction and goes to the login screen"
          >
            <Text style={styles.skipText}>{t('onboarding.skip') || 'Skip'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Bottom controls */}
      <View style={styles.bottomContainer}>
        {/* Dot indicators */}
        <View
          style={styles.dotsContainer}
          accessibilityLabel={`Slide ${currentIndex + 1} of ${SLIDES.length}`}
        >
          {SLIDES.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.dot, index === currentIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {/* Navigation buttons — non-gesture alternative */}
        <View style={styles.navRow}>
          {!isFirstSlide ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go to previous slide"
            >
              <Text style={styles.backButtonText}>{t('onboarding.back') || 'Back'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}

          {isLastSlide ? (
            <TouchableOpacity
              onPress={handleComplete}
              style={styles.primaryButton}
              accessibilityRole="button"
              accessibilityLabel="Get Started"
              accessibilityHint="Completes onboarding and goes to the login screen"
            >
              <Text style={styles.primaryButtonText}>
                {t('onboarding.get_started') || 'Get Started'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleNext}
              style={styles.primaryButton}
              accessibilityRole="button"
              accessibilityLabel="Go to next slide"
            >
              <Text style={styles.primaryButtonText}>{t('onboarding.next') || 'Next'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipContainer: {
    alignItems: 'flex-end',
    paddingTop: Spacing.xxxl + Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  skipButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: FontSize.base * 1.5,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    marginHorizontal: Spacing.xs,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  dotInactive: {
    backgroundColor: Colors.textTertiary,
    opacity: 0.4,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    minWidth: 80,
    minHeight: Layout.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  primaryButton: {
    minWidth: 140,
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  primaryButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.surface,
  },
});
