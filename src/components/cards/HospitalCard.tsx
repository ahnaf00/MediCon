import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Hospital } from '../../types/medical.types';
import { useTranslation } from 'react-i18next';

interface HospitalCardProps {
  hospital: Hospital;
  onPress: () => void;
  onClose?: () => void;
}

export const HospitalCard = ({
  hospital,
  onPress,
  onClose,
}: HospitalCardProps): React.JSX.Element => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${hospital.name}`}
    >
      <View style={styles.imageContainer}>
        {hospital.imageUrl ? (
          <Image source={{ uri: hospital.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <MaterialCommunityIcons name="hospital-building" size={32} color={Colors.primary} />
          </View>
        )}

        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close" size={14} color={Colors.surface} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={2}>
            {hospital.name}
          </Text>
        </View>

        <Text style={styles.address} numberOfLines={2}>
          {hospital.address}
        </Text>

        <View style={styles.tagsContainer}>
          {hospital.distanceKm !== undefined && (
            <View style={[styles.tag, styles.distanceTag]}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={12}
                color={Colors.textPrimary}
              />
              <Text style={[styles.tagText, styles.distanceTagText]}>
                {hospital.distanceKm.toFixed(1)} {t('hospitalcard.km') || 'km'}
              </Text>
            </View>
          )}
          {hospital.hasEmergencyRoom && (
            <View style={[styles.tag, styles.emergencyTag]}>
              <MaterialCommunityIcons name="heart-pulse" size={12} color={Colors.danger} />
              <Text style={[styles.tagText, styles.emergencyTagText]}>
                {t('hospitalcard.er') || 'ER'}
              </Text>
            </View>
          )}
          {hospital.isOpen24x7 && (
            <View style={[styles.tag, styles.openTag]}>
              <MaterialCommunityIcons
                name="clock-time-four-outline"
                size={12}
                color={Colors.primary}
              />
              <Text style={[styles.tagText, styles.openTagText]}>
                {t('hospitalcard.24x7') || '24x7'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    padding: Spacing.sm,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },

  address: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 'auto',
    paddingTop: Spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  tagText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * 1.5,
  },
  emergencyTag: {
    backgroundColor: 'rgba(208, 42, 65, 0.12)',
  },
  emergencyTagText: {
    color: Colors.danger,
  },
  openTag: {
    backgroundColor: Colors.tertiary,
  },
  openTagText: {
    color: Colors.primary,
  },
  distanceTag: {
    backgroundColor: 'rgba(30, 30, 30, 0.08)',
  },
  distanceTagText: {
    color: Colors.textPrimary,
  },
});
