import { View, Text, StyleSheet } from 'react-native';

export default function LogScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log Food</Text>
      <Text style={styles.subtitle}>Food logging coming in step 4</Text>
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
