// "Download" sheet for the prescription document: PDF (share sheet) or image (gallery).
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { DraggableBottomSheet } from '../ui/DraggableBottomSheet';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';

export type DownloadFormat = 'pdf' | 'png';

interface DownloadOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (format: DownloadFormat) => void;
  /** The format currently being downloaded; disables both rows while set. */
  busyFormat?: DownloadFormat | null;
}

const OPTIONS: {
  format: DownloadFormat;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle: string;
}[] = [
  {
    format: 'pdf',
    icon: 'file-pdf-box',
    title: 'Download as PDF',
    subtitle: 'Best for printing and sharing',
  },
  {
    format: 'png',
    icon: 'image-outline',
    title: 'Download as Image',
    subtitle: 'Save to your gallery',
  },
];

export function DownloadOptionsSheet({
  visible,
  onClose,
  onSelect,
  busyFormat = null,
}: DownloadOptionsSheetProps) {
  return (
    <DraggableBottomSheet visible={visible} onClose={onClose} title="Download">
      <View style={styles.list}>
        {OPTIONS.map((opt) => {
          const busy = busyFormat === opt.format;
          return (
            <TouchableOpacity
              key={opt.format}
              style={styles.row}
              onPress={() => onSelect(opt.format)}
              disabled={busyFormat !== null}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={opt.title}
              accessibilityHint={opt.subtitle}
              accessibilityState={{ disabled: busyFormat !== null, busy }}
            >
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={opt.icon} size={24} color={Colors.primary} />
              </View>
              <View style={styles.texts}>
                <Text style={styles.title}>{opt.title}</Text>
                <Text style={styles.subtitle}>{opt.subtitle}</Text>
              </View>
              {busy ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={Colors.textTertiary}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </DraggableBottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    backgroundColor: Colors.surface,
    minHeight: 64,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1 },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
