// 1. IMPORTS
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  Colors,
  Spacing,
  BorderRadius,
  FontFamily,
  FontSize,
  Layout,
} from '../../../src/theme';
import { vitalsService, StoreVitalPayload } from '../../../src/services/api/vitalsService';
import { ApiVital } from '../../../src/types/medical.types';
import { createAppError, AppError } from '../../../src/utils/errors';
import { ErrorState } from '../../../src/components/ui/ErrorState';

// 2. TYPES

interface VitalMetricConfig {
  key: keyof ApiVital;
  label: string;
  unit: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  normalRange: string;
  formatValue: (val: ApiVital) => string | null;
  getStatus: (val: ApiVital) => 'normal' | 'warning' | 'danger' | 'unknown';
}

// 3. METRIC CONFIGURATION

const METRIC_CONFIGS: VitalMetricConfig[] = [
  {
    key: 'bloodPressure',
    label: 'Blood Pressure',
    unit: 'mmHg',
    icon: 'heart-pulse',
    color: '#E53E3E',
    normalRange: '90/60 – 120/80',
    formatValue: (v) => v.bloodPressure,
    getStatus: (v) => {
      if (!v.bloodPressure) return 'unknown';
      const parts = v.bloodPressure.split('/');
      if (parts.length !== 2) return 'unknown';
      const sys = parseInt(parts[0], 10);
      const dia = parseInt(parts[1], 10);
      if (isNaN(sys) || isNaN(dia)) return 'unknown';
      if (sys >= 180 || dia >= 120) return 'danger';
      if (sys >= 140 || dia >= 90) return 'warning';
      if (sys < 90 || dia < 60) return 'warning';
      return 'normal';
    },
  },
  {
    key: 'pulseRate',
    label: 'Pulse Rate',
    unit: 'BPM',
    icon: 'pulse',
    color: '#DD6B20',
    normalRange: '60 – 100 BPM',
    formatValue: (v) => (v.pulseRate != null ? String(v.pulseRate) : null),
    getStatus: (v) => {
      if (v.pulseRate == null) return 'unknown';
      if (v.pulseRate < 40 || v.pulseRate > 160) return 'danger';
      if (v.pulseRate < 60 || v.pulseRate > 100) return 'warning';
      return 'normal';
    },
  },
  {
    key: 'glucoseLevel',
    label: 'Blood Glucose',
    unit: 'mmol/L',
    icon: 'water-percent',
    color: '#2B6CB0',
    normalRange: '3.9 – 7.8 mmol/L',
    formatValue: (v) => (v.glucoseLevel != null ? v.glucoseLevel.toFixed(1) : null),
    getStatus: (v) => {
      if (v.glucoseLevel == null) return 'unknown';
      if (v.glucoseLevel < 3.0 || v.glucoseLevel > 13.9) return 'danger';
      if (v.glucoseLevel < 3.9 || v.glucoseLevel > 7.8) return 'warning';
      return 'normal';
    },
  },
  {
    key: 'oxygenSaturation',
    label: 'Oxygen (SpO₂)',
    unit: '%',
    icon: 'lungs',
    color: '#276749',
    normalRange: '95 – 100%',
    formatValue: (v) => (v.oxygenSaturation != null ? String(v.oxygenSaturation) : null),
    getStatus: (v) => {
      if (v.oxygenSaturation == null) return 'unknown';
      if (v.oxygenSaturation < 90) return 'danger';
      if (v.oxygenSaturation < 95) return 'warning';
      return 'normal';
    },
  },
];

const STATUS_COLORS: Record<string, string> = {
  normal: Colors.success,
  warning: Colors.warning,
  danger: Colors.danger,
  unknown: Colors.textTertiary,
};

const STATUS_LABELS: Record<string, string> = {
  normal: 'Normal',
  warning: 'Check',
  danger: 'Alert',
  unknown: '–',
};

// 4. COMPONENTS

interface MetricCardProps {
  config: VitalMetricConfig;
  latest: ApiVital | null;
}

const MetricCard = ({ config, latest }: MetricCardProps): React.JSX.Element => {
  const displayVal = latest ? config.formatValue(latest) : null;
  const status = latest ? config.getStatus(latest) : 'unknown';
  const statusColor = STATUS_COLORS[status];

  return (
    <View style={cardStyles.card}>
      <View style={[cardStyles.iconCircle, { backgroundColor: config.color + '18' }]}>
        <MaterialCommunityIcons name={config.icon} size={22} color={config.color} />
      </View>
      <Text style={cardStyles.label}>{config.label}</Text>
      <View style={cardStyles.valueRow}>
        <Text style={[cardStyles.value, { color: displayVal ? Colors.textPrimary : Colors.textTertiary }]}>
          {displayVal ?? '–'}
        </Text>
        {displayVal && (
          <Text style={cardStyles.unit}>{config.unit}</Text>
        )}
      </View>
      <View style={[cardStyles.statusBadge, { backgroundColor: statusColor + '20' }]}>
        <View style={[cardStyles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[cardStyles.statusText, { color: statusColor }]}>
          {STATUS_LABELS[status]}
        </Text>
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: 2,
    fontWeight: '500',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  unit: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});

// ─── History Row ──────────────────────────────────────────────────────────────

interface HistoryRowProps {
  vital: ApiVital;
}

const HistoryRow = ({ vital }: HistoryRowProps): React.JSX.Element => {
  const date = new Date(vital.loggedAt || vital.createdAt);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const metrics: { label: string; value: string | null }[] = [
    { label: 'BP', value: vital.bloodPressure },
    { label: 'HR', value: vital.pulseRate != null ? `${vital.pulseRate} BPM` : null },
    { label: 'Glucose', value: vital.glucoseLevel != null ? `${vital.glucoseLevel.toFixed(1)} mmol/L` : null },
    { label: 'SpO₂', value: vital.oxygenSaturation != null ? `${vital.oxygenSaturation}%` : null },
  ].filter((m) => m.value != null);

  return (
    <View style={histRowStyles.row}>
      <View style={histRowStyles.timeCol}>
        <Text style={histRowStyles.date}>{dateStr}</Text>
        <Text style={histRowStyles.time}>{timeStr}</Text>
      </View>
      <View style={histRowStyles.metricsCol}>
        {metrics.map((m) => (
          <View key={m.label} style={histRowStyles.chip}>
            <Text style={histRowStyles.chipLabel}>{m.label}:</Text>
            <Text style={histRowStyles.chipValue}>{m.value}</Text>
          </View>
        ))}
        {metrics.length === 0 && (
          <Text style={histRowStyles.noData}>No metrics recorded</Text>
        )}
      </View>
    </View>
  );
};

const histRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: Spacing.md,
  },
  timeCol: {
    minWidth: 80,
    alignItems: 'flex-start',
  },
  date: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  time: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  metricsCol: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    backgroundColor: Colors.tertiaryLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    gap: 3,
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  chipValue: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  noData: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
});

// 5. MAIN SCREEN

export default function VitalsScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isMountedRef = useRef(true);

  const [vitals, setVitals] = useState<ApiVital[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // Log modal
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{
    bloodPressure: string;
    pulseRate: string;
    glucoseLevel: string;
    oxygenSaturation: string;
  }>({
    bloodPressure: '',
    pulseRate: '',
    glucoseLevel: '',
    oxygenSaturation: '',
  });

  // ── Data loading ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const data = await vitalsService.getVitals();
      if (isMountedRef.current) setVitals(data);
    } catch (err) {
      if (isMountedRef.current)
        setError(createAppError('NETWORK_ERROR', 'Unable to load vitals. Please try again.'));
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    (async () => {
      setLoading(true);
      await loadData();
      if (isMountedRef.current) setLoading(false);
    })();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ── Log Vitals ────────────────────────────────────────────────────────────────

  const resetForm = (): void => {
    setForm({ bloodPressure: '', pulseRate: '', glucoseLevel: '', oxygenSaturation: '' });
  };

  const handleSubmit = async (): Promise<void> => {
    const payload: StoreVitalPayload = {};

    if (form.bloodPressure.trim()) {
      if (!/^\d{2,3}\/\d{2,3}$/.test(form.bloodPressure.trim())) {
        Alert.alert('Invalid Format', 'Blood pressure must be in SYS/DIA format, e.g. 120/80');
        return;
      }
      payload.blood_pressure = form.bloodPressure.trim();
    }
    if (form.pulseRate.trim()) {
      const val = parseInt(form.pulseRate, 10);
      if (isNaN(val) || val < 30 || val > 220) {
        Alert.alert('Invalid Value', 'Pulse rate must be between 30 and 220 BPM.');
        return;
      }
      payload.pulse_rate = val;
    }
    if (form.glucoseLevel.trim()) {
      const val = parseFloat(form.glucoseLevel);
      if (isNaN(val) || val < 0 || val > 50) {
        Alert.alert('Invalid Value', 'Glucose level must be between 0 and 50 mmol/L.');
        return;
      }
      payload.glucose_level = val;
    }
    if (form.oxygenSaturation.trim()) {
      const val = parseInt(form.oxygenSaturation, 10);
      if (isNaN(val) || val < 50 || val > 100) {
        Alert.alert('Invalid Value', 'Oxygen saturation must be between 50% and 100%.');
        return;
      }
      payload.oxygen_saturation = val;
    }

    if (Object.keys(payload).length === 0) {
      Alert.alert('Empty Entry', 'Please fill in at least one vital metric before saving.');
      return;
    }

    setSubmitting(true);
    try {
      const newVital = await vitalsService.storeVital(payload);
      if (isMountedRef.current) {
        setVitals((prev) => [newVital, ...prev]);
        setModalVisible(false);
        resetForm();
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to record vitals. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      if (isMountedRef.current) setSubmitting(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const latestVital = vitals.length > 0 ? vitals[0] : null;

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader(router)}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader(router)}
        <View style={styles.centered}>
          <ErrorState
            message={error.message}
            onRetry={() => {
              setLoading(true);
              loadData().finally(() => setLoading(false));
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Vitals</Text>
        <TouchableOpacity
          style={styles.logBtn}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Log new vital reading"
        >
          <MaterialCommunityIcons name="plus" size={18} color={Colors.surface} />
          <Text style={styles.logBtnText}>Log</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Latest reading section */}
        <Text style={styles.sectionTitle}>Latest Readings</Text>
        {latestVital ? (
          <Text style={styles.sectionSubtitle}>
            {`Recorded ${new Date(latestVital.loggedAt || latestVital.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
          </Text>
        ) : (
          <Text style={styles.sectionSubtitle}>No readings yet — tap Log to add your first</Text>
        )}

        {/* 2×2 metric cards */}
        <View style={styles.metricsGrid}>
          {METRIC_CONFIGS.map((cfg) => (
            <MetricCard key={cfg.key as string} config={cfg} latest={latestVital} />
          ))}
        </View>

        {/* History */}
        <Text style={styles.sectionTitle}>History</Text>
        {vitals.length === 0 ? (
          <View style={styles.emptyHistory}>
            <MaterialCommunityIcons name="chart-line" size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyHistoryText}>Your vital history will appear here</Text>
          </View>
        ) : (
          vitals.map((v) => <HistoryRow key={v.id} vital={v} />)
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Log Vitals Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => { setModalVisible(false); resetForm(); }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.base }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Vital Signs</Text>
              <TouchableOpacity
                onPress={() => { setModalVisible(false); resetForm(); }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <MaterialCommunityIcons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSubtitle}>Fill in one or more vital metrics below.</Text>

              <FormField
                label="Blood Pressure"
                placeholder="e.g. 120/80"
                value={form.bloodPressure}
                onChangeText={(t) => setForm((p) => ({ ...p, bloodPressure: t }))}
                keyboardType="default"
                icon="heart-pulse"
                iconColor="#E53E3E"
                unit="mmHg"
                hint="Format: SYS/DIA"
              />
              <FormField
                label="Pulse Rate"
                placeholder="e.g. 72"
                value={form.pulseRate}
                onChangeText={(t) => setForm((p) => ({ ...p, pulseRate: t }))}
                keyboardType="numeric"
                icon="pulse"
                iconColor="#DD6B20"
                unit="BPM"
                hint="30 – 220"
              />
              <FormField
                label="Blood Glucose"
                placeholder="e.g. 5.4"
                value={form.glucoseLevel}
                onChangeText={(t) => setForm((p) => ({ ...p, glucoseLevel: t }))}
                keyboardType="decimal-pad"
                icon="water-percent"
                iconColor="#2B6CB0"
                unit="mmol/L"
                hint="Normal: 3.9 – 7.8"
              />
              <FormField
                label="Oxygen Saturation"
                placeholder="e.g. 98"
                value={form.oxygenSaturation}
                onChangeText={(t) => setForm((p) => ({ ...p, oxygenSaturation: t }))}
                keyboardType="numeric"
                icon="lungs"
                iconColor="#276749"
                unit="% SpO₂"
                hint="Normal: ≥ 95%"
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Save vital reading"
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.surface} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={18} color={Colors.surface} />
                    <Text style={styles.submitBtnText}>Save Reading</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── FormField sub-component ──────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType: 'default' | 'numeric' | 'decimal-pad';
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  unit: string;
  hint: string;
}

const FormField = ({
  label, placeholder, value, onChangeText, keyboardType, icon, iconColor, unit, hint,
}: FormFieldProps): React.JSX.Element => (
  <View style={formStyles.fieldGroup}>
    <View style={formStyles.fieldLabelRow}>
      <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
      <Text style={formStyles.fieldLabel}>{label}</Text>
      <Text style={formStyles.fieldUnit}>{unit}</Text>
    </View>
    <TextInput
      style={formStyles.input}
      placeholder={placeholder}
      placeholderTextColor={Colors.textTertiary}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      returnKeyType="next"
      accessibilityLabel={label}
    />
    <Text style={formStyles.hint}>{hint}</Text>
  </View>
);

const formStyles = StyleSheet.create({
  fieldGroup: {
    marginBottom: Spacing.base,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  fieldLabel: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  fieldUnit: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  input: {
    height: Layout.inputHeight,
    borderWidth: 1.5,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 4,
    marginLeft: 2,
  },
});

// ─── Header helper ────────────────────────────────────────────────────────────

function renderHeader(router: ReturnType<typeof useRouter>): React.JSX.Element {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>My Vitals</Text>
      <View style={{ width: 64 }} />
    </View>
  );
}

// 6. STYLES

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  logBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginBottom: Spacing.base,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyHistoryText: {
    fontSize: FontSize.base,
    color: Colors.textTertiary,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.base,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    height: Layout.buttonHeight,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.surface,
  },
});
