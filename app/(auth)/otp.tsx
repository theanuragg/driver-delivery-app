import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function OTPScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyOTP, setMobile } = useAuth();
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const router = useRouter();

  const handleVerify = async () => {
    if (otp.length < 6) {
      Alert.alert('Error', 'Please enter a 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const success = await verifyOTP(otp);
      if (success) {
        if (mobile) {
          await setMobile(mobile);
          // Redirect will be handled by RootLayout
        }
      } else {
        Alert.alert('Error', 'Invalid OTP. Try 123456');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <ThemedText type="title" style={styles.title}>Enter OTP</ThemedText>
        <ThemedText style={styles.subtitle}>Sent to {mobile}</ThemedText>
        
        <TextInput
          style={styles.input}
          placeholder="6-digit OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          placeholderTextColor="#aaa"
        />
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.info}>Use OTP: 123456</Text>
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
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 10,
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
