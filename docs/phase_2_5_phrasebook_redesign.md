# Phase 2.5 — Phrases / Phrasebook Redesign

## Existing Phrasebook structure

The Phrasebook is implemented entirely in `artifacts/mobile/app/(tabs)/phrasebook.tsx`, with its phrase content and category definitions imported from `artifacts/mobile/data/lessons.ts`.

It contains 90 phrases in fixed source order. The existing horizontal filters are:

1. All
2. Greetings
3. Questions
4. Shopping
5. Restaurants
6. Emergencies
7. Directions
8. Hotel
9. Medical
10. Transport
11. Social
12. Business

The route is free and has no premium checks or subscription prompts.

## Existing behavior

Search matches the learner's query against the existing Polish, English, and phonetic strings using case-insensitive substring matching. Category selection filters phrases by their existing category membership. Search and category filters combine, and an existing clear-search control removes the query.

Pressing any phrase card plays its Polish text through `expo-speech`. Pressing the speaking card again stops playback. The existing Android language value (`pl`), other-platform language value (`pl-PL`), rate, pitch, volume, queue clearing, haptic response, callback state, and error alert remain unchanged.

There are no existing copy, favorite, share, expansion, or navigation actions.

## UX issues identified

The original route had no page heading or concise context, used the legacy colour hook and ad-hoc transparency, communicated category selection primarily by colour, and offered limited screen-reader semantics. Phrase text, translation, phonetics, and speech action also lacked the visual hierarchy established by the approved Home and Practice screens.

## Redesign approach

The redesign is local to the Phrasebook route. It reuses the established `useDesignTokens`, `designSpacing`, and `designRadii` values without modifying shared tokens, Home, Practice, or phrase data.

### Header, search, and categories

- Added a compact Phase 2 page header with the existing product term “Phrases” and concise supporting copy.
- Restyled the existing search control as a 52px semantic surface with explicit search and clear-control accessibility labels and hints.
- Preserved the placeholder, query state, clear action, keyboard return type, and exact search matching logic.
- Retained the existing horizontal category order and selection logic.
- Category controls now have at least 48px height, natural width for long names, a soft brand surface, stronger selected border, check icon, and selected-state semantics.

### Phrase hierarchy and density

Phrase cards now present content in the intended scan order:

1. Polish phrase
2. English meaning
3. existing phonetic pronunciation
4. speech control

Polish text is larger and semibold without uppercase transformation or additional letter spacing. English remains immediately readable but secondary. Phonetics retain their exact content and italic treatment, now paired with a restrained supporting icon.

Card padding and list spacing use the compact existing spacing tokens. Cards retain natural height and wrapping for long Polish phrases, translations, pronunciation strings, and scaled text.

### Speech action and state

The entire phrase card remains the existing speech control, so its interaction behavior is unchanged. A 48px visual audio target now makes the action discoverable. The active state uses a stop icon, brand border, and soft brand surface in addition to colour. Each card now exposes its Polish, English, and pronunciation content in its accessibility label and describes whether activation will play or stop pronunciation.

### Empty state

The existing no-results state remains conditional on the unchanged search/filter result. It is now a compact bordered surface with a clear title and guidance to try another search or category. No new reset behavior was introduced.

## Light, dark, responsive, and accessibility treatment

Page background, search, phrase surfaces, pressed state, borders, brand state, text hierarchy, pronunciation, action controls, categories, and empty state all use the existing paired light/dark semantic tokens. No new colour system or theme-specific hard-coded colour was introduced.

The list retains bottom-tab and safe-area clearance. Search and category controls meet minimum touch sizing; phrase cards have no fixed height; all content wraps naturally; the category rail remains horizontally scrollable; and screen-reader roles, labels, hints, and selected states are now explicit.

## Intentionally preserved behavior

Phrase text, translations, phonetics, phrase order, category names/order/membership, search matching, combined filtering, search clearing, speech settings, speech stop behavior, haptics, and error handling are unchanged. Phrasebook remains Free.

Home Phase 2.3B and Practice Phase 2.4 remain untouched. Curriculum, quiz/progress, XP, streak, RevenueCat, billing, product `pro_unlock`, entitlement `pro`, and purchase/restore behavior are unchanged.

Production remains `com.polishwithme.app`; development remains `com.polishwithme.app.dev`. Expo project ID `1ed9370f-1bcf-40e4-97d6-0597a36f8c76`, version `1.2.1`, and Android versionCode `10` remain unchanged.

## Phase 2.5 file scope

Modified:

- `artifacts/mobile/app/(tabs)/phrasebook.tsx`

Created:

- `docs/phase_2_5_phrasebook_redesign.md`

No dependency, phrase-data, Home, Practice, shared-token, native-configuration, EAS, lockfile, access, or billing file was changed during Phase 2.5.

## Verification

```powershell
node node_modules/typescript/bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
node --experimental-strip-types --test artifacts/mobile/tests/quizCorrectness.test.mjs artifacts/mobile/tests/premiumEntitlement.test.mjs artifacts/mobile/tests/revenuecatLifecycle.test.mjs artifacts/mobile/tests/billingOperationLock.test.mjs artifacts/mobile/tests/homeLearning.test.mjs artifacts/api-server/tests/aiTutorSecurity.test.mjs
node node_modules/typescript/bin/tsc -p artifacts/api-server/tsconfig.json --noEmit
git diff --check
```

Results:

- 51 focused regression tests passed; 0 failed
- no separate Phrasebook test module exists
- mobile TypeScript passed
- API server TypeScript passed
- `git diff --check` passed
- only the existing Node module-type performance warnings were reported
- no EAS build or Google Play upload was performed

The next step is real-device visual, speech, search, and filter review through Metro in the installed isolated development client.
