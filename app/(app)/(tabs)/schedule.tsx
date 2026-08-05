// 1. IMPORTS
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Alert 
} from 'react-native';
import { CustomTimePickerModal } from '../../../src/components/medical/CustomTimePickerModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, Layout, BorderRadius } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useScheduleStore } from '../../../src/store/scheduleStore';

// 2. TYPES
interface DateItem {
  day: string;
  date: number;
  month: number;
  year: number;
  index: number; // day of week 0-6
  fullDateStr: string; // YYYY-MM-DD
}

// Helper to convert time like "09:00 AM" to minutes from midnight
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

// 3. COMPONENT
export default function ScheduleScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  const store = useScheduleStore();
  const regularSchedule = store.regularSchedule;
  const scheduleExceptions = store.scheduleExceptions;
  const bookings = store.bookings;

  const capacity = 4;
  const today = new Date();
  const currentMinutes = today.getHours() * 60 + today.getMinutes();

  // Display current day + next 4 days (Total 5)
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

  const baseSlotsForDay = regularSchedule[selectedDateItem.index] || [];
  const rawExtraSlots = store.customSlots[selectedDateItem.fullDateStr] || [];
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

  const exceptionsForDate = scheduleExceptions[selectedDateItem.fullDateStr] || {};
  const bookingsForDate = bookings[selectedDateItem.fullDateStr] || {};

  const handleToggleSlot = (time: string) => {
    store.toggleException(selectedDateItem.fullDateStr, time);
  };

  const handleAddSlot = () => {
    setAddSlotModalVisible(true);
  };

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
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.dateDayText,
                    isSelected ? styles.dateTextActive : styles.dateTextDefault,
                  ]}
                >
                  {item.day}
                </Text>
                <Text
                  style={[
                    styles.dateNumberText,
                    isSelected ? styles.dateTextActive : styles.dateTextDefault,
                  ]}
                >
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
              {selectedIndex === 0 && ' (Today)'}
              {selectedIndex === 1 && ' (Tomorrow)'}
            </Text>
            <TouchableOpacity style={styles.addSlotBtn} onPress={handleAddSlot}>
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
              <Text style={styles.emptyText}>
                You have no slots scheduled for this day.
              </Text>
            </View>
          ) : (
            <View style={styles.queueContainer}>
              {slotsForDay.map((timeStr, index) => {
                const isExceptionDisabled = exceptionsForDate[timeStr] === false;
                const currentBookings = bookingsForDate[timeStr] || 0;
                const isFull = currentBookings >= capacity;
                
                let isPastSlot = false;
                if (selectedIndex === 0) {
                  // Rule 1: Capacity Limit
                  if (isFull) {
                    isPastSlot = true;
                  } else {
                    const avgConsultationMinutes = 18; // Mock doctor average
                    let bufferTime = 0;
                    if (avgConsultationMinutes >= 10 && avgConsultationMinutes <= 14) bufferTime = 5;
                    else if (avgConsultationMinutes >= 15 && avgConsultationMinutes <= 20) bufferTime = 10;
                    else if (avgConsultationMinutes > 20) bufferTime = 14;

                    const nextSlotStr = slotsForDay[index + 1];
                    const nextSlotMinutes = nextSlotStr 
                      ? getMinutesFromTime(nextSlotStr) 
                      : getMinutesFromTime(timeStr) + 60; // Default 1 hour if last slot

                    // Rule 2 & 3: Next Slot Transition and Dynamic Buffer Time
                    if (currentMinutes >= nextSlotMinutes) {
                      isPastSlot = true;
                    } else if (currentMinutes >= nextSlotMinutes - bufferTime) {
                      isPastSlot = true;
                    }
                  }
                }
                
                // Active visually if not an exception AND not passed. 
                const isToggleOn = !isExceptionDisabled;
                
                return (
                  <View
                    key={timeStr}
                    style={[
                      styles.slotCard, 
                      isExceptionDisabled && !isPastSlot && styles.slotCardException,
                      isPastSlot && styles.slotCardPast
                    ]}
                  >
                    <View style={styles.slotInfo}>
                      <View style={[
                        styles.iconCircle, 
                        isPastSlot && styles.iconCirclePast,
                        isExceptionDisabled && !isPastSlot && styles.iconCircleException
                      ]}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={18}
                          color={
                            isPastSlot ? Colors.textTertiary : 
                            isExceptionDisabled ? Colors.textSecondary : 
                            Colors.primary
                          }
                        />
                      </View>
                      <Text
                        style={[
                          styles.slotTimeText,
                          isPastSlot && styles.slotTextPast,
                          isExceptionDisabled && !isPastSlot && styles.slotTextException,
                        ]}
                      >
                        {timeStr}
                      </Text>
                    </View>

                    <View style={styles.slotControls}>
                      <View style={styles.bookingStatus}>
                        <View style={[styles.bookingBadge, isPastSlot && styles.bookingBadgePast]}>
                          <Text style={[styles.bookingCountText, isPastSlot && styles.bookingCountTextPast]}>
                            {currentBookings}/{capacity} booked
                          </Text>
                        </View>
                        {isFull && <Text style={styles.fullBadge}>FULL</Text>}
                      </View>

                      <Switch
                        value={isToggleOn}
                        onValueChange={() => handleToggleSlot(timeStr)}
                        disabled={isPastSlot}
                        trackColor={{ false: Colors.tertiary, true: Colors.primary }}
                        thumbColor={Colors.surface}
                        ios_backgroundColor={Colors.tertiary}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ADD SLOT MODAL */}
      <CustomTimePickerModal
        visible={isAddSlotModalVisible}
        initialTimeStr="09:00"
        title="Add Another Slot"
        subtitle={`For ${selectedDateItem.day}, ${selectedDateItem.date}`}
        onSave={(newTimeStr) => {
          const [hStr, mStr] = newTimeStr.split(':');
          let h = parseInt(hStr, 10);
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          const formattedTime = `${h.toString().padStart(2, '0')}:${mStr} ${ampm}`;
          
          if (slotsForDay.includes(formattedTime)) {
            Alert.alert(
              'Duplicate Slot',
              'This time slot has already been added. Please choose a different time slot.'
            );
            return;
          }
          
          store.addCustomSlot(selectedDateItem.fullDateStr, formattedTime);
          setAddSlotModalVisible(false);
        }}
        onCancel={() => setAddSlotModalVisible(false)}
      />
    </SafeAreaView>
  );
}

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
  title: {
    fontSize: FontSize.xxl,
    color: Colors.primary,
  },
  titleBold: {
    fontFamily: FontFamily.extraBold,
    fontWeight: '900',
  },
  headerLeft: {
    flex: 1,
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
    paddingBottom: Layout.tabBarHeight + Spacing.base,
  },
  dateStripContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dateCard: {
    width: 65,
    height: 80,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  dateCardSelected: {
    backgroundColor: Colors.primary,
  },
  dateCardUnselected: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  dateDayText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
  },
  dateNumberText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
  },
  dateTextActive: {
    color: Colors.surface,
  },
  dateTextDefault: {
    color: Colors.textSecondary,
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  addSlotBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  queueContainer: {
    gap: Spacing.sm,
  },
  slotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  slotCardException: {
    backgroundColor: '#FAFAFA',
  },
  slotCardPast: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  slotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleException: {
    backgroundColor: Colors.textSecondary + '20',
  },
  iconCirclePast: {
    backgroundColor: Colors.textTertiary + '20',
  },
  slotTimeText: {
    fontFamily: FontFamily.regular,
    fontWeight: 'normal',
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  slotTextException: {
    color: Colors.textSecondary,
  },
  slotTextPast: {
    color: Colors.textTertiary,
  },
  slotControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bookingStatus: {
    alignItems: 'flex-end',
    gap: 2,
  },
  bookingBadge: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  bookingBadgePast: {
    backgroundColor: Colors.textTertiary + '15',
  },
  bookingCountText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  bookingCountTextPast: {
    color: Colors.textSecondary,
  },
  fullBadge: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.surface,
    backgroundColor: Colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  emptySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
    flex: 1,
  },
});
