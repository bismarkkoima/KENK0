import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Field, ProgressBar } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { MoodCheckin } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';

export const MOODS = [
  { value: 1, emoji: '😞', label: 'Low' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
] as const;

export function moodEmoji(mood: number): string {
  return MOODS.find((m) => m.value === Math.round(mood))?.emoji ?? '';
}

export function WaterCard({
  ml,
  goal,
  onAdd,
  onUndo,
}: {
  ml: number;
  goal: number;
  onAdd: (ml: number) => void;
  onUndo: () => void;
}) {
  const theme = useTheme();
  return (
    <Card>
      <View style={styles.between}>
        <ThemedText>
          {Math.round(ml)} / {goal} ml
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {ml >= goal ? 'Hydrated 💧' : `${Math.ceil((goal - ml) / 250)} glasses to go`}
        </ThemedText>
      </View>
      <ProgressBar value={ml} max={goal} color="water" />
      <View style={styles.buttons}>
        {[250, 500].map((amount) => (
          <Pressable
            key={amount}
            accessibilityRole="button"
            accessibilityLabel={`Add ${amount} millilitres of water`}
            onPress={() => onAdd(amount)}
            style={({ pressed }) => [
              styles.waterButton,
              { backgroundColor: theme.waterSoft, opacity: pressed ? 0.7 : 1 },
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.water }}>
              + {amount} ml
            </ThemedText>
          </Pressable>
        ))}
        {ml > 0 && (
          <Pressable accessibilityRole="button" onPress={onUndo} hitSlop={8} style={styles.undo}>
            <ThemedText type="small" themeColor="textSecondary">
              Undo
            </ThemedText>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

export function MoodCard({
  checkin,
  day,
  onSave,
}: {
  checkin: MoodCheckin | null;
  day: string;
  onSave: (checkin: MoodCheckin) => void;
}) {
  const theme = useTheme();
  const [note, setNote] = useState(checkin?.note ?? '');

  return (
    <Card>
      <ThemedText type="small" themeColor="textSecondary">
        {checkin ? 'Your check-in today — tap to change' : 'How are you feeling today?'}
      </ThemedText>
      <View style={styles.moods}>
        {MOODS.map((m) => {
          const selected = checkin?.mood === m.value;
          return (
            <Pressable
              key={m.value}
              accessibilityRole="button"
              accessibilityLabel={`Mood: ${m.label}`}
              accessibilityState={{ selected }}
              onPress={() => onSave({ day, mood: m.value, note })}
              style={[styles.mood, selected && { backgroundColor: theme.tintSoft }]}>
              <ThemedText style={styles.emoji}>{m.emoji}</ThemedText>
              <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>
                {m.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {checkin && (
        <Field
          placeholder="Add a note (optional) — what's on your mind?"
          value={note}
          onChangeText={setNote}
          onBlur={() => note !== checkin.note && onSave({ ...checkin, note })}
          multiline
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  between: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  waterButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  undo: {
    marginLeft: 'auto',
  },
  moods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mood: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.one,
    borderRadius: Spacing.three,
    flex: 1,
  },
  emoji: {
    fontSize: 28,
    lineHeight: 36,
  },
});
