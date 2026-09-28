# Polish with Me — Phase 1.2 Baseline

Recorded: 15 September 2026 (Europe/London)

## Canonical source

- Repository: `C:\Users\andre\Downloads\polish-app-FIXED\polish-with-me-app-github`
- Branch: `main`
- Baseline HEAD: `f466962e5b2106e65422715c767465ea9422ef1a`
- Baseline commit: `Improve AI tutor explanations and layout`
- Upstream: `origin/main`
- Origin: `https://github.com/struk49/polish-with-me-app.git`

At baseline, the working tree contains one pre-existing modification:
`artifacts/mobile/app.json`. Its only changes from HEAD are app version
`1.2.0` to `1.2.1` and Android version code `9` to `10`. This change is
intentionally preserved but not committed by Phase 1.2.

## Release identity

- Application and Android package ID: `com.polishwithme.app`
- iOS bundle identifier: `com.polishwithme.app`
- Working-tree app version: `1.2.1`
- Working-tree Android version code: `10`
- Expo/EAS project ID: `1ed9370f-1bcf-40e4-97d6-0597a36f8c76`
- EAS app version source: local
- Runtime version policy: app version
- Expo updates: disabled
- Production Android artifact: app bundle
- Production EAS environment/channel: `production`

Local repository evidence does not establish whether version `1.2.1` /
version code `10` has already been uploaded or released through Google Play.
Its provenance classification is **unknown**. Confirm this in Play Console
before reusing or changing version code `10`.

## Architecture summary

The product is an Expo SDK 54 / React Native 0.81 TypeScript mobile app using
Expo Router. Curriculum content is held in static TypeScript data. Theme,
learning progress and purchase state are exposed through React contexts;
progress and AI usage are stored locally with AsyncStorage. RevenueCat manages
the premium entitlement. A TypeScript Express service deployed through Render
proxies text tutor requests to the OpenAI Responses API. Database, generated
API-client and mockup packages are present as workspace scaffolding.

## Package-manager assumptions

- The repository requires pnpm through its preinstall check and workspace
  scripts.
- `pnpm-lock.yaml` exists and uses lockfile format `9.0`.
- The repository does not declare a `packageManager`, `engines`, `.nvmrc`,
  `.node-version` or `.tool-versions` value.
- No expected Node version is therefore recorded. The audit host currently
  provides Node `v25.2.1`; that is environment evidence, not a project
  requirement.
- No expected pnpm version is recorded. pnpm and Corepack were unavailable on
  the audit host.
- `pnpm-workspace.yaml` enables `esbuild`, pins its override to `0.27.3`,
  disables automatic peer installation and imposes a 1-day minimum package
  release age.
- Render runs `pnpm install --frozen-lockfile` and then builds the API server,
  but its configuration assumes a compatible pnpm executable already exists.

The frozen lockfile helps dependency reproducibility, but the missing Node and
pnpm pins mean the toolchain is not fully reproducible. Phase 1.2 deliberately
does not speculate about or modify those versions.

## Deployment configuration names

No values for secrets or credentials are recorded here.

- Mobile AI endpoint: `EXPO_PUBLIC_AI_TUTOR_API_URL` or Expo extra
  `aiTutorApiUrl`
- AI backend: `OPENAI_API_KEY`, `OPENAI_MODEL`, `PORT`, `NODE_ENV`, `LOG_LEVEL`
- RevenueCat: `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY`,
  `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`,
  `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- RevenueCat entitlement identifier: `pro`
- Render service: `polish-with-me-ai-backend`
- Render health check: `/api/healthz`
- EAS profiles: `development`, `preview`, `production`

Signing credentials and RevenueCat/OpenAI secret values are not stored in the
audited source tree.

## Verification

Intended repository commands:

```text
pnpm --filter @workspace/mobile typecheck
pnpm --filter @workspace/api-server typecheck
```

Phase 1.2 results:

- Mobile TypeScript check: **not executed**. The attempt could not start
  because pnpm is unavailable and this canonical checkout has no installed
  dependencies.
- API server TypeScript check: **not executed** for the same reason.
- Packages were not installed, in accordance with the phase constraints.
- Automated unit, UI and integration tests: none found.
- Lint script/configuration: none found.
- Formatting check script: none found. Prettier is declared only as a
  development dependency.

For context only, Phase 1.1 proved that all 159 tracked files in this working
tree were byte-identical to the older checkout, where both TypeScript checks
passed using already-installed dependencies. That does not replace a clean
verification in this canonical checkout.

## Known unresolved release questions

1. Has Android version code `10` already been uploaded to any Play track?
2. Which Git SHA, if any, produced the currently uploaded Play artifact?
3. Are the EAS production signing credentials connected to this Expo project
   and application ID?
4. Are the production RevenueCat Android product, offering and `pro`
   entitlement active and mapped correctly?
5. Is `EXPO_PUBLIC_AI_TUTOR_API_URL` present in the production EAS environment?
6. Does Render guarantee an appropriate pnpm version for the current build
   command?
7. Which Node and pnpm versions should be the supported development and CI
   baseline?

## Known Phase 1 blockers

- Quiz final-answer scoring can omit the last answer.
- A lesson is marked complete when its quiz is opened rather than completed.
- No automated tests protect either behavior.
- The AI endpoint lacks server-enforced authentication, quotas and rate limits.
- The package-manager runtime is not explicitly pinned.
- A canonical-checkout typecheck still needs to run after an approved,
  reproducible dependency setup is available.
- Release code `10` must be checked against Play Console before reuse.

## Phase 1.3 test foundation recommendation

Use the Expo/Jest ecosystem: Jest with `jest-expo`, TypeScript test typings and
React Native Testing Library for the small number of context/UI boundary tests.
Keep pure quiz scoring and completion-transition logic in importable functions
so most tests do not need to render screens.

Proposed locations:

- `artifacts/mobile/lib/__tests__/quizScoring.test.ts`
- `artifacts/mobile/contexts/__tests__/ProgressContext.test.tsx`

Minimum scoring cases:

1. The last correct answer is included in the final percentage.
2. The last incorrect answer is excluded from the correct count.
3. One-question quizzes return either 100% or 0% correctly.
4. Mixed-answer percentages use the completed answer set.
5. Retaking a quiz preserves the intended best-score behavior.

Minimum progress cases:

1. Opening or navigating to a quiz does not complete its lesson.
2. Finishing the quiz triggers completion at the agreed success point.
3. Repeating a completed lesson does not award completion XP twice.
4. Quiz score and completion are persisted together as intended.
5. Failed or abandoned quizzes do not create false completion.

Select compatible dependency versions only when Phase 1.3 explicitly
authorizes installation or manifest changes.
