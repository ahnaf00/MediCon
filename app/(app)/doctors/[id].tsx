// 1. IMPORTS
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize, Layout } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doctorsService, Doctor, DoctorExperienceEntry } from '@services/api/doctorsService';

// 2. TYPES

type ProfileTab = 'info' | 'services' | 'experiences';

// 3. COMPONENT

export default function DoctorDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');

  useEffect(() => {
    const fetchDoctor = async (): Promise<void> => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await doctorsService.getDoctorDetails(id);
        setDoctor(data);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  const handleShare = async (): Promise<void> => {
    if (!doctor) return;
    try {
      await Share.share({
        title: `Dr. ${doctor.fullName} — MediCon`,
        message: `Check out Dr. ${doctor.fullName} (${doctor.department}) on MediCon.\nBMDC Reg: ${doctor.bmdcNumber}\nConsultation Fee: ৳${doctor.consultationFee}`,
      });
    } catch {
      Alert.alert('Unable to share', 'Something went wrong. Please try again.');
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  // ── Error / not-found state ───────────────────────────────────────────────
  if (!doctor) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={Colors.danger} />
          <Text style={styles.errorText}>Doctor not found</Text>
        </View>
      </View>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const degreesLabel = doctor.degrees.join(', ');
  const bottomInset = insets.bottom;

  const imageSource =
    doctor.image ?? require('../../../src/assets/images/doctors/doctorPlaceholder1.png');

  return (
    <View style={styles.container}>
      {/* ── App Bar Wrapper ──────────────────────────────────────────────────────── */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Profile</Text>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share doctor profile"
          >
            <MaterialCommunityIcons
              name="share-variant-outline"
              size={22}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Profile Card — fixed (does not scroll) ───────────────────── */}
      <View style={styles.profileCard}>
        {/* Left column — photo */}
        <View style={styles.profileAvatarCol}>
          <View style={styles.profileImageWrap}>
            <Image
              source={imageSource}
              style={styles.profileImage}
              resizeMode="cover"
              accessibilityLabel={`Photo of ${doctor.fullName}`}
            />
            {doctor.isOnline && <View style={styles.onlineDot} />}
          </View>
        </View>

        {/* Right column — info rows */}
        <View style={styles.profileInfoCol}>
          {/* Row 1 — Name */}
          <Text style={styles.doctorName} numberOfLines={2}>
            {doctor.fullName}
          </Text>

          {/* Row 2 — Degrees */}
          <Text style={styles.degreesText} numberOfLines={2}>
            {degreesLabel}
          </Text>

          {/* Row 3 — Specialist badge (no icon, bold text) */}
          <View style={styles.specialistBadge}>
            <Text style={styles.specialistBadgeText}>{doctor.department}</Text>
          </View>

          {/* Row 4 — Fee section */}
          <View style={styles.feeRow}>
            {/* Consultation fee */}
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Consultation</Text>
              <Text style={styles.feeValue}>৳{doctor.consultationFee}</Text>
            </View>

            <View style={styles.feeDivider} />

            {/* Follow-up fee */}
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Follow-up</Text>
              <Text style={styles.feeValue}>৳{doctor.followUpFee}</Text>
              <Text style={styles.feeSubLabel}>Within {doctor.followUpDays} Days</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Tab Bar — fixed (does not scroll) ────────────────────────── */}
      <View style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          {(
            [
              { key: 'info', label: 'Info' },
              { key: 'services', label: 'Services' },
              { key: 'experiences', label: 'Experiences' },
            ] as { key: ProfileTab; label: string }[]
          ).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, activeTab === key && styles.tabActive]}
              onPress={() => setActiveTab(key)}
              activeOpacity={1}
              accessibilityRole="tab"
              accessibilityLabel={`${label} tab`}
              accessibilityState={{ selected: activeTab === key }}
            >
              <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Tab Content — scrollable ──────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Spacing.base + bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabContent}>
          {activeTab === 'info' && <InfoTab doctor={doctor} />}
          {activeTab === 'services' && <ServicesTab doctor={doctor} />}
          {activeTab === 'experiences' && <ExperiencesTab doctor={doctor} />}
        </View>
      </ScrollView>

      {/* ── Fixed Bottom Action Bar ──────────────────────────────────────── */}
      <View style={[styles.bottomBarContainer, { paddingBottom: Spacing.base + bottomInset }]}>
        {/* Left — Book Appointment (white bg, primary border) */}
        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => router.push(`/(app)/doctors/booking?id=${doctor.id}`)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Book an appointment with this doctor"
        >
          <MaterialCommunityIcons name="calendar-check-outline" size={18} color={Colors.primary} />
          <Text style={styles.btnOutlineText}>Book Appointment</Text>
        </TouchableOpacity>

        {/* Right — See Doctor Now (primary, white text) */}
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() =>
            router.push(`/(app)/doctors/booking/digest?doctorId=${doctor.id}&type=video`)
          }
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Start an online video consultation with this doctor"
        >
          <MaterialCommunityIcons name="video-outline" size={18} color={Colors.surface} />
          <Text style={styles.btnPrimaryText}>See Doctor Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface TabProps {
  doctor: Doctor;
}

/** Info Tab — hospital info card + About section */
function InfoTab({ doctor }: TabProps): React.JSX.Element {
  return (
    <>
      {/* Information card — all rows share the same icon + label/value layout */}
      <View style={styles.infoCard}>
        {/* Row 1 — Working Hospital */}
        <InfoRow icon="hospital-building" label="Working Hospital" value={doctor.workingHospital} />

        <View style={styles.infoCardDivider} />

        {/* Row 2 — Experience (narrow) + BMDC Reg. Number (wide) */}
        <View style={styles.infoDoubleRow}>
          <InfoRow
            icon="briefcase-clock-outline"
            label="Experience"
            value={doctor.experience}
            flexStyle={styles.infoRowFlexNarrow}
          />
          <View style={styles.infoVerticalDivider} />
          <InfoRow
            icon="card-account-details-outline"
            label="BMDC Reg. Number"
            value={doctor.bmdcNumber}
            flexStyle={styles.infoRowFlexWide}
          />
        </View>

        <View style={styles.infoCardDivider} />

        {/* Row 3 — App Patients (narrow) + Avg. Consultation Time (wide) */}
        <View style={styles.infoDoubleRow}>
          <InfoRow
            icon="account-group-outline"
            label="Total Patients"
            value={doctor.totalPatients.toLocaleString()}
            flexStyle={styles.infoRowFlexNarrow}
          />
          <View style={styles.infoVerticalDivider} />
          <InfoRow
            icon="timer-outline"
            label="Avg. Consultation Time"
            value={`${doctor.avgConsultationMinutes} min`}
            flexStyle={styles.infoRowFlexWide}
            iconSize={20}
          />
        </View>
      </View>

      {/* About section */}
      <View style={styles.aboutSection}>
        <Text style={styles.sectionHeading}>About the Doctor</Text>
        <Text style={styles.aboutText}>{doctor.about}</Text>
      </View>
    </>
  );
}

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  /** Pass a specific flex style (e.g. infoRowFlexNarrow / infoRowFlexWide). Omit for full-width rows. */
  flexStyle?: object;
  /** Optional icon size override. Defaults to 18. */
  iconSize?: number;
}

function InfoRow({ icon, label, value, flexStyle, iconSize }: InfoRowProps): React.JSX.Element {
  return (
    <View style={[styles.infoRow, flexStyle]}>
      <View style={styles.infoIconWrap}>
        <MaterialCommunityIcons name={icon as never} size={iconSize ?? 18} color={Colors.primary} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

/** Services Tab */
function ServicesTab({ doctor }: TabProps): React.JSX.Element {
  return (
    <View style={styles.servicesContainer}>
      <Text style={styles.sectionHeading}>Services Offered</Text>
      <Text style={styles.servicesSubtitle}>
        This doctor provides consultations for the following services.
      </Text>
      <View style={styles.servicesList}>
        {doctor.services.map((service) => (
          <View key={service} style={styles.serviceRow}>
            <View style={styles.serviceIconWrap}>
              <MaterialCommunityIcons name="check-circle" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.serviceText}>{service}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Experiences Tab */
function ExperiencesTab({ doctor }: TabProps): React.JSX.Element {
  return (
    <View style={styles.experienceContainer}>
      <Text style={styles.sectionHeading}>Professional Experience</Text>
      <Text style={styles.servicesSubtitle}>
        Career history and institutional affiliations of this doctor.
      </Text>
      {doctor.experienceList.map((entry: DoctorExperienceEntry) => (
        <ExperienceCard key={entry.id} entry={entry} />
      ))}
    </View>
  );
}

interface ExperienceCardProps {
  entry: DoctorExperienceEntry;
}

function ExperienceCard({ entry }: ExperienceCardProps): React.JSX.Element {
  return (
    <View style={styles.expCard}>
      {/* Hospital name — always full width */}
      <Text style={styles.expHospital} numberOfLines={2}>
        {entry.hospitalName}
      </Text>

      {/* Period row */}
      <View style={styles.expPeriodRow}>
        <Text style={styles.expPeriod}>{entry.period}</Text>
      </View>

      {/* Designation & Department — two labeled columns with left accent line */}
      <View style={styles.expDetails}>
        <View style={styles.expAccentLine} />
        <View style={styles.expDetailsColumns}>
          <View style={styles.expDetailCol}>
            <Text style={styles.expDetailColLabel}>Designation</Text>
            <Text style={styles.expDesignation}>{entry.designation}</Text>
          </View>
          <View style={styles.expDetailColDivider} />
          <View style={styles.expDetailCol}>
            <Text style={styles.expDetailColLabel}>Department</Text>
            <Text style={styles.expDepartment}>{entry.department}</Text>
          </View>
        </View>
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

  // ── App Bar ──────────────────────────────────────────────────────────────
  headerWrapper: {
    backgroundColor: Colors.surface,
  },
  // paddingLeft: 5 mirrors back-button's visual left offset.
  // paddingRight: 5 mirrors that exactly so share icon sits symmetrically.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 5,
    paddingLeft: 5,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  backButton: {
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
  shareButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Placeholder so the title stays centred on loading/error screens */
  headerRight: {
    width: 44,
  },

  // ── Utility ──────────────────────────────────────────────────────────────
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.base,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: FontSize.md * 1.5,
  },

  // ── Profile Card ─────────────────────────────────────────────────────────
  profileCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    paddingTop: 0,
    gap: Spacing.base,
    // No shadow — removed per spec
  },
  profileAvatarCol: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  profileImageWrap: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.tertiary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  profileInfoCol: {
    flex: 1,
    gap: Spacing.xs,
  },
  doctorName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: FontSize.md * 1.35,
  },
  degreesText: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  specialistBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.tertiaryLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginTop: 2,
  },
  specialistBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },

  // Fee section
  feeRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  feeItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: 2,
  },
  feeDivider: {
    width: 1,
    backgroundColor: Colors.tertiary,
  },
  feeLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  feeValue: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  feeSubLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // ── Tab Bar — Prescriptions-style ────────────────────────────────────────
  tabBarWrap: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
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

  // ── Tab Content wrapper ───────────────────────────────────────────────────
  // paddingHorizontal is now on scrollContent; tabContent just wraps children.
  tabContent: {},

  // ── Info Tab ─────────────────────────────────────────────────────────────
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.sm,
    paddingLeft: Spacing.sm + 5,
    gap: Spacing.sm,
  },
  // Column 1 (icon-heavy, short label) is narrower; column 2 (long label) is wider
  infoRowFlex: {
    flex: 1,
  },
  infoRowFlexNarrow: {
    flex: 0.43,
  },
  infoRowFlexWide: {
    flex: 0.57,
  },
  infoDoubleRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  infoVerticalDivider: {
    width: 1,
    backgroundColor: Colors.tertiary,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.tertiaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: FontSize.sm * 1.4,
  },
  infoCardDivider: {
    height: 1,
    backgroundColor: Colors.tertiary,
  },

  // About section (Info tab)
  aboutSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    padding: Spacing.base,
    marginTop: Spacing.base,
  },
  sectionHeading: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  aboutText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: FontSize.base * 1.6,
  },

  // ── Services Tab ─────────────────────────────────────────────────────────
  servicesContainer: {},
  servicesSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
    marginBottom: Spacing.md,
  },
  servicesList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    overflow: 'hidden',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  serviceIconWrap: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.tertiaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  serviceText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },

  // ── Experiences Tab ───────────────────────────────────────────────────────
  experienceContainer: {},
  expCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  expHospital: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.4,
    marginBottom: 4,
  },
  expPeriodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  expPeriod: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  expDetails: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.md,
  },
  /** Left accent line — same visual weight as the column divider */
  expAccentLine: {
    width: 1,
    backgroundColor: Colors.tertiary,
  },
  expDetailsColumns: {
    flex: 1,
    flexDirection: 'row',
    gap: 0,
  },
  expDetailCol: {
    flex: 1,
    gap: 2,
  },
  expDetailColDivider: {
    width: 1,
    backgroundColor: Colors.tertiary,
    marginHorizontal: Spacing.md,
  },
  expDetailColLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  expDesignation: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  expDepartment: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // ── Fixed Bottom Action Bar ───────────────────────────────────────────────
  bottomBarContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base, // top margin = left/right margin
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: Layout.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  btnPrimaryText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.surface,
  },
  btnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: Layout.buttonHeight,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  btnOutlineText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
});
