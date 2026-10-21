import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Field, Screen } from '@/components/ui';
import { MOODS } from '@/components/wellness-cards';
import { Gradients, OnGradient, Spacing } from '@/constants/theme';
import {
  EMOTIONS,
  JOURNAL_PROMPTS,
  MIND_SCALES,
  SUPPORT_THRESHOLD,
  SUPPORT_URL,
} from '@/data/mind';
import { addMindEntry } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';
import { toDayKey } from '@/lib/dates';
import { goBack } from '@/lib/navigation';

type Scales = { stress: number; energy: number; sleep: number };

export default function MindEntryScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [mood, setMood] = useState<number | null>(null);
  const [scales, setScales] = useState<Scales>({ stress: 3, energy: 3, sleep: 3 });
  const [emotions, setEmotions] = useState<string[]>([]);
  const [journal, setJournal] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [prompt] = useState(
    () => JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)],
  );
  const [saved, setSaved] = useState(false);

  function toggleEmotion(id: string) {
    setEmotions((list) => (list.includes(id) ? list.filter((e) => e !== id) : [...list, id]));
  }

  async function save() {
    if (mood === null) return;
    await addMindEntry(db, {
      day: toDayKey(),
      mood,
      ...scales,
      emotions,
      journal: journal.trim(),
      gratitude: gratitude.trim(),
    });
    const struggling = mood <= SUPPORT_THRESHOLD.mood || scales.stress >= SUPPORT_THRESHOLD.stress;
    if (struggling) setSaved(true);
    else goBack();
  }

  if (saved) {
    return (
      <Screen tabs={false}>
        <Card accent="mind">
          <ThemedText type="heading">Thank you for checking in</ThemedText>
          <ThemedText>
            It sounds like today is heavy. That&apos;s okay — noticing it matters. A few slow
            breaths can take the edge off, and talking to someone can help more than you&apos;d
            expect.
          </ThemedText>
        </Card>
        <Button
          label="Try a 3-minute breathing exercise"
          color="mind"
          onPress={() =>
            router.replace({ pathname: '/session/[id]', params: { id: 'box-breathing' } })
          }
        />
        <Button
          label="Find a helpline near you"
          variant="secondary"
          onPress={() => Linking.openURL(SUPPORT_URL)}
        />
        <Button label="Done" variant="secondary" onPress={() => goBack()} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          If you are in danger or thinking about harming yourself, call your local emergency number
          now.
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen tabs={false}>
      <Card>
        <ThemedText type="heading">How are you feeling?</ThemedText>
        <View style={styles.moods}>
          {MOODS.map((m) => {
            const selected = mood === m.value;
            return (
              <Pressable
                key={m.value}
                accessibilityRole="button"
                accessibilityLabel={`Mood: ${m.label}`}
                accessibilityState={{ selected }}
                onPress={() => setMood(m.value)}
                style={[
                  styles.mood,
                  selected && { backgroundColor: theme.tintSoft, borderColor: theme.tintText },
                ]}>
                <ThemedText style={[styles.moodEmoji, !selected && mood !== null && styles.dim]}>
                  {m.emoji}
                </ThemedText>
                <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>
                  {m.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        {MIND_SCALES.map((s) => (
          <View key={s.key} style={styles.scale}>
            <View style={styles.scaleHeader}>
              <ThemedText type="smallBold">{s.label}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {scales[s.key] <= 2 ? s.low : scales[s.key] >= 4 ? s.high : 'In between'}
              </ThemedText>
            </View>
            <View style={styles.segments}>
              {[1, 2, 3, 4, 5].map((v) => {
                const active = v <= scales[s.key];
                return (
                  <Pressable
                    key={v}
                    accessibilityRole="button"
                    accessibilityLabel={`${s.label} ${v} of 5`}
                    accessibilityState={{ selected: scales[s.key] === v }}
                    onPress={() => setScales((sc) => ({ ...sc, [s.key]: v }))}
                    style={[
                      styles.segment,
                      {
                        backgroundColor: active
                          ? theme[Gradients[s.color][0]]
                          : theme.backgroundSelected,
                      },
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={{ color: active ? OnGradient[s.color] : theme.textSecondary }}>
                      {v}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <ThemedText type="heading">What are you feeling?</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Pick as many as fit.
        </ThemedText>
        <View style={styles.chips}>
          {EMOTIONS.map((e) => (
            <Chip
              key={e.id}
              label={`${e.emoji} ${e.label}`}
              color="mind"
              selected={emotions.includes(e.id)}
              onPress={() => toggleEmotion(e.id)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <ThemedText type="heading">Journal</ThemedText>
        <Field
          label={prompt}
          value={journal}
          onChangeText={setJournal}
          placeholder="Write freely — only you can see this."
          multiline
          style={styles.journal}
        />
        <Field
          label="One thing you're grateful for"
          value={gratitude}
          onChangeText={setGratitude}
          placeholder="Optional"
        />
      </Card>

      <Button label="Save check-in" color="mind" disabled={mood === null} onPress={save} />
      {mood === null && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          Choose a mood to save.
        </ThemedText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  moods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  mood: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  moodEmoji: {
    fontSize: 34,
    lineHeight: 42,
  },
  dim: {
    opacity: 0.4,
  },
  scale: {
    gap: Spacing.two,
  },
  scaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  segments: {
    flexDirection: 'row',
    gap: Spacing.one + 2,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  journal: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
});
