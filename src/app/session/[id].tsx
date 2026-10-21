import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { AuroraBackground, Button, Glass, GradientFill, IconButton } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { CATEGORY_LABELS, getMeditation, type Meditation } from '@/data/meditations';
import { getSetting, logMeditation, saveSetting } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';
import { linearGradient, radialGlow } from '@/lib/style';

const RING_SIZE = 300;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const ORB_SIZE = 168;
/** Orb scale at the bottom of an exhale and the top of an inhale. */
const MIN_SCALE = 0.72;
const MAX_SCALE = 1;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const meditation = getMeditation(id);

  if (!meditation) {
    return (
      <View style={[styles.fill, styles.center]}>
        <AuroraBackground variant="calm" />
        <ThemedText>Session not found.</ThemedText>
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </View>
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

  // Progress ring glides between the once-a-second clock ticks.
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withTiming(elapsed / total, { duration: 1000, easing: Easing.linear }));
  }, [elapsed, total, progress]);
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.get()),
  }));

  // Breathing orb: grows on inhale, holds, shrinks on exhale, holds.
  const breath = useSharedValue(MIN_SCALE);
  useEffect(() => {
    if (!running || finished) {
      cancelAnimation(breath);
      return;
    }
    const [inhale, hold1, exhale, hold2] = meditation.breath.map((s) => s * 1000);
    const ease = Easing.inOut(Easing.sin);
    breath.set(MIN_SCALE);
    breath.set(
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
  }, [running, finished, meditation, breath]);

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: breath.get() }] }));
  // The halo breathes further than the orb and brightens on the inhale.
  const haloStyle = useAnimatedStyle(() => {
    const t = (breath.get() - MIN_SCALE) / (MAX_SCALE - MIN_SCALE);
    return { transform: [{ scale: 0.85 + t * 0.4 }], opacity: 0.45 + t * 0.55 };
  });

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
  const phase = breathPhase(meditation.breath, elapsed);
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
    <View style={styles.fill}>
      <AuroraBackground variant="calm" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.eyebrow}>
            {CATEGORY_LABELS[meditation.category]} · {meditation.minutes} min
          </ThemedText>
          <ThemedText style={styles.title}>{meditation.title}</ThemedText>
        </View>

        <View style={styles.stage}>
          <View style={styles.ringBox}>
            <Animated.View style={[styles.halo, radialGlow(theme.calm), haloStyle]} />

            <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ring}>
              <Defs>
                <LinearGradient id="session-ring" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={theme.sky} />
                  <Stop offset="1" stopColor={theme.skyEnd} />
                </LinearGradient>
              </Defs>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={theme.glassBorder}
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke="url(#session-ring)"
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                animatedProps={ringProps}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>

            <Animated.View
              style={[
                styles.orb,
                linearGradient(theme.calm, theme.calmEnd, 150),
                { boxShadow: `0 0 60px ${theme.calm}99, inset 0 -12px 30px rgba(0,0,0,0.18)` },
                orbStyle,
              ]}>
              <View style={[styles.orbHighlight, radialGlow('rgba(255,255,255,0.55)')]} />
              {done ? (
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={56}
                  tintColor="#ffffff"
                />
              ) : (
                <>
                  <ThemedText style={styles.phase}>{running ? phase.label : 'Paused'}</ThemedText>
                  {running && (
                    <ThemedText style={styles.phaseCount}>{phase.secondsLeft}</ThemedText>
                  )}
                </>
              )}
            </Animated.View>
          </View>

          <View style={styles.clock}>
            <ThemedText style={[styles.time, { color: theme.skyText }]}>
              {formatClock(remaining)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {done ? 'Session complete' : `remaining of ${formatClock(total)}`}
            </ThemedText>
          </View>
        </View>

        <Glass style={styles.guide}>
          <ThemedText style={styles.guideText}>{guideText}</ThemedText>
        </Glass>

        {done ? (
          <Button label="Finish" color="calm" icon={CHECK_ICON} onPress={() => router.back()} />
        ) : (
          <View style={styles.controls}>
            <IconButton
              icon={
                voice
                  ? { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }
                  : { ios: 'speaker.slash.fill', android: 'volume_off', web: 'volume_off' }
              }
              label={voice ? 'Mute voice guidance' : 'Turn on voice guidance'}
              onPress={toggleVoice}
              size={56}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={running ? 'Pause' : 'Resume'}
              onPress={() => setRunning((r) => !r)}
              style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}>
              <GradientFill
                name="calm"
                style={[styles.play, { boxShadow: `0 12px 32px ${theme.calm}80` }]}>
                <SymbolView
                  name={
                    running
                      ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
                      : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
                  }
                  size={34}
                  tintColor="#ffffff"
                />
              </GradientFill>
            </Pressable>
            <IconButton
              icon={{ ios: 'xmark', android: 'close', web: 'close' }}
              label="End session"
              onPress={endEarly}
              size={56}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const CHECK_ICON = { ios: 'checkmark', android: 'check', web: 'check' } as const;

const PHASE_LABELS = ['Breathe in', 'Hold', 'Breathe out', 'Hold'];

/** Which part of the breathing cycle we're in, and how many seconds of it are left. */
function breathPhase(breath: Meditation['breath'], elapsed: number) {
  const cycle = breath.reduce((a, b) => a + b, 0);
  let t = elapsed % cycle;
  for (let i = 0; i < breath.length; i++) {
    if (t < breath[i]) return { label: PHASE_LABELS[i], secondsLeft: breath[i] - t };
    t -= breath[i];
  }
  return { label: PHASE_LABELS[0], secondsLeft: breath[0] };
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.three,
    gap: Spacing.half,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
    letterSpacing: -0.4,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  ringBox: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  halo: {
    position: 'absolute',
    width: RING_SIZE + 60,
    height: RING_SIZE + 60,
    borderRadius: (RING_SIZE + 60) / 2,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orbHighlight: {
    position: 'absolute',
    top: -ORB_SIZE * 0.25,
    left: -ORB_SIZE * 0.1,
    width: ORB_SIZE * 0.9,
    height: ORB_SIZE * 0.9,
    borderRadius: ORB_SIZE,
  },
  phase: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 700,
    letterSpacing: 0.2,
  },
  phaseCount: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 600,
    fontVariant: ['tabular-nums'],
  },
  clock: {
    alignItems: 'center',
  },
  time: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: 200,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  guide: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    minHeight: 84,
    justifyContent: 'center',
  },
  guideText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 23,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
    paddingBottom: Spacing.two,
  },
  play: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
