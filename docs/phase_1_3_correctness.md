# Polish with Me — Phase 1.3 Correctness

Recorded: 15 September 2026 (Europe/London)

## Scope

This phase corrects quiz final-answer scoring and lesson-completion timing in
the canonical repository. It does not change curriculum, navigation, release
identity, purchases, AI, EAS, Render or other application copies.

## Root causes

### Quiz scoring

The quiz incremented React `score` state during answer selection and later
read that state to calculate the final result. The result therefore depended
on the timing of an asynchronous state update rather than the explicit set of
completed answers.

### Lesson completion

The lesson screen called `completeLesson()` in the Take Quiz button handler,
before navigating to the quiz. Merely opening and then abandoning a quiz
therefore recorded completion and awarded 50 completion XP.

## New behavior

- Selecting an answer records the selection but does not mutate the completed
  correct-answer count.
- Pressing Next incorporates the current selection exactly once.
- The last selection is explicitly included before percentage calculation.
- Reaching results calls one `finishQuiz()` progress operation that records
  completion and best score atomically.
- Opening or abandoning a quiz performs no completion or XP update.
- First completion still awards 50 XP.
- Score-improvement XP retains the existing formula: one XP per ten percentage
  points of improvement, rounded as before.
- Re-completing a lesson cannot duplicate first-completion XP.
- A lower later result cannot replace a higher stored score.
- No passing percentage was introduced; finishing the quiz is completion.

## Files changed

- `artifacts/mobile/app/lesson/[id].tsx`
- `artifacts/mobile/app/quiz/[id].tsx`
- `artifacts/mobile/contexts/ProgressContext.tsx`
- `artifacts/mobile/lib/quizScoring.ts` (new)
- `artifacts/mobile/lib/progressState.ts` (new)
- `artifacts/mobile/tests/quizCorrectness.test.mjs` (new)
- `docs/phase_1_3_correctness.md` (new)

The pre-existing `artifacts/mobile/app.json` release bump and
`docs/phase_1_2_baseline.md` remain preserved.

## Automated tests

The focused suite uses Node's built-in test runner and the runtime's native
TypeScript type stripping, so it adds no packages or lockfile changes.

Covered cases:

1. One-question correct quiz produces 100%.
2. One-question wrong quiz produces 0%.
3. Multi-question score includes a correct final answer.
4. Multi-question score includes a wrong final answer.
5. All correct produces 100%.
6. All wrong produces 0%.
7. Final answer is counted once.
8. Finishing completes the lesson.
9. First completion awards completion XP once.
10. Re-completion does not duplicate completion XP.
11. A higher score replaces the best and awards only improvement XP.
12. A lower score preserves the best and XP.

Command executed:

```text
node --test artifacts/mobile/tests/quizCorrectness.test.mjs
```

Result: **12 passed, 0 failed**.

`git diff --check` also passed.

The mobile and API TypeScript commands could not be executed in this canonical
checkout because pnpm is unavailable and dependencies are not installed. No
packages were installed or copied. Phase 1.1 previously ran both checks
successfully against the then byte-identical source, but the Phase 1.3 changes
still require a canonical-checkout TypeScript run once the approved toolchain
is available.

## Manual flow review

- Unfinished lesson → Take Quiz → leave early: the lesson screen performs only
  haptic feedback and navigation; no progress method runs, so the lesson stays
  unfinished.
- Unfinished lesson → finish every question: the final selection is added to
  the correct count, the percentage is calculated, and `finishQuiz()` stores
  completion and score in one state transition.
- Repeat with a lower score: completion remains unique, completion XP is not
  repeated, and the prior best score remains.
- Repeat with a higher score: completion remains unique and the best score is
  replaced; only the existing score-improvement XP is added.
- Re-rendering the result view performs no persistence because the side effect
  occurs only in the Next-button event. A repeated event is also idempotent for
  completion and best-score XP.

## Unresolved verification

- Run the canonical mobile TypeScript check after an approved reproducible
  pnpm/dependency setup is available.
- Automated screen-level opening and abandonment tests would require an
  approved React Native component-test environment. These two flows were
  verified by direct source tracing in this phase.
- The Node test runner emitted a non-failing module-type warning because the
  mobile package does not declare `type: module`. No package configuration was
  changed merely to suppress it.
