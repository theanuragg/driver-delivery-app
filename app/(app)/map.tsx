import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/context/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Navigation, CheckCircle2, MapPin } from 'lucide-react-native';

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

export default function RouteScreen() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [optimisedStops, setOptimisedStops] = useState<Stop[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to see the map.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Fetch stops
      fetchStops();
    })();
  }, []);

  const fetchStops = () => {
    if (!user) return;
    setLoading(true);
    
    // In mock mode, this will call our mockFirestore
    const unsubscribe = db.collection('deliveries')
      .where('assignedDriver', '==', user.uid)
      .onSnapshot((snapshot: any) => {
        const docs = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const pendingStops = docs.filter((s: Stop) => s.status === 'pending');
        setStops(pendingStops);
        optimiseRoute(pendingStops);
        setLoading(false);
      });

    return unsubscribe;
  };

  const optimiseRoute = (stopsToOptimise: Stop[]) => {
    if (!currentLocation || stopsToOptimise.length === 0) {
      setOptimisedStops(stopsToOptimise);
      return;
    }

    // Simple Greedy Approach for Route Optimisation (Nearest Neighbor)
    // In a real app, this would call a routing API like Google Directions or Mapbox
    let unvisited = [...stopsToOptimise];
    let currentPos = currentLocation;
    let result: Stop[] = [];

    while (unvisited.length > 0) {
      let closestIdx = 0;
      let minDistance = Number.MAX_VALUE;

      for (let i = 0; i < unvisited.length; i++) {
        const d = calculateDistance(
          currentPos.latitude, currentPos.longitude,
          unvisited[i].latitude, unvisited[i].longitude
        );
        if (d < minDistance) {
          minDistance = d;
          closestIdx = i;
        }
      }

      const closest = unvisited.splice(closestIdx, 1)[0];
      result.push(closest);
      currentPos = { latitude: closest.latitude, longitude: closest.longitude };
    }

    setOptimisedStops(result);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
  };

  const handleMarkDelivered = async (stopId: string) => {
    try {
      await db.collection('deliveries').doc(stopId).update({ status: 'delivered' });
      // The onSnapshot will trigger fetchStops which calls optimiseRoute
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  if (loading || !currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Optimising your route...</Text>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mapContainer}>
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
        >
          {optimisedStops.map((stop, index) => (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              title={stop.customerName}
              description={stop.address}
              pinColor={index === 0 ? 'green' : 'red'}
            >
              <View style={styles.markerContainer}>
                <View style={[styles.markerBadge, { backgroundColor: index === 0 ? '#4CD964' : '#007AFF' }]}>
                  <Text style={styles.markerText}>{index + 1}</Text>
                </View>
              </View>
            </Marker>
          ))}

          {optimisedStops.length > 0 && (
            <Polyline
              coordinates={[
                currentLocation,
                ...optimisedStops.map(s => ({ latitude: s.latitude, longitude: s.longitude }))
              ]}
              strokeWidth={3}
              strokeColor="#007AFF"
            />
          )}
        </MapView>
      </View>

      <FlatList
        data={optimisedStops}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.stopCard}>
            <View style={styles.stopNumber}>
              <Text style={styles.stopNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.customerName}>{item.customerName}</Text>
              <Text style={styles.address}>{item.address}</Text>
            </View>
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => handleMarkDelivered(item.id)}
            >
              <CheckCircle2 size={24} color="#4CD964" />
            </TouchableOpacity>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Navigation size={18} color="#007AFF" />
            <Text style={styles.headerText}>{optimisedStops.length} STOPS REMAINING</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    opacity: 0.7,
  },
  mapContainer: {
    height: '40%',
    width: '100%',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    gap: 10,
  },
  headerText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  stopCard: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  stopNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  stopNumberText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stopInfo: {
    flex: 1,
  },
  customerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  address: {
    color: '#aaa',
    fontSize: 14,
  },
  doneButton: {
    padding: 10,
  }
});
