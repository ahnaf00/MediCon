import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../../../src/store/authStore';
import { qnaService } from '../../../../src/services/api/qnaService';
import { useTranslation } from 'react-i18next';

const SYMPTOM_AREAS = [
  { id: '1', label: 'Heart & Chest Problems', department: 'Cardiology' },
  { id: '2', label: 'Skin & Hair', department: 'Dermatology' },
  { id: '3', label: "Children's Health", department: 'Pediatrics' },
  { id: '4', label: 'Mental Health', department: 'Psychiatry' },
  { id: '5', label: 'Bone & Joint Pain', department: 'Orthopedics' },
  { id: '6', label: 'Digestive Issues', department: 'Gastroenterology' },
  { id: '7', label: 'General & Fever', department: 'General Medicine' },
  { id: '8', label: "Women's Health", department: 'Gynecology' },
  { id: '9', label: 'Other', department: 'General Medicine' },
  { id: '10', label: 'Brain & Nerves', department: 'Neurology' },
];

export default function AskQuestionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { editId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.userId) || 'patient-1';

  const [symptomId, setSymptomId] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    const fetchQuestion = async () => {
      if (editId && typeof editId === 'string') {
        const data = await qnaService.getPatientQuestions(userId);
        const q = data.find((q) => q.id === editId);
        if (q) {
          setContent(q.content);
          if (q.symptomId) {
            setSymptomId(q.symptomId);
          } else {
            const dept = SYMPTOM_AREAS.find((s) => s.department === q.department);
            if (dept) setSymptomId(dept.id);
          }
          setIsAnonymous(!!q.isAnonymous);
        }
      }
    };
    fetchQuestion();
  }, [editId, userId]);

  const handleSubmit = async () => {
    const department = SYMPTOM_AREAS.find((s) => s.id === symptomId)?.department;
    if (!department || !content.trim()) return;

    try {
      setSubmitting(true);
      if (editId && typeof editId === 'string') {
        await qnaService.updateQuestion(
          editId,
          userId,
          content.trim(),
          department,
          isAnonymous,
          symptomId,
        );
      } else {
        await qnaService.askQuestion(userId, department, content.trim(), isAnonymous, symptomId);
      }
      // On success, go back to QnA index
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to submit your question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Wrapper for Status Bar */}
      <View
        style={{
          backgroundColor: Colors.surface,
          paddingTop: insets.top,
          marginBottom: Spacing.md,
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editId
              ? t('ask.edit_your_question', 'Edit Your Question')
              : t('ask.ask_your_question', 'Ask Your Question')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { marginTop: 0 }]}>
          <Text style={styles.sectionTitle}>
            {t('ask.how_can_a_doctor_help_you', 'How can a doctor help you?')}
            <Text style={{ color: Colors.danger, fontSize: FontSize.xs + 3 }}> *</Text>
          </Text>
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.textInputWrapper,
                { borderColor: content.length === 300 ? Colors.danger : Colors.textTertiary },
              ]}
            >
              <TextInput
                style={styles.textArea}
                placeholder={t(
                  'ask.describe_your_symptoms_he',
                  'Describe your symptoms, health concern, or any medical issue.',
                )}
                placeholderTextColor={Colors.textTertiary}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                maxLength={300}
                editable={!submitting}
              />
              <View style={styles.counterRow}>
                <Text
                  style={[styles.counterText, content.length === 300 && styles.counterTextError]}
                >
                  {content.length}/300
                </Text>
              </View>
            </View>
            {content.length === 300 && (
              <Text style={styles.validationError}>
                {t('ask.question_cannot_exceed_300', 'Question cannot exceed 300 characters.')}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('ask.symptom_area', 'Symptom Area')}
            <Text style={{ color: Colors.danger, fontSize: FontSize.xs + 3 }}> *</Text>
          </Text>
          <Text style={styles.sectionDesc}>
            {t(
              'ask.choose_the_category_that_bes',
              'Choose the category that best matches your problems.',
            )}
          </Text>

          <View style={styles.chipContainer}>
            {SYMPTOM_AREAS.map((item) => {
              const isSelected = symptomId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setSymptomId(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsAnonymous(!isAnonymous)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isAnonymous ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={20}
              color={isAnonymous ? Colors.primary : Colors.textSecondary}
            />
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxLabel}>
                {t('ask.ask_anonymously', 'Ask Anonymously')}
              </Text>
              <Text style={styles.checkboxDesc}>
                {t(
                  'ask.hide_your_identity_from_the_do',
                  'Hide your identity from the doctor for sensitive questions.',
                )}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.bottomFixedContainer, { bottom: Spacing.base + insets.bottom }]}>
        <Text style={styles.warningText}>
          <Text style={{ color: Colors.danger, fontSize: FontSize.xs + 3 }}>* </Text>
          {t(
            'ask.doctor_responses_are_for_gener',
            'Doctor responses are for general guidance only. For an accurate diagnosis and treatment, please consult a doctor.',
          )}
        </Text>
        <TouchableOpacity
          style={[
            styles.standardButton,
            (!symptomId || !content.trim() || submitting) && styles.standardButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!symptomId || !content.trim() || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.standardButtonText}>
              {editId
                ? t('ask.update_question', 'Update Question')
                : t('ask.submit_question', 'Submit Question')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
    paddingRight: Spacing.base,
    paddingLeft: 5,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
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
    paddingBottom: Spacing.xxl * 5, // enough space for the fixed bottom text and button
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.5,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  chipSelected: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  chipTextSelected: {
    color: Colors.primary,
  },
  inputContainer: {
    marginTop: Spacing.sm,
  },
  textInputWrapper: {
    height: 120,
    borderWidth: 1.2,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
  },
  textArea: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl, // Prevents text from overlapping absolute counter
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * 1.5,
    color: Colors.textPrimary,
  },
  counterRow: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
  },
  counterText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: FontSize.xs * 1.5,
  },
  counterTextError: {
    color: Colors.danger,
  },
  validationError: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  checkboxDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * 1.5,
    color: Colors.textSecondary,
  },
  bottomFixedContainer: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
  },
  warningText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * 1.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  standardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  standardButtonDisabled: {
    opacity: 0.5,
  },
  standardButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
  },
});
