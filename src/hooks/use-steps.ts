import { Pedometer } from 'expo-sensors';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

export type StepData = { total: number; hourly: number[] };

/**
 * Today's steps, total and per hour, from the phone's motion coprocessor. Only iOS can query past
 * step counts (Android needs Health Connect), so elsewhere this resolves to `null` and callers
 * hide the card.
 */
export function useTodaySteps(): StepData | null {
  const [data, setData] = useState<StepData | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'ios') return;
      let cancelled = false;

      (async () => {
        if (!(await Pedometer.isAvailableAsync())) return;
        const permission = await Pedometer.requestPermissionsAsync();
        if (!permission.granted) return;

        const now = new Date();
        const hours = Array.from({ length: now.getHours() + 1 }, (_, h) => h);
        const hourly = await Promise.all(
          hours.map(async (h) => {
            const start = new Date(now);
            start.setHours(h, 0, 0, 0);
            const end = new Date(start);
            end.setHours(h + 1);
            const result = await Pedometer.getStepCountAsync(start, end < now ? end : now);
            return result.steps;
          }),
        );
        const padded = [...hourly, ...Array(24 - hourly.length).fill(0)];
        if (!cancelled) setData({ total: hourly.reduce((a, b) => a + b, 0), hourly: padded });
      })().catch(() => {
        // Motion data unavailable (e.g. simulator) — leave the card hidden.
      });

      return () => {
        cancelled = true;
      };
    }, []),
  );

  return data;
}
