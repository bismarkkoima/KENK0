import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getMeditation, type Meditation } from '@/data/meditations';
import { getSetting, logMeditation, saveSetting } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';

const MIN_SCALE = 0.55;
const MAX_SCALE = 1;

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const meditation = getMeditation(id);

  if (!meditation) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Session not found.</ThemedText>
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </ThemedView>
    );
  }
  return <Session meditation={meditation} />;
}

function Session({ meditation }: { meditation: Meditation }) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const total = meditation.minutes * 60;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const logged = useRef(false);
  const [voice, setVoice] = useState(true);

  // Restore the voice guidance preference.
  useEffect(() => {
    getSetting<boolean>(db, 'voiceGuide').then((v) => {
      if (v !== null) setVoice(v);
    });
  }, [db]);

  function toggleVoice() {
    setVoice(!voice);
    saveSetting(db, 'voiceGuide', !voice);
  }

  const finished = elapsed >= total;

  // Session clock.
  useEffect(() => {
    if (!running || finished) return;
    const timer = setInterval(() => setElapsed((e) => Math.min(e + 1, total)), 1000);
    return () => clearInterval(timer);
  }, [running, finished, total]);

  // Record a completed session exactly once.
  useEffect(() => {
    if (finished && !logged.current) {
      logged.current = true;
      logMeditation(db, meditation.id, meditation.minutes).then(() => setDone(true));
    }
  }, [finished, db, meditation]);

  // Breathing circle: grows on inhale, holds, shrinks on exhale, holds.
  const scale = useSharedValue(MIN_SCALE);
  useEffect(() => {
    if (!running || finished) {
      cancelAnimation(scale);
      return;
    }
    const [inhale, hold1, exhale, hold2] = meditation.breath.map((s) => s * 1000);
    const ease = Easing.inOut(Easing.sin);
    scale.set(MIN_SCALE);
    scale.set(
      withRepeat(
        withSequence(
          withTiming(MAX_SCALE, { duration: inhale, easing: ease }),
          withTiming(MAX_SCALE, { duration: hold1 }),
          withTiming(MIN_SCALE, { duration: exhale, easing: ease }),
          withTiming(MIN_SCALE, { duration: hold2 }),
        ),
        -1,
      ),
    );
  }, [running, finished, meditation, scale]);

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  async function endEarly() {
    // Count partial sessions of at least a minute toward mindful minutes.
    if (!logged.current && elapsed >= 60) {
      logged.current = true;
      await logMeditation(db, meditation.id, Math.round((elapsed / 60) * 10) / 10);
    }
    router.back();
  }

  const step = [...meditation.steps].reverse().find((s) => elapsed >= s.at);
  const remaining = total - elapsed;
  const guideText = done
    ? `Well done — ${meditation.minutes} mindful minutes added to today.`
    : step?.text;

  // Read each guide step aloud as it appears.
  useEffect(() => {
    if (!voice || !guideText || (!running && !done)) return;
    Speech.speak(guideText, { rate: 0.9, pitch: 1 });
    return () => {
      Speech.stop();
    };
  }, [voice, running, done, guideText]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <ThemedText type="smallBold" style={styles.title}>
            {meditation.title}
          </ThemedText>
          <Pressable
            onPress={toggleVoice}
            hitSlop={12}
            accessibilityRole="switch"
            accessibilityState={{ checked: voice }}>
            <ThemedText style={{ color: theme.calm }}>
              {voice ? 'Voice on' : 'Voice off'}
            </ThemedText>
          </Pressable>
          <Pressable onPress={endEarly} hitSlop={12}>
            <ThemedText style={{ color: theme.calm }}>{done ? 'Close' : 'End'}</ThemedText>
          </Pressable>
        </View>

        <View style={styles.center}>
          <View style={styles.circleBox}>
            <Animated.View
              style={[styles.circle, { backgroundColor: theme.calmSoft }, circleStyle]}
            />
            <View style={[styles.core, { backgroundColor: theme.calm }]}>
              <ThemedText style={styles.phase}>
                {done ? 'Done' : running ? phaseLabel(meditation.breath, elapsed) : 'Paused'}
              </ThemedText>
            </View>
          </View>

          <ThemedText style={styles.timer}>{formatClock(remaining)}</ThemedText>
          <ThemedText style={styles.guide} themeColor="textSecondary">
            {guideText}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          {done ? (
            <Button label="Finish" color="calm" onPress={() => router.back()} />
          ) : (
            <Button
              label={running ? 'Pause' : 'Resume'}
              color="calm"
              onPress={() => setRunning((r) => !r)}
            />
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function phaseLabel(breath: Meditation['breath'], elapsed: number): string {
  const cycle = breath.reduce((a, b) => a + b, 0);
  let t = elapsed % cycle;
  const labels = ['Breathe in', 'Hold', 'Breathe out', 'Hold'];
  for (let i = 0; i < breath.length; i++) {
    if (t < breath[i]) return labels[i];
    t -= breath[i];
  }
  return labels[0];
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    padding: Spacing.three,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  circleBox: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  core: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phase: {
    color: '#ffffff',
    fontWeight: 700,
  },
  timer: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: 300,
    fontVariant: ['tabular-nums'],
  },
  guide: {
    textAlign: 'center',
    maxWidth: 320,
    minHeight: 72,
  },
  actions: {
    paddingBottom: Spacing.three,
  },
});
