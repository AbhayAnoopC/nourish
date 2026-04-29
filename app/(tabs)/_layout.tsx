import { Tabs } from 'expo-router';
import { TabBarWithFab } from '@/components/TabBarWithFab';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBarWithFab {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="meals" options={{ title: 'Meals' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
