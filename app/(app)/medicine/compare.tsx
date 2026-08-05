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
import { MedicineCompareCard } from '../../../src/components/medical/MedicineCompareCard';
import { medicineAiService, ComparisonResult } from '../../../src/services/ai/medicineAiService';
import { createAppError, AppError } from '../../../src/utils/errors';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { Colors, Spacing, FontFamily, FontSize } from '../../../src/theme';
import { useTranslation } from 'react-i18next';

export default function CompareScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [medA, setMedA] = useState('');
  const [medB, setMedB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const handleCompare = async () => {
    if (!medA.trim() || !medB.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setResult(null);
    try {
      const data = await medicineAiService.compareMedicines(medA.trim(), medB.trim());
      setResult(data);
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
          {t('compare.medicine_comparator') || 'Medicine Comparator'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputSection}>
          <Input
            placeholder={t('compare.medicine_a') || 'Medicine A'}
            value={medA}
            onChangeText={setMedA}
            autoCapitalize="words"
          />
          <View style={styles.vsContainer}>
            <MaterialCommunityIcons name="close" size={20} color={Colors.textTertiary} />
          </View>
          <Input
            placeholder={t('compare.medicine_b') || 'Medicine B'}
            value={medB}
            onChangeText={setMedB}
            autoCapitalize="words"
          />
          <View style={{ marginTop: Spacing.xl }}>
            <Button
              label={t('compare.compare') || 'Compare'}
              onPress={handleCompare}
              disabled={!medA.trim() || !medB.trim() || loading}
            />
          </View>
        </View>

        {loading && <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />}

        {error && !loading && <ErrorState message={error.message} onRetry={handleCompare} />}

        {result && !loading && (
          <MedicineCompareCard medA={medA.trim()} medB={medB.trim()} comparison={result} />
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
  inputSection: {
    marginBottom: Spacing.xl,
  },
  vsContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  loader: {
    marginTop: Spacing.xl,
  },
});
