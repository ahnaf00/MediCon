// 1. IMPORTS
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius, Layout, Shadows } from '@theme';
import { useAuthStore } from '../../../src/store/authStore';
import { qnaService } from '../../../src/services/api/qnaService';
import { doctorsService } from '../../../src/services/api/doctorsService';
import { Question } from '../../../src/types/medical.types';
import { createAppError, AppError } from '../../../src/utils/errors';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { useTranslation } from 'react-i18next';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.78;

// Helper to mock patient names from IDs
const getPatientName = (patientId: string) => {
  const map: Record<string, string> = {
    'patient-1': 'Ayesha Rahman',
    'patient-2': 'Kamal Hasan',
    'patient-3': 'Jamal Bhuiyan',
    'patient-4': 'Nusrat Jahan',
    'patient-5': 'Rahim Uddin',
  };
  return map[patientId] || 'Patient ' + patientId.replace('patient-', '');
};

const getTimeAgo = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours}h ago`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}m ago`;
};

// ── INLINE DOCTOR QUESTION CARD ───────────────────────────────────────────────
interface DoctorQuestionCardProps {
  question: Question;
  isAnswered: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const DoctorQuestionCard = ({
  question,
  isAnswered,
  onReply,
  onEdit,
  onDelete,
}: DoctorQuestionCardProps) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ x: 0, y: 0 });

  const patientName = question.isAnonymous ? 'Anonymous' : getPatientName(question.patientId);

  const handleMenuPress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setMenuCoords({ x: pageX - 120, y: pageY + 20 });
    setMenuVisible(true);
  };

  const handleAction = (action: () => void) => {
    setMenuVisible(false);
    action();
  };

  return (
    <>
      <View style={styles.card}>
        {/* Row 1: Patient Name & Time + Menu */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardPatientName}>{patientName}</Text>
            <Text style={styles.cardTimestamp}>{getTimeAgo(question.createdAt)}</Text>
          </View>
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleMenuPress}
          >
            <MaterialCommunityIcons
              name="dots-horizontal"
              size={20}
              color={Colors.textSecondary}
              style={{ opacity: 0.5 }}
            />
          </TouchableOpacity>
        </View>

        {/* Row 2: Question with vertical line and Answer */}
        <View style={styles.cardQuestionContainer}>
          <View style={styles.questionRow}>
            <View style={styles.verticalLine} />
            <View style={styles.questionTextWrapper}>
              <Text style={styles.cardQuestionText}>{question.content}</Text>
            </View>
          </View>
          {isAnswered && question.answers && question.answers.length > 0 && (
            <View style={styles.answerContainer}>
              <Text style={styles.answerLabel}>Your Answer:</Text>
              <Text style={styles.answerText}>{question.answers[0].content}</Text>
            </View>
          )}
        </View>

        {/* Row 3: Reply Button (if unanswered) or Answered Status */}
        <View style={styles.cardFooter}>
          {!isAnswered ? (
            <TouchableOpacity style={styles.replyButton} onPress={onReply}>
              <MaterialCommunityIcons name="reply-outline" size={16} color={Colors.primary} />
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.answeredChip}>
              <MaterialCommunityIcons name="check-circle" size={14} color={Colors.success} />
              <Text style={styles.answeredChipText}>Answered</Text>
            </View>
          )}
        </View>
      </View>

      {/* Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <View style={[styles.menuContainer, { top: menuCoords.y, left: menuCoords.x }]}>
              {isAnswered && (
                <>
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleAction(onEdit)}>
                    <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.textPrimary} />
                    <Text style={styles.menuItemText}>Edit</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                </>
              )}
              <TouchableOpacity style={styles.menuItem} onPress={() => handleAction(onDelete)}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.danger} />
                <Text style={[styles.menuItemText, { color: Colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

type ActiveTab = 'unanswered' | 'answered';

// 3. COMPONENT
export default function QnaInboxScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.userId) || 'doctor-1';

  const [activeTab, setActiveTab] = useState<ActiveTab>('unanswered');
  const [isOnline, setIsOnline] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  // ── Reply sheet state ────────────────────────────────────────────────────────
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [questionExpanded, setQuestionExpanded] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ── Data loading ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let doc = await doctorsService.getDoctorDetails(userId);
      if (!doc) doc = await doctorsService.getDoctorDetails('doc-1');

      if (doc) {
        const data = await qnaService.getDoctorInbox(doc.department);
        const filteredData = data.map((q) => ({
          ...q,
          answers: q.answers.filter(
            (a) => a.doctorId === userId || a.doctorId === doc!.fullName,
          ),
        }));
        setQuestions(filteredData);
      } else {
        throw new Error('Doctor not found');
      }
    } catch (err) {
      setError(createAppError('NETWORK_ERROR', String(err)));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleDelete = async (question: Question) => {
    try {
      await qnaService.deleteQuestion(question.id, userId);
      setQuestions((prev) => prev.filter((q) => q.id !== question.id));
    } catch (err) {
      alert('Failed to delete question');
    }
  };

  const openReplySheet = (question: Question) => {
    setIsEditing(false);
    setEditingAnswerId(null);
    setActiveQuestion(question);
    setReplyText('');
    setQuestionExpanded(false);
    
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const openEditSheet = (question: Question) => {
    const answer = question.answers[0]; // Assume first answer is the doctor's
    if (!answer) return;

    setIsEditing(true);
    setEditingAnswerId(answer.id);
    setActiveQuestion(question);
    setReplyText(answer.content);
    setQuestionExpanded(false);
    
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeReplySheet = () => {
    Keyboard.dismiss();
    Animated.timing(sheetAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setActiveQuestion(null);
      setReplyText('');
      setQuestionExpanded(false);
      setIsEditing(false);
      setEditingAnswerId(null);
    });
  };

  const handleExpandQuestion = () => {
    setQuestionExpanded(true);
    Keyboard.dismiss();
  };

  const handleInputFocus = () => {
    setQuestionExpanded(false);
  };

  const handleSubmitReply = async () => {
    if (!activeQuestion || !replyText.trim()) return;
    try {
      setSubmitting(true);
      if (isEditing && editingAnswerId) {
        let doc = await doctorsService.getDoctorDetails(userId);
        if (!doc) doc = await doctorsService.getDoctorDetails('doc-1');
        const updatedAnswer = await qnaService.updateAnswer(
          activeQuestion.id,
          editingAnswerId,
          doc ? doc.fullName : userId, // qnaService answers use doctor name often in mock data
          replyText.trim()
        );
        setQuestions((prev) =>
          prev.map((q) => {
            if (q.id === activeQuestion.id) {
              return {
                ...q,
                answers: q.answers.map(a => a.id === updatedAnswer.id ? updatedAnswer : a)
              };
            }
            return q;
          }),
        );
      } else {
        const newAnswer = await qnaService.answerQuestion(
          activeQuestion.id,
          userId,
          replyText.trim(),
        );
        setQuestions((prev) =>
          prev.map((q) => {
            if (q.id === activeQuestion.id) {
              return { ...q, answers: [...q.answers, newAnswer] };
            }
            return q;
          }),
        );
      }
      closeReplySheet();
    } catch (err) {
      const e = createAppError('NETWORK_ERROR', String(err));
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_MAX_HEIGHT, 0],
  });

  const currentList = questions.filter((q) =>
    activeTab === 'unanswered' ? q.answers.length === 0 : q.answers.length > 0
  );

  // ── Render Helpers ──────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>
          <Text style={styles.titleBold}>Q&A </Text>
          <Text style={styles.titleBold}>Inbox</Text>
        </Text>
      </View>
      <View style={styles.headerActions}>
        <View style={styles.toggleWrapper}>
          <Text style={styles.onlineLabel}>{t('doctordashboard.online', 'Online')}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsOnline(!isOnline)}
            style={styles.toggleContainer}
            accessibilityRole="switch"
            accessibilityState={{ checked: isOnline }}
            accessibilityLabel="Online Status Toggle"
          >
            <View style={[styles.toggleCircle, isOnline ? styles.toggleOn : styles.toggleOff]} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(app)/settings/')}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          style={styles.profileIcon}
          accessibilityLabel="Settings"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="account-outline" size={27.6} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'unanswered' && styles.tabActive]}
        onPress={() => setActiveTab('unanswered')}
        activeOpacity={1}
        accessibilityRole="tab"
      >
        <Text style={[styles.tabText, activeTab === 'unanswered' && styles.tabTextActive]}>
          Patient Questions
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'answered' && styles.tabActive]}
        onPress={() => setActiveTab('answered')}
        activeOpacity={1}
        accessibilityRole="tab"
      >
        <Text style={[styles.tabText, activeTab === 'answered' && styles.tabTextActive]}>
          Answered
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      {renderTabs()}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <ErrorState message={error.message} onRetry={loadData} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Layout.tabBarHeight + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {currentList.length === 0 ? (
            <View style={styles.emptySection}>
              <MaterialCommunityIcons name="inbox-outline" size={28} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>
                {activeTab === 'unanswered'
                  ? 'No new patient questions.'
                  : 'You have not answered any questions yet.'}
              </Text>
            </View>
          ) : (
            currentList.map((item, index) => (
              <View key={item.id} style={index < currentList.length - 1 ? styles.questionGap : undefined}>
                <DoctorQuestionCard
                  question={item}
                  isAnswered={activeTab === 'answered'}
                  onReply={() => openReplySheet(item)}
                  onEdit={() => openEditSheet(item)}
                  onDelete={() => handleDelete(item)}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ── Reply Bottom Sheet Modal ── */}
      <Modal
        visible={activeQuestion !== null}
        transparent
        animationType="none"
        onRequestClose={closeReplySheet}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.modalWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={closeReplySheet}>
            <View style={styles.scrim} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.sheet,
              {
                maxHeight: SHEET_MAX_HEIGHT,
                paddingBottom: isKeyboardVisible ? Spacing.base : (Spacing.base + insets.bottom),
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
            <View style={styles.sheetHandle} />

            <ScrollView
              style={styles.sheetScrollArea}
              contentContainerStyle={styles.sheetScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {activeQuestion && (
                <View style={styles.sheetQuestion}>
                  <Text style={styles.sheetPatientNameTop}>
                    {activeQuestion.isAnonymous ? 'Anonymous' : getPatientName(activeQuestion.patientId)}
                  </Text>
                  
                  <Text
                    style={styles.sheetQuestionText}
                    numberOfLines={questionExpanded ? undefined : 3}
                  >
                    {activeQuestion.content}
                  </Text>
                  
                  {!questionExpanded && activeQuestion.content.length > 100 && (
                    <TouchableOpacity onPress={handleExpandQuestion} style={styles.expandToggle}>
                      <Text style={styles.expandToggleText}>Read full question ▼</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <Text style={styles.sheetLabel}>Your Answer</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="Write a clear, helpful answer..."
                placeholderTextColor={Colors.textTertiary}
                value={replyText}
                onChangeText={setReplyText}
                onFocus={handleInputFocus}
                multiline
                autoFocus
                editable={!submitting}
                scrollEnabled
                accessibilityLabel="Answer input"
              />
            </ScrollView>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={closeReplySheet}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!replyText.trim() || submitting) && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmitReply}
                disabled={!replyText.trim() || submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <>
                    <MaterialCommunityIcons name={isEditing ? "check" : "send"} size={16} color={Colors.surface} />
                    <Text style={styles.submitBtnText}>{isEditing ? 'Save Edits' : 'Submit Answer'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    color: Colors.primary,
  },
  titleBold: {
    fontFamily: FontFamily.extraBold,
    fontWeight: '900',
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    gap: Spacing.sm,
  },
  onlineLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  toggleContainer: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  toggleCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  toggleOn: {
    backgroundColor: Colors.success,
    alignSelf: 'flex-end',
  },
  toggleOff: {
    backgroundColor: Colors.textTertiary,
    alignSelf: 'flex-start',
  },
  profileIcon: {
    marginLeft: Spacing.xs,
  },
  departmentRow: {
    fontSize: FontSize.xxl,
    color: Colors.primary,
  },
  
  // ── Tab Bar ─────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
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

  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    flexGrow: 1,
  },
  questionGap: {
    marginBottom: Spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    flexShrink: 1,
  },

  // ── Doctor Question Card ──────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'column',
    gap: 2,
  },
  cardPatientName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  cardTimestamp: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  cardQuestionContainer: {
    flexDirection: 'column',
    marginVertical: Spacing.xs,
  },
  questionRow: {
    flexDirection: 'row',
  },
  verticalLine: {
    width: 1.5,
    backgroundColor: Colors.tertiary,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  questionTextWrapper: {
    flex: 1,
  },
  answerContainer: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  answerLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  answerText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: FontSize.sm * 1.5,
  },
  cardQuestionText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.5,
  },
  cardFooter: {
    marginTop: Spacing.sm,
    alignItems: 'flex-end',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  replyButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  answeredChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.success + '15',
  },
  answeredChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.success,
  },
  
  // ── Menu Modal ─────────────────────────────────────────────────────────────
  menuOverlay: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    width: 140,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    paddingVertical: Spacing.xs,
    ...Shadows.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  menuItemText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.tertiary,
    marginHorizontal: Spacing.xs,
  },

  // ── Reply Bottom Sheet ───────────────────────────────────────────────────
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.sm,
    ...Shadows.md,
    flexDirection: 'column',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.textTertiary + '50',
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetScrollArea: {
    flexGrow: 0, 
  },
  sheetScrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  sheetQuestion: {
    backgroundColor: Colors.primary + '0D', 
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  sheetPatientNameTop: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sheetQuestionText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: FontSize.sm * 1.6,
  },
  expandToggle: {
    marginTop: Spacing.xs,
  },
  expandToggleText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  sheetLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  sheetInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.5,
    height: 140,
    textAlignVertical: 'top',
  },
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  cancelBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },
  submitBtn: {
    flex: 2,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
  },
});
