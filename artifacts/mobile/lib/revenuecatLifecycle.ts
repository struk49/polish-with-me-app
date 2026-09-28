export type EntitlementStatus = "initializing" | "free" | "pro" | "error";

export function getEntitlementStatus({
  initializationAttempted,
  configured,
  isCustomerInfoPending,
  hasCustomerInfoError,
  isPremium,
}: {
  initializationAttempted: boolean;
  configured: boolean;
  isCustomerInfoPending: boolean;
  hasCustomerInfoError: boolean;
  isPremium: boolean;
}): EntitlementStatus {
  if (!initializationAttempted || (configured && isCustomerInfoPending)) {
    return "initializing";
  }

  if (!configured || hasCustomerInfoError) {
    return "error";
  }

  return isPremium ? "pro" : "free";
}

type PurchasesSynchronization = {
  addCustomerInfoUpdateListener: (listener: (customerInfo: unknown) => void) => void;
  removeCustomerInfoUpdateListener: (listener: (customerInfo: unknown) => void) => void;
  getCustomerInfo: () => Promise<unknown>;
};

type AppStateSynchronization = {
  currentState: string;
  addEventListener: (
    event: "change",
    listener: (nextState: string) => void,
  ) => { remove: () => void };
};

export function registerRevenueCatSynchronization({
  purchases,
  appState,
  updateCustomerInfo,
  onRefreshError,
}: {
  purchases: PurchasesSynchronization;
  appState: AppStateSynchronization;
  updateCustomerInfo: (customerInfo: unknown) => void;
  onRefreshError?: (error: unknown) => void;
}) {
  const customerInfoListener = (customerInfo: unknown) => {
    updateCustomerInfo(customerInfo);
  };

  purchases.addCustomerInfoUpdateListener(customerInfoListener);

  let previousAppState = appState.currentState;
  const appStateSubscription = appState.addEventListener("change", (nextState) => {
    const returnedToForeground =
      nextState === "active" && previousAppState !== "active";
    previousAppState = nextState;

    if (returnedToForeground) {
      void purchases.getCustomerInfo().then(updateCustomerInfo).catch((error) => {
        onRefreshError?.(error);
        // Keep the last CustomerInfo during a transient foreground refresh failure.
      });
    }
  });

  return () => {
    purchases.removeCustomerInfoUpdateListener(customerInfoListener);
    appStateSubscription.remove();
  };
}
