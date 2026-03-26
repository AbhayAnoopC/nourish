import { View, Text, StyleSheet } from 'react-native';

export default function MealsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Meals</Text>
      <Text style={styles.subtitle}>Saved meals coming in step 7</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});
