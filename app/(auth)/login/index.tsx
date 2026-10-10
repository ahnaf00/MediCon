// 1. IMPORTS
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Colors, Spacing, TextStyles } from '@theme';
import { useOnboardingStore } from '../../../src/store/onboardingStore';
import { useAuthStore } from '../../../src/store/authStore';
import { authService } from '../../../src/services/api/authService';
import { AuthPhoneForm } from '../../../src/components/forms/AuthPhoneForm';
import { AuthOTPForm } from '../../../src/components/forms/AuthOTPForm';
import { useTranslation } from 'react-i18next';

// 2. TYPES
type LoginStep = 'phone_entry' | 'otp_entry';

// 3. COMPONENT
export default function LoginScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const setHasSeenOnboarding = useOnboardingStore((s) => s.setHasSeenOnboarding);

  const [step, setStep] = useState<LoginStep>('phone_entry');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | undefined>();

  // Use React Query for API mutations
  const sendOtpMutation = useMutation({
    mutationFn: (phoneNumber: string) => authService.sendOtp(phoneNumber),
    onSuccess: () => {
      setError(undefined);
      setStep('otp_entry');
    },
    onError: (e: any) => {
      setError(e.message ?? 'Failed to send OTP');
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      authService.verifyOtp(phone, otp),
    onSuccess: (result, variables) => {
      setError(undefined);
      if (result.isNewUser) {
        // Navigate to registration with phone param
        router.replace({
          pathname: '/(auth)/register',
          params: { phone: variables.phone },
        });
      } else if (result.token && result.user) {
        // Existing user — log them in
        login({
          token: result.token,
          role: result.user.role,
          status: result.user.status,
          userId: String(result.user.id),
        });
        router.replace('/(app)/(tabs)');
      }
    },
    onError: (e: any) => {
      // Handle Laravel 422 validation errors if applicable
      if (e.errors) {
        const firstError = Object.values(e.errors)[0] as string[];
        setError(firstError[0]);
      } else {
        setError(e.message ?? 'Invalid OTP');
      }
    },
  });

  const handleSendOtp = () => {
    sendOtpMutation.mutate(phone);
  };

  const handleVerifyOtp = (otp: string) => {
    verifyOtpMutation.mutate({ phone, otp });
  };

  const handleResendOtp = () => {
    setError(undefined);
    sendOtpMutation.mutate(phone, {
      onSuccess: () => {
        Alert.alert('OTP Resent', `A new code has been sent to ${phone}.`);
      },
    });
  };

  const handleDebugReset = () => {
    if (__DEV__) {
      setHasSeenOnboarding(false);
      Alert.alert(
        'QA Debug',
        'Onboarding flag has been reset. Reload the app to see the onboarding flow again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Hidden debug trigger wrapped around the title */}
          <Pressable onLongPress={handleDebugReset} delayLongPress={1000}>
            <Text style={styles.title}>
              {step === 'phone_entry' ? 'Welcome Back' : 'Verify OTP'}
            </Text>
          </Pressable>

          <Text style={styles.subtitle}>
            {step === 'phone_entry'
              ? 'Enter your phone number to get started.'
              : 'We sent a verification code to your phone.'}
          </Text>

          <View style={styles.formWrapper}>
            {step === 'phone_entry' ? (
              <AuthPhoneForm
                phone={phone}
                onChangePhone={setPhone}
                onSubmit={handleSendOtp}
                isLoading={sendOtpMutation.isPending}
                error={error}
              />
            ) : (
              <AuthOTPForm
                phone={phone}
                onSubmit={handleVerifyOtp}
                isLoading={verifyOtpMutation.isPending}
                error={error}
                onResend={handleResendOtp}
              />
            )}
          </View>

          {step === 'otp_entry' && (
            <Pressable
              onPress={() => {
                setStep('phone_entry');
                setError(undefined);
              }}
            >
              <Text style={styles.backLink}>
                {t('login.change_phone_number') || '← Change phone number'}
              </Text>
            </Pressable>
          )}

          {/* Demo Mode / Guest bypass button */}
          <Pressable
            style={styles.guestButton}
            onPress={() => {
              login({
                token: 'demo-guest-token',
                role: 'patient',
                status: 'active',
                userId: 'guest-user-123',
              });
              router.replace('/(app)/(tabs)');
            }}
          >
            <Text style={styles.guestButtonText}>⚡ Explore App as Guest</Text>
          </Pressable>
        </View>
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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    ...TextStyles.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  formWrapper: {
    width: '100%',
    maxWidth: 360,
  },
  backLink: {
    ...TextStyles.body,
    color: Colors.primary,
    marginTop: Spacing.lg,
  },
  guestButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    backgroundColor: Colors.tertiary,
  },
  guestButtonText: {
    ...TextStyles.body,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
