import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Radius } from '@/constants/theme';

interface StatusPillProps {
  status: 'pending' | 'delivered' | 'failed' | 'in_progress' | string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const normalizedStatus = status.toLowerCase();
  
  let bgColor = '#FFF3E0';
  let textColor = Colors.accent;
  let label = 'PENDING';

  if (normalizedStatus === 'delivered') {
    bgColor = '#E8F5E9';
    textColor = Colors.success;
    label = 'DELIVERED';
  } else if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled') {
    bgColor = '#FFEBEE';
    textColor = Colors.danger;
    label = 'FAILED';
  } else if (normalizedStatus === 'in_progress') {
    bgColor = '#E3F2FD';
    textColor = Colors.primary;
    label = 'IN PROGRESS';
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.micro,
    fontWeight: '700',
  },
});
