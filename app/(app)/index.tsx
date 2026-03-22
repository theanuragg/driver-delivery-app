import { DeliveryCard } from "@/components/custom/DeliveryCard";
import {
  Colors,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/src/lib/firebase";
import { useRouter } from "expo-router";
import { Bell, Home, Package, Plus, Search, User } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  address: string;
  status: string;
  price?: string;
  description?: string;
}

const TABS = ["Assigned", "Pending", "Completed", "Drafts"];

export default function DeliveriesScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Assigned");
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = db
      .collection("deliveries")
      .where("assignedDriver", "==", user.uid)
      .onSnapshot(
        (snapshot: any) => {
          const docs = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setDeliveries(docs);
          setLoading(false);
        },
        (error: any) => {
          console.error("Firestore error:", error);
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, [user]);

  const filteredDeliveries = useMemo(() => {
    let list = deliveries;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.customerName?.toLowerCase().includes(query) ||
          d.orderId?.toLowerCase().includes(query) ||
          d.address?.toLowerCase().includes(query),
      );
    }

    // Filter by tab status
    if (activeTab === "Completed") {
      list = list.filter((d) => d.status === "delivered");
    } else if (activeTab === "Pending") {
      list = list.filter((d) => d.status === "pending");
    } else if (activeTab === "Assigned") {
      list = list.filter((d) => d.status !== "delivered");
    }

    return list;
  }, [deliveries, searchQuery, activeTab]);

  const renderItem = useCallback(
    ({ item }: { item: Delivery }) => (
      <DeliveryCard
        orderId={item.orderId}
        customerName={item.customerName}
        status={item.status || "pending"}
        price={item.price}
        description={item.description}
        hasNotification={item.status === "pending"}
        onPress={() =>
          router.push({ pathname: "/(app)/details", params: { id: item.id } })
        }
      />
    ),
    [router],
  );

  const keyExtractor = useCallback((item: Delivery) => item.id, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.darkHeader}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>My Shipments</Text>
            <TouchableOpacity style={styles.notificationBtn}>
              <Bell size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Search size={18} color={Colors.textSecondary} />
            <TextInput
              placeholder="Search shipment"
              placeholderTextColor={Colors.textSecondary}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          data={TABS}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tabChip,
                activeTab === item && styles.activeTabChip,
              ]}
              onPress={() => setActiveTab(item)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === item && styles.activeTabText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.tabsList}
        />
      </View>

      <FlatList
        data={filteredDeliveries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Package
                size={64}
                color={Colors.textSecondary}
                style={{ opacity: 0.2, marginBottom: 16 }}
              />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No matching shipments found."
                  : "No shipments in this category."}
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {}}
            tintColor={Colors.accent}
          />
        }
      />

      {/* Custom Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabBtn}>
          <Home size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.centerAddBtn}
          onPress={() => router.push("/(app)/create")}
        >
          <Plus size={32} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => router.push("/(app)/profile" as any)}
        >
          <User size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
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
    paddingBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.m,
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontWeight: Typography.headings.fontWeight,
    fontSize: 28,
    color: Colors.white,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.l,
    height: 52,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.m,
    ...Typography.body,
    color: Colors.white,
  },
  tabsContainer: {
    marginTop: Spacing.l,
    marginBottom: Spacing.s,
  },
  tabsList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.s,
  },
  tabChip: {
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    borderRadius: Radius.pill,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTabChip: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  tabText: {
    ...Typography.footnote,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  bottomTabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: Colors.white,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows,
  },
  tabBtn: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  centerAddBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -40,
    ...Shadows,
    shadowColor: Colors.accent,
    shadowOpacity: 0.3,
  },
});
