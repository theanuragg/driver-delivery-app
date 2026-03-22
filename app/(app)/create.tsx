import { ThemedView } from "@/components/themed-view";
import {
  Colors,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { db } from "@/src/lib/firebase";
import { useRouter } from "expo-router";
import { ChevronLeft, Info, Package, MapPin, User, DollarSign, Calendar } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthContext";

export default function CreateShipmentScreen() {
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("$");
  const [expectedOn, setExpectedOn] = useState("14 Aug 2024");
  
  const { user } = useAuth();
  const router = useRouter();

  const handleCreate = async () => {
    if (!customerName || !address || !user) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      // Mock coordinates for SF
      const lat = 37.7749 + (Math.random() - 0.5) * 0.05;
      const lng = -122.4194 + (Math.random() - 0.5) * 0.05;

      await db.collection("deliveries").add({
        orderId,
        customerName,
        address,
        description: description || "General Delivery",
        price: price || "$20",
        expectedOn,
        status: "pending",
        assignedDriver: user.uid,
        latitude: lat,
        longitude: lng,
        createdDate: new Date().toLocaleDateString(),
        shippedBy: "Welton Express",
      });

      Alert.alert("Success", "Shipment created successfully!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to create shipment.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.darkHeader}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Shipment</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipment Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Order ID</Text>
              <View style={styles.inputWrapper}>
                <Package size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={orderId}
                  onChangeText={setOrderId}
                  placeholder="ORD-0000"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <View style={styles.inputWrapper}>
                <Info size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g. Birthday gift"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer Name *</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Full name"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Delivery Address *</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Full address"
                  multiline
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Logistics & Payment</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Order Cost</Text>
                <View style={styles.inputWrapper}>
                  <DollarSign size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="$0.00"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Expected Date</Text>
                <View style={styles.inputWrapper}>
                  <Calendar size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={expectedOn}
                    onChangeText={setExpectedOn}
                    placeholder="DD MMM YYYY"
                  />
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.createButton, loading && styles.disabledButton]} 
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.createButtonText}>Create Shipment</Text>
            )}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  darkHeader: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.l,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.m,
  },
  headerTitle: {
    ...Typography.headings,
    fontSize: 22,
    color: Colors.white,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.l,
    marginBottom: Spacing.l,
    ...Shadows,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: "800",
    marginBottom: Spacing.l,
    color: Colors.primary,
  },
  inputGroup: {
    marginBottom: Spacing.m,
  },
  label: {
    ...Typography.micro,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.m,
    minHeight: 52,
    gap: Spacing.s,
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: Spacing.s,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  createButton: {
    backgroundColor: Colors.accent,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.m,
    ...Shadows,
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    ...Typography.body,
    fontWeight: "800",
    color: Colors.white,
  },
});
