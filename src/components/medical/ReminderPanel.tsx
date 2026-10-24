import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '../ui/Button';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize } from '../../theme';
import type { Prescription } from '../../types/medical.types';
import {
  prescriptionEndsOn,
  selectActivePrescriptionId,
  useReminderStore,
} from '../../store/reminderStore';
import { reportReminderResult } from '../../services/notifications/reminderMessages';
import { fromLocalDateString, toLocalDateString } from '../../utils/localDate';

const PERIOD_LABEL = { morning: 'Morning', noon: 'Noon', night: 'Night' } as const;

const format12Hour = (time: string): string => {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const formatDay = (ymd: string): string =>
  fromLocalDateString(ymd)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? ymd;

/** Turns this prescription's daily medicine reminders on or off (patient only). */
export const ReminderPanel = ({
  prescription,
}: {
  prescription: Prescription;
}): React.JSX.Element | null => {
  const reminders = useReminderStore((s) => s.reminders);
  const activeId = useReminderStore(selectActivePrescriptionId);
  const refresh = useReminderStore((s) => s.refresh);
  const enableAll = useReminderStore((s) => s.enableAll);
  const disableAll = useReminderStore((s) => s.disableAll);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const endsOn = prescriptionEndsOn(prescription);
  if (!endsOn) return null; // no morning / noon / night times to remind about

  const order = Object.keys(PERIOD_LABEL);
  const mine = Object.values(reminders)
    .filter((r) => r.prescriptionId === String(prescription.id))
    .sort((a, b) => order.indexOf(a.period) - order.indexOf(b.period));
  const ended = endsOn < toLocalDateString(new Date());
  const otherActive = activeId !== null && activeId !== String(prescription.id);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } catch {
      reportReminderResult('error');
    } finally {
      setBusy(false);
    }
  };

  let status: string;
  if (mine.length > 0) {
    status = `On, daily until ${formatDay(endsOn)}: ${mine
      .map((r) => `${PERIOD_LABEL[r.period]} ${format12Hour(r.time)}`)
      .join(', ')}`;
  } else if (ended) {
    status = `Course ended on ${formatDay(endsOn)}, so reminders are not available.`;
  } else {
    status = otherActive
      ? 'Off. Turning them on replaces the reminders of your other prescription.'
      : 'Off. Get a notification on this phone at each dose time.';
  }

  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <MaterialCommunityIcons
          name={mine.length > 0 ? 'alarm-check' : 'alarm-off'}
          size={20}
          color={mine.length > 0 ? Colors.primary : Colors.textTertiary}
        />
        <View style={styles.texts}>
          <Text style={styles.title}>Medicine reminders</Text>
          <Text style={styles.status}>{status}</Text>
        </View>
      </View>
      {mine.length > 0 ? (
        <Button
          label="Turn off reminders"
          variant="outline"
          loading={busy}
          onPress={() => run(() => disableAll(prescription.id))}
        />
      ) : !ended ? (
        <Button
          label="Turn on reminders"
          loading={busy}
          onPress={() => run(async () => reportReminderResult(await enableAll(prescription)))}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  texts: { flex: 1 },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  status: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
