import { Pressable, Text, StyleSheet, View } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface SelectOptionProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

export function SelectOption({ label, description, selected, onPress }: SelectOptionProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        {
          borderColor: selected ? colors.tint : colors.border,
          backgroundColor: selected ? colors.tint + '18' : colors.card,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {description !== undefined && (
          <Text style={[styles.description, { color: colors.placeholder }]}>{description}</Text>
        )}
      </View>
      <View style={[styles.radio, { borderColor: selected ? colors.tint : colors.border }]}>
        {selected && <View style={[styles.radioInner, { backgroundColor: colors.tint }]} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
