import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Field, IconTile, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { EFFORT_LEVELS, WORKOUT_TYPES, estimateCalories, getWorkoutType } from '@/data/workouts';
import { addWorkout, getGoals } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { addDays, formatDayLabel, toDayKey } from '@/lib/dates';
import { goBack } from '@/lib/navigation';

const DAY_OPTIONS = [0, -1, -2];

export default function LogWorkoutScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ type?: string }>();
  const { data: goals, db } = useFocusedQuery(getGoals);
  const [typeId, setTypeId] = useState(params.type ?? 'walk');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  // The selected activity always stays visible, even when it doesn't match the search.
  const shown = WORKOUT_TYPES.filter(
    (t) => !q || t.id === typeId || t.name.toLowerCase().includes(q),
  );
  const [minutes, setMinutes] = useState('30');
  const [effort, setEffort] = useState(3);
  const [distance, setDistance] = useState('');
  const [dayOffset, setDayOffset] = useState(0);

  const type = getWorkoutType(typeId);
  const mins = Number(minutes);
  const valid = Number.isFinite(mins) && mins > 0 && mins <= 24 * 60;
  const calories = valid ? estimateCalories(type, mins * 60, goals?.weightKg ?? 70, effort) : 0;
  const km = Number(distance.replace(',', '.'));

  async function save() {
    const day = addDays(toDayKey(), dayOffset);
    const end = new Date();
    end.setDate(end.getDate() + dayOffset);
    const started = new Date(end.getTime() - mins * 60_000);
    await addWorkout(db, {
      day,
      type: type.id,
      started_at: started.toISOString(),
      duration_sec: Math.round(mins * 60),
      calories,
      distance_km: type.distance && km > 0 ? km : null,
      effort,
      note: '',
    });
    goBack();
  }

  return (
    <Screen tabs={false}>
      <Card>
        <ThemedText type="smallBold">Activity</ThemedText>
        <Field
          placeholder="Search activities"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        <View style={styles.grid}>
          {shown.map((t) => {
            const selected = t.id === typeId;
            return (
              <Pressable
                key={t.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={t.name}
                onPress={() => setTypeId(t.id)}
                style={[
                  styles.typeCell,
                  {
                    backgroundColor: selected ? theme.backgroundSelected : 'transparent',
                    borderColor: selected ? theme.tintText : 'transparent',
                  },
                ]}>
                <IconTile icon={t.icon} color={t.color} size={40} />
                <ThemedText type="small" numberOfLines={1} style={styles.typeLabel}>
                  {t.name.replace('Outdoor ', '')}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <ThemedText type="smallBold">When</ThemedText>
        <View style={styles.chips}>
          {DAY_OPTIONS.map((d) => (
            <Chip
              key={d}
              label={formatDayLabel(addDays(toDayKey(), d))}
              selected={dayOffset === d}
              onPress={() => setDayOffset(d)}
            />
          ))}
        </View>
        <View style={styles.row}>
          <Field
            label="Duration (min)"
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="number-pad"
          />
          {type.distance && (
            <Field
              label="Distance (km)"
              value={distance}
              onChangeText={setDistance}
              keyboardType="decimal-pad"
              placeholder="Optional"
            />
          )}
        </View>
        <ThemedText type="smallBold">Effort</ThemedText>
        <View style={styles.chips}>
          {EFFORT_LEVELS.map((e) => (
            <Chip
              key={e.value}
              label={e.label}
              selected={effort === e.value}
              onPress={() => setEffort(e.value)}
            />
          ))}
        </View>
      </Card>

      <Card accent="move" style={styles.estimate}>
        <ThemedText type="small" themeColor="textSecondary">
          Estimated active calories
        </ThemedText>
        <ThemedText type="display" style={{ color: theme.move }}>
          {calories} kcal
        </ThemedText>
      </Card>

      <Button label={`Save ${type.name}`} disabled={!valid} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  typeCell: {
    width: '24%',
    minWidth: 72,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  typeLabel: {
    fontSize: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  estimate: {
    gap: Spacing.half,
  },
});
