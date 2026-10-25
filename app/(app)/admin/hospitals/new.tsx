import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSize, Layout, Spacing } from '@theme';
import { AdminHeader } from '../../../../src/components/admin/AdminHeader';
import { HospitalForm } from '../../../../src/components/admin/HospitalForm';
import {
  HospitalInput,
  emptyHospitalForm,
  hospitalFieldErrors,
  parseHospitalForm,
  useCreateHospital,
} from '../../../../src/services/api/adminSystemService';
import { apiErrorMessage } from '../../../../src/utils/errors';

/** Add a hospital (audit L2b step 3). It is shown to patients straight away. */
export default function NewHospitalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const create = useCreateHospital();
  const [form, setForm] = useState(emptyHospitalForm);
  const [errors, setErrors] = useState<Partial<Record<keyof HospitalInput, string>>>({});

  const onSave = () => {
    const { input, errors: found } = parseHospitalForm(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    create.mutate(input, {
      onSuccess: (hospital) => {
        Alert.alert('Hospital added', `${hospital.name} is now shown to patients.`);
        router.back();
      },
      onError: (err) => {
        const fromServer = hospitalFieldErrors(err);
        setErrors(fromServer);
        if (Object.keys(fromServer).length === 0) {
          Alert.alert('Not saved', apiErrorMessage(err, 'Something went wrong. Try again.'));
        }
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AdminHeader title="Add hospital" back />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <HospitalForm
          value={form}
          onChange={setForm}
          errors={errors}
          onErrorsChange={setErrors}
          disabled={create.isPending}
        />
      </ScrollView>
      <View style={[styles.actions, { paddingBottom: Spacing.base + insets.bottom }]}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={onSave}
          disabled={create.isPending}
          accessibilityRole="button"
          accessibilityLabel="Add hospital"
        >
          {create.isPending ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.btnText}>Add hospital</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingBottom: Spacing.xl },

  actions: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  btnPrimary: {
    height: Layout.buttonHeight,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  btnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.surface },
});
