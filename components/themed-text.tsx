import { Typography } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, Text, type TextProps } from "react-native";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "default"
    | "title"
    | "h1"
    | "h2"
    | "h3"
    | "headline"
    | "subheadline"
    | "footnote"
    | "caption"
    | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.h1 : undefined,
        type === "h1" ? styles.h1 : undefined,
        type === "h2" ? styles.h2 : undefined,
        type === "h3" ? styles.h3 : undefined,
        type === "headline" ? styles.headline : undefined,
        type === "subheadline" ? styles.subheadline : undefined,
        type === "footnote" ? styles.footnote : undefined,
        type === "caption" ? styles.caption : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: Typography.body,
  h1: Typography.headings,
  h2: Typography.headings,
  h3: Typography.headings,
  headline: Typography.headings,
  subheadline: Typography.subheadline,
  footnote: Typography.footnote,
  caption: Typography.subheadline,
  link: {
    ...Typography.body,
    color: "#007AFF",
  },
});
