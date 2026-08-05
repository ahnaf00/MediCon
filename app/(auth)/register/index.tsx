// 1. IMPORTS
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, FontFamily, TextStyles, Shadows } from '@theme';
import { useAuthStore, type UserRole } from '../../../src/store/authStore';
import { authService } from '../../../src/services/api/authService';
import {
  PatientRegistrationForm,
  type PatientFormData,
} from '../../../src/components/forms/PatientRegistrationForm';
import {
  DoctorRegistrationForm,
  type DoctorFormData,
} from '../../../src/components/forms/DoctorRegistrationForm';
import { useTranslation } from 'react-i18next';

// 2. TYPES
type RegisterStep = 'role_selection' | 'profile_form';

// 3. COMPONENT
export default function RegisterScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string }>();
  const login = useAuthStore((s) => s.login);

  const [step, setStep] = useState<RegisterStep>('role_selection');
  const [role, setRole] = useState<UserRole | null>(null);

  const phone = params.phone ?? '';

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep('profile_form');
  };

  const registerMutation = useMutation({
    mutationFn: (data: PatientFormData | DoctorFormData) => {
      if (!role) throw new Error('Role is required');
      return authService.register(phone, role, data);
    },
    onSuccess: (result) => {
      login({
        token: result.token,
        role: result.user.role,
        status: result.user.status,
        userId: result.user.id,
      });
      router.replace('/(app)/(tabs)');
    },
    onError: (e: any) => {
      // Handle 422 validation errors mapping
      if (e.errors) {
        const firstError = Object.values(e.errors)[0] as string[];
        Alert.alert('Registration Failed', firstError[0]);
      } else {
        Alert.alert('Registration Failed', e.message ?? 'An unknown error occurred.');
      }
    }
  });

  const handlePatientSubmit = (data: PatientFormData) => {
    registerMutation.mutate(data);
  };

  const handleDoctorSubmit = (data: DoctorFormData) => {
    registerMutation.mutate(data);
  };

  const renderRoleSelection = () => (
    <View style={styles.roleContainer}>
      <Text style={styles.title}>{t('register.choose_your_role') || 'Choose Your Role'}</Text>
      <Text style={styles.subtitle}>
        {t('register.select_how_you_will_use_medico') || 'Select how you will use Medicon.'}
      </Text>

      <TouchableOpacity
        style={styles.roleCard}
        onPress={() => handleRoleSelect('patient')}
        activeOpacity={0.8}
        accessibilityLabel="Register as patient"
        accessibilityRole="button"
      >
        <Text style={styles.roleIcon}>🩺</Text>
        <View style={styles.roleTextContainer}>
          <Text style={styles.roleTitle}>{t('register.patient') || 'Patient'}</Text>
          <Text style={styles.roleDescription}>
            {t('register.book_appointments_track_health') ||
              'Book appointments, track health records, and get AI-powered insights.'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.roleCard}
        onPress={() => handleRoleSelect('doctor')}
        activeOpacity={0.8}
        accessibilityLabel="Register as doctor"
        accessibilityRole="button"
      >
        <Text style={styles.roleIcon}>👨‍⚕️</Text>
        <View style={styles.roleTextContainer}>
          <Text style={styles.roleTitle}>{t('register.doctor') || 'Doctor'}</Text>
          <Text style={styles.roleDescription}>
            {t('register.manage_consultations_review_pa') ||
              'Manage consultations, review patient records, and provide care.'}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {t('register.requires_verification') || 'Requires verification'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderProfileForm = () => (
    <View style={styles.formContainer}>
      <TouchableOpacity
        onPress={() => {
          setStep('role_selection');
          setRole(null);
        }}
        style={styles.backButton}
        accessibilityLabel="Go back to role selection"
        accessibilityRole="button"
      >
        <Text style={styles.backText}>{t('register.back') || '← Back'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{role === 'patient' ? 'Patient Profile' : 'Doctor Profile'}</Text>
      <Text style={styles.subtitle}>
        {t('register.complete_your_profile_to_get_s') || 'Complete your profile to get started.'}
      </Text>

      {role === 'patient' ? (
        <PatientRegistrationForm onSubmit={handlePatientSubmit} isLoading={registerMutation.isPending} />
      ) : (
        <DoctorRegistrationForm onSubmit={handleDoctorSubmit} isLoading={registerMutation.isPending} />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {step === 'role_selection' ? renderRoleSelection() : renderProfileForm()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  roleContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  formContainer: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  title: {
    ...TextStyles.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  roleCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    alignItems: 'flex-start',
    gap: Spacing.base,
    ...Shadows.md,
  },
  roleIcon: {
    fontSize: 36,
    marginTop: Spacing.xs,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    ...TextStyles.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  roleDescription: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.tertiary,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.sm,
  },
  badgeText: {
    ...TextStyles.caption,
    color: Colors.secondary,
    fontFamily: FontFamily.semiBold,
  },
  backButton: {
    marginBottom: Spacing.base,
    alignSelf: 'flex-start',
  },
  backText: {
    ...TextStyles.body,
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
});
