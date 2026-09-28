import assert from "node:assert/strict";
import test from "node:test";

import {
  captureBillingFailure,
  captureOperationalError,
  createErrorBoundaryReporter,
  initializeObservability,
  resetObservabilityForTests,
  sanitizeEventForReporting,
} from "../lib/observability.ts";

function harness({ throwOnCapture = false } = {}) {
  const captures = [];
  const adapter = {
    init(options) { captures.push({ kind: "init", options }); },
    captureException(error, context) {
      if (throwOnCapture) throw new Error("reporter offline");
      captures.push({ kind: "exception", error, context });
    },
    captureMessage(message, context) { captures.push({ kind: "message", message, context }); },
  };
  resetObservabilityForTests();
  assert.equal(initializeObservability({ dsn: "https://public@example.invalid/1", environment: "development", adapter }), true);
  return captures;
}

test("missing DSN disables reporting without failing startup", () => {
  resetObservabilityForTests();
  assert.equal(initializeObservability({ dsn: "" }), false);
});

test("SDK configuration is error-only and disables PII, breadcrumbs, tracing, profiling, and replay", () => {
  const captures = harness();
  const options = captures[0].options;
  assert.equal(options.sendDefaultPii, false);
  assert.equal(options.tracesSampleRate, 0);
  assert.equal(options.profilesSampleRate, 0);
  assert.equal(options.replaysSessionSampleRate, 0);
  assert.equal(options.replaysOnErrorSampleRate, 0);
  assert.equal(options.beforeBreadcrumb(), null);
});

test("event sanitizer removes identity, request, breadcrumbs, messages, and arbitrary context", () => {
  const event = sanitizeEventForReporting({
    user: { id: "installation-secret" }, request: { data: "learner text" },
    breadcrumbs: [{ message: "tap" }], extra: { token: "secret" }, message: "learner text",
    tags: { error_category: "AI_TIMEOUT", arbitrary: "secret" },
    contexts: { diagnostic: { errorClass: "AbortError" }, arbitrary: { learner: "text" } },
    exception: { values: [{ type: "Error", value: "learner text" }] },
  });
  assert.equal(JSON.stringify(event).includes("learner text"), false);
  assert.equal(JSON.stringify(event).includes("installation-secret"), false);
  assert.deepEqual(event.tags, { error_category: "AI_TIMEOUT" });
  assert.deepEqual(Object.keys(event.contexts), ["diagnostic"]);
});

test("bounded billing, storage, and error-boundary events contain no supplied values", () => {
  const captures = harness();
  captureBillingFailure("BILLING_PURCHASE_FAILURE", new Error("purchase-secret"));
  captureOperationalError({ category: "STORAGE_WRITE_FAILURE", operation: "storage", storage: "progress", error: new Error("stored-value") });
  createErrorBoundaryReporter()(new Error("rendered learner text"), "\n at TutorScreen (app.tsx:1)");
  const serialized = JSON.stringify(captures.slice(1));
  assert.equal(serialized.includes("purchase-secret"), false);
  assert.equal(serialized.includes("stored-value"), false);
  assert.equal(serialized.includes("rendered learner text"), false);
  assert.equal(captures.length, 4);
});

test("purchase cancellation is not reported and reporter failure never escapes", () => {
  let captures = harness();
  captureBillingFailure("BILLING_PURCHASE_FAILURE", new Error("cancelled"), true);
  assert.equal(captures.length, 1);
  harness({ throwOnCapture: true });
  assert.doesNotThrow(() => captureOperationalError({ category: "AI_NETWORK_FAILURE", operation: "ai_network", error: new TypeError("network") }));
});
