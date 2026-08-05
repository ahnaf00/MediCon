// 1. IMPORTS
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize, TextStyles, Layout } from '@theme';
import { useTranslation } from 'react-i18next';

// 2. TYPES
export interface AuthPhoneFormProps {
  phone: string;
  onChangePhone: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error?: string;
}

// 3. COMPONENT
export const AuthPhoneForm = ({
  phone,
  onChangePhone,
  onSubmit,
  isLoading,
  error,
}: AuthPhoneFormProps): React.JSX.Element => {
  const { t } = useTranslation();
  const isValid = phone.replace(/\D/g, '').length >= 10;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('authphoneform.phone_number') || 'Phone Number'}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : undefined]}
        placeholder={t('authphoneform.enter_your_phone_number') || 'Enter your phone number'}
        placeholderTextColor={Colors.textTertiary}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={onChangePhone}
        maxLength={15}
        accessibilityLabel="Phone number input"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, (!isValid || isLoading) && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={!isValid || isLoading}
        activeOpacity={0.8}
        accessibilityLabel="Send OTP button"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{isLoading ? 'Sending…' : 'Send OTP'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    width: '100%',
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
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    ...TextStyles.caption,
    color: Colors.danger,
    marginBottom: Spacing.sm,
  },
  button: {
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
});
