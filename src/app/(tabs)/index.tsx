import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, ProgressBar, Screen, SectionTitle, Stat } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getMeditation, MEDITATIONS } from '@/data/meditations';
import { getDaySummaries, getGoals, getStreak } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { greeting, toDayKey } from '@/lib/dates';

export default function TodayScreen() {
  const theme = useTheme();
  const today = toDayKey();
  const { data } = useFocusedQuery(async (db) => {
    const [summary] = await getDaySummaries(db, today, today);
    return { summary, goals: await getGoals(db), streak: await getStreak(db) };
  }, today);

  if (!data) return <Screen title="Today" />;
  const { summary, goals, streak } = data;
  const remaining = Math.round(goals.calories - summary.calories);
  const suggestion = suggestMeditation();

  return (
    <Screen
      title="Today"
      subtitle={greeting()}
      right={
        <Pressable onPress={() => router.push('/goals')} hitSlop={12}>
          <ThemedText type="linkPrimary" style={{ color: theme.tint }}>
            Goals
          </ThemedText>
        </Pressable>
      }>
      <Card>
        <View style={styles.row}>
          <Stat label="Eaten" value={String(Math.round(summary.calories))} unit="kcal" />
          <Stat
            label={remaining >= 0 ? 'Remaining' : 'Over'}
            value={String(Math.abs(remaining))}
            unit="kcal"
          />
          <Stat label="Streak" value={String(streak)} unit={streak === 1 ? 'day' : 'days'} />
        </View>
        <ProgressBar value={summary.calories} max={goals.calories} height={12} />
      </Card>

      <SectionTitle>Macros</SectionTitle>
      <Card>
        <MacroRow label="Protein" value={summary.protein} goal={goals.protein} />
        <MacroRow label="Carbs" value={summary.carbs} goal={goals.carbs} />
        <MacroRow label="Fat" value={summary.fat} goal={goals.fat} />
      </Card>

      <SectionTitle>Mindfulness</SectionTitle>
      <Card>
        <View style={styles.between}>
          <ThemedText>
            {Math.round(summary.meditationMinutes)} / {goals.meditationMinutes} min
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {summary.meditationMinutes >= goals.meditationMinutes
              ? 'Goal reached 🎉'
              : 'Daily goal'}
          </ThemedText>
        </View>
        <ProgressBar value={summary.meditationMinutes} max={goals.meditationMinutes} color="calm" />
        <ThemedText type="small" themeColor="textSecondary">
          Suggested: {suggestion.title} · {suggestion.minutes} min
        </ThemedText>
        <Button
          label={`Start ${suggestion.title}`}
          color="calm"
          onPress={() => router.push({ pathname: '/session/[id]', params: { id: suggestion.id } })}
        />
      </Card>

      <SectionTitle>Quick log</SectionTitle>
      <Button label="Log a meal" onPress={() => router.push('/add-meal')} />
    </Screen>
  );
}

function MacroRow({ label, value, goal }: { label: string; value: number; goal: number }) {
  return (
    <View style={styles.macro}>
      <View style={styles.between}>
        <ThemedText type="small">{label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {Math.round(value)} / {goal} g
        </ThemedText>
      </View>
      <ProgressBar value={value} max={goal} />
    </View>
  );
}

/** Pick a session that fits the time of day. */
function suggestMeditation() {
  const hour = new Date().getHours();
  const id = hour < 11 ? 'morning-reset' : hour >= 21 ? 'sleep-wind-down' : 'box-breathing';
  return getMeditation(id) ?? MEDITATIONS[0];
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  between: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macro: {
    gap: Spacing.one,
  },
});
