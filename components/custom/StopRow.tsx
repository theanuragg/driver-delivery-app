import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Clock } from 'lucide-react-native';

interface StopRowProps {
  number: number;
  address: string;
  eta: string;
  isDelivered?: boolean;
  isNext?: boolean;
}

export const StopRow: React.FC<StopRowProps> = ({
  number,
  address,
  eta,
  isDelivered,
  isNext,
}) => {
  return (
    <View style={[
      styles.container, 
      isNext && styles.nextContainer,
      isDelivered && styles.deliveredContainer
    ]}>
      <View style={[
        styles.numberBadge, 
        { backgroundColor: isDelivered ? Colors.textMuted : (isNext ? Colors.accent : Colors.primary) }
      ]}>
        <Text style={styles.numberText}>{number}</Text>
      </View>

      <View style={styles.info}>
        <Text 
          style={[styles.address, isDelivered && styles.strikethrough]} 
          numberOfLines={1}
        >
          {address}
        </Text>
      </View>

      <View style={styles.etaChip}>
        <Clock size={12} color={Colors.textMuted} />
        <Text style={styles.etaText}>{eta}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nextContainer: {
    backgroundColor: 'rgba(255, 87, 34, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
    paddingLeft: Spacing.m - 4,
  },
  deliveredContainer: {
    opacity: 0.5,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  numberText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  address: {
    ...Typography.body,
    fontSize: 14,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  etaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    gap: 4,
  },
  etaText: {
    ...Typography.micro,
    color: Colors.textMuted,
  },
});
