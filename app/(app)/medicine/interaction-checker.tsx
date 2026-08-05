import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { InteractionFlag } from '../../../src/components/medical/InteractionFlag';
import { medicineAiService, InteractionConflict } from '../../../src/services/ai/medicineAiService';
import { prescriptionsService } from '../../../src/services/api/prescriptionsService';
import { createAppError, AppError } from '../../../src/utils/errors';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { Colors, Spacing, FontFamily, FontSize } from '../../../src/theme';
import { useTranslation } from 'react-i18next';

export default function InteractionCheckerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [newMedicine, setNewMedicine] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMedicines, setActiveMedicines] = useState<{ id: string; name: string }[]>([]);
  const [conflicts, setConflicts] = useState<InteractionConflict[] | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const prescriptions = await prescriptionsService.getPrescriptions();
        if (isMounted) {
          const meds = prescriptions.flatMap((p) =>
            p.medicines.map((m) => ({ id: m.id, name: m.name })),
          );
          setActiveMedicines(meds);
        }
      } catch (err) {
        if (isMounted) setError(createAppError('NETWORK_ERROR', String(err)));
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCheck = async () => {
    if (!newMedicine.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setConflicts(null);
    try {
      const data = await medicineAiService.checkInteractions(newMedicine.trim(), activeMedicines);
      setConflicts(data);
    } catch (err) {
      setError(createAppError('AI_SERVICE_ERROR', String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('interaction-checker.interaction_checker') || 'Interaction Checker'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            {t('interaction-checker.crossreferencing_against') || 'Cross-referencing against'}{' '}
            {activeMedicines.length}{' '}
            {t('interaction-checker.active_medicines_from_your_pre') ||
              `active medicines from your
                                  prescriptions.`}
          </Text>
        </View>

        <View style={styles.searchSection}>
          <Input
            placeholder={
              t('interaction-checker.enter_new_medicine_to_check') ||
              'Enter new medicine to check...'
            }
            value={newMedicine}
            onChangeText={setNewMedicine}
            autoCapitalize="words"
            returnKeyType="search"
            onSubmitEditing={handleCheck}
          />
          <View style={{ marginTop: Spacing.md }}>
            <Button
              label={t('interaction-checker.check_interactions') || 'Check Interactions'}
              onPress={handleCheck}
              disabled={!newMedicine.trim() || loading || activeMedicines.length === 0}
            />
          </View>
        </View>

        {loading && <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />}

        {error && !loading && <ErrorState message={error.message} onRetry={handleCheck} />}

        {conflicts && !loading && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              {t('interaction-checker.results_for') || 'Results for'} {newMedicine.trim()}
            </Text>
            {conflicts.map((conflict, i) => (
              <InteractionFlag key={i} conflict={conflict} />
            ))}
            {conflicts.length === 0 && (
              <Text style={styles.noMedsText}>
                {t('interaction-checker.no_active_prescriptions_to_che') ||
                  'No active prescriptions to check against.'}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4FE',
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary,
    lineHeight: FontSize.sm * 1.5,
  },
  searchSection: {
    marginBottom: Spacing.xl,
  },
  loader: {
    marginTop: Spacing.xl,
  },
  resultsContainer: {
    marginTop: Spacing.md,
  },
  resultsTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  noMedsText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
    lineHeight: FontSize.md * 1.5,
  },
});
