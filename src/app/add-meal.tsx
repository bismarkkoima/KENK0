import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Field, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { addMeal, getRecentFoods, MEAL_TYPES, type MealType } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { toDayKey } from '@/lib/dates';
import { scaleNutrition, searchFoods, type FoodResult } from '@/lib/open-food-facts';

type Form = { name: string; calories: string; protein: string; carbs: string; fat: string };
const EMPTY_FORM: Form = { name: '', calories: '', protein: '', carbs: '', fat: '' };

function formFromFood(food: FoodResult, grams: string): Form {
  const n = scaleNutrition(food.per100g, Number(grams) || 0);
  return {
    name: `${food.name}${food.brand ? ` (${food.brand})` : ''} · ${grams} g`,
    calories: String(n.calories),
    protein: String(n.protein),
    carbs: String(n.carbs),
    fat: String(n.fat),
  };
}

function defaultMealType(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}

export default function AddMealScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ day?: string; mealType?: MealType; food?: string }>();
  const day = params.day ?? toDayKey();
  const [mealType, setMealType] = useState<MealType>(params.mealType ?? defaultMealType());
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const [grams, setGrams] = useState('100');

  // The barcode scanner returns here with the scanned food in the `food` param.
  const [scannedParam, setScannedParam] = useState<string | undefined>(undefined);
  if (params.food && params.food !== scannedParam) {
    setScannedParam(params.food);
    setSelected(JSON.parse(params.food) as FoodResult);
    setGrams('100');
  }

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { data: recent = [], db } = useFocusedQuery((db) => getRecentFoods(db));

  const trimmed = query.trim();
  const searchActive = trimmed.length >= 2;
  const visibleResults = searchActive ? results : [];

  // Debounced food search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      searchFoods(q, controller.signal)
        .then((r) => {
          setResults(r);
          setSearchError(null);
        })
        .catch((e: Error) => {
          if (e.name !== 'AbortError')
            setSearchError('Search unavailable — enter details manually.');
        })
        .finally(() => setSearching(false));
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // While a searched food is selected, the details follow its portion size.
  const shown: Form = selected ? formFromFood(selected, grams) : form;

  // Editing any detail by hand detaches it from the selected food.
  const set = (key: keyof Form) => (text: string) => {
    setSelected(null);
    setForm({ ...shown, [key]: text });
  };

  const calories = Number(shown.calories);
  const canSave =
    shown.name.trim().length > 0 &&
    shown.calories !== '' &&
    Number.isFinite(calories) &&
    calories >= 0;

  async function save() {
    await addMeal(db, {
      day,
      meal_type: mealType,
      name: shown.name.trim(),
      calories,
      protein: Number(shown.protein) || 0,
      carbs: Number(shown.carbs) || 0,
      fat: Number(shown.fat) || 0,
    });
    router.back();
  }

  return (
    <Screen tabs={false}>
      <View style={styles.chips}>
        {MEAL_TYPES.map((t) => (
          <Chip
            key={t}
            label={t[0].toUpperCase() + t.slice(1)}
            selected={mealType === t}
            onPress={() => setMealType(t)}
          />
        ))}
      </View>

      <View style={styles.row}>
        <Field
          placeholder="Search foods (e.g. greek yogurt)"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {Platform.OS !== 'web' && (
          <Pressable
            accessibilityLabel="Scan barcode"
            onPress={() => router.push({ pathname: '/scan', params: { day, mealType } })}
            style={[styles.scanButton, { backgroundColor: theme.tintSoft }]}>
            <ThemedText type="smallBold" style={{ color: theme.tint }}>
              Scan
            </ThemedText>
          </Pressable>
        )}
      </View>

      {searching && <ActivityIndicator color={theme.tint} />}
      {searchActive && searchError && (
        <ThemedText type="small" themeColor="textSecondary">
          {searchError}
        </ThemedText>
      )}

      {visibleResults.length > 0 && (
        <Card>
          {visibleResults.slice(0, 8).map((food) => (
            <Pressable
              key={food.id}
              onPress={() => {
                setSelected(food);
                setQuery('');
              }}
              style={styles.resultRow}>
              <View style={styles.flex}>
                <ThemedText numberOfLines={1}>{food.name}</ThemedText>
                {food.brand && (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {food.brand}
                  </ThemedText>
                )}
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {Math.round(food.per100g.calories)} kcal/100g
              </ThemedText>
            </Pressable>
          ))}
        </Card>
      )}

      {visibleResults.length === 0 && !selected && recent.length > 0 && (
        <>
          <SectionTitle>Recent</SectionTitle>
          <View style={styles.chips}>
            {recent.map((m) => (
              <Chip
                key={m.id}
                label={m.name.length > 28 ? `${m.name.slice(0, 27)}…` : m.name}
                selected={false}
                onPress={() => {
                  setSelected(null);
                  setForm({
                    name: m.name,
                    calories: String(m.calories),
                    protein: String(m.protein),
                    carbs: String(m.carbs),
                    fat: String(m.fat),
                  });
                }}
              />
            ))}
          </View>
        </>
      )}

      <SectionTitle>Details</SectionTitle>
      {selected && (
        <Field
          label="Portion (g)"
          value={grams}
          onChangeText={setGrams}
          keyboardType="number-pad"
        />
      )}
      <Field
        label="Name"
        placeholder="e.g. Chicken & rice bowl"
        value={shown.name}
        onChangeText={set('name')}
      />
      <View style={styles.row}>
        <Field
          label="Calories"
          value={shown.calories}
          onChangeText={set('calories')}
          keyboardType="decimal-pad"
        />
        <Field
          label="Protein g"
          value={shown.protein}
          onChangeText={set('protein')}
          keyboardType="decimal-pad"
        />
      </View>
      <View style={styles.row}>
        <Field
          label="Carbs g"
          value={shown.carbs}
          onChangeText={set('carbs')}
          keyboardType="decimal-pad"
        />
        <Field
          label="Fat g"
          value={shown.fat}
          onChangeText={set('fat')}
          keyboardType="decimal-pad"
        />
      </View>

      <Button label="Save" disabled={!canSave} onPress={save} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.credit}>
        Nutrition data from Open Food Facts (openfoodfacts.org)
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  flex: {
    flex: 1,
  },
  scanButton: {
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two + 4,
  },
  credit: {
    textAlign: 'center',
  },
});
