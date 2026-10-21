import { StyleSheet, View } from 'react-native';

import { Bars } from '@/components/bars';
import { ThemedText } from '@/components/themed-text';
import { Card, CardTitle, GradientFill, Screen } from '@/components/ui';
import { accentText, OnGradient, Spacing } from '@/constants/theme';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { getCardioLoad } from '@/lib/cardio-load';
import { shortWeekday } from '@/lib/dates';

export default function CardioLoadScreen() {
  const theme = useTheme();
  const { data } = useFocusedQuery(getCardioLoad);
  if (!data) return <Screen tabs={false} />;
  const { status } = data;
  const last7 = data.days.slice(-7);

  return (
    <Screen tabs={false}>
      <GradientFill name={status.color} raised style={styles.hero}>
        <ThemedText type="smallBold" style={[styles.eyebrow, { color: OnGradient[status.color] }]}>
          TODAY&apos;S CARDIO LOAD
        </ThemedText>
        <ThemedText style={[styles.big, { color: OnGradient[status.color] }]}>
          {data.today}
        </ThemedText>
        <ThemedText type="heading" style={{ color: OnGradient[status.color] }}>
          {status.label}
        </ThemedText>
        <ThemedText style={{ color: OnGradient[status.color] }}>{status.detail}</ThemedText>
      </GradientFill>

      <View style={styles.row}>
        <Card style={styles.tile}>
          <ThemedText type="small" themeColor="textSecondary">
            7-day average
          </ThemedText>
          <ThemedText type="display" style={{ color: theme.skyText }}>
            {Math.round(data.acute)}
          </ThemedText>
        </Card>
        <Card style={styles.tile}>
          <ThemedText type="small" themeColor="textSecondary">
            28-day average
          </ThemedText>
          <ThemedText type="display" style={{ color: theme[accentText('tint')] }}>
            {Math.round(data.chronic)}
          </ThemedText>
        </Card>
      </View>

      <Card>
        <CardTitle>This week</CardTitle>
        <Bars
          values={last7.map((d) => d.load)}
          labels={last7.map((d) => shortWeekday(d.day))}
          color="sky"
          goal={data.chronic > 0 ? data.chronic : undefined}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Dashed line: your 28-day daily average.
        </ThemedText>
      </Card>

      <Card>
        <CardTitle>Last 4 weeks</CardTitle>
        <Bars values={data.days.map((d) => d.load)} color="tint" height={110} />
      </Card>

      <Card>
        <CardTitle>How it works</CardTitle>
        <ThemedText themeColor="textSecondary">
          Each workout&apos;s load is its length in minutes × how hard it felt (your effort rating,
          on a 0–10 scale). A 30-minute moderate run scores about 150; an hour of hard training
          about 420.
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Kenko compares your last 7 days with your last 28. Staying roughly between 0.8× and 1.3×
          your usual is a common guide for building fitness while limiting injury risk. Because
          bodies differ, your load is only ever compared with your own history.
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Sources: Foster et al., J Strength Cond Res (2001) — session-RPE; Gabbett, Br J Sports Med
          (2016) — acute:chronic workload.
        </ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.one,
    overflow: 'hidden',
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.4,
    opacity: 0.8,
  },
  big: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: 800,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  tile: {
    flex: 1,
    gap: Spacing.half,
    padding: Spacing.three,
  },
});
