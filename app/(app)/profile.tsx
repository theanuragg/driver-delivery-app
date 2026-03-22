import {
  Colors,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Settings,
  Shield,
  User as UserIcon,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/(auth)/login");
          } catch (error) {
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: <UserIcon size={20} color={Colors.textPrimary} />,
      label: "Personal Details",
      onPress: () => {},
    },
    {
      icon: <MapPin size={20} color={Colors.textPrimary} />,
      label: "Service Area",
      onPress: () => {},
    },
    {
      icon: <Bell size={20} color={Colors.textPrimary} />,
      label: "Notifications",
      onPress: () => {},
    },
    {
      icon: <Shield size={20} color={Colors.textPrimary} />,
      label: "Privacy & Security",
      onPress: () => {},
    },
    {
      icon: <Settings size={20} color={Colors.textPrimary} />,
      label: "App Settings",
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <UserIcon size={40} color={Colors.white} />
            </View>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Settings size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>Driver Partner</Text>
          <Text style={styles.userStatus}>
            Active • ID: {user?.uid.slice(0, 8)}
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Mail size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{user?.email}</Text>
            </View>
            <View style={styles.infoBox}>
              <Phone size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{user?.mobile || "Not set"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={item.onPress}
              >
                <View style={styles.menuLeft}>
                  <View style={styles.menuIconBox}>{item.icon}</View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <ChevronRight size={20} color={Colors.border} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={Colors.accent} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0 (Build 20260321)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: Spacing.xl,
  },
  headerContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.headings,
    fontSize: 28,
    color: Colors.white,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    alignItems: "center",
    marginTop: -Spacing.xl,
    ...Shadows,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.m,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  editAvatarBtn: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userName: {
    ...Typography.body,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  userStatus: {
    ...Typography.footnote,
    color: Colors.accent,
    marginBottom: Spacing.l,
    fontWeight: "600",
  },
  infoRow: {
    width: "100%",
    gap: Spacing.s,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg,
    padding: Spacing.m,
    borderRadius: Radius.input,
    gap: Spacing.m,
  },
  infoText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    marginBottom: Spacing.m,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    overflow: "hidden",
    ...Shadows,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    padding: Spacing.l,
    borderRadius: Radius.card,
    marginTop: Spacing.xl,
    gap: Spacing.m,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.1)",
  },
  logoutText: {
    ...Typography.body,
    color: Colors.accent,
    fontWeight: "600",
  },
  versionText: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xl,
    opacity: 0.5,
  },
});
