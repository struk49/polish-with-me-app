export const privacyPolicyHtml = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Privacy Policy and Data Deletion — Polish with Me</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #1c1c1e; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; }
    main { max-width: 760px; margin: 0 auto; padding: 48px 24px 64px; }
    h1 { font-size: 30px; margin: 0 0 6px; }
    h2 { font-size: 20px; margin: 32px 0 10px; }
    p, li { font-size: 16px; color: #3a3a3c; }
    .meta { color: #6b6b70; margin-top: 0; }
    .deletion { border: 2px solid #c8102e; border-radius: 12px; padding: 20px; margin: 28px 0; background: #fff8f8; }
    .deletion h2 { margin-top: 0; color: #8f0b20; }
    a { color: #a50d24; }
    footer { margin-top: 40px; padding-top: 18px; border-top: 1px solid #ddd; color: #6b6b70; }
  </style>
</head>
<body>
<main>
  <h1>Polish with Me Privacy Policy</h1>
  <p class="meta">Last updated: September 26, 2026</p>
  <p>Polish with Me does not require an account. This policy explains how local learning data, optional AI Tutor requests, purchases, technical diagnostics, and support requests are handled. Polish with Me does not use advertising or behavioural advertising analytics.</p>

  <section class="deletion" id="request-deletion">
    <h2>Request deletion of your data</h2>
    <p>Polish with Me has no user accounts, so there is no account to delete. Local learning data can be removed with Reset Progress, by clearing the app's data, or by uninstalling the app. These actions also remove the locally stored AI installation identifier where applicable.</p>
    <p>You can request assistance with deletion of applicable remotely processed data even after uninstalling the app. Email <a href="mailto:podgeaisolutions@gmail.com">podgeaisolutions@gmail.com</a>, state that your request concerns Polish with Me, and identify the relevant service or activity—such as an AI Tutor request, purchase, or diagnostic event—together with an approximate date.</p>
    <p>Do not send passwords, payment-card details, AI conversation text, purchase receipts, or unnecessary sensitive information. We will help where data is technically identifiable and within our control. Some provider or Google Play records may not be identifiable from the limited information available to us, or may need to be retained under provider or legal obligations.</p>
  </section>

  <h2>Local learning data</h2>
  <p>Lesson completion, quiz scores, XP, streak, known vocabulary, theme preference, and AI Tutor usage count are stored locally on your device. Ordinary lesson and vocabulary activity is not sent to OpenAI. A generated AI installation identifier is stored locally and persists until app data is cleared or the app is uninstalled.</p>

  <h2>Optional AI Tutor and OpenAI</h2>
  <p>When you choose to use remote AI Tutor, your learner-entered message, recent conversation context, selected learning level, and scenario are sent through the Polish with Me backend. The backend sends relevant conversation content to OpenAI to generate a response. Do not include sensitive personal information in AI Tutor messages.</p>
  <p>Local guided practice is generated on your device and is not sent to the AI Tutor API. Polish with Me does not claim that remotely processed AI content has zero retention; provider-controlled processing and retention are governed by applicable terms and settings. See <a href="https://openai.com/policies/privacy-policy/">OpenAI's Privacy Policy</a>.</p>

  <h2>Installation identifier and network information</h2>
  <p>The app creates a random installation identifier and sends it to the Polish with Me backend with remote AI Tutor requests. It is used for quotas, rate limiting, concurrency protection, security, and abuse prevention. It is not an account identity, login credential, or advertising identifier.</p>
  <p>The backend also processes network and IP information for rate limiting, security, service operation, and abuse prevention. The backend does not intentionally derive your location from that information.</p>

  <h2>Sentry crash reporting and diagnostics</h2>
  <p>Polish with Me uses Sentry for crash reporting, error monitoring, diagnostics, and app-health monitoring. Sentry may process crash or error information, privacy-minimised and sanitized stack traces, app version and build information, and device, operating-system, runtime, and diagnostic information.</p>
  <p>The observability layer intentionally avoids supplying Sentry with learner AI messages, learning-progress contents, purchase receipts, application account identity, or arbitrary original error messages removed by the sanitizer. Sentry is used for reliability and error monitoring, not advertising or behavioural analytics.</p>
  <p>Sentry may process or display approximate geography derived from network or IP information. IP-address storage is disabled in the configured Sentry project, but this does not mean that an IP address is never processed in transit. See <a href="https://sentry.io/privacy/">Sentry's Privacy Policy</a>.</p>

  <h2>RevenueCat and Google Play purchases</h2>
  <p>Google Play handles the purchase transaction and payment process. RevenueCat is used for Google Play purchase validation, Pro entitlement management, and Restore Purchases. RevenueCat may process an anonymous RevenueCat App User ID, device and app technical information, Google Play purchase token or receipt information, purchase history, and entitlement information. Polish with Me does not receive payment-card details.</p>
  <p>See <a href="https://www.revenuecat.com/privacy/">RevenueCat's Privacy Policy</a> and <a href="https://policies.google.com/privacy">Google's Privacy Policy</a>.</p>

  <h2>Security, retention, and provider processing</h2>
  <p>Application-controlled remote communications use HTTPS/TLS where verified. The current backend does not implement a permanent AI conversation database. OpenAI controls its processing under applicable API terms and settings. Sentry retains diagnostic events according to configured project settings. RevenueCat and Google Play retain purchase, entitlement, and transaction records under their applicable policies and legal obligations. These providers may process information internationally under their applicable terms.</p>

  <h2>Your choices and contact</h2>
  <ul>
    <li>Use lessons, quizzes, Practice, and Phrasebook without sending that learning activity to OpenAI.</li>
    <li>Do not use remote AI Tutor if you do not want messages processed by the backend and OpenAI.</li>
    <li>Reset local progress, clear app data, or uninstall the app to remove locally stored information.</li>
  </ul>
  <p>For privacy questions, deletion assistance, or support, email <a href="mailto:podgeaisolutions@gmail.com">podgeaisolutions@gmail.com</a>.</p>

  <h2>Children's privacy</h2>
  <p>Polish with Me is designed for general audiences. We do not knowingly collect personal information from children under 13. The app contains no advertising and requires no account creation.</p>

  <footer>© 2026 Polish with Me. All rights reserved.</footer>
</main>
</body>
</html>`;
