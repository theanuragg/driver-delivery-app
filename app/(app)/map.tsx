import { ThemedView } from "@/components/themed-view";
import {
  Colors,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/src/lib/firebase";
import axios from "axios";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Phone,
  Plus,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

interface Stop {
  id: string;
  orderId: string;
  customerName: string;
  address: string;
  status: string;
  latitude: number;
  longitude: number;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const { width, height } = Dimensions.get("window");

export default function RouteScreen() {
  const { focusId } = useLocalSearchParams<{ focusId: string }>();
  const [optimisedStops, setOptimisedStops] = useState<Stop[]>([]);
  const [deliveries, setDeliveries] = useState<Stop[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [optimising, setOptimising] = useState(false);
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const prevStopsRef = useRef<string>("");
  const [routeCoordinates, setRouteCoordinates] = useState<LocationCoords[]>(
    [],
  );
  const router = useRouter();

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

  const fetchRoute = async (stops: Stop[]) => {
    if (!currentLocation || stops.length === 0) return;

    if (!GOOGLE_API_KEY) {
      // Mock road routing with some noise for demo purposes if no API key
      const mockRoute = [currentLocation];
      stops.forEach((s) => {
        // Add a mid-point that's slightly offset to look less straight
        const midLat =
          (mockRoute[mockRoute.length - 1].latitude + s.latitude) / 2 +
          (Math.random() - 0.5) * 0.005;
        const midLng =
          (mockRoute[mockRoute.length - 1].longitude + s.longitude) / 2 +
          (Math.random() - 0.5) * 0.005;
        mockRoute.push({ latitude: midLat, longitude: midLng });
        mockRoute.push({ latitude: s.latitude, longitude: s.longitude });
      });
      setRouteCoordinates(mockRoute);
      return;
    }

    try {
      const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
      const destination = `${stops[stops.length - 1].latitude},${stops[stops.length - 1].longitude}`;
      const waypoints = stops
        .slice(0, -1)
        .map((s) => `${s.latitude},${s.longitude}`)
        .join("|");

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=${waypoints}&key=${GOOGLE_API_KEY}`,
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

  const handleZoom = (type: "in" | "out") => {
    mapRef.current?.getCamera().then((camera) => {
      const currentZoom = camera.zoom || 15;
      mapRef.current?.animateCamera({
        zoom: currentZoom + (type === "in" ? 1 : -1),
      });
    });
  };

  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.EXPO_PUBLIC_USE_EMULATORS === "true";

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
  };

  const optimiseRoute = useCallback(
    (stopsToOptimise: Stop[]) => {
      if (!currentLocation || stopsToOptimise.length === 0) {
        setOptimisedStops(stopsToOptimise);
        return;
      }

      let unvisited = [...stopsToOptimise];
      let currentPos = currentLocation;
      let result: Stop[] = [];

      while (unvisited.length > 0) {
        let closestIdx = 0;
        let minDistance = Number.MAX_VALUE;

        for (let i = 0; i < unvisited.length; i++) {
          const d = calculateDistance(
            currentPos.latitude,
            currentPos.longitude,
            unvisited[i].latitude,
            unvisited[i].longitude,
          );
          if (d < minDistance) {
            minDistance = d;
            closestIdx = i;
          }
        }

        const closest = unvisited.splice(closestIdx, 1)[0];
        result.push(closest);
        currentPos = {
          latitude: closest.latitude,
          longitude: closest.longitude,
        };
      }

      setOptimisedStops(result);
    },
    [currentLocation],
  );

  const handleOptimisation = useCallback(
    async (pendingStops: Stop[]) => {
      const stopsKey = pendingStops
        .map((s) => `${s.id}-${s.status}`)
        .sort()
        .join("|");

      if (stopsKey === prevStopsRef.current && optimisedStops.length > 0) {
        return;
      }

      prevStopsRef.current = stopsKey;

      if (pendingStops.length === 0) {
        setOptimisedStops([]);
        setRouteCoordinates([]);
        return;
      }

      setOptimising(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      if (isDev) {
        setOptimisedStops(pendingStops);
        fetchRoute(pendingStops);
      } else {
        optimiseRoute(pendingStops);
        fetchRoute(pendingStops);
      }

      const focusStop = focusId
        ? pendingStops.find((s) => s.id === focusId)
        : null;

      if (focusStop) {
        setTimeout(() => {
          mapRef.current?.animateToRegion(
            {
              latitude: focusStop.latitude,
              longitude: focusStop.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1000,
          );
        }, 500);
      } else {
        const coordinates = pendingStops.map((s) => ({
          latitude: s.latitude,
          longitude: s.longitude,
        }));

        if (currentLocation) {
          coordinates.push(currentLocation);
        }

        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coordinates, {
            edgePadding: { top: 150, right: 50, bottom: 400, left: 50 },
            animated: true,
          });
        }, 500);
      }

      setOptimising(false);
    },
    [isDev, currentLocation, optimiseRoute, focusId],
  );

  useEffect(() => {
    const pendingStops = deliveries.filter((s) => s.status === "pending");
    handleOptimisation(pendingStops);
  }, [deliveries, currentLocation?.latitude, currentLocation?.longitude]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Allow location access to see the map.",
        );
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        if (isDev) {
          setCurrentLocation({ latitude: 37.7749, longitude: -122.4194 });
        }
      }
    })();
  }, [isDev]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

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

  const nextStop = useMemo(() => optimisedStops[0], [optimisedStops]);

  // Slide to confirm logic
  const slideAnim = useRef(new Animated.Value(0)).current;
  const SLIDE_WIDTH = width - Spacing.xl * 2 - 12; // 12 is padding
  const ARROW_WIDTH = 52;
  const MAX_SLIDE = SLIDE_WIDTH - ARROW_WIDTH;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newVal = Math.max(0, Math.min(gestureState.dx, MAX_SLIDE));
        slideAnim.setValue(newVal);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= MAX_SLIDE * 0.8) {
          Animated.timing(slideAnim, {
            toValue: MAX_SLIDE,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            handleConfirmDelivery();
            // Reset after a delay
            setTimeout(() => {
              slideAnim.setValue(0);
            }, 1000);
          });
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const handleConfirmDelivery = async () => {
    if (!nextStop) return;
    try {
      await db.collection("deliveries").doc(nextStop.id).update({
        status: "delivered",
        deliveredAt: new Date().toISOString(),
      });
      Alert.alert("Success", "Delivery confirmed!");
    } catch (error) {
      Alert.alert("Error", "Could not confirm delivery.");
    }
  };

  if (loading || !currentLocation) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Initialising map...</Text>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          userInterfaceStyle="light"
          zoomEnabled={true}
          zoomControlEnabled={true}
          scrollEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
        >
          {optimisedStops.map((stop, index) => (
            <Marker
              key={stop.id}
              coordinate={{
                latitude: stop.latitude,
                longitude: stop.longitude,
              }}
            >
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.markerInner,
                    index === 0 && styles.activeMarker,
                  ]}
                >
                  <Package size={16} color={Colors.white} />
                </View>
                <View
                  style={[
                    styles.markerTriangle,
                    index === 0 && styles.activeMarkerTriangle,
                  ]}
                />
              </View>
            </Marker>
          ))}

          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor="#7E57C2"
            />
          )}
        </MapView>

        {/* Top Overlays */}
        <SafeAreaView style={styles.topOverlay} edges={["top"]}>
          <View style={styles.directionBox}>
            <View style={styles.directionIconBox}>
              <ArrowUp size={24} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.directionDistance}>20 FT</Text>
              <Text style={styles.directionStreet}>5643 Grand St.</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.pauseBtn}>
            <Text style={styles.pauseBtnText}>Pause</Text>
          </TouchableOpacity>
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
            onPress={() => {
              if (currentLocation) {
                mapRef.current?.animateToRegion({
                  ...currentLocation,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });
              }
            }}
          >
            <ArrowUp size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {optimising && (
          <View style={styles.optimisingOverlay}>
            <ActivityIndicator size="small" color={Colors.accent} />
            <Text style={styles.optimisingText}>Recalculating route...</Text>
          </View>
        )}
      </View>

      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        {nextStop ? (
          <View style={styles.navContent}>
            <View style={styles.statsRow}>
              <View style={styles.navStat}>
                <Text style={styles.navStatValue}>2.8 mile</Text>
                <Text style={styles.navStatLabel}>distance</Text>
              </View>
              <View style={styles.navStat}>
                <Text style={styles.navStatValue}>2:23 min</Text>
                <Text style={styles.navStatLabel}>Time left</Text>
              </View>
              <View style={styles.navStat}>
                <Text style={styles.navStatValue}>9:44 AM</Text>
                <Text style={styles.navStatLabel}>Arrival</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressLine} />
              <View style={styles.progressBoxIcon}>
                <Package size={14} color={Colors.textPrimary} />
              </View>
              <View style={styles.progressEndMarker} />
            </View>

            <View style={styles.customerRow}>
              <View style={styles.leftCustomer}>
                <View style={styles.packageIconSmall}>
                  <Package size={18} color={Colors.textPrimary} />
                </View>
                <View>
                  <Text style={styles.orderIdText}>#{nextStop.orderId}</Text>
                  <Text style={styles.orderDescText}>Birthdays gifts</Text>
                </View>
              </View>
              <View style={styles.timeTag}>
                <Text style={styles.timeTagText}>10 AM — 13 AM</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.customerDetailRow}>
              <View>
                <Text style={styles.sectionLabel}>Customer</Text>
                <Text style={styles.customerNameText}>
                  {nextStop.customerName}
                </Text>
              </View>
              <TouchableOpacity style={styles.chatIconBtn}>
                <MessageCircle size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.addressSection}>
              <Text style={styles.sectionLabel}>Delivery address:</Text>
              <View style={styles.addressRow}>
                <MapPin size={16} color={Colors.textPrimary} />
                <Text style={styles.addressTextFull} numberOfLines={1}>
                  {nextStop.address}
                </Text>
              </View>
            </View>

            <View style={styles.specsMini}>
              <View style={styles.specMiniRow}>
                <Text style={styles.specMiniLabel}>Type of order:</Text>
                <Text style={styles.specMiniValue}>Own terms</Text>
              </View>
              <View style={styles.specMiniRow}>
                <Text style={styles.specMiniLabel}>Order cost:</Text>
                <Text style={styles.specMiniValue}>$129</Text>
              </View>
              <View style={styles.specMiniRow}>
                <Text style={styles.specMiniLabel}>Payment method:</Text>
                <Text style={styles.specMiniValue}>Mastercard •••0034</Text>
              </View>
              <View style={styles.specMiniRow}>
                <Text style={styles.specMiniLabel}>Status:</Text>
                <Text style={[styles.specMiniValue, { fontWeight: "700" }]}>
                  Paid
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.chatSupportBtn}>
                <Text style={styles.chatSupportBtnText}>Chat with support</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.phoneCircleBtn}>
                <Phone size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.slideConfirmBtn}>
              <Animated.View
                style={[
                  styles.slideArrow,
                  { transform: [{ translateX: slideAnim }] },
                ]}
                {...panResponder.panHandlers}
              >
                <ChevronRight size={24} color={Colors.white} />
                <ChevronRight
                  size={24}
                  color={Colors.white}
                  style={{ marginLeft: -12 }}
                />
              </Animated.View>
              <View style={{ flex: 1, justifyContent: "center" }}>
                <Text style={styles.slideConfirmText}>
                  Slide to confirm the delivery
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.allDoneContainer}>
            <CheckCircle2 size={48} color={Colors.green} />
            <Text style={styles.allDoneText}>All deliveries completed!</Text>
            <TouchableOpacity
              style={styles.backToHomeBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.backToHomeText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  loadingText: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginTop: Spacing.m,
  },
  mapWrapper: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.m,
  },
  directionBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    borderRadius: Radius.card,
    gap: Spacing.m,
  },
  directionIconBox: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  directionDistance: {
    ...Typography.footnote,
    color: Colors.white,
    fontWeight: "800",
  },
  directionStreet: {
    ...Typography.micro,
    color: "rgba(255, 255, 255, 0.6)",
  },
  pauseBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.s,
    borderRadius: Radius.card,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows,
  },
  pauseBtnText: {
    ...Typography.footnote,
    fontWeight: "700",
  },
  mapControls: {
    position: "absolute",
    right: Spacing.xl,
    bottom: height * 0.45, // Position above the sheet
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
  optimisingOverlay: {
    position: "absolute",
    bottom: height * 0.5,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    borderRadius: Radius.pill,
    gap: Spacing.s,
    ...Shadows,
  },
  optimisingText: {
    ...Typography.micro,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  markerContainer: {
    alignItems: "center",
  },
  markerInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadows,
  },
  activeMarker: {
    backgroundColor: Colors.accent,
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
  activeMarkerTriangle: {
    borderTopColor: Colors.accent,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
  navContent: {
    gap: Spacing.l,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navStat: {
    gap: 2,
  },
  navStatValue: {
    ...Typography.headings,
    fontSize: 20,
  },
  navStatLabel: {
    ...Typography.micro,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    height: 40,
    justifyContent: "center",
    position: "relative",
  },
  progressLine: {
    height: 4,
    backgroundColor: "#E5E5EA",
    width: "100%",
    borderRadius: 2,
  },
  progressBoxIcon: {
    position: "absolute",
    left: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows,
  },
  progressEndMarker: {
    position: "absolute",
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    borderWidth: 4,
    borderColor: "rgba(255, 77, 77, 0.2)",
  },
  customerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftCustomer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  packageIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  orderIdText: {
    ...Typography.footnote,
    color: "#7E57C2",
    fontWeight: "800",
  },
  orderDescText: {
    ...Typography.micro,
    fontWeight: "700",
  },
  timeTag: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: Radius.pill,
  },
  timeTagText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  customerDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    ...Typography.micro,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  customerNameText: {
    ...Typography.body,
    fontWeight: "800",
  },
  chatIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows,
  },
  addressSection: {
    gap: 4,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  addressTextFull: {
    ...Typography.footnote,
    fontWeight: "700",
    flex: 1,
  },
  specsMini: {
    backgroundColor: "#F2F2F7",
    borderRadius: Radius.input,
    padding: Spacing.l,
    gap: Spacing.s,
  },
  specMiniRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  specMiniLabel: {
    ...Typography.micro,
    color: Colors.textSecondary,
  },
  specMiniValue: {
    ...Typography.micro,
    color: Colors.textPrimary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  chatSupportBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  chatSupportBtnText: {
    ...Typography.footnote,
    fontWeight: "700",
  },
  phoneCircleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  slideConfirmBtn: {
    backgroundColor: Colors.primary,
    height: 64,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  slideArrow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 10,
  },
  slideConfirmText: {
    ...Typography.footnote,
    color: Colors.white,
    fontWeight: "700",
    marginLeft: Spacing.xl,
  },
  allDoneContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.m,
  },
  allDoneText: {
    ...Typography.headings,
    color: Colors.green,
  },
  backToHomeBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.m,
    borderRadius: Radius.pill,
    marginTop: Spacing.l,
  },
  backToHomeText: {
    color: Colors.white,
    fontWeight: "700",
  },
});
