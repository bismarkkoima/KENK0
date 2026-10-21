import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GradientFill } from '@/components/ui';
import { Spacing, type GradientName } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Rounded gradient bars on dim tracks, with an optional dashed goal line. */
export function Bars({
  values,
  labels,
  color,
  goal,
  max: fixedMax,
  height = 130,
}: {
  values: number[];
  labels?: string[];
  color: GradientName;
  goal?: number;
  max?: number;
  height?: number;
}) {
  const theme = useTheme();
  const max = fixedMax ?? Math.max((goal ?? 0) * 1.2, ...values, 1);
  const wide = values.length <= 12;
  const radius = wide ? 9 : 3;
  const gap = wide ? 8 : 2;
  return (
    <View>
      <View style={[styles.chart, { height, gap }]}>
        {goal !== undefined && goal <= max && (
          <View
            style={[
              styles.goalLine,
              { bottom: `${(goal / max) * 100}%`, borderColor: theme.textSecondary },
            ]}
          />
        )}
        {values.map((v, i) => (
          <View
            key={i}
            style={[
              styles.barSlot,
              { backgroundColor: theme.backgroundSelected, borderRadius: radius },
            ]}>
            {v > 0 && (
              <GradientFill
                name={color}
                angle={0}
                style={{
                  height: `${(v / max) * 100}%`,
                  minHeight: radius * 2,
                  borderRadius: radius,
                }}
              />
            )}
          </View>
        ))}
      </View>
      {labels && (
        <View style={[styles.labels, { gap }]}>
          {labels.map((l, i) => (
            <ThemedText key={i} type="small" themeColor="textSecondary" style={styles.label}>
              {l}
            </ThemedText>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  barSlot: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  labels: {
    flexDirection: 'row',
    marginTop: Spacing.one,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
  },
});
