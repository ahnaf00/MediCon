// Prescription letterhead, rendered from GET /prescriptions/{id}/document.
// This view is also what "Download as Image" captures, so it must stay
// self-contained (white background, no screen chrome). Keep the layout in step
// with Medicon-api/resources/views/prescriptions/document.blade.php (the PDF).
import React, { type Ref } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { FontFamily, FontSize } from '../../theme';
import type { PrescriptionDocumentData } from '../../services/api/prescriptionsService';

interface PrescriptionDocumentProps {
  doc: PrescriptionDocumentData;
  ref?: Ref<View>;
}

const DASH = '—';

/** "2026-09-17" → "Sep 17, 2026" without going through UTC. */
const formatCalendarDate = (ymd: string): string => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function PrescriptionDocument({ doc, ref }: PrescriptionDocumentProps) {
  const { doctor, patient } = doc;

  return (
    <View ref={ref} collapsable={false} style={styles.page}>
      {/* Letterhead */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.doctorName}>{doctor.name ?? 'Doctor'}</Text>
          {doctor.qualification ? <Text style={styles.text}>{doctor.qualification}</Text> : null}
          {doctor.specialty ? <Text style={styles.muted}>{doctor.specialty}</Text> : null}
        </View>
        <View style={styles.headerRight}>
          {doctor.hospitalName ? (
            <Text style={[styles.bold, styles.right]}>{doctor.hospitalName}</Text>
          ) : null}
          <Text style={[styles.text, styles.right]}>
            BMDC Reg. No - {doctor.bmdcRegistrationNo ?? DASH}
          </Text>
          <Text style={[styles.muted, styles.right]}>Date: {doc.issuedDate}</Text>
        </View>
      </View>
      <View style={styles.rule} />

      {/* Patient row */}
      <View style={styles.patientRow}>
        <PatientField label="Name" value={patient.name ?? DASH} flex={1.6} />
        <PatientField label="Gender" value={patient.gender ? capitalize(patient.gender) : DASH} />
        <PatientField label="Age" value={patient.age ?? DASH} flex={1.2} />
        <PatientField
          label="Weight"
          value={patient.weightKg !== null ? `${patient.weightKg} kg` : DASH}
        />
      </View>

      {/* Tests | Rx */}
      <View style={styles.body}>
        <View style={styles.testsCol}>
          <Text style={styles.sectionTitle}>Diagnostic Tests:</Text>
          {doc.tests.length > 0 ? (
            doc.tests.map((test, i) => (
              <Text key={`${test.name}-${i}`} style={styles.listItem}>
                {'• '}
                {test.name}
                {test.instructions ? (
                  <Text style={styles.muted}> ({test.instructions})</Text>
                ) : null}
              </Text>
            ))
          ) : (
            <Text style={styles.muted}>None</Text>
          )}
        </View>

        <View style={styles.rxCol}>
          <Text style={styles.rxSymbol}>Rx</Text>
          {doc.medicines.map((med, i) => (
            <View key={med.id} style={styles.med}>
              <Text style={styles.bold}>
                {i + 1}. {med.name} {med.dosage}
              </Text>
              <Text style={styles.text}>
                {[
                  med.pattern ?? 'As directed',
                  `${med.durationDays} ${med.durationDays === 1 ? 'day' : 'days'}`,
                  med.instructions,
                ]
                  .filter(Boolean)
                  .join('  ·  ')}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Follow-up and advice */}
      {doc.followUpDate ? (
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Follow-up: </Text>
          {formatCalendarDate(doc.followUpDate)}
        </Text>
      ) : null}
      {doc.advice ? (
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Advice: </Text>
          {doc.advice}
        </Text>
      ) : null}

      {/* Signature */}
      <View style={styles.signature}>
        <View style={styles.signatureLine} />
        <Text style={styles.bold}>{doctor.name ?? 'Doctor'}</Text>
        <Text style={styles.muted}>Signature</Text>
      </View>
    </View>
  );
}

function PatientField({ label, value, flex = 1 }: { label: string; value: string; flex?: number }) {
  return (
    <View style={{ flex }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.bold}>{value}</Text>
    </View>
  );
}

const TEAL = '#0f766e';
const INK = '#1f2937';
const GREY = '#6b7280';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: { flex: 1 },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  right: { textAlign: 'right' },
  doctorName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: TEAL,
    marginBottom: 2,
  },
  rule: {
    height: 1.5,
    backgroundColor: TEAL,
    marginTop: 10,
    marginBottom: 12,
  },
  patientRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 8,
    marginBottom: 14,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: GREY,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  body: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  testsCol: {
    width: '36%',
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  rxCol: {
    flex: 1,
    paddingLeft: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: INK,
    marginBottom: 6,
  },
  listItem: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: INK,
    marginBottom: 4,
  },
  rxSymbol: {
    fontFamily: FontFamily.bold,
    fontSize: 26,
    color: INK,
    marginBottom: 6,
  },
  med: { marginBottom: 8 },
  paragraph: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: INK,
    lineHeight: FontSize.sm * 1.5,
    marginBottom: 8,
  },
  signature: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    width: 160,
    marginTop: 36,
  },
  signatureLine: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: INK,
    marginBottom: 4,
  },
  text: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: INK,
  },
  muted: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: GREY,
  },
  bold: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: INK,
  },
});
