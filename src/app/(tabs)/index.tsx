import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { TipCard } from '@/components/tip-card';
import {
  Card,
  CardTitle,
  GradientFill,
  IconButton,
  IconTile,
  PlayButton,
  ProgressBar,
  Ring,
  Rings,
  Screen,
} from '@/components/ui';
import { MoodCard, WaterCard } from '@/components/wellness-cards';
import { accentText, OnGradient, Spacing, type GradientName } from '@/constants/theme';
import { getMeditation, MEDITATIONS } from '@/data/meditations';
import {
  getDaySummaries,
  getGoals,
  getMoodCheckin,
  getSetting,
  logWater,
  saveMoodCheckin,
  undoLastWater,
  type Goals,
} from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTodaySteps, type StepData } from '@/hooks/use-steps';
import { useTheme } from '@/hooks/use-theme';
import { evaluateBadges, levelFor, rewardPoints, type BadgeProgress } from '@/lib/badges';
import { addDays, greeting, toDayKey } from '@/lib/dates';
import {
  hopeStatOfTheDay,
  personalHopeStats,
  quoteOfTheDay,
  type HopeStat,
} from '@/lib/motivation';
import { getProfile, levelLabel, type Profile } from '@/lib/profile';
import { getLifetimeStats } from '@/lib/stats';
import { linearGradient, radialGlow } from '@/lib/style';

export default function SummaryScreen() {
  const theme = useTheme();
  const today = toDayKey();
  const steps = useTodaySteps();
  const { data, db, reload } = useFocusedQuery(async (db) => {
    const [summary] = await getDaySummaries(db, today, today);
    const week = await getDaySummaries(db, addDays(today, -6), today);
    const goals = await getGoals(db);
    const profile = await getProfile(db);
    const stats = await getLifetimeStats(db);
    const badges = evaluateBadges(stats);
    const seen = (await getSetting<string[]>(db, 'badges:seen')) ?? [];
    return {
      summary,
      goals,
      profile,
      stats,
      weekWorkouts: week.reduce((s, d) => s + d.workouts, 0),
      checkin: await getMoodCheckin(db, today),
      hope: personalHopeStats(stats, goals, profile),
      points: rewardPoints(stats, badges),
      newBadges: badges.filter((b) => b.earned && !seen.includes(b.id)),
      nextBadge: badges.filter((b) => !b.earned).sort((a, b) => b.progress - a.progress)[0],
    };
  }, today);

  // First launch: set up the profile so every goal fits this person.
  useEffect(() => {
    if (data && data.profile === null) {
      router.push({ pathname: '/profile', params: { welcome: '1' } });
    }
  }, [data]);

  if (!data) return <Screen title="Summary" />;
  const { summary, goals, profile, stats, checkin } = data;
  const caloriesLeft = Math.round(goals.calories - summary.calories);

  return (
    <Screen
      title={profile?.name ? `Hi, ${profile.name}` : 'Summary'}
      subtitle={greeting()}
      right={
        <>
          <IconButton
            icon={{ mci: 'trophy-award' }}
            label="Badges and rewards"
            color="gold"
            onPress={() => router.push('/badges')}
          />
          <IconButton
            icon={{ mci: 'cog-outline' }}
            label="Settings"
            onPress={() => router.push('/settings')}
          />
        </>
      }>
      <MotivationCard hope={data.hope} />

      {data.newBadges.length > 0 && <NewBadgeCard badges={data.newBadges} />}

      <Card>
        <CardTitle
          right={
            stats.currentStreak > 0 && (
              <View style={[styles.pill, { backgroundColor: theme.backgroundSelected }]}>
                <Icon name={{ mci: 'fire' }} size={16} color={theme.warm} />
                <ThemedText type="smallBold">{stats.currentStreak}</ThemedText>
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
              { progress: summary.meditationMinutes / goals.meditationMinutes, color: 'sky' },
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
              color="sky"
            />
          </View>
        </View>
      </Card>

      <PlanCard profile={profile} goals={goals} done={data.weekWorkouts} />

      <RewardsCard points={data.points} next={data.nextBadge} />

      {steps && <StepsCard steps={steps} goal={goals.steps} />}

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
                  type="smallBold"
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

      <TipCard
        id="summary-rings"
        icon={{ mci: 'circle-double' }}
        title="Close your rings"
        body="Move fills with calories from workouts, Exercise with workout minutes and Mindful with meditation. Your targets are sized to your profile — change them any time in Settings."
      />
    </Screen>
  );
}

/** Daily quote plus one honest, encouraging stat — tap to see another. */
function MotivationCard({ hope }: { hope: HopeStat[] }) {
  const theme = useTheme();
  const [offset, setOffset] = useState(0);
  const stat = hopeStatOfTheDay(hope, offset);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Shows another encouraging stat"
      onPress={() => setOffset((o) => o + 1)}>
      <View
        style={[
          styles.motivation,
          linearGradient('#0B3D24', '#03140B', 160),
          { boxShadow: `0 14px 34px ${theme.shadow}` },
        ]}>
        <View style={[styles.motivationGlow, radialGlow('rgba(30,224,122,0.45)')]} />
        <View style={[styles.motivationGlow2, radialGlow('rgba(92,200,255,0.30)')]} />
        <ThemedText type="quote" style={styles.quoteMark}>
          “
        </ThemedText>
        <ThemedText type="quote" style={styles.quote}>
          {quoteOfTheDay()}
        </ThemedText>
        <View style={styles.hope}>
          <Icon name={{ mci: 'star-four-points' }} size={18} color="#8BFFC0" />
          <View style={styles.flex}>
            <ThemedText style={styles.hopeText}>{stat.text}</ThemedText>
            {stat.source && (
              <ThemedText type="small" style={styles.hopeSource}>
                Source: {stat.source}
              </ThemedText>
            )}
          </View>
        </View>
        <ThemedText type="small" style={styles.tapHint}>
          Tap for another
        </ThemedText>
      </View>
    </Pressable>
  );
}

function NewBadgeCard({ badges }: { badges: BadgeProgress[] }) {
  const first = badges[0];
  return (
    <Pressable onPress={() => router.push('/badges')} accessibilityRole="button">
      <Card accent="gold" style={styles.row}>
        <GradientFill name={first.color} raised style={styles.badgeMedal}>
          <Icon name={first.icon} size={26} color={OnGradient[first.color]} />
        </GradientFill>
        <View style={styles.flex}>
          <ThemedText type="smallBold">
            {badges.length > 1 ? `${badges.length} new badges!` : 'New badge unlocked!'}
          </ThemedText>
          <ThemedText type="heading">{first.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {first.description} · +{first.points} pts
          </ThemedText>
        </View>
        <Chevron />
      </Card>
    </Pressable>
  );
}

/** This week's workouts against a plan sized to the person's fitness level. */
function PlanCard({
  profile,
  goals,
  done,
}: {
  profile: Profile | null;
  goals: Goals;
  done: number;
}) {
  const theme = useTheme();
  const target = goals.weeklyWorkouts;
  const message =
    done >= target
      ? 'Plan complete. Anything more this week is a bonus — rest counts too.'
      : profile?.fitnessLevel === 'beginner'
        ? `${target - done} to go. Short sessions count — ${goals.exerciseMinutes} minutes is plenty.`
        : `${target - done} to go this week. You’ve got this.`;
  return (
    <Card accent="sky">
      <CardTitle
        right={
          profile && (
            <ThemedText type="small" style={{ color: theme.skyText }}>
              {levelLabel(profile.fitnessLevel)}
            </ThemedText>
          )
        }>
        Your week
      </CardTitle>
      <View style={styles.planDots}>
        {Array.from({ length: Math.max(target, done) }, (_, i) =>
          i < done ? (
            <GradientFill key={i} name="sky" raised style={styles.planDot}>
              <Icon name={{ mci: 'check-bold' }} size={16} color={OnGradient.sky} />
            </GradientFill>
          ) : (
            <View key={i} style={[styles.planDot, { backgroundColor: theme.backgroundSelected }]} />
          ),
        )}
      </View>
      <ThemedText type="smallBold">
        {done} of {target} workouts
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {message}
      </ThemedText>
    </Card>
  );
}

function RewardsCard({ points, next }: { points: number; next?: BadgeProgress }) {
  const theme = useTheme();
  const level = levelFor(points);
  return (
    <Pressable onPress={() => router.push('/badges')} accessibilityRole="button">
      <Card>
        <CardTitle right={<Chevron />}>Rewards</CardTitle>
        <View style={styles.row}>
          <GradientFill name="gold" raised style={styles.levelBadge}>
            <ThemedText style={[styles.levelNumber, { color: OnGradient.gold }]}>
              {level.level}
            </ThemedText>
          </GradientFill>
          <View style={styles.flex}>
            <ThemedText type="smallBold">
              {level.title} · {points.toLocaleString()} pts
            </ThemedText>
            <ProgressBar value={level.progress} max={1} color="gold" height={8} />
            <ThemedText type="small" themeColor="textSecondary">
              {level.next
                ? `${(level.next.min - points).toLocaleString()} pts to ${level.next.title}`
                : 'Top level!'}
            </ThemedText>
          </View>
        </View>
        {next && (
          <View style={styles.row}>
            <IconTile icon={next.icon} color={next.color} size={36} />
            <View style={styles.flex}>
              <ThemedText type="small">
                Next badge: <ThemedText type="smallBold">{next.title}</ThemedText>
              </ThemedText>
              <ThemedText type="small" style={{ color: theme[accentText(next.color)] }}>
                {Math.round(next.progress * 100)}% there · {next.description}
              </ThemedText>
            </View>
          </View>
        )}
      </Card>
    </Pressable>
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
  const c = theme[accentText(color)];
  return (
    <View>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText style={[styles.ringValue, { color: c }]}>
        {value}/{goal}
        <ThemedText style={[styles.ringUnit, { color: c }]}> {unit}</ThemedText>
      </ThemedText>
    </View>
  );
}

function StepsCard({ steps, goal }: { steps: StepData; goal: number }) {
  const theme = useTheme();
  const max = Math.max(...steps.hourly, 1);
  return (
    <Card>
      <CardTitle
        right={
          <Ring size={44} stroke={6} progress={steps.total / goal} color="calm">
            <Icon name={{ mci: 'shoe-print' }} size={16} color={theme.calm} />
          </Ring>
        }>
        Step Count
      </CardTitle>
      <View>
        <ThemedText type="smallBold">Today</ThemedText>
        <ThemedText type="display" style={{ color: theme.calm }}>
          {steps.total.toLocaleString()}
          <ThemedText type="smallBold" style={{ color: theme.calm }}>
            {' '}
            / {goal.toLocaleString()}
          </ThemedText>
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
              <GradientFill
                name="calm"
                angle={0}
                style={{ height: `${Math.max((v / max) * 100, 6)}%`, width: 5, borderRadius: 3 }}
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
        <Icon name={{ mci: 'run-fast' }} size={48} color={theme.tintText} />
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
  const theme = useTheme();
  const suggestion = getMeditation(suggestionId) ?? MEDITATIONS[0];
  const open = () => router.push({ pathname: '/session/[id]', params: { id: suggestion.id } });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Start ${suggestion.title}`}
      onPress={open}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <GradientFill name="calm" raised style={styles.mindful}>
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
          <Icon name={{ mci: 'play' }} size={28} color={theme.calm} />
        </View>
      </GradientFill>
    </Pressable>
  );
}

function Chevron() {
  const theme = useTheme();
  return (
    <View style={[styles.chevron, { backgroundColor: theme.backgroundSelected }]}>
      <Icon name={{ mci: 'chevron-right' }} size={18} color={theme.textSecondary} />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: 999,
  },
  motivation: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.three,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139,255,192,0.25)',
  },
  motivationGlow: {
    position: 'absolute',
    top: -160,
    right: -120,
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  motivationGlow2: {
    position: 'absolute',
    bottom: -160,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  quoteMark: {
    color: '#39F08D',
    fontSize: 64,
    lineHeight: 56,
    marginBottom: -Spacing.four,
  },
  quote: {
    color: '#F1FFF6',
    fontSize: 23,
    lineHeight: 31,
  },
  hope: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
    padding: Spacing.three,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(139,255,192,0.2)',
  },
  hopeText: {
    color: '#DFFFEA',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: 500,
  },
  hopeSource: {
    color: 'rgba(223,255,234,0.6)',
    fontSize: 12,
    marginTop: Spacing.one,
  },
  tapHint: {
    color: 'rgba(223,255,234,0.5)',
    fontSize: 12,
    textAlign: 'right',
    marginTop: -Spacing.two,
  },
  badgeMedal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 22,
    lineHeight: 27,
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
  ringUnit: {
    fontSize: 13,
    fontWeight: 700,
  },
  planDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  planDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 26,
    fontWeight: 800,
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
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 800,
    letterSpacing: -0.8,
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
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 800,
    letterSpacing: -0.5,
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
    boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
  },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
