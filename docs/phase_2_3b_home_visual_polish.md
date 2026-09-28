# Phase 2.3B — Home Screen Real-Device Visual Polish

## Reason for this pass

Real-device review confirmed that the Phase 2.3 Home structure works, but showed that the upper screen felt slightly statistics-heavy, required more scrolling than necessary, and that the curriculum levels could read more clearly as one continuous learning journey. This pass refines the existing design without changing Home behaviour or navigation.

## Visual refinements

### Hierarchy and Continue Learning

- Continue Learning remains immediately below the editorial header and remains the dominant Home action.
- The lesson title is slightly larger, tighter, and more editorial in character.
- Supporting badges, description, metadata, level progress, and CTA retain their established order while using a tighter spacing rhythm.
- The feature surface uses a slightly stronger border treatment without adding gradients or decoration.

### Metrics and curriculum progress

- Level, XP, Lessons, and Vocabulary remain visible with unchanged values.
- The four tall statistic tiles are now compact two-column summary rows with a quiet icon surface, value, and supporting label.
- Metric height, padding, icon size, value size, grid gap, and label size were reduced while retaining readable type and responsive wrapping.
- Overall curriculum progress remains directly below the metrics and retains its percentage, completed-count copy, progress semantics, and non-colour text explanation.

### Spacing and density

- Header-to-primary-action spacing and primary-action-to-progress spacing were reduced using the existing Phase 2 spacing tokens.
- Continue Learning metadata and progress spacing were tightened.
- Section, metric-grid, level, and lesson-card spacing was reduced without introducing fixed screen-size assumptions.
- Lesson cards retain a minimum height above the 48px interaction requirement and continue to grow with wrapped or scaled text.

### Learning-path continuity

- A subtle vertical connector now aligns the A1, A2, B1, and B2 level markers.
- The connector uses the theme's existing strong-border token and is decorative only.
- Level headings have stronger typographic emphasis, while descriptions and completion counts remain quieter.
- Lesson titles are slightly larger so learning content has more emphasis than metadata and state labels.
- Curriculum order, expansion behaviour, lesson cards, routes, locked states, grammar markers, and completion states are unchanged.

### Tab bar

No tab-bar change was necessary. The existing Android tab bar already uses the app theme colours and Polish-red active state while preserving all five destinations, their order, and behaviour. Avoiding an unnecessary change kept this pass focused on the real-device Home findings.

## Theme and accessibility considerations

All changed surfaces, borders, text, icons, level colours, and progression cues continue to use the existing light/dark design tokens. No theme-specific hard-coded colour was introduced.

The pass preserves:

- accessibility roles, labels, hints, and expanded state
- progress-bar semantics and text explanations
- non-colour lesson, locked, Pro, completion, and next-state labels
- minimum 48px interactive targets
- flexible card heights and text wrapping
- narrow-phone responsive layout
- safe-area and bottom-tab clearance

## Intentionally unchanged behaviour

This was a visual-only pass. It did not change Continue Learning selection, curriculum data or order, lesson/grammar routing, quiz scoring, lesson completion, progress persistence, XP, streaks, metric calculations, vocabulary counts, access rules, RevenueCat, billing, purchase/restore, or development-build isolation.

Production remains `Polish with Me` / `com.polishwithme.app`. Development remains `Polish with Me Dev` / `com.polishwithme.app.dev`, with scheme `mobile-dev` selected by `APP_VARIANT=development`. Version `1.2.1`, Android versionCode `10`, and Expo project ID `1ed9370f-1bcf-40e4-97d6-0597a36f8c76` are unchanged.

## Phase 2.3B file scope

Modified:

- `artifacts/mobile/app/(tabs)/index.tsx`
- `artifacts/mobile/components/HomePrimitives.tsx`

Created:

- `docs/phase_2_3b_home_visual_polish.md`

No dependency or native-configuration change was made. Other Phase 1, Phase 2, `expo-dev-client`, package/lockfile, app config, and EAS isolation changes were pre-existing and preserved.

## Verification

Focused regression suite:

```powershell
node --experimental-strip-types --test artifacts/mobile/tests/quizCorrectness.test.mjs artifacts/mobile/tests/premiumEntitlement.test.mjs artifacts/mobile/tests/revenuecatLifecycle.test.mjs artifacts/mobile/tests/billingOperationLock.test.mjs artifacts/mobile/tests/homeLearning.test.mjs artifacts/api-server/tests/aiTutorSecurity.test.mjs
```

Result: 51 passed, 0 failed. Node emitted only the existing module-type performance warnings.

Type and quality checks:

```powershell
node node_modules/typescript/bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
node node_modules/typescript/bin/tsc -p artifacts/api-server/tsconfig.json --noEmit
git diff --check
```

Results:

- mobile TypeScript passed
- API server TypeScript passed
- `git diff --check` passed
- no EAS build was run
- no Google Play upload was performed

The next validation step is visual review through Metro in the already-installed isolated development client.
