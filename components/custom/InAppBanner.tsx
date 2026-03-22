import {
    Colors,
    Radius,
    Shadows,
    Spacing,
    Typography,
} from "@/constants/theme";
import { Package, X } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface InAppBannerProps {
  orderId: string;
  customerName: string;
  onPress: () => void;
  onDismiss: () => void;
  visible: boolean;
}

export const InAppBanner: React.FC<InAppBannerProps> = ({
  orderId,
  customerName,
  onPress,
  onDismiss,
  visible,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      handleDismiss();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.accentBar} />
        <View style={styles.iconContainer}>
          <Package size={20} color={Colors.accent} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.orderId}>New Assignment: #{orderId}</Text>
          <Text style={styles.customerName}>{customerName}</Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <X size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: Spacing.m,
    right: Spacing.m,
    zIndex: 9999,
  },
  content: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.m,
    ...Shadows,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: Spacing.m,
    bottom: Spacing.m,
    width: 4,
    backgroundColor: Colors.accent,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 87, 34, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.s,
    marginRight: Spacing.m,
  },
  textContainer: {
    flex: 1,
  },
  orderId: {
    ...Typography.footnote,
    fontWeight: "700",
    color: Colors.accent,
  },
  customerName: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    padding: Spacing.s,
  },
});
