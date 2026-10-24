import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';
import { Colors, FontFamily } from '@theme';

/** "Dr. Sarah Khan" -> "SK": the title is skipped so it never becomes an initial. */
export const doctorInitials = (name?: string | null): string => {
  const words = (name ?? '')
    .replace(/^\s*(dr|prof)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean);
  return words.length
    ? words
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('')
    : '?';
};

/**
 * The doctor's own photo, or their initials in the same box. Never a stock
 * photo: a stranger's face would read as the doctor's.
 */
export const DoctorPhoto = ({
  source,
  name,
  style,
  initialsSize = 32,
}: {
  source?: ImageSourcePropType | null;
  name?: string | null;
  style: StyleProp<ImageStyle>;
  initialsSize?: number;
}): React.JSX.Element => {
  const label = `Photo of ${name ?? 'the doctor'}`;
  if (source) {
    return <Image source={source} style={style} resizeMode="cover" accessibilityLabel={label} />;
  }
  return (
    <View
      style={[style as object, styles.fallback]}
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <Text style={[styles.initials, { fontSize: initialsSize }]}>{doctorInitials(name)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
});
