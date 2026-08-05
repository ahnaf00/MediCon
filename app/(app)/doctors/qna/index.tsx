import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius, Shadows } from '@theme';
import { useAuthStore } from '../../../../src/store/authStore';
import { qnaService } from '../../../../src/services/api/qnaService';
import { QuestionCard } from '../../../../src/components/medical/QuestionCard';
import { Question, QuestionAnswer } from '../../../../src/types/medical.types';
import { createAppError, AppError } from '../../../../src/utils/errors';
import { ErrorState } from '../../../../src/components/ui/ErrorState';
import { DraggableBottomSheet } from '../../../../src/components/ui/DraggableBottomSheet';
import { useTranslation } from 'react-i18next';

const getTimeAgo = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours}h ago`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}m ago`;
};

export default function QnaIndexScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.userId) || 'patient-1';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const { openQuestionId } = useLocalSearchParams<{ openQuestionId?: string }>();

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await qnaService.getPatientQuestions(userId);
      setQuestions(data);
    } catch (err) {
      setError(createAppError('NETWORK_ERROR', String(err)));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Handle auto-opening specific question from notification
  React.useEffect(() => {
    if (openQuestionId && questions.length > 0) {
      const targetQ = questions.find((q) => q.id === openQuestionId);
      if (targetQ) {
        setSelectedQuestion(targetQ);
        setSheetVisible(true);
        // Clear the param so it doesn't re-trigger on subsequent tab visits
        router.setParams({ openQuestionId: '' });
      }
    }
  }, [openQuestionId, questions, router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleCardPress = (question: Question) => {
    setSelectedQuestion(question);
    setIsQuestionExpanded(false); // Reset expansion state for new questions
    setShowReadMore(false); // Reset read more visibility
    setSheetVisible(true);
  };

  const handleEdit = (question: Question) => {
    router.push(`/(app)/doctors/qna/ask?editId=${question.id}`);
  };

  const handleDelete = async (question: Question) => {
    try {
      await qnaService.deleteQuestion(question.id, userId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <Text style={styles.headerTitleBold}>{t('qna.ask', 'Ask ')}</Text>
          <Text style={styles.headerTitleBold}>{t('qna.doctor', 'Doctor')}</Text>
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/settings/')}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          accessibilityLabel={t('dashboard.settings') || 'Settings'}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="account-outline" size={27.6} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading && !error ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <ErrorState message={error.message} onRetry={loadData} />
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={questions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="forum-outline"
                  size={64}
                  color={Colors.textTertiary}
                />
                <Text style={styles.emptyText}>
                  {t('qna.you_havent_asked_any_questions') ||
                    "You haven't asked any questions yet."}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <QuestionCard
                question={item}
                onPress={handleCardPress}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          />
        </View>
      )}

      {/* Doctor Responses Bottom Sheet */}
      {selectedQuestion && (
        <DraggableBottomSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          title="Doctor Responses"
          height={Dimensions.get('window').height * 0.7}
        >
          <View style={styles.sheetQuestionHeader}>
            <Text style={styles.sheetTime}>{getTimeAgo(selectedQuestion.createdAt)}</Text>

            {/* Hidden Text for precise line measurement */}
            <Text
              style={[styles.sheetQuestionText, { position: 'absolute', opacity: 0, zIndex: -1 }]}
              onTextLayout={(e) => {
                setShowReadMore(e.nativeEvent.lines.length > 2);
              }}
            >
              {selectedQuestion.content}
            </Text>

            <Text
              style={styles.sheetQuestionText}
              numberOfLines={isQuestionExpanded ? undefined : 2}
            >
              {selectedQuestion.content}
            </Text>
            {showReadMore && (
              <TouchableOpacity
                onPress={() => setIsQuestionExpanded(!isQuestionExpanded)}
                style={{ marginTop: Spacing.xs }}
              >
                <Text style={styles.readMoreText}>
                  {isQuestionExpanded ? 'Read less' : 'Read more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {selectedQuestion.answers.length > 0 ? (
            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.responsesList}>
                {selectedQuestion.answers.map((answer) => (
                  <View key={answer.id} style={styles.responseCard}>
                    <TouchableOpacity
                      style={styles.doctorHeader}
                      onPress={() => {
                        setSheetVisible(false);
                        router.push(`/(app)/doctors/${answer.doctorId}`);
                      }}
                    >
                      <Image
                        source={require('../../../../src/assets/images/doctors/doctorPlaceholder1.png')} // fallback
                        style={styles.doctorImage}
                      />
                      <View style={styles.doctorInfo}>
                        <Text style={styles.doctorName}>Dr. {answer.doctorId}</Text>
                        <View style={styles.doctorSubInfo}>
                          <View style={styles.doctorBadge}>
                            <Text style={styles.doctorBadgeText}>
                              {selectedQuestion.department}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.doctorTime}>{getTimeAgo(answer.createdAt)}</Text>
                    </TouchableOpacity>
                    <Text style={styles.answerContent}>{answer.content}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={[styles.emptySheetContainer, { paddingBottom: insets.bottom * 2 }]}>
              <MaterialCommunityIcons
                name="information-outline"
                size={48}
                color={Colors.textPrimary}
                style={{ marginBottom: Spacing.sm, opacity: 0.5 }}
              />
              <Text style={styles.alertText}>
                {t('qna.no_doctors_response_yet', 'No doctors response yet.')}
              </Text>
            </View>
          )}
        </DraggableBottomSheet>
      )}

      {/* Floating Action Button */}
      {!sheetVisible && (
        <View style={[styles.speedDialContainer, { bottom: Spacing.base }]}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/(app)/doctors/qna/ask')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Ask a new question"
          >
            <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.primary} />
            <Text style={styles.fabText}>{t('qna.ask_question', 'Ask Question')}</Text>
          </TouchableOpacity>
        </View>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    color: Colors.primary,
  },
  headerTitleBold: {
    fontFamily: FontFamily.extraBold,
    fontWeight: '900',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl * 2 + 80, // Space for FAB
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.5,
  },

  // Sheet Styles
  sheetQuestionHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  sheetTime: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  sheetQuestionText: {
    fontFamily: FontFamily.semiBold,
    fontWeight: '600',
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.5,
  },
  readMoreText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  sheetScroll: {
    maxHeight: 500, // to let it scroll within the modal
  },
  responsesList: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  responseCard: {
    backgroundColor: Colors.surface, // changed from background to surface for cards
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  doctorImage: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm, // Square-ish
    backgroundColor: Colors.tertiary,
    marginRight: Spacing.md,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  doctorSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  doctorBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  doctorBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  doctorTime: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  answerContent: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: FontSize.base * 1.5,
  },

  // Alert Styles
  emptySheetContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  alertText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  // FAB Styles
  speedDialContainer: {
    position: 'absolute',
    right: Spacing.base,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  fab: {
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.base,
    paddingRight: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    height: 56,
    justifyContent: 'center',
  },
  fabText: {
    marginLeft: Spacing.xs,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },
});
