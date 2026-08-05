// 1. IMPORTS
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize, TextStyles, Layout } from '@theme';
import { useTranslation } from 'react-i18next';

// 2. TYPES
const OTP_LENGTH = 6;

export interface AuthOTPFormProps {
  onSubmit: (otp: string) => void;
  isLoading: boolean;
  error?: string;
  phone: string;
  onResend: () => void;
}

// 3. COMPONENT
export const AuthOTPForm = ({
  onSubmit,
  isLoading,
  error,
  phone,
  onResend,
}: AuthOTPFormProps): React.JSX.Element => {
  const { t } = useTranslation();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const sanitized = text.replace(/\D/g, '');
    if (!sanitized) return;

    const newDigits = [...digits];
    newDigits[index] = sanitized.charAt(0);
    setDigits(newDigits);

    // Auto-advance to next input
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newDigits.every((d) => d !== '') && index === OTP_LENGTH - 1) {
      onSubmit(newDigits.join(''));
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    onSubmit(digits.join(''));
  };

  const isComplete = digits.every((d) => d !== '');

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        {t('authotpform.enter_the_6digit_code_sent_to') || 'Enter the 6-digit code sent to'} {phone}
      </Text>
      <Text style={styles.devHint}>{t('authotpform.dev_otp_123456') || '(Dev OTP: 123456)'}</Text>

      <View style={styles.otpRow}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[styles.otpInput, error ? styles.otpInputError : undefined]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            accessibilityLabel={`OTP digit ${index + 1}`}
          />
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, (!isComplete || isLoading) && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={!isComplete || isLoading}
        activeOpacity={0.8}
        accessibilityLabel="Verify OTP button"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{isLoading ? 'Verifying…' : 'Verify'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onResend}
        style={styles.resendButton}
        activeOpacity={0.7}
        accessibilityLabel="Resend OTP button"
        accessibilityRole="button"
      >
        <Text style={styles.resendText}>{t('authotpform.resend_code') || 'Resend Code'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  subtitle: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  devHint: {
    ...TextStyles.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.xl,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  otpInput: {
    width: 44,
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    backgroundColor: Colors.surface,
    textAlign: 'center',
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
  },
  otpInputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    ...TextStyles.caption,
    color: Colors.danger,
    marginBottom: Spacing.sm,
  },
  button: {
    width: '100%',
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.surface,
  },
  resendButton: {
    marginTop: Spacing.base,
    padding: Spacing.sm,
  },
  resendText: {
    ...TextStyles.body,
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
});
