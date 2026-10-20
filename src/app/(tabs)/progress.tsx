import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Chip, Screen, SectionTitle, Stat } from '@/components/ui';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { getDaySummaries, getGoals, getStreak, type DaySummary } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { lastDays, shortWeekday } from '@/lib/dates';

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

  const logged = days.filter((d) => d.calories > 0);
  const avgCalories = logged.length
    ? logged.reduce((s, d) => s + d.calories, 0) / logged.length
    : 0;
  const avgProtein = logged.length ? logged.reduce((s, d) => s + d.protein, 0) / logged.length : 0;
  const totalMindful = days.reduce((s, d) => s + d.meditationMinutes, 0);
  const onTarget = logged.filter(
    (d) => d.calories >= goals.calories * 0.9 && d.calories <= goals.calories * 1.1,
  ).length;
  const mindfulDays = days.filter((d) => d.meditationMinutes >= goals.meditationMinutes).length;

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
          <Stat label="Days logged" value={`${logged.length}/${range}`} />
          <Stat label="Mindful" value={String(Math.round(totalMindful))} unit="min" />
        </View>
      </Card>

      <SectionTitle>Calories</SectionTitle>
      <Card>
        <BarChart days={days} pick={(d) => d.calories} goal={goals.calories} color="tint" />
        <ThemedText type="small" themeColor="textSecondary">
          Average {Math.round(avgCalories)} kcal on logged days · goal {goals.calories}
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
          Goal of {goals.meditationMinutes} min met on {mindfulDays} of {range} days
        </ThemedText>
      </Card>

      <SectionTitle>Insights</SectionTitle>
      <Card>
        {insights({
          logged: logged.length,
          range,
          onTarget,
          avgProtein,
          goals,
          mindfulDays,
          streak,
        }).map((text) => (
          <ThemedText key={text} type="small">
            • {text}
          </ThemedText>
        ))}
      </Card>
    </Screen>
  );
}

function BarChart({
  days,
  pick,
  goal,
  color,
}: {
  days: DaySummary[];
  pick: (d: DaySummary) => number;
  goal: number;
  color: ThemeColor;
}) {
  const theme = useTheme();
  const values = days.map(pick);
  const max = Math.max(goal * 1.25, ...values, 1);
  const showLabels = days.length <= 7;
  const goalBottom = `${(goal / max) * 100}%` as const;

  return (
    <View>
      <View style={styles.chart}>
        <View style={[styles.goalLine, { bottom: goalBottom, borderColor: theme.textSecondary }]} />
        {days.map((d, i) => (
          <View key={d.day} style={styles.barSlot}>
            <View
              style={{
                height: `${(values[i] / max) * 100}%`,
                minHeight: values[i] > 0 ? 3 : 0,
                borderRadius: 4,
                backgroundColor: theme[color],
                opacity: values[i] > goal * 1.1 && color === 'tint' ? 0.6 : 1,
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

function insights(s: {
  logged: number;
  range: number;
  onTarget: number;
  avgProtein: number;
  goals: { protein: number };
  mindfulDays: number;
  streak: number;
}): string[] {
  if (s.logged === 0 && s.mindfulDays === 0) {
    return ['Log your first meal or meditation to start seeing trends here.'];
  }
  const out: string[] = [];
  if (s.logged > 0) {
    out.push(`You hit your calorie target (±10%) on ${s.onTarget} of ${s.logged} logged days.`);
    if (s.avgProtein < s.goals.protein * 0.8) {
      out.push(
        `Protein averages ${Math.round(s.avgProtein)} g — try adding eggs, beans, yogurt or fish to reach ${s.goals.protein} g.`,
      );
    } else {
      out.push(`Nice work on protein: ${Math.round(s.avgProtein)} g a day on average.`);
    }
  }
  if (s.logged < s.range / 2) {
    out.push('Logging more consistently will make these insights more accurate.');
  }
  if (s.mindfulDays === 0) {
    out.push('Even a 2-minute breathing session counts — try one today.');
  } else {
    out.push(`You met your mindfulness goal on ${s.mindfulDays} days. Keep it up!`);
  }
  if (s.streak >= 3) out.push(`You're on a ${s.streak}-day streak 🔥`);
  return out;
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
