import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Card, CardTitle, GradientFill, IconTile, Screen } from '@/components/ui';
import { OnGradient, Spacing, type GradientName } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Sound = { label: string; db: number; icon: string };

/** Typical sound levels (approximate, A-weighted). */
const SOUNDS: Sound[] = [
  { label: 'Quiet room', db: 40, icon: 'sofa' },
  { label: 'Conversation', db: 60, icon: 'account-voice' },
  { label: 'Busy traffic', db: 80, icon: 'car' },
  { label: 'Lawn mower / gym class', db: 90, icon: 'dumbbell' },
  { label: 'Motorbike', db: 95, icon: 'motorbike' },
  { label: 'Headphones at max', db: 100, icon: 'headphones' },
  { label: 'Nightclub', db: 105, icon: 'speaker' },
  { label: 'Concert, front row', db: 110, icon: 'music' },
  { label: 'Sirens up close', db: 120, icon: 'alarm-light' },
];

/**
 * Safe daily exposure using the NIOSH recommended limit: 85 dBA for 8 hours, halving the time
 * for every 3 dB louder. Below 85 dBA there is no daily limit.
 */
function safeMinutes(db: number): number | null {
  if (db < 85) return null;
  return 480 / Math.pow(2, (db - 85) / 3);
}

function formatMinutes(min: number) {
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  if (min >= 60) return unit(+(min / 60).toFixed(1), 'hour');
  if (min >= 1) return unit(Math.round(min), 'minute');
  return unit(Math.max(1, Math.round(min * 60)), 'second');
}

function riskColor(db: number): GradientName {
  if (db < 85) return 'tint';
  if (db < 95) return 'gold';
  if (db < 105) return 'warm';
  return 'move';
}

export default function HearingScreen() {
  const theme = useTheme();
  const [selected, setSelected] = useState(SOUNDS[5]);
  const minutes = safeMinutes(selected.db);
  const color = riskColor(selected.db);

  return (
    <Screen tabs={false}>
      <GradientFill name={color} raised style={styles.hero}>
        <Icon name={{ mci: 'ear-hearing' }} size={40} color={OnGradient[color]} />
        <ThemedText type="smallBold" style={{ color: OnGradient[color] }}>
          {selected.label} · about {selected.db} dB
        </ThemedText>
        <ThemedText style={[styles.big, { color: OnGradient[color] }]}>
          {minutes === null ? 'No limit' : formatMinutes(minutes)}
        </ThemedText>
        <ThemedText style={{ color: OnGradient[color] }}>
          {minutes === null
            ? 'Safe for all-day listening.'
            : 'Safe daily exposure before risking hearing damage.'}
        </ThemedText>
      </GradientFill>

      <Card>
        <CardTitle>How loud is it?</CardTitle>
        <ThemedText type="small" themeColor="textSecondary">
          Tap a sound to see how long it&apos;s safe each day.
        </ThemedText>
        {SOUNDS.map((s) => {
          const active = s.label === selected.label;
          const m = safeMinutes(s.db);
          return (
            <Pressable
              key={s.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setSelected(s)}
              style={[styles.soundRow, active && { backgroundColor: theme.backgroundSelected }]}>
              <IconTile icon={{ mci: s.icon as never }} color={riskColor(s.db)} size={36} />
              <View style={styles.flex}>
                <ThemedText type="smallBold">{s.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  ~{s.db} dB · {m === null ? 'no daily limit' : `safe for ${formatMinutes(m)}`}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </Card>

      <Card>
        <CardTitle>Safe listening guide</CardTitle>
        <Tip
          icon="volume-medium"
          title="Keep headphones at 60% or less"
          text="And take a break every hour. Your phone's headphone safety setting can cap the volume for you."
        />
        <Tip
          icon="headphones"
          title="Use noise-cancelling headphones"
          text="Blocking background noise means you don't need to turn the music up to hear it."
        />
        <Tip
          icon="ear-hearing"
          title="Wear earplugs at loud events"
          text="Concerts, clubs, motorsport and power tools can damage hearing in minutes."
        />
        <Tip
          icon="bell-ring"
          title="Know the warning signs"
          text="Ringing (tinnitus) or muffled hearing after noise means your ears were overloaded. If it lasts more than a day, see a doctor or audiologist."
        />
        <ThemedText type="small" themeColor="textSecondary">
          Sources: NIOSH recommended exposure limit (85 dBA for 8 hours, 3 dB exchange rate); WHO
          Make Listening Safe. Sound levels are typical estimates — Kenko doesn&apos;t measure
          sound.
        </ThemedText>
      </Card>
    </Screen>
  );
}

function Tip({ icon, title, text }: { icon: string; title: string; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.tip}>
      <Icon name={{ mci: icon as never }} size={22} color={theme.skyText} />
      <View style={styles.flex}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {text}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  hero: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.one,
    overflow: 'hidden',
  },
  big: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: 800,
    letterSpacing: -1,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: 16,
  },
  tip: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
});
