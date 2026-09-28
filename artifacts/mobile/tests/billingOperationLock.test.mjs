import assert from "node:assert/strict";
import test from "node:test";

import {
  BillingOperationInProgressError,
  createBillingOperationLock,
} from "../lib/billingOperationLock.ts";
import { hasProEntitlement } from "../lib/premiumEntitlement.ts";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function expectBlocked(operation) {
  await assert.rejects(operation, BillingOperationInProgressError);
}

test("purchase starts once from a normal press", async () => {
  const lock = createBillingOperationLock();
  let purchaseCalls = 0;

  const result = await lock.run(async () => {
    purchaseCalls += 1;
    return "purchased";
  });

  assert.equal(result, "purchased");
  assert.equal(purchaseCalls, 1);
});

test("rapid duplicate purchase attempts cannot run concurrently", async () => {
  const lock = createBillingOperationLock();
  const pendingPurchase = deferred();
  let purchaseCalls = 0;
  const first = lock.run(() => {
    purchaseCalls += 1;
    return pendingPurchase.promise;
  });

  await expectBlocked(() => lock.run(async () => {
    purchaseCalls += 1;
  }));
  assert.equal(purchaseCalls, 1);

  pendingPurchase.resolve("done");
  await first;
});

test("restore cannot start while purchase is in flight", async () => {
  const lock = createBillingOperationLock();
  const pendingPurchase = deferred();
  const first = lock.run(() => pendingPurchase.promise);

  await expectBlocked(() => lock.run(async () => "restore"));

  pendingPurchase.resolve("purchase");
  await first;
});

test("purchase cannot start while restore is in flight", async () => {
  const lock = createBillingOperationLock();
  const pendingRestore = deferred();
  const first = lock.run(() => pendingRestore.promise);

  await expectBlocked(() => lock.run(async () => "purchase"));

  pendingRestore.resolve("restore");
  await first;
});

test("rapid duplicate restore attempts cannot run concurrently", async () => {
  const lock = createBillingOperationLock();
  const pendingRestore = deferred();
  let restoreCalls = 0;
  const first = lock.run(() => {
    restoreCalls += 1;
    return pendingRestore.promise;
  });

  await expectBlocked(() => lock.run(async () => {
    restoreCalls += 1;
  }));
  assert.equal(restoreCalls, 1);

  pendingRestore.resolve("done");
  await first;
});

test("purchase lock releases after successful completion", async () => {
  const lock = createBillingOperationLock();
  await lock.run(async () => "first purchase");
  assert.equal(await lock.run(async () => "second purchase"), "second purchase");
});

test("purchase lock releases after cancellation or error", async () => {
  for (const error of [{ userCancelled: true }, new Error("purchase failed")]) {
    const lock = createBillingOperationLock();
    await assert.rejects(lock.run(async () => Promise.reject(error)));
    assert.equal(await lock.run(async () => "retry"), "retry");
  }
});

test("restore lock releases after successful completion", async () => {
  const lock = createBillingOperationLock();
  await lock.run(async () => "first restore");
  assert.equal(await lock.run(async () => "second restore"), "second restore");
});

test("restore lock releases after an error", async () => {
  const lock = createBillingOperationLock();
  await assert.rejects(lock.run(async () => Promise.reject(new Error("restore failed"))));
  assert.equal(await lock.run(async () => "retry"), "retry");
});

test("purchase completion without active pro does not grant Pro", () => {
  const completedPurchaseCustomerInfo = { entitlements: { active: {} } };
  assert.equal(hasProEntitlement(completedPurchaseCustomerInfo), false);
});
