import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { AppIcon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Card, CardTitle, IconButton, IconTile, Rings, Screen } from '@/components/ui';
import { accentText, Spacing, type GradientName } from '@/constants/theme';
import { formatDuration, getWorkoutType } from '@/data/workouts';
import { getDaySummaries, getGoals, getWorkoutsBetween } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { sessionLoad } from '@/lib/cardio-load';
import { addDays, formatDayLabel, toDayKey } from '@/lib/dates';

export default function DailyActivityScreen() {
  const theme = useTheme();
  const [day, setDay] = useState(toDayKey());
  const isToday = day === toDayKey();
  const { data } = useFocusedQuery(async (db) => {
    const [summary] = await getDaySummaries(db, day, day);
    return { summary, goals: await getGoals(db), workouts: await getWorkoutsBetween(db, day, day) };
  }, day);

  return (
    <Screen tabs={false}>
      <Card style={styles.dayNav}>
        <IconButton
          icon={{ mci: 'chevron-left' }}
          label="Previous day"
          size={40}
          onPress={() => setDay(addDays(day, -1))}
        />
        <ThemedText type="heading">{formatDayLabel(day)}</ThemedText>
        <View style={{ opacity: isToday ? 0.3 : 1 }} pointerEvents={isToday ? 'none' : 'auto'}>
          <IconButton
            icon={{ mci: 'chevron-right' }}
            label="Next day"
            size={40}
            onPress={() => setDay(addDays(day, 1))}
          />
        </View>
      </Card>

      {data && (
        <>
          <Card style={styles.ringsCard}>
            <Rings
              size={180}
              stroke={20}
              rings={[
                { progress: data.summary.activeCalories / data.goals.moveCalories, color: 'move' },
                {
                  progress: data.summary.exerciseMinutes / data.goals.exerciseMinutes,
                  color: 'tint',
                },
                { progress: data.summary.steps / data.goals.steps, color: 'calm' },
              ]}
            />
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              Move · Exercise · Steps
            </ThemedText>
          </Card>

          <View style={styles.grid}>
            <Metric
              icon={{ mci: 'fire' }}
              color="move"
              label="Active calories"
              value={`${Math.round(data.summary.activeCalories)}`}
              unit={`/ ${data.goals.moveCalories} kcal`}
            />
            <Metric
              icon={{ mci: 'timer-outline' }}
              color="tint"
              label="Exercise"
              value={`${Math.round(data.summary.exerciseMinutes)}`}
              unit={`/ ${data.goals.exerciseMinutes} min`}
            />
            <Metric
              icon={{ mci: 'shoe-print' }}
              color="calm"
              label="Steps"
              value={data.summary.steps ? data.summary.steps.toLocaleString() : '–'}
              unit={`/ ${data.goals.steps.toLocaleString()}`}
            />
            <Metric
              icon={{ mci: 'map-marker-distance' }}
              color="water"
              label="Distance"
              value={data.summary.distanceKm.toFixed(1)}
              unit="km"
            />
            <Metric
              icon={{ mci: 'heart-pulse' }}
              color="sky"
              label="Cardio load"
              value={String(
                data.workouts.reduce((s, w) => s + sessionLoad(w.duration_sec, w.effort), 0),
              )}
              unit=""
            />
            <Metric
              icon={{ mci: 'meditation' }}
              color="mind"
              label="Mindful"
              value={`${Math.round(data.summary.meditationMinutes)}`}
              unit="min"
            />
          </View>

          <Card>
            <CardTitle>Workouts</CardTitle>
            {data.workouts.length === 0 ? (
              <ThemedText themeColor="textSecondary">No workouts logged on this day.</ThemedText>
            ) : (
              data.workouts.map((w) => {
                const t = getWorkoutType(w.type);
                return (
                  <View key={w.id} style={styles.workoutRow}>
                    <IconTile icon={t.icon} color={t.color} size={40} />
                    <View style={styles.flex}>
                      <ThemedText type="smallBold">{t.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {new Date(w.started_at).toLocaleTimeString(undefined, {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}{' '}
                        · {formatDuration(w.duration_sec)}
                        {w.distance_km ? ` · ${w.distance_km} km` : ''}
                      </ThemedText>
                    </View>
                    <View style={styles.right}>
                      <ThemedText type="smallBold" style={{ color: theme.move }}>
                        {Math.round(w.calories)} kcal
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.skyText }}>
                        load {sessionLoad(w.duration_sec, w.effort)}
                      </ThemedText>
                    </View>
                  </View>
                );
              })
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

function Metric({
  icon,
  color,
  label,
  value,
  unit,
}: {
  icon: AppIcon;
  color: GradientName;
  label: string;
  value: string;
  unit: string;
}) {
  const theme = useTheme();
  return (
    <Card style={styles.metric}>
      <IconTile icon={icon} color={color} size={32} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={[styles.metricValue, { color: theme[accentText(color)] }]}>
        {value}
        <ThemedText type="small" themeColor="textSecondary">
          {' '}
          {unit}
        </ThemedText>
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two,
  },
  ringsCard: {
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  metric: {
    width: '46%',
    flexGrow: 1,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  metricValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  right: {
    alignItems: 'flex-end',
  },
});
