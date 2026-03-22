import { OTPInput } from "@/components/custom/OTPInput";
import {
    Colors,
    Spacing,
    Typography
} from "@/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Lock, RefreshCcw } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { height } = Dimensions.get("window");

export default function OTPScreen() {
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const { verifyOTP, setMobile } = useAuth();
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const router = useRouter();

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (otp: string) => {
    setLoading(true);
    try {
      const success = await verifyOTP(otp);
      if (success) {
        if (mobile) {
          await setMobile(mobile);
        }
      } else {
        Alert.alert("Error", "Invalid OTP. Try 123456");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (timer === 0) {
      setTimer(30);
      Alert.alert("Success", "OTP Resent!");
    }
  };

  const maskMobile = (num: string) => {
    if (!num) return "";
    const clean = num.replace(/\D/g, "");
    if (clean.length < 4) return num;
    return `+${clean.slice(0, clean.length - 4).replace(/./g, "*")} ${clean.slice(-4)}`;
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
          <Lock color={Colors.accent} size={40} />
        </View>
        <Text style={styles.title}>Verification Code</Text>
        <Text style={styles.tagline}>Sent to {maskMobile(mobile || "")}</Text>
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
            <Text style={styles.sheetTitle}>Enter 6-Digit Code</Text>
            <Text style={styles.sheetSubtitle}>
              Enter the verification code we just sent you
            </Text>

            <OTPInput onComplete={handleVerify} />

            {loading && (
              <ActivityIndicator
                color={Colors.accent}
                style={{ marginTop: Spacing.m }}
              />
            )}

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn&apos;t receive the code?</Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={timer > 0}
                style={styles.resendButton}
              >
                <RefreshCcw
                  size={14}
                  color={timer > 0 ? Colors.textMuted : Colors.accent}
                />
                <Text
                  style={[
                    styles.resendLink,
                    { color: timer > 0 ? Colors.textMuted : Colors.accent },
                  ]}
                >
                  {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                </Text>
              </TouchableOpacity>
            </View>
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
    alignItems: "center",
  },
  sheetTitle: {
    ...Typography.headings,
    fontSize: 22,
    marginBottom: Spacing.xs,
    alignSelf: "flex-start",
  },
  sheetSubtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
    alignSelf: "flex-start",
  },
  resendContainer: {
    marginTop: Spacing.xxl,
    alignItems: "center",
  },
  resendText: {
    ...Typography.body,
    color: Colors.textMuted,
    marginBottom: Spacing.s,
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  resendLink: {
    ...Typography.footnote,
    fontWeight: "700",
  },
});
