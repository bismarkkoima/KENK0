import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  Button,
  Card,
  GradientFill,
  IconButton,
  Ring,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { MoodCard, WaterCard } from '@/components/wellness-cards';
import { Spacing, type GradientName } from '@/constants/theme';
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
import { useTheme } from '@/hooks/use-theme';
import { greeting, toDayKey } from '@/lib/dates';
import { radialGlow } from '@/lib/style';

export default function TodayScreen() {
  const today = toDayKey();
  const { data, db, reload } = useFocusedQuery(async (db) => {
    const [summary] = await getDaySummaries(db, today, today);
    return {
      summary,
      goals: await getGoals(db),
      streak: await getStreak(db),
      checkin: await getMoodCheckin(db, today),
    };
  }, today);

  if (!data) return <Screen title="Today" />;
  const { summary, goals, streak, checkin } = data;
  const remaining = Math.round(goals.calories - summary.calories);
  const suggestion = suggestMeditation();

  return (
    <Screen
      title="Today"
      subtitle={greeting()}
      right={
        <View style={styles.links}>
          <IconButton
            icon={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
            label="Reminders"
            size={42}
            onPress={() => router.push('/reminders')}
          />
          <IconButton
            icon={{ ios: 'target', android: 'track_changes', web: 'track_changes' }}
            label="Goals"
            size={42}
            onPress={() => router.push('/goals')}
          />
        </View>
      }>
      <Card style={styles.hero}>
        <Ring size={156} stroke={14} progress={summary.calories / goals.calories} warnOver>
          <ThemedText style={styles.heroValue}>{Math.abs(remaining)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {remaining >= 0 ? 'kcal left' : 'kcal over'}
          </ThemedText>
        </Ring>
        <View style={styles.heroStats}>
          <HeroStat
            icon={{ ios: 'fork.knife', android: 'restaurant', web: 'restaurant' }}
            gradient="tint"
            label="Eaten"
            value={`${Math.round(summary.calories)}`}
            unit="kcal"
          />
          <HeroStat
            icon={{
              ios: 'flame.fill',
              android: 'local_fire_department',
              web: 'local_fire_department',
            }}
            gradient="warm"
            label="Streak"
            value={String(streak)}
            unit={streak === 1 ? 'day' : 'days'}
          />
          <HeroStat
            icon={{ ios: 'leaf.fill', android: 'self_improvement', web: 'self_improvement' }}
            gradient="calm"
            label="Mindful"
            value={String(Math.round(summary.meditationMinutes))}
            unit="min"
          />
        </View>
      </Card>

      <SectionTitle>Check-in</SectionTitle>
      <MoodCard
        key={checkin ? 'checked-in' : 'new'}
        checkin={checkin}
        day={today}
        onSave={async (c) => {
          await saveMoodCheckin(db, c);
          reload();
        }}
      />

      <SectionTitle>Macros</SectionTitle>
      <Card style={styles.macros}>
        <MacroRing label="Protein" value={summary.protein} goal={goals.protein} color="tint" />
        <MacroRing label="Carbs" value={summary.carbs} goal={goals.carbs} color="warm" />
        <MacroRing label="Fat" value={summary.fat} goal={goals.fat} color="water" />
      </Card>

      <SectionTitle>Mindfulness</SectionTitle>
      <MindfulCard
        minutes={summary.meditationMinutes}
        goal={goals.meditationMinutes}
        suggestion={suggestion}
      />

      <SectionTitle>Hydration</SectionTitle>
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

      <Button
        label="Log a meal"
        icon={{ ios: 'plus', android: 'add', web: 'add' }}
        onPress={() => router.push('/add-meal')}
      />
    </Screen>
  );
}

type Icon = React.ComponentProps<typeof SymbolView>['name'];

function HeroStat({
  icon,
  gradient,
  label,
  value,
  unit,
}: {
  icon: Icon;
  gradient: GradientName;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <View style={styles.heroStat}>
      <GradientFill name={gradient} style={styles.heroIcon}>
        <SymbolView name={icon} size={16} tintColor="#ffffff" />
      </GradientFill>
      <View>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText style={styles.heroStatValue}>
          {value}
          <ThemedText type="small" themeColor="textSecondary">
            {' '}
            {unit}
          </ThemedText>
        </ThemedText>
      </View>
    </View>
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
    <View style={styles.macro}>
      <Ring size={84} stroke={9} progress={value / goal} color={color} warnOver>
        <ThemedText style={styles.macroValue}>{Math.round(value)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.macroUnit}>
          / {goal} g
        </ThemedText>
      </Ring>
      <ThemedText type="smallBold">{label}</ThemedText>
    </View>
  );
}

function MindfulCard({
  minutes,
  goal,
  suggestion,
}: {
  minutes: number;
  goal: number;
  suggestion: (typeof MEDITATIONS)[number];
}) {
  const theme = useTheme();
  const reached = minutes >= goal;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Start ${suggestion.title}`}
      onPress={() => router.push({ pathname: '/session/[id]', params: { id: suggestion.id } })}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <GradientFill
        name="calm"
        style={[styles.mindful, { boxShadow: `0 14px 34px ${theme.calm}55` }]}>
        <View style={[styles.mindfulGlow, radialGlow('rgba(255,255,255,0.35)')]} />
        <View style={styles.mindfulText}>
          <ThemedText type="smallBold" style={styles.mindfulEyebrow}>
            {reached ? 'GOAL REACHED 🎉' : `${Math.round(minutes)} OF ${goal} MIN TODAY`}
          </ThemedText>
          <ThemedText style={styles.mindfulTitle}>{suggestion.title}</ThemedText>
          <ThemedText type="small" style={styles.mindfulSub}>
            {suggestion.minutes} min · {suggestion.description}
          </ThemedText>
        </View>
        <View style={styles.playButton}>
          <SymbolView
            name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
            size={24}
            tintColor={theme.calm}
          />
        </View>
      </GradientFill>
    </Pressable>
  );
}

/** Pick a session that fits the time of day. */
function suggestMeditation() {
  const hour = new Date().getHours();
  const id = hour < 11 ? 'morning-reset' : hour >= 21 ? 'sleep-wind-down' : 'box-breathing';
  return getMeditation(id) ?? MEDITATIONS[0];
}

const styles = StyleSheet.create({
  links: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.four,
  },
  heroValue: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: 800,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  heroStats: {
    flex: 1,
    gap: Spacing.three,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
  },
  heroIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.four,
  },
  macro: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  macroValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: 800,
    fontVariant: ['tabular-nums'],
  },
  macroUnit: {
    fontSize: 11,
    lineHeight: 14,
  },
  mindful: {
    borderRadius: 24,
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
  mindfulText: {
    flex: 1,
    gap: Spacing.half,
  },
  mindfulEyebrow: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  mindfulTitle: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 800,
    letterSpacing: -0.4,
  },
  mindfulSub: {
    color: 'rgba(255,255,255,0.85)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
  },
});
