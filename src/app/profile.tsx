import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, CardTitle, Chip, Field, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { goBack } from '@/lib/navigation';
import {
  FITNESS_LEVELS,
  FOCUSES,
  getProfile,
  saveProfile,
  suggestGoals,
  type Profile,
  type Sex,
} from '@/lib/profile';

const SEXES: { id: Sex; label: string }[] = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'unspecified', label: 'Prefer not to say' },
];

const DEFAULT_PROFILE: Profile = {
  name: '',
  fitnessLevel: 'beginner',
  focus: 'fitter',
  sex: 'unspecified',
  birthYear: new Date().getFullYear() - 30,
  heightCm: 170,
  weightKg: 70,
};

export default function ProfileScreen() {
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const { data, db } = useFocusedQuery(getProfile);
  if (data === undefined) return <Screen tabs={false} />;
  return (
    <ProfileForm
      initial={data ?? DEFAULT_PROFILE}
      welcome={welcome === '1'}
      onSave={(p) => saveProfile(db, p)}
    />
  );
}

function ProfileForm({
  initial,
  welcome,
  onSave,
}: {
  initial: Profile;
  welcome: boolean;
  onSave: (p: Profile) => Promise<void>;
}) {
  const theme = useTheme();
  const [profile, setProfile] = useState(initial);
  const [birthYear, setBirthYear] = useState(String(initial.birthYear));
  const [height, setHeight] = useState(String(initial.heightCm));
  const [weight, setWeight] = useState(String(initial.weightKg));

  const year = Number(birthYear);
  const heightCm = Number(height);
  const weightKg = Number(weight.replace(',', '.'));
  const thisYear = new Date().getFullYear();
  const valid =
    year >= thisYear - 110 &&
    year <= thisYear - 13 &&
    heightCm >= 100 &&
    heightCm <= 250 &&
    weightKg >= 30 &&
    weightKg <= 300;
  const complete: Profile = { ...profile, birthYear: year, heightCm, weightKg };
  const plan = valid ? suggestGoals(complete) : null;

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  return (
    <Screen tabs={false}>
      {welcome && (
        <View style={styles.welcome}>
          <ThemedText type="quote" style={styles.welcomeTitle}>
            Every body is different.
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Tell Kenko a little about you and it will size your goals to your body and where
            you&apos;re starting from — not to anyone else.
          </ThemedText>
        </View>
      )}

      <Card>
        <Field
          label="Your name (optional)"
          value={profile.name}
          onChangeText={(t) => set('name', t)}
          placeholder="What should we call you?"
        />
      </Card>

      <Card>
        <CardTitle>Where are you starting?</CardTitle>
        {FITNESS_LEVELS.map((l) => {
          const selected = profile.fitnessLevel === l.id;
          return (
            <Pressable
              key={l.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => set('fitnessLevel', l.id)}
              style={[
                styles.level,
                {
                  backgroundColor: selected ? theme.tintSoft : theme.backgroundSelected,
                  borderColor: selected ? theme.tintText : 'transparent',
                },
              ]}>
              <ThemedText type="smallBold">{l.label}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {l.description}
              </ThemedText>
            </Pressable>
          );
        })}
      </Card>

      <Card>
        <CardTitle>What matters most right now?</CardTitle>
        <View style={styles.chips}>
          {FOCUSES.map((f) => (
            <Chip
              key={f.id}
              label={`${f.emoji} ${f.label}`}
              selected={profile.focus === f.id}
              onPress={() => set('focus', f.id)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <CardTitle>Your body</CardTitle>
        <ThemedText type="small" themeColor="textSecondary">
          Used only on this phone to estimate energy needs and workout calories.
        </ThemedText>
        <View style={styles.chips}>
          {SEXES.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              selected={profile.sex === s.id}
              onPress={() => set('sex', s.id)}
            />
          ))}
        </View>
        <View style={styles.row}>
          <Field
            label="Birth year"
            value={birthYear}
            onChangeText={setBirthYear}
            keyboardType="number-pad"
          />
          <Field
            label="Height (cm)"
            value={height}
            onChangeText={setHeight}
            keyboardType="number-pad"
          />
          <Field
            label="Weight (kg)"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />
        </View>
      </Card>

      {plan && (
        <Card accent="tint">
          <CardTitle>Your personal plan</CardTitle>
          <PlanRow label="Workouts" value={`${plan.weeklyWorkouts} a week`} />
          <PlanRow label="Exercise" value={`${plan.exerciseMinutes} min a day`} />
          <PlanRow label="Steps" value={`${plan.steps.toLocaleString()} a day`} />
          <PlanRow label="Energy" value={`${plan.calories.toLocaleString()} kcal a day`} />
          <PlanRow label="Protein" value={`${plan.protein} g a day`} />
          <PlanRow label="Water" value={`${(plan.waterMl / 1000).toFixed(1)} L a day`} />
          <PlanRow label="Mindfulness" value={`${plan.meditationMinutes} min a day`} />
          <ThemedText type="small" themeColor="textSecondary">
            Estimates, not medical advice. You can fine-tune any goal later.
          </ThemedText>
        </Card>
      )}

      <Button
        label={welcome ? "Let's go" : 'Save & update my goals'}
        disabled={!valid}
        onPress={async () => {
          await onSave(complete);
          if (welcome) router.replace({ pathname: '/permissions', params: { welcome: '1' } });
          else goBack();
        }}
      />
      {!valid && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          Check your birth year, height and weight.
        </ThemedText>
      )}

      {!welcome && (
        <Card accent="sky">
          <CardTitle>Transfer your data</CardTitle>
          <ThemedText themeColor="textSecondary">
            Switching between iPhone and Android, or coming from Apple Health, Samsung Health or
            Google Fit? Bring your history with you.
          </ThemedText>
          <Button
            label="Transfer data"
            color="sky"
            icon={{ mci: 'swap-horizontal' }}
            onPress={() => router.push('/transfer')}
          />
        </Card>
      )}
    </Screen>
  );
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.planRow}>
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  welcome: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  welcomeTitle: {
    fontSize: 32,
    lineHeight: 38,
  },
  level: {
    padding: Spacing.three,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: Spacing.half,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  center: {
    textAlign: 'center',
  },
});
