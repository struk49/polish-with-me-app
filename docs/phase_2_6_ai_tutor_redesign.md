# Phase 2.6 — AI Tutor Redesign

## Existing AI Tutor flow

The AI Tutor UI is implemented in `artifacts/mobile/app/(tabs)/ai-tutor.tsx`. The learner selects one of four levels and one of five trusted scenarios, receives the scenario's existing opener and suggested reply, writes a message, and receives either a remote tutor response or the existing guided local fallback. The learner can reset the current scenario and continue the conversation until the existing client allowance is reached.

The existing levels are A1, A2, B1, and B2. The existing scenarios and IDs are:

- `meet-someone` — Meet someone
- `coffee` — Order coffee
- `shop` — At the shop
- `directions` — Directions
- `family` — Family

Scenario selection replaces the conversation with that scenario's existing opener and starter. Reset does the same for the currently selected scenario. The existing FlatList auto-scroll behavior remains in place.

## Dependencies inspected but not modified

- `artifacts/mobile/lib/aiTutor.ts` — scenarios, levels, local usage, installation ID, fallback replies, endpoint request, headers, validation boundary, and 20-second timeout
- `artifacts/api-server/src/routes/aiTutor.ts` — API route, trusted prompt construction, model request, output limit, and public errors
- `artifacts/api-server/src/lib/aiTutorSecurity.ts` — validation, trusted scenario mapping, rate limit, quotas, and concurrency guard
- `artifacts/api-server/tests/aiTutorSecurity.test.mjs` — security and admission regression coverage
- RevenueCat and premium-entitlement infrastructure used to obtain `isPremium`

None of these files was modified during Phase 2.6.

## Free/Pro and quota behavior

The existing client presentation/admission allowance is 3 replies per local day for Free and 15 for Pro. It is read from and incremented through the existing AsyncStorage helper only after an AI/local tutor result succeeds. RevenueCat's `pro` entitlement remains the sole source of premium authority.

When the displayed allowance reaches zero, the existing send attempt still presents the established alert. No paywall, bypass, automatic retry, or new purchase path was introduced.

The server independently retains its existing process-local controls: 10 requests per IP per 60 seconds, 15 admitted requests per installation per UTC day, 500 global requests per UTC day, and 10 concurrent requests. The installation ID remains an admission identifier rather than authentication.

## Existing loading and error behavior

The request lifecycle disables sending while a request is active. Missing endpoint configuration uses the local guided mode. A failed remote request is caught by the existing client behavior and appends the established guided fallback reply. The client does not currently distinguish network, timeout, rate-limit, validation, or generic server failures for presentation, so Phase 2.6 did not invent classifications or expose raw errors.

Tutor responses are plain text. The redesign does not parse `Polish`, `English`, corrections, explanations, or next prompts into artificial client-side structures and does not transform response content.

## UX issues identified

The original screen used legacy theme colours and ad-hoc transparencies, had a fixed approximately 255px setup region, weak selected-state semantics, generic chat styling, a subtle loading indicator limited to the send icon, and incomplete accessibility labels. The setup area could constrain large text or compact screens, while technical/fallback notices competed with the learning conversation.

## Redesign approach

The redesign remains local to the AI Tutor route and composes the approved Phase 2 visual language from existing semantic colours, spacing, and radii. Home, Practice, Phrasebook, shared tokens, AI helpers, API/security code, and billing remain untouched.

### Setup and scenario selection

- Added the approved editorial header hierarchy and retained a compact replies-remaining badge.
- Restyled the existing explanation as a quiet educational surface.
- Level and scenario controls now have 48px-or-larger targets, selected borders, soft brand surfaces, check states, and screen-reader selected semantics.
- Preserved all labels, descriptions, IDs, openers, starter replies, selection state, and haptics.
- Removed the fixed 255px top-area maximum. The setup ScrollView now sizes naturally and can shrink/scroll when the conversation needs space, supporting compact phones and larger text without changing behavior.

There is no separate start button in the existing flow; the composer remains the first conversation action, so no new stage was introduced.

### Conversation and message hierarchy

- The current scenario and reset control form a compact conversation header.
- Learner messages use a restrained brand-soft surface and explicit `You` label.
- Tutor responses use a calm neutral surface and explicit `Polish tutor` label.
- Guided fallback responses retain the existing `Practice coach` label.
- Message text remains plain, naturally wrapping content with no fixed height or brittle correction parsing.
- Guided/offline availability is presented as a compact, non-technical notice.

### Composer and loading

- The existing multiline input, 500-character maximum, trimming, validation, send logic, disabled condition, and request lifecycle are unchanged.
- The composer uses a Phase 2 surface, readable placeholder, 48px send target, and explicit accessibility label, hint, disabled state, and busy state.
- While the existing `sending` state is true, the conversation now shows a restrained “Your tutor is thinking…” row with a polite accessibility live region. It does not add delay or imply completion.

### Quota and error presentation

- The existing remaining/limit count is retained as secondary information.
- A zero-remaining state uses the existing warning tokens in addition to its numeric text.
- Existing alert wording and exhaustion behavior remain unchanged.
- Existing remote failure behavior remains the guided fallback response; Phase 2.6 only clarifies its visual role and does not change error classification.

## Light, dark, keyboard, scrolling, and accessibility

Setup, selected controls, quota state, notices, message surfaces, composer, placeholder, send/loading states, and disabled states all use the existing paired light/dark semantic tokens. No new palette or light-only colour was introduced.

The existing `KeyboardAvoidingView` behavior remains unchanged. The composer retains bottom-tab and safe-area clearance. The conversation remains a scrollable FlatList with existing content-size auto-scroll, while the setup region can shrink and scroll independently on compact displays.

Accessibility improvements include:

- selected-state roles, labels, and hints for levels and scenarios;
- explicit learner/tutor labels beyond colour;
- labelled reset, input, and send controls;
- disabled and busy send semantics;
- a polite live loading announcement;
- accessible quota and guided-mode status; and
- 48px interactive targets with natural text wrapping.

## Intentionally preserved behavior

AI endpoint resolution, request bodies, headers, installation ID, message slicing, scenario IDs, prompts, model, timeout, output limit, quotas, rate limits, concurrency, CORS, validation, local fallback generation, response parsing, usage increments, entitlement policy, reset behavior, haptics, and auto-scroll are unchanged.

Home Phase 2.3B, Practice Phase 2.4, and Phrasebook Phase 2.5 were not changed. Curriculum, quiz/progress, XP, streak, access rules, RevenueCat, product `pro_unlock`, entitlement `pro`, and purchase/restore are unchanged.

Production remains `com.polishwithme.app`; development remains `com.polishwithme.app.dev`. Expo project ID `1ed9370f-1bcf-40e4-97d6-0597a36f8c76`, version `1.2.1`, and Android versionCode `10` remain unchanged.

## Phase 2.6 file scope

Modified:

- `artifacts/mobile/app/(tabs)/ai-tutor.tsx`

Created:

- `docs/phase_2_6_ai_tutor_redesign.md`

No dependency, lockfile, API, security, helper, billing, shared-token, locked-screen, native-configuration, or EAS file was changed during Phase 2.6.

## Verification

```powershell
node --experimental-strip-types --test artifacts/mobile/tests/quizCorrectness.test.mjs artifacts/mobile/tests/premiumEntitlement.test.mjs artifacts/mobile/tests/revenuecatLifecycle.test.mjs artifacts/mobile/tests/billingOperationLock.test.mjs artifacts/mobile/tests/homeLearning.test.mjs artifacts/api-server/tests/aiTutorSecurity.test.mjs
node node_modules/typescript/bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
node node_modules/typescript/bin/tsc -p artifacts/api-server/tsconfig.json --noEmit
git diff --check
```

Results:

- 51 focused regression tests passed; 0 failed
- AI Tutor security/admission tests passed
- no separate AI Tutor client test module exists
- mobile TypeScript passed
- API server TypeScript passed
- `git diff --check` passed
- only the existing Node module-type performance warnings were reported
- no EAS build or Google Play upload was performed

The next step is real-device setup, conversation, keyboard, fallback, loading, quota, and dark-mode review through Metro in the installed isolated development client.
