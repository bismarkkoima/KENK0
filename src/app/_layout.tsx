import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { migrateDb } from '@/db/migrations';

SplashScreen.preventAutoHideAsync();

if (Platform.OS !== 'web') {
  // Show reminders as banners even while the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

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
          <Stack.Screen name="reminders" options={{ presentation: 'modal', title: 'Reminders' }} />
          <Stack.Screen
            name="scan"
            options={{ presentation: 'fullScreenModal', headerShown: false }}
          />
          <Stack.Screen
            name="session/[id]"
            options={{ presentation: 'fullScreenModal', headerShown: false }}
          />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
