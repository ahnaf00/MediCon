import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { BorderRadius, Colors, FontSize, Spacing } from '@theme';
import { Input } from '../ui/Input';
import type { HospitalForm as Form, HospitalInput } from '../../services/api/adminSystemService';

interface Props {
  value: Form;
  onChange: (next: Form) => void;
  /** Field errors from the app's own check or from the server (422). */
  errors: Partial<Record<keyof HospitalInput, string>>;
  /** Called with the errors left once a field with an error is edited. */
  onErrorsChange?: (next: Partial<Record<keyof HospitalInput, string>>) => void;
  disabled?: boolean;
}

// Form field → the server field its error is reported under.
const ERROR_KEY: Record<keyof Form, keyof HospitalInput> = {
  name: 'name',
  address: 'address',
  emergencyPhone: 'emergency_phone',
  is247: 'is_24_7',
  latitude: 'latitude',
  longitude: 'longitude',
};

/** Add/edit fields for a hospital (audit L2b step 3). Patients rely on these in an emergency. */
export const HospitalForm = ({
  value,
  onChange,
  errors,
  onErrorsChange,
  disabled = false,
}: Props) => {
  const set =
    <K extends keyof Form>(key: K) =>
    (v: Form[K]) => {
      onChange({ ...value, [key]: v });
      // A coordinate error can be about the pair, so editing either clears both.
      const cleared =
        key === 'latitude' || key === 'longitude'
          ? (['latitude', 'longitude'] as const)
          : [ERROR_KEY[key]];
      if (onErrorsChange && cleared.some((k) => errors[k])) {
        const next = { ...errors };
        cleared.forEach((k) => delete next[k]);
        onErrorsChange(next);
      }
    };

  return (
    <View style={styles.card}>
      <Input
        label="Hospital name"
        value={value.name}
        onChangeText={set('name')}
        error={errors.name}
        editable={!disabled}
        maxLength={150}
        autoCapitalize="words"
      />
      <Input
        label="Address"
        value={value.address}
        onChangeText={set('address')}
        error={errors.address}
        editable={!disabled}
        maxLength={500}
        multiline
      />
      <Input
        label="Emergency phone"
        value={value.emergencyPhone}
        onChangeText={set('emergencyPhone')}
        error={errors.emergency_phone}
        editable={!disabled}
        maxLength={30}
        keyboardType="phone-pad"
        placeholder="e.g. 999 or +880 2-55165088"
      />

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.switchLabel}>Open 24 hours, 7 days</Text>
          <Text style={styles.hint}>Patients see this on the hospital card.</Text>
        </View>
        <Switch
          value={value.is247}
          onValueChange={set('is247')}
          disabled={disabled}
          trackColor={{ true: Colors.primary, false: Colors.tertiary }}
          thumbColor={Colors.surface}
          accessibilityLabel="Open 24 hours, 7 days"
        />
      </View>

      <Text style={styles.section}>Map location (optional)</Text>
      <Text style={styles.hint}>
        Copy both numbers from Google Maps: press and hold the hospital on the map. Without them the
        hospital has no map pin or directions.
      </Text>
      <View style={styles.coords}>
        <View style={styles.coord}>
          <Input
            label="Latitude"
            value={value.latitude}
            onChangeText={set('latitude')}
            error={errors.latitude}
            editable={!disabled}
            keyboardType="numbers-and-punctuation"
            placeholder="23.7806"
          />
        </View>
        <View style={styles.coord}>
          <Input
            label="Longitude"
            value={value.longitude}
            onChangeText={set('longitude')}
            error={errors.longitude}
            editable={!disabled}
            keyboardType="numbers-and-punctuation"
            placeholder="90.4070"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  switchText: { flex: 1, gap: 2 },
  switchLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  section: {
    marginTop: Spacing.sm,
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  hint: { fontSize: FontSize.sm, color: Colors.textTertiary, lineHeight: 18 },
  coords: { flexDirection: 'row', gap: Spacing.md },
  coord: { flex: 1 },
});
