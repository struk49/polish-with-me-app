# Phase 2.7 — Progress Screen Redesign

## Original Progress structure

The Progress tab is implemented in `artifacts/mobile/app/(tabs)/progress.tsx`. It reads persisted learning state from `ProgressContext` and curriculum metadata from `LESSONS` in `data/lessons.ts`.

The original screen contained:

- an XP-derived numeric learning level and XP-to-next-level bar;
- streak inside the level card;
- completed lessons, known words, quizzes taken, and average quiz score;
- eight locally defined achievements;
- the existing System/Light/Dark appearance control;
- the existing email-feedback action; and
- the existing destructive progress-reset confirmation.

There was no Progress-specific Free/Pro behavior. The route used one vertical `ScrollView` with bottom-tab and safe-area clearance.

## Data sources and calculations

All displayed data remains derived from existing state:

- **Total XP:** `ProgressContext.totalXP`
- **Learning level:** `floor(totalXP / 100) + 1`
- **XP within level:** `totalXP % 100`
- **XP to next level:** `100 - (totalXP % 100)`
- **Streak:** `ProgressContext.streak`
- **Lessons completed:** `ProgressContext.completedLessons.length`
- **Words learned:** `ProgressContext.knownWords.length`
- **Quizzes taken:** number of keys in `ProgressContext.quizScores`
- **Average score:** rounded arithmetic mean of the stored best quiz scores, or zero when none exist
- **Overall curriculum progress:** completed lesson count divided by `LESSONS.length`, rounded to a percentage

The current curriculum contains 61 lessons: A1 has 18, A2 has 16, B1 has 15, and B2 has 12. The new compact level rows calculate each percentage by filtering the same `LESSONS` source and checking those lesson IDs against the same `completedLessons` array. They do not store or infer a new kind of progress.

The Progress screen's “learning level” remains the existing XP-based numeric level. It is not presented as a CEFR proficiency claim. A1–B2 are separately labelled as curriculum progress.

## Achievement audit

The eight existing achievement definitions and unlock conditions remain:

| Achievement | Display condition | Existing unlock condition |
| --- | --- | --- |
| First Steps | Complete your first lesson | completed lessons ≥ 1 |
| On Fire | Maintain a 3-day streak | streak ≥ 3 |
| Bookworm | Complete 5 lessons | completed lessons ≥ 5 |
| Scholar | Complete 8 lessons | completed lessons ≥ 8 |
| Vocabulary Pro | Learn 30 words | known words ≥ 30 |
| Quiz Master | Score 90%+ on any quiz | any stored score ≥ 90 |
| Streak Champion | Maintain a 7-day streak | streak ≥ 7 |
| Polish Expert | Earn 500 XP | total XP ≥ 500 |

### “Complete all 8 lessons” investigation

The old Scholar description said “Complete all 8 lessons,” while the application now has 61 lessons. Its actual unlock condition was not whole-curriculum completion; it was and remains `completedLessons.length >= 8`.

Changing the unlock condition to all lessons would have altered established behavior. The display copy alone was therefore corrected to **“Complete 8 lessons”**, which accurately and durably describes the existing threshold without implying that the curriculum contains only eight lessons.

## UX problems identified

The original screen used the legacy colour system, a visually heavy solid-red level card, four large dashboard tiles, hard-coded light text colours, and opacity-led achievement locking. It did not show the learner's real A1–B2 distribution, and earned/unearned achievement state was not explicitly expressed to screen readers.

## Redesign approach

### Top summary

The first viewport now answers “How am I doing?” with:

- the existing numeric learning level;
- real overall curriculum percentage and lesson count;
- the existing XP total and progress toward the next 100-point level; and
- the first existing unearned achievement as the next milestone, or an all-earned message.

This uses no estimated dates, study hours, fluency score, mastery claim, daily goal, or fabricated progress.

### Metrics

All six original metrics remain available. They are now compact two-column summary rows with stronger values and quieter labels, using the established Home/Practice visual weight rather than large dashboard tiles.

### Curriculum progress

Compact A1, A2, B1, and B2 rows show real completed/total lesson counts and accessible percentage bars. This is a summary only; it does not duplicate Home's lesson navigation or alter access. A1 remains Free, while A2/B1/B2 remain Pro elsewhere under the existing access policy.

### Achievements

Achievement names, thresholds, and order are preserved. Each row now states **Earned** or **In progress**, uses a check or lock icon, and includes the complete state in its screen-reader label. Colour supports the state but is not the sole indicator. The section also reports the real earned count.

### Existing controls

Appearance, feedback, and reset remain in their original order after learning progress. Their behavior is unchanged, while their surfaces, typography, control sizing, selected semantics, labels, and hints now match the Phase 2 system.

## Zero, high-progress, and responsive behavior

A new learner sees truthful zero values, 0% curriculum progress, level 1 with 100 XP remaining, zeroed level rows, and unearned achievements. No fake progress or automatic achievement is introduced.

Large XP, streak, lesson, word, and score values can wrap within flexible metric content. Summary labels and milestone text wrap naturally. Cards use minimum rather than fixed heights.

The screen retains one vertical scroll owner, natural content height, 20px gutters, and `100px + safe-area inset` bottom clearance. All content remains reachable on the target small Samsung device and with larger system text.

## Accessibility and themes

Every progress bar uses the shared semantic progress component with accessible value text. Metrics have combined labels, achievements expose earned state, theme selection exposes selected state, and feedback/reset controls have roles, labels, hints, and 48px minimum targets.

All backgrounds, surfaces, borders, progress tracks, text, brand, level, success, warning, locked, and pressed states use the existing paired light/dark design tokens. No screen-specific light-only colour was added.

## Intentionally unchanged and deferred

Lesson completion, quiz completion/scoring, XP earning, streak calculation, vocabulary tracking, AsyncStorage persistence, reset behavior, curriculum/order, and access policy are unchanged. No migration or stored-data change was introduced.

No new partial lesson progress, study-time metric, goal system, CEFR competence claim, or achievement was added. There is no existing Progress-specific test module; no presentation helper required extraction solely for testing.

Home Phase 2.3B, Practice Phase 2.4, Phrasebook Phase 2.5, AI Tutor Phase 2.6/2.6B, RevenueCat, and billing were not modified.

Production remains `com.polishwithme.app`; development remains `com.polishwithme.app.dev`. Expo project ID `1ed9370f-1bcf-40e4-97d6-0597a36f8c76`, version `1.2.1`, and Android versionCode `10` remain unchanged.

## Phase 2.7 file scope

Modified:

- `artifacts/mobile/app/(tabs)/progress.tsx`

Created:

- `docs/phase_2_7_progress_redesign.md`

No dependency, package, lockfile, context, data, helper, billing, AI Tutor, locked-screen, shared-token, native-configuration, or EAS file was changed during Phase 2.7.

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

The next step is real-device Progress review through Metro in both themes, including zero/high-progress data and larger text settings.
