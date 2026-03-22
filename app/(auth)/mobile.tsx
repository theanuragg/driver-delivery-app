import {
    Colors,
    Radius,
    Shadows,
    Spacing,
    Typography,
} from "@/constants/theme";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Phone } from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { height } = Dimensions.get("window");

export default function MobileScreen() {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNext = async () => {
    if (!mobile || mobile.length < 10) {
      Alert.alert("Error", "Please enter a valid mobile number");
      return;
    }
    setLoading(true);
    try {
      router.push({
        pathname: "/(auth)/otp",
        params: { mobile: mobile },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft color={Colors.white} size={24} />
        </TouchableOpacity>
        <View style={styles.logoCircle}>
          <Phone color={Colors.accent} size={40} />
        </View>
        <Text style={styles.title}>Mobile Verification</Text>
        <Text style={styles.tagline}>Secure your account with 2FA</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sheetTitle}>Enter Mobile Number</Text>
            <Text style={styles.sheetSubtitle}>
              We&apos;ll send a 6-digit code to verify your identity
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <Phone
                  size={18}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={Colors.textMuted}
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleNext}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
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
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  title: {
    ...Typography.headings,
    color: Colors.white,
    fontSize: 24,
  },
  tagline: {
    ...Typography.body,
    color: "rgba(255, 255, 255, 0.6)",
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
    overflow: "hidden",
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
    fontWeight: "700",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.m,
    ...Shadows,
    shadowColor: Colors.accent,
    shadowOpacity: 0.2,
  },
  buttonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: "700",
  },
});
