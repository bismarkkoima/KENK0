import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Glass, IconButton, Screen, SectionTitle } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { deleteMeal, getMealsForDay, MEAL_TYPES, type Meal } from '@/db/queries';
import { useFocusedQuery } from '@/hooks/use-focused-query';
import { addDays, formatDayLabel, toDayKey } from '@/lib/dates';

export default function FoodScreen() {
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
      <Glass radius={Radius.pill} style={styles.dayNav}>
        <IconButton
          icon={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
          label="Previous day"
          size={40}
          onPress={() => setDay(addDays(day, -1))}
        />
        <View style={styles.dayCenter}>
          <ThemedText type="smallBold">{formatDayLabel(day)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {Math.round(total)} kcal
          </ThemedText>
        </View>
        <View style={{ opacity: isToday ? 0.3 : 1 }} pointerEvents={isToday ? 'none' : 'auto'}>
          <IconButton
            icon={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            label="Next day"
            size={40}
            onPress={() => setDay(addDays(day, 1))}
          />
        </View>
      </Glass>

      <Button
        label="Log food"
        icon={{ ios: 'plus', android: 'add', web: 'add' }}
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
    padding: Spacing.one + 2,
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
