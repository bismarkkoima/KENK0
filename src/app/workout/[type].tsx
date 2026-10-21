import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Field, GradientFill, type IconName } from '@/components/ui';
import { Fonts, OnGradient, Spacing, type GradientName } from '@/constants/theme';
import {
  EFFORT_LEVELS,
  estimateCalories,
  formatDuration,
  getWorkoutType,
  type WorkoutType,
} from '@/data/workouts';
import { addWorkout, getGoals } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';
import { toDayKey } from '@/lib/dates';
import { goBack } from '@/lib/navigation';

// Browsers' wake lock needs a user gesture and errors otherwise; phones keep the screen on.
const useKeepScreenOn = Platform.OS === 'web' ? () => {} : useKeepAwake;

export default function WorkoutScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  return <LiveWorkout type={getWorkoutType(type)} />;
}

function LiveWorkout({ type }: { type: WorkoutType }) {
  useKeepScreenOn();
  const db = useSQLiteContext();
  const theme = useTheme();
  const accent = theme[type.color === 'tint' ? 'tintText' : type.color];

  // Elapsed time comes from timestamps, so it stays right even if the JS timer is throttled.
  const [startedAt] = useState(() => new Date());
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [runningSince, setRunningSince] = useState<number | null>(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [ended, setEnded] = useState(false);
  const [weightKg, setWeightKg] = useState(70);

  useEffect(() => {
    getGoals(db).then((g) => setWeightKg(g.weightKg));
  }, [db]);

  useEffect(() => {
    if (runningSince === null) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [runningSince]);

  const elapsedMs = accumulatedMs + (runningSince !== null ? now - runningSince : 0);
  const seconds = Math.floor(elapsedMs / 1000);
  const calories = estimateCalories(type, seconds, weightKg);
  const running = runningSince !== null;

  function pause() {
    if (runningSince === null) return;
    setAccumulatedMs((ms) => ms + Date.now() - runningSince);
    setRunningSince(null);
  }

  function resume() {
    setNow(Date.now());
    setRunningSince(Date.now());
  }

  function end() {
    pause();
    setEnded(true);
  }

  if (ended) {
    return (
      <Summary
        type={type}
        seconds={seconds}
        weightKg={weightKg}
        startedAt={startedAt}
        onResume={() => {
          setEnded(false);
          resume();
        }}
      />
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Icon name={type.icon} size={30} color={accent} />
          <ThemedText type="heading">{type.name}</ThemedText>
        </View>

        <View style={styles.metrics}>
          <ThemedText style={[styles.time, { color: theme.skyText }]}>
            {formatDuration(seconds)}
          </ThemedText>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.caption}>
            {running ? 'ELAPSED' : 'PAUSED'}
          </ThemedText>

          <View style={styles.metricRow}>
            <Metric value={String(calories)} unit="KCAL" label="Active calories" color="move" />
            <Metric
              value={String(Math.floor(seconds / 60))}
              unit="MIN"
              label="Exercise"
              color="tint"
            />
          </View>
        </View>

        <View style={styles.controls}>
          <RoundControl
            label={running ? 'Pause' : 'Resume'}
            icon={
              running
                ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
                : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
            }
            color="warm"
            onPress={running ? pause : resume}
          />
          <RoundControl
            label="End"
            icon={{ ios: 'xmark', android: 'close', web: 'close' }}
            color="move"
            onPress={end}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function Metric({
  value,
  unit,
  label,
  color,
}: {
  value: string;
  unit: string;
  label: string;
  color: GradientName;
}) {
  const theme = useTheme();
  const c = theme[color === 'tint' ? 'tintText' : color];
  return (
    <View style={styles.metric}>
      <ThemedText style={[styles.metricValue, { color: c }]}>
        {value}
        <ThemedText style={[styles.metricUnit, { color: c }]}> {unit}</ThemedText>
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function RoundControl({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: IconName;
  color: GradientName;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.control, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
      <GradientFill name={color} style={styles.controlCircle}>
        <Icon name={icon} size={36} color={OnGradient[color]} />
      </GradientFill>
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  );
}

function Summary({
  type,
  seconds,
  weightKg,
  startedAt,
  onResume,
}: {
  type: WorkoutType;
  seconds: number;
  weightKg: number;
  startedAt: Date;
  onResume: () => void;
}) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [effort, setEffort] = useState(3);
  const [distance, setDistance] = useState('');
  const [note, setNote] = useState('');
  const calories = estimateCalories(type, seconds, weightKg, effort);
  const km = Number(distance.replace(',', '.'));

  async function save() {
    await addWorkout(db, {
      day: toDayKey(startedAt),
      type: type.id,
      started_at: startedAt.toISOString(),
      duration_sec: seconds,
      calories,
      distance_km: type.distance && km > 0 ? km : null,
      effort,
      note: note.trim(),
    });
    goBack();
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.summary}
      keyboardShouldPersistTaps="handled">
      <SafeAreaView style={styles.summaryInner}>
        <ThemedText type="subtitle">Nice work!</ThemedText>
        <Card accent={type.color}>
          <View style={styles.header}>
            <Icon
              name={type.icon}
              size={28}
              color={theme[type.color === 'tint' ? 'tintText' : type.color]}
            />
            <ThemedText type="heading">{type.name}</ThemedText>
          </View>
          <View style={styles.metricRow}>
            <Metric value={formatDuration(seconds)} unit="" label="Duration" color="tint" />
            <Metric value={String(calories)} unit="KCAL" label="Active calories" color="move" />
          </View>
        </Card>

        <Card>
          <ThemedText type="smallBold">How hard was it?</ThemedText>
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
          {type.distance && (
            <Field
              label="Distance (km, optional)"
              value={distance}
              onChangeText={setDistance}
              keyboardType="decimal-pad"
              placeholder="e.g. 5.2"
            />
          )}
          <Field
            label="Notes (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="How did it feel?"
            multiline
          />
        </Card>

        <Button
          label="Save workout"
          icon={{ ios: 'checkmark', android: 'check', web: 'check' }}
          color={type.color}
          disabled={seconds < 1}
          onPress={save}
        />
        <Button label="Resume" variant="secondary" onPress={onResume} />
        <Button label="Discard" variant="secondary" onPress={() => goBack()} />
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  safe: {
    flex: 1,
    padding: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
  },
  metrics: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.one,
  },
  time: {
    fontFamily: Fonts.rounded,
    fontSize: 84,
    lineHeight: 96,
    fontWeight: 700,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  caption: {
    letterSpacing: 1.4,
    fontSize: 12,
  },
  metricRow: {
    flexDirection: 'row',
    gap: Spacing.four,
    marginTop: Spacing.four,
  },
  metric: {
    flex: 1,
    gap: Spacing.half,
  },
  metricValue: {
    fontFamily: Fonts.rounded,
    fontSize: 40,
    lineHeight: 46,
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    fontFamily: Fonts.rounded,
    fontSize: 18,
    fontWeight: 700,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: Spacing.three,
  },
  control: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  controlCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    flexGrow: 1,
  },
  summaryInner: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
