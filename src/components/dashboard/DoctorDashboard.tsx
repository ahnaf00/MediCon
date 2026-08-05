// 1. IMPORTS
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize, Layout } from '@theme';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 2. TYPES
/* No external props — this is a self-contained dashboard. */

// 3. COMPONENT
export const DoctorDashboard = (): React.JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const setRole = useAuthStore((s) => s.setRole);

  const fullName = 'Dr. Smith';
  const bmdcRegistration = 'BMDC Reg. Number: 123456';
  const profileImage = require('../../assets/images/doctors/doctorPlaceholder1.png');

  const handleSwitchRole = () => {
    setRole('patient');
    router.replace('/(app)/(tabs)/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>MediCon</Text>
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image source={profileImage} style={styles.profileImage} resizeMode="cover" />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{fullName}</Text>
            <View style={styles.profileSpacing} />
            <Text style={styles.profileBmdc}>{bmdcRegistration}</Text>
            
            <TouchableOpacity style={styles.switchRoleButton} onPress={handleSwitchRole}>
              <Text style={styles.switchRoleText}>
                {t('doctordashboard.switch_to_patient', 'Switch to your Patient Profile')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Key Details Section */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailCard}>
            {/* Consultation Fee */}
            <View style={styles.detailCardHeader}>
              <View style={styles.iconSquare}>
                <MaterialCommunityIcons name="cash" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.detailCardTitle}>
                {t('doctordashboard.consultation_fee', 'Consultation Fee')}
              </Text>
            </View>
            <View style={styles.detailBlocksRow}>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>
                  {t('doctordashboard.new_patient', 'New Patient')}
                </Text>
                <Text style={styles.detailValue}>$50</Text>
              </View>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>
                  {t('doctordashboard.follow_up', 'Follow-up (within 7 days)')}
                </Text>
                <Text style={styles.detailValue}>$30</Text>
              </View>
            </View>

            <View style={{ height: Spacing.xl }} />

            {/* Consultation Time */}
            <View style={styles.detailCardHeader}>
              <View style={styles.iconSquare}>
                <MaterialCommunityIcons name="clock-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.detailCardTitle}>
                {t('doctordashboard.consultation_time', 'Consultation Time')}
              </Text>
            </View>
            <View style={styles.detailBlocksRow}>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>
                  {t('doctordashboard.avg_all_time', 'Avg (All-time)')}
                </Text>
                <Text style={styles.detailValue}>15 mins</Text>
              </View>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>
                  {t('doctordashboard.avg_this_month', 'Avg (This month)')}
                </Text>
                <Text style={styles.detailValue}>12 mins</Text>
              </View>
            </View>

            <View style={{ height: Spacing.xl }} />

            {/* Payments Overview */}
            <View style={styles.detailCardHeader}>
              <View style={styles.iconSquare}>
                <MaterialCommunityIcons name="credit-card-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.detailCardTitle}>
                {t('doctordashboard.payments_overview', 'Payments Overview')}
              </Text>
            </View>
            <View style={styles.detailBlocksRow}>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>{t('doctordashboard.today', 'Today')}</Text>
                <Text style={styles.detailValue}>$150</Text>
              </View>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>
                  {t('doctordashboard.this_month', 'This Month')}
                </Text>
                <Text style={styles.detailValue}>$3,200</Text>
              </View>
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>
                  {t('doctordashboard.previous_month', 'Previous Month')}
                </Text>
                <Text style={styles.detailValue}>$2,900</Text>
              </View>
              <View style={[styles.detailBlock, { borderStyle: 'dashed' }]}>
                <TouchableOpacity activeOpacity={0.7} style={styles.linkButton}>
                  <Text style={styles.linkText}>
                    {t('doctordashboard.view_all_earnings', 'View All Earnings')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontFamily: FontFamily.extraBold,
    fontWeight: '900',
    fontSize: FontSize.xxl,
    color: Colors.primary,
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
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Layout.tabBarHeight + Spacing.sm,
  },
  
  // --- Profile Card ---
  profileCard: {
    flexDirection: 'row',
    alignItems: 'stretch', // Changed from center to stretch
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  profileImage: {
    width: 95, // Slightly wider to look balanced
    height: '100%', // Match parent's stretched height
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.tertiary,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  profileSpacing: {
    height: Spacing.xs, // Reduced gap to make it tighter
  },
  profileBmdc: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  switchRoleButton: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  switchRoleText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },

  // --- Detail Cards ---
  detailsContainer: {
    gap: Spacing.lg,
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  detailCardHeader: {
    flexDirection: 'row', // icon and title in single row
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm, // Space between icon and title
  },
  iconSquare: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary + '15', // Light primary tint
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCardTitle: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  detailBlocksRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  detailBlock: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '45%', // Ensure strict 2x2 grid for 4 items, identical to 1x2 for 2 items
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  detailValue: {
    fontFamily: FontFamily.regular,
    fontWeight: 'normal', // Changed to normal per user request
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  linkButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
    textAlign: 'center',
  },
});
