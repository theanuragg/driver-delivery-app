import { useThemeColor } from "@/hooks/use-theme-color";
import { View, type ViewProps } from "react-native";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "surface" | "card";
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...otherProps
}: ThemedViewProps) {
  const colorName =
    type === "default" ? "background" : type === "card" ? "card" : "surface";
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    colorName,
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
