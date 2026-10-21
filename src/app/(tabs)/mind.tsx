import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { TipCard } from '@/components/tip-card';
import {
  Button,
  Card,
  CardTitle,
  Chip,
  GradientFill,
  IconButton,
  IconTile,
  PlayButton,
  ProgressBar,
  Screen,
  SectionTitle,
  type IconName,
} from '@/components/ui';
import { moodEmoji } from '@/components/wellness-cards';
import { OnGradient, Spacing, type GradientName } from '@/constants/theme';
import { emotionLabel, MIND_SCALES, SUPPORT_URL } from '@/data/mind';
import {
  CATEGORY_LABELS,
  MEDITATIONS,
  type Meditation,
  type MeditationCategory,
} from '@/data/meditations';
import {
  deleteMindEntry,
  getDaySummaries,
  getRecentMindEntries,
  type MindEntry,
} from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { addDays, formatDayLabel, toDayKey } from '@/lib/dates';
import { radialGlow } from '@/lib/style';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as MeditationCategory[];

const CATEGORY_STYLE: Record<MeditationCategory, { color: GradientName; icon: IconName }> = {
  breathing: { color: 'mind', icon: { ios: 'wind', android: 'air', web: 'air' } },
  calm: { color: 'calm', icon: { ios: 'leaf.fill', android: 'spa', web: 'spa' } },
  focus: { color: 'warm', icon: { ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' } },
  sleep: {
    color: 'water',
    icon: { ios: 'moon.stars.fill', android: 'bedtime', web: 'bedtime' },
  },
};

const average = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export default function MindScreen() {
  const theme = useTheme();
  const [category, setCategory] = useState<MeditationCategory | null>(null);
  const today = toDayKey();
  const { data, db, reload } = useFocusedQuery(async (db) => {
    const week = await getDaySummaries(db, addDays(today, -6), today);
    return {
      entries: await getRecentMindEntries(db, 6),
      mindful: week.reduce((s, d) => s + d.meditationMinutes, 0),
      mood: average(week.flatMap((d) => (d.mood === null ? [] : [d.mood]))),
      stress: average(week.flatMap((d) => (d.stress === null ? [] : [d.stress]))),
    };
  }, today);

  const list = category ? MEDITATIONS.filter((m) => m.category === category) : MEDITATIONS;

  function confirmDelete(entry: MindEntry) {
    const remove = async () => {
      await deleteMindEntry(db, entry.id);
      reload();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this entry?')) remove();
      return;
    }
    Alert.alert('Delete entry?', 'This journal entry will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: remove },
    ]);
  }

  return (
    <Screen
      title="Mind"
      right={
        <IconButton
          icon={{ ios: 'square.and.pencil', android: 'edit_note', web: 'edit_note' }}
          label="New check-in"
          onPress={() => router.push('/mind-entry')}
        />
      }>
      <TipCard
        id="mind-intro"
        icon={{ ios: 'brain.head.profile', android: 'psychology', web: 'psychology' }}
        color="mind"
        title="Your private mind journal"
        body="Check in with how you feel — mood, stress, energy, sleep and emotions. Entries stay on this phone, and Kenko shows how your habits affect your mood."
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Check in with how you feel"
        onPress={() => router.push('/mind-entry')}
        style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
        <GradientFill name="mind" angle={150} style={styles.hero}>
          <View style={[styles.heroGlow, radialGlow('rgba(255,255,255,0.45)')]} />
          <ThemedText type="smallBold" style={[styles.heroEyebrow, { color: OnGradient.mind }]}>
            CHECK-IN
          </ThemedText>
          <ThemedText style={[styles.heroTitle, { color: OnGradient.mind }]}>
            How are you, really?
          </ThemedText>
          <ThemedText style={{ color: OnGradient.mind }}>
            Takes a minute. Naming a feeling is the first step to handling it.
          </ThemedText>
          <View style={[styles.heroButton, { backgroundColor: OnGradient.mind }]}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              size={16}
              tintColor={theme.mindEnd}
            />
            <ThemedText type="smallBold" style={{ color: theme.mindEnd }}>
              New entry
            </ThemedText>
          </View>
        </GradientFill>
      </Pressable>

      {data && (
        <Card>
          <CardTitle>This week</CardTitle>
          <View style={styles.weekRow}>
            <WeekStat
              label="Avg mood"
              value={data.mood === null ? '–' : `${moodEmoji(data.mood)} ${data.mood.toFixed(1)}`}
              color={theme.tintText}
            />
            <WeekStat
              label="Avg stress"
              value={data.stress === null ? '–' : `${data.stress.toFixed(1)}/5`}
              color={theme.move}
            />
            <WeekStat
              label="Mindful"
              value={`${Math.round(data.mindful)} min`}
              color={theme.calm}
            />
          </View>
        </Card>
      )}

      {data && data.entries.length > 0 && (
        <>
          <SectionTitle>Recent entries</SectionTitle>
          {data.entries.map((e) => (
            <EntryCard key={e.id} entry={e} onLongPress={() => confirmDelete(e)} />
          ))}
        </>
      )}

      <SectionTitle>Meditate</SectionTitle>
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
        <SessionCard key={m.id} meditation={m} />
      ))}

      <SupportCard />
    </Screen>
  );
}

function WeekStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.flex}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={[styles.weekValue, { color }]}>{value}</ThemedText>
    </View>
  );
}

function EntryCard({ entry, onLongPress }: { entry: MindEntry; onLongPress: () => void }) {
  const time = new Date(entry.created_at).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return (
    <Pressable onLongPress={onLongPress} accessibilityHint="Long-press to delete">
      <Card>
        <View style={styles.entryTop}>
          <ThemedText style={styles.entryEmoji}>{moodEmoji(entry.mood)}</ThemedText>
          <View style={styles.flex}>
            <ThemedText type="smallBold">{formatDayLabel(entry.day)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {time}
            </ThemedText>
          </View>
        </View>
        {entry.emotions.length > 0 && (
          <View style={styles.tags}>
            {entry.emotions.map((id) => (
              <Tag key={id} label={emotionLabel(id)} />
            ))}
          </View>
        )}
        {MIND_SCALES.map((s) => (
          <View key={s.key} style={styles.scaleRow}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.scaleLabel}>
              {s.label}
            </ThemedText>
            <View style={styles.flex}>
              <ProgressBar value={entry[s.key]} max={5} color={s.color} height={6} />
            </View>
          </View>
        ))}
        {entry.journal !== '' && (
          <ThemedText numberOfLines={3} style={styles.journal}>
            {entry.journal}
          </ThemedText>
        )}
        {entry.gratitude !== '' && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            🙏 {entry.gratitude}
          </ThemedText>
        )}
      </Card>
    </Pressable>
  );
}

function Tag({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.tag, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="small">{label}</ThemedText>
    </View>
  );
}

function SessionCard({ meditation: m }: { meditation: Meditation }) {
  const style = CATEGORY_STYLE[m.category];
  const open = () => router.push({ pathname: '/session/[id]', params: { id: m.id } });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${m.title}, ${m.minutes} minutes`}
      onPress={open}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <Card accent={style.color} style={styles.sessionCard}>
        <IconTile icon={style.icon} color={style.color} size={52} />
        <View style={styles.flex}>
          <ThemedText style={styles.sessionTitle}>{m.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {m.minutes} min · {m.description}
          </ThemedText>
        </View>
        <PlayButton label={`Start ${m.title}`} color={style.color} size={48} />
      </Card>
    </Pressable>
  );
}

function SupportCard() {
  return (
    <Card accent="move">
      <View style={styles.supportRow}>
        <IconTile
          icon={{ ios: 'heart.text.square.fill', android: 'support_agent', web: 'support_agent' }}
          color="move"
        />
        <View style={styles.flex}>
          <ThemedText type="smallBold">Need someone to talk to?</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Kenko isn&apos;t a substitute for professional care. If you&apos;re struggling, reach
            out to someone you trust or a free, confidential helpline. In an emergency, call your
            local emergency number.
          </ThemedText>
        </View>
      </View>
      <Button
        label="Find a helpline near you"
        variant="secondary"
        onPress={() => Linking.openURL(SUPPORT_URL)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chips: {
    gap: Spacing.two,
  },
  hero: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.one,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -150,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  heroEyebrow: {
    fontSize: 12,
    letterSpacing: 1.4,
    opacity: 0.75,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: 800,
    letterSpacing: -0.6,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    marginTop: Spacing.two + 4,
  },
  weekRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  weekValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 800,
    fontVariant: ['tabular-nums'],
  },
  entryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  entryEmoji: {
    fontSize: 36,
    lineHeight: 44,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
  },
  tag: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: 999,
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  scaleLabel: {
    width: 110,
  },
  journal: {
    fontStyle: 'italic',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  sessionTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: 700,
  },
  supportRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
});
