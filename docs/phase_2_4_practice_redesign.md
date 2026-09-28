# Phase 2.4 — Practice Screen Redesign

## Original Practice structure

Practice is a single flashcard experience implemented in `artifacts/mobile/app/(tabs)/practice.tsx`.

The learner:

1. selects one accessible lesson from a horizontal lesson picker;
2. sees the lesson's words in their existing order;
3. taps a Polish flashcard to reveal its English translation, phonetic form, and existing example where available;
4. self-assesses each word with **Got it** or **Not yet**;
5. sees the existing known, skipped/review, and percentage summary; and
6. can restart the same lesson.

**Got it** persists a previously unknown word through `ProgressContext`. **Not yet** advances without marking it known. The screen does not contain a separate landing state, objective correctness engine, XP award, or Practice-specific question type.

## Identified UX problems

The original screen predated the approved Phase 2 visual system. It used the legacy colour hook and ad-hoc colour transparency, all-caps navigation labels, emoji-led answer/completion states, and limited accessibility semantics. Lesson selection, session progress, learning content, and completion statistics lacked the hierarchy and surface treatment established on Home.

## Redesign approach

The redesign remains inside the existing Practice route. It reuses `useDesignTokens`, `designSpacing`, `designRadii`, `ProgressBar`, and `StatusBadge`. No Practice logic, data module, shared Home style, tab layout, or global token was modified.

### Hierarchy and lesson selection

- Added a quiet editorial eyebrow above the existing Practice heading.
- Reduced the mastered-word indicator to a compact icon/count badge so it does not compete with the exercise.
- Restyled lesson choices as accessible Phase 2 surfaces with a distinct selected border and soft brand surface.
- Kept lesson title and word count visible, with flexible-width chips for long lesson names.

There is no separate start screen in the existing flow, so none was invented. Selecting a lesson still starts/resets that lesson immediately.

### Active exercise and question presentation

- Session context now reads “Card X of Y” and uses the shared accessible progress bar.
- The Polish word remains the dominant content on the front face.
- English, phonetic text, examples, and translations retain their existing content with clearer primary/supporting hierarchy.
- A labelled sync icon makes the card's reveal action clear without depending on colour.
- The card remains internally scrollable on short screens and uses a minimum rather than fixed height.

### Answer controls and feedback

- The existing **Not yet** and **Got it** actions are unchanged.
- Emoji were replaced with labelled icons and text.
- **Got it** is the Polish-red primary action; **Not yet** uses a restrained bordered surface.
- Both controls retain at least 48px touch height and now include explicit accessibility roles, labels, and hints.
- A previously known word uses the existing green semantic treatment plus a check icon and `KNOWN` text, so state is not communicated by colour alone.

Practice does not determine objectively correct or incorrect answers. Its existing feedback is learner self-assessment, so the redesign does not invent correctness logic or explanatory content.

### Completion state

- Replaced the celebratory emoji with a restrained semantic completion marker.
- Established the hierarchy: “Practice complete,” selected lesson, existing result statistics, total mastered words, then restart action.
- Restyled the existing known/review/score figures as compact semantic summary surfaces.
- The score formula and restart behaviour are unchanged.

## Light, dark, density, and accessibility

All page, surface, border, brand, success, progress, text, pressed, and secondary states use the established light/dark design tokens. No theme-specific colour was added.

The layout retains safe-area and bottom-tab clearance. The active card remains scrollable to protect controls on short screens and during text expansion. Learning content has no fixed-height wrapper, lesson chips can expand, and answer controls remain large enough for touch use.

Accessibility additions include:

- selected-state semantics on lesson controls;
- role, label, and hint for flashcard reveal;
- role, label, and hint for both self-assessment actions and restart;
- existing shared progress-bar role and value semantics;
- text/icon state communication alongside semantic colours; and
- accessible mastered-word and known-word summaries.

## Intentionally preserved behaviour

The redesign does not change lesson availability, lesson selection/reset, word order, flash timing, haptics, known-word persistence, session counters, completion detection, score calculation, or restart behaviour. It does not affect quiz/progress logic, XP, streaks, curriculum, Home, phrases, AI Tutor, RevenueCat, billing, purchase/restore, or access policy.

A1 remains Free. A2, B1, and B2 remain Pro. Production remains `com.polishwithme.app`; development remains `com.polishwithme.app.dev`. Expo project ID `1ed9370f-1bcf-40e4-97d6-0597a36f8c76`, version `1.2.1`, and Android versionCode `10` remain unchanged.

## Phase 2.4 file scope

Modified:

- `artifacts/mobile/app/(tabs)/practice.tsx`

Created:

- `docs/phase_2_4_practice_redesign.md`

No dependency, lockfile, Home, tab-bar, design-token, native configuration, EAS, or billing file was changed during Phase 2.4.

## Verification

```powershell
node node_modules/typescript/bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
node --experimental-strip-types --test artifacts/mobile/tests/quizCorrectness.test.mjs artifacts/mobile/tests/premiumEntitlement.test.mjs artifacts/mobile/tests/revenuecatLifecycle.test.mjs artifacts/mobile/tests/billingOperationLock.test.mjs artifacts/mobile/tests/homeLearning.test.mjs artifacts/api-server/tests/aiTutorSecurity.test.mjs
node node_modules/typescript/bin/tsc -p artifacts/api-server/tsconfig.json --noEmit
git diff --check
```

Results:

- 51 focused regression tests passed; 0 failed
- no separate Practice test module exists
- mobile TypeScript passed
- API server TypeScript passed
- `git diff --check` passed
- only the existing Node module-type performance warnings were reported
- no EAS build or Google Play upload was performed

The next step is real-device visual and interaction review through Metro in the existing isolated development client.
