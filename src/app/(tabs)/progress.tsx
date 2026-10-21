import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type AppIcon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Card, CardTitle, Chip, GradientFill, IconTile, Screen } from '@/components/ui';
import { accentText, Spacing, type GradientName } from '@/constants/theme';
import { getWorkoutType } from '@/data/workouts';
import { getGoals, getStreak } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import {
  analyzePeriod,
  percentChange,
  PERIODS,
  workoutPatterns,
  type Bucket,
  type Period,
} from '@/lib/analysis';
import { buildInsights } from '@/lib/insights';
import { WEEKDAYS } from '@/lib/stats';

export default function ProgressScreen() {
  const theme = useTheme();
  const [period, setPeriod] = useState<Period>('week');
  const { data } = useFocusedQuery(
    async (db) => ({
      analysis: await analyzePeriod(db, period),
      goals: await getGoals(db),
      streak: await getStreak(db),
    }),
    period,
  );

  const header = (
    <View style={styles.segment}>
      {PERIODS.map((p) => (
        <Chip
          key={p.id}
          label={p.label}
          selected={period === p.id}
          onPress={() => setPeriod(p.id)}
        />
      ))}
    </View>
  );

  if (!data) {
    return <Screen title="Trends">{header}</Screen>;
  }

  const { analysis, goals, streak } = data;
  const { totals: t, previous: prev, buckets } = analysis;
  const periodInfo = PERIODS.find((p) => p.id === period)!;
  const perDay = (n: number) => n / Math.max(1, t.days);
  const patterns = workoutPatterns(analysis.workouts);
  const per = period === 'year' ? 'month' : 'day';

  return (
    <Screen title="Trends" subtitle={periodInfo.title}>
      {header}

      <View style={styles.kpis}>
        <Kpi
          icon={{ mci: 'run-fast' }}
          color="tint"
          label="Workouts"
          value={String(t.workouts)}
          change={percentChange(t.workouts, prev.workouts)}
        />
        <Kpi
          icon={{ mci: 'timer-outline' }}
          color="sky"
          label="Active minutes"
          value={formatNumber(t.exerciseMinutes)}
          change={percentChange(t.exerciseMinutes, prev.exerciseMinutes)}
        />
        <Kpi
          icon={{ mci: 'shoe-print' }}
          color="calm"
          label="Steps"
          value={t.steps ? formatNumber(t.steps) : '–'}
          change={percentChange(t.steps, prev.steps)}
        />
        <Kpi
          icon={{ mci: 'fire' }}
          color="move"
          label="Active kcal"
          value={formatNumber(t.activeCalories)}
          change={percentChange(t.activeCalories, prev.activeCalories)}
        />
        <Kpi
          icon={{ mci: 'map-marker-distance' }}
          color="water"
          label="Distance"
          value={`${t.distanceKm.toFixed(1)} km`}
          change={percentChange(t.distanceKm, prev.distanceKm)}
        />
        <Kpi
          icon={{ mci: 'meditation' }}
          color="mind"
          label="Mindful min"
          value={formatNumber(t.meditationMinutes)}
          change={percentChange(t.meditationMinutes, prev.meditationMinutes)}
        />
      </View>

      <Card>
        <CardTitle>Insights</CardTitle>
        {buildInsights(analysis.days, goals, streak)
          .slice(0, 6)
          .map((text) => (
            <View key={text} style={styles.insight}>
              <View style={[styles.dot, { backgroundColor: theme.tintText }]} />
              <ThemedText style={styles.flex}>{text}</ThemedText>
            </View>
          ))}
      </Card>

      <ChartCard
        title={`Workouts per ${per}`}
        value={String(t.workouts)}
        unit="TOTAL"
        caption={
          period === 'week'
            ? `Your plan: ${goals.weeklyWorkouts} a week`
            : `${(t.workouts / Math.max(1, t.days / 7)).toFixed(1)} a week on average · plan ${goals.weeklyWorkouts}`
        }
        color="tint"
        buckets={buckets}
        pick={(b) => b.workouts}
      />
      <ChartCard
        title="Active minutes"
        value={formatNumber(perDay(t.exerciseMinutes))}
        unit="MIN / DAY"
        caption={`Goal ${goals.exerciseMinutes} min a day · ${t.activeDays} active days`}
        color="sky"
        buckets={buckets}
        pick={(b) => b.exerciseMinutes}
        goal={period === 'year' ? undefined : goals.exerciseMinutes}
      />
      <ChartCard
        title="Steps"
        value={t.steps ? formatNumber(perDay(t.steps)) : '–'}
        unit="/ DAY"
        caption={
          t.steps
            ? `Goal ${goals.steps.toLocaleString()} a day`
            : 'Steps are recorded on iPhone. History builds up as you use Kenko.'
        }
        color="calm"
        buckets={buckets}
        pick={(b) => b.steps}
        goal={period === 'year' ? undefined : goals.steps}
      />
      <ChartCard
        title="Mood"
        value={t.mood === null ? '–' : t.mood.toFixed(1)}
        unit="/ 5 AVG"
        caption="From Summary and Mind check-ins"
        color="warm"
        buckets={buckets}
        pick={(b) => b.mood ?? 0}
        max={5}
      />
      <ChartCard
        title="Stress"
        value={t.stress === null ? '–' : t.stress.toFixed(1)}
        unit="/ 5 AVG"
        caption="Lower is calmer · from Mind check-ins"
        color="move"
        buckets={buckets}
        pick={(b) => b.stress ?? 0}
        max={5}
      />
      <ChartCard
        title="Mindful minutes"
        value={formatNumber(t.meditationMinutes)}
        unit="TOTAL"
        caption={`Goal ${goals.meditationMinutes} min a day`}
        color="mind"
        buckets={buckets}
        pick={(b) => b.meditationMinutes}
      />
      <ChartCard
        title="Water"
        value={formatNumber(perDay(t.waterMl))}
        unit="ML / DAY"
        caption={`Goal ${goals.waterMl} ml a day`}
        color="water"
        buckets={buckets}
        pick={(b) => b.waterMl}
      />

      <Card>
        <CardTitle>When you move</CardTitle>
        {analysis.workouts.length === 0 ? (
          <ThemedText themeColor="textSecondary">
            Log a few workouts and Kenko will show which days and times work best for you.
          </ThemedText>
        ) : (
          <>
            <ThemedText themeColor="textSecondary">{patternSummary(patterns)}</ThemedText>
            <Bars
              values={patterns.byWeekday}
              labels={WEEKDAYS.map((d) => d[0])}
              color="tint"
              height={90}
            />
            <View style={styles.slots}>
              {(['morning', 'afternoon', 'evening', 'night'] as const).map((s) => (
                <View key={s} style={styles.slot}>
                  <ThemedText type="display" style={{ color: theme.skyText, fontSize: 26 }}>
                    {patterns.bySlot[s]}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {s[0].toUpperCase() + s.slice(1)}
                  </ThemedText>
                </View>
              ))}
            </View>
          </>
        )}
      </Card>

      {patterns.byType.length > 0 && (
        <Card>
          <CardTitle>Workout mix</CardTitle>
          {patterns.byType.map((row) => {
            const type = getWorkoutType(row.type);
            const share = row.minutes / patterns.byType[0].minutes;
            return (
              <View key={row.type} style={styles.mixRow}>
                <IconTile icon={type.icon} color={type.color} size={36} />
                <View style={styles.flex}>
                  <View style={styles.mixHeader}>
                    <ThemedText type="smallBold">{type.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {row.count}× · {Math.round(row.minutes)} min
                    </ThemedText>
                  </View>
                  <View style={[styles.mixTrack, { backgroundColor: theme.backgroundSelected }]}>
                    <GradientFill
                      name={type.color}
                      angle={90}
                      style={[styles.mixFill, { width: `${Math.max(share * 100, 4)}%` }]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}

function Kpi({
  icon,
  color,
  label,
  value,
  change,
}: {
  icon: AppIcon;
  color: GradientName;
  label: string;
  value: string;
  change: number | null;
}) {
  const theme = useTheme();
  return (
    <Card style={styles.kpi}>
      <View style={styles.kpiTop}>
        <IconTile icon={icon} color={color} size={34} />
        {change !== null && change !== 0 && (
          <View
            style={[
              styles.delta,
              { backgroundColor: change > 0 ? theme.tintSoft : 'rgba(255,77,87,0.14)' },
            ]}>
            <Icon
              name={{ mci: change > 0 ? 'arrow-up' : 'arrow-down' }}
              size={12}
              color={change > 0 ? theme.tintText : theme.danger}
            />
            <ThemedText
              type="smallBold"
              style={[styles.deltaText, { color: change > 0 ? theme.tintText : theme.danger }]}>
              {Math.abs(change)}%
            </ThemedText>
          </View>
        )}
      </View>
      <ThemedText style={[styles.kpiValue, { color: theme[accentText(color)] }]}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </Card>
  );
}

function ChartCard({
  title,
  value,
  unit,
  caption,
  color,
  buckets,
  pick,
  goal,
  max,
}: {
  title: string;
  value: string;
  unit: string;
  caption: string;
  color: GradientName;
  buckets: Bucket[];
  pick: (b: Bucket) => number;
  goal?: number;
  max?: number;
}) {
  const theme = useTheme();
  const c = theme[accentText(color)];
  const showLabels = buckets.length <= 12;
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <ThemedText type="display" style={{ color: c }}>
        {value}
        <ThemedText type="smallBold" style={{ color: c }}>
          {' '}
          {unit}
        </ThemedText>
      </ThemedText>
      <Bars
        values={buckets.map(pick)}
        labels={showLabels ? buckets.map((b) => b.label) : undefined}
        color={color}
        goal={goal}
        max={max}
      />
      <ThemedText type="small" themeColor="textSecondary">
        {caption}
      </ThemedText>
    </Card>
  );
}

/** Rounded gradient bars on dim tracks, with an optional dashed goal line. */
function Bars({
  values,
  labels,
  color,
  goal,
  max: fixedMax,
  height = 130,
}: {
  values: number[];
  labels?: string[];
  color: GradientName;
  goal?: number;
  max?: number;
  height?: number;
}) {
  const theme = useTheme();
  const max = fixedMax ?? Math.max((goal ?? 0) * 1.2, ...values, 1);
  const wide = values.length <= 12;
  const radius = wide ? 9 : 3;
  const gap = wide ? 8 : 2;
  return (
    <View>
      <View style={[styles.chart, { height, gap }]}>
        {goal !== undefined && goal <= max && (
          <View
            style={[
              styles.goalLine,
              { bottom: `${(goal / max) * 100}%`, borderColor: theme.textSecondary },
            ]}
          />
        )}
        {values.map((v, i) => (
          <View
            key={i}
            style={[
              styles.barSlot,
              { backgroundColor: theme.backgroundSelected, borderRadius: radius },
            ]}>
            {v > 0 && (
              <GradientFill
                name={color}
                angle={0}
                style={{
                  height: `${(v / max) * 100}%`,
                  minHeight: radius * 2,
                  borderRadius: radius,
                }}
              />
            )}
          </View>
        ))}
      </View>
      {labels && (
        <View style={[styles.labels, { gap }]}>
          {labels.map((l, i) => (
            <ThemedText key={i} type="small" themeColor="textSecondary" style={styles.label}>
              {l}
            </ThemedText>
          ))}
        </View>
      )}
    </View>
  );
}

function patternSummary(p: ReturnType<typeof workoutPatterns>) {
  const topDay = p.byWeekday.indexOf(Math.max(...p.byWeekday));
  const topSlot = (Object.entries(p.bySlot) as [string, number][]).sort((a, b) => b[1] - a[1])[0];
  return `You move most on ${WEEKDAYS[topDay]}s, usually in the ${topSlot[0]}. Planning around your best times makes habits stick.`;
}

function formatNumber(n: number) {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  return Math.round(n).toLocaleString();
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  segment: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  kpis: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  kpi: {
    width: '46%',
    flexGrow: 1,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  kpiValue: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: 700,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  delta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 999,
  },
  deltaText: {
    fontSize: 12,
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
    fontSize: 12,
  },
  slots: {
    flexDirection: 'row',
  },
  slot: {
    flex: 1,
    alignItems: 'center',
  },
  mixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  mixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  mixTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  mixFill: {
    height: '100%',
    borderRadius: 4,
  },
});
