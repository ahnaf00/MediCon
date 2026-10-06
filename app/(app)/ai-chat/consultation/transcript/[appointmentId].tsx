import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontFamily, FontSize } from '../../../../../src/theme';
import { TranscriptView } from '../../../../../src/components/medical/TranscriptView';
import { useConsultation } from '../../../../../src/services/api/consultationsService';

/**
 * The patient reads their video consultation's call transcript. Reachable from the
 * consultation chat once the doctor has saved a summary from it; the API refuses it
 * before then.
 */
export default function PatientTranscriptScreen(): React.JSX.Element {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { t } = useTranslation();
  const consultation = useConsultation(appointmentId);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('transcript.back', 'Go back')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('transcript.title', 'Call transcript')}</Text>
      </View>
      {appointmentId ? (
        <TranscriptView
          appointmentId={appointmentId}
          doctorName={consultation.data?.doctor.name}
          patientName={t('transcript.you', 'You')}
        />
      ) : null}
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
});
