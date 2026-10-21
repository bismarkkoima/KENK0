import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Bars } from '@/components/bars';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, CardTitle, Field, GradientFill, Screen } from '@/components/ui';
import { accentText, OnGradient, Spacing } from '@/constants/theme';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { formatDayLabel } from '@/lib/dates';
import {
  addVital,
  bloodPressureCategory,
  deleteVital,
  getVitals,
  restingHeartCategory,
  type Category,
  type Vital,
} from '@/lib/heart';

const PULSE_SECONDS = 30;

export default function HeartScreen() {
  const { data: vitals = [], db, reload } = useFocusedQuery((db) => getVitals(db));
  const latestHr = vitals.find((v) => v.resting_hr !== null);
  const latestBp = vitals.find((v) => v.systolic !== null && v.diastolic !== null);
  const hrSeries = vitals
    .filter((v) => v.resting_hr !== null)
    .slice(0, 14)
    .reverse();

  function confirmDelete(v: Vital) {
    const remove = async () => {
      await deleteVital(db, v.id);
      reload();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this reading?')) remove();
      return;
    }
    Alert.alert('Delete reading?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: remove },
    ]);
  }

  return (
    <Screen tabs={false}>
      <View style={styles.summaryRow}>
        <SummaryTile
          title="Resting heart rate"
          value={latestHr ? `${latestHr.resting_hr}` : '–'}
          unit="BPM"
          category={latestHr ? restingHeartCategory(latestHr.resting_hr!) : null}
        />
        <SummaryTile
          title="Blood pressure"
          value={latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : '–'}
          unit="mmHg"
          category={
            latestBp ? bloodPressureCategory(latestBp.systolic!, latestBp.diastolic!) : null
          }
        />
      </View>

      {latestBp && (
        <AdviceCard category={bloodPressureCategory(latestBp.systolic!, latestBp.diastolic!)} />
      )}

      <PulseTimer
        onSave={async (bpm) => {
          await addVital(db, { resting_hr: bpm });
          reload();
        }}
      />

      <ManualEntry
        onSave={async (v) => {
          await addVital(db, v);
          reload();
        }}
      />

      {hrSeries.length > 1 && (
        <Card>
          <CardTitle>Resting heart rate trend</CardTitle>
          <Bars
            values={hrSeries.map((v) => v.resting_hr!)}
            labels={hrSeries.length <= 12 ? hrSeries.map((v) => v.day.slice(8)) : undefined}
            color="move"
            max={Math.max(120, ...hrSeries.map((v) => v.resting_hr!))}
          />
          <ThemedText type="small" themeColor="textSecondary">
            Last {hrSeries.length} readings. A falling resting heart rate over months often reflects
            improving fitness.
          </ThemedText>
        </Card>
      )}

      {vitals.length > 0 && (
        <Card>
          <CardTitle>History</CardTitle>
          {vitals.slice(0, 20).map((v) => (
            <Pressable key={v.id} onLongPress={() => confirmDelete(v)} style={styles.historyRow}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.historyDate}>
                {formatDayLabel(v.day)}{' '}
                {new Date(v.measured_at).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </ThemedText>
              <ThemedText type="smallBold">
                {[
                  v.resting_hr !== null ? `${v.resting_hr} bpm` : null,
                  v.systolic !== null ? `${v.systolic}/${v.diastolic} mmHg` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </ThemedText>
            </Pressable>
          ))}
          <ThemedText type="small" themeColor="textSecondary">
            Long-press a reading to delete it.
          </ThemedText>
        </Card>
      )}

      <Card>
        <CardTitle>Heart health guide</CardTitle>
        <Guide
          icon="heart-pulse"
          title="Resting heart rate"
          text="Measure after sitting quietly for 5 minutes, ideally in the morning. 60–100 bpm is typical for adults; fit people are often lower."
        />
        <Guide
          icon="gauge"
          title="Blood pressure"
          text="Normal is below 120/80. Use a validated upper-arm cuff, sit with your back supported and feet flat, and take two readings a minute apart."
        />
        <Guide
          icon="run-fast"
          title="What helps"
          text="150 minutes of moderate activity a week, less salt, not smoking, limiting alcohol, good sleep and managing stress all support a healthy heart."
        />
        <ThemedText type="small" themeColor="textSecondary">
          Sources: American Heart Association; WHO. Kenko does not diagnose conditions — talk to a
          doctor about any concerns. If you have chest pain or trouble breathing, call emergency
          services.
        </ThemedText>
      </Card>
    </Screen>
  );
}

function SummaryTile({
  title,
  value,
  unit,
  category,
}: {
  title: string;
  value: string;
  unit: string;
  category: Category | null;
}) {
  const theme = useTheme();
  const color = category ? theme[accentText(category.color)] : theme.textSecondary;
  return (
    <Card accent={category?.color ?? 'move'} style={styles.tile}>
      <Icon name={{ mci: 'heart-pulse' }} size={26} color={theme.move} />
      <ThemedText type="small" themeColor="textSecondary">
        {title}
      </ThemedText>
      <ThemedText type="display" style={{ color }}>
        {value}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color }}>
        {category ? `${unit} · ${category.label}` : 'No reading yet'}
      </ThemedText>
    </Card>
  );
}

function AdviceCard({ category }: { category: Category }) {
  return (
    <Card accent={category.color}>
      <ThemedText type="smallBold">{category.label}</ThemedText>
      <ThemedText>{category.advice}</ThemedText>
    </Card>
  );
}

/** 30-second pulse count: start the timer, count beats at the wrist or neck, then enter them. */
function PulseTimer({ onSave }: { onSave: (bpm: number) => Promise<void> }) {
  const theme = useTheme();
  const [phase, setPhase] = useState<'idle' | 'counting' | 'enter'>('idle');
  const [left, setLeft] = useState(PULSE_SECONDS);
  const [beats, setBeats] = useState('');
  const beat = useSharedValue(1);

  useEffect(() => {
    if (phase !== 'counting') return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const remaining = PULSE_SECONDS - Math.floor((Date.now() - startedAt) / 1000);
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) setPhase('enter');
    }, 200);
    beat.set(
      withRepeat(
        withSequence(withTiming(1.15, { duration: 160 }), withTiming(1, { duration: 640 })),
        -1,
      ),
    );
    return () => {
      clearInterval(timer);
      cancelAnimation(beat);
    };
  }, [phase, beat]);

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: beat.get() }] }));
  // If they tap Finish early, scale by the time actually counted.
  const measured = Math.max(1, PULSE_SECONDS - left);
  const count = Number(beats);
  const bpm = Math.round((count * 60) / measured);
  const valid = beats !== '' && Number.isFinite(count) && measured >= 10 && bpm >= 25 && bpm <= 220;

  return (
    <Card>
      <CardTitle>Measure your pulse</CardTitle>
      {phase === 'idle' && (
        <>
          <ThemedText themeColor="textSecondary">
            Place two fingers on your wrist or the side of your neck. Tap Start, count every beat
            for 30 seconds, then tap Finish.
          </ThemedText>
          <Button
            label="Start 30-second timer"
            color="move"
            icon={{ mci: 'timer-outline' }}
            onPress={() => {
              setLeft(PULSE_SECONDS);
              setPhase('counting');
            }}
          />
        </>
      )}
      {phase === 'counting' && (
        <View style={styles.counting}>
          <Animated.View style={heartStyle}>
            <GradientFill name="move" raised style={styles.heart}>
              <Icon name={{ mci: 'heart' }} size={44} color={OnGradient.move} />
            </GradientFill>
          </Animated.View>
          <ThemedText style={[styles.countdown, { color: theme.skyText }]}>{left}</ThemedText>
          <ThemedText themeColor="textSecondary">Count your beats…</ThemedText>
          <Button label="Finish" variant="secondary" onPress={() => setPhase('enter')} />
        </View>
      )}
      {phase === 'enter' && (
        <>
          <Field
            label={`How many beats did you count in ${measured} seconds?`}
            value={beats}
            onChangeText={setBeats}
            keyboardType="number-pad"
            placeholder="e.g. 36"
          />
          {measured < 10 && (
            <ThemedText type="small" themeColor="textSecondary">
              Count for at least 10 seconds for a reliable reading.
            </ThemedText>
          )}
          {valid && (
            <ThemedText type="display" style={{ color: theme.move }}>
              {bpm} BPM
            </ThemedText>
          )}
          <Button
            label="Save resting heart rate"
            color="move"
            disabled={!valid}
            onPress={async () => {
              await onSave(bpm);
              setBeats('');
              setPhase('idle');
            }}
          />
          <Button label="Cancel" variant="secondary" onPress={() => setPhase('idle')} />
        </>
      )}
    </Card>
  );
}

function ManualEntry({
  onSave,
}: {
  onSave: (v: {
    resting_hr: number | null;
    systolic: number | null;
    diastolic: number | null;
  }) => Promise<void>;
}) {
  const [hr, setHr] = useState('');
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const hrN = hr ? Number(hr) : null;
  const sysN = sys ? Number(sys) : null;
  const diaN = dia ? Number(dia) : null;
  const hrOk = hrN === null || (hrN >= 25 && hrN <= 220);
  const bpOk =
    (sysN === null && diaN === null) ||
    (sysN !== null && diaN !== null && sysN >= 60 && sysN <= 260 && diaN >= 30 && diaN <= 160);
  const any = hrN !== null || sysN !== null;

  return (
    <Card>
      <CardTitle>Add a reading</CardTitle>
      <ThemedText type="small" themeColor="textSecondary">
        From a blood pressure monitor, smartwatch or fitness tracker.
      </ThemedText>
      <View style={styles.row}>
        <Field label="Pulse (bpm)" value={hr} onChangeText={setHr} keyboardType="number-pad" />
        <Field label="Systolic" value={sys} onChangeText={setSys} keyboardType="number-pad" />
        <Field label="Diastolic" value={dia} onChangeText={setDia} keyboardType="number-pad" />
      </View>
      <Button
        label="Save reading"
        color="move"
        disabled={!any || !hrOk || !bpOk}
        onPress={async () => {
          await onSave({ resting_hr: hrN, systolic: sysN, diastolic: diaN });
          setHr('');
          setSys('');
          setDia('');
        }}
      />
    </Card>
  );
}

function Guide({ icon, title, text }: { icon: string; title: string; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.guide}>
      <Icon name={{ mci: icon as never }} size={22} color={theme.move} />
      <View style={styles.flex}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {text}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  tile: {
    flex: 1,
    gap: Spacing.half,
    padding: Spacing.three,
  },
  counting: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  heart: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  historyDate: {
    flexShrink: 1,
  },
  guide: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
});
