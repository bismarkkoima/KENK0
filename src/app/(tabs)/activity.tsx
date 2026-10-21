import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { TipCard } from '@/components/tip-card';
import {
  Card,
  CardTitle,
  Chip,
  Field,
  IconButton,
  IconTile,
  PlayButton,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { accentText, Spacing } from '@/constants/theme';
import {
  caloriesPerHour,
  formatDuration,
  getWorkoutType,
  WORKOUT_GROUPS,
  WORKOUT_TYPES,
  type WorkoutGroup,
  type WorkoutType,
} from '@/data/workouts';
import {
  deleteWorkout,
  getDaySummaries,
  getGoals,
  getRecentWorkouts,
  type Workout,
} from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { addDays, formatDayLabel, toDayKey } from '@/lib/dates';

const DEFAULT_FAVOURITES = ['walk', 'run', 'weight-machines'];

function startWorkout(type: WorkoutType) {
  router.push({ pathname: '/workout/[type]', params: { type: type.id } });
}

function logWorkout(type: WorkoutType) {
  router.push({ pathname: '/log-workout', params: { type: type.id } });
}

export default function ActivityScreen() {
  const [group, setGroup] = useState<WorkoutGroup | null>(null);
  const [query, setQuery] = useState('');
  const today = toDayKey();
  const { data, db, reload } = useFocusedQuery(async (db) => {
    const week = await getDaySummaries(db, addDays(today, -6), today);
    const favourites = await db.getAllAsync<{ type: string }>(
      'SELECT type FROM workouts GROUP BY type ORDER BY COUNT(*) DESC LIMIT 3',
    );
    return {
      weightKg: (await getGoals(db)).weightKg,
      favourites: favourites.map((f) => f.type),
      recent: await getRecentWorkouts(db, 8),
      week: {
        count: week.reduce((s, d) => s + d.workouts, 0),
        minutes: week.reduce((s, d) => s + d.exerciseMinutes, 0),
        calories: week.reduce((s, d) => s + d.activeCalories, 0),
      },
    };
  }, today);

  const weightKg = data?.weightKg ?? 70;
  const favouriteIds = [...(data?.favourites ?? []), ...DEFAULT_FAVOURITES]
    .filter((id, i, all) => all.indexOf(id) === i)
    .slice(0, 3);
  const q = query.trim().toLowerCase();
  const list = WORKOUT_TYPES.filter(
    (t) => (!group || t.group === group) && (!q || t.name.toLowerCase().includes(q)),
  );

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
          icon={{ mci: 'pencil-plus' }}
          label="Log a past workout"
          onPress={() => router.push('/log-workout')}
        />
      }>
      <TipCard
        id="activity-timer"
        icon={{ mci: 'timer-play' }}
        title="Time it or type it"
        body="Tap play to start a timer and Finish when you're done — a live notification keeps your time and calories in view. Or log a session you've already done."
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

      <SectionTitle>Your favourites</SectionTitle>
      {favouriteIds.map((id) => (
        <FeaturedCard key={id} type={getWorkoutType(id)} weightKg={weightKg} />
      ))}

      <SectionTitle>All sports</SectionTitle>
      <Field
        placeholder={`Search ${WORKOUT_TYPES.length} activities`}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />
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
      <ThemedText type="small" themeColor="textSecondary">
        Estimates for {weightKg} kg at moderate effort. Harder sessions burn more.
      </ThemedText>
      <Card style={styles.list}>
        {list.length === 0 && (
          <ThemedText themeColor="textSecondary">
            No match — try “Other” for anything not listed.
          </ThemedText>
        )}
        {list.map((t, i) => (
          <SportRow key={t.id} type={t} weightKg={weightKg} divider={i > 0} />
        ))}
      </Card>

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

function FeaturedCard({ type, weightKg }: { type: WorkoutType; weightKg: number }) {
  const theme = useTheme();
  const accent = theme[accentText(type.color)];
  return (
    <Card accent={type.color} style={styles.featured}>
      <View style={styles.featuredTop}>
        <Icon name={type.icon} size={52} color={accent} />
        <PlayButton
          label={`Start ${type.name}`}
          color={type.color}
          onPress={() => startWorkout(type)}
        />
      </View>
      <ThemedText style={styles.featuredName}>{type.name}</ThemedText>
      <View style={styles.featuredBottom}>
        <ThemedText type="smallBold" style={{ color: accent }}>
          ≈ {Math.round(caloriesPerHour(type, weightKg) / 2)} kcal / 30 min
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => logWorkout(type)}
          style={({ pressed }) => [
            styles.logPill,
            { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Icon name={{ mci: 'pencil-plus' }} size={14} color={theme.text} />
          <ThemedText type="small">Enter manually</ThemedText>
        </Pressable>
      </View>
    </Card>
  );
}

function SportRow({
  type,
  weightKg,
  divider,
}: {
  type: WorkoutType;
  weightKg: number;
  divider: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.sportRow,
        divider && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.glassBorder },
      ]}>
      <IconTile icon={type.icon} color={type.color} size={40} />
      <View style={styles.flex}>
        <ThemedText type="smallBold">{type.name}</ThemedText>
        <ThemedText type="small" style={{ color: theme[accentText(type.color)] }}>
          ≈ {Math.round(caloriesPerHour(type, weightKg) / 2)} kcal / 30 min
        </ThemedText>
      </View>
      <IconButton
        icon={{ mci: 'pencil-plus' }}
        label={`Enter a ${type.name} session`}
        size={38}
        onPress={() => logWorkout(type)}
      />
      <PlayButton
        label={`Start ${type.name}`}
        color={type.color}
        size={38}
        onPress={() => startWorkout(type)}
      />
    </View>
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
  featured: {
    gap: Spacing.two,
  },
  featuredTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  featuredName: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: 800,
    letterSpacing: -0.8,
  },
  featuredBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  logPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
  },
  list: {
    paddingVertical: Spacing.two,
    gap: 0,
  },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    paddingVertical: Spacing.two + 2,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
