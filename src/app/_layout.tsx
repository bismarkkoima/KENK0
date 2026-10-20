import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { migrateDb } from '@/db/migrations';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName="kenko.db" onInit={migrateDb}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add-meal" options={{ presentation: 'modal', title: 'Log food' }} />
          <Stack.Screen name="goals" options={{ presentation: 'modal', title: 'Your goals' }} />
          <Stack.Screen
            name="session/[id]"
            options={{ presentation: 'fullScreenModal', headerShown: false }}
          />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
