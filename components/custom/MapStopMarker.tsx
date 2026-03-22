import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Colors, Spacing } from '@/constants/theme';

interface MapStopMarkerProps {
  coordinate: { latitude: number; longitude: number };
  number: number;
  status: string;
  onPress?: () => void;
}

export const MapStopMarker: React.FC<MapStopMarkerProps> = ({
  coordinate,
  number,
  status,
  onPress,
}) => {
  const isDelivered = status === 'delivered';
  const color = isDelivered ? Colors.textMuted : Colors.accent;

  return (
    <Marker coordinate={coordinate} onPress={onPress}>
      <View style={styles.wrapper}>
        <View style={[styles.container, { backgroundColor: color }]}>
          <Text style={styles.text}>{number}</Text>
        </View>
        <View style={[styles.triangle, { borderTopColor: color }]} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  text: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});
