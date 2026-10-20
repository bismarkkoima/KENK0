import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Field, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getGoals, saveGoals, type Goals } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';

const FIELDS: { key: keyof Goals; label: string }[] = [
  { key: 'calories', label: 'Calories (kcal)' },
  { key: 'protein', label: 'Protein (g)' },
  { key: 'carbs', label: 'Carbs (g)' },
  { key: 'fat', label: 'Fat (g)' },
  { key: 'meditationMinutes', label: 'Meditation (min / day)' },
];

export default function GoalsScreen() {
  const { data: goals, db } = useFocusedQuery(getGoals);
  if (!goals) return <Screen tabs={false} />;
  return <GoalsForm initial={goals} onSave={(g) => saveGoals(db, g)} />;
}

function GoalsForm({ initial, onSave }: { initial: Goals; onSave: (g: Goals) => Promise<void> }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(FIELDS.map(({ key }) => [key, String(initial[key])])),
  );
  const parsed = Object.fromEntries(FIELDS.map(({ key }) => [key, Number(values[key])])) as Goals;
  const valid = FIELDS.every(({ key }) => Number.isFinite(parsed[key]) && parsed[key] > 0);

  return (
    <Screen tabs={false}>
      <ThemedText type="small" themeColor="textSecondary">
        Set daily targets that suit you. Not sure? A registered dietitian or doctor can help you
        pick numbers for your body and goals.
      </ThemedText>
      {FIELDS.map(({ key, label }) => (
        <View key={key} style={styles.row}>
          <Field
            label={label}
            value={values[key]}
            keyboardType="number-pad"
            onChangeText={(text) => setValues((v) => ({ ...v, [key]: text }))}
          />
        </View>
      ))}
      <Button
        label="Save goals"
        disabled={!valid}
        onPress={async () => {
          await onSave(parsed);
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
