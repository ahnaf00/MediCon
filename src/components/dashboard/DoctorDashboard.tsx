import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize } from '@theme';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { dashboardService, DoctorDashboardStats } from '../../services/api/dashboardService';
import { authService, User } from '../../services/api/authService';

export const DoctorDashboard = (): React.JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const setRole = useAuthStore((s) => s.setRole);

  const [loading, setLoading] = useState(true);
  const [doctorUser, setDoctorUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      try {
        setLoading(true);
        // Fetch user profile and dashboard stats simultaneously
        const [userResponse, statsResponse] = await Promise.all([
          authService.me(),
          dashboardService.getDoctorStats(),
        ]);
        
        if (isMounted) {
          setDoctorUser(userResponse);
          setStats(statsResponse);
        }
      } catch (error) {
        console.error('Failed to load doctor dashboard', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadDashboard();
    return () => { isMounted = false; };
  }, []);

  const fullName = doctorUser?.name || 'Loading...';
  const profileImage = doctorUser?.avatarUrl 
    ? { uri: doctorUser.avatarUrl } 
    : require('../../assets/images/doctors/doctorPlaceholder1.png');

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
          <Image source={profileImage as any} style={styles.profileImage} resizeMode="cover" />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{fullName}</Text>
            <View style={styles.profileSpacing} />
            <Text style={styles.profileBmdc}>
              {doctorUser?.doctorProfile?.qualification || 'No Qualifications Listed'}
            </Text>
            
            <TouchableOpacity style={styles.switchRoleButton} onPress={handleSwitchRole}>
              <Text style={styles.switchRoleText}>
                {t('doctordashboard.switch_to_patient', 'Switch to your Patient Profile')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </View>
        ) : (
          /* Key Details Section */
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
                  <Text style={styles.detailValue}>${stats?.fees.consultation_fee || 0}</Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>
                    {t('doctordashboard.follow_up', 'Follow-up (within 7 days)')}
                  </Text>
                  <Text style={styles.detailValue}>${stats?.fees.follow_up_fee || 0}</Text>
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
                  <Text style={styles.detailValue}>{stats?.time_metrics.avg_all_time_mins || 0} mins</Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>
                    {t('doctordashboard.avg_this_month', 'Avg (This month)')}
                  </Text>
                  <Text style={styles.detailValue}>{stats?.time_metrics.avg_this_month_mins || 0} mins</Text>
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
                  <Text style={styles.detailValue}>${stats?.earnings.today || 0}</Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>
                    {t('doctordashboard.this_month', 'This Month')}
                  </Text>
                  <Text style={styles.detailValue}>${stats?.earnings.this_month || 0}</Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>
                    {t('doctordashboard.previous_month', 'Previous Month')}
                  </Text>
                  <Text style={styles.detailValue}>${stats?.earnings.previous_month || 0}</Text>
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

            {/* QUICK ACTIONS */}
            <View style={{ marginTop: Spacing.xl }}>
              <View style={styles.detailCardHeader}>
                <View style={styles.iconSquare}>
                  <MaterialCommunityIcons name="lightning-bolt" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.detailCardTitle}>Quick Actions</Text>
              </View>
              
              <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
                <TouchableOpacity 
                  style={[styles.primaryButton, { flex: 1, paddingVertical: Spacing.md }]} 
                  onPress={() => {
                    // Navigate to patients tab and tell them to pick a patient
                    router.push('/(app)/(tabs)/patients');
                  }}
                >
                  <MaterialCommunityIcons name="prescription" size={20} color={Colors.surface} />
                  <Text style={[styles.primaryButtonText, { marginTop: Spacing.xs }]}>Write Prescription</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.outlineButton, { flex: 1, paddingVertical: Spacing.md }]} 
                  onPress={() => router.push('/(app)/(tabs)/schedule')}
                >
                  <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.primary} />
                  <Text style={[styles.outlineButtonText, { marginTop: Spacing.xs }]}>My Schedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  headerLeft: {},
  greeting: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  onlineLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  toggleContainer: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
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
    padding: Spacing.xs,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  profileInfo: {
    marginLeft: Spacing.lg,
    flex: 1,
  },
  profileName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileBmdc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  profileSpacing: {
    height: 8,
  },
  switchRoleButton: {
    marginTop: Spacing.sm,
  },
  switchRoleText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  detailsContainer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  detailBlocksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  detailBlock: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  detailLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  linkButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  linkText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
});
