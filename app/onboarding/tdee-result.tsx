import { View, Text, StyleSheet } from 'react-native';

export default function TdeeResultScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Calorie Target</Text>
      <Text style={styles.subtitle}>TDEE result coming in step 2</Text>
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
