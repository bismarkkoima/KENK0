import { SymbolView } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { Card, IconTile, type IconName } from '@/components/ui';
import { Spacing, type GradientName } from '@/constants/theme';
import { getSetting, saveSetting } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';

/** A dismissible hint card. Once closed it stays hidden (stored under `tip:<id>`). */
export function TipCard({
  id,
  icon,
  color = 'tint',
  title,
  body,
  action,
}: {
  id: string;
  icon: IconName;
  color?: GradientName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  const db = useSQLiteContext();
  const theme = useTheme();
  // Hidden until we know it wasn't dismissed, so it never flashes.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    getSetting<boolean>(db, `tip:${id}`).then((dismissed) => setVisible(!dismissed));
  }, [db, id]);

  if (!visible) return null;

  return (
    <Card>
      <View style={styles.row}>
        <IconTile icon={icon} color={color} size={48} />
        <View style={styles.text}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText themeColor="textSecondary">{body}</ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss tip"
          hitSlop={10}
          onPress={() => {
            setVisible(false);
            saveSetting(db, `tip:${id}`, true);
          }}
          style={[styles.close, { backgroundColor: theme.backgroundSelected }]}>
          <SymbolView
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={14}
            weight="bold"
            tintColor={theme.textSecondary}
          />
        </Pressable>
      </View>
      {action}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  text: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: 700,
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
