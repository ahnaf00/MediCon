// 1. IMPORTS
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Report } from '../../types/medical.types';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';

// 2. TYPES
export interface ReportCardProps {
  report: Report;
  onPress: () => void;
  onOptionsPress?: (report: Report) => void;
}

// ── Thumbnail resolver ──────────────────────────────────────────────────────
// Returns the primary source to render as the card background.
// For multi-image, uses the first image. For PDF, returns null (icon fallback).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPrimaryThumbnail(report: Report): any | null {
  const isPdf =
    report.fileType === 'pdf' ||
    report.type === 'DOCUMENT' ||
    (report.fileUri && report.fileUri.toLowerCase().endsWith('.pdf'));

  if (isPdf) return null;

  if (report.thumbnails && report.thumbnails.length > 0) return report.thumbnails[0];
  if (report.fileUri) return { uri: report.fileUri };
  if (report.imageUrl) return { uri: report.imageUrl };
  return null;
}

// 3. COMPONENT
export function ReportCard({
  report,
  onPress,
  onOptionsPress,
}: ReportCardProps): React.JSX.Element {
  const thumbnail = getPrimaryThumbnail(report);
  const isMulti = report.fileType === 'multi_image';
  const extraCount = isMulti && report.thumbnails ? Math.max(0, report.thumbnails.length - 1) : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${report.title} from ${report.laboratory ?? 'Unknown Laboratory'}`}
    >
      {/* ── Thumbnail area ──────────────────────────────────────────────── */}
      <View style={styles.thumbnailContainer}>
        {thumbnail ? (
          <Image source={thumbnail} style={styles.thumbnailImage} resizeMode="cover" />
        ) : (
          // PDF / no-image fallback
          <View style={styles.pdfPlaceholder}>
            <MaterialCommunityIcons name="file-pdf-box" size={40} color={Colors.danger} />
          </View>
        )}

        {/* Multi-image badge */}
        {isMulti && extraCount > 0 && (
          <View style={styles.multiImageBadge}>
            <MaterialCommunityIcons name="image-multiple" size={12} color={Colors.surface} />
            <Text style={styles.multiImageBadgeText}>+{extraCount}</Text>
          </View>
        )}

        {/* Options Menu Button */}
        {onOptionsPress && (
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={(e) => {
              e.stopPropagation();
              onOptionsPress(report);
            }}
            accessibilityRole="button"
            accessibilityLabel="Report options"
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <MaterialCommunityIcons name="dots-horizontal" size={20} color={Colors.surface} />
          </TouchableOpacity>
        )}

        {/* Semi-transparent overlay with name + lab */}
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle} numberOfLines={2}>
            {report.title}
          </Text>
          <Text style={styles.overlayLab} numberOfLines={1}>
            {report.laboratory ?? 'Unknown Laboratory'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },

  // ── Thumbnail ──────────────────────────────────────────────────────────────
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 0.9,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  pdfPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    paddingBottom: 72, // Offsets the center to account for the overlay height
  },
  optionsButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: BorderRadius.full,
    padding: 4,
  },

  // ── Badges ─────────────────────────────────────────────────────────────────
  multiImageBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  multiImageBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.surface,
  },

  // ── Overlay ────────────────────────────────────────────────────────────────
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
    paddingHorizontal: Spacing.sm,
    height: 72, // Fixed height ensures all overlays are uniform
    justifyContent: 'center',
  },
  overlayTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.surface,
    lineHeight: FontSize.sm * 1.35,
    marginBottom: 2,
  },
  overlayLab: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.78)',
  },
});
