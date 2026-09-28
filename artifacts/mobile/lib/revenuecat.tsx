import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import {
  hasProEntitlement,
  isPurchaseCancellation,
  PRO_ENTITLEMENT_IDENTIFIER,
} from "./premiumEntitlement";
import {
  getEntitlementStatus,
  registerRevenueCatSynchronization,
} from "./revenuecatLifecycle";
import { createBillingOperationLock } from "./billingOperationLock";
import { captureBillingFailure, captureOperationalError } from "./observability";

const REVENUECAT_TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = PRO_ENTITLEMENT_IDENTIFIER;

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
    captureBillingFailure("BILLING_CONFIGURATION_FAILURE");
    console.warn(
      "RevenueCat public API key not found; in-app purchases are disabled.",
    );
    return;
  }

  try {
    const Purchases = getPurchases();
    Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.INFO);
    Purchases.configure({ apiKey });
    revenueCatConfigured = true;
  } catch (err) {
    captureBillingFailure("BILLING_CONFIGURATION_FAILURE", err);
    console.warn("RevenueCat configuration failed:", err);
  }
}

function useSubscriptionContext() {
  const queryClient = useQueryClient();
  const [configured, setConfigured] = useState(isRevenueCatConfigured());
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [isBillingOperationActive, setIsBillingOperationActive] = useState(false);
  const [billingOperationLock] = useState(() =>
    createBillingOperationLock(setIsBillingOperationActive),
  );

  useEffect(() => {
    initializeRevenueCat();
    setConfigured(isRevenueCatConfigured());
    setInitializationAttempted(true);
  }, []);

  const customerInfoQuery = useQuery({
    queryKey: ["revenuecat", "customer-info"],
    queryFn: async () => {
      try {
        return await getPurchases().getCustomerInfo();
      } catch (error) {
        captureOperationalError({
          category: "ENTITLEMENT_REFRESH_FAILURE",
          operation: "entitlement",
          error,
        });
        throw error;
      }
    },
    staleTime: 60 * 1000,
    enabled: configured,
  });

  useEffect(() => {
    if (!configured) return;

    return registerRevenueCatSynchronization({
      purchases: getPurchases(),
      appState: AppState,
      updateCustomerInfo: (customerInfo) => {
        queryClient.setQueryData(
          ["revenuecat", "customer-info"],
          customerInfo,
        );
      },
      onRefreshError: (error) => {
        captureOperationalError({
          category: "ENTITLEMENT_REFRESH_FAILURE",
          operation: "entitlement",
          error,
        });
      },
    });
  }, [configured, queryClient]);

  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn: async () => {
      try {
        return await getPurchases().getOfferings();
      } catch (error) {
        captureBillingFailure("BILLING_OFFERINGS_FAILURE", error);
        throw error;
      }
    },
    staleTime: 300 * 1000,
    enabled: configured,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageToPurchase: any) => {
      try {
        return await billingOperationLock.run(async () => {
          const { customerInfo } = await getPurchases().purchasePackage(
            packageToPurchase,
          );
          return customerInfo;
        });
      } catch (error) {
        captureBillingFailure(
          "BILLING_PURCHASE_FAILURE",
          error,
          isPurchaseCancellation(error),
        );
        throw error;
      }
    },
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(["revenuecat", "customer-info"], customerInfo);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      try {
        return await billingOperationLock.run(() => getPurchases().restorePurchases());
      } catch (error) {
        captureBillingFailure("BILLING_RESTORE_FAILURE", error);
        throw error;
      }
    },
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(["revenuecat", "customer-info"], customerInfo);
    },
  });

  const entitlementStatus = getEntitlementStatus({
    initializationAttempted,
    configured,
    isCustomerInfoPending: customerInfoQuery.isPending,
    hasCustomerInfoError: customerInfoQuery.isError,
    isPremium: hasProEntitlement(customerInfoQuery.data),
  });
  const isPremium = entitlementStatus === "pro";

  return {
    isPremium,
    entitlementStatus,
    isEntitlementLoading: entitlementStatus === "initializing",
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    offerings: offeringsQuery.data,
    offeringsError: offeringsQuery.error,
    refreshOfferings: offeringsQuery.refetch,
    purchase: purchaseMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    isBillingOperationActive,
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
