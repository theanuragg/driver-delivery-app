import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Text, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Dimensions
} from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { Truck, Mail, Lock } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Truck color={Colors.accent} size={40} />
        </View>
        <Text style={styles.title}>FastTrack Driver</Text>
        <Text style={styles.tagline}>Reliable Logistics Management</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.sheet}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sheetTitle}>Welcome Back</Text>
            <Text style={styles.sheetSubtitle}>Sign in to start your shift</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@company.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPass}>
              <Text style={styles.forgotPassText}>Forgot Password?</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  title: {
    ...Typography.headings,
    color: Colors.white,
    fontSize: 24,
  },
  tagline: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  sheetTitle: {
    ...Typography.headings,
    fontSize: 22,
    marginBottom: Spacing.xs,
  },
  sheetSubtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.l,
  },
  label: {
    ...Typography.micro,
    color: Colors.textPrimary,
    marginBottom: Spacing.s,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.m,
    height: 55,
    ...Shadows,
  },
  inputIcon: {
    marginRight: Spacing.s,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.accent,
    height: 55,
    borderRadius: Radius.input,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.m,
    ...Shadows,
    shadowColor: Colors.accent,
    shadowOpacity: 0.2,
  },
  buttonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '700',
  },
  forgotPass: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  forgotPassText: {
    ...Typography.footnote,
    color: Colors.accent,
    fontWeight: '700',
  },
});
