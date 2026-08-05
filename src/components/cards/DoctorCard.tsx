// 1. IMPORTS
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DashboardDoctor } from '../../hooks/usePatientDashboard';
import type { Doctor, ConsultationHistoryItem } from '../../services/api/doctorsService';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { useTranslation } from 'react-i18next';

export interface DoctorCardProps {
  doctor: DashboardDoctor | Doctor | ConsultationHistoryItem | null;
  onPress?: () => void;
  onBookPress?: () => void;
  hideSectionLabel?: boolean;
  variant?: 'default' | 'history' | 'online';
  fullWidth?: boolean;
}

// 3. COMPONENT
export const DoctorCard = ({
  doctor,
  onPress,
  onBookPress,
  hideSectionLabel = false,
  variant = 'default',
  fullWidth = false,
}: DoctorCardProps): React.JSX.Element => {
  const { t } = useTranslation();
  if (!doctor) {
    return (
      <Card accessibilityLabel="No recent doctors">
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="stethoscope" size={32} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>
            {t('doctorcard.no_recent_doctors') || 'No recent doctors'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {t('doctorcard.explore_the_directory_to_find_') ||
              'Explore the directory to find a doctor.'}
          </Text>
        </View>
      </Card>
    );
  }

  const isHistory = 'doctorName' in doctor;
  const isDashboard = 'name' in doctor;
  const displayName = isHistory
    ? doctor.doctorName
    : isDashboard
      ? doctor.name
      : (doctor as Doctor).fullName;
  const displaySpecialty = isHistory
    ? doctor.specialty
    : isDashboard
      ? doctor.specialty
      : (doctor as Doctor).department;
  const isOnline =
    !isHistory && !isDashboard && 'isOnline' in (doctor as Doctor)
      ? (doctor as Doctor).isOnline
      : false;

  const imageSource =
    (doctor as ConsultationHistoryItem).image ||
    (doctor as Doctor).image ||
    require('../../assets/images/doctors/doctorPlaceholder1.png');

  const renderBadge = () => (
    <View style={styles.badgeContainer}>
      <Text style={styles.badgeText}>{displaySpecialty}</Text>
    </View>
  );

  if (variant === 'history') {
    const historyDate =
      isHistory && (doctor as ConsultationHistoryItem).date
        ? new Date((doctor as ConsultationHistoryItem).date).toLocaleDateString('en-US', {
            month: 'long',
            day: '2-digit',
            year: 'numeric',
          })
        : '';

    return (
      <TouchableOpacity
        style={[styles.historyCard, fullWidth && { width: '100%' }]}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityLabel={`Consultation with ${displayName}`}
      >
        <Image source={imageSource} style={styles.historyAvatarContainer} />
        <View style={styles.historyContent}>
          <View>
            <Text style={styles.historyName} numberOfLines={2}>
              {displayName}
            </Text>
            {renderBadge()}
            <Text style={styles.historyDate}>Last consulted: {historyDate}</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={onBookPress || onPress}>
            <MaterialCommunityIcons name="video-outline" size={18} color={Colors.surface} />
            <Text style={styles.primaryButtonText}>See Doctor Now</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'online') {
    const fee =
      !isHistory && !isDashboard && 'consultationFee' in (doctor as Doctor)
        ? (doctor as Doctor).consultationFee
        : 550;
    const experienceText =
      !isHistory && !isDashboard && 'experience' in (doctor as Doctor)
        ? (doctor as Doctor).experience
        : 'MBBS, FCPS';
    const degreesText =
      experienceText.length < 10
        ? `MBBS, Diploma (Gynae & Obs), FCPS (${displaySpecialty})`
        : experienceText;

    return (
      <TouchableOpacity
        style={[styles.onlineCard, fullWidth && { maxWidth: '100%' }]}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityLabel={`Doctor: ${displayName}`}
      >
        <View>
          <Image source={imageSource} style={styles.onlineAvatarContainer} />
          {experienceText && experienceText.includes('years') && (
            <View style={styles.imageTag}>
              <Text style={styles.imageTagText}>{experienceText.replace(' years', '+ yrs')}</Text>
            </View>
          )}
        </View>
        <View style={styles.onlineContent}>
          <Text style={styles.onlineName} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {displaySpecialty}
            </Text>
          </View>
          <Text style={styles.onlineDegrees} numberOfLines={1}>
            {degreesText}
          </Text>
          <View style={styles.onlineFooter}>
            <Text style={styles.onlinePrice}>৳ {fee}</Text>
            <TouchableOpacity style={styles.onlineButton} onPress={onBookPress || onPress}>
              <MaterialCommunityIcons name="video-outline" size={15} color={Colors.surface} />
              <Text style={styles.primaryButtonText}>See Doctor Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Default variant
  return (
    <Card
      onPress={onPress}
      style={fullWidth ? { width: '100%' } : undefined}
      accessibilityLabel={`Doctor: ${displayName}, ${displaySpecialty}, rated ${!isHistory && 'rating' in (doctor as Doctor) ? (doctor as Doctor).rating : 0} out of 5`}
    >
      {!hideSectionLabel && (
        <Text style={styles.sectionLabel}>{t('doctorcard.recent_doctor') || 'Recent Doctor'}</Text>
      )}

      <View style={styles.body}>
        <View>
          <Avatar name={displayName} source={imageSource} size={48} />
          {isOnline && <View style={styles.onlineBadge} />}
        </View>
        <View style={styles.details}>
          <Text style={styles.doctorName}>{displayName}</Text>
          <Text style={styles.specialty}>{displaySpecialty}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="star" size={16} color="#f5a623" />
          <Text style={styles.statText}>
            {!isHistory && 'rating' in (doctor as Doctor)
              ? (doctor as Doctor).rating.toFixed(1)
              : '4.5'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <MaterialCommunityIcons name="briefcase-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>
            {!isHistory && !isDashboard && 'experience' in (doctor as Doctor)
              ? (doctor as Doctor).experience
              : '5 years'}
          </Text>
        </View>
      </View>
    </Card>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  details: {
    flex: 1,
  },
  doctorName: {
    fontFamily: FontFamily.bold,
    fontWeight: '600',
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  specialty: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: Spacing.base,
    backgroundColor: Colors.tertiary,
    marginHorizontal: Spacing.md,
  },
  statText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: Spacing.md + Spacing.xs,
    height: Spacing.md + Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: '#28a745',
    borderWidth: 2,
    borderColor: Colors.surface,
  },

  // --- Shared variant styles ---
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.tertiaryLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: Spacing.xs - 1,
    marginVertical: Spacing.xs + 1,
  },
  badgeText: {
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  primaryButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.surface,
  },

  // --- History variant ---
  historyCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    width: 331,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  historyAvatarContainer: {
    width: 120,
    height: '100%' as any,
    minHeight: 143,
    backgroundColor: Colors.tertiary,
    resizeMode: 'cover',
  },
  historyContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  historyName: {
    fontFamily: FontFamily.semiBold,
    fontWeight: '600',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  historyDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },

  // --- Online variant ---
  onlineCard: {
    flex: 1,
    maxWidth: '48.5%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  onlineAvatarContainer: {
    width: '100%',
    height: 144,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageTag: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: Spacing.xs - 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  imageTagText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    lineHeight: FontSize.xs * 1.5,
  },
  onlineContent: {
    padding: Spacing.sm + 2,
    gap: Spacing.xs,
  },
  onlineName: {
    fontFamily: FontFamily.semiBold,
    fontWeight: '600',
    fontSize: 12,
    color: Colors.textPrimary,
  },
  onlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  onlineDegrees: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  onlineFooter: {
    flexDirection: 'column',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  onlineFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onlineButtonCompact: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 3,
  },
  onlineButtonCompactText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.surface,
  },
  onlinePriceContainer: {
    width: '100%',
  },
  expTag: {
    backgroundColor: Colors.tertiaryLight,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: Spacing.xs - 2,
    borderRadius: BorderRadius.sm,
  },
  expTagText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.primary,
    lineHeight: FontSize.xs * 1.5,
  },
  onlineButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  onlinePrice: {
    fontFamily: FontFamily.bold,
    fontWeight: '600',
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
});
