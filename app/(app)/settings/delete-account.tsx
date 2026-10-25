import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily, FontSize, Layout, Spacing } from '@theme';
import { useAuthStore } from '../../../src/store/authStore';
import { accountService, formatPurgeDate } from '../../../src/services/api/accountService';
import { apiErrorMessage } from '../../../src/utils/errors';

const POINTS = [
  'You are signed out on every device and your account is hidden straight away.',
  'Your upcoming visits are cancelled and the other person is told.',
  'For 30 days you can sign in with your phone number to restore everything.',
  'After 30 days your name, phone, email, uploaded reports, vitals, AI chats and messages are removed for good.',
  'Prescriptions and visit records written by doctors are kept without your name, because doctors must keep their records.',
];

/** Delete my account (audit L3): explains what happens, then asks for a code. */
export default function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await accountService.sendDeletionCode();
      setCodeSent(true);
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not send the code. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete your account?', 'You can restore it within 30 days by signing in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  const doDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      const purgeAt = await accountService.deleteAccount(otp);
      logout({ remote: false }); // the server already signed this account out
      router.replace('/(auth)/');
      Alert.alert(
        'Account deleted',
        `Sign in with your phone number before ${formatPurgeDate(purgeAt)} if you change your mind.`,
      );
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not delete the account. Try again.'));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ backgroundColor: Colors.surface, paddingTop: insets.top }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delete account</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.card}>
          <Text style={styles.title}>What happens</Text>
          {POINTS.map((p) => (
            <View key={p} style={styles.point}>
              <MaterialCommunityIcons name="circle-small" size={22} color={Colors.textSecondary} />
              <Text style={styles.pointText}>{p}</Text>
            </View>
          ))}
          <Text style={styles.hint}>
            Want a copy first? Use “Download my data” in Settings before deleting.
          </Text>
        </View>

        {!codeSent ? (
          <TouchableOpacity
            style={[styles.btnDanger, busy && styles.disabled]}
            onPress={sendCode}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Send code to delete account"
          >
            {busy ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.btnText}>Send code to my phone</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.card}>
            <Text style={styles.label}>Enter the 6-digit code we sent to your phone</Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={(v) => {
                const digits = v.replace(/\D/g, '').slice(0, 6);
                setOtp(digits);
                // The keyboard would cover the button; a full code needs no more typing.
                if (digits.length === 6) Keyboard.dismiss();
              }}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="6-digit code"
              placeholderTextColor={Colors.textTertiary}
              accessibilityLabel="Deletion code"
            />
            <TouchableOpacity
              style={[styles.btnDanger, (busy || otp.length !== 6) && styles.disabled]}
              onPress={confirmDelete}
              disabled={busy || otp.length !== 6}
              accessibilityRole="button"
              accessibilityLabel="Delete my account"
            >
              {busy ? (
                <ActivityIndicator color={Colors.surface} />
              ) : (
                <Text style={styles.btnText}>Delete my account</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.base,
    paddingLeft: 5,
    gap: Spacing.xs,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  content: { padding: Spacing.base, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  title: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  point: { flexDirection: 'row', alignItems: 'flex-start' },
  pointText: { flex: 1, fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 20 },
  hint: { fontSize: FontSize.sm, color: Colors.textTertiary },
  label: { fontSize: FontSize.base, color: Colors.textSecondary },
  input: {
    height: Layout.inputHeight,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    fontSize: FontSize.lg,
    letterSpacing: 4,
    color: Colors.textPrimary,
  },
  btnDanger: {
    height: Layout.buttonHeight,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.surface },
  disabled: { opacity: 0.5 },
  error: { color: Colors.danger, fontSize: FontSize.base, textAlign: 'center' },
});
