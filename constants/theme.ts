const palette = {
  primary: "#000000", // Black Header
  accent: "#FF4D4D", // Vibrant Red (Active Chip, Big Button, Action Icon)
  purple: "#7E57C2", // Awaiting Pickup Status
  green: "#4CAF50", // In Transit Status
  blue: "#2196F3", // Delivered Status
  bg: "#F8F9FA", // Light Background
  surface: "#FFFFFF", // Card Background
  textPrimary: "#000000",
  textSecondary: "#8E8E93",
  white: "#FFFFFF",
  border: "#E5E5EA",
};

export const Colors = {
  ...palette,
  light: {
    text: palette.textPrimary,
    background: palette.bg,
    tint: palette.accent,
    icon: palette.textSecondary,
    tabIconDefault: palette.textSecondary,
    tabIconSelected: palette.accent,
    card: palette.surface,
    surface: palette.surface,
    border: palette.border,
    primary: palette.primary,
    accent: palette.accent,
    success: palette.green,
    warning: "#FFC107",
    danger: palette.accent,
    textMuted: palette.textSecondary,
  },
  dark: {
    text: palette.white,
    background: palette.primary,
    tint: palette.accent,
    icon: palette.white,
    tabIconDefault: "#9BA1A6",
    tabIconSelected: palette.accent,
    card: "rgba(255, 255, 255, 0.05)",
    surface: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.1)",
    primary: palette.primary,
    accent: palette.accent,
    success: palette.green,
    warning: "#FFC107",
    danger: palette.accent,
    textMuted: "rgba(255, 255, 255, 0.6)",
  },
};

export const Typography = {
  headings: {
    fontWeight: "800" as const,
    fontSize: 24,
    color: palette.textPrimary,
  },
  body: {
    fontWeight: "500" as const,
    fontSize: 16,
    color: palette.textPrimary,
  },
  subheadline: {
    fontWeight: "500" as const,
    fontSize: 14,
    color: palette.textSecondary,
  },
  footnote: {
    fontWeight: "700" as const,
    fontSize: 14,
    color: palette.textPrimary,
  },
  micro: {
    fontWeight: "600" as const,
    fontSize: 12,
    letterSpacing: 0.2,
    color: palette.textSecondary,
  },
};

export const Spacing = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  input: 12,
  card: 20,
  pill: 999,
};

export const Shadows = {
  elevation: 4,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
};
