// 1. IMPORTS
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@theme';

// 2. TYPES
export interface LoadingSpinnerProps {
  visible?: boolean;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

// 3. COMPONENT
export const LoadingSpinner = ({
  visible = true,
  size = 'large',
  fullScreen = false,
}: LoadingSpinnerProps): React.JSX.Element | null => {
  if (!visible) return null;

  if (fullScreen) {
    return (
      <View style={styles.fullScreen} accessibilityLabel="Loading" accessibilityRole="progressbar">
        <ActivityIndicator size={size} color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityLabel="Loading" accessibilityRole="progressbar">
      <ActivityIndicator size={size} color={Colors.primary} />
    </View>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 999,
  },
});
