import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize, Shadows } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Question } from '../../types/medical.types';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';

interface QuestionCardProps {
  question: Question;
  onPress: (question: Question) => void;
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
}

const getTimeAgo = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours}h ago`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}m ago`;
};

export const QuestionCard = ({
  question,
  onPress,
  onEdit,
  onDelete,
}: QuestionCardProps): React.JSX.Element => {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.userId) || 'patient-1';
  const isOwner = question.patientId === userId;
  const answerCount = question.answers.length;
  const timeAgo = getTimeAgo(question.createdAt);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ x: 0, y: 0 });

  const handleMenuPress = (event: any) => {
    // Measure relative to screen for the Modal overlay
    const { pageX, pageY } = event.nativeEvent;
    setMenuCoords({ x: pageX - 120, y: pageY + 20 });
    setMenuVisible(true);
  };

  const handleEdit = () => {
    setMenuVisible(false);
    onEdit(question);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    onDelete(question);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
        onPress={() => onPress(question)}
      >
        {/* Row 1: Time, Badge, Menu */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.timestamp}>{timeAgo}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{question.department}</Text>
            </View>
            {question.isAnonymous && (
              <View style={[styles.badge, { backgroundColor: Colors.textTertiary + '20' }]}>
                <Text style={[styles.badgeText, { color: Colors.textSecondary }]}>Anonymous</Text>
              </View>
            )}
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

        {/* Row 2: Question Content */}
        <Text style={styles.content}>{question.content}</Text>

        {/* Row 3: Response count */}
        {answerCount > 0 && (
          <View style={styles.footer}>
            <Text style={styles.responseCount}>
              {answerCount} {answerCount === 1 ? 'doctor response' : 'doctors responses'}
            </Text>
          </View>
        )}
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <View style={[styles.menuContainer, { top: menuCoords.y, left: menuCoords.x }]}>
              <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={20}
                  color={Colors.textPrimary}
                />
                <Text style={styles.menuItemText}>{t('common.edit', 'Edit')}</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.danger} />
                <Text style={[styles.menuItemText, { color: Colors.danger }]}>
                  {t('common.delete', 'Delete')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    // No shadows as requested!
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timestamp: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  badge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  content: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.5,
  },
  footer: {
    marginTop: Spacing.sm,
  },
  responseCount: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
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
});
