import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../../src/theme';
import { useTranslation } from 'react-i18next';

export default function VideoCallPlaceholderScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.placeholderBox}>
          <MaterialCommunityIcons name="video-outline" size={64} color={Colors.primary} />
          <Text style={styles.title}>{t('video-call.video_call_room') || 'Video Call Room'}</Text>
          <Text style={styles.explicitNotice}>
            {t('video-call.placeholder_video_integration_') ||
              'PLACEHOLDER: Video integration deferred to Milestone 2.11'}
          </Text>
          <Text style={styles.subtitle}>
            {t('video-call.waiting_for_doctor_to_join_app') ||
              'Waiting for doctor to join appointment #'}
            {id}...
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.endCallButton}
          onPress={() => {
            router.dismissAll();
            router.replace('/(app)/(tabs)/');
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="phone-hangup" size={24} color={Colors.surface} />
          <Text style={styles.endCallText}>
            {t('video-call.end_call_mock') || 'End Call (Mock)'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Dark background for video call feel
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  placeholderBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  explicitNotice: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    padding: Spacing.sm,
    backgroundColor: `${Colors.danger}15`,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
  },
  endCallButton: {
    flexDirection: 'row',
    backgroundColor: Colors.danger,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  endCallText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.surface,
    lineHeight: FontSize.md * 1.5,
  },
});
