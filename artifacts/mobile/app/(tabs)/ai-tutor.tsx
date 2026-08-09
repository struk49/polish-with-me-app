import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
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
import { useColors } from "@/hooks/useColors";

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
  const colors = useColors();
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
            backgroundColor: isUser ? colors.primary : colors.card,
            borderColor: isUser ? colors.primary : colors.border,
          },
        ]}
      >
        {!isUser && (
          <View style={styles.messageMeta}>
            <Ionicons
              name={isFallback ? "sparkles-outline" : "school-outline"}
              size={14}
              color={colors.primary}
            />
            <Text style={[styles.messageMetaText, { color: colors.primary }]}>
              {isFallback ? "Practice coach" : "AI tutor"}
            </Text>
          </View>
        )}
        <Text
          style={[
            styles.messageText,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}

export default function AiTutorScreen() {
  const colors = useColors();
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
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.topArea}
        contentContainerStyle={[
          styles.topContent,
          { paddingTop: Platform.OS === "web" ? 67 + 14 : 14 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: colors.mutedForeground }]}>
              CONVERSATION PRACTICE
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              AI Tutor
            </Text>
          </View>
          <View style={[styles.limitBadge, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
            <Text style={[styles.limitText, { color: colors.primary }]}>
              {remaining}/{dailyLimit} today
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Type a short answer. The tutor replies in Polish with a simple English explanation.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LEVEL</Text>
        <View style={styles.levelRow}>
          {AI_LEVELS.map((item) => {
            const active = item.id === level;
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.levelChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
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
                    { color: active ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.levelHelp, { color: colors.mutedForeground }]}>
          {selectedLevel.description}
        </Text>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SCENARIO</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scenarioList}>
          {AI_SCENARIOS.map((item) => {
            const active = item.id === scenario.id;
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.scenarioCard,
                  {
                    backgroundColor: active ? colors.primary + "12" : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => {
                  setScenario(item);
                  Haptics.selectionAsync();
                }}
              >
                <Text style={[styles.scenarioTitle, { color: colors.foreground }]}>
                  {item.title}
                </Text>
                <Text style={[styles.scenarioDesc, { color: colors.mutedForeground }]}>
                  {item.description}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </ScrollView>

      <View style={[styles.chatArea, { borderTopColor: colors.border }]}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatTitle, { color: colors.foreground }]}>
            {scenario.title}
          </Text>
          <Pressable onPress={resetConversation} hitSlop={8}>
            <Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text>
          </Pressable>
        </View>
        {!endpoint && (
          <Text style={[styles.offlineText, { color: colors.mutedForeground }]}>
            AI server not connected yet — using guided practice mode.
          </Text>
        )}
        {endpoint && lastSource === "local" ? (
          <Text style={[styles.offlineText, { color: colors.mutedForeground }]}>
            If the server is unavailable, the app falls back to guided practice.
          </Text>
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
        />

        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              marginBottom: Platform.OS === "web" ? 100 : insets.bottom + 84,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Write your answer..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
            maxLength={500}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed || sending || !input.trim() ? 0.65 : 1,
              },
            ]}
            disabled={sending || !input.trim()}
            onPress={sendMessage}
          >
            <Ionicons
              name={sending ? "hourglass-outline" : "send"}
              size={18}
              color={colors.primaryForeground}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topArea: { flexGrow: 0, maxHeight: 255 },
  topContent: { paddingHorizontal: 16, paddingBottom: 10 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  kicker: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.3, marginBottom: 3 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  limitBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20 },
  limitText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 6 },
  levelRow: { flexDirection: "row", gap: 7, marginBottom: 4 },
  levelChip: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  levelChipText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  levelHelp: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 10 },
  scenarioList: { gap: 10, paddingRight: 20 },
  scenarioCard: { width: 165, borderWidth: 1, borderRadius: 14, padding: 10, gap: 4 },
  scenarioTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  scenarioDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  chatArea: { flex: 1, borderTopWidth: 1, paddingTop: 10 },
  chatHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 4 },
  chatTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  resetText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  offlineText: { paddingHorizontal: 16, fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
  messages: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14, gap: 10 },
  messageRow: { flexDirection: "row" },
  messageBubble: { maxWidth: "94%", borderRadius: 16, borderWidth: 1, padding: 12, gap: 6 },
  messageMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  messageMetaText: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.7 },
  messageText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 21 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 10 },
  input: { flex: 1, minHeight: 72, maxHeight: 150, fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 22, paddingHorizontal: 4, paddingVertical: 8 },
  sendBtn: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
});
