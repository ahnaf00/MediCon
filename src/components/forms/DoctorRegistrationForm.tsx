// 1. IMPORTS
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize, TextStyles, Layout } from '@theme';
import { useTranslation } from 'react-i18next';
import { doctorsService } from '../../services/api/doctorsService';

// 2. TYPES
export interface DoctorFormData {
  fullName: string;
  department: string;
  qualification: string;
  /** BMDC registration number, printed on every prescription. */
  licenseNumber: string;
  hospitalName: string;
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
    qualification: '',
    licenseNumber: '',
    hospitalName: '',
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
      newErrors.department = 'Choose your department';
    }
    if (!form.qualification.trim()) {
      newErrors.qualification = 'Enter your qualifications, e.g. MBBS';
    }
    if (!/\d/.test(form.licenseNumber)) {
      newErrors.licenseNumber = 'Enter your BMDC registration number, e.g. A-12345';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // The same departments patients browse, so the new doctor can be found there.
  const specialties = useQuery({
    queryKey: ['specialties'],
    queryFn: doctorsService.getCategories,
  });

  const renderDepartment = () => (
    <View style={styles.fieldContainer} key="department">
      <Text style={styles.label}>Department</Text>
      {specialties.isLoading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : specialties.isError ? (
        <TouchableOpacity onPress={() => specialties.refetch()} accessibilityRole="button">
          <Text style={styles.errorText}>Could not load departments. Tap to try again.</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.chips}>
          {specialties.data?.map((s) => {
            const selected = form.department === s.name;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => updateField('department', s.name)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={s.name}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{s.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {errors.department ? <Text style={styles.errorText}>{errors.department}</Text> : null}
    </View>
  );

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
      {renderDepartment()}
      {renderField('Qualifications', 'qualification', {
        placeholder: 'e.g. MBBS, FCPS',
      })}
      {renderField('BMDC Registration No.', 'licenseNumber', {
        placeholder: 'e.g. A-12345',
      })}
      {renderField('Hospital / Chamber (optional)', 'hospitalName', {
        placeholder: 'Printed on your prescriptions',
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  chipTextSelected: {
    color: Colors.surface,
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
