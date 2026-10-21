import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { TipCard } from '@/components/tip-card';
import {
  Card,
  CardTitle,
  GradientFill,
  IconButton,
  PlayButton,
  Ring,
  Rings,
  Screen,
} from '@/components/ui';
import { MoodCard, WaterCard } from '@/components/wellness-cards';
import { Fonts, OnGradient, Spacing, type GradientName } from '@/constants/theme';
import { getMeditation, MEDITATIONS } from '@/data/meditations';
import {
  getDaySummaries,
  getGoals,
  getMoodCheckin,
  getStreak,
  logWater,
  saveMoodCheckin,
  undoLastWater,
} from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTodaySteps, type StepData } from '@/hooks/use-steps';
import { useTheme } from '@/hooks/use-theme';
import { greeting, toDayKey } from '@/lib/dates';
import { radialGlow } from '@/lib/style';

export default function SummaryScreen() {
  const theme = useTheme();
  const today = toDayKey();
  const steps = useTodaySteps();
  const { data, db, reload } = useFocusedQuery(async (db) => {
    const [summary] = await getDaySummaries(db, today, today);
    return {
      summary,
      goals: await getGoals(db),
      streak: await getStreak(db),
      checkin: await getMoodCheckin(db, today),
    };
  }, today);

  if (!data) return <Screen title="Summary" />;
  const { summary, goals, streak, checkin } = data;
  const caloriesLeft = Math.round(goals.calories - summary.calories);

  return (
    <Screen
      title="Summary"
      subtitle={greeting()}
      right={
        <>
          <IconButton
            icon={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
            label="Reminders"
            onPress={() => router.push('/reminders')}
          />
          <IconButton
            icon={{ ios: 'target', android: 'track_changes', web: 'track_changes' }}
            label="Goals"
            onPress={() => router.push('/goals')}
          />
        </>
      }>
      <TipCard
        id="summary-intro"
        icon={{ ios: 'circle.circle', android: 'donut_large', web: 'donut_large' }}
        title="Close your rings"
        body="Move fills with calories from workouts, Exercise with workout minutes and Mindful with meditation. Change any target with the goals button above."
      />

      <Card>
        <CardTitle
          right={
            streak > 0 && (
              <View style={[styles.streak, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="smallBold">🔥 {streak}</ThemedText>
              </View>
            )
          }>
          Activity Rings
        </CardTitle>
        <View style={styles.ringsRow}>
          <Rings
            size={150}
            stroke={18}
            gap={3}
            rings={[
              { progress: summary.activeCalories / goals.moveCalories, color: 'move' },
              { progress: summary.exerciseMinutes / goals.exerciseMinutes, color: 'tint' },
              { progress: summary.meditationMinutes / goals.meditationMinutes, color: 'mind' },
            ]}
          />
          <View style={styles.ringLegend}>
            <RingStat
              label="Move"
              value={Math.round(summary.activeCalories)}
              goal={goals.moveCalories}
              unit="CAL"
              color="move"
            />
            <RingStat
              label="Exercise"
              value={Math.round(summary.exerciseMinutes)}
              goal={goals.exerciseMinutes}
              unit="MIN"
              color="tint"
            />
            <RingStat
              label="Mindful"
              value={Math.round(summary.meditationMinutes)}
              goal={goals.meditationMinutes}
              unit="MIN"
              color="mind"
            />
          </View>
        </View>
      </Card>

      {steps && <StepsCard steps={steps} />}

      <WorkoutPrompt />

      <MoodCard
        key={checkin ? 'checked-in' : 'new'}
        checkin={checkin}
        day={today}
        onSave={async (c) => {
          await saveMoodCheckin(db, c);
          reload();
        }}
      />

      <Pressable onPress={() => router.push('/food')} accessibilityRole="button">
        <Card>
          <CardTitle right={<Chevron />}>Nutrition</CardTitle>
          <View style={styles.nutritionRow}>
            <View style={styles.flex}>
              <ThemedText type="smallBold">{caloriesLeft >= 0 ? 'Left today' : 'Over'}</ThemedText>
              <ThemedText
                type="display"
                style={{ color: caloriesLeft >= 0 ? theme.tintText : theme.danger }}>
                {Math.abs(caloriesLeft)}
                <ThemedText
                  type="heading"
                  style={{ color: caloriesLeft >= 0 ? theme.tintText : theme.danger }}>
                  {' '}
                  KCAL
                </ThemedText>
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {Math.round(summary.calories)} eaten of {goals.calories}
              </ThemedText>
            </View>
            <MacroRing label="P" value={summary.protein} goal={goals.protein} color="tint" />
            <MacroRing label="C" value={summary.carbs} goal={goals.carbs} color="warm" />
            <MacroRing label="F" value={summary.fat} goal={goals.fat} color="water" />
          </View>
        </Card>
      </Pressable>

      <MindfulCard suggestionId={suggestMeditationId()} />

      <WaterCard
        ml={summary.waterMl}
        goal={goals.waterMl}
        onAdd={async (ml) => {
          await logWater(db, ml, today);
          reload();
        }}
        onUndo={async () => {
          await undoLastWater(db, today);
          reload();
        }}
      />
    </Screen>
  );
}

function RingStat({
  label,
  value,
  goal,
  unit,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: GradientName;
}) {
  const theme = useTheme();
  const c = theme[color === 'tint' ? 'tintText' : color];
  return (
    <View>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText style={[styles.ringValue, { color: c }]}>
        {value}/{goal}
        <ThemedText style={[styles.ringUnit, { color: c }]}>{unit}</ThemedText>
      </ThemedText>
    </View>
  );
}

function StepsCard({ steps }: { steps: StepData }) {
  const theme = useTheme();
  const max = Math.max(...steps.hourly, 1);
  return (
    <Card>
      <CardTitle>Step Count</CardTitle>
      <View>
        <ThemedText type="smallBold">Today</ThemedText>
        <ThemedText type="display" style={{ color: theme.calm }}>
          {steps.total.toLocaleString()}
        </ThemedText>
      </View>
      <View style={styles.hourly}>
        {steps.hourly.map((v, h) => (
          <View key={h} style={styles.hourSlot}>
            <View
              style={[
                styles.hourGrid,
                { borderColor: h % 6 === 0 ? theme.textSecondary : theme.backgroundSelected },
              ]}
            />
            {v > 0 && (
              <View
                style={{
                  height: `${Math.max((v / max) * 100, 6)}%`,
                  width: 5,
                  borderRadius: 3,
                  backgroundColor: theme.calm,
                }}
              />
            )}
          </View>
        ))}
      </View>
      <View style={styles.hourLabels}>
        {['00', '06', '12', '18'].map((l) => (
          <ThemedText key={l} type="small" themeColor="textSecondary" style={styles.hourLabel}>
            {l}
          </ThemedText>
        ))}
      </View>
    </Card>
  );
}

function WorkoutPrompt() {
  const theme = useTheme();
  return (
    <Card accent="tint" style={styles.workout}>
      <View style={styles.workoutTop}>
        <SymbolView
          name={{ ios: 'figure.run', android: 'directions_run', web: 'directions_run' }}
          size={46}
          tintColor={theme.tintText}
        />
        <PlayButton label="Start a workout" onPress={() => router.push('/activity')} />
      </View>
      <ThemedText style={styles.workoutTitle}>Start a Workout</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Walk, run, cycle, football, strength, yoga and more.
      </ThemedText>
    </Card>
  );
}

function MacroRing({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: GradientName;
}) {
  return (
    <Ring size={52} stroke={6} progress={value / goal} color={color} warnOver>
      <ThemedText type="smallBold" style={styles.macroLabel}>
        {label}
      </ThemedText>
    </Ring>
  );
}

function MindfulCard({ suggestionId }: { suggestionId: string }) {
  const suggestion = getMeditation(suggestionId) ?? MEDITATIONS[0];
  const open = () => router.push({ pathname: '/session/[id]', params: { id: suggestion.id } });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Start ${suggestion.title}`}
      onPress={open}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <GradientFill name="calm" style={styles.mindful}>
        <View style={[styles.mindfulGlow, radialGlow('rgba(255,255,255,0.35)')]} />
        <View style={styles.flex}>
          <ThemedText type="smallBold" style={styles.mindfulEyebrow}>
            SUGGESTED FOR NOW
          </ThemedText>
          <ThemedText style={styles.mindfulTitle}>{suggestion.title}</ThemedText>
          <ThemedText type="small" style={styles.mindfulSub}>
            {suggestion.minutes} min · {suggestion.description}
          </ThemedText>
        </View>
        <View style={styles.playWhite}>
          <SymbolView
            name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
            size={24}
            tintColor="#5B48E8"
          />
        </View>
      </GradientFill>
    </Pressable>
  );
}

function Chevron() {
  const theme = useTheme();
  return (
    <View style={[styles.chevron, { backgroundColor: theme.backgroundSelected }]}>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={14}
        weight="bold"
        tintColor={theme.textSecondary}
      />
    </View>
  );
}

/** Pick a session that fits the time of day. */
function suggestMeditationId() {
  const hour = new Date().getHours();
  return hour < 11 ? 'morning-reset' : hour >= 21 ? 'sleep-wind-down' : 'box-breathing';
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  streak: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: 999,
  },
  ringsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  ringLegend: {
    flex: 1,
    gap: Spacing.two + 2,
  },
  ringValue: {
    fontFamily: Fonts.rounded,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
  ringUnit: {
    fontFamily: Fonts.rounded,
    fontSize: 14,
    fontWeight: 700,
  },
  hourly: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  hourSlot: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  hourGrid: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  hourLabels: {
    flexDirection: 'row',
  },
  hourLabel: {
    flex: 1,
    fontSize: 12,
  },
  workout: {
    gap: Spacing.one,
  },
  workoutTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  workoutTitle: {
    fontFamily: Fonts.rounded,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 800,
    letterSpacing: -0.5,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  macroLabel: {
    fontSize: 12,
  },
  mindful: {
    borderRadius: 28,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    overflow: 'hidden',
  },
  mindfulGlow: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  mindfulEyebrow: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  mindfulTitle: {
    color: OnGradient.calm,
    fontFamily: Fonts.rounded,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 800,
  },
  mindfulSub: {
    color: 'rgba(255,255,255,0.88)',
  },
  playWhite: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
