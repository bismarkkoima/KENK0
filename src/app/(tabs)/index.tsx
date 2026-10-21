import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type AppIcon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import {
  NightArt,
  OrbArt,
  RingsArt,
  Tile,
  TileButton,
  TileColors,
  TileGrid,
} from '@/components/tiles';
import { Backdrop, ProgressBar, Rings } from '@/components/ui';
import { MOODS, moodEmoji } from '@/components/wellness-cards';
import { BottomTabInset, MaxContentWidth, Spacing, WebTabBarHeight } from '@/constants/theme';
import { getMeditation, MEDITATIONS } from '@/data/meditations';
import {
  getDaySummaries,
  getGoals,
  getMoodCheckin,
  getSetting,
  logWater,
  saveMoodCheckin,
} from '@/db/queries';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTodaySteps } from '@/hooks/use-steps';
import { useTheme } from '@/hooks/use-theme';
import { evaluateBadges, levelFor, rewardPoints } from '@/lib/badges';
import { getCardioLoad } from '@/lib/cardio-load';
import { addDays, fromDayKey, greeting, toDayKey } from '@/lib/dates';
import { bloodPressureCategory, getVitals } from '@/lib/heart';
import { hopeStatOfTheDay, personalHopeStats, quoteOfTheDay } from '@/lib/motivation';
import { getProfile, levelLabel } from '@/lib/profile';
import { getLifetimeStats } from '@/lib/stats';

type Category = 'overview' | 'activity' | 'heart' | 'mind' | 'food';

const CATEGORIES: { id: Category; label: string; icon: AppIcon }[] = [
  { id: 'overview', label: 'Overview', icon: { mci: 'view-grid' } },
  { id: 'activity', label: 'Activity', icon: { mci: 'run-fast' } },
  { id: 'heart', label: 'Heart', icon: { mci: 'heart-pulse' } },
  { id: 'mind', label: 'Mind', icon: { mci: 'meditation' } },
  { id: 'food', label: 'Food', icon: { mci: 'food-apple' } },
];

function categoryIntro(category: Category): { title: string; text: string } | null {
  const hour = new Date().getHours();
  switch (category) {
    case 'activity':
      return {
        title: 'Activity',
        text:
          hour < 12
            ? 'Another healthy day has begun. Wake up your body with some light stretching.'
            : hour < 18
              ? 'Keep the momentum going — even a short walk counts.'
              : 'Wind down with an easy stretch or a calm walk.',
      };
    case 'heart':
      return { title: 'Heart', text: 'Your heart works hard for you. Check in on it today.' };
    case 'mind':
      return {
        title: 'Mind',
        text: 'How is your head today? A few mindful minutes can reset the whole day.',
      };
    case 'food':
      return {
        title: 'Food',
        text: 'Fuel well. Every meal you log helps you understand your body.',
      };
    default:
      return null;
  }
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const today = toDayKey();
  const steps = useTodaySteps();
  const [category, setCategory] = useState<Category>('overview');
  const [hopeOffset, setHopeOffset] = useState(0);
  const { data, db, reload } = useFocusedQuery(async (db) => {
    const week = await getDaySummaries(db, addDays(today, -6), today);
    const goals = await getGoals(db);
    const profile = await getProfile(db);
    const stats = await getLifetimeStats(db);
    const badges = evaluateBadges(stats);
    const seen = (await getSetting<string[]>(db, 'badges:seen')) ?? [];
    const vitals = await getVitals(db, 30);
    return {
      week,
      summary: week[week.length - 1],
      goals,
      profile,
      checkin: await getMoodCheckin(db, today),
      hope: personalHopeStats(stats, goals, profile),
      points: rewardPoints(stats, badges),
      newBadges: badges.filter((b) => b.earned && !seen.includes(b.id)).length,
      cardio: await getCardioLoad(db),
      restingHr: vitals.find((v) => v.resting_hr !== null)?.resting_hr ?? null,
      bp: vitals.find((v) => v.systolic !== null && v.diastolic !== null) ?? null,
    };
  }, today);

  // First launch: set up the profile so every goal fits this person.
  useEffect(() => {
    if (data && data.profile === null) {
      router.push({ pathname: '/profile', params: { welcome: '1' } });
    }
  }, [data]);

  const intro = categoryIntro(category);

  return (
    <View style={styles.fill}>
      <Backdrop />
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + WebTabBarHeight + Spacing.two,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.six,
          },
        ]}>
        <View style={styles.column}>
          <Header name={data?.profile?.name ?? ''} />
          <CategoryBar value={category} onChange={setCategory} />

          {intro ? (
            <View style={styles.intro}>
              <ThemedText type="heading" style={styles.introTitle}>
                {intro.title}
              </ThemedText>
              <ThemedText themeColor="textSecondary">{intro.text}</ThemedText>
            </View>
          ) : (
            <ThemedText type="quote" style={styles.greeting}>
              {greeting()}
              {data?.profile?.name ? `, ${data.profile.name}` : ''}.
            </ThemedText>
          )}

          {data && (
            <TileGrid>
              {renderTiles(category, {
                ...data,
                steps: steps?.total ?? data.summary.steps,
                hopeOffset,
                nextHope: () => setHopeOffset((o) => o + 1),
                addWater: async () => {
                  await logWater(db, 250, today);
                  reload();
                },
                setMood: async (mood: number) => {
                  await saveMoodCheckin(db, { day: today, mood, note: data.checkin?.note ?? '' });
                  reload();
                },
              })}
            </TileGrid>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

type TileData = {
  week: Awaited<ReturnType<typeof getDaySummaries>>;
  summary: Awaited<ReturnType<typeof getDaySummaries>>[number];
  goals: Awaited<ReturnType<typeof getGoals>>;
  profile: Awaited<ReturnType<typeof getProfile>>;
  checkin: Awaited<ReturnType<typeof getMoodCheckin>>;
  hope: ReturnType<typeof personalHopeStats>;
  points: number;
  newBadges: number;
  cardio: Awaited<ReturnType<typeof getCardioLoad>>;
  restingHr: number | null;
  bp: Awaited<ReturnType<typeof getVitals>>[number] | null;
  steps: number;
  hopeOffset: number;
  nextHope: () => void;
  addWater: () => void;
  setMood: (mood: number) => void;
};

function renderTiles(category: Category, d: TileData) {
  const t = {
    boost: <BoostTile key="boost" d={d} />,
    daily: <DailyActivityTile key="daily" d={d} />,
    steps: <StepsTile key="steps" d={d} />,
    stepsWeek: <StepsTile key="steps-week" d={d} wide />,
    food: <FoodTile key="food" d={d} />,
    foodWide: <FoodTile key="food-wide" d={d} wide />,
    heart: <HeartTile key="heart" d={d} />,
    vitals: <VitalsTile key="vitals" d={d} />,
    mood: <MoodTile key="mood" d={d} />,
    moodWide: <MoodTile key="mood-wide" d={d} wide />,
    hearing: <HearingTile key="hearing" />,
    water: <WaterTile key="water" d={d} />,
    cardio: <CardioTile key="cardio" d={d} />,
    cardioWide: <CardioTile key="cardio-wide" d={d} wide />,
    workouts: <WorkoutsTile key="workouts" d={d} />,
    rewards: <RewardsTile key="rewards" d={d} />,
    mind: <MeditateTile key="mind" />,
    plan: <PlanTile key="plan" d={d} />,
    start: <StartWorkoutTile key="start" />,
    journal: <JournalTile key="journal" />,
    scan: <ScanTile key="scan" />,
  };
  switch (category) {
    case 'activity':
      return [t.daily, t.workouts, t.plan, t.cardioWide, t.stepsWeek, t.start, t.rewards];
    case 'heart':
      return [t.heart, t.vitals, t.cardio, t.hearing, t.steps];
    case 'mind':
      return [t.moodWide, t.mind, t.journal, t.boost];
    case 'food':
      return [t.foodWide, t.water, t.scan];
    default:
      return [
        t.boost,
        t.daily,
        t.food,
        t.steps,
        t.heart,
        t.mood,
        t.hearing,
        t.water,
        t.cardio,
        t.workouts,
        t.rewards,
        t.mind,
        t.plan,
        t.start,
      ];
  }
}

function Header({ name }: { name: string }) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <ThemedText style={styles.wordmark}>Kenko</ThemedText>
      <View style={styles.headerRight}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Your profile"
          onPress={() => router.push('/profile')}
          style={[styles.avatar, { backgroundColor: TileColors.activity }]}>
          <ThemedText type="smallBold" style={styles.avatarText}>
            {name ? name[0].toUpperCase() : '?'}
          </ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={10}
          onPress={() => router.push('/settings')}>
          <Icon name={{ mci: 'dots-vertical' }} size={24} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );
}

function CategoryBar({ value, onChange }: { value: Category; onChange: (c: Category) => void }) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  return (
    <View
      style={[
        styles.categoryBar,
        {
          borderColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
          backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
        },
      ]}>
      {CATEGORIES.map((c) => {
        const selected = c.id === value;
        return (
          <Pressable
            key={c.id}
            accessibilityRole="tab"
            accessibilityLabel={c.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(c.id)}
            style={[
              styles.categoryItem,
              selected && {
                backgroundColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(14,122,96,0.14)',
              },
            ]}>
            <Icon name={c.icon} size={22} color={selected ? theme.text : theme.textSecondary} />
          </Pressable>
        );
      })}
    </View>
  );
}

// --- Tiles -------------------------------------------------------------------------------------

function BoostTile({ d }: { d: TileData }) {
  const stat = hopeStatOfTheDay(d.hope, d.hopeOffset);
  return (
    <Tile
      title="Daily boost"
      color="energy"
      wide
      height="auto"
      onPress={d.nextHope}
      accessibilityLabel="Daily boost. Tap for another encouraging stat"
      art={<OrbArt icon={{ mci: 'fire' }} from="#FF7A1A" to="#FFD45C" />}>
      <ThemedText type="quote" style={styles.boostQuote}>
        {quoteOfTheDay()}
      </ThemedText>
      <ThemedText style={styles.boostStat}>{stat.text}</ThemedText>
      {stat.source && (
        <ThemedText type="small" style={styles.boostSource}>
          Source: {stat.source}
        </ThemedText>
      )}
    </Tile>
  );
}

function DailyActivityTile({ d }: { d: TileData }) {
  const theme = useTheme();
  const rows = [
    { icon: 'shoe-print', color: '#4CC44F', value: d.steps.toLocaleString(), unit: 'steps' },
    {
      icon: 'clock-outline',
      color: '#1EA5E9',
      value: String(Math.round(d.summary.exerciseMinutes)),
      unit: 'mins',
    },
    {
      icon: 'fire',
      color: '#9B4DE0',
      value: String(Math.round(d.summary.activeCalories)),
      unit: 'Cal',
    },
  ];
  return (
    <Tile title="Daily activity" color="surface" wide onPress={() => router.push('/health/daily')}>
      <View style={styles.dailyRow}>
        <View style={styles.dailyList}>
          {rows.map((r) => (
            <View key={r.unit} style={styles.dailyItem}>
              <View style={[styles.dot, { backgroundColor: r.color }]}>
                <Icon name={{ mci: r.icon as never }} size={13} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.dailyValue}>
                {r.value}{' '}
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {r.unit}
                </ThemedText>
              </ThemedText>
            </View>
          ))}
        </View>
        <Rings
          size={112}
          stroke={12}
          gap={2}
          rings={[
            { progress: d.steps / d.goals.steps, color: 'tint' },
            { progress: d.summary.exerciseMinutes / d.goals.exerciseMinutes, color: 'sky' },
            { progress: d.summary.activeCalories / d.goals.moveCalories, color: 'calm' },
          ]}
        />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        <ThemedText type="small" style={{ color: theme.tintText }}>
          ●
        </ThemedText>{' '}
        Steps{'  '}
        <ThemedText type="small" style={{ color: theme.skyText }}>
          ●
        </ThemedText>{' '}
        Active mins{'  '}
        <ThemedText type="small" style={{ color: theme.calm }}>
          ●
        </ThemedText>{' '}
        Active cal
      </ThemedText>
    </Tile>
  );
}

function StepsTile({ d, wide = false }: { d: TileData; wide?: boolean }) {
  const theme = useTheme();
  return (
    <Tile title="Steps" color="surface" wide={wide} onPress={() => router.push('/health/daily')}>
      <View style={styles.stepsBottom}>
        <View>
          <ThemedText style={styles.bigNumber}>{d.steps.toLocaleString()}</ThemedText>
          <ThemedText themeColor="textSecondary">{d.goals.steps.toLocaleString()} steps</ThemedText>
        </View>
        {wide && (
          <View style={styles.weekDays}>
            {d.week.map((day, i) => {
              const isToday = i === d.week.length - 1;
              return (
                <ThemedText
                  key={day.day}
                  type="small"
                  style={{
                    color: isToday
                      ? theme.danger
                      : day.steps >= d.goals.steps
                        ? theme.tintText
                        : theme.textSecondary,
                    fontWeight: isToday ? 700 : 500,
                  }}>
                  {fromDayKey(day.day).getDate()}
                </ThemedText>
              );
            })}
          </View>
        )}
      </View>
      {!wide && <ProgressBar value={d.steps} max={d.goals.steps} color="tint" height={10} />}
    </Tile>
  );
}

function FoodTile({ d, wide = false }: { d: TileData; wide?: boolean }) {
  const eaten = Math.round(d.summary.calories);
  return (
    <Tile
      title="Food"
      color="food"
      wide={wide}
      onPress={() => router.push('/food')}
      art={<OrbArt icon={{ mci: 'fruit-citrus' }} from="#FF8A1A" to="#FFD36B" size={78} />}
      body={
        eaten
          ? `${eaten.toLocaleString()} of ${d.goals.calories.toLocaleString()} kcal`
          : 'Ready to log your first meal?'
      }>
      {wide && eaten > 0 && (
        <ThemedText style={styles.tileLine}>
          Protein {Math.round(d.summary.protein)} g · Carbs {Math.round(d.summary.carbs)} g · Fat{' '}
          {Math.round(d.summary.fat)} g
        </ThemedText>
      )}
    </Tile>
  );
}

function HeartTile({ d }: { d: TileData }) {
  const parts = [
    d.restingHr ? `${d.restingHr} bpm resting` : null,
    d.bp ? `${d.bp.systolic}/${d.bp.diastolic} mmHg` : null,
  ].filter(Boolean);
  return (
    <Tile
      title="Heart health"
      color="heart"
      wide
      onPress={() => router.push('/health/heart')}
      art={<RingsArt icon={{ mci: 'heart' }} color="#E546C8" size={130} />}
      body={
        parts.length
          ? parts.join(' · ')
          : 'Measure your pulse and log blood pressure to see your heart health in one place.'
      }
    />
  );
}

function VitalsTile({ d }: { d: TileData }) {
  const category = d.bp ? bloodPressureCategory(d.bp.systolic!, d.bp.diastolic!) : null;
  return (
    <Tile
      title="Vitals"
      color="vitals"
      onPress={() => router.push('/health/heart')}
      art={<RingsArt icon={{ mci: 'gauge' }} color="#22D3EE" size={110} />}
      body={category ? `Blood pressure: ${category.label}` : 'Learn how vitals tracking works.'}
    />
  );
}

function MoodTile({ d, wide = false }: { d: TileData; wide?: boolean }) {
  if (!wide) {
    return (
      <Tile
        title="Mood"
        color="mood"
        onPress={() => router.push('/mind-entry')}
        art={<OrbArt icon={{ mci: 'flower' }} from="#FF3FA4" to="#FF9AD0" size={76} />}
        body={d.checkin ? 'Checked in today. Tap to journal.' : 'How are you feeling today?'}>
        {d.checkin && <ThemedText style={styles.moodEmoji}>{moodEmoji(d.checkin.mood)}</ThemedText>}
      </Tile>
    );
  }
  return (
    <Tile
      title="How are you feeling?"
      color="mood"
      wide
      art={<OrbArt icon={{ mci: 'flower' }} from="#FF3FA4" to="#FF9AD0" size={76} />}
      body="Tap a face for a quick check-in.">
      <View style={styles.moodRow}>
        {MOODS.map((m) => {
          const selected = d.checkin?.mood === m.value;
          return (
            <Pressable
              key={m.value}
              accessibilityRole="button"
              accessibilityLabel={`Mood: ${m.label}`}
              accessibilityState={{ selected }}
              onPress={() => d.setMood(m.value)}
              style={[styles.moodButton, selected && styles.moodSelected]}>
              <ThemedText style={styles.moodFace}>{m.emoji}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </Tile>
  );
}

function HearingTile() {
  return (
    <Tile
      title="Hearing"
      color="hearing"
      onPress={() => router.push('/health/hearing')}
      art={<RingsArt icon={{ mci: 'waveform' }} color="#7A4A35" size={110} />}
      body="Learn how sound exposure affects your hearing."
    />
  );
}

function WaterTile({ d }: { d: TileData }) {
  return (
    <Tile
      title="Water"
      color="water"
      art={<OrbArt icon={{ mci: 'cup-water' }} from="#1F7FE0" to="#7CC4FF" size={70} />}>
      <ThemedText style={styles.tileNumber}>
        {(d.summary.waterMl / 1000).toFixed(2).replace(/0$/, '')}
        <ThemedText style={styles.tileUnit}> / {(d.goals.waterMl / 1000).toFixed(1)} L</ThemedText>
      </ThemedText>
      <TileButton label="+250 ml" icon={{ mci: 'water-plus' }} onPress={d.addWater} />
    </Tile>
  );
}

function CardioTile({ d, wide = false }: { d: TileData; wide?: boolean }) {
  return (
    <Tile
      title="Daily cardio load"
      color="cardio"
      wide={wide}
      onPress={() => router.push('/health/cardio-load')}
      art={<RingsArt icon={{ mci: 'speedometer' }} color="#2F9BFF" size={wide ? 140 : 110} />}
      body={
        d.cardio.today > 0 || d.cardio.ratio !== null
          ? `Today ${d.cardio.today} · ${d.cardio.status.short}`
          : 'Find your daily training sweet spot.'
      }>
      {wide && <ThemedText style={styles.tileLine}>{d.cardio.status.detail}</ThemedText>}
    </Tile>
  );
}

function WorkoutsTile({ d }: { d: TileData }) {
  const done = d.week.reduce((s, x) => s + x.workouts, 0);
  return (
    <Tile
      title="Workouts this week"
      color="activity"
      onPress={() => router.push('/activity')}
      art={<OrbArt icon={{ mci: 'timer' }} from="#11A07C" to="#6FE3C1" size={72} />}>
      <ThemedText style={styles.tileNumber}>
        {done}
        <ThemedText style={styles.tileUnit}> of {d.goals.weeklyWorkouts}</ThemedText>
      </ThemedText>
      <ThemedText style={styles.tileLine}>
        {done >= d.goals.weeklyWorkouts ? 'Plan complete 🎉' : 'See your weekly totals.'}
      </ThemedText>
    </Tile>
  );
}

function RewardsTile({ d }: { d: TileData }) {
  const level = levelFor(d.points);
  return (
    <Tile
      title="Rewards"
      color="rewards"
      onPress={() => router.push('/badges')}
      art={<OrbArt icon={{ mci: 'trophy' }} from="#F5A300" to="#FFE27A" size={72} />}
      body={
        d.newBadges > 0
          ? `${d.newBadges} new badge${d.newBadges === 1 ? '' : 's'}!`
          : `${d.points.toLocaleString()} points`
      }>
      <ThemedText style={styles.tileNumber}>Lv {level.level}</ThemedText>
      <ThemedText style={styles.tileLine}>{level.title}</ThemedText>
    </Tile>
  );
}

function MeditateTile() {
  const hour = new Date().getHours();
  const id = hour < 11 ? 'morning-reset' : hour >= 21 ? 'sleep-wind-down' : 'box-breathing';
  const m = getMeditation(id) ?? MEDITATIONS[0];
  return (
    <Tile
      title="Meditate"
      color="mind"
      wide
      onPress={() => router.push({ pathname: '/session/[id]', params: { id: m.id } })}
      art={<NightArt />}
      body={`${m.title} · ${m.minutes} min — ${m.description}`}
    />
  );
}

function PlanTile({ d }: { d: TileData }) {
  return (
    <Tile
      title="Fitness plan"
      color="fitness"
      onPress={() => router.push('/profile')}
      art={<OrbArt icon={{ mci: 'shield-star' }} from="#14B88F" to="#9AF0D3" size={70} />}
      body={
        d.profile
          ? `${levelLabel(d.profile.fitnessLevel)} · ${d.goals.exerciseMinutes} min a day`
          : 'Set your level and focus.'
      }
    />
  );
}

function StartWorkoutTile() {
  return (
    <Tile
      title="Start a workout"
      color="activity"
      onPress={() => router.push('/activity')}
      art={<OrbArt icon={{ mci: 'run-fast' }} from="#11A07C" to="#6FE3C1" size={72} />}
      body="59 sports, live timer and notifications."
    />
  );
}

function JournalTile() {
  return (
    <Tile
      title="Journal"
      color="heart"
      onPress={() => router.push('/mind-entry')}
      art={<OrbArt icon={{ mci: 'notebook' }} from="#B565C9" to="#E9B6FF" size={70} />}
      body="Write how you feel — only you can see it."
    />
  );
}

function ScanTile() {
  return (
    <Tile
      title="Log a meal"
      color="food"
      onPress={() => router.push('/add-meal')}
      art={<OrbArt icon={{ mci: 'barcode-scan' }} from="#FF8A1A" to="#FFD36B" size={70} />}
      body="Search, scan a barcode or enter it."
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  column: {
    flex: 1,
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
    letterSpacing: -0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
  },
  categoryBar: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
  },
  categoryItem: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  introTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  greeting: {
    paddingHorizontal: Spacing.one,
    fontSize: 22,
    lineHeight: 28,
  },
  boostQuote: {
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 28,
    marginTop: Spacing.two,
    marginRight: 70,
  },
  boostStat: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    lineHeight: 21,
    marginTop: Spacing.two,
  },
  boostSource: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyList: {
    gap: Spacing.two,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
  stepsBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bigNumber: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: 700,
    letterSpacing: -1,
  },
  weekDays: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tileNumber: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: 700,
  },
  tileUnit: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: 500,
  },
  tileLine: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 19,
  },
  moodEmoji: {
    fontSize: 38,
    lineHeight: 46,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  moodButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  moodSelected: {
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  moodFace: {
    fontSize: 28,
    lineHeight: 34,
  },
});
