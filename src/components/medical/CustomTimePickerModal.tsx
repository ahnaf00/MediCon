import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize } from '../../theme';

export interface CustomTimePickerModalProps {
  visible: boolean;
  initialTimeStr: string;
  title: string;
  subtitle?: string;
  onSave: (timeStr: string) => void;
  onCancel: () => void;
}

const ITEM_HEIGHT = 50;

const ScrollListPicker = ({
  data,
  selectedValue,
  onSelect,
}: {
  data: string[];
  selectedValue: string;
  onSelect: (v: string) => void;
}) => {
  const flatListRef = useRef<FlatList>(null);
  const paddedData = useMemo(() => ['', ...data, ''], [data]);
  const initialIndex = Math.max(0, data.indexOf(selectedValue));

  const handleSelect = (item: string) => {
    if (item === '') return;
    const index = data.indexOf(item);
    if (index >= 0) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
      onSelect(item);
    }
  };

  return (
    <View style={styles.scrollListContainer}>
      <FlatList
        ref={flatListRef}
        data={paddedData}
        keyExtractor={(item, index) => `${item}-${index}`}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        initialScrollIndex={initialIndex}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          if (data[index]) {
            onSelect(data[index]);
          }
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.scrollItem}
            onPress={() => handleSelect(item)}
            activeOpacity={1}
          >
            <Text
              style={[styles.scrollItemText, selectedValue === item && styles.scrollItemTextActive]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
      <View style={styles.scrollHighlight} pointerEvents="none" />
    </View>
  );
};

export const CustomTimePickerModal = ({
  visible,
  initialTimeStr,
  title,
  subtitle,
  onSave,
  onCancel,
}: CustomTimePickerModalProps) => {
  const initialValues = useMemo(() => {
    if (!initialTimeStr) return { hour: '08', minute: '00', ampm: 'AM' };
    const [hh, mm] = initialTimeStr.split(':');
    let h24 = parseInt(hh, 10);
    let m = parseInt(mm, 10);
    m = Math.round(m / 5) * 5;
    if (m === 60) {
      m = 0;
      h24 += 1;
    }
    const ap = h24 >= 12 ? 'PM' : 'AM';
    const h = h24 % 12 || 12;
    return {
      hour: h.toString().padStart(2, '0'),
      minute: m.toString().padStart(2, '0'),
      ampm: ap,
    };
  }, [initialTimeStr]);

  const [hour, setHour] = useState(initialValues.hour);
  const [minute, setMinute] = useState(initialValues.minute);
  const [ampm, setAmPm] = useState(initialValues.ampm);
  const [isTypingMode, setIsTypingMode] = useState(false);

  // Reset picker state synchronously during render when the modal opens.
  // This follows React's "derived state during render" pattern using useState.
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setHour(initialValues.hour);
      setMinute(initialValues.minute);
      setAmPm(initialValues.ampm);
    }
  }

  const handleHourChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const num = parseInt(cleanVal, 10);

    if (!cleanVal) {
      setHour('');
      return;
    }

    if (num > 12) setHour('12');
    else if (cleanVal.length === 2 && num < 1) setHour('01');
    else setHour(cleanVal);
  };

  const handleMinuteChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const num = parseInt(cleanVal, 10);

    if (!cleanVal) {
      setMinute('');
      return;
    }

    if (num > 59) setMinute('59');
    else setMinute(cleanVal);
  };

  const handleSave = () => {
    let hInt = parseInt(hour, 10) || 12;
    let mInt = parseInt(minute, 10) || 0;

    let h24 = hInt;
    if (ampm === 'PM' && hInt < 12) h24 += 12;
    if (ampm === 'AM' && hInt === 12) h24 = 0;

    const finalH = h24.toString().padStart(2, '0');
    const finalM = mInt.toString().padStart(2, '0');
    onSave(`${finalH}:${finalM}`);
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutesList = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.pickerModalBackdrop}>
        <View style={styles.pickerModalContent}>
          <Text style={styles.pickerModalTitle}>{title}</Text>
          {subtitle ? <Text style={styles.pickerModalSubtitle}>{subtitle}</Text> : null}

          <TouchableOpacity
            style={styles.modeToggleBtn}
            onPress={() => setIsTypingMode(!isTypingMode)}
            activeOpacity={1}
          >
            <MaterialCommunityIcons
              name={isTypingMode ? 'gesture-swipe-vertical' : 'keyboard-outline'}
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.modeToggleText}>
              {isTypingMode ? 'Switch to Scroll' : 'Switch to Typing'}
            </Text>
          </TouchableOpacity>

          <View style={styles.pickerBody}>
            {isTypingMode ? (
              <View style={styles.typingContainer}>
                <TextInput
                  style={styles.timeInput}
                  value={hour}
                  onChangeText={handleHourChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text style={styles.timeColon}>:</Text>
                <TextInput
                  style={styles.timeInput}
                  value={minute}
                  onChangeText={handleMinuteChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
              </View>
            ) : (
              <>
                {/* Hours Column */}
                <ScrollListPicker data={hoursList} selectedValue={hour} onSelect={setHour} />

                {/* Separator */}
                <View style={styles.separatorContainer}>
                  <Text style={styles.timeColonScroll}>:</Text>
                </View>

                {/* Minutes Column */}
                <ScrollListPicker data={minutesList} selectedValue={minute} onSelect={setMinute} />
              </>
            )}

            {/* AM/PM Column */}
            <View style={styles.ampmColumn}>
              <TouchableOpacity
                style={[styles.ampmBtn, ampm === 'AM' && styles.ampmBtnActive]}
                onPress={() => setAmPm('AM')}
                activeOpacity={1}
              >
                <Text style={[styles.ampmText, ampm === 'AM' && styles.ampmTextActive]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ampmBtn, ampm === 'PM' && styles.ampmBtnActive]}
                onPress={() => setAmPm('PM')}
                activeOpacity={1}
              >
                <Text style={[styles.ampmText, ampm === 'PM' && styles.ampmTextActive]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={onCancel} activeOpacity={1}>
              <Text style={styles.modalBtnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnSave} onPress={handleSave} activeOpacity={1}>
              <Text style={styles.modalBtnSaveText}>Save Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  pickerModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  pickerModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingTop: Spacing.xl + 20,
    paddingBottom: Spacing.xl + 30,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  pickerModalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  pickerModalSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    marginTop: -Spacing.sm,
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  modeToggleText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  pickerBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: Spacing.xl,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    width: 64,
    height: 64,
    textAlign: 'center',
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxl,
    color: Colors.textPrimary,
  },
  timeColon: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxl,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.sm,
  },
  scrollListContainer: {
    width: 64,
    height: ITEM_HEIGHT * 3,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  separatorContainer: {
    height: ITEM_HEIGHT * 3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  scrollItem: {
    height: ITEM_HEIGHT,
    width: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollItemText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  scrollItemTextActive: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.primary,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  scrollHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.tertiary,
  },
  timeColonScroll: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
  },
  ampmColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    height: ITEM_HEIGHT * 3,
    marginLeft: Spacing.md,
    gap: Spacing.md,
  },
  ampmBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.tertiary,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    width: 60,
  },
  ampmBtnActive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primary,
  },
  ampmText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  ampmTextActive: {
    color: Colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  modalBtnCancel: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
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
    justifyContent: 'center',
  },
  modalBtnSaveText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
    lineHeight: FontSize.base * 1.5,
  },
});
