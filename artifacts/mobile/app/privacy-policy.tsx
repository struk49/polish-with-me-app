import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";

const LAST_UPDATED = "August 8, 2026";
const APP_NAME = "Polish with Me";
const CONTACT_EMAIL = "podgeaisolutions@gmail.com";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
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
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy Policy</Text>
          <View style={styles.backBtn} />
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
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Privacy Policy</Text>
        )}

        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          Last updated: {LAST_UPDATED}
        </Text>

        <P>
          {APP_NAME} ("we", "our", or "us") is committed to protecting your privacy. This policy
          explains what information we collect, how we use it, and your rights.
        </P>

        <Section title="1. Information We Collect">
          <P>We collect the following types of information:</P>
          <Bullet>
            <Text style={{ fontStyle: "italic" }}>Usage data:</Text> Which lessons you have
            completed and vocabulary progress, stored locally on your device using AsyncStorage.
            This data never leaves your device unless you clear app data.
          </Bullet>
          <Bullet>
            <Text style={{ fontStyle: "italic" }}>Purchase information:</Text> If you purchase the
            Pro upgrade, your transaction is processed by Google Play or Apple App Store. We use
            RevenueCat to verify and manage entitlements. RevenueCat may collect a device
            identifier and purchase receipt. See RevenueCat's privacy policy at
            revenuecat.com/privacy.
          </Bullet>
          <Bullet>
            <Text style={{ fontStyle: "italic" }}>AI conversation messages:</Text> If you use the
            AI Tutor feature, the text you type may be sent securely to our server and to OpenAI
            to generate a learning response. Do not enter sensitive personal information into AI
            conversations.
          </Bullet>
          <Bullet>
            <Text style={{ fontStyle: "italic" }}>No account required:</Text> We do not require you
            to create an account, and we do not collect your name, email address, or any personally
            identifiable information directly.
          </Bullet>
        </Section>

        <Section title="2. How We Use Your Information">
          <P>We use the information solely to:</P>
          <Bullet>Save your learning progress locally on your device</Bullet>
          <Bullet>Verify your purchase and unlock premium curriculum content</Bullet>
          <Bullet>Provide AI conversation practice and language-learning corrections</Bullet>
          <Bullet>Provide customer support if you contact us</Bullet>
        </Section>

        <Section title="3. Data Storage and Security">
          <P>
            Your lesson progress and XP are stored locally on your device using React Native's
            AsyncStorage. We do not store your progress on any server. If you uninstall the app,
            this data is deleted.
          </P>
          <P>
            Purchase verification data is handled securely by RevenueCat and your device's app
            store. We do not store payment card details.
          </P>
          <P>
            AI conversation messages are processed to provide the AI Tutor response. We do not use
            AI conversations for advertising.
          </P>
        </Section>

        <Section title="4. Third-Party Services">
          <P>The app uses the following third-party services:</P>
          <Bullet>
            <Text style={{ fontStyle: "italic" }}>RevenueCat</Text> — in-app purchase management.
            Privacy policy: revenuecat.com/privacy
          </Bullet>
          <Bullet>
            <Text style={{ fontStyle: "italic" }}>Google Play / Apple App Store</Text> — payment
            processing. Subject to their respective privacy policies.
          </Bullet>
          <Bullet>
            <Text style={{ fontStyle: "italic" }}>OpenAI</Text> — AI Tutor text conversation
            responses. Subject to OpenAI's API data handling policies.
          </Bullet>
          <P>
            We do not use advertising SDKs, analytics platforms, or tracking technologies.
          </P>
        </Section>

        <Section title="5. Children's Privacy">
          <P>
            {APP_NAME} is designed for general audiences. We do not knowingly collect personal
            information from children under 13. The app contains no advertising and requires no
            account creation.
          </P>
        </Section>

        <Section title="6. Your Rights">
          <P>You have the right to:</P>
          <Bullet>Delete your local progress by uninstalling the app or clearing app data</Bullet>
          <Bullet>
            Request deletion of any purchase-related data held by RevenueCat by contacting us
          </Bullet>
          <Bullet>
            Opt out of any data processing by not making a purchase (free content requires no data
            sharing)
          </Bullet>
        </Section>

        <Section title="7. Changes to This Policy">
          <P>
            We may update this policy occasionally. The updated date at the top of this page will
            reflect any changes. Continued use of the app after changes constitutes acceptance of
            the updated policy.
          </P>
        </Section>

        <Section title="8. Contact Us">
          <P>
            If you have questions about this privacy policy or wish to exercise your data rights,
            contact us at: {CONTACT_EMAIL}
          </P>
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
  backBtn: { width: 36 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
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
