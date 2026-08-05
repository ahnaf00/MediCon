// 1. IMPORTS
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { Colors, FontFamily } from '@theme';

// 2. TYPES
export interface AvatarProps {
  source?: ImageSourcePropType | null;
  name?: string;
  size?: number;
  accessibilityLabel?: string;
}

// 3. COMPONENT
export const Avatar = ({
  source,
  name,
  size = 44,
  accessibilityLabel,
}: AvatarProps): React.JSX.Element => {
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('')
    : '?';

  const dynamicSize = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const fontSize = size * 0.4;

  if (source) {
    return (
      <Image
        source={source as any}
        style={[styles.image, dynamicSize]}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel ?? `${name ?? 'User'} avatar`}
      />
    );
  }

  return (
    <View
      style={[styles.fallback, dynamicSize]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `${name ?? 'User'} avatar`}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.tertiary,
  },
  fallback: {
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
});
