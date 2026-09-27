import assert from "node:assert/strict";
import test from "node:test";

import { privacyPolicyHtml } from "../src/privacyPolicy.ts";

test("public policy identifies Polish with Me and presents deletion instructions", () => {
  assert.match(privacyPolicyHtml, /<title>Privacy Policy and Data Deletion — Polish with Me<\/title>/);
  assert.match(privacyPolicyHtml, /<h1>Polish with Me Privacy Policy<\/h1>/);
  assert.match(privacyPolicyHtml, /<h2>Request deletion of your data<\/h2>/);
  assert.match(privacyPolicyHtml, /podgeaisolutions@gmail\.com/);
});

test("public policy includes current provider disclosures without secrets", () => {
  for (const provider of ["OpenAI", "Sentry", "RevenueCat", "Google Play"]) {
    assert.match(privacyPolicyHtml, new RegExp(provider));
  }
  assert.match(privacyPolicyHtml, /approximate geography/);
  assert.match(privacyPolicyHtml, /IP-address storage is disabled/);
  assert.doesNotMatch(privacyPolicyHtml, /EXPO_PUBLIC_|SENTRY_DSN|OPENAI_API_KEY|sk-/);
});
