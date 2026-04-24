import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';

interface LogMethod {
  icon: string;
  title: string;
  description: string;
  available: boolean;
  onPress: () => void;
}

export default function LogScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const methods: LogMethod[] = [
    {
      icon: '\ud83d\udd0d',
      title: 'Manual Search',
      description: 'Search USDA and Open Food Facts databases',
      available: true,
      onPress: () => router.push('/food-search'),
    },
    {
      icon: '\ud83d\udcca',
      title: 'Barcode Scan',
      description: 'Scan a product barcode',
      available: false,
      onPress: () => undefined,
    },
    {
      icon: '\ud83c\udff7\ufe0f',
      title: 'Nutrition Label Scan',
      description: 'Photo of a nutrition facts panel',
      available: false,
      onPress: () => undefined,
    },
    {
      icon: '\ud83d\udcf7',
      title: 'Photo Scan',
      description: 'Take a photo of your meal',
      available: false,
      onPress: () => undefined,
    },
    {
      icon: '\ud83c\udf99\ufe0f',
      title: 'Voice Log',
      description: 'Describe your meal out loud',
      available: false,
      onPress: () => undefined,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: colors.text }]}>Log Food</Text>
        <Text style={[styles.subheading, { color: colors.placeholder }]}>
          Choose how you want to add food
        </Text>

        <View style={styles.methodList}>
          {methods.map((method) => (
            <TouchableOpacity
              key={method.title}
              style={[
                styles.methodCard,
                {
                  backgroundColor: colors.card,
                  borderColor: method.available ? colors.tint : colors.border,
                  opacity: method.available ? 1 : 0.55,
                },
              ]}
              onPress={method.available ? method.onPress : undefined}
              activeOpacity={method.available ? 0.7 : 1}
            >
              <Text style={styles.icon}>{method.icon}</Text>
              <View style={styles.methodInfo}>
                <View style={styles.titleRow}>
                  <Text style={[styles.methodTitle, { color: colors.text }]}>
                    {method.title}
                  </Text>
                  {!method.available && (
                    <View style={[styles.soonBadge, { backgroundColor: colors.border }]}>
                      <Text style={[styles.soonText, { color: colors.placeholder }]}>Soon</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.methodDesc, { color: colors.placeholder }]}>
                  {method.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
  },
  heading: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  subheading: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.lg,
  },
  methodList: {
    gap: SPACING.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  icon: {
    fontSize: 28,
    lineHeight: 36,
    width: 36,
    textAlign: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  methodTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  methodDesc: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  soonBadge: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  soonText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
});
