import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { designRadii, designSpacing } from "@/constants/designSystem";
import { useDesignTokens } from "@/hooks/useDesignTokens";
import {
  AI_LEVELS,
  AI_SCENARIOS,
  askAiTutor,
  getAiDailyLimit,
  getAiUsage,
  incrementAiUsage,
  type AiLevel,
  type AiScenario,
  type AiTutorMessage,
} from "@/lib/aiTutor";
import { useSubscription } from "@/lib/revenuecat";

function getAiEndpoint() {
  const fromEnv = process.env.EXPO_PUBLIC_AI_TUTOR_API_URL;
  if (fromEnv) return normalizeAiEndpoint(fromEnv);

  const extra = Constants.expoConfig?.extra as { aiTutorApiUrl?: string } | undefined;
  return extra?.aiTutorApiUrl ? normalizeAiEndpoint(extra.aiTutorApiUrl) : undefined;
}

function normalizeAiEndpoint(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) return undefined;
  return trimmed.endsWith("/api/ai-tutor") ? trimmed : `${trimmed}/api/ai-tutor`;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function AssistantMessage({
  message,
  isFallback,
}: {
  message: AiTutorMessage;
  isFallback?: boolean;
}) {
  const { colors } = useDesignTokens();
  const isUser = message.role === "user";

  return (
    <View
      style={[
        styles.messageRow,
        { justifyContent: isUser ? "flex-end" : "flex-start" },
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: isUser ? colors.brandSoft : colors.surfacePrimary,
            borderColor: isUser ? colors.brandPrimary : colors.borderDefault,
          },
        ]}
      >
        <View style={styles.messageMeta}>
          <Ionicons
            name={isUser ? "person-outline" : "school-outline"}
            size={14}
            color={isUser ? colors.brandPrimary : colors.textSecondary}
          />
          <Text style={[styles.messageMetaText, { color: isUser ? colors.brandPrimary : colors.textSecondary }]}>
            {isUser ? "You" : isFallback ? "Practice coach" : "Polish tutor"}
          </Text>
        </View>
        <Text
          style={[
            styles.messageText,
            { color: colors.textPrimary },
          ]}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}

export default function AiTutorScreen() {
  const { colors } = useDesignTokens();
  const insets = useSafeAreaInsets();
  const { isPremium } = useSubscription();
  const listRef = useRef<FlatList<AiTutorMessage>>(null);
  const [level, setLevel] = useState<AiLevel>("A1");
  const [scenario, setScenario] = useState<AiScenario>(AI_SCENARIOS[0]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiTutorMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Choose a level and scenario, then write a short Polish sentence. I’ll help you practise and improve it.",
    },
  ]);
  const [usage, setUsage] = useState(0);
  const [sending, setSending] = useState(false);
  const [lastSource, setLastSource] = useState<"remote" | "local">("local");

  const endpoint = getAiEndpoint();
  const dailyLimit = getAiDailyLimit(isPremium);
  const remaining = Math.max(dailyLimit - usage, 0);

  useEffect(() => {
    getAiUsage().then(setUsage).catch(() => setUsage(0));
  }, []);

  useEffect(() => {
    setMessages([
      {
        id: makeId("scenario"),
        role: "assistant",
        text: `${scenario.opener}\n\n${scenario.starterReply}`,
      },
    ]);
  }, [scenario.id]);

  const selectedLevel = useMemo(
    () => AI_LEVELS.find((item) => item.id === level) ?? AI_LEVELS[0],
    [level],
  );

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    if (remaining <= 0) {
      Alert.alert(
        "Daily AI limit reached",
        isPremium
          ? "You have used today’s AI practice replies. Please try again tomorrow."
          : "Free users get 3 AI practice replies per day. Pro users get a larger preview limit.",
      );
      return;
    }

    await Haptics.selectionAsync();

    const userMessage: AiTutorMessage = {
      id: makeId("user"),
      role: "user",
      text: trimmed,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const result = await askAiTutor({
        endpoint,
        level,
        scenario,
        messages: nextMessages,
      });

      setLastSource(result.source);
      setMessages((current) => [
        ...current,
        {
          id: makeId("assistant"),
          role: "assistant",
          text: result.text,
        },
      ]);
      const nextUsage = await incrementAiUsage();
      setUsage(nextUsage);
    } catch {
      setLastSource("local");
      setMessages((current) => [
        ...current,
        {
          id: makeId("fallback"),
          role: "assistant",
          text: "I couldn’t reach the AI tutor server, but you can still practise. Try one short Polish sentence and check the lesson vocabulary if you get stuck.",
        },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const resetConversation = () => {
    Haptics.selectionAsync();
    setMessages([
      {
        id: makeId("reset"),
        role: "assistant",
        text: `${scenario.opener}\n\n${scenario.starterReply}`,
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.backgroundPrimary }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.topArea}
        contentContainerStyle={[
          styles.topContent,
          { paddingTop: Platform.OS === "web" ? 83 : designSpacing.card },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.kicker, { color: colors.textMuted }]}>Focused conversation practice</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>AI Tutor</Text>
          </View>
          <View
            style={[styles.limitBadge, { backgroundColor: remaining === 0 ? colors.warningSoft : colors.brandSoft }]}
            accessible
            accessibilityLabel={`${remaining} of ${dailyLimit} AI tutor replies remaining today`}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={remaining === 0 ? colors.warning : colors.brandPrimary} />
            <Text style={[styles.limitText, { color: remaining === 0 ? colors.warning : colors.brandPrimary }]}>
              {remaining}/{dailyLimit} today
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderDefault }]}>
          <Ionicons name="school-outline" size={20} color={colors.brandPrimary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Type a short answer. The tutor replies in Polish with a simple English explanation.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Choose your level</Text>
        <View style={styles.levelRow}>
          {AI_LEVELS.map((item) => {
            const active = item.id === level;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.label} level, ${item.description}`}
                accessibilityHint="Sets the AI Tutor conversation level"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.levelChip,
                  {
                    backgroundColor: active ? colors.brandSoft : pressed ? colors.surfaceSecondary : colors.surfacePrimary,
                    borderColor: active ? colors.brandPrimary : colors.borderDefault,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  setLevel(item.id);
                  Haptics.selectionAsync();
                }}
              >
                <Text
                  style={[
                    styles.levelChipText,
                    { color: active ? colors.brandPrimary : colors.textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.levelHelp, { color: colors.textMuted }]}>
          {selectedLevel.description}
        </Text>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>What would you like to practise?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scenarioList}>
          {AI_SCENARIOS.map((item) => {
            const active = item.id === scenario.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${item.description}`}
                accessibilityHint="Starts this conversation scenario"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.scenarioCard,
                  {
                    backgroundColor: active ? colors.brandSoft : pressed ? colors.surfaceSecondary : colors.surfacePrimary,
                    borderColor: active ? colors.brandPrimary : colors.borderDefault,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  setScenario(item);
                  Haptics.selectionAsync();
                }}
              >
                <View style={styles.scenarioTitleRow}>
                  {active ? <Ionicons name="checkmark-circle" size={17} color={colors.brandPrimary} /> : null}
                  <Text style={[styles.scenarioTitle, { color: active ? colors.brandPrimary : colors.textPrimary }]}>{item.title}</Text>
                </View>
                <Text style={[styles.scenarioDesc, { color: colors.textMuted }]}>
                  {item.description}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </ScrollView>

      <View style={[styles.chatArea, { borderTopColor: colors.borderDefault }]}>
        <View style={styles.chatHeader}>
          <View style={styles.chatHeadingCopy}>
            <Text style={[styles.chatEyebrow, { color: colors.textMuted }]}>Your conversation</Text>
            <Text style={[styles.chatTitle, { color: colors.textPrimary }]}>{scenario.title}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset conversation"
            accessibilityHint={`Starts ${scenario.title} again`}
            onPress={resetConversation}
            style={({ pressed }) => [styles.resetButton, { backgroundColor: pressed ? colors.brandSoft : colors.surfacePrimary, borderColor: colors.borderDefault }]}
          >
            <Ionicons name="refresh-outline" size={17} color={colors.brandPrimary} />
            <Text style={[styles.resetText, { color: colors.brandPrimary }]}>Reset</Text>
          </Pressable>
        </View>
        {!endpoint && (
          <View style={[styles.modeNotice, { backgroundColor: colors.backgroundSecondary }]} accessible accessibilityLabel="Using guided practice mode">
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.offlineText, { color: colors.textMuted }]}>Using guided practice while the AI tutor is not connected.</Text>
          </View>
        )}
        {endpoint && lastSource === "local" ? (
          <View style={[styles.modeNotice, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.offlineText, { color: colors.textMuted }]}>Guided practice is available if the tutor cannot connect.</Text>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AssistantMessage message={item} isFallback={!endpoint || lastSource === "local"} />
          )}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={sending ? (
            <View style={[styles.thinkingRow, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderDefault }]} accessibilityRole="text" accessibilityLiveRegion="polite">
              <ActivityIndicator size="small" color={colors.brandPrimary} />
              <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>Your tutor is thinking…</Text>
            </View>
          ) : null}
        />

        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.surfacePrimary,
              borderColor: colors.borderDefault,
              marginBottom: Platform.OS === "web" ? 100 : insets.bottom + 84,
            },
          ]}
        >
          <TextInput
            accessibilityLabel="Message to your Polish tutor"
            accessibilityHint="Write a short Polish sentence"
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Write your answer..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
            maxLength={500}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={sending ? "Sending message" : "Send message"}
            accessibilityHint="Sends your answer to the Polish tutor"
            accessibilityState={{ disabled: sending || !input.trim(), busy: sending }}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: sending || !input.trim() ? colors.backgroundSecondary : pressed ? colors.brandPressed : colors.brandPrimary,
                opacity: pressed || sending || !input.trim() ? 0.65 : 1,
              },
            ]}
            disabled={sending || !input.trim()}
            onPress={sendMessage}
          >
            <Ionicons
              name={sending ? "hourglass-outline" : "send"}
              size={20}
              color={sending || !input.trim() ? colors.textMuted : colors.textInverse}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topArea: { flex: 1, minHeight: 0 },
  topContent: { paddingHorizontal: designSpacing.gutter, paddingBottom: designSpacing.section },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: designSpacing.element,
    marginBottom: designSpacing.compact,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  kicker: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  limitBadge: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: designSpacing.element, borderRadius: designRadii.pill },
  limitText: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_700Bold" },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: designSpacing.compact, padding: designSpacing.compact, borderRadius: designRadii.control, borderWidth: 1, marginBottom: designSpacing.compact },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  sectionLabel: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_600SemiBold", marginBottom: designSpacing.compact },
  levelRow: { flexDirection: "row", gap: designSpacing.compact, marginBottom: 4 },
  levelChip: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: designRadii.control, borderWidth: 1 },
  levelChipText: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_700Bold" },
  levelHelp: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular", marginBottom: designSpacing.compact },
  scenarioList: { gap: designSpacing.compact, paddingRight: designSpacing.gutter },
  scenarioCard: { width: 172, borderWidth: 1, borderRadius: designRadii.card, padding: designSpacing.compact, gap: 4 },
  scenarioTitleRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  scenarioTitle: { flexShrink: 1, fontSize: 14, lineHeight: 20, fontFamily: "Inter_700Bold" },
  scenarioDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  chatArea: { flex: 1, minHeight: 0, borderTopWidth: 1, paddingTop: designSpacing.compact },
  chatHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: designSpacing.element, paddingHorizontal: designSpacing.gutter, marginBottom: designSpacing.compact },
  chatHeadingCopy: { flex: 1, minWidth: 0 },
  chatEyebrow: { fontSize: 11, lineHeight: 16, fontFamily: "Inter_500Medium" },
  chatTitle: { fontSize: 18, lineHeight: 24, fontFamily: "Inter_700Bold" },
  resetButton: { minHeight: 48, paddingHorizontal: designSpacing.element, borderRadius: designRadii.control, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 5 },
  resetText: { fontSize: 13, lineHeight: 18, fontFamily: "Inter_600SemiBold" },
  modeNotice: { minHeight: 36, marginHorizontal: designSpacing.gutter, marginBottom: designSpacing.compact, paddingHorizontal: designSpacing.element, borderRadius: designRadii.small, flexDirection: "row", alignItems: "center", gap: 6 },
  offlineText: { flex: 1, fontSize: 11, lineHeight: 16, fontFamily: "Inter_400Regular" },
  messages: { paddingHorizontal: designSpacing.gutter, paddingTop: 4, paddingBottom: designSpacing.element, gap: designSpacing.compact },
  messageRow: { flexDirection: "row" },
  messageBubble: { maxWidth: "92%", borderRadius: designRadii.card, borderWidth: 1, padding: designSpacing.element, gap: 6 },
  messageMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  messageMetaText: { fontSize: 11, lineHeight: 16, fontFamily: "Inter_600SemiBold" },
  messageText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  thinkingRow: { alignSelf: "flex-start", minHeight: 44, borderRadius: designRadii.card, borderWidth: 1, paddingHorizontal: designSpacing.element, flexDirection: "row", alignItems: "center", gap: designSpacing.compact },
  thinkingText: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_500Medium" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: designSpacing.compact, marginHorizontal: designSpacing.gutter, borderRadius: designRadii.card, borderWidth: 1, padding: designSpacing.compact },
  input: { flex: 1, minHeight: 52, maxHeight: 140, fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 22, paddingHorizontal: 4, paddingVertical: designSpacing.compact },
  sendBtn: { width: 48, height: 48, borderRadius: designRadii.control, alignItems: "center", justifyContent: "center" },
});
