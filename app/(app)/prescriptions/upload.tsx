import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import type { UploadRecordPage } from '../../../src/services/api/reportsService';
import { useUploadPrescription } from '../../../src/services/api/prescriptionUploadsService';
import {
  pickReportImages,
  pickReportPdfs,
  takeReportPhoto,
} from '../../../src/services/files/reportPicker';
import { MAX_REPORT_PAGES } from '../../../src/store/reportDraftStore';
import { toLocalDateString } from '../../../src/utils/localDate';
import { apiErrorMessage } from '../../../src/utils/errors';

/**
 * Upload a paper prescription (task 1.7): photograph or pick its pages, add
 * optional details, and save. The pages are stored as they are; nothing is
 * read from them.
 */
export default function UploadPrescriptionScreen(): React.JSX.Element {
  const router = useRouter();
  const upload = useUploadPrescription();

  // Staged pages are ephemeral UI state, so plain component state is enough.
  const [pages, setPages] = useState<UploadRecordPage[]>([]);
  const [title, setTitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [issuedOn, setIssuedOn] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const room = MAX_REPORT_PAGES - pages.length;

  const addPages = async (pick: (limit: number) => Promise<UploadRecordPage[]>) => {
    if (room <= 0) {
      Alert.alert('Page limit', `You can add up to ${MAX_REPORT_PAGES} pages.`);
      return;
    }
    try {
      const picked = await pick(room);
      if (picked.length > 0)
        setPages((current) => [...current, ...picked].slice(0, MAX_REPORT_PAGES));
    } catch {
      Alert.alert('Error', 'Could not add the pages. Please try again.');
    }
  };

  const save = () => {
    setError(null);
    upload.mutate(
      {
        pages,
        title,
        doctorName,
        issuedOn: issuedOn ? toLocalDateString(issuedOn) : undefined,
      },
      {
        onSuccess: (saved) => router.replace(`/(app)/prescriptions/uploads/${saved.id}`),
        onError: (err) =>
          setError(
            apiErrorMessage(err, 'The prescription could not be uploaded. Please try again.'),
          ),
      },
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Prescription</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            Add a photo or PDF of a paper prescription. It is saved exactly as you upload it, and
            only you can see it.
          </Text>

          <View style={styles.sourceRow}>
            <SourceButton icon="camera" label="Camera" onPress={() => addPages(takeReportPhoto)} />
            <SourceButton icon="image" label="Gallery" onPress={() => addPages(pickReportImages)} />
            <SourceButton
              icon="file-pdf-box"
              label="PDF"
              onPress={() => addPages(pickReportPdfs)}
            />
          </View>

          {pages.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>
                Pages ({pages.length}/{MAX_REPORT_PAGES}) · tap to remove
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pagesRow}
              >
                {pages.map((page, index) => (
                  <TouchableOpacity
                    key={`${page.fileUri}-${index}`}
                    style={styles.pageThumb}
                    onPress={() => setPages((current) => current.filter((_, i) => i !== index))}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove page ${index + 1}`}
                  >
                    {page.mimeType === 'application/pdf' ? (
                      <View style={styles.pagePdf}>
                        <MaterialCommunityIcons
                          name="file-pdf-box"
                          size={30}
                          color={Colors.danger}
                        />
                        <Text style={styles.pdfName} numberOfLines={2}>
                          {page.fileName}
                        </Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: page.fileUri }}
                        style={styles.pageImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.pageBadge}>
                      <Text style={styles.pageBadgeText}>{index + 1}</Text>
                    </View>
                    <View style={styles.removeBadge}>
                      <MaterialCommunityIcons name="close" size={12} color={Colors.surface} />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={styles.sectionLabel}>Details (optional)</Text>
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Fever, March check-up"
            maxLength={150}
          />
          <Input
            label="Doctor's name"
            value={doctorName}
            onChangeText={setDoctorName}
            placeholder="As written on the prescription"
            maxLength={150}
          />
          <TouchableOpacity
            style={styles.dateField}
            onPress={() => setShowDatePicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Date on the prescription"
          >
            <MaterialCommunityIcons
              name="calendar-outline"
              size={20}
              color={Colors.textSecondary}
            />
            <Text style={[styles.dateText, !issuedOn && styles.datePlaceholder]}>
              {issuedOn
                ? issuedOn.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Date on the prescription'}
            </Text>
            {issuedOn && (
              <TouchableOpacity
                onPress={() => setIssuedOn(null)}
                accessibilityRole="button"
                accessibilityLabel="Clear date"
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={issuedOn ?? new Date()}
              mode="date"
              maximumDate={new Date()}
              onChange={(_event, date) => {
                setShowDatePicker(false);
                if (date) setIssuedOn(date);
              }}
            />
          )}

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={pages.length === 0 ? 'Add at least one page' : 'Save prescription'}
            onPress={save}
            loading={upload.isPending}
            disabled={pages.length === 0}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SourceButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <TouchableOpacity
      style={styles.sourceButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Add pages from ${label}`}
    >
      <MaterialCommunityIcons name={icon} size={26} color={Colors.primary} />
      <Text style={styles.sourceLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
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
  content: { padding: Spacing.md, gap: Spacing.md },
  intro: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  sourceRow: { flexDirection: 'row', gap: Spacing.sm },
  sourceButton: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  sourceLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  pagesRow: { gap: Spacing.sm },
  pageThumb: {
    width: 96,
    height: 128,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  pageImage: { width: '100%', height: '100%' },
  pagePdf: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 6, gap: 4 },
  pdfName: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  pageBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    minWidth: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
  },
  pageBadgeText: { color: Colors.surface, fontSize: 11, fontFamily: FontFamily.semiBold },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  dateText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  datePlaceholder: { color: Colors.textTertiary },
  error: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.danger },
  footer: { padding: Spacing.md, backgroundColor: Colors.surface },
});
