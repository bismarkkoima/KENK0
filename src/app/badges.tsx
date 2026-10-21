import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Card, GradientFill, ProgressBar, Screen, SectionTitle } from '@/components/ui';
import { OnGradient, Spacing } from '@/constants/theme';
import { saveSetting } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import {
  BADGE_CATEGORIES,
  evaluateBadges,
  levelFor,
  rewardPoints,
  type BadgeProgress,
} from '@/lib/badges';
import { getLifetimeStats } from '@/lib/stats';

export default function BadgesScreen() {
  const theme = useTheme();
  const { data, db } = useFocusedQuery(async (db) => {
    const stats = await getLifetimeStats(db);
    const badges = evaluateBadges(stats);
    return { badges, points: rewardPoints(stats, badges) };
  });

  // Opening this screen marks every earned badge as seen.
  useEffect(() => {
    if (!data) return;
    saveSetting(
      db,
      'badges:seen',
      data.badges.filter((b) => b.earned).map((b) => b.id),
    );
  }, [data, db]);

  if (!data) return <Screen tabs={false} />;
  const { badges, points } = data;
  const level = levelFor(points);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <Screen tabs={false}>
      <GradientFill name="gold" raised style={styles.hero}>
        <Icon name={{ mci: 'trophy-award' }} size={44} color={OnGradient.gold} />
        <ThemedText style={[styles.level, { color: OnGradient.gold }]}>
          Level {level.level} · {level.title}
        </ThemedText>
        <ThemedText style={[styles.points, { color: OnGradient.gold }]}>
          {points.toLocaleString()} points
        </ThemedText>
        <View style={styles.heroBar}>
          <ProgressBar value={level.progress} max={1} color="tint" height={10} />
        </View>
        <ThemedText type="small" style={{ color: OnGradient.gold }}>
          {level.next
            ? `${(level.next.min - points).toLocaleString()} points to ${level.next.title}`
            : 'Top level reached — legendary.'}
        </ThemedText>
      </GradientFill>

      <ThemedText themeColor="textSecondary" style={styles.center}>
        {earned} of {badges.length} badges earned · points come from every workout, mindful minute,
        check-in and badge.
      </ThemedText>

      {BADGE_CATEGORIES.map((c) => (
        <View key={c.id} style={styles.section}>
          <SectionTitle>{c.label}</SectionTitle>
          <View style={styles.grid}>
            {badges
              .filter((b) => b.category === c.id)
              .map((b) => (
                <BadgeTile key={b.id} badge={b} lockedColor={theme.backgroundSelected} />
              ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

function BadgeTile({ badge, lockedColor }: { badge: BadgeProgress; lockedColor: string }) {
  const theme = useTheme();
  return (
    <Card style={styles.tile}>
      {badge.earned ? (
        <GradientFill name={badge.color} raised style={styles.medal}>
          <Icon name={badge.icon} size={30} color={OnGradient[badge.color]} />
        </GradientFill>
      ) : (
        <View style={[styles.medal, { backgroundColor: lockedColor }]}>
          <Icon name={badge.icon} size={30} color={theme.textSecondary} />
        </View>
      )}
      <ThemedText type="smallBold" style={styles.tileTitle} numberOfLines={1}>
        {badge.title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.tileText}>
        {badge.description}
      </ThemedText>
      {badge.earned ? (
        <ThemedText type="smallBold" style={{ color: theme.tintText }}>
          +{badge.points} pts
        </ThemedText>
      ) : (
        <View style={styles.tileProgress}>
          <ProgressBar value={badge.progress} max={1} color={badge.color} height={6} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.tileCount}>
            {formatProgress(badge)}
          </ThemedText>
        </View>
      )}
    </Card>
  );
}

function formatProgress(b: BadgeProgress) {
  const n = (x: number) => (x >= 1000 ? `${Math.round(x / 100) / 10}k` : String(Math.floor(x)));
  return `${n(b.current)} / ${n(b.target)}`;
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 28,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
    overflow: 'hidden',
  },
  level: {
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 0.4,
    marginTop: Spacing.two,
  },
  points: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: 800,
    letterSpacing: -1,
  },
  heroBar: {
    alignSelf: 'stretch',
    marginVertical: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
  section: {
    gap: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  tile: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    gap: Spacing.one + 2,
    padding: Spacing.three,
  },
  medal: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  tileTitle: {
    textAlign: 'center',
  },
  tileText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    minHeight: 32,
  },
  tileProgress: {
    alignSelf: 'stretch',
    gap: Spacing.one,
  },
  tileCount: {
    textAlign: 'center',
    fontSize: 12,
  },
});
