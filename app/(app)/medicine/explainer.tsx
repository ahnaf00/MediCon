import React, { useState } from 'react';
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
import { MedicineLabelView } from '../../../src/components/medical/MedicineLabelView';
import { medicineAiService, MedicineLabel } from '../../../src/services/ai/medicineAiService';
import { createAppError, AppError } from '../../../src/utils/errors';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { useTranslation } from 'react-i18next';

export default function ExplainerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  // undefined = not searched yet, null = searched and nothing found.
  const [result, setResult] = useState<MedicineLabel | null | undefined>(undefined);
  const [searched, setSearched] = useState('');
  const [error, setError] = useState<AppError | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setResult(undefined);
    setError(null);
    try {
      const name = searchQuery.trim();
      const data = await medicineAiService.getMedicineInfo(name);
      setSearched(name);
      setResult(data);
    } catch (err) {
      const appError = createAppError('AI_SERVICE_ERROR', String(err));
      setError(appError);
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
          {t('explainer.medicine_explainer', 'Medicine Information')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.searchSection}>
          <Input
            placeholder={t('explainer.enter_medicine_name') || 'Enter medicine name...'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="words"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <View style={{ marginTop: Spacing.md }}>
            <Button
              label={t('explainer.analyze') || 'Analyze'}
              onPress={handleSearch}
              disabled={!searchQuery.trim() || loading}
            />
          </View>
        </View>

        {loading && <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />}

        {error && !loading && <ErrorState message={error.message} onRetry={handleSearch} />}

        {result === null && !loading && !error && (
          <View style={styles.card}>
            <Text style={styles.notFound}>
              {t('explainer.not_found', { name: searched, defaultValue: 'No FDA label found.' })}
            </Text>
          </View>
        )}

        {result && !loading && (
          <View style={styles.resultContainer}>
            <View style={styles.card}>
              <MedicineLabelView label={result} />
            </View>
            <Text style={styles.source}>
              {t(
                'explainer.source',
                'Source: US FDA drug label (openFDA). General information, not medical advice.',
              )}
            </Text>
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
  searchSection: {
    marginBottom: Spacing.xl,
  },
  loader: {
    marginTop: Spacing.xl,
  },
  resultContainer: {
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  notFound: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  source: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: FontSize.xs * 1.5,
  },
});
