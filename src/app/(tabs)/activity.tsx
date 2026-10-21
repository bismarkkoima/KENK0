import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { TipCard } from '@/components/tip-card';
import { Card, CardTitle, Chip, IconButton, IconTile, PlayButton, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import {
  WORKOUT_GROUPS,
  WORKOUT_TYPES,
  formatDuration,
  getWorkoutType,
  type WorkoutType,
} from '@/data/workouts';
import { deleteWorkout, getDaySummaries, getRecentWorkouts, type Workout } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { addDays, formatDayLabel, toDayKey } from '@/lib/dates';

export default function ActivityScreen() {
  const [group, setGroup] = useState<WorkoutType['group'] | null>(null);
  const today = toDayKey();
  const { data, db, reload } = useFocusedQuery(async (db) => {
    const week = await getDaySummaries(db, addDays(today, -6), today);
    return {
      recent: await getRecentWorkouts(db, 8),
      week: {
        count: week.reduce((s, d) => s + d.workouts, 0),
        minutes: week.reduce((s, d) => s + d.exerciseMinutes, 0),
        calories: week.reduce((s, d) => s + d.activeCalories, 0),
      },
    };
  }, today);

  const types = group ? WORKOUT_TYPES.filter((t) => t.group === group) : WORKOUT_TYPES;

  function confirmDelete(w: Workout) {
    const remove = async () => {
      await deleteWorkout(db, w.id);
      reload();
    };
    const name = getWorkoutType(w.type).name;
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete this ${name}?`)) remove();
      return;
    }
    Alert.alert('Delete workout?', name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: remove },
    ]);
  }

  return (
    <Screen
      title="Activity"
      right={
        <IconButton
          icon={{ ios: 'square.and.pencil', android: 'edit_note', web: 'edit_note' }}
          label="Log a past workout"
          onPress={() => router.push('/log-workout')}
        />
      }>
      <TipCard
        id="activity-intro"
        icon={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
        title="Start a workout"
        body="Tap play to time a workout live, or use the pencil to log one you've already done. Calories are estimated from the activity, time, effort and your weight."
      />

      {data && (
        <Card accent="tint">
          <CardTitle>This week</CardTitle>
          <View style={styles.weekRow}>
            <WeekStat value={String(data.week.count)} label="Workouts" />
            <WeekStat value={String(Math.round(data.week.minutes))} label="Minutes" />
            <WeekStat value={String(Math.round(data.week.calories))} label="Active kcal" />
          </View>
        </Card>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        <Chip label="All" selected={group === null} onPress={() => setGroup(null)} />
        {WORKOUT_GROUPS.map((g) => (
          <Chip
            key={g.id}
            label={g.label}
            selected={group === g.id}
            onPress={() => setGroup(g.id)}
          />
        ))}
      </ScrollView>

      {types.map((t) => (
        <WorkoutCard key={t.id} type={t} />
      ))}

      {data && data.recent.length > 0 && (
        <Card>
          <CardTitle>Recent workouts</CardTitle>
          {data.recent.map((w) => {
            const t = getWorkoutType(w.type);
            return (
              <Pressable key={w.id} onLongPress={() => confirmDelete(w)} style={styles.recentRow}>
                <IconTile icon={t.icon} color={t.color} size={40} />
                <View style={styles.flex}>
                  <ThemedText type="smallBold">{t.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatDayLabel(w.day)} · {formatDuration(w.duration_sec)}
                    {w.distance_km ? ` · ${w.distance_km} km` : ''}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {Math.round(w.calories)} kcal
                </ThemedText>
              </Pressable>
            );
          })}
          <ThemedText type="small" themeColor="textSecondary">
            Long-press a workout to delete it.
          </ThemedText>
        </Card>
      )}
    </Screen>
  );
}

function WorkoutCard({ type }: { type: WorkoutType }) {
  const theme = useTheme();
  const accent = theme[type.color === 'tint' ? 'tintText' : type.color];
  return (
    <Card accent={type.color} style={styles.workoutCard}>
      <View style={styles.workoutTop}>
        <Icon name={type.icon} size={52} color={accent} />
        <PlayButton
          label={`Start ${type.name}`}
          color={type.color}
          onPress={() => router.push({ pathname: '/workout/[type]', params: { type: type.id } })}
        />
      </View>
      <ThemedText style={styles.workoutName}>{type.name}</ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/log-workout', params: { type: type.id } })}
        style={({ pressed }) => [
          styles.logPill,
          { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
        ]}>
        <SymbolView
          name={{ ios: 'plus', android: 'add', web: 'add' }}
          size={14}
          tintColor={theme.text}
        />
        <ThemedText type="small">Log past session</ThemedText>
      </Pressable>
    </Card>
  );
}

function WeekStat({ value, label }: { value: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.flex}>
      <ThemedText type="display" style={{ color: theme.tintText }}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chips: {
    gap: Spacing.two,
  },
  weekRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  workoutCard: {
    gap: Spacing.two,
  },
  workoutTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  workoutName: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: 800,
    letterSpacing: -0.6,
  },
  logPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    marginTop: Spacing.one,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
