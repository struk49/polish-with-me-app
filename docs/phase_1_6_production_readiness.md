# Polish with Me — Phase 1.6 Production Readiness

Recorded: 15 September 2026 (Europe/London)

Android release-control gate updated: 23 September 2026 (Europe/London)

## Release identity

- Canonical repository: `polish-with-me-app-github`, branch `main`
- Baseline HEAD: `f466962e5b2106e65422715c767465ea9422ef1a`
- Android application ID: `com.polishwithme.app`
- iOS bundle identifier: `com.polishwithme.app`
- Version: `1.2.1`
- Android version code: `10`
- Expo/EAS project ID: `1ed9370f-1bcf-40e4-97d6-0597a36f8c76`

The version, version code, application IDs and Expo project ID were not
changed in this phase.

## RevenueCat architecture and authority

`SubscriptionProvider` starts inside the root Query Client and initializes
RevenueCat once. Development, web and Expo Go use the configured public test
SDK key; standalone Android and iOS use their respective public SDK keys.
Missing or failed configuration leaves purchases disabled and premium false.
Production SDK logging is INFO; development remains DEBUG.

RevenueCat `CustomerInfo.entitlements.active.pro` is the sole premium
authority. There is no persisted premium boolean, development unlock, paywall
dismissal unlock or other local override. Customer information comes from the
SDK, whose cache supports previously established offline entitlement state.
While the initial entitlement query is loading, protected direct routes render
a loading state rather than assuming access.

The entitlement identifier is `pro`. The paywall now deliberately selects the
`pro_unlock` product only from the `default` offering. Those dashboard objects
and their Play linkage must be confirmed externally.

## Purchase and restore flows

Purchase flow:

1. Load the `default` offering and locate `pro_unlock`.
2. Show the store-provided price and explicit confirmation.
3. Call RevenueCat `purchasePackage` once while the mutation is pending.
4. Put returned `CustomerInfo` into the shared query cache.
5. Close the paywall only when the returned information contains active
   entitlement `pro`.

Cancellation leaves the paywall open without an alarming alert. Other failures
show a generic understandable error and never grant access. A transaction that
does not activate `pro` shows a specific recovery message and remains locked.

Restore is initiated only by the user's Restore button. Returned
`CustomerInfo` becomes authoritative immediately. The paywall closes only when
`pro` is active; no-entitlement and error outcomes remain locked and explain
the result.

Because this is an anonymous, one-time purchase product on
`react-native-purchases` 10.x, the RevenueCat product must be configured as a
non-consumable. RevenueCat documents restoration limitations for consumed
one-time products with Google Billing Client 8. Confirm the dashboard product
type and anonymous-user restore/transfer policy before release testing.

## Premium gating inventory

The current product rule is A1 free; A2, B1 and B2 curriculum content requires
the RevenueCat `pro` entitlement.

- Home curriculum cards: paid lessons route to the paywall.
- Lesson direct routes/deep links: paid levels now wait for entitlement and
  redirect to the paywall when inactive.
- Quiz direct routes/deep links: the same paid-level guard applies.
- Practice: its lesson picker includes only A1 unless `pro` is active.
- Paywall and settings/progress entry points: do not grant access themselves.
- Phrasebook: not gated in current source and therefore remains free.
- AI Tutor: available to free and Pro users; the client permits 3 versus 15
  replies per day respectively.

Paid lesson data remains bundled in the client, as is normal for this current
offline architecture; RevenueCat controls application access, not encryption
of packaged curriculum assets.

## AI Tutor and entitlement

AI Tutor is not a Pro-only feature. RevenueCat affects only its client-side
daily allowance (free 3, Pro 15). The backend has no RevenueCat authentication
or entitlement proof and cannot distinguish free from Pro callers. A caller
can bypass the mobile UI and call the public endpoint directly, subject to the
Phase 1.5 IP, installation, global quota and concurrency controls.

The Phase 1.5 installation ID is explicitly not entitlement evidence. Secure
server-side Pro enforcement would require a separately approved RevenueCat
server/API or webhook design plus trustworthy app identity; none was added.

## Google Play and Android configuration

- Expo SDK 54 / React Native 0.81.5 / React 19.1
- Android 7+ (minimum API 24 from the SDK baseline)
- Compile SDK 36 and target SDK 36 from Expo SDK 54
- Package ID `com.polishwithme.app`
- Version `1.2.1`, version code `10`
- New Architecture enabled
- Portrait orientation
- Custom adaptive foreground icon and red background
- Custom cover splash image and red background
- URL scheme `mobile`; no explicit Android intent-filter/deep-link hosts
- Runtime version follows app version
- Expo Updates is configured but disabled
- Production EAS environment/channel `production`
- Production Android build type `app-bundle`
- App version source is local
- Signing is EAS-managed by structure; no local signing credential is present

The icon, adaptive icon and splash source files exist. No AAB was built.

## Android production version gate

Google Play evidence confirms that production version `1.2.1` with Android
version code `10` is published for `com.polishwithme.app`. Version code `10` is
therefore consumed and must never be reused for another Google Play upload.
Every future Google Play Android release must use a version code higher than
the previously uploaded release; the next production release must use a
version code greater than `10`.

Do not increment or reserve a version code during ordinary development. Select
and apply the exact next value only during an authorized production
release-candidate preparation task.

The production release-candidate gate is:

1. Before building, confirm the intended production version and version code,
   and confirm that the version code is greater than `10` and greater than all
   previously uploaded Android releases.
2. Build the production AAB only after that identity is approved.
3. After building and before upload, inspect the generated AAB and confirm its
   package is `com.polishwithme.app`, its `versionName` is the intended
   production version, and its `versionCode` is the approved new value. Do not
   upload an AAB that still reports version code `10`.
4. As the deferred P28-007 final-artifact check, confirm the generated target
   SDK is at least 36, inspect the final merged release manifest, confirm
   `SYSTEM_ALERT_WINDOW` is absent, and review the complete final permission
   list before Play upload.
5. For the current text-only AI Tutor release, confirm `RECORD_AUDIO` is absent
   from the final merged release manifest. If AI Tutor Voice Mode is deliberately
   implemented and authorized in a future release, `RECORD_AUDIO` may be
   deliberately reintroduced only after contextual runtime-permission handling,
   Privacy Policy review, Play Data Safety and policy review, real-device
   testing, and final merged-manifest verification.

## Android permission inventory

- `INTERNET`: required for RevenueCat and AI backend traffic. Normal network
  permission; no runtime prompt.
- `ACCESS_NETWORK_STATE`: used by network/image/update libraries for
  connectivity handling. Low sensitivity; no runtime prompt.
- `VIBRATE`: justified by explicit haptic feedback throughout lessons,
  practice, quiz and AI Tutor. Low sensitivity; no runtime prompt.
- `SYSTEM_ALERT_WINDOW`: present only in React Native's debug manifest and not
  a production-release permission.
- Camera, coarse/fine location and legacy read/write external storage were
  contributed by installed but unused packages. Source contains no import or
  runtime request for those capabilities, so they are now explicitly listed in
  `android.blockedPermissions` and must not enter the merged release manifest.

No microphone or recording permission is requested. Text-to-speech uses the
device's configured speech engine and does not require an app microphone.

## Technical privacy and data-flow inventory

- AI conversation text: sent to the configured Polish with Me backend, then to
  OpenAI, solely to generate the tutor reply. It is transient in application
  handling and intentionally excluded from route logs. Disclosure is already
  present; compare exact production handling with Play Data Safety answers.
- AI installation ID: random, non-secret and stored in AsyncStorage; sent to
  the backend for abuse-control bucketing. It persists until app data is
  cleared/uninstalled. The current privacy text predates this explicit item and
  should be reviewed against Play disclosure requirements before release.
- RevenueCat anonymous App User ID, device/app metadata, store receipt and
  purchase information: sent to RevenueCat for product loading and entitlement
  verification, with store transaction processing by Google Play. RevenueCat
  persists its customer/purchase records. No payment-card data enters this app.
- Learning progress, XP, known words and AI usage count: stored locally in
  AsyncStorage; no app-server transmission found.
- Feedback email: only transmitted through the user's chosen mail application
  after explicit action; the template includes user-entered feedback and asks
  for Android device context.
- Speech text: passed to the configured operating-system TTS engine; whether
  that engine uses a network service is controlled outside this application.
- Crash/analytics data: no analytics or crash-reporting SDK or transmission was
  found. Runtime errors may be written to local development/device console.
- Expo Updates: remote update URL exists in configuration, but updates are
  disabled.

This is a technical inventory, not a legal determination.

## AI production configuration

- `OPENAI_API_KEY`: required secret; no safe default.
- `OPENAI_MODEL`: optional; safe default `gpt-5-mini`.
- `AI_TUTOR_ALLOWED_ORIGINS`: production-specific exact browser origins;
  optional for native-only access, whose requests have no Origin header.
- `AI_TUTOR_RATE_WINDOW_MS`: optional positive integer, default `60000`.
- `AI_TUTOR_RATE_MAX`: optional positive integer, default `10`.
- `AI_TUTOR_INSTALL_DAILY_MAX`: optional positive integer, default `15`.
- `AI_TUTOR_GLOBAL_DAILY_MAX`: optional positive integer, default `500`.
- `AI_TUTOR_MAX_CONCURRENT`: optional positive integer, default `10`.
- `AI_TUTOR_OPENAI_TIMEOUT_MS`: optional positive integer, default `20000`.

`EXPO_PUBLIC_AI_TUTOR_API_URL` (or Expo extra `aiTutorApiUrl`) is required in
the production mobile build to use the remote tutor; otherwise guided local
practice remains available. No environment values were changed.

## Render readiness

The repository pins Node `24.21.0` in `.node-version` and pnpm `11.27.0` in
`packageManager`. Render installs with `--frozen-lockfile`, builds only the API
server, starts its generated output, and probes `/api/healthz`.

The remaining ambiguity is whether the Render runtime automatically activates
the exact `packageManager` pnpm version before executing the bare `pnpm` build
command. Confirm Node and pnpm versions in an authorized non-production build
log. If pnpm is missing or different, separately authorize the smallest
deployment-specific activation change. No deployment configuration changed.

## Secrets audit

No tracked `.env`, keystore, signing file, private key or service credential
file was found. A filename-only scan found no tracked high-confidence OpenAI,
Google, GitHub, AWS or private-key signature. Public RevenueCat SDK key values
are supplied through Expo environment variables and no value is documented
here. No rotation action is indicated by repository evidence.

## Finding classification

- **BLOCKER:** none remaining at repository level after the direct-route and
  entitlement-confirmation fixes.
- **HIGH / external release gate:** RevenueCat Android app/product/offering/
  entitlement linkage, product type and EAS signing state remain unverified
  outside the repository. Version code `10` is confirmed consumed; the Android
  production version gate above controls the next release candidate.
- **MEDIUM:** AI quotas are process-local; the backend cannot verify RevenueCat
  entitlement; Render pnpm activation is not deployment-proven; the AI
  installation ID disclosure needs policy/Data Safety comparison.
- **LOW:** unused location/image-picker packages remain installed even though
  their sensitive permissions are now blocked; broader workspace typecheck has
  the pre-existing mockup-sandbox React type conflict.

## Verification

- Phase 1.3 correctness tests: 12 passed, 0 failed.
- Phase 1.5 security tests: 11 passed, 0 failed.
- Phase 1.6 premium tests: 5 passed, 0 failed.
- Mobile TypeScript: passed.
- Library prerequisite: passed.
- API TypeScript: passed.
- `git diff --check`: passed.
- Lockfile SHA-256 remained
  `D8459A0260A3EA9D754B9527DBBA99CD11B8D3EDCF1999B63AB57DC77A7130A8`.

## External verification checklist

### Google Play Console

- Treat version code `10` as consumed and never reuse it. During authorized
  production release-candidate preparation, select a version code greater than
  `10` and greater than every previously uploaded release; do not reserve or
  guess that exact value during ordinary development.
- Before building, verify the intended production version and version code.
- Before Play upload, inspect the generated AAB and verify package
  `com.polishwithme.app`, the intended `versionName`, and the approved new
  `versionCode`. Do not upload if the AAB still reports version code `10`.
- Complete the deferred P28-007 final-artifact checks: verify target SDK 36 or
  higher, inspect the final merged release manifest, confirm
  `SYSTEM_ALERT_WINDOW` is absent, and review the complete permission list.
- For the current text-only release, confirm `RECORD_AUDIO` is absent. A future
  authorized AI Tutor Voice Mode may reintroduce it only after contextual
  runtime-permission handling, Privacy Policy review, Play Data Safety and
  policy review, real-device testing, and final merged-manifest verification.
- Confirm `pro_unlock` exists for `com.polishwithme.app`, is active, and is a
  non-consumable one-time product.
- Compare the final merged release permissions and technical data-flow
  inventory with the Data Safety declaration.

### EAS / Expo

- Confirm project ownership for `1ed9370f-1bcf-40e4-97d6-0597a36f8c76`.
- Confirm production Android signing credentials belong to
  `com.polishwithme.app`.
- Confirm the production RevenueCat Android public key and AI backend URL are
  present in the production build environment without exposing their values.

### RevenueCat

- Confirm Android app mapping to `com.polishwithme.app` and its Play service
  credentials.
- Confirm product `pro_unlock`, offering `default`, and entitlement `pro` are
  active and linked to each other.
- Confirm `pro_unlock` is non-consumable and test anonymous-user restore and
  transfer behavior on a licensed Play tester account.
- Verify purchase, cancellation, failed purchase, reinstall/restore, and
  no-entitlement restore on an internal-test build.

### Render

- Confirm all required production variables are set without disclosing them.
- In a later authorized non-production build, confirm Node `24.21.0`, pnpm
  `11.27.0`, successful frozen install/build/start and the health endpoint.
- Exercise Phase 1.5 rejection paths before claiming live rate/quota behavior.
