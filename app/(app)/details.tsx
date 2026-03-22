import { StatusPill } from "@/components/custom/StatusPill";
import { ThemedView } from "@/components/themed-view";
import {
  Colors,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { db } from "@/src/lib/firebase";
import axios from "axios";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Check,
  ChevronLeft,
  Edit2,
  Minus,
  Navigation as NavIcon,
  Package,
  Phone,
  Plus,
  X,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  address: string;
  status: string;
  latitude: number;
  longitude: number;
  mobile?: string;
  price?: string;
  description?: string;
  shippedBy?: string;
  createdDate?: string;
  expectedOn?: string;
}

const { width, height } = Dimensions.get("window");

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Delivery>>({});
  const [updating, setUpdating] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<
    {
      latitude: number;
      longitude: number;
    }[]
  >([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const router = useRouter();

  const mapRef = useRef<MapView>(null);

  const GOOGLE_API_KEY =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    Constants.expoConfig?.extra?.googleMapsApiKey;

  const decodePolyline = (t: string) => {
    let points = [];
    let index = 0,
      len = t.length;
    let lat = 0,
      lng = 0;
    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const fetchRoute = async (
    origin: { latitude: number; longitude: number },
    dest: { latitude: number; longitude: number },
  ) => {
    if (!GOOGLE_API_KEY) {
      // Mock road routing
      const midLat =
        (origin.latitude + dest.latitude) / 2 + (Math.random() - 0.5) * 0.005;
      const midLng =
        (origin.longitude + dest.longitude) / 2 + (Math.random() - 0.5) * 0.005;
      setRouteCoordinates([
        origin,
        { latitude: midLat, longitude: midLng },
        dest,
      ]);
      return;
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${dest.latitude},${dest.longitude}&key=${GOOGLE_API_KEY}`,
      );

      if (response.data.routes.length > 0) {
        const points = decodePolyline(
          response.data.routes[0].overview_polyline.points,
        );
        setRouteCoordinates(points);
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
    }
  };

  useEffect(() => {
    if (delivery && currentLocation) {
      fetchRoute(currentLocation, {
        latitude: delivery.latitude,
        longitude: delivery.longitude,
      });
    }
  }, [delivery?.id, currentLocation?.latitude, currentLocation?.longitude]);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = db
      .collection("deliveries")
      .doc(id)
      .onSnapshot((doc: any) => {
        if (doc.exists) {
          const data = {
            id: doc.id,
            ...doc.data(),
            shippedBy: doc.data().shippedBy || "Welton Express",
            createdDate: doc.data().createdDate || "12/03/2025",
            expectedOn: doc.data().expectedOn || "14 Aug 2024",
            price: doc.data().price || "$250",
            description: doc.data().description || "Birthday gift",
          };
          setDelivery(data);

          // Auto-center map on the delivery
          setTimeout(() => {
            mapRef.current?.animateToRegion(
              {
                latitude: data.latitude,
                longitude: data.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              1000,
            );
          }, 500);
        }
        setLoading(false);
      });

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          let location = await Location.getCurrentPositionAsync({});
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(coords);
        } catch (error) {
          console.error("Error getting location:", error);
        }
      }
    })();

    return () => unsubscribe();
  }, [id]);

  const handleCall = () => {
    const phone = delivery?.mobile || "+15550000000";
    Linking.openURL(`tel:${phone}`);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id || !delivery) return;

    Alert.alert(
      "Update Status",
      `Are you sure you want to mark this order as "${newStatus}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setUpdating(true);
            try {
              await db
                .collection("deliveries")
                .doc(id)
                .update({
                  status: newStatus,
                  deliveredAt:
                    newStatus === "delivered" ? new Date().toISOString() : null,
                });
              Alert.alert("Success", `Order marked as ${newStatus}`);
            } catch (error) {
              console.error("Error updating status:", error);
              Alert.alert("Error", "Failed to update status");
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  const handleZoom = (type: "in" | "out") => {
    mapRef.current?.getCamera().then((camera) => {
      if (camera.zoom !== undefined) {
        mapRef.current?.animateCamera({
          zoom: camera.zoom + (type === "in" ? 1 : -1),
        });
      }
    });
  };

  const handleUpdate = async () => {
    if (!id || !delivery) return;

    // Validation
    if (!editedData.customerName?.trim()) {
      Alert.alert("Error", "Customer name is required");
      return;
    }
    if (!editedData.address?.trim()) {
      Alert.alert("Error", "Address is required");
      return;
    }

    setUpdating(true);
    try {
      await db.collection("deliveries").doc(id).update(editedData);
      setIsEditing(false);
      Alert.alert("Success", "Order updated successfully");
    } catch (error) {
      console.error("Error updating order:", error);
      Alert.alert("Error", "Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  const startEditing = () => {
    if (delivery) {
      setEditedData({
        customerName: delivery.customerName,
        address: delivery.address,
        description: delivery.description,
        price: delivery.price,
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedData({});
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </ThemedView>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Delivery not found</Text>
        <TouchableOpacity
          style={styles.backBtnSmall}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnSmallText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: delivery.latitude,
            longitude: delivery.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
          userInterfaceStyle="light"
        >
          <Marker
            coordinate={{
              latitude: delivery.latitude,
              longitude: delivery.longitude,
            }}
          >
            <View style={styles.markerContainer}>
              <View style={styles.markerInner}>
                <Package size={16} color={Colors.white} />
              </View>
              <View style={styles.markerTriangle} />
            </View>
          </Marker>

          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={3}
              strokeColor="#7E57C2"
            />
          )}
        </MapView>

        {/* Floating Header Controls */}
        <SafeAreaView style={styles.floatingHeader} edges={["top"]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.locationTag}>
            <Text style={styles.locationTagText}>Metuchen</Text>
          </View>
          <View style={{ flex: 1 }} />
          {!isEditing ? (
            <TouchableOpacity style={styles.editButton} onPress={startEditing}>
              <Edit2 size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.editControls}>
              <TouchableOpacity
                style={[styles.editButton, { marginRight: Spacing.s }]}
                onPress={handleUpdate}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={Colors.accent} />
                ) : (
                  <Check size={20} color={Colors.green} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editButton}
                onPress={cancelEditing}
                disabled={updating}
              >
                <X size={20} color={Colors.accent} />
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => handleZoom("in")}
          >
            <Plus size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => handleZoom("out")}
          >
            <Minus size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, { marginTop: Spacing.m }]}
          >
            <NavIcon
              size={20}
              color={Colors.textPrimary}
              fill={Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        bounces={true}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.expectedRow}>
            <Text style={styles.expectedLabel}>Expected on:</Text>
            <Text style={styles.expectedDate}>{delivery.expectedOn}</Text>
          </View>

          <View style={styles.header}>
            <View style={styles.leftHeader}>
              <View style={styles.iconCircle}>
                <Package size={24} color={Colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>#{delivery.orderId}</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editedData.description}
                    onChangeText={(text) =>
                      setEditedData({ ...editedData, description: text })
                    }
                    placeholder="Description"
                  />
                ) : (
                  <Text style={styles.description}>{delivery.description}</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Shipped by:</Text>
              <Text style={styles.statValue}>{delivery.shippedBy}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Order cost</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInputSmall}
                  value={editedData.price}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, price: text })
                  }
                  placeholder="Price"
                />
              ) : (
                <Text style={styles.statValue}>{delivery.price}</Text>
              )}
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Created</Text>
              <Text style={styles.statValue}>{delivery.createdDate}</Text>
            </View>
          </View>

          <View style={styles.specsContainer}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Customer:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editInputSpec}
                  value={editedData.customerName}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, customerName: text })
                  }
                  placeholder="Customer Name"
                />
              ) : (
                <Text style={styles.specValue}>{delivery.customerName}</Text>
              )}
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Address:</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.editInputSpec, { flex: 2 }]}
                  value={editedData.address}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, address: text })
                  }
                  placeholder="Address"
                  multiline
                />
              ) : (
                <Text style={[styles.specValue, { flex: 2 }]} numberOfLines={2}>
                  {delivery.address}
                </Text>
              )}
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Size:</Text>
              <Text style={styles.specValue}>50×40×50 cm</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Weight:</Text>
              <Text style={styles.specValue}>2 kg</Text>
            </View>
            <View style={styles.dividerSmall} />
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Type of order:</Text>
              <Text style={styles.specValue}>Own terms</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Order cost:</Text>
              <Text style={styles.specValue}>{delivery.price}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Payment method:</Text>
              <Text style={styles.specValue}>Mastercard •••0034</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Order Status:</Text>
              <Text
                style={[
                  styles.specValue,
                  {
                    color:
                      delivery.status === "delivered"
                        ? Colors.green
                        : Colors.accent,
                    fontWeight: "700",
                    textTransform: "capitalize",
                  },
                ]}
              >
                {delivery.status}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            {delivery.status !== "delivered" ? (
              <TouchableOpacity
                style={[
                  styles.deliveredButton,
                  updating && styles.disabledButton,
                ]}
                onPress={() => handleStatusUpdate("delivered")}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.deliveredButtonText}>
                    Mark as Delivered
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.deliveredBadge}>
                <Check size={20} color={Colors.white} />
                <Text style={styles.deliveredBadgeText}>Delivered</Text>
              </View>
            )}
            <TouchableOpacity style={styles.phoneButton} onPress={handleCall}>
              <Phone size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.m,
  },
  backBtnSmall: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    backgroundColor: Colors.accent,
    borderRadius: Radius.input,
  },
  backBtnSmallText: {
    color: Colors.white,
    fontWeight: "700",
  },
  scrollContent: {
    flexGrow: 1,
  },
  mapContainer: {
    height: height * 0.4,
    width: "100%",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.m,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows,
  },
  editControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  editInput: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.accent,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
    padding: 0,
    marginTop: 2,
  },
  editInputSmall: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.accent,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
    padding: 0,
    marginTop: 4,
    minWidth: 60,
  },
  editInputSpec: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.accent,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
    padding: 0,
    flex: 1,
  },
  locationTag: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: Radius.pill,
    marginLeft: Spacing.m,
    ...Shadows,
  },
  locationTagText: {
    ...Typography.footnote,
    fontWeight: "700",
  },
  mapControls: {
    position: "absolute",
    right: Spacing.xl,
    bottom: Spacing.xxl,
    gap: Spacing.s,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows,
  },
  markerContainer: {
    alignItems: "center",
  },
  markerInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadows,
  },
  markerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.primary,
    marginTop: -2,
  },
  sheet: {
    flex: 1,
    marginTop: -24,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Spacing.xl,
    paddingBottom: 40,
    ...Shadows,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E5EA",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.xl,
  },
  expectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    marginBottom: Spacing.xl,
  },
  expectedLabel: {
    ...Typography.body,
    fontWeight: "700",
    fontSize: 18,
  },
  expectedDate: {
    ...Typography.body,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  leftHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  orderId: {
    ...Typography.headings,
    fontSize: 20,
  },
  description: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  statItem: {
    gap: 4,
  },
  statLabel: {
    ...Typography.micro,
    color: Colors.textSecondary,
  },
  statValue: {
    ...Typography.footnote,
    fontWeight: "800",
  },
  specsContainer: {
    backgroundColor: "#F2F2F7",
    borderRadius: Radius.card,
    padding: Spacing.xl,
    gap: Spacing.m,
    marginBottom: Spacing.xxl,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  specLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  specValue: {
    ...Typography.body,
    fontWeight: "600",
  },
  dividerSmall: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginVertical: Spacing.s,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    marginTop: Spacing.xl,
  },
  deliveredButton: {
    flex: 1,
    height: 56,
    backgroundColor: Colors.accent,
    borderRadius: Radius.card,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows,
  },
  deliveredButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
  deliveredBadge: {
    flex: 1,
    height: 56,
    backgroundColor: Colors.green,
    borderRadius: Radius.card,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.s,
    ...Shadows,
  },
  deliveredBadgeText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: "700",
  },
  phoneButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
});
