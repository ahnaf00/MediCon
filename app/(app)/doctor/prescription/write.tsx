// 1. IMPORTS
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius, Shadows } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 2. TYPES
interface MedicineEntry {
  id: string;
  name: string;
  dosage: string;
  freqMorning: boolean;
  freqAfternoon: boolean;
  freqNight: boolean;
  interval: string;
  duration: string;
  instructions: string;
}

interface TestEntry {
  id: string;
  name: string;
  reason: string;
}

const INTERVAL_OPTIONS = ['Daily', 'Every 2 days', 'Weekly', 'As needed'];
const INSTRUCTION_OPTIONS = ['Before Meals', 'After Meals'];
const DURATION_OPTIONS = ['7 Days', '14 Days', '21 Days', '30 Days'];

function makeEmptyMedicine(index: number): MedicineEntry {
  return {
    id: `med-${Date.now()}-${index}`,
    name: '',
    dosage: '',
    freqMorning: false,
    freqAfternoon: false,
    freqNight: false,
    interval: 'Daily',
    duration: '',
    instructions: '',
  };
}

function makeEmptyTest(index: number): TestEntry {
  return {
    id: `test-${Date.now()}-${index}`,
    name: '',
    reason: '',
  };
}

// Mock allergies based on patientId for demonstration
const getMockAllergies = (id?: string) => {
  if (!id) return '';
  if (id.includes('101') || id === 'p1') return 'Penicillin';
  if (id.includes('103') || id === 'p3') return 'Sulfa drugs, Aspirin';
  if (id === 'p5') return 'NSAIDs';
  return '';
};

const getMockAge = (id?: string) => {
  if (!id) return '35';
  if (id.includes('101') || id === 'p1') return '45';
  if (id.includes('102') || id === 'p2') return '32';
  if (id.includes('103') || id === 'p3') return '58';
  return '35';
};

type ActiveTab = 'medicines' | 'tests';

// 3. COMPONENT
export default function WritePrescriptionScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { patientId, patientName } = useLocalSearchParams<{
    patientId?: string;
    patientName?: string;
  }>();

  const [activeTab, setActiveTab] = useState<ActiveTab>('medicines');
  const [medicines, setMedicines] = useState<MedicineEntry[]>([makeEmptyMedicine(0)]);
  const [tests, setTests] = useState<TestEntry[]>([]);
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const testNameRef = useRef<TextInput>(null);

  const [isNotesModalVisible, setIsNotesModalVisible] = useState(false);
  const notesRef = useRef<TextInput>(null);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  React.useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Programmatically focus on modal open
  React.useEffect(() => {
    if (activeTestId) {
      const timer = setTimeout(() => testNameRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    } else if (isNotesModalVisible) {
      const timer = setTimeout(() => notesRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    } else {
      Keyboard.dismiss();
    }
  }, [activeTestId, isNotesModalVisible]);

  const allergies = getMockAllergies(patientId);
  const patientAge = getMockAge(patientId);

  // ── MEDICINES HANDLERS ───────────────────────────────────────────────────────
  const addMedicine = () => {
    setMedicines((prev) => [...prev, makeEmptyMedicine(prev.length)]);
  };

  const updateMedicine = (id: string, field: keyof MedicineEntry, value: any) => {
    setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
    if (validationError) setValidationError('');
  };

  const removeMedicine = (id: string) => {
    if (medicines.length <= 1) return;
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  // ── TESTS HANDLERS ───────────────────────────────────────────────────────────
  const addTest = () => {
    setTests((prev) => [...prev, makeEmptyTest(prev.length)]);
  };

  const updateTest = (id: string, field: keyof TestEntry, value: string) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
    if (validationError) setValidationError('');
  };

  const removeTest = (id: string) => {
    setTests((prev) => prev.filter((t) => t.id !== id));
  };

  // ── SUBMIT HANDLER ───────────────────────────────────────────────────────────
  const handleReview = () => {
    let errorMsg = '';

    // Validate Medicines
    for (let i = 0; i < medicines.length; i++) {
      const m = medicines[i];
      if (!m.name.trim()) {
        errorMsg = `Medicine #${i + 1}: Name is required.`;
        break;
      }
      if (!m.dosage.trim()) {
        errorMsg = `Medicine #${i + 1}: Dosage is required.`;
        break;
      }
      if (!(m.freqMorning || m.freqAfternoon || m.freqNight)) {
        errorMsg = `Medicine #${i + 1}: At least one Time of Day is required.`;
        break;
      }
      if (!m.instructions.trim()) {
        errorMsg = `Medicine #${i + 1}: Instructions are required.`;
        break;
      }
      if (!m.duration.trim()) {
        errorMsg = `Medicine #${i + 1}: Duration is required.`;
        break;
      }
    }

    if (errorMsg) {
      setValidationError(errorMsg);
      setActiveTab('medicines');
      return;
    }

    // Validate Tests
    for (let i = 0; i < tests.length; i++) {
      if (!tests[i].name.trim()) {
        errorMsg = `Test #${i + 1}: Test Name is required.`;
        break;
      }
    }

    if (errorMsg) {
      setValidationError(errorMsg);
      setActiveTab('tests');
      return;
    }

    // Prepare data for review screen
    const reviewData = {
      patientId,
      patientName: patientName ? decodeURIComponent(patientName) : '',
      patientAge,
      allergies,
      medicines: JSON.stringify(
        medicines.map((m) => ({
          ...m,
          frequencyPattern: `${m.freqMorning ? 1 : 0}+${m.freqAfternoon ? 1 : 0}+${m.freqNight ? 1 : 0}`,
        }))
      ),
      tests: JSON.stringify(tests),
      notes,
    };

    router.push({
      pathname: '/(app)/doctor/prescription/review',
      params: reviewData,
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write Prescription</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── PATIENT INFO CARD ── */}
          {patientName ? (
            <View style={styles.patientInfoCard}>
              <View style={styles.patientInfoLeft}>
                <Text style={styles.patientInfoName}>{decodeURIComponent(patientName)}</Text>
                <Text style={styles.patientInfoAge}>{patientAge} years old</Text>
              </View>
              {allergies ? (
                <View style={styles.allergyBox}>
                  <Text style={styles.allergyBoxTitle}>Allergies</Text>
                  <Text style={styles.allergyBoxText}>{allergies}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* ── TAB BAR ── */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'medicines' && styles.tabActive]}
              onPress={() => setActiveTab('medicines')}
              activeOpacity={1}
            >
              <Text style={[styles.tabText, activeTab === 'medicines' && styles.tabTextActive]}>
                Medicines
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'tests' && styles.tabActive]}
              onPress={() => setActiveTab('tests')}
              activeOpacity={1}
            >
              <Text style={[styles.tabText, activeTab === 'tests' && styles.tabTextActive]}>
                Tests
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── TAB CONTENT: MEDICINES ── */}
          {activeTab === 'medicines' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Medicines</Text>
                <TouchableOpacity style={styles.addButton} onPress={addMedicine}>
                  <MaterialCommunityIcons name="plus" size={16} color={Colors.primary} />
                  <Text style={styles.addButtonText}>Add Medicine</Text>
                </TouchableOpacity>
              </View>

              {medicines.map((medicine, index) => (
                <View key={medicine.id} style={[styles.card, index === medicines.length - 1 && { marginBottom: Spacing.lg }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleBadge}>
                      <Text style={styles.cardTitle}>Medicine #{index + 1}</Text>
                    </View>
                    {medicines.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeMedicine(medicine.id)}
                        style={styles.removeButton}
                      >
                        <MaterialCommunityIcons name="close" size={18} color={Colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.row}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.fieldLabel}>
                        Name <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Amlodipine"
                        placeholderTextColor={Colors.textTertiary}
                        value={medicine.name}
                        onChangeText={(v) => updateMedicine(medicine.id, 'name', v)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>
                        Dosage <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. 5mg"
                        placeholderTextColor={Colors.textTertiary}
                        value={medicine.dosage}
                        onChangeText={(v) => updateMedicine(medicine.id, 'dosage', v)}
                      />
                    </View>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>
                    Frequency <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.frequencyContainer}>
                    <View style={styles.timeOfDayCol}>
                      <Text style={styles.subLabel}>Time of Day</Text>
                      <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => updateMedicine(medicine.id, 'freqMorning', !medicine.freqMorning)}
                      >
                        <MaterialCommunityIcons
                          name={medicine.freqMorning ? 'checkbox-marked' : 'checkbox-blank-outline'}
                          size={20}
                          color={medicine.freqMorning ? Colors.primary : Colors.textTertiary}
                        />
                        <Text style={styles.checkboxLabel}>Morning</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() =>
                          updateMedicine(medicine.id, 'freqAfternoon', !medicine.freqAfternoon)
                        }
                      >
                        <MaterialCommunityIcons
                          name={medicine.freqAfternoon ? 'checkbox-marked' : 'checkbox-blank-outline'}
                          size={20}
                          color={medicine.freqAfternoon ? Colors.primary : Colors.textTertiary}
                        />
                        <Text style={styles.checkboxLabel}>Afternoon</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => updateMedicine(medicine.id, 'freqNight', !medicine.freqNight)}
                      >
                        <MaterialCommunityIcons
                          name={medicine.freqNight ? 'checkbox-marked' : 'checkbox-blank-outline'}
                          size={20}
                          color={medicine.freqNight ? Colors.primary : Colors.textTertiary}
                        />
                        <Text style={styles.checkboxLabel}>Night</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.verticalDivider} />
                    <View style={styles.intervalCol}>
                      <Text style={styles.subLabel}>Interval</Text>
                      {INTERVAL_OPTIONS.map((interval) => (
                        <TouchableOpacity
                          key={interval}
                          style={styles.checkboxRow}
                          onPress={() => updateMedicine(medicine.id, 'interval', interval)}
                        >
                          <MaterialCommunityIcons
                            name={medicine.interval === interval ? 'radiobox-marked' : 'radiobox-blank'}
                            size={20}
                            color={medicine.interval === interval ? Colors.primary : Colors.textTertiary}
                          />
                          <Text style={styles.checkboxLabel}>{interval}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>
                    Instructions <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.chipRow}>
                    {INSTRUCTION_OPTIONS.map((inst) => {
                      const selected = medicine.instructions === inst;
                      return (
                        <TouchableOpacity
                          key={inst}
                          style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]}
                          onPress={() => updateMedicine(medicine.id, 'instructions', inst)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              selected ? styles.chipTextSelected : styles.chipTextUnselected,
                            ]}
                          >
                            {inst}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>
                    Duration <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.chipRow}>
                    {DURATION_OPTIONS.map((dur) => {
                      const selected = medicine.duration === dur;
                      return (
                        <TouchableOpacity
                          key={dur}
                          style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]}
                          onPress={() => updateMedicine(medicine.id, 'duration', dur)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              selected ? styles.chipTextSelected : styles.chipTextUnselected,
                            ]}
                          >
                            {dur}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── TAB CONTENT: TESTS ── */}
          {activeTab === 'tests' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tests</Text>
                <TouchableOpacity style={styles.addButton} onPress={addTest}>
                  <MaterialCommunityIcons name="plus" size={16} color={Colors.primary} />
                  <Text style={styles.addButtonText}>Add Test</Text>
                </TouchableOpacity>
              </View>

              {tests.length === 0 ? (
                <View style={styles.emptySection}>
                  <MaterialCommunityIcons name="test-tube" size={28} color={Colors.textTertiary} />
                  <Text style={styles.emptyText}>No tests added yet.</Text>
                </View>
              ) : (
                tests.map((test, index) => (
                  <View 
                    key={test.id} 
                    style={[styles.card, index === tests.length - 1 && { marginBottom: Spacing.lg }]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleBadge}>
                        <Text style={styles.cardTitle}>Test #{index + 1}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeTest(test.id)}
                        style={styles.removeButton}
                      >
                        <MaterialCommunityIcons name="close" size={18} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.fieldLabel}>
                      Test Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity onPress={() => setActiveTestId(test.id)} activeOpacity={0.8}>
                      <View style={[styles.textInput, { justifyContent: 'center' }]}>
                        <Text style={test.name ? styles.inputText : styles.placeholderText}>
                          {test.name || 'e.g. Complete Blood Count (CBC)'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Reason</Text>
                    <View style={[styles.textInput, styles.reasonInput, { padding: 0 }]}>
                      <ScrollView nestedScrollEnabled contentContainerStyle={{ flexGrow: 1, padding: Spacing.md }}>
                        <TouchableOpacity onPress={() => setActiveTestId(test.id)} activeOpacity={0.8} style={{ flex: 1 }}>
                          <Text style={test.reason ? styles.inputText : styles.placeholderText}>
                            {test.reason || 'e.g. To check for anemia'}
                          </Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Validation Errors above Additional Notes */}
          {validationError ? <Text style={styles.validationError}>{validationError}</Text> : null}

          {/* Additional Notes */}
          <View style={styles.notesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
            </View>
            <View style={[styles.textInput, styles.textInputMultiline, { padding: 0 }]}>
              <ScrollView nestedScrollEnabled contentContainerStyle={{ flexGrow: 1, padding: Spacing.md }}>
                <TouchableOpacity onPress={() => setIsNotesModalVisible(true)} activeOpacity={0.8} style={{ flex: 1 }}>
                  <Text style={notes ? styles.inputText : styles.placeholderText}>
                    {notes || 'e.g. Monitor blood pressure daily. Return in 4 weeks.'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── TEST MODAL ── */}
      <Modal
        visible={!!activeTestId}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setActiveTestId(null)}
      >
        {/* KeyboardAvoidingView as root ensures the entire modal content shifts up */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={styles.modalRoot}
        >
          {/* Full-area backdrop — tap to dismiss */}
          <TouchableWithoutFeedback onPress={() => setActiveTestId(null)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          {activeTestId && (() => {
            const test = tests.find(t => t.id === activeTestId);
            const index = tests.findIndex(t => t.id === activeTestId);
            if (!test) return null;
            return (
              <View style={[
                styles.modalCardContainer,
                { paddingBottom: isKeyboardVisible ? Spacing.base : insets.bottom + Spacing.base },
              ]}>
                <View style={[styles.card, { marginBottom: 0 }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleBadge}>
                      <Text style={styles.cardTitle}>Test #{index + 1}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setActiveTestId(null)} style={styles.removeButton}>
                      <MaterialCommunityIcons name="check" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.fieldLabel}>
                    Test Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    ref={testNameRef}
                    style={styles.textInput}
                    placeholder="e.g. Complete Blood Count (CBC)"
                    placeholderTextColor={Colors.textTertiary}
                    value={test.name}
                    onChangeText={(v) => updateTest(test.id, 'name', v)}
                    returnKeyType="next"
                  />

                  <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Reason</Text>
                  <TextInput
                    style={[styles.textInput, styles.reasonInput]}
                    placeholder="e.g. To check for anemia"
                    placeholderTextColor={Colors.textTertiary}
                    value={test.reason}
                    onChangeText={(v) => updateTest(test.id, 'reason', v)}
                    multiline
                    numberOfLines={3}
                    scrollEnabled={true}
                  />
                </View>
              </View>
            );
          })()}
        </KeyboardAvoidingView>
      </Modal>

      {/* ── ADDITIONAL NOTES MODAL ── */}
      <Modal
        visible={isNotesModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsNotesModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={styles.modalRoot}
        >
          <TouchableWithoutFeedback onPress={() => setIsNotesModalVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View style={[
            styles.modalCardContainer,
            { paddingBottom: isKeyboardVisible ? Spacing.base : insets.bottom + Spacing.base },
          ]}>
            <View style={[styles.card, { marginBottom: 0 }]}>
              <View style={[styles.cardHeader, { marginBottom: Spacing.base }]}>
                <View style={styles.cardTitleBadge}>
                  <Text style={styles.cardTitle}>Additional Notes</Text>
                </View>
                <TouchableOpacity onPress={() => setIsNotesModalVisible(false)} style={styles.removeButton}>
                  <MaterialCommunityIcons name="check" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              <TextInput
                ref={notesRef}
                style={[styles.textInput, styles.textInputMultiline]}
                placeholder="e.g. Monitor blood pressure daily. Return in 4 weeks."
                placeholderTextColor={Colors.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                scrollEnabled={true}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── FIXED BOTTOM ACTION BAR ── */}
      <View style={[styles.bottomActionBar, { paddingBottom: insets.bottom + Spacing.base }]}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleReview}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="file-document-edit-outline"
            size={20}
            color={Colors.surface}
          />
          <Text style={styles.submitButtonText}>Review Prescription</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 140,
  },
  patientInfoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  patientInfoLeft: {
    flex: 1,
  },
  patientInfoName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  patientInfoAge: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  allergyBox: {
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '45%',
    minHeight: 64,
  },
  allergyBoxTitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  allergyBoxText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.danger,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    padding: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    minHeight: 44,
  },
  tabActive: {
    backgroundColor: Colors.tertiaryLight,
  },
  tabText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  tabTextActive: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  section: {
    marginTop: Spacing.sm,
  },
  notesSection: {
    marginTop: 0,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitleBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  fieldLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  required: {
    color: Colors.danger,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.5,
  },
  textInputMultiline: {
    height: 120,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    textAlignVertical: 'top',
  },
  reasonInput: {
    height: 76,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    textAlignVertical: 'top',
  },
  frequencyContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  timeOfDayCol: {
    flex: 1,
    gap: Spacing.sm,
  },
  intervalCol: {
    flex: 1,
    gap: Spacing.sm,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: Colors.tertiary,
    marginHorizontal: Spacing.md,
  },
  subLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkboxLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flex: 1,
    minWidth: 70,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipUnselected: {
    backgroundColor: Colors.surface,
    borderColor: Colors.tertiary,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
  },
  chipTextSelected: {
    color: Colors.surface,
  },
  chipTextUnselected: {
    color: Colors.textSecondary,
  },
  emptySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  validationError: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.danger,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    ...Shadows.md,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    height: 48,
    gap: Spacing.sm,
  },
  submitButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
  },
  inputText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.5,
  },
  placeholderText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textTertiary,
    lineHeight: FontSize.base * 1.5,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCardContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
});
