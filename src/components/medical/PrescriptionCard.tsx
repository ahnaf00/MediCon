// 1. IMPORTS
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Prescription } from '../../types/medical.types';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';
import { Avatar } from '../ui/Avatar';
import { doctorPlaceholders } from '../../constants/images';

// 2. TYPES

export interface PrescriptionCardProps {
  prescription: Prescription;
  isScheduled?: boolean;
  isScheduling?: boolean;
  onPress: () => void;
  onToggleSchedule: () => void;
}

// 3. COMPONENT

export function PrescriptionCard({
  prescription,
  isScheduled = false,
  isScheduling = false,
  onPress,
  onToggleSchedule,
}: PrescriptionCardProps): React.JSX.Element {
  const isDoctor = prescription.source === 'DOCTOR';

  const issueDate = new Date(prescription.issuedAt);
  const formattedDateTime =
    issueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' • ' +
    issueDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={
        isDoctor
          ? `Prescription from ${prescription.doctorName ?? 'Doctor'}, issued ${formattedDateTime}${isScheduled ? ', currently scheduled' : ''}`
          : `Uploaded prescription ID ${prescription.id.slice(-4).toUpperCase()}, uploaded ${formattedDateTime}${isScheduled ? ', currently scheduled' : ''}`
      }
      accessibilityState={{ selected: isScheduled }}
    >
      <View style={styles.contentRow}>
        {/* Left Section: Avatar or ID */}
        <View style={styles.leftSection}>
          {isDoctor ? (
            <Avatar
              name={prescription.doctorName ?? 'Doctor'}
              source={
                doctorPlaceholders[(prescription.doctorId?.length ?? prescription.id.length) % 5]
              }
              size={48}
            />
          ) : null}
          <View style={styles.titleBlock}>
            {isDoctor ? (
              <Text style={styles.title} numberOfLines={1}>
                {prescription.doctorName ?? 'Doctor'}
              </Text>
            ) : (
              <Text style={styles.title} numberOfLines={1}>
                Prescription #{prescription.id.slice(-4).toUpperCase()}
              </Text>
            )}
            <Text style={styles.subtitle} numberOfLines={1}>
              {formattedDateTime}
            </Text>
          </View>
        </View>

        {/* Right Section: Schedule Button */}
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={[styles.scheduleBtn, isScheduled && styles.scheduleBtnActive]}
            onPress={onToggleSchedule}
            disabled={isScheduling}
            accessibilityRole="button"
            accessibilityLabel={isScheduled ? 'Unschedule' : 'Schedule'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isScheduling ? (
              <ActivityIndicator
                size="small"
                color={isScheduled ? Colors.danger : Colors.primary}
              />
            ) : (
              <Text style={[styles.scheduleBtnText, isScheduled && styles.scheduleBtnTextActive]}>
                {isScheduled ? 'Unschedule' : 'Schedule'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
    minHeight: 48,
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.bold,
    fontWeight: '900',
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: Spacing.sm,
  },
  scheduleBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
    minWidth: 75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleBtnActive: {
    borderColor: Colors.danger,
  },
  scheduleBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.primary,
    lineHeight: FontSize.xs * 1.5,
  },
  scheduleBtnTextActive: {
    color: Colors.danger,
  },
});
