import assert from "node:assert/strict";
import test from "node:test";

import { canAccessLevel } from "../lib/premiumAccess.ts";
import {
  hasProEntitlement,
  isPurchaseCancellation,
} from "../lib/premiumEntitlement.ts";

test("active pro entitlement grants premium authority", () => {
  assert.equal(
    hasProEntitlement({ entitlements: { active: { pro: { identifier: "pro" } } } }),
    true,
  );
});

test("missing or inactive entitlement does not grant premium", () => {
  assert.equal(hasProEntitlement(undefined), false);
  assert.equal(hasProEntitlement({ entitlements: { active: {} } }), false);
  assert.equal(hasProEntitlement({ entitlements: { active: { other: {} } } }), false);
});

test("free A1 remains accessible without premium", () => {
  assert.equal(canAccessLevel(false, "A1"), true);
});

test("paid levels require premium including direct-route decisions", () => {
  for (const level of ["A2", "B1", "B2"]) {
    assert.equal(canAccessLevel(false, level), false);
    assert.equal(canAccessLevel(true, level), true);
  }
});

test("RevenueCat cancellation is distinguished from purchase failure", () => {
  assert.equal(isPurchaseCancellation({ code: "1" }), true);
  assert.equal(isPurchaseCancellation({ userCancelled: true }), true);
  assert.equal(isPurchaseCancellation({ code: "10" }), false);
  assert.equal(isPurchaseCancellation(new Error("network")), false);
});
