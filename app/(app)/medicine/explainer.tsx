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
import { AIDisclaimer } from '../../../src/components/medical/AIDisclaimer';
import {
  medicineAiService,
  MedicineExplainerResult,
} from '../../../src/services/ai/medicineAiService';
import { createAppError, AppError } from '../../../src/utils/errors';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { useTranslation } from 'react-i18next';

export default function ExplainerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedicineExplainerResult | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setResult(null);
    try {
      const data = await medicineAiService.getMedicineExplainer(searchQuery.trim());
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
          {t('explainer.medicine_explainer') || 'Medicine Explainer'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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

        {result && !loading && (
          <View style={styles.resultContainer}>
            <AIDisclaimer />

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{searchQuery.trim()}</Text>

              <View style={styles.row}>
                <Text style={styles.label}>{t('explainer.class') || 'Class:'}</Text>
                <Text style={styles.value}>{result.className}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t('explainer.available_forms') || 'Available Forms'}
                </Text>
                {result.forms.map((f, i) => (
                  <Text key={i} style={styles.listItem}>
                    • {f}
                  </Text>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t('explainer.common_side_effects') || 'Common Side Effects'}
                </Text>
                {result.sideEffects.map((se, i) => (
                  <Text key={i} style={styles.listItem}>
                    • {se}
                  </Text>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t('explainer.dietary_conflicts') || 'Dietary Conflicts'}
                </Text>
                {result.dietaryConflicts.map((dc, i) => (
                  <Text key={i} style={styles.listItem}>
                    • {dc}
                  </Text>
                ))}
              </View>

              <View style={[styles.section, { borderBottomWidth: 0 }]}>
                <Text style={styles.sectionTitle}>{t('explainer.ai_summary') || 'AI Summary'}</Text>
                <Text style={styles.summaryText}>{result.summary}</Text>
              </View>
            </View>
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
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  value: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  listItem: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: FontSize.sm * 1.5,
  },
  summaryText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: FontSize.sm * 1.5,
  },
});
