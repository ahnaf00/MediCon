import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize } from '@theme';
import { Feather } from '@expo/vector-icons';
import type { ProtocolStep } from '../../services/protocols/emergency-protocols.data';

export interface EmergencyStepCardProps {
  step: ProtocolStep;
  stepIndex: number;
  totalSteps: number;
}

export const EmergencyStepCard = ({
  step,
  stepIndex,
  totalSteps,
}: EmergencyStepCardProps): React.JSX.Element => {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Step ${stepIndex} of ${totalSteps}: ${step.instruction}${
        step.warning ? `. Warning: ${step.warning}` : ''
      }`}
    >
      {/* Vertical line connecting steps (hidden on the last step) */}
      {stepIndex < totalSteps && <View style={styles.timelineLine} />}

      <View style={styles.header}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{stepIndex}</Text>
        </View>
        <View style={styles.textContent}>
          <Text
            style={styles.instruction}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          >
            {step.instruction}
          </Text>

          {step.warning && (
            <View
              style={styles.warningContainer}
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
            >
              <Feather name="alert-circle" color={Colors.danger} size={18} />
              <Text style={styles.warningText}>{step.warning}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xl,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 15.5, // center of the 32px badge (16px) - 0.5px (half of 1px width)
    top: 32,
    bottom: 0,
    width: 1,
    borderLeftWidth: 1,
    borderLeftColor: Colors.primary,
    borderStyle: 'dashed',
    opacity: 0.2,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    zIndex: 1,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  numberText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.surface,
  },
  textContent: {
    flex: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  instruction: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    lineHeight: FontSize.lg * 1.5,
  },
  warningContainer: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.danger + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.danger,
    lineHeight: FontSize.sm * 1.5,
  },
});
