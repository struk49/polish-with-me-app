import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";

const REVENUECAT_TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = "pro";

// Load the native module only when a RevenueCat API key is available.
// Resolving it during app startup can crash an installed build when its
// bundled native modules do not match a previously published OTA update.
let purchasesModule: typeof import("react-native-purchases").default | null =
  null;

function getPurchases(): typeof import("react-native-purchases").default {
  if (!purchasesModule) {
    const mod = require("react-native-purchases");
    purchasesModule = mod.default ?? mod;
  }
  return purchasesModule!;
}

function getRevenueCatApiKey(): string | null {
  if (__DEV__ || Platform.OS === "web" || Constants.executionEnvironment === "storeClient") {
    return REVENUECAT_TEST_API_KEY ?? null;
  }

  if (Platform.OS === "ios") {
    return REVENUECAT_IOS_API_KEY ?? null;
  }

  if (Platform.OS === "android") {
    return REVENUECAT_ANDROID_API_KEY ?? null;
  }

  return REVENUECAT_TEST_API_KEY ?? null;
}

let revenueCatConfigured = false;

export function isRevenueCatConfigured() {
  return revenueCatConfigured;
}

export function initializeRevenueCat() {
  if (revenueCatConfigured) return;

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn(
      "RevenueCat public API key not found; in-app purchases are disabled.",
    );
    return;
  }

  try {
    const Purchases = getPurchases();
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
    revenueCatConfigured = true;
  } catch (err) {
    console.warn("RevenueCat configuration failed:", err);
  }
}

function useSubscriptionContext() {
  const [configured, setConfigured] = useState(isRevenueCatConfigured());

  useEffect(() => {
    initializeRevenueCat();
    setConfigured(isRevenueCatConfigured());
  }, []);

  const customerInfoQuery = useQuery({
    queryKey: ["revenuecat", "customer-info"],
    queryFn: async () => {
      const info = await getPurchases().getCustomerInfo();
      return info;
    },
    staleTime: 60 * 1000,
    enabled: configured,
  });

  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn: async () => {
      const offerings = await getPurchases().getOfferings();
      return offerings;
    },
    staleTime: 300 * 1000,
    enabled: configured,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageToPurchase: any) => {
      const { customerInfo } = await getPurchases().purchasePackage(
        packageToPurchase,
      );
      return customerInfo;
    },
    onSuccess: () => customerInfoQuery.refetch(),
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      return getPurchases().restorePurchases();
    },
    onSuccess: () => customerInfoQuery.refetch(),
  });

  const isPremium =
    customerInfoQuery.data?.entitlements.active?.[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;

  return {
    isPremium,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    offerings: offeringsQuery.data,
    offeringsError: offeringsQuery.error,
    refreshOfferings: offeringsQuery.refetch,
    purchase: purchaseMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
  };
}

type SubscriptionContextValue = ReturnType<typeof useSubscriptionContext>;
const Context = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const value = useSubscriptionContext();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubscription() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return ctx;
}
