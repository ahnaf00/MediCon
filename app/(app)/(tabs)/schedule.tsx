import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { CustomTimePickerModal } from '../../../src/components/medical/CustomTimePickerModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, Layout, BorderRadius, Shadows } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { availabilityService, ApiSchedule, ExceptionsResponse } from '../../../src/services/api/availabilityService';

interface DateItem {
  day: string;
  date: number;
  month: number;
  year: number;
  index: number;
  fullDateStr: string;
}

const getMinutesFromTime = (timeStr: string) => {
  const parts = timeStr.split(' ');
  if (parts.length < 2) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) return hours * 60 + minutes;
    return 0;
  }
  const time = parts[0];
  const period = parts[1];
  let [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours)) hours = 0;
  if (isNaN(minutes)) minutes = 0;
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

export default function ScheduleScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<ApiSchedule[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionsResponse>({});

  const capacity = 4;
  const today = new Date();
  const currentMinutes = today.getHours() * 60 + today.getMinutes();

  const weekDates: DateItem[] = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      index: d.getDay(),
      fullDateStr: dateStr,
    };
  });

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isAddSlotModalVisible, setAddSlotModalVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const selectedDateItem = weekDates[selectedIndex];

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedData, excData] = await Promise.all([
        availabilityService.getSchedule(),
        availabilityService.getExceptions(weekDates[0].fullDateStr, weekDates[4].fullDateStr)
      ]);
      setSchedule(schedData);
      setExceptions(excData);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute available slots
  const generateBaseSlots = () => {
    // The API returns day names ("Monday"), not indexes; match on the name.
    const dayConfig = schedule.find(s => s.day.startsWith(selectedDateItem.day));
    if (!dayConfig || !dayConfig.isWorkingDay) return [];
    
    const slots = [];
    let currentMins = getMinutesFromTime(dayConfig.startTime);
    const endMins = getMinutesFromTime(dayConfig.endTime);

    while (currentMins < endMins) {
      let h = Math.floor(currentMins / 60);
      let m = currentMins % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`);
      currentMins += 30;
    }
    return slots;
  };

  const baseSlotsForDay = generateBaseSlots();
  const dayExceptions = exceptions[selectedDateItem.fullDateStr] || { disabled: [], added: [] };
  
  const rawExtraSlots = dayExceptions.added || [];
  const extraSlots = rawExtraSlots.map(timeStr => {
    if (!timeStr.includes(' ')) {
      const [hStr, mStr] = timeStr.split(':');
      let h = parseInt(hStr, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h.toString().padStart(2, '0')}:${mStr} ${ampm}`;
    }
    return timeStr;
  });
  
  const slotsForDay = Array.from(new Set([...baseSlotsForDay, ...extraSlots]))
    .sort((a, b) => getMinutesFromTime(a) - getMinutesFromTime(b));

  const handleToggleSlot = async (time: string, isCurrentlyEnabled: boolean) => {
    try {
      // Optimistic update
      const newExceptions = { ...exceptions };
      if (!newExceptions[selectedDateItem.fullDateStr]) {
        newExceptions[selectedDateItem.fullDateStr] = { disabled: [], added: [] };
      }
      
      const type = 'disabled';
      const action = isCurrentlyEnabled ? 'add' : 'remove';
      
      if (action === 'add') {
        newExceptions[selectedDateItem.fullDateStr].disabled.push(time);
      } else {
        newExceptions[selectedDateItem.fullDateStr].disabled = newExceptions[selectedDateItem.fullDateStr].disabled.filter(t => t !== time);
      }
      setExceptions(newExceptions);

      await availabilityService.toggleException(selectedDateItem.fullDateStr, time, type, action);
    } catch (err) {
      Alert.alert('Error', 'Failed to update slot');
      loadData(); // revert
    }
  };

  const handleAddCustomSlot = async (time: string) => {
    try {
      // Optimistic
      const newExceptions = { ...exceptions };
      if (!newExceptions[selectedDateItem.fullDateStr]) {
        newExceptions[selectedDateItem.fullDateStr] = { disabled: [], added: [] };
      }
      newExceptions[selectedDateItem.fullDateStr].added.push(time);
      setExceptions(newExceptions);
      
      await availabilityService.toggleException(selectedDateItem.fullDateStr, time, 'added', 'add');
    } catch (err) {
      Alert.alert('Error', 'Failed to add custom slot');
      loadData();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>
            <Text style={styles.titleBold}>Manage </Text>
            <Text style={styles.titleBold}>Schedule</Text>
          </Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.toggleWrapper}>
            <Text style={styles.onlineLabel}>{t('doctordashboard.online', 'Online')}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsOnline(!isOnline)}
              style={styles.toggleContainer}
            >
              <View style={[styles.toggleCircle, isOnline ? styles.toggleOn : styles.toggleOff]} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/settings/')}
            style={styles.profileIcon}
          >
            <MaterialCommunityIcons name="account-outline" size={27.6} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Date Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStripContent}
        >
          {weekDates.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <TouchableOpacity
                key={item.fullDateStr}
                style={[
                  styles.dateCard,
                  isSelected ? styles.dateCardSelected : styles.dateCardUnselected,
                ]}
                onPress={() => setSelectedIndex(index)}
                activeOpacity={0.75}
              >
                <Text style={[styles.dateDayText, isSelected ? styles.dateTextActive : styles.dateTextDefault]}>
                  {item.day}
                </Text>
                <Text style={[styles.dateNumberText, isSelected ? styles.dateTextActive : styles.dateTextDefault]}>
                  {item.date}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Slots Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Slots for {selectedDateItem.day}, {selectedDateItem.date}
            </Text>
            <TouchableOpacity style={styles.addSlotBtn} onPress={() => setAddSlotModalVisible(true)}>
              <MaterialCommunityIcons name="plus" size={18} color={Colors.primary} />
              <Text style={styles.addSlotBtnText}>Add Slot</Text>
            </TouchableOpacity>
          </View>

          {slotsForDay.length === 0 ? (
            <View style={styles.emptySection}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={28}
                color={Colors.textTertiary}
              />
              <Text style={styles.emptyText}>You have no slots scheduled for this day.</Text>
            </View>
          ) : (
            <View style={styles.queueContainer}>
              {slotsForDay.map((timeStr, index) => {
                const isExceptionDisabled = dayExceptions.disabled?.includes(timeStr);
                const isToggleOn = !isExceptionDisabled;
                
                let isPastSlot = false;
                if (selectedIndex === 0) {
                   const slotMins = getMinutesFromTime(timeStr);
                   if (currentMinutes >= slotMins) isPastSlot = true;
                }
                
                return (
                  <View key={index} style={[styles.queueCard, isPastSlot && styles.queueCardDisabled]}>
                    <View style={styles.queueTimeBox}>
                      <MaterialCommunityIcons 
                        name="clock-outline" 
                        size={16} 
                        color={isPastSlot ? Colors.textTertiary : Colors.primary} 
                      />
                      <Text style={[styles.queueTimeText, isPastSlot && styles.textDisabled]}>
                        {timeStr}
                      </Text>
                    </View>
                    
                    <View style={styles.queueCenter}>
                      {isPastSlot ? (
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>Passed</Text>
                        </View>
                      ) : (
                        <View style={styles.statusBadgeActive}>
                          <Text style={styles.statusBadgeTextActive}>Available</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.queueRight}>
                      <Switch
                        value={isToggleOn}
                        onValueChange={() => handleToggleSlot(timeStr, isToggleOn)}
                        disabled={isPastSlot}
                        trackColor={{ false: Colors.tertiary, true: Colors.primary }}
                        thumbColor={Colors.surface}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <CustomTimePickerModal
        visible={isAddSlotModalVisible}
        title="Add Custom Slot"
        initialTimeStr="09:00 AM"
        onCancel={() => setAddSlotModalVisible(false)}
        onSave={(time) => {
          handleAddCustomSlot(time);
          setAddSlotModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  headerLeft: { flex: 1 },
  title: { fontSize: FontSize.xxl, fontFamily: FontFamily.semiBold, color: Colors.textPrimary },
  titleBold: { color: Colors.primary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  toggleWrapper: { alignItems: 'center' },
  onlineLabel: { fontSize: FontSize.xs, fontFamily: FontFamily.medium, color: Colors.textSecondary, marginBottom: 4 },
  toggleContainer: {
    width: 46,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.tertiary,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.surface },
  toggleOn: { transform: [{ translateX: 22 }], backgroundColor: Colors.primary },
  toggleOff: { transform: [{ translateX: 0 }] },
  scrollContent: { paddingBottom: 100 },
  dateStripContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
  dateCard: {
    width: 62,
    height: 80,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  dateCardSelected: { backgroundColor: Colors.primary, ...Shadows.sm },
  dateCardUnselected: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.tertiary },
  dateDayText: { fontSize: FontSize.sm, fontFamily: FontFamily.medium, marginBottom: Spacing.xs },
  dateNumberText: { fontSize: FontSize.lg, fontFamily: FontFamily.bold },
  dateTextActive: { color: Colors.surface },
  dateTextDefault: { color: Colors.textSecondary },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: FontFamily.semiBold, color: Colors.textPrimary },
  addSlotBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.tertiaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4 },
  addSlotBtnText: { color: Colors.primary, fontSize: FontSize.sm, fontFamily: FontFamily.medium },
  emptySection: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.tertiary, borderStyle: 'dashed' },
  emptyText: { marginTop: Spacing.sm, fontSize: FontSize.md, color: Colors.textSecondary, fontFamily: FontFamily.medium },
  queueContainer: { gap: Spacing.sm },
  queueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    justifyContent: 'space-between',
  },
  queueCardDisabled: { backgroundColor: Colors.background, opacity: 0.7 },
  queueTimeBox: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 90 },
  queueTimeText: { fontSize: FontSize.md, fontFamily: FontFamily.semiBold, color: Colors.textPrimary },
  textDisabled: { color: Colors.textTertiary },
  queueCenter: { flex: 1, alignItems: 'center' },
  statusBadge: { backgroundColor: Colors.tertiary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeActive: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: FontFamily.medium },
  statusBadgeTextActive: { fontSize: FontSize.xs, color: '#2E7D32', fontFamily: FontFamily.medium },
  queueRight: { minWidth: 50, alignItems: 'flex-end' }
});
