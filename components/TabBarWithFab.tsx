import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, UtensilsCrossed, Settings } from 'lucide-react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { HeroFab } from './HeroFab';
import { LogMethodsSheet } from './LogMethodsSheet';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const ICONS: Record<string, typeof House> = {
  index: House,
  meals: UtensilsCrossed,
  settings: Settings,
};

const LABELS: Record<string, string> = {
  index: 'Home',
  meals: 'Meals',
  settings: 'Settings',
};

export function TabBarWithFab({ state, navigation }: BottomTabBarProps) {
  const tokens = useTokens();
  const insets = useSafeAreaInsets();
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tokens.bg.surface,
          borderTopColor: tokens.border.hairline,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, idx) => {
          const focused = state.index === idx;
          const Icon = ICONS[route.name] ?? House;
          const label = LABELS[route.name] ?? route.name;
          const color = focused ? tokens.accent.primary : tokens.text.tertiary;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={styles.tab}
            >
              <Icon size={22} color={color} />
              <Text style={[Type.textXs, { color }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.fabPosition} pointerEvents="box-none">
        <HeroFab onPress={() => setSheetVisible(true)} />
      </View>
      <LogMethodsSheet visible={sheetVisible} onDismiss={() => setSheetVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },
  row: {
    flexDirection: 'row',
    height: 56,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  fabPosition: {
    position: 'absolute',
    top: -64,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
