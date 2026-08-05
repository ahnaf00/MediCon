import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize, Layout } from '@theme';
import { EMERGENCY_PROTOCOLS } from '../../../src/services/protocols/emergency-protocols.data';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const IconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  activity: 'heart-pulse',
  'user-x': 'account-remove',
  droplet: 'water',
  flame: 'fire',
  'alert-triangle': 'alert',
  sun: 'white-balance-sunny',
  thermometer: 'thermometer',
  bed: 'bed',
};

const ImageMap: Record<string, any> = {
  cpr: require('../../../src/assets/images/emergency/CPR.png'),
  choking: require('../../../src/assets/images/emergency/Choking.png'),
  'severe-bleeding': require('../../../src/assets/images/emergency/Severe Bleeding.png'),
  burns: require('../../../src/assets/images/emergency/Burns.png'),
  'heat-stroke': require('../../../src/assets/images/emergency/Heat Stroke.png'),
  'heat-exhaustion': require('../../../src/assets/images/emergency/Heat Exhaustion.png'),
  unconscious: require('../../../src/assets/images/emergency/Unconscious.png'),
};

export default function EmergencyTriageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Sort protocols: Call emergency services first, then the rest.
  const protocols = Object.values(EMERGENCY_PROTOCOLS).sort(
    (a, b) => Number(b.callEmergencyServices) - Number(a.callEmergencyServices),
  );

  const renderItem = ({ item }: { item: (typeof protocols)[0] }) => {
    const iconName = IconMap[item.iconName] || 'alert';
    const imageSource = ImageMap[item.id];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/emergency/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.description}`}
        accessibilityHint="Double tap to open this emergency protocol"
        activeOpacity={0.8}
      >
        <View style={[styles.imageRow, { backgroundColor: item.color + '15' }]}>
          {imageSource ? (
            <Image source={imageSource} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name={iconName} color={item.color} size={48} />
          )}
        </View>
        <View style={styles.cardTextContent}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const headerBackgroundColor = (Colors as any).emergency || Colors.danger;

  return (
    <View style={styles.container}>
      {/* Header Wrapper for Status Bar */}
      <View
        style={{
          backgroundColor: headerBackgroundColor,
          paddingTop: insets.top,
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.surface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('emergency.emergency_triage') || 'Emergency Triage'}
          </Text>
        </View>
      </View>

      <View style={styles.descSection}>
        <Text style={styles.descText} numberOfLines={2}>
          {t('emergency.life_threatening_instruction') ||
            'Call 911 for severe emergencies, or\nchoose a situation for offline guidance.'}
        </Text>
        <TouchableOpacity
          style={styles.call911Button}
          accessibilityRole="button"
          accessibilityLabel="Call 911"
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="phone" color={Colors.surface} size={16} />
          <Text style={styles.call911Text}>{t('emergency.call_911') || 'Call 911'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={protocols}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    color: Colors.surface,
  },
  descSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  descText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md - 2,
    lineHeight: (FontSize.md - 2) * 1.5,
    color: Colors.textSecondary,
    marginRight: Spacing.md,
  },
  call911Button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: (Colors as any).emergency || Colors.danger,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  call911Text: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.surface,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Layout.tabBarHeight + Spacing.xl,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  imageRow: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardTextContent: {
    padding: Spacing.base,
    paddingTop: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
});
