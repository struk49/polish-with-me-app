# Polish with Me — Phase 1.5 AI Tutor Security

Recorded: 15 September 2026 (Europe/London)

## Previous security boundary

The native Expo screen resolved `EXPO_PUBLIC_AI_TUTOR_API_URL` (or the Expo
extra `aiTutorApiUrl`), appended `/api/ai-tutor`, and posted the selected level,
client-provided scenario ID and title, plus up to eight messages. The request
reached the Express app's unrestricted CORS and unbounded default JSON parser,
then `/api/ai-tutor`, which was mounted beneath `/api`.

The route validated A1–B2, at most 12 messages and 600 characters per message,
but trusted arbitrary scenario text. It had no authentication, server rate
limit, server quota, concurrency limit or provider timeout. Client-only daily
limits (free 3, Pro 15) were stored in AsyncStorage and were bypassable. OpenAI
used `OPENAI_MODEL` or `gpt-5-mini`, minimal reasoning, low verbosity and a
600-token output ceiling. Provider failure logs included the raw provider body.

## Threat model

- **CRITICAL:** none identified within this endpoint; the OpenAI key remained
  server-side and was not returned to the client.
- **HIGH:** a discovered public endpoint allowed automated, concurrent and
  repeated OpenAI spend; client quotas were bypassable; arbitrary scenario
  text enabled prompt-boundary manipulation.
- **MEDIUM:** wildcard CORS enabled arbitrary browser origins; no explicit JSON
  body ceiling or provider timeout existed; raw provider errors could retain
  sensitive content; retry storms and large histories increased cost.
- **LOW:** malformed input had inconsistent string-only errors; there was no
  stable machine-readable error code or anonymous abuse-control identity.

## Protections added

Every request is validated and admitted by the abuse guard before the OpenAI
function is invoked. Stable errors use `{ "error": { "code", "message" } }`.
The server now enforces trusted scenarios, bounded messages, a 16 KiB JSON body
limit, per-IP rate limiting, anonymous-install daily quota, process-global
daily quota, maximum concurrency, provider timeout and bounded output. Provider
error bodies and learner conversations are not logged.

## Rate-limit policy

The default is 10 attempts per source IP in a rolling 60-second window. A
rejection returns HTTP 429 with `RATE_LIMITED` and cannot call OpenAI. Express
trusts one proxy hop because the production target is Render.

The limiter is process-local. It resets on restart, is not shared between
replicas, and uses memory. It is meaningful protection for the current
single-process architecture, not a substitute for a shared production rate
store if the service scales horizontally.

## Quota policy

- 15 admitted requests per anonymous installation per UTC day
- 500 admitted requests globally per process per UTC day
- 10 concurrent provider requests per process

Quota is charged before the provider call, including failed provider attempts,
which limits retry-driven spend. Exhaustion returns HTTP 429 and never calls
OpenAI. Busy concurrency returns HTTP 503 before OpenAI.

These counters are deliberately described as non-durable: restarts clear them
and multiple instances each have separate ceilings. A truly durable global
budget requires shared infrastructure that this repository does not currently
operate. No database, Redis service or account system was introduced. Before
horizontal scaling or stronger spend guarantees, add an authorized shared
atomic quota store and provider-side project budget alerts/limits.

## Installation identity

The mobile app generates a random opaque ID, stores it in AsyncStorage, and
sends it in `X-AI-Installation-ID`. It contains no advertising ID, hardware
identifier, email, phone number or account data. The server accepts only a
bounded safe-character form.

This ID is non-secret, resettable and spoofable. It is an abuse-control bucket,
not authentication or proof of a person, purchase or entitlement. Source-IP
and global controls remain necessary. The existing client UI continues to
enforce free 3 / Pro 15 limits; the server's installation ceiling is
authoritative for its own maximum but does not validate RevenueCat status.

## Trusted scenarios and validation

The client now sends only the stable scenario ID. The server maps IDs to the
five existing production titles:

- `meet-someone` → Meet someone
- `coffee` → Order coffee
- `shop` → At the shop
- `directions` → Directions
- `family` → Family

Unknown IDs are rejected before OpenAI. Client-supplied scenario titles are
ignored and never enter the prompt.

The server accepts only A1, A2, B1 or B2; 1–8 messages; user or assistant
roles; nonblank text of at most 500 characters each; and at most 3,000 message
characters total. JSON bodies are capped at 16 KiB. Malformed JSON and excess
body size return stable 400 and 413 errors respectively. Oversized values are
rejected rather than truncated.

## CORS, logging and provider boundaries

Requests without an Origin header remain allowed for native clients. Browser
origins must match the comma-separated `AI_TUTOR_ALLOWED_ORIGINS` allowlist;
localhost and 127.0.0.1 are additionally allowed outside production. CORS is
not treated as native authentication.

HTTP request logs retain only request ID, method, query-free URL and status.
Provider failures record only an error class and numeric provider status when
available. API keys, authorization headers, learner conversations, raw OpenAI
responses and raw provider error bodies are not logged by this route.

OpenAI remains configured by `OPENAI_MODEL`, defaulting to `gpt-5-mini`.
Requests retain minimal reasoning, low verbosity and `max_output_tokens: 600`.
History is bounded to eight validated messages and 3,000 characters. Provider
calls time out after 20 seconds by default.

## Environment variables

- `AI_TUTOR_ALLOWED_ORIGINS`: comma-separated exact browser origins; default
  empty in production (native requests without Origin still work)
- `AI_TUTOR_RATE_WINDOW_MS`: positive integer; default `60000`
- `AI_TUTOR_RATE_MAX`: positive integer; default `10`
- `AI_TUTOR_INSTALL_DAILY_MAX`: positive integer; default `15`
- `AI_TUTOR_GLOBAL_DAILY_MAX`: positive integer; default `500`
- `AI_TUTOR_MAX_CONCURRENT`: positive integer; default `10`
- `AI_TUTOR_OPENAI_TIMEOUT_MS`: positive integer; default `20000`

Existing `OPENAI_API_KEY` and `OPENAI_MODEL` behavior is preserved. No secret
or production Render environment value was added or changed.

## Tests and verification

Dependency-free Node tests cover valid requests, invalid scenario and level,
too many messages, oversized text, unsupported roles, rate rejection without a
provider call, installation and global quota rejection without a provider
call, trusted scenario mapping, and secret-safe public errors.

- `node --test artifacts/mobile/tests/quizCorrectness.test.mjs`: **12 passed,
  0 failed**
- `node --test artifacts/api-server/tests/aiTutorSecurity.test.mjs`: **11
  passed, 0 failed**
- `pnpm --filter @workspace/mobile typecheck`: **passed**
- `pnpm run typecheck:libs`: **passed**
- `pnpm --filter @workspace/api-server typecheck`: **passed**
- `git diff --check`: **passed**
- `pnpm run typecheck`: mobile, API, libraries and scripts passed; the wrapper
  remained nonzero only because the pre-existing out-of-scope mockup-sandbox
  React ref type conflict persisted

The Phase 1.4 lockfile SHA-256 remained
`D8459A0260A3EA9D754B9527DBBA99CD11B8D3EDCF1999B63AB57DC77A7130A8` and no
dependency was added.

## Remaining limitations and production requirements

- The endpoint has no user authentication; installation IDs are spoofable.
- Rate and quota state is neither durable nor cross-instance.
- A process-global limit reduces but cannot absolutely cap spend across
  restarts or replicas; provider-side project budget controls remain essential.
- Production browser clients require an explicit origin allowlist value.
- Live enforcement has not been deployment-tested in this phase.
- The broader workspace typecheck retains the pre-existing mockup-sandbox
  React type conflict documented in Phase 1.4.
