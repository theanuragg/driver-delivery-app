import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MobileScreen() {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const { setMobile: updateMobile } = useAuth();
  const router = useRouter();

  const handleNext = async () => {
    if (!mobile || mobile.length < 10) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return;
    }
    setLoading(true);
    try {
      // For local testing, we just "send" the OTP
      router.push('/(auth)/otp?mobile=' + encodeURIComponent(mobile));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <ThemedText type="title" style={styles.title}>Mobile Verification</ThemedText>
        <ThemedText style={styles.subtitle}>Enter your mobile number to receive an OTP</ThemedText>
        
        <TextInput
          style={styles.input}
          placeholder="Mobile Number"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          placeholderTextColor="#aaa"
        />
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send OTP</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.info}>We'll simulate an OTP for local testing</Text>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  info: {
    marginTop: 20,
    textAlign: 'center',
    opacity: 0.5,
    fontSize: 12,
    color: '#fff',
  }
});
