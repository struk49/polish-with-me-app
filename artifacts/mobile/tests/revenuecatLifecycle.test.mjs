import assert from "node:assert/strict";
import test from "node:test";

import {
  getEntitlementStatus,
  registerRevenueCatSynchronization,
} from "../lib/revenuecatLifecycle.ts";
import { hasProEntitlement } from "../lib/premiumEntitlement.ts";

const freeCustomerInfo = { entitlements: { active: {} } };
const proCustomerInfo = {
  entitlements: { active: { pro: { identifier: "pro" } } },
};

function status(overrides = {}) {
  return getEntitlementStatus({
    initializationAttempted: true,
    configured: true,
    isCustomerInfoPending: false,
    hasCustomerInfoError: false,
    isPremium: false,
    ...overrides,
  });
}

function createSynchronizationHarness(initialCustomerInfo = freeCustomerInfo) {
  let customerInfo = initialCustomerInfo;
  let customerInfoListener;
  let appStateListener;
  let revenueCatListenerRemoved = false;
  let appStateListenerRemoved = false;

  const purchases = {
    addCustomerInfoUpdateListener(listener) {
      customerInfoListener = listener;
    },
    removeCustomerInfoUpdateListener(listener) {
      revenueCatListenerRemoved = listener === customerInfoListener;
    },
    async getCustomerInfo() {
      return customerInfo;
    },
  };

  const appState = {
    currentState: "active",
    addEventListener(_event, listener) {
      appStateListener = listener;
      return {
        remove() {
          appStateListenerRemoved = true;
        },
      };
    },
  };

  return {
    purchases,
    appState,
    emitCustomerInfo(nextCustomerInfo) {
      customerInfoListener(nextCustomerInfo);
    },
    setCustomerInfo(nextCustomerInfo) {
      customerInfo = nextCustomerInfo;
    },
    emitAppState(nextState) {
      appStateListener(nextState);
    },
    listenersRemoved() {
      return revenueCatListenerRemoved && appStateListenerRemoved;
    },
  };
}

test("initial entitlement state remains initializing until setup and CustomerInfo finish", () => {
  assert.equal(status({ initializationAttempted: false }), "initializing");
  assert.equal(status({ isCustomerInfoPending: true }), "initializing");
});

test("active pro CustomerInfo resolves to Pro", () => {
  assert.equal(status({ isPremium: hasProEntitlement(proCustomerInfo) }), "pro");
});

test("CustomerInfo listener updates cached entitlement state and handles revocation", () => {
  const harness = createSynchronizationHarness();
  let cachedCustomerInfo = freeCustomerInfo;
  const cleanup = registerRevenueCatSynchronization({
    purchases: harness.purchases,
    appState: harness.appState,
    updateCustomerInfo(info) {
      cachedCustomerInfo = info;
    },
  });

  harness.emitCustomerInfo(proCustomerInfo);
  assert.equal(status({ isPremium: hasProEntitlement(cachedCustomerInfo) }), "pro");

  harness.emitCustomerInfo(freeCustomerInfo);
  assert.equal(status({ isPremium: hasProEntitlement(cachedCustomerInfo) }), "free");

  cleanup();
  assert.equal(harness.listenersRemoved(), true);
});

test("returning to the foreground refreshes CustomerInfo", async () => {
  const harness = createSynchronizationHarness();
  let cachedCustomerInfo = freeCustomerInfo;
  registerRevenueCatSynchronization({
    purchases: harness.purchases,
    appState: harness.appState,
    updateCustomerInfo(info) {
      cachedCustomerInfo = info;
    },
  });

  harness.setCustomerInfo(proCustomerInfo);
  harness.emitAppState("background");
  harness.emitAppState("active");
  await Promise.resolve();

  assert.equal(status({ isPremium: hasProEntitlement(cachedCustomerInfo) }), "pro");
});

test("configuration and CustomerInfo failures remain fail-closed", () => {
  assert.equal(status({ configured: false }), "error");
  assert.equal(status({ hasCustomerInfoError: true }), "error");
  assert.equal(status({ isPremium: hasProEntitlement(undefined) }), "free");
});
