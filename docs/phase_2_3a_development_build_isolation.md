# Phase 2.3A — Isolated Android Development Build

## Purpose

The previous EAS development build used the production Android package, `com.polishwithme.app`. Android therefore treated it as the same application as the installed Google Play build and offered to replace that installation.

Phase 2.3A gives the development client a separate Android identity so it can be installed alongside production. The development build is intended for UI, navigation, layout, accessibility, responsive, and Phase 2 development testing.

## Identities

| Build | Display name | Android package | URL scheme |
| --- | --- | --- | --- |
| Production/default | Polish with Me | `com.polishwithme.app` | `mobile` |
| Development | Polish with Me Dev | `com.polishwithme.app.dev` | `mobile-dev` |

The isolated development scheme avoids a side-by-side custom URL-scheme collision. Production deep-link behaviour remains unchanged.

## Configuration mechanism

`artifacts/mobile/app.config.ts` overlays the existing static `app.json` configuration. It selects the development identity only when `APP_VARIANT` is exactly `development`.

The `development` EAS profile supplies that explicit marker and retains:

- `developmentClient: true`
- `distribution: internal`
- Node `24.21.0`

When the marker is absent or has any other value, configuration fails safe to the production name, package, and scheme. The full Expo configuration is not duplicated.

The Expo project remains linked to project ID `1ed9370f-1bcf-40e4-97d6-0597a36f8c76`. No project creation, relinking, owner change, or EAS initialization was performed.

## Versioning and signing

Production remains version `1.2.1` with Android versionCode `10`. Neither value was incremented because this development build is not a Google Play release.

No signing credentials were viewed, changed, deleted, rotated, or generated. A later EAS build may require credentials for `com.polishwithme.app.dev`; any ambiguous credentials prompt must be stopped and reviewed without changing the credentials for `com.polishwithme.app`.

## RevenueCat limitation

The development package is not intended for real Google Play purchase testing. It differs from the production package registered with Google Play, so production Play billing products may be unavailable in the development application.

RevenueCat configuration and runtime behaviour were left unchanged. There is no local premium flag, fake CustomerInfo, entitlement bypass, or development Pro override. Access remains fail-closed and continues to depend on RevenueCat CustomerInfo and the active `pro` entitlement. The production Google Play build remains the authority for purchase and restore testing.

## Verification

Resolved configuration was checked with the existing local Expo CLI:

```powershell
$env:APP_VARIANT='development'
node node_modules/@expo/cli/build/bin/cli config --type public --json
Remove-Item Env:APP_VARIANT -ErrorAction SilentlyContinue
node node_modules/@expo/cli/build/bin/cli config --type public --json
```

Development resolved to:

- name `Polish with Me Dev`
- Android package `com.polishwithme.app.dev`
- scheme `mobile-dev`
- version `1.2.1`
- Android versionCode `10`
- Expo project ID `1ed9370f-1bcf-40e4-97d6-0597a36f8c76`

Default/production resolved to:

- name `Polish with Me`
- Android package `com.polishwithme.app`
- scheme `mobile`
- version `1.2.1`
- Android versionCode `10`
- Expo project ID `1ed9370f-1bcf-40e4-97d6-0597a36f8c76`

Regression verification:

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
- no EAS build was run

## Phase 2.3A file scope

Created:

- `artifacts/mobile/app.config.ts`
- `docs/phase_2_3a_development_build_isolation.md`

Modified:

- `artifacts/mobile/eas.json` — added only the development profile's `APP_VARIANT=development` marker

No dependency was added during Phase 2.3A. The prior intentional `expo-dev-client` package and lockfile changes were pre-existing inputs and were not changed by this phase. Other pre-existing Phase 1 and Phase 2 work, including the Phase 2.3 Home implementation, was preserved.

## Next build command

After review, run from `artifacts/mobile`:

```powershell
pnpm exec eas build --platform android --profile development
```

This command was not executed during Phase 2.3A.
