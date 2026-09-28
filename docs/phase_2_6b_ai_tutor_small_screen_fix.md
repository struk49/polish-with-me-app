# Phase 2.6B — AI Tutor Small-Screen Responsiveness Fix

## Real-device issue and root cause

On a small Samsung Android viewport, the approved AI Tutor setup content and conversation region competed for vertical space. The setup was a vertical `ScrollView` with `flexGrow: 0` and `flexShrink: 1`, while the conversation used `flex: 1` and also reserved the composer plus `84px + safe-area inset` above the absolute bottom tab bar.

Although the setup content was technically scrollable, it did not own a clearly bounded flexible share of the screen. Under short-height or large-text conditions, its natural content height could squeeze the conversation/composer toward the bottom navigation and make the final interaction uncomfortable to reach.

## Existing container structure

The screen remains:

1. `KeyboardAvoidingView` root
2. vertical setup `ScrollView`
   - editorial header and daily allowance
   - explanation
   - A1/A2/B1/B2 controls
   - horizontal five-scenario rail
3. conversation `View`
   - scenario/reset header
   - optional guided-mode notice
   - message `FlatList`
   - multiline composer and send action

The setup `ScrollView` is the only vertical scroll owner for setup content. The scenario rail remains the previously approved horizontal `ScrollView`. The conversation message list retains its own expected vertical scrolling; no new nested vertical scrolling was introduced.

There is no separate start button in the existing architecture. Selecting a scenario installs its opener immediately, and the composer/send action is the final setup-to-conversation interaction.

## Responsive correction

The setup region now uses `flex: 1` with `minHeight: 0`, matching the conversation region's flexible allocation. This gives both regions bounded, responsive shares of the available viewport rather than allowing setup's natural height to compete unpredictably with the composer.

When setup content does not fit its allocated space, it scrolls naturally from the introduction through all level and scenario controls. No fixed pixel height, device-height calculation, Samsung-specific breakpoint, absolute positioning, or hidden content was introduced.

The setup content container now includes a full existing `section` spacing token below the scenario rail, so the last scenario can scroll comfortably clear of the conversation boundary.

## Density refinements

Only noninteractive spacing was compacted:

- header bottom spacing: `element` to `compact`
- explanatory-card padding: `element` to `compact`
- explanatory-card bottom spacing: `element` to `compact`
- selected-level description bottom spacing: `element` to `compact`
- scenario-card padding: `element` to `compact`
- unnecessary scenario-card `minHeight: 92` removed

Scenario cards still grow naturally for wrapping and large text. Level controls remain at least 48px high. Reset and send controls retain their 48px targets. Typography, wording, semantic colours, selected states, and the approved Phase 2.6 visual direction are unchanged.

## Bottom-tab and safe-area behavior

The conversation composer retains its explicit bottom margin of `84px + insets.bottom` on native platforms. This keeps the text input and send action above the absolute tab bar and device safe area. The responsive setup share prevents setup from forcing that final interaction beneath the navigation region.

On small screens and with larger text, setup scrolls rather than truncating labels or reducing controls. On larger screens, both setup and conversation expand through flex layout without a fixed-height assumption.

## Intentionally preserved behavior

Levels, scenarios, scenario IDs/order/content, selected state, openers, conversation start, reset, messages, composer, sending, loading, fallback, errors, quotas, Free/Pro policy, API requests, security, RevenueCat, and conversation styling are unchanged.

Home Phase 2.3B, Practice Phase 2.4, and Phrasebook Phase 2.5 were not modified. The network issue diagnosed separately was not addressed in this layout phase.

Production remains `com.polishwithme.app`; development remains `com.polishwithme.app.dev`. Expo project ID `1ed9370f-1bcf-40e4-97d6-0597a36f8c76`, version `1.2.1`, and Android versionCode `10` are unchanged.

## Phase 2.6B file scope

Modified:

- `artifacts/mobile/app/(tabs)/ai-tutor.tsx`

Created:

- `docs/phase_2_6b_ai_tutor_small_screen_fix.md`

No dependency, package, lockfile, helper, API, security, billing, locked-screen, shared-token, native-configuration, or EAS file was changed during Phase 2.6B.

## Verification

```powershell
node --experimental-strip-types --test artifacts/mobile/tests/quizCorrectness.test.mjs artifacts/mobile/tests/premiumEntitlement.test.mjs artifacts/mobile/tests/revenuecatLifecycle.test.mjs artifacts/mobile/tests/billingOperationLock.test.mjs artifacts/mobile/tests/homeLearning.test.mjs artifacts/api-server/tests/aiTutorSecurity.test.mjs
node node_modules/typescript/bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
node node_modules/typescript/bin/tsc -p artifacts/api-server/tsconfig.json --noEmit
git diff --check
```

Results:

- 51 focused regression tests passed; 0 failed
- mobile TypeScript passed
- API server TypeScript passed
- `git diff --check` passed
- only the existing Node module-type performance warnings were reported
- no EAS build or Google Play upload was performed

The next step is real-device review through Metro on the target small Samsung phone, including larger system font settings and both themes.
