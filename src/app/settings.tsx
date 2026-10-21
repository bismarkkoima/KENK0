import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type AppIcon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Card, IconTile, Screen } from '@/components/ui';
import { Spacing, type GradientName } from '@/constants/theme';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { getProfile, levelLabel } from '@/lib/profile';

const ROWS: { href: Href; icon: AppIcon; color: GradientName; title: string; detail: string }[] = [
  {
    href: '/profile',
    icon: { mci: 'account-circle' },
    color: 'tint',
    title: 'Profile & personal plan',
    detail: 'Your body, fitness level and focus',
  },
  {
    href: '/goals',
    icon: { mci: 'bullseye-arrow' },
    color: 'move',
    title: 'Goals',
    detail: 'Fine-tune any daily or weekly target',
  },
  {
    href: '/badges',
    icon: { mci: 'trophy-award' },
    color: 'gold',
    title: 'Badges & rewards',
    detail: 'Your level, points and achievements',
  },
  {
    href: '/permissions',
    icon: { mci: 'shield-check' },
    color: 'calm',
    title: 'Permissions',
    detail: 'Motion & steps, notifications, camera',
  },
  {
    href: '/reminders',
    icon: { mci: 'bell-ring' },
    color: 'warm',
    title: 'Reminders',
    detail: 'Gentle nudges through the day',
  },
  {
    href: '/transfer',
    icon: { mci: 'swap-horizontal' },
    color: 'sky',
    title: 'Transfer data',
    detail: 'iPhone ⇄ Android, Apple Health, Samsung, Google Fit',
  },
  {
    href: '/backup',
    icon: { mci: 'cloud-upload' },
    color: 'sky',
    title: 'Backup & restore',
    detail: 'Google / iCloud backup and backup files',
  },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const { data: profile } = useFocusedQuery(getProfile);

  return (
    <Screen tabs={false}>
      {profile && (
        <ThemedText type="quote">
          {profile.name ? `Hi, ${profile.name}.` : 'Hi there.'}{' '}
          <ThemedText type="quote" themeColor="textSecondary">
            {levelLabel(profile.fitnessLevel)} · {profile.weightKg} kg · {profile.heightCm} cm
          </ThemedText>
        </ThemedText>
      )}
      <Card style={styles.list}>
        {ROWS.map((row, i) => (
          <Pressable
            key={row.title}
            accessibilityRole="button"
            onPress={() => router.push(row.href)}
            style={({ pressed }) => [
              styles.row,
              i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.glassBorder },
              { opacity: pressed ? 0.7 : 1 },
            ]}>
            <IconTile icon={row.icon} color={row.color} size={40} />
            <View style={styles.text}>
              <ThemedText type="smallBold">{row.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {row.detail}
              </ThemedText>
            </View>
            <Icon name={{ mci: 'chevron-right' }} size={22} color={theme.textSecondary} />
          </Pressable>
        ))}
      </Card>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        Kenko is a wellness tool, not a medical device. Calorie and energy figures are estimates.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: Spacing.one,
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  text: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
});
