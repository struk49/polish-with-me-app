import { useRouter } from "expo-router";
import React from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";

const LAST_UPDATED = "September 26, 2026";
const APP_NAME = "Polish with Me";
const CONTACT_EMAIL = "podgeaisolutions@gmail.com";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
};

const P = ({ children }: { children: React.ReactNode }) => {
  const colors = useColors();
  return <Text style={[styles.paragraph, { color: colors.mutedForeground }]}>{children}</Text>;
};

const Bullet = ({ children }: { children: React.ReactNode }) => {
  const colors = useColors();
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletDot, { color: "#C8102E" }]}>•</Text>
      <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{children}</Text>
    </View>
  );
};

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const canGoBack = router.canGoBack();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {canGoBack && (
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + (Platform.OS === "web" ? 12 : 8),
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityHint="Returns to the previous screen"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons accessible={false} name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.foreground }]}>Privacy Policy</Text>
          <View accessible={false} style={styles.backBtn} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: canGoBack ? 20 : insets.top + (Platform.OS === "web" ? 56 : 20),
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!canGoBack && (
          <Text accessibilityRole="header" style={[styles.pageTitle, { color: colors.foreground }]}>Privacy Policy</Text>
        )}

        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          Last updated: {LAST_UPDATED}
        </Text>

        <Section title="1. Polish with Me and this policy">
          <P>
            {APP_NAME} does not require an account. This policy explains how local learning data,
            optional AI Tutor requests, purchases, technical diagnostics, and support requests are
            handled. The app does not use advertising or behavioural advertising analytics.
          </P>
        </Section>

        <Section title="2. Request deletion of your data">
          <P>
            Because {APP_NAME} has no user accounts, there is no account to delete. You can remove
            locally stored learning data with Reset Progress, by clearing the app's data, or by
            uninstalling the app. These actions also remove the locally stored AI installation
            identifier where applicable.
          </P>
          <P>
            After uninstalling the app, you can still request assistance with deletion of applicable
            remotely processed data by emailing {CONTACT_EMAIL}. State that your request concerns
            {APP_NAME} and identify the relevant service or activity, such as an AI Tutor request,
            purchase, or diagnostic event, together with an approximate date. Do not send passwords,
            payment-card details, AI conversation text, purchase receipts, or other unnecessary
            sensitive information.
          </P>
          <P>
            We will help where the data is technically identifiable and within our control. Some
            records are controlled by service providers or Google Play and may not be identifiable
            from the limited information available to us. We cannot promise deletion of information
            that cannot reasonably be located or that a provider must retain under its own legal
            obligations.
          </P>
        </Section>

        <Section title="3. Information stored on your device">
          <P>
            Lesson completion, quiz scores, XP, streak, known vocabulary, theme preference, and AI
            Tutor usage count are stored locally on your device. Ordinary lesson and vocabulary
            activity is not sent to the AI Tutor or OpenAI. A generated installation identifier is
            also stored locally and persists across app sessions until app data is cleared or the app
            is uninstalled.
          </P>
        </Section>

        <Section title="4. Optional AI Tutor and OpenAI processing">
          <P>
            Remote AI Tutor is optional. When you choose to use it, your learner-entered message,
            recent conversation context, selected learning level, and scenario are sent through the
            {APP_NAME} backend. The backend sends the relevant conversation content to OpenAI to
            generate a response. Do not include sensitive personal information in AI Tutor messages.
          </P>
          <P>
            When the app shows guided local practice because the remote tutor is not connected,
            scripted replies are generated on your device and the conversation is not sent to the
            AI Tutor API. We do not claim that remotely processed AI content is retained for no time;
            provider-controlled processing and retention are governed by the applicable provider
            terms and settings.
          </P>
        </Section>

        <Section title="5. Installation identifier and service protection">
          <P>
            The app creates a random installation identifier and stores it on your device. It is sent
            to the {APP_NAME} backend with remote AI Tutor requests and is used for quotas, rate
            limiting, concurrency protection, security, and abuse prevention. It is not an account
            identity, login credential, or advertising identifier.
          </P>
          <P>
            The backend also uses network and IP information for request limiting, security, service
            operation, and abuse prevention. We do not use the backend to intentionally derive your
            location from that information.
          </P>
        </Section>

        <Section title="6. Purchases, RevenueCat, and Google Play">
          <P>
            Google Play handles the purchase transaction and payment process. RevenueCat is used for
            Google Play purchase validation, Pro entitlement management, and Restore Purchases.
            RevenueCat may process an anonymous RevenueCat App User ID, device and app technical
            information, Google Play purchase token or receipt information, purchase history, and
            entitlement information. {APP_NAME} does not receive your payment-card details.
          </P>
        </Section>

        <Section title="7. Sentry error monitoring and diagnostics">
          <P>
            {APP_NAME} uses Sentry for crash reporting, error monitoring, diagnostics, and app-health
            monitoring. Sentry may process crash or error information, privacy-minimised and sanitized
            stack traces, app version and build information, and device, operating-system, runtime,
            and diagnostic information.
          </P>
          <P>
            The observability layer intentionally avoids supplying Sentry with learner AI messages,
            learning-progress contents, purchase receipts, application account identity, or arbitrary
            original error messages removed by the sanitizer. Sentry is used for reliability and
            error monitoring, not advertising or behavioural analytics.
          </P>
          <P>
            Sentry may process or display approximate geography derived from network or IP information
            during event handling. IP-address storage is disabled in the configured Sentry project,
            but this does not mean that an IP address is never processed in transit.
          </P>
        </Section>

        <Section title="8. Service providers">
          <Bullet><Text style={{ fontStyle: "italic" }}>OpenAI</Text> — generates optional remote AI Tutor responses.</Bullet>
          <Bullet><Text style={{ fontStyle: "italic" }}>Sentry</Text> — provides privacy-minimised crash and diagnostic monitoring.</Bullet>
          <Bullet><Text style={{ fontStyle: "italic" }}>RevenueCat</Text> — validates purchases and manages Pro entitlement.</Bullet>
          <Bullet><Text style={{ fontStyle: "italic" }}>Google Play</Text> — processes Android store transactions.</Bullet>
          <P>
            Provider-controlled processing, retention, deletion, and international transfers are
            governed by their applicable terms, policies, and configured service settings.
          </P>
        </Section>

        <Section title="9. Your choices">
          <Bullet>You can use lessons, quizzes, Practice, and Phrasebook without sending that learning activity to OpenAI.</Bullet>
          <Bullet>If you do not want AI Tutor messages processed by the backend and OpenAI, do not use the remote AI Tutor feature.</Bullet>
          <Bullet>Sending feedback is optional and opens your chosen email app. The email and information you choose to include are sent only after your action.</Bullet>
        </Section>

        <Section title="10. Data security, retention, and deletion">
          <P>
            Application-controlled remote communications use HTTPS/TLS where verified. Locally stored
            information remains until reset, app data is cleared, or the app is uninstalled. The
            backend processes AI requests and service-protection information but does not implement a
            permanent AI conversation database in the current application. OpenAI controls its own
            processing under applicable API terms and settings. Sentry retains diagnostic events
            according to the configured Sentry project settings. RevenueCat and Google Play retain
            purchase, entitlement, and transaction records under their applicable policies and legal
            obligations. We do not invent or promise a single retention period for those providers.
          </P>
        </Section>

        <Section title="11. Children's privacy">
          <P>
            {APP_NAME} is designed for general audiences. We do not knowingly collect personal
            information from children under 13. The app contains no advertising and requires no
            account creation.
          </P>
        </Section>

        <Section title="12. Contact and provider information">
          <P>
            For privacy questions or support, contact: {CONTACT_EMAIL}
          </P>
          <Bullet><Text accessibilityRole="link" onPress={() => void Linking.openURL("https://sentry.io/privacy/")}>Sentry Privacy Policy</Text></Bullet>
          <Bullet><Text accessibilityRole="link" onPress={() => void Linking.openURL("https://openai.com/policies/privacy-policy/")}>OpenAI Privacy Policy</Text></Bullet>
          <Bullet><Text accessibilityRole="link" onPress={() => void Linking.openURL("https://www.revenuecat.com/privacy/")}>RevenueCat Privacy Policy</Text></Bullet>
          <Bullet><Text accessibilityRole="link" onPress={() => void Linking.openURL("https://policies.google.com/privacy")}>Google Privacy Policy</Text></Bullet>
        </Section>

        <Text style={[styles.footer, { color: colors.mutedForeground, borderTopColor: colors.border }]}>
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, lineHeight: 23, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  container: { paddingHorizontal: 24 },
  pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 6 },
  meta: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 10 },
  paragraph: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 10 },
  bulletRow: { flexDirection: "row", marginBottom: 8, paddingRight: 8 },
  bulletDot: { fontSize: 16, marginRight: 8, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
