# P28-010B core observability

This phase adds a privacy-minimised, error-only mobile reporting boundary and bounded API operational events. It does not add analytics, tracing, profiling, replay, user identity, learner content, request/response bodies, installation IDs, RevenueCat objects, receipts, or payment data.

Mobile reporting is disabled when `EXPO_PUBLIC_SENTRY_DSN` is absent and must never affect application behavior. A later release-verification phase must configure the real Sentry project and DSN, configure source-map upload credentials securely in the build environment, rebuild the native development/production clients, and verify native crash and symbolication behavior. `SENTRY_AUTH_TOKEN` must not be committed or exposed to the app bundle.

Before any Sentry-enabled production release, complete a payload inspection using the actual production configuration, update the Privacy Policy as appropriate, and review Google Play Data Safety. That review must document the provider and diagnostic purpose, the device/app context actually transmitted, and confirm that learner messages, transcripts/audio, installation IDs, RevenueCat/customer/payment data, storage contents, request bodies, and response bodies remain excluded.
