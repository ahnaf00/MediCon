// 1. IMPORTS
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Prescription } from '../../types/medical.types';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';

// 2. TYPES

export interface PrescriptionCardProps {
  prescription: Prescription;
  /** kept for backward-compat; no longer rendered on card face */
  isScheduled?: boolean;
  isScheduling?: boolean;
  onPress: () => void;
  /** kept for backward-compat; no longer called from card face */
  onToggleSchedule?: () => void;
}

// 3. STATUS BADGE

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',    color: Colors.success,  bg: '#e6f9f0' },
  expired:   { label: 'Expired',   color: Colors.textTertiary, bg: Colors.tertiary },
  cancelled: { label: 'Cancelled', color: Colors.danger,   bg: '#fde8e8' },
};

// 4. COMPONENT

export function PrescriptionCard({
  prescription,
  onPress,
}: PrescriptionCardProps): React.JSX.Element {
  const isDoctor = prescription.source === 'DOCTOR';

  const issueDate = new Date(prescription.issuedAt);
  const formattedDate = issueDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const statusKey = prescription.status ?? 'active';
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.active;

  const doctorName = prescription.doctorName ?? prescription.doctor?.name ?? 'Doctor';
  const diagnosis  = prescription.diagnosisSummary ?? 'Prescription';
  const medCount   = prescription.medicines?.length ?? 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Prescription for ${diagnosis} from ${doctorName}`}
    >
      {/* ── Top Row: doctor avatar chip + status badge ── */}
      <View style={styles.topRow}>
        <View style={styles.doctorChip}>
          <View style={styles.docAvatarCircle}>
            <MaterialCommunityIcons name="stethoscope" size={14} color={Colors.primary} />
          </View>
          <Text style={styles.doctorChipText} numberOfLines={1}>
            {isDoctor ? `Dr. ${doctorName.replace(/^Dr\.?\s*/i, '')}` : 'Uploaded'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {/* ── Diagnosis / Title ── */}
      <Text style={styles.diagnosis} numberOfLines={2}>
        {diagnosis}
      </Text>

      {/* ── Bottom Row: medicine count + date + view details ── */}
      <View style={styles.bottomRow}>
        <View style={styles.metaChips}>
          <View style={styles.chip}>
            <MaterialCommunityIcons name="pill" size={12} color={Colors.primary} />
            <Text style={styles.chipText}>
              {medCount} {medCount === 1 ? 'Medicine' : 'Medicines'}
            </Text>
          </View>
          <View style={styles.chip}>
            <MaterialCommunityIcons name="calendar-outline" size={12} color={Colors.textTertiary} />
            <Text style={[styles.chipText, { color: Colors.textTertiary }]}>{formattedDate}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewBtn}
          onPress={onPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="View prescription details"
        >
          <Text style={styles.viewBtnText}>View Details</Text>
          <MaterialCommunityIcons name="arrow-right" size={13} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// 5. STYLES
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doctorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  docAvatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorChipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
  },
  diagnosis: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    lineHeight: FontSize.lg * 1.3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  metaChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingLeft: Spacing.sm,
  },
  viewBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
});
