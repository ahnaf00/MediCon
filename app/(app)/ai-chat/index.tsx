import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { Modal } from '../../../src/components/ui/Modal';
import {
  doctorsService,
  ConsultationHistoryItem,
  Doctor,
} from '../../../src/services/api/doctorsService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type EnrichedConsultation = ConsultationHistoryItem & { doctorInfo?: Doctor | null };

export default function AiChatHistoryScreen() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<EnrichedConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const consultations = await doctorsService.getConsultationHistory();
        const enriched = await Promise.all(
          consultations.map(async (cons) => {
            const doctorInfo = await doctorsService.getDoctorDetails(cons.doctorId);
            return { ...cons, doctorInfo };
          }),
        );
        if (isMounted) setHistory(enriched);
      } catch {
        // Handle error implicitly or log
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void fetchHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleConsultationPress = (consultationId: string, doctorName: string) => {
    router.push({
      pathname: `/(app)/ai-chat/${consultationId}`,
      params: { doctorName },
    });
  };

  const renderCard = ({ item }: { item: EnrichedConsultation }) => {
    const doctor = item.doctorInfo;
    const fallbackName = item.doctorName || 'Doctor';
    const fallbackSpecialty = item.specialty || 'Specialist';

    const displayName = doctor ? doctor.fullName : fallbackName;
    const displaySpecialty = doctor ? doctor.department : fallbackSpecialty;
    const imageSource =
      doctor?.image ||
      item.image ||
      require('../../../src/assets/images/doctors/doctorPlaceholder1.png');

    const historyDate = item.date
      ? new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleConsultationPress(item.id, displayName)}
        activeOpacity={0.8}
        accessibilityLabel={`Consultation with ${displayName}`}
      >
        <Image source={imageSource as any} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.cardName} numberOfLines={2}>
            {displayName}
          </Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{displaySpecialty}</Text>
          </View>
          <Text style={styles.cardDate}>Consulted on {historyDate}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('dashboard.aiChat') || 'AI Chat'}</Text>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setInfoModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="About AI Chat"
        >
          <MaterialCommunityIcons name="help-circle-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, backgroundColor: Colors.background }}
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          renderItem={renderCard}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No past consultations found.</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        title="About AI Chat"
      >
        <Text style={styles.modalContentText}>
          Select one of your previously consulted doctors below to enter a chat. You can ask the AI
          to explain, summarize, clarify, or answer questions about that doctor's consultation,
          advice, recommendations, prescribed medicines, instructions, or anything the doctor
          discussed during the consultation. Note: AI answers are based strictly on your
          consultation records and are not a substitute for professional medical advice.
        </Text>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 5,
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
  helpButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  descContainer: {
    marginBottom: Spacing.xl,
  },
  descText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: FontSize.md * 1.5,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    elevation: 0,
    shadowOpacity: 0,
    alignItems: 'center',
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.tertiary,
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  cardName: {
    fontFamily: FontFamily.bold,
    fontWeight: '600',
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#d7f8f9',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: Spacing.xs - 1,
    marginBottom: Spacing.xs + 1,
  },
  badgeText: {
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  cardDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.5,
  },
  modalContentText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: FontSize.md * 1.5,
  },
});
