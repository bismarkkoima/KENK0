import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, CardTitle, Chip, GradientFill, Screen, Stat } from '@/components/ui';
import { moodEmoji } from '@/components/wellness-cards';
import { Spacing, type GradientName } from '@/constants/theme';
import { getDaySummaries, getGoals, getStreak, type DaySummary } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { lastDays, shortWeekday } from '@/lib/dates';
import { buildInsights, rangeStats } from '@/lib/insights';

const RANGES = [7, 30] as const;

export default function ProgressScreen() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(7);
  const theme = useTheme();
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

  const avg = (pick: (d: DaySummary) => number | null) => {
    const xs = days.flatMap((d) => {
      const v = pick(d);
      return v === null || v === 0 ? [] : [v];
    });
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  const avgStress = avg((d) => d.stress);

  return (
    <Screen title="Progress">
      <View style={styles.chips}>
        {RANGES.map((r) => (
          <Chip key={r} label={`${r} days`} selected={range === r} onPress={() => setRange(r)} />
        ))}
      </View>

      <Card>
        <View style={styles.row}>
          <Stat label="Streak" value={`🔥 ${streak}`} unit="days" />
          <Stat label="Workouts" value={String(s.workouts)} />
          <Stat
            label="Mood"
            value={s.avgMood === null ? '–' : `${moodEmoji(s.avgMood)} ${s.avgMood.toFixed(1)}`}
          />
        </View>
      </Card>

      <Card>
        <CardTitle>Insights</CardTitle>
        {buildInsights(days, goals, streak).map((text) => (
          <View key={text} style={styles.insight}>
            <View style={[styles.dot, { backgroundColor: theme.tintText }]} />
            <ThemedText style={styles.flex}>{text}</ThemedText>
          </View>
        ))}
      </Card>

      <MetricCard
        title="Exercise"
        value={Math.round(s.exerciseMinutes)}
        unit="MIN"
        caption={`Total · goal ${goals.exerciseMinutes} min a day, met on ${s.activeDays} of ${range} days`}
        color="tint">
        <BarChart
          days={days}
          pick={(d) => d.exerciseMinutes}
          goal={goals.exerciseMinutes}
          color="tint"
        />
      </MetricCard>

      <MetricCard
        title="Move"
        value={Math.round(days.reduce((sum, d) => sum + d.activeCalories, 0))}
        unit="CAL"
        caption={`Active calories from workouts · goal ${goals.moveCalories} a day`}
        color="move">
        <BarChart
          days={days}
          pick={(d) => d.activeCalories}
          goal={goals.moveCalories}
          color="move"
        />
      </MetricCard>

      <MetricCard
        title="Mood"
        value={s.avgMood === null ? '–' : s.avgMood.toFixed(1)}
        unit="/5"
        caption={
          s.checkinDays
            ? `Average · checked in on ${s.checkinDays} of ${range} days`
            : 'No check-ins yet — add one from Summary or Mind.'
        }
        color="warm">
        <BarChart days={days} pick={(d) => d.mood ?? 0} max={5} color="warm" />
      </MetricCard>

      <MetricCard
        title="Stress"
        value={avgStress === null ? '–' : avgStress.toFixed(1)}
        unit="/5"
        caption={
          avgStress === null
            ? 'Log a check-in in the Mind tab to track stress.'
            : 'Average from Mind check-ins · lower is calmer'
        }
        color="calm">
        <BarChart days={days} pick={(d) => d.stress ?? 0} max={5} color="calm" />
      </MetricCard>

      <MetricCard
        title="Mindful Minutes"
        value={Math.round(s.totalMindful)}
        unit="MIN"
        caption={`Goal of ${goals.meditationMinutes} min met on ${s.mindfulDays} of ${range} days`}
        color="mind">
        <BarChart
          days={days}
          pick={(d) => d.meditationMinutes}
          goal={goals.meditationMinutes}
          color="mind"
        />
      </MetricCard>

      <MetricCard
        title="Calories Eaten"
        value={Math.round(s.avgCalories)}
        unit="KCAL"
        caption={`Average on ${s.loggedDays} logged days · goal ${goals.calories}`}
        color="warm">
        <BarChart
          days={days}
          pick={(d) => d.calories}
          goal={goals.calories}
          color="warm"
          warnOver
        />
      </MetricCard>

      <MetricCard
        title="Water"
        value={Math.round(s.avgWater)}
        unit="ML"
        caption={`Average on days you logged · goal met on ${s.hydratedDays} of ${range} days`}
        color="water">
        <BarChart days={days} pick={(d) => d.waterMl} goal={goals.waterMl} color="water" />
      </MetricCard>
    </Screen>
  );
}

function MetricCard({
  title,
  value,
  unit,
  caption,
  color,
  children,
}: {
  title: string;
  value: number | string;
  unit: string;
  caption: string;
  color: GradientName;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const c = theme[color === 'tint' ? 'tintText' : color];
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <ThemedText type="display" style={{ color: c }}>
        {value}
        <ThemedText type="heading" style={{ color: c }}>
          {' '}
          {unit}
        </ThemedText>
      </ThemedText>
      {children}
      <ThemedText type="small" themeColor="textSecondary">
        {caption}
      </ThemedText>
    </Card>
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
  color: GradientName;
  /** Fade bars that overshoot the goal by more than 10%. */
  warnOver?: boolean;
}) {
  const theme = useTheme();
  const values = days.map(pick);
  const max = fixedMax ?? Math.max((goal ?? 0) * 1.25, ...values, 1);
  const showLabels = days.length <= 7;
  const barRadius = days.length <= 7 ? 10 : 4;
  const gap = days.length <= 7 ? 10 : 3;

  return (
    <View>
      <View style={[styles.chart, { gap }]}>
        {goal !== undefined && (
          <View
            style={[
              styles.goalLine,
              { bottom: `${(goal / max) * 100}%`, borderColor: theme.textSecondary },
            ]}
          />
        )}
        {days.map((d, i) => (
          <View
            key={d.day}
            style={[
              styles.barSlot,
              { backgroundColor: theme.backgroundSelected, borderRadius: barRadius },
            ]}>
            {values[i] > 0 && (
              <GradientFill
                name={color}
                angle={0}
                style={{
                  height: `${(values[i] / max) * 100}%`,
                  minHeight: barRadius * 2,
                  borderRadius: barRadius,
                  opacity: warnOver && goal !== undefined && values[i] > goal * 1.1 ? 0.55 : 1,
                }}
              />
            )}
          </View>
        ))}
      </View>
      {showLabels && (
        <View style={[styles.labels, { gap }]}>
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
  flex: {
    flex: 1,
  },
  insight: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
    alignItems: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  chart: {
    height: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    marginTop: Spacing.one,
  },
  label: {
    flex: 1,
    textAlign: 'center',
  },
});
