import React from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { useDevStore } from '../../store/devStore';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, FontFamily, FontSize } from '../../theme';

export function DevSettings() {
  const { forceMockError, forceMockEmpty, setDevState } = useDevStore();
  const { role, login } = useAuthStore();

  if (!__DEV__) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Dev settings are only available in development mode.</Text>
      </View>
    );
  }

  const handleRoleToggle = (isDoctor: boolean) => {
    // Keep the same dummy token/userId but just swap the role
    login({
      token: 'dev-token-qa',
      userId: 'dev-qa-user',
      role: isDoctor ? 'doctor' : 'patient',
      status: 'active',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.description}>
        These toggles globally affect the mock API responses to help test UI states.
      </Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.title}>Force Error State</Text>
            <Text style={styles.subtitle}>All mock API calls will reject</Text>
          </View>
          <Switch
            value={forceMockError}
            onValueChange={(val) => setDevState({ forceMockError: val })}
            trackColor={{ false: Colors.tertiary, true: Colors.danger }}
          />
        </View>

        <View style={[styles.row, styles.borderTop]}>
          <View style={styles.rowText}>
            <Text style={styles.title}>Force Empty State</Text>
            <Text style={styles.subtitle}>All array responses will be []</Text>
          </View>
          <Switch
            value={forceMockEmpty}
            onValueChange={(val) => setDevState({ forceMockEmpty: val })}
            trackColor={{ false: Colors.tertiary, true: Colors.primary }}
          />
        </View>
      </View>

      <Text style={[styles.description, { marginTop: Spacing.md }]}>Authentication Overrides</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.title}>Switch Role (Patient / Doctor)</Text>
            <Text style={styles.subtitle}>Current Role: {role}</Text>
          </View>
          <Switch
            value={role === 'doctor'}
            onValueChange={handleRoleToggle}
            trackColor={{ false: Colors.tertiary, true: Colors.success }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {},
  description: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    lineHeight: FontSize.sm * 1.5,
  },
  section: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.tertiary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.xl,
    paddingRight: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  rowText: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.danger,
    textAlign: 'center',
    marginTop: Spacing.xl,
    lineHeight: FontSize.base * 1.5,
  },
});
