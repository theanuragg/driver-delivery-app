import { useAuth } from "@/src/context/AuthContext";
import { Stack, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { InAppBanner } from "@/components/custom/InAppBanner";
import * as Notifications from "expo-notifications";

export default function AppLayout() {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [notificationData, setNotificationData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      if (data && data.orderId) {
        setNotificationData(data);
        setBannerVisible(true);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="map" />
        <Stack.Screen name="details" />
        <Stack.Screen name="create" />
        <Stack.Screen name="profile" />
      </Stack>

      <InAppBanner
        visible={bannerVisible}
        orderId={notificationData?.orderId || ""}
        customerName={notificationData?.customerName || "New Delivery"}
        onPress={() => {
          setBannerVisible(false);
          router.push({
            pathname: "/(app)/details",
            params: { id: notificationData?.deliveryId || "" }
          });
        }}
        onDismiss={() => setBannerVisible(false)}
      />
    </>
  );
}
