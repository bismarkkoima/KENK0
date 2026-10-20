import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Chip, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { CATEGORY_LABELS, MEDITATIONS, type MeditationCategory } from '@/data/meditations';
import { getDaySummaries } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { addDays, toDayKey } from '@/lib/dates';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as MeditationCategory[];

export default function MeditateScreen() {
  const theme = useTheme();
  const [category, setCategory] = useState<MeditationCategory | null>(null);
  const today = toDayKey();
  const { data: weekMinutes = 0 } = useFocusedQuery(async (db) => {
    const days = await getDaySummaries(db, addDays(today, -6), today);
    return days.reduce((sum, d) => sum + d.meditationMinutes, 0);
  }, today);

  const list = category ? MEDITATIONS.filter((m) => m.category === category) : MEDITATIONS;

  return (
    <Screen title="Meditate" subtitle={`${Math.round(weekMinutes)} mindful minutes this week`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={CATEGORY_LABELS[c]}
            selected={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
      </ScrollView>

      {list.map((m) => (
        <Pressable
          key={m.id}
          onPress={() => router.push({ pathname: '/session/[id]', params: { id: m.id } })}
          style={({ pressed }) => pressed && styles.pressed}>
          <Card style={styles.card}>
            <View style={[styles.badge, { backgroundColor: theme.calmSoft }]}>
              <ThemedText type="smallBold" style={{ color: theme.calm }}>
                {m.minutes}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.calm, fontSize: 11, lineHeight: 14 }}>
                min
              </ThemedText>
            </View>
            <View style={styles.text}>
              <ThemedText type="smallBold">{m.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {m.description}
              </ThemedText>
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    gap: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
});
