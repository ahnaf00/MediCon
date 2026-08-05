// 1. IMPORTS
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize, TextStyles, Layout } from '@theme';
import { useTranslation } from 'react-i18next';

// 2. TYPES
export interface DoctorFormData {
  fullName: string;
  department: string;
  licenseNumber: string;
}

export interface DoctorRegistrationFormProps {
  onSubmit: (data: DoctorFormData) => void;
  isLoading: boolean;
}

// 3. COMPONENT
export const DoctorRegistrationForm = ({
  onSubmit,
  isLoading,
}: DoctorRegistrationFormProps): React.JSX.Element => {
  const { t } = useTranslation();
  const [form, setForm] = useState<DoctorFormData>({
    fullName: '',
    department: '',
    licenseNumber: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DoctorFormData, string>>>({});

  const updateField = (key: keyof DoctorFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof DoctorFormData, string>> = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!form.department.trim()) {
      newErrors.department = 'Department is required';
    }
    if (!form.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
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
    key: keyof DoctorFormData,
    options?: { placeholder?: string },
  ) => (
    <View style={styles.fieldContainer} key={key}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[key] ? styles.inputError : undefined]}
        placeholder={options?.placeholder ?? `Enter ${label.toLowerCase()}`}
        placeholderTextColor={Colors.textTertiary}
        value={form[key]}
        onChangeText={(v) => updateField(key, v)}
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
      {renderField('Department', 'department', { placeholder: 'e.g. Cardiology' })}
      {renderField('License Number', 'licenseNumber', {
        placeholder: 'e.g. BMDC-12345',
      })}

      <View style={styles.notice}>
        <Text style={styles.noticeIcon}>ℹ️</Text>
        <Text style={styles.noticeText}>
          {t('doctorregistrationform.doctor_accounts_require_verifi') ||
            `Doctor accounts require verification. Your account will be pending until credentials are
                            reviewed.`}
        </Text>
      </View>

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
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    ...TextStyles.caption,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  notice: {
    flexDirection: 'row',
    backgroundColor: Colors.tertiary + '80',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  noticeIcon: {
    fontSize: FontSize.md,
  },
  noticeText: {
    ...TextStyles.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
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
