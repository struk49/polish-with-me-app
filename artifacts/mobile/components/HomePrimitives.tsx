import { Ionicons } from "@expo/vector-icons";
import React, { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { designRadii, designSpacing } from "@/constants/designSystem";
import { useDesignTokens } from "@/hooks/useDesignTokens";

export function SurfaceCard({ children, feature = false }: { children: ReactNode; feature?: boolean }) {
  const { colors } = useDesignTokens();
  return (
    <View style={[styles.surfaceCard, feature && styles.featureCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderDefault }]}>
      {children}
    </View>
  );
}

export function PrimaryButton({ label, onPress, accessibilityHint }: { label: string; onPress: () => void; accessibilityHint?: string }) {
  const { colors } = useDesignTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, { backgroundColor: pressed ? colors.brandPressed : colors.brandPrimary }]}
    >
      <Text style={[styles.primaryButtonText, { color: colors.textInverse }]}>{label}</Text>
      <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
    </Pressable>
  );
}

export function ProgressBar({ value, label, height = 8, color }: { value: number; label: string; height?: number; color?: string }) {
  const { colors } = useDesignTokens();
  const boundedValue = Math.max(0, Math.min(100, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: boundedValue, text: `${boundedValue}%` }}
      style={[styles.progressTrack, { backgroundColor: colors.progressTrack, height, borderRadius: height / 2 }]}
    >
      <View style={{ width: `${boundedValue}%`, height: "100%", borderRadius: height / 2, backgroundColor: color ?? colors.brandPrimary }} />
    </View>
  );
}

export function StatusBadge({ label, backgroundColor, color, icon }: { label: string; backgroundColor: string; color: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={[styles.badge, { backgroundColor }]} accessibilityLabel={label}>
      {icon ? <Ionicons name={icon} size={14} color={color} /> : null}
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function MetricCard({ icon, value, label, accent }: { icon: keyof typeof Ionicons.glyphMap; value: string | number; label: string; accent: string }) {
  const { colors } = useDesignTokens();
  return (
    <View
      style={[styles.metricCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderDefault }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={[styles.metricIcon, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <View style={styles.metricCopy}>
        <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
      </View>
    </View>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useDesignTokens();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  surfaceCard: { borderWidth: 1, borderRadius: designRadii.card, padding: designSpacing.card },
  featureCard: { borderRadius: designRadii.feature, padding: designSpacing.gutter, borderWidth: 2 },
  primaryButton: { minHeight: 48, borderRadius: designRadii.control, paddingHorizontal: designSpacing.card, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: designSpacing.compact },
  primaryButtonText: { fontSize: 16, lineHeight: 20, fontFamily: "Inter_600SemiBold", flexShrink: 1, textAlign: "center" },
  progressTrack: { overflow: "hidden", width: "100%" },
  badge: { minHeight: 28, paddingHorizontal: 10, borderRadius: designRadii.small, flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  badgeText: { fontSize: 12, lineHeight: 16, fontFamily: "Inter_600SemiBold" },
  metricCard: { width: "48.5%", minHeight: 72, borderWidth: 1, borderRadius: designRadii.control, padding: designSpacing.element, flexDirection: "row", alignItems: "center", gap: designSpacing.compact },
  metricIcon: { width: 32, height: 32, flexShrink: 0, borderRadius: designRadii.small, alignItems: "center", justifyContent: "center" },
  metricCopy: { flex: 1, minWidth: 0 },
  metricValue: { fontSize: 19, lineHeight: 24, fontFamily: "Inter_700Bold" },
  metricLabel: { fontSize: 11, lineHeight: 16, fontFamily: "Inter_500Medium" },
  sectionHeader: { gap: 2, marginBottom: designSpacing.element },
  sectionTitle: { fontSize: 20, lineHeight: 26, fontFamily: "Inter_700Bold" },
  sectionSubtitle: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },
});
