import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontFamily, FontSize } from '../../theme';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { authService } from '../../services/api/authService';
import { apiErrorMessage } from '../../utils/errors';

interface ChangePhoneProps {
  currentPhone: string;
  onChanged: (phone: string) => void;
}

/**
 * The login number, shown read-only, with a "Change number" flow that sends a
 * code to the new number and switches only once it is entered (audit F12).
 */
export function ChangePhone({ currentPhone, onChanged }: ChangePhoneProps) {
  const [step, setStep] = useState<'idle' | 'number' | 'code'>('idle');
  const [newPhone, setNewPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reset = () => {
    setStep('idle');
    setNewPhone('');
    setCode('');
    setError(null);
  };

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await authService.sendPhoneChangeCode(newPhone.trim());
      setStep('code');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send a code. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const user = await authService.confirmPhoneChange(newPhone.trim(), code.trim());
      onChanged(user.phone || newPhone.trim());
      setNotice('Phone number changed. Use the new number to log in.');
      reset();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not change the number. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Input label="Phone Number" value={currentPhone} disabled />
      {notice && <Text style={styles.success}>{notice}</Text>}

      {step === 'idle' ? (
        <TouchableOpacity
          onPress={() => {
            setNotice(null);
            setStep('number');
          }}
          accessibilityRole="button"
          accessibilityLabel="Change phone number"
        >
          <Text style={styles.link}>Change number</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.panel}>
          {step === 'number' ? (
            <>
              <Input
                label="New phone number"
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="e.g. 01711000000"
                keyboardType="phone-pad"
              />
              <Text style={styles.hint}>We will send a code to this number.</Text>
              <Button
                label="Send code"
                onPress={sendCode}
                loading={busy}
                disabled={!newPhone.trim()}
              />
            </>
          ) : (
            <>
              <Text style={styles.hint}>Enter the 6-digit code sent to {newPhone.trim()}.</Text>
              <Input
                label="Code"
                value={code}
                onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
              />
              <Button
                label="Confirm new number"
                onPress={confirm}
                loading={busy}
                disabled={code.length !== 6}
              />
            </>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity onPress={reset} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.link}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  panel: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  link: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  hint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  error: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
  },
  success: {
    color: Colors.success,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
  },
});
