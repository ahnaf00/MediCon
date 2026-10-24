import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../../src/theme';
import {
  useDeletePrescriptionUpload,
  usePrescriptionUpload,
} from '../../../../src/services/api/prescriptionUploadsService';
import { fromLocalDateString } from '../../../../src/utils/localDate';
import { apiErrorMessage } from '../../../../src/utils/errors';

/** One uploaded paper prescription: its original pages, details and a delete action. */
export default function PrescriptionUploadScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const uploadId = Number(id);
  const { data: upload, isLoading, isError, refetch } = usePrescriptionUpload(uploadId);
  const remove = useDeletePrescriptionUpload();

  /** Signed URLs expire after 15 minutes, so fetch fresh ones before opening. */
  const openPage = async (index: number) => {
    const { data } = await refetch();
    const url = data?.pages?.[index]?.fileUrl;
    if (!url) {
      Alert.alert('The page could not be opened.');
      return;
    }
    Linking.openURL(url).catch(() => Alert.alert('The page could not be opened.'));
  };

  const confirmDelete = () => {
    Alert.alert('Delete this prescription?', 'The uploaded pages will be removed for good.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(uploadId, {
            onSuccess: () => router.back(),
            onError: (err) => Alert.alert('Not deleted', apiErrorMessage(err, 'Please try again.')),
          }),
      },
    ]);
  };

  const header = (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Uploaded Prescription</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {header}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !upload) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {header}
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={44} color={Colors.danger} />
          <Text style={styles.errorText}>This prescription could not be loaded.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const issued = upload.issuedOn ? fromLocalDateString(upload.issuedOn) : null;
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {header}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{upload.title || 'Paper prescription'}</Text>
          <DetailRow icon="stethoscope" text={upload.doctorName || 'Doctor not given'} />
          <DetailRow
            icon="calendar-outline"
            text={issued ? `Dated ${formatDate(issued)}` : 'No date given'}
          />
          <DetailRow icon="upload" text={`Uploaded ${formatDate(new Date(upload.createdAt))}`} />
          {upload.notes ? <Text style={styles.notes}>{upload.notes}</Text> : null}
        </View>

        <Text style={styles.sectionLabel}>Original pages ({upload.pageCount}) · tap to open</Text>
        {upload.pages.map((page, index) => (
          <TouchableOpacity
            key={page.id}
            style={styles.page}
            onPress={() => openPage(index)}
            accessibilityRole="button"
            accessibilityLabel={`Open page ${index + 1}`}
          >
            {page.isPdf ? (
              <View style={styles.pdfPage}>
                <MaterialCommunityIcons name="file-pdf-box" size={40} color={Colors.danger} />
                <Text style={styles.pdfText}>PDF · page {index + 1}</Text>
              </View>
            ) : (
              <Image source={{ uri: page.fileUrl }} style={styles.pageImage} resizeMode="contain" />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={confirmDelete}
          disabled={remove.isPending}
          accessibilityRole="button"
          accessibilityLabel="Delete this prescription"
        >
          {remove.isPending ? (
            <ActivityIndicator size="small" color={Colors.danger} />
          ) : (
            <>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.danger} />
              <Text style={styles.deleteText}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  text: string;
}): React.JSX.Element {
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons name={icon} size={16} color={Colors.textSecondary} />
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  errorText: { fontFamily: FontFamily.medium, fontSize: FontSize.md, color: Colors.textSecondary },
  content: { padding: Spacing.md, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.lg, color: Colors.textPrimary },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  notes: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  page: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  pageImage: { width: '100%', aspectRatio: 3 / 4 },
  pdfPage: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl, gap: 6 },
  pdfText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  deleteText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.danger },
});
