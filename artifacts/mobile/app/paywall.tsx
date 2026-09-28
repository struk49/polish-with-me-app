import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSubscription } from "@/lib/revenuecat";
import { hasProEntitlement, isPurchaseCancellation } from "@/lib/premiumEntitlement";
import { useColors } from "@/hooks/useColors";
import { captureBillingFailure } from "@/lib/observability";

const PERKS = [
  { icon: "school-outline" as const, title: "A2 Elementary", desc: "Everyday conversations, past & future tense" },
  { icon: "trophy-outline" as const, title: "B1 Intermediate", desc: "Real Polish — culture, grammar, travel" },
  { icon: "star-outline" as const, title: "B2 Upper Intermediate", desc: "Fluency — politics, business, literature" },
  { icon: "flash-outline" as const, title: "800+ More Words", desc: "Unlock all vocabulary across every lesson" },
  { icon: "infinite-outline" as const, title: "All Future Lessons", desc: "Every lesson we add going forward" },
];

export default function PaywallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    offerings,
    refreshOfferings,
    purchase,
    restore,
    isLoading,
    isPurchasing,
    isRestoring,
    isBillingOperationActive,
  } = useSubscription();
  const [showConfirm, setShowConfirm] = useState(false);
  const [bottomBarHeight, setBottomBarHeight] = useState(0);

  const getPackage = (availableOfferings: typeof offerings) =>
    availableOfferings?.all?.default?.availablePackages.find(
      (purchasePackage) => purchasePackage.product.identifier === "pro_unlock",
    );

  const packageToPurchase = getPackage(offerings);
  const price = packageToPurchase?.product.priceString;

  const showStoreSetupError = () => {
    Alert.alert(
      "Purchase unavailable",
      __DEV__
        ? "Test purchase options are unavailable. Check the development purchase configuration and try again."
        : "Purchase options are unavailable. Check your connection and try again.",
    );
  };

  const handleUnlockPress = async () => {
    if (packageToPurchase) {
      setShowConfirm(true);
      return;
    }

    const result = await refreshOfferings();
    if (getPackage(result.data)) {
      setShowConfirm(true);
    } else {
      if (!result.error) captureBillingFailure("BILLING_PACKAGE_MISSING");
      showStoreSetupError();
    }
  };

  const handlePurchase = async () => {
    setShowConfirm(false);
    if (!packageToPurchase) {
      showStoreSetupError();
      return;
    }
    try {
      const customerInfo = await purchase(packageToPurchase);
      if (hasProEntitlement(customerInfo)) {
        router.back();
        return;
      }
      Alert.alert(
        "Purchase not activated",
        "The purchase completed, but Pro access is not active yet. Please try Restore purchases or contact support.",
      );
    } catch (error) {
      if (isPurchaseCancellation(error)) return;
      Alert.alert(
        "Purchase unsuccessful",
        "The purchase could not be completed. Your access has not changed. Please try again.",
      );
    }
  };

  const handleRestore = async () => {
    try {
      const customerInfo = await restore();
      if (hasProEntitlement(customerInfo)) {
        router.back();
        return;
      }
      Alert.alert(
        "No Pro purchase found",
        "No active Pro entitlement was found for this store account.",
      );
    } catch {
      Alert.alert(
        "Restore unsuccessful",
        "Purchases could not be restored. Please check your connection and try again.",
      );
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(180, bottomBarHeight + 24),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Close button */}
        <Pressable
          style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close paywall"
          accessibilityHint="Returns to the previous screen"
        >
          <Ionicons accessible={false} name="close" size={20} color={colors.mutedForeground} />
        </Pressable>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: "#C8102E15" }]}>
            <Text style={styles.heroEmoji}>🇵🇱</Text>
          </View>
          <Text accessibilityRole="header" style={[styles.heroTitle, { color: colors.foreground }]}>
            Unlock Full Curriculum
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            Go from beginner to B2 upper intermediate.{"\n"}One payment. Yours forever.
          </Text>
        </View>

        {/* Price badge */}
        <View
          accessible
          accessibilityLabel={price ? `One-time purchase, ${price}. No subscription or hidden fees.` : "One-time purchase price is loading"}
          accessibilityLiveRegion="polite"
          style={[styles.priceBadge, { backgroundColor: "#C8102E" }]}
        >
          <Text style={styles.priceLabel}>One-time purchase</Text>
          <Text style={styles.priceAmount}>{price ?? "—"}</Text>
          <Text style={styles.priceNote}>No subscription. No hidden fees.</Text>
        </View>

        {/* What you unlock */}
        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          WHAT YOU UNLOCK
        </Text>
        <View style={[styles.perksCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {PERKS.map((perk, i) => (
            <View key={perk.title}>
              <View style={styles.perkRow}>
                <View style={[styles.perkIconWrap, { backgroundColor: "#C8102E15" }]}>
                  <Ionicons accessible={false} name={perk.icon} size={20} color="#C8102E" />
                </View>
                <View style={styles.perkText}>
                  <Text style={[styles.perkTitle, { color: colors.foreground }]}>{perk.title}</Text>
                  <Text style={[styles.perkDesc, { color: colors.mutedForeground }]}>{perk.desc}</Text>
                </View>
                <Ionicons accessible={false} name="checkmark-circle" size={20} color="#34C759" />
              </View>
              {i < PERKS.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>

        {/* Always free */}
        <View style={[styles.freeCard, { backgroundColor: "#34C75910", borderColor: "#34C75930" }]}>
          <Ionicons accessible={false} name="checkmark-circle" size={18} color="#34C759" />
          <Text style={[styles.freeText, { color: colors.foreground }]}>
            A1 Absolute Beginner is always free — 18 lessons, 250+ words
          </Text>
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View
        onLayout={(event) => setBottomBarHeight(event.nativeEvent.layout.height)}
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            {
              backgroundColor: "#C8102E",
              opacity: pressed || isBillingOperationActive || isLoading ? 0.85 : 1,
            },
          ]}
          onPress={handleUnlockPress}
          disabled={isBillingOperationActive || isLoading}
          accessibilityRole="button"
          accessibilityLabel={price ? `Unlock Pro for ${price}` : "Load purchase options"}
          accessibilityState={{
            disabled: isBillingOperationActive || isLoading,
            busy: isPurchasing || isLoading,
          }}
        >
          {isPurchasing || isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons accessible={false} name="lock-open-outline" size={20} color="#fff" />
              <Text style={styles.ctaText}>
                {price ? `Unlock for ${price}` : "Load purchase options"}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={isBillingOperationActive}
          accessibilityRole="button"
          accessibilityLabel="Restore previous purchase"
          accessibilityState={{ disabled: isBillingOperationActive, busy: isRestoring }}
        >
          {isRestoring ? (
            <ActivityIndicator color={colors.mutedForeground} size="small" />
          ) : (
            <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>
              Restore previous purchase
            </Text>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Privacy Policy"
          accessibilityHint="Opens the in-app Privacy Policy"
          onPress={() => router.push("/privacy-policy")}
          style={styles.privacyLink}
        >
          <Text style={[styles.privacyLinkText, { color: colors.mutedForeground }]}>Privacy Policy</Text>
        </Pressable>
      </View>

      {/* Purchase confirmation modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <Pressable
          accessible={false}
          style={styles.modalOverlay}
          onPress={() => setShowConfirm(false)}
        >
          <Pressable
            accessible={false}
            accessibilityViewIsModal
            style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text accessibilityRole="header" style={[styles.modalTitle, { color: colors.foreground }]}>
                Confirm Purchase
              </Text>
              <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
                Unlock the full "Polish with Me" curriculum for {price ?? "the displayed price"}. This is a one-time payment — you'll have access forever.
              </Text>
              <View style={styles.modalBtns}>
                <Pressable
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                  onPress={() => setShowConfirm(false)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.modalCancelText, { color: colors.foreground }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.modalConfirmBtn,
                    {
                      backgroundColor: "#C8102E",
                      opacity: isBillingOperationActive ? 0.85 : 1,
                    },
                  ]}
                  onPress={handlePurchase}
                  disabled={isBillingOperationActive}
                  accessibilityRole="button"
                  accessibilityLabel={price ? `Confirm payment of ${price}` : "Confirm payment"}
                  accessibilityState={{ disabled: isBillingOperationActive, busy: isPurchasing }}
                >
                  <Text style={styles.modalConfirmText}>Pay {price ?? ""}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingHorizontal: 20 },
  closeBtn: {
    alignSelf: "flex-end",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  hero: { alignItems: "center", marginBottom: 28 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroEmoji: { fontSize: 40 },
  heroTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 10 },
  heroSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  priceBadge: {
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  priceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  priceAmount: {
    color: "#fff",
    fontSize: 44,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  priceNote: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  perksCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  perkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  perkText: { flex: 1 },
  perkTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  perkDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginLeft: 68 },
  freeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  freeText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  ctaText: {
    flexShrink: 1,
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  restoreBtn: { minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  restoreText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  privacyLink: { minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  privacyLinkText: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_500Medium", textDecorationLine: "underline", textAlign: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxHeight: "90%",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  modalContent: { flexGrow: 1 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 10 },
  modalBody: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 20 },
  modalBtns: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  modalCancelBtn: {
    flex: 1,
    flexBasis: 120,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 13,
    alignItems: "center",
  },
  modalCancelText: { flexShrink: 1, fontSize: 15, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  modalConfirmBtn: {
    flex: 1,
    flexBasis: 120,
    borderRadius: 12,
    minHeight: 48,
    paddingVertical: 13,
    alignItems: "center",
  },
  modalConfirmText: { flexShrink: 1, color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold", textAlign: "center" },
});
