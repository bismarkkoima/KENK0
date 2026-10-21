import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeTabs } from 'expo-router/native-tabs';
import { Platform } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.background}
      indicatorColor={theme.tintSoft}
      tintColor={theme.tintText}
      labelStyle={{ selected: { color: theme.tintText } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Summary</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="circle.circle" md="donut_large" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="activity">
        <NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
        {/* Kenko's own runner figure; the web tab bar shows labels only. */}
        {Platform.OS !== 'web' && (
          <NativeTabs.Trigger.Icon
            src={<NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="run-fast" />}
          />
        )}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="food">
        <NativeTabs.Trigger.Label>Food</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mind">
        <NativeTabs.Trigger.Label>Mind</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="brain.head.profile" md="psychology" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>Trends</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="insights" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
