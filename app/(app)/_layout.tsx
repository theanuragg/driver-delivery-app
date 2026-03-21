import { useAuth } from "@/src/context/AuthContext";
import { Stack } from "expo-router";
import { LogOut } from "lucide-react-native";
import { TouchableOpacity } from "react-native";

export default function AppLayout() {
  const { logout } = useAuth();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "My Deliveries",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => logout()}
              style={{ marginRight: 15 }}
            >
              <LogOut size={24} color="#FF3B30" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="map"
        options={{
          title: "Optimised Route",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
