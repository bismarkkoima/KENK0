import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Chip, GradientFill, Screen } from '@/components/ui';
import { Spacing, type GradientName } from '@/constants/theme';
import {
  CATEGORY_LABELS,
  MEDITATIONS,
  type Meditation,
  type MeditationCategory,
} from '@/data/meditations';
import { getDaySummaries } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { addDays, toDayKey } from '@/lib/dates';
import { radialGlow } from '@/lib/style';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as MeditationCategory[];

const CATEGORY_STYLE: Record<
  MeditationCategory,
  { gradient: GradientName; icon: React.ComponentProps<typeof SymbolView>['name'] }
> = {
  breathing: { gradient: 'tint', icon: { ios: 'wind', android: 'air', web: 'air' } },
  calm: { gradient: 'calm', icon: { ios: 'leaf.fill', android: 'spa', web: 'spa' } },
  focus: { gradient: 'warm', icon: { ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' } },
  sleep: {
    gradient: 'water',
    icon: { ios: 'moon.stars.fill', android: 'bedtime', web: 'bedtime' },
  },
};

function openSession(m: Meditation) {
  router.push({ pathname: '/session/[id]', params: { id: m.id } });
}

export default function MeditateScreen() {
  const [category, setCategory] = useState<MeditationCategory | null>(null);
  const today = toDayKey();
  const { data: weekMinutes = 0 } = useFocusedQuery(async (db) => {
    const days = await getDaySummaries(db, addDays(today, -6), today);
    return days.reduce((sum, d) => sum + d.meditationMinutes, 0);
  }, today);

  const list = category ? MEDITATIONS.filter((m) => m.category === category) : MEDITATIONS;
  const featured = MEDITATIONS.find((m) => m.id === 'stress-release') ?? MEDITATIONS[0];

  return (
    <Screen title="Meditate" subtitle={`${Math.round(weekMinutes)} mindful minutes this week`}>
      {category === null && <FeaturedCard meditation={featured} />}

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
        <SessionRow key={m.id} meditation={m} />
      ))}
    </Screen>
  );
}

function FeaturedCard({ meditation }: { meditation: Meditation }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Start ${meditation.title}`}
      onPress={() => openSession(meditation)}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <GradientFill
        name="calm"
        angle={150}
        style={[styles.featured, { boxShadow: `0 16px 40px ${theme.calm}55` }]}>
        <View style={[styles.featuredGlow, radialGlow('rgba(255,255,255,0.4)')]} />
        <View style={[styles.featuredOrb, radialGlow('rgba(255,255,255,0.5)')]} />
        <ThemedText type="smallBold" style={styles.featuredEyebrow}>
          FEATURED · {meditation.minutes} MIN
        </ThemedText>
        <ThemedText style={styles.featuredTitle}>{meditation.title}</ThemedText>
        <ThemedText style={styles.featuredSub}>{meditation.description}</ThemedText>
        <View style={styles.featuredButton}>
          <SymbolView
            name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
            size={16}
            tintColor={theme.calm}
          />
          <ThemedText type="smallBold" style={{ color: theme.calm }}>
            Begin
          </ThemedText>
        </View>
      </GradientFill>
    </Pressable>
  );
}

function SessionRow({ meditation: m }: { meditation: Meditation }) {
  const theme = useTheme();
  const style = CATEGORY_STYLE[m.category];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${m.title}, ${m.minutes} minutes`}
      onPress={() => openSession(m)}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <Card style={styles.card}>
        <GradientFill name={style.gradient} style={styles.tile}>
          <SymbolView name={style.icon} size={22} tintColor="#ffffff" />
        </GradientFill>
        <View style={styles.text}>
          <ThemedText style={styles.rowTitle}>{m.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {m.description}
          </ThemedText>
        </View>
        <View style={[styles.pill, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold" style={styles.pillText}>
            {m.minutes} min
          </ThemedText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chips: {
    gap: Spacing.two,
  },
  featured: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.one,
    overflow: 'hidden',
    minHeight: 190,
    justifyContent: 'flex-end',
  },
  featuredGlow: {
    position: 'absolute',
    top: -140,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  featuredOrb: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  featuredEyebrow: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    letterSpacing: 1.4,
  },
  featuredTitle: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 800,
    letterSpacing: -0.6,
  },
  featuredSub: {
    color: 'rgba(255,255,255,0.88)',
    maxWidth: 280,
  },
  featuredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    marginTop: Spacing.two + 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  tile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
  rowTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: 700,
  },
  pill: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});
