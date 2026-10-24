import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';
import { callEmergency } from '../../utils/callEmergency';

import type { RedFlag } from '../../services/ai/redFlag';

export interface EmergencyCardProps {
  redFlag?: RedFlag | null;
  /** Shows the "Open emergency guide" link when given. */
  onOpenGuide?: () => void;
  /** Shows a close button when given (chats, where the conversation goes on). */
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** "This could be an emergency" with a Call 999 button: symptom results and both AI chats. */
export const EmergencyCard = ({ redFlag, onOpenGuide, onDismiss, style }: EmergencyCardProps) => {
  const { t } = useTranslation();
  const redFlagMessage = redFlag
    ? t(`results.red_flag.${redFlag.code}`, { defaultValue: redFlag.message })
    : null;

  return (
    <View style={[styles.card, style]} accessibilityRole="alert">
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="alert-octagon" size={22} color={Colors.danger} />
        <Text style={styles.title}>
          {t('results.emergency_title') || 'This could be an emergency'}
        </Text>
        {onDismiss ? (
          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('common.close', 'Close')}
          >
            <MaterialCommunityIcons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {redFlagMessage ? <Text style={styles.body}>{redFlagMessage}</Text> : null}
      <Text style={styles.body}>
        {t('results.emergency_body') ||
          'If these symptoms are happening now, call 999 or go to the nearest emergency department. Do not wait for an online consultation.'}
      </Text>
      <TouchableOpacity
        style={styles.callButton}
        onPress={callEmergency}
        accessibilityRole="button"
        accessibilityLabel={t('emergency.call_emergency') || 'Call 999'}
      >
        <MaterialCommunityIcons name="phone" size={20} color={Colors.surface} />
        <Text style={styles.callButtonText}>{t('emergency.call_emergency') || 'Call 999'}</Text>
      </TouchableOpacity>
      {onOpenGuide ? (
        <TouchableOpacity
          style={styles.guideButton}
          onPress={onOpenGuide}
          accessibilityRole="button"
        >
          <Text style={styles.guideButtonText}>
            {t('results.open_emergency_guide') || 'Open emergency guide'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FDECEF',
    borderWidth: 1,
    borderColor: Colors.danger,
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.danger,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: FontSize.sm * 1.5,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  callButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
  },
  guideButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  guideButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.danger,
  },
});
