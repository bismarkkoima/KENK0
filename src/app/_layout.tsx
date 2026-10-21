import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_500Medium_Italic,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
  DMSans_900Black,
} from '@expo-google-fonts/dm-sans';
import {
  SourceSerif4_300Light,
  SourceSerif4_400Regular,
  SourceSerif4_400Regular_Italic,
  SourceSerif4_500Medium,
  SourceSerif4_500Medium_Italic,
  SourceSerif4_600SemiBold,
  SourceSerif4_700Bold,
} from '@expo-google-fonts/source-serif-4';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { Colors, FontFiles } from '@/constants/theme';
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
  const [fontsLoaded, fontError] = useFonts({
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_400Regular_Italic,
    DMSans_500Medium,
    DMSans_500Medium_Italic,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
    DMSans_900Black,
    SourceSerif4_300Light,
    SourceSerif4_400Regular,
    SourceSerif4_400Regular_Italic,
    SourceSerif4_500Medium,
    SourceSerif4_500Medium_Italic,
    SourceSerif4_600SemiBold,
    SourceSerif4_700Bold,
  });
  // If a font fails to load, carry on with the system font rather than a blank screen.
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  // Match navigation headers and backgrounds to Kenko's palette.
  const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const palette = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.tintText,
      background: palette.background,
      card: palette.background,
      text: palette.text,
      border: palette.backgroundSelected,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <SQLiteProvider databaseName="kenko.db" onInit={migrateDb}>
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerTitleStyle: { fontFamily: FontFiles.DMSans[700] },
            headerBackButtonDisplayMode: 'minimal',
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add-meal" options={{ presentation: 'modal', title: 'Log food' }} />
          <Stack.Screen name="goals" options={{ presentation: 'modal', title: 'Your goals' }} />
          <Stack.Screen name="reminders" options={{ presentation: 'modal', title: 'Reminders' }} />
          <Stack.Screen
            name="log-workout"
            options={{ presentation: 'modal', title: 'Log a workout' }}
          />
          <Stack.Screen name="mind-entry" options={{ presentation: 'modal', title: 'Check-in' }} />
          <Stack.Screen name="profile" options={{ presentation: 'modal', title: 'Your profile' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="badges" options={{ title: 'Badges & rewards' }} />
          <Stack.Screen name="backup" options={{ title: 'Backup & restore' }} />
          <Stack.Screen
            name="workout/[type]"
            options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }}
          />
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
