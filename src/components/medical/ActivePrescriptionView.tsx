import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomTimePickerModal } from './CustomTimePickerModal';
import { Prescription, PrescriptionMedicine } from '../../types/medical.types';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize } from '../../theme';
import { prescriptionsService } from '../../services/api/prescriptionsService';
import { getMealTiming } from '../../utils/prescriptionFormatters';
import { useAlarmStore } from '../../store/alarmStore';

export interface ActivePrescriptionViewProps {
  prescription: Prescription;
}

type Period = 'morning' | 'noon' | 'night';

interface PeriodGroup {
  id: Period;
  label: string;
  time?: string;
  medicines: PrescriptionMedicine[];
  isCompleted: boolean;
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

interface EditSchedulesModalProps {
  visible: boolean;
  periods: PeriodGroup[];
  onClose: () => void;
  onSave: (morning: string, noon: string, night: string) => Promise<void>;
}

const EditSchedulesModal = ({ visible, periods, onClose, onSave }: EditSchedulesModalProps) => {
  const [morning, setMorning] = useState(periods.find((p) => p.id === 'morning')?.time || '');
  const [noon, setNoon] = useState(periods.find((p) => p.id === 'noon')?.time || '');
  const [night, setNight] = useState(periods.find((p) => p.id === 'night')?.time || '');
  const [saving, setSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'morning' | 'noon' | 'night' | null>(null);

  const renderTimeValue = (timeStr: string) => {
    if (!timeStr) return 'Not set';
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(morning, noon, night);
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to save times.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Change Schedules</Text>

          <Text style={styles.inputLabel}>Morning Time</Text>
          <TouchableOpacity
            style={styles.timeSelector}
            onPress={() => setPickerTarget('morning')}
            activeOpacity={1}
          >
            <Text style={styles.timeSelectorText}>{renderTimeValue(morning)}</Text>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Noon Time</Text>
          <TouchableOpacity
            style={styles.timeSelector}
            onPress={() => setPickerTarget('noon')}
            activeOpacity={1}
          >
            <Text style={styles.timeSelectorText}>{renderTimeValue(noon)}</Text>
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Night Time</Text>
          <TouchableOpacity
            style={styles.timeSelector}
            onPress={() => setPickerTarget('night')}
            activeOpacity={1}
          >
            <Text style={styles.timeSelectorText}>{renderTimeValue(night)}</Text>
          </TouchableOpacity>

          <CustomTimePickerModal
            visible={!!pickerTarget}
            initialTimeStr={
              pickerTarget === 'morning' ? morning : pickerTarget === 'noon' ? noon : night || ''
            }
            title={
              pickerTarget
                ? `Set ${pickerTarget.charAt(0).toUpperCase() + pickerTarget.slice(1)} Time`
                : ''
            }
            onSave={(newTimeStr) => {
              if (pickerTarget === 'morning') setMorning(newTimeStr);
              else if (pickerTarget === 'noon') setNoon(newTimeStr);
              else if (pickerTarget === 'night') setNight(newTimeStr);
              setPickerTarget(null);
            }}
            onCancel={() => setPickerTarget(null)}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalBtnCancel}
              onPress={onClose}
              disabled={saving}
              activeOpacity={1}
            >
              <Text style={styles.modalBtnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBtnSave}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={1}
            >
              <Text style={styles.modalBtnSaveText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

export const ActivePrescriptionView = ({
  prescription: initialPrescription,
}: ActivePrescriptionViewProps): React.JSX.Element => {
  const [prescription, setPrescription] = useState<Prescription>(initialPrescription);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editModalVisible, setEditModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const { mutedPeriods, toggleMute } = useAlarmStore();

  const dates = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const format12Hour = (timeStr?: string) => {
    if (!timeStr) return '';
    const [hoursStr, minutesStr] = timeStr.split(':');
    let h = parseInt(hoursStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h.toString().padStart(2, '0')}:${minutesStr} ${ampm}`;
  };

  const getPeriods = (): PeriodGroup[] => {
    const periods: PeriodGroup[] = [
      { id: 'morning', label: 'Morning', medicines: [], isCompleted: false },
      { id: 'noon', label: 'Noon', medicines: [], isCompleted: false },
      { id: 'night', label: 'Night', medicines: [], isCompleted: false },
    ];

    prescription.medicines.forEach((med) => {
      const schedule = med.dosageSchedule || {};
      if (schedule.morning) {
        periods[0].time = periods[0].time || schedule.morning;
        periods[0].medicines.push(med);
      }
      if (schedule.noon) {
        periods[1].time = periods[1].time || schedule.noon;
        periods[1].medicines.push(med);
      }
      if (schedule.night) {
        periods[2].time = periods[2].time || schedule.night;
        periods[2].medicines.push(med);
      }
    });

    const now = new Date();
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const nowDateStr = now.toISOString().split('T')[0];

    // Filter out periods with no medicines, calculate completion status
    const activeGroups = periods
      .filter((p) => p.medicines.length > 0)
      .map((p) => {
        let isCompleted = false;
        if (selectedDateStr < nowDateStr) {
          isCompleted = true; // Past day
        } else if (selectedDateStr === nowDateStr && p.time) {
          const [hours, minutes] = p.time.split(':').map(Number);
          const doseTime = new Date(now);
          doseTime.setHours(hours, minutes, 0, 0);
          isCompleted = now >= doseTime;
        }

        // Mock data: assume morning dose is done on the 12th
        if (selectedDate.getDate() === 12 && p.id === 'morning') {
          isCompleted = true;
        }

        return { ...p, isCompleted };
      });

    // Sort: Active periods first, Completed periods last
    return activeGroups.sort((a, b) => {
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
      return 0; // maintain chronological order if both active or both completed
    });
  };

  const handleEditSave = async (morning: string, noon: string, night: string) => {
    await Promise.all(
      prescription.medicines.map((med) => {
        const dosageSchedule = { ...med.dosageSchedule };
        if (dosageSchedule.morning !== undefined && morning) dosageSchedule.morning = morning;
        if (dosageSchedule.noon !== undefined && noon) dosageSchedule.noon = noon;
        if (dosageSchedule.night !== undefined && night) dosageSchedule.night = night;

        return prescriptionsService.updateMedicineSchedule(prescription.id, med.id, {
          dosageSchedule,
        });
      }),
    );

    const updated = await prescriptionsService.getPrescriptionDetails(prescription.id);
    setPrescription(updated);
  };

  const periodGroups = getPeriods();

  const renderPeriodBlock = (group: PeriodGroup) => {
    const isMuted = mutedPeriods[group.id];

    return (
      <View
        key={group.id}
        style={[styles.periodBlock, group.isCompleted && styles.periodBlockCompleted]}
      >
        {/* Header */}
        <View style={styles.periodHeader}>
          <Text style={[styles.periodTitle, group.isCompleted && styles.periodTextCompleted]}>
            {group.label}
          </Text>
          <View style={styles.periodHeaderRight}>
            <TouchableOpacity
              style={[styles.alarmBadge, group.isCompleted && styles.alarmBadgeCompleted]}
              onPress={() => toggleMute(group.id)}
              activeOpacity={0.7}
              disabled={group.isCompleted}
            >
              <MaterialCommunityIcons
                name={isMuted ? 'alarm-off' : 'alarm'}
                size={14}
                color={group.isCompleted ? Colors.textTertiary : Colors.textPrimary}
              />
              <Text style={[styles.periodTime, group.isCompleted && styles.periodTextCompleted]}>
                {format12Hour(group.time)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Medicines */}
        <View style={styles.periodMedicines}>
          {group.medicines.map((med) => (
            <View key={med.id} style={styles.periodMedRow}>
              <View
                style={[
                  styles.medIconDot,
                  group.isCompleted && { backgroundColor: Colors.textTertiary },
                ]}
              />
              <View style={styles.medInfo}>
                <View style={styles.medNameRow}>
                  <Text style={[styles.medName, group.isCompleted && styles.periodTextCompleted]}>
                    {med.name}
                  </Text>
                  {med.dosage && (
                    <View style={styles.dosageBadge}>
                      <Text
                        style={[
                          styles.dosageBadgeText,
                          group.isCompleted && styles.periodTextCompleted,
                        ]}
                      >
                        {med.dosage}
                      </Text>
                    </View>
                  )}
                  {med.instructions && getMealTiming(med.instructions) ? (
                    <>
                      <MaterialCommunityIcons
                        name="circle-small"
                        size={12}
                        color={group.isCompleted ? Colors.textTertiary : '#000000'}
                        style={{ marginHorizontal: -3 }}
                      />
                      <Text
                        style={[
                          styles.medInstructionsInline,
                          group.isCompleted && styles.periodTextCompleted,
                        ]}
                      >
                        {getMealTiming(med.instructions)}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Date Selector */}
      <View style={styles.dateSelectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateSelectorContent}
        >
          {dates.map((date, index) => {
            const isSelected =
              selectedDate.toISOString().split('T')[0] === date.toISOString().split('T')[0];
            const isToday = index === 0;
            const dayName = isToday
              ? 'Today'
              : date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = date.getDate();

            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateSelectorItem, isSelected && styles.dateSelectorItemActive]}
                onPress={() => setSelectedDate(date)}
                activeOpacity={1}
              >
                <Text
                  style={[styles.dateSelectorDayName, isSelected && styles.dateSelectorTextActive]}
                >
                  {dayName}
                </Text>
                <Text
                  style={[
                    styles.dateSelectorDayNumber,
                    isSelected && styles.dateSelectorTextActive,
                  ]}
                >
                  {dayNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {periodGroups.map(renderPeriodBlock)}
      </ScrollView>

      {/* Global Change Schedules Button (Fixed at Bottom) */}
      {periodGroups.length > 0 && (
        <View style={styles.bottomFixedContainer}>
          <TouchableOpacity
            style={styles.changeSchedulesBtn}
            onPress={() => setEditModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.changeSchedulesBtnText}>Change Schedules</Text>
          </TouchableOpacity>
        </View>
      )}

      <EditSchedulesModal
        key={editModalVisible ? 'visible' : 'hidden'}
        visible={editModalVisible}
        periods={periodGroups}
        onClose={() => setEditModalVisible(false)}
        onSave={handleEditSave}
      />
    </View>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },

  // Date Selector
  dateSelectorContainer: {
    marginBottom: Spacing.md,
  },
  dateSelectorContent: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dateSelectorItem: {
    width: 64,
    height: 72,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  dateSelectorItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateSelectorDayName: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dateSelectorDayNumber: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  dateSelectorTextActive: {
    color: Colors.surface,
  },

  // Period Blocks
  periodBlock: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  periodBlockCompleted: {
    backgroundColor: Colors.background,
    borderColor: 'transparent',
    opacity: 0.6,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  periodTitle: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.base,
    color: Colors.primary,
  },
  periodHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  alarmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9', // Lighter green
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  alarmBadgeCompleted: {
    backgroundColor: Colors.tertiary, // fallback for completed
  },
  periodTime: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  periodTextCompleted: {
    color: Colors.textTertiary,
  },

  // Medicines inside period
  periodMedicines: {
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  periodMedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medIconDot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    marginRight: Spacing.sm,
  },
  medInfo: {
    flex: 1,
  },
  medNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  medName: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  dosageBadge: {
    paddingTop: 2,
    paddingLeft: 2,
  },
  dosageBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: '#000000',
  },
  medInstructionsInline: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: '#000000',
    lineHeight: FontSize.sm * 1.5,
  },
  // Fixed Bottom Button
  bottomFixedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  changeSchedulesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  changeSchedulesBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
    lineHeight: FontSize.base * 1.5,
  },

  // Edit Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  timeSelector: {
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  timeSelectorText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalBtnCancel: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  modalBtnCancelText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: FontSize.base * 1.5,
  },
  modalBtnSave: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  modalBtnSaveText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
    lineHeight: FontSize.base * 1.5,
  },
  // Custom Time Picker Styles
  customPickerWrapper: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    marginTop: Spacing.md,
  },
  customPickerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  stepperCol: {
    alignItems: 'center',
    width: 60,
  },
  stepperBtn: {
    padding: Spacing.xs,
  },
  stepperValueBox: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  stepperValueText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
  },
  stepperColon: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
});
