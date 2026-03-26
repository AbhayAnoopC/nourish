import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  function handleGetStarted() {
    router.push('/onboarding/profile');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>Nourish</Text>
      <Text style={styles.tagline}>Track calories without a food scale.</Text>
      <Pressable style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2D9CDB',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#2D9CDB',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
