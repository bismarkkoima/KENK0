import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Chip, Screen, SectionTitle, Stat } from '@/components/ui';
import { moodEmoji } from '@/components/wellness-cards';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { getDaySummaries, getGoals, getStreak, type DaySummary } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { lastDays, shortWeekday } from '@/lib/dates';
import { buildInsights, rangeStats } from '@/lib/insights';

const RANGES = [7, 30] as const;

export default function ProgressScreen() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(7);
  const { data } = useFocusedQuery(async (db) => {
    const days = lastDays(range);
    return {
      days: await getDaySummaries(db, days[0], days[days.length - 1]),
      goals: await getGoals(db),
      streak: await getStreak(db),
    };
  }, String(range));

  if (!data) return <Screen title="Progress" />;
  const { days, goals, streak } = data;
  const s = rangeStats(days, goals);

  return (
    <Screen title="Progress">
      <View style={styles.chips}>
        {RANGES.map((r) => (
          <Chip key={r} label={`${r} days`} selected={range === r} onPress={() => setRange(r)} />
        ))}
      </View>

      <Card>
        <View style={styles.row}>
          <Stat label="Streak" value={String(streak)} unit="days" />
          <Stat label="Days logged" value={`${s.loggedDays}/${range}`} />
          <Stat
            label="Mood"
            value={s.avgMood === null ? '–' : `${moodEmoji(s.avgMood)} ${s.avgMood.toFixed(1)}`}
          />
        </View>
      </Card>

      <SectionTitle>Insights</SectionTitle>
      <Card>
        {buildInsights(days, goals, streak).map((text) => (
          <ThemedText key={text} type="small">
            • {text}
          </ThemedText>
        ))}
      </Card>

      <SectionTitle>Calories</SectionTitle>
      <Card>
        <BarChart
          days={days}
          pick={(d) => d.calories}
          goal={goals.calories}
          color="tint"
          warnOver
        />
        <ThemedText type="small" themeColor="textSecondary">
          Average {Math.round(s.avgCalories)} kcal on logged days · goal {goals.calories}
        </ThemedText>
      </Card>

      <SectionTitle>Mood</SectionTitle>
      <Card>
        <BarChart days={days} pick={(d) => d.mood ?? 0} max={5} color="tint" />
        <ThemedText type="small" themeColor="textSecondary">
          {s.checkinDays
            ? `Checked in on ${s.checkinDays} of ${range} days · 1 = low, 5 = great`
            : 'No check-ins yet — add one from the Today tab.'}
        </ThemedText>
      </Card>

      <SectionTitle>Meditation</SectionTitle>
      <Card>
        <BarChart
          days={days}
          pick={(d) => d.meditationMinutes}
          goal={goals.meditationMinutes}
          color="calm"
        />
        <ThemedText type="small" themeColor="textSecondary">
          {Math.round(s.totalMindful)} mindful minutes · goal met on {s.mindfulDays} of {range} days
        </ThemedText>
      </Card>

      <SectionTitle>Water</SectionTitle>
      <Card>
        <BarChart days={days} pick={(d) => d.waterMl} goal={goals.waterMl} color="water" />
        <ThemedText type="small" themeColor="textSecondary">
          Average {Math.round(s.avgWater)} ml on days you logged · goal met on {s.hydratedDays} of{' '}
          {range} days
        </ThemedText>
      </Card>
    </Screen>
  );
}

function BarChart({
  days,
  pick,
  goal,
  max: fixedMax,
  color,
  warnOver = false,
}: {
  days: DaySummary[];
  pick: (d: DaySummary) => number;
  /** Draws a dashed target line. */
  goal?: number;
  /** Fixed top of the scale (e.g. 5 for mood); otherwise fits the data and goal. */
  max?: number;
  color: ThemeColor;
  /** Fade bars that overshoot the goal by more than 10%. */
  warnOver?: boolean;
}) {
  const theme = useTheme();
  const values = days.map(pick);
  const max = fixedMax ?? Math.max((goal ?? 0) * 1.25, ...values, 1);
  const showLabels = days.length <= 7;

  return (
    <View>
      <View style={styles.chart}>
        {goal !== undefined && (
          <View
            style={[
              styles.goalLine,
              { bottom: `${(goal / max) * 100}%`, borderColor: theme.textSecondary },
            ]}
          />
        )}
        {days.map((d, i) => (
          <View key={d.day} style={styles.barSlot}>
            <View
              style={{
                height: `${(values[i] / max) * 100}%`,
                minHeight: values[i] > 0 ? 3 : 0,
                borderRadius: 4,
                backgroundColor: theme[color],
                opacity: warnOver && goal !== undefined && values[i] > goal * 1.1 ? 0.6 : 1,
              }}
            />
          </View>
        ))}
      </View>
      {showLabels && (
        <View style={styles.labels}>
          {days.map((d) => (
            <ThemedText key={d.day} type="small" themeColor="textSecondary" style={styles.label}>
              {shortWeekday(d.day)}
            </ThemedText>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  chart: {
    height: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  barSlot: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  labels: {
    flexDirection: 'row',
    gap: 3,
    marginTop: Spacing.one,
  },
  label: {
    flex: 1,
    textAlign: 'center',
  },
});
