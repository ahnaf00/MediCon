// 1. IMPORTS
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize, TextStyles, Layout } from '@theme';

// 2. TYPES
export interface PatientFormData {
  fullName: string;
  dateOfBirth: string;
  bloodGroup: string;
  heightCm: string;
  weightKg: string;
  allergies: string;
  chronicConditions: string;
}

export interface PatientRegistrationFormProps {
  onSubmit: (data: PatientFormData) => void;
  isLoading: boolean;
}

// 3. COMPONENT
export const PatientRegistrationForm = ({
  onSubmit,
  isLoading,
}: PatientRegistrationFormProps): React.JSX.Element => {
  const [form, setForm] = useState<PatientFormData>({
    fullName: '',
    dateOfBirth: '',
    bloodGroup: '',
    heightCm: '',
    weightKg: '',
    allergies: '',
    chronicConditions: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormData, string>>>({});

  const updateField = (key: keyof PatientFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error on edit
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PatientFormData, string>> = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!form.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth.trim())) {
      newErrors.dateOfBirth = 'Use YYYY-MM-DD format';
    }
    if (!form.bloodGroup.trim()) {
      newErrors.bloodGroup = 'Blood group is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(form);
    }
  };

  const renderField = (
    label: string,
    key: keyof PatientFormData,
    options?: {
      placeholder?: string;
      keyboardType?: 'default' | 'numeric';
      multiline?: boolean;
    },
  ) => (
    <View style={styles.fieldContainer} key={key}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          options?.multiline && styles.inputMultiline,
          errors[key] ? styles.inputError : undefined,
        ]}
        placeholder={options?.placeholder ?? `Enter ${label.toLowerCase()}`}
        placeholderTextColor={Colors.textTertiary}
        value={form[key]}
        onChangeText={(v) => updateField(key, v)}
        keyboardType={options?.keyboardType ?? 'default'}
        multiline={options?.multiline}
        accessibilityLabel={`${label} input`}
      />
      {errors[key] ? <Text style={styles.errorText}>{errors[key]}</Text> : null}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {renderField('Full Name', 'fullName')}
      {renderField('Date of Birth', 'dateOfBirth', { placeholder: 'YYYY-MM-DD' })}
      {renderField('Blood Group', 'bloodGroup', { placeholder: 'e.g. A+, O-' })}
      {renderField('Height (cm)', 'heightCm', {
        keyboardType: 'numeric',
        placeholder: 'e.g. 170',
      })}
      {renderField('Weight (kg)', 'weightKg', {
        keyboardType: 'numeric',
        placeholder: 'e.g. 68',
      })}
      {renderField('Allergies', 'allergies', {
        placeholder: 'Comma-separated, or leave blank',
        multiline: true,
      })}
      {renderField('Chronic Conditions', 'chronicConditions', {
        placeholder: 'Comma-separated, or leave blank',
        multiline: true,
      })}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
        activeOpacity={0.8}
        accessibilityLabel="Complete registration button"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Registering…' : 'Complete Registration'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  contentContainer: {
    paddingBottom: Spacing.xxxl,
  },
  fieldContainer: {
    marginBottom: Spacing.base,
  },
  label: {
    ...TextStyles.bodySmall,
    fontFamily: FontFamily.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: Layout.inputHeight,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    paddingHorizontal: Spacing.base,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  inputMultiline: {
    height: 80,
    paddingTop: Spacing.md,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    ...TextStyles.caption,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  button: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.surface,
  },
});
