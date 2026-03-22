import {
    Colors,
    Radius,
    Shadows,
    Spacing,
    Typography,
} from "@/constants/theme";
import { ChevronRight, Package } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusPill } from "./StatusPill";

interface DeliveryCardProps {
  orderId: string;
  customerName: string;
  description?: string;
  status: string;
  price?: string;
  shippedBy?: string;
  expectedOn?: string;
  hasNotification?: boolean;
  onPress?: () => void;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  orderId,
  description = "Birthday gift",
  status,
  price = "$20",
  shippedBy = "Welton Express",
  expectedOn = "14 Aug 2024",
  hasNotification = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <View style={styles.iconCircle}>
            <Package size={20} color={Colors.textPrimary} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.orderId}>#{orderId}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </View>
        <StatusPill status={status} />
      </View>

      <View style={styles.mainRow}>
        <Text style={styles.price}>{price}</Text>
        <View style={styles.rightActions}>
          {hasNotification && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>1</Text>
            </View>
          )}
          <ChevronRight size={20} color={Colors.textSecondary} />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.footerColumn}>
          <Text style={styles.footerLabel}>Shipped by:</Text>
          <Text style={styles.footerValue}>{shippedBy}</Text>
        </View>
        <View style={[styles.footerColumn, { alignItems: "flex-end" }]}>
          <Text style={styles.footerLabel}>Expected on:</Text>
          <Text style={styles.footerValue}>{expectedOn}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.l,
    marginBottom: Spacing.m,
    ...Shadows,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.m,
  },
  leftHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    gap: 2,
  },
  orderId: {
    ...Typography.body,
    fontWeight: "800",
    fontSize: 18,
  },
  description: {
    ...Typography.subheadline,
    color: Colors.textSecondary,
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  price: {
    ...Typography.headings,
    fontSize: 22,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  notificationBadge: {
    backgroundColor: Colors.accent,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.m,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerColumn: {
    gap: 4,
  },
  footerLabel: {
    ...Typography.micro,
    color: Colors.textSecondary,
  },
  footerValue: {
    ...Typography.footnote,
    fontWeight: "800",
  },
});
