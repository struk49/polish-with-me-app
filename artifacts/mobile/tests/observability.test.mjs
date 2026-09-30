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

function reportedBilling(error, category = "BILLING_OFFERINGS_FAILURE") {
  const captures = harness();
  captureBillingFailure(category, error);
  const capture = captures[1];
  const event = sanitizeEventForReporting({
    tags: capture.context.tags,
    contexts: capture.context.contexts,
    exception: { values: [{ type: capture.error?.name, value: capture.error?.message }] },
  });
  return { capture, event };
}

test("RevenueCat codes become fixed symbolic billing diagnostics through beforeSend", () => {
  for (const [code, expected] of [["10", "NETWORK_ERROR"], ["23", "CONFIGURATION_ERROR"], ["2", "STORE_PROBLEM_ERROR"], ["32", "PRODUCT_REQUEST_TIMED_OUT_ERROR"]]) {
    const { event } = reportedBilling({ code });
    assert.equal(event.tags.billing_error_code, expected);
    assert.equal(event.tags.error_category, "BILLING_OFFERINGS_FAILURE");
    assert.equal(event.tags.operation, "billing");
  }
});

test("billing diagnostics discard messages and sensitive properties before and after sanitization", () => {
  const error = Object.assign(new Error("private-message"), {
    code: "10", apiKey: "private-key", token: "private-token", receipt: "private-receipt",
    email: "private-email", underlyingErrorMessage: "private-underlying",
    readableErrorCode: "private-readable", userInfo: { readableErrorCode: "private-userinfo" },
  });
  error.stack = undefined;
  const { capture, event } = reportedBilling(error);
  const output = JSON.stringify({ capture, event, message: capture.error.message });
  assert.equal(output.includes("private-"), false);
  assert.equal(event.exception.values[0].value, "Sanitized application error");
});

test("unknown, malformed and accessor codes cannot escape as billing metadata", () => {
  for (const error of [undefined, null, "private-message", { code: "private-token" }, { code: 10 }, { code: "999" }, { code: "010" }, { code: { token: "private-token" } }, Object.create({ code: "10" }), { get code() { throw new Error("must not run"); } }]) {
    const { event } = reportedBilling(error);
    assert.equal(event.tags.billing_error_code, undefined);
    assert.equal(JSON.stringify(event).includes("private-"), false);
  }
});

test("all billing categories retain their identity including purchase and restore", () => {
  for (const category of ["BILLING_CONFIGURATION_FAILURE", "BILLING_OFFERINGS_FAILURE", "BILLING_PACKAGE_MISSING", "BILLING_PURCHASE_FAILURE", "BILLING_RESTORE_FAILURE"]) {
    const { event } = reportedBilling({ code: "2" }, category);
    assert.equal(event.tags.error_category, category);
    assert.equal(event.tags.billing_error_code, "STORE_PROBLEM_ERROR");
  }
  const captures = harness();
  captureBillingFailure("BILLING_PURCHASE_FAILURE", { code: "1" }, true);
  assert.equal(captures.length, 1);
});

test("beforeSend rejects injected diagnostic text and non-billing code tags", () => {
  for (const tags of [
    { operation: "billing", error_category: "BILLING_OFFERINGS_FAILURE", billing_error_code: "private-token" },
    { operation: "storage", error_category: "STORAGE_READ_FAILURE", billing_error_code: "NETWORK_ERROR" },
  ]) {
    const event = sanitizeEventForReporting({ tags });
    assert.equal(event.tags.billing_error_code, undefined);
  }
});
