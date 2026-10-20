import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { deleteMeal, getMealsForDay, MEAL_TYPES, type Meal } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { useTheme } from '@/hooks/use-theme';
import { addDays, formatDayLabel, toDayKey } from '@/lib/dates';

export default function FoodScreen() {
  const theme = useTheme();
  const [day, setDay] = useState(toDayKey());
  const { data: meals = [], reload, db } = useFocusedQuery((db) => getMealsForDay(db, day), day);
  const isToday = day === toDayKey();
  const total = meals.reduce((sum, m) => sum + m.calories, 0);

  function confirmDelete(meal: Meal) {
    const remove = async () => {
      await deleteMeal(db, meal.id);
      reload();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${meal.name}?`)) remove();
      return;
    }
    Alert.alert('Remove entry?', meal.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: remove },
    ]);
  }

  return (
    <Screen title="Food log">
      <View style={styles.dayNav}>
        <Pressable onPress={() => setDay(addDays(day, -1))} hitSlop={12}>
          <ThemedText style={{ color: theme.tint }}>‹ Prev</ThemedText>
        </Pressable>
        <View style={styles.dayCenter}>
          <ThemedText type="smallBold">{formatDayLabel(day)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {Math.round(total)} kcal
          </ThemedText>
        </View>
        <Pressable disabled={isToday} onPress={() => setDay(addDays(day, 1))} hitSlop={12}>
          <ThemedText style={{ color: theme.tint, opacity: isToday ? 0.3 : 1 }}>Next ›</ThemedText>
        </Pressable>
      </View>

      <Button
        label="Log food"
        onPress={() => router.push({ pathname: '/add-meal', params: { day } })}
      />

      {MEAL_TYPES.map((type) => {
        const items = meals.filter((m) => m.meal_type === type);
        const subtotal = items.reduce((sum, m) => sum + m.calories, 0);
        return (
          <View key={type} style={styles.section}>
            <SectionTitle
              right={
                <ThemedText type="small" themeColor="textSecondary">
                  {Math.round(subtotal)} kcal
                </ThemedText>
              }>
              {type}
            </SectionTitle>
            <Card>
              {items.length === 0 ? (
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/add-meal', params: { day, mealType: type } })
                  }>
                  <ThemedText type="small" themeColor="textSecondary">
                    Nothing logged · tap to add
                  </ThemedText>
                </Pressable>
              ) : (
                items.map((meal) => (
                  <Pressable
                    key={meal.id}
                    onLongPress={() => confirmDelete(meal)}
                    style={styles.mealRow}>
                    <View style={styles.mealName}>
                      <ThemedText numberOfLines={1}>{meal.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold">{Math.round(meal.calories)}</ThemedText>
                  </Pressable>
                ))
              )}
            </Card>
          </View>
        );
      })}

      {meals.length > 0 && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          Long-press an entry to remove it.
        </ThemedText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCenter: {
    alignItems: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  mealName: {
    flex: 1,
  },
  hint: {
    textAlign: 'center',
  },
});
