import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/src/lib/firebase";
import { useRouter } from "expo-router";
import { ChevronRight, Map, Package } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  address: string;
  status: string;
}

export default function DeliveriesScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // Fetch deliveries from Firestore
    const unsubscribe = db
      .collection("deliveries")
      .where("assignedDriver", "==", user.uid)
      .onSnapshot((snapshot: any) => {
        const docs = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDeliveries(docs);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [user]);

  const renderItem = ({ item }: { item: Delivery }) => (
    <View style={styles.deliveryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.orderBadge}>
          <Package size={14} color="#007AFF" />
          <Text style={styles.orderText}>{item.orderId}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "delivered" ? "#4CD964" : "#FF9500",
            },
          ]}
        >
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <ThemedText style={styles.customerName}>{item.customerName}</ThemedText>
      <ThemedText style={styles.address}>{item.address}</ThemedText>

      <TouchableOpacity style={styles.detailButton}>
        <Text style={styles.detailText}>View Details</Text>
        <ChevronRight size={16} color="#aaa" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={deliveries}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <ThemedText>No deliveries assigned to you.</ThemedText>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => {}} />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(app)/map")}
      >
        <Map color="#fff" size={24} />
        <Text style={styles.fabText}>Optimised Route</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 15,
    paddingBottom: 100,
  },
  deliveryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  orderBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  orderText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  customerName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  address: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 15,
  },
  detailButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  detailText: {
    color: "#aaa",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  fab: {
    position: "absolute",
    bottom: 25,
    right: 20,
    left: 20,
    backgroundColor: "#007AFF",
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
