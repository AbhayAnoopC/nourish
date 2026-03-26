import { View, Text, StyleSheet } from 'react-native';

export default function AmazfitScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect Your Watch</Text>
      <Text style={styles.subtitle}>Amazfit connection coming in step 9</Text>
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
