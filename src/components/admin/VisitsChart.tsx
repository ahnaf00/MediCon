import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, Spacing } from '@theme';

const CHART_HEIGHT = 120;

const dayLabel = (date: string, opts: Intl.DateTimeFormatOptions) =>
  // A Dhaka calendar day from the API; noon UTC keeps it on the same day in any zone.
  new Date(`${date}T12:00:00Z`).toLocaleDateString([], opts);

/**
 * A count per day for the admin screens (audit L2b): visits on the Overview,
 * AI calls on System health. One series, so one colour and no legend; the
 * title names it. Tap a bar to read its day and count; the last day (today)
 * is selected at first.
 */
export const VisitsChart = ({
  days,
  unit = { one: 'visit', many: 'visits' },
}: {
  days: { date: string; total: number }[];
  /** What is counted, e.g. { one: 'AI call', many: 'AI calls' }. */
  unit?: { one: string; many: string };
}) => {
  const word = (n: number) => (n === 1 ? unit.one : unit.many);
  const [selected, setSelected] = useState(days.length - 1);
  const max = Math.max(1, ...days.map((d) => d.total));
  const sum = days.reduce((n, d) => n + d.total, 0);
  const current = days[Math.min(selected, days.length - 1)];

  if (days.length === 0) return null;

  return (
    <View>
      {/* Screen readers get the whole series here; each bar is also its own button. */}
      <View
        style={styles.readout}
        accessible
        accessibilityLabel={`${sum} ${word(sum)} in the last ${days.length} days. ${days
          .map((d) => `${dayLabel(d.date, { day: 'numeric', month: 'short' })}: ${d.total}`)
          .join(', ')}.`}
      >
        <Text style={styles.readoutValue}>{current.total}</Text>
        <Text style={styles.readoutLabel}>
          {`${word(current.total)} on ${dayLabel(current.date, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}`}
        </Text>
      </View>

      <View style={styles.plot}>
        <View style={[styles.gridLine, { bottom: CHART_HEIGHT }]} />
        <Text style={styles.maxLabel}>{max}</Text>
        {days.map((d, i) => (
          <Pressable
            key={d.date}
            style={styles.hit}
            onPress={() => setSelected(i)}
            accessibilityRole="button"
            accessibilityLabel={`${dayLabel(d.date, { day: 'numeric', month: 'short' })}: ${d.total} ${word(d.total)}`}
          >
            <View
              style={[
                styles.bar,
                {
                  height: d.total === 0 ? 2 : Math.max(4, (d.total / max) * CHART_HEIGHT),
                  backgroundColor: d.total === 0 ? Colors.tertiary : Colors.primary,
                  opacity: i === selected || d.total === 0 ? 1 : 0.55,
                },
              ]}
            />
          </Pressable>
        ))}
      </View>
      <View style={styles.baseline} />

      <View style={styles.axis}>
        <Text style={styles.axisText}>
          {dayLabel(days[0].date, { day: 'numeric', month: 'short' })}
        </Text>
        <Text style={styles.axisText}>Today</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  readout: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  readoutValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  readoutLabel: { fontSize: FontSize.base, color: Colors.textSecondary },
  plot: {
    height: CHART_HEIGHT + 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingRight: 22,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 22,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.tertiary,
  },
  maxLabel: {
    position: 'absolute',
    right: 0,
    bottom: CHART_HEIGHT - 8,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  // The touch target is the whole column, wider and taller than the bar.
  hit: { flex: 1, height: '100%', justifyContent: 'flex-end', paddingHorizontal: 1 },
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  baseline: { height: 1, backgroundColor: Colors.tertiary, marginRight: 22 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginRight: 22 },
  axisText: { fontSize: FontSize.xs, color: Colors.textTertiary },
});
