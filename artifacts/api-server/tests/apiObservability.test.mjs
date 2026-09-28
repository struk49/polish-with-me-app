import assert from "node:assert/strict";
import test from "node:test";

import {
  createApiEvent,
  eventForSecurityCode,
  fatalProcessEvent,
  unexpectedErrorHandler,
} from "../src/lib/apiObservability.ts";

test("security outcomes map to bounded event categories", () => {
  assert.equal(eventForSecurityCode("RATE_LIMITED"), "rate_limited");
  assert.equal(eventForSecurityCode("DAILY_QUOTA_EXCEEDED"), "installation_quota");
  assert.equal(eventForSecurityCode("GLOBAL_QUOTA_EXCEEDED"), "global_quota");
  assert.equal(eventForSecurityCode("AI_TUTOR_BUSY"), "concurrency_limited");
  assert.equal(eventForSecurityCode("INVALID_MESSAGES"), "validation_rejected");
});

test("structured API events omit bodies, learner content, installation IDs, IPs, and secrets", () => {
  const event = createApiEvent("provider_http_error", {
    requestId: "request-1",
    statusCode: 502,
    providerStatus: 500,
    error: new Error("learner text sk-secret installation-123"),
  });
  const serialized = JSON.stringify(event);
  assert.equal(serialized.includes("learner text"), false);
  assert.equal(serialized.includes("sk-secret"), false);
  assert.equal(serialized.includes("installation-123"), false);
  assert.deepEqual(event.event, "provider_http_error");
  assert.deepEqual(event.errorClass, "Error");
});

test("generic error handler logs a bounded event and returns a generic 500", () => {
  const logged = [];
  const req = { id: "request-2", log: { error(value) { logged.push(value); } } };
  const response = {
    headersSent: false, statusCode: 200, body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  unexpectedErrorHandler(new Error("sensitive failure"), req, response, () => {});
  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { error: "INTERNAL_ERROR" });
  assert.equal(JSON.stringify(logged).includes("sensitive failure"), false);
});

test("fatal process event contains only bounded diagnostics", () => {
  const event = fatalProcessEvent("uncaught_exception", new Error("API key and learner text"));
  assert.equal(JSON.stringify(event).includes("API key and learner text"), false);
  assert.equal(event.errorClass, "Error");
});
