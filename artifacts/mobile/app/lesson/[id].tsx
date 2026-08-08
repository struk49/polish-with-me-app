import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useProgress } from "@/contexts/ProgressContext";
import { LESSONS, type Word } from "@/data/lessons";
import { useColors } from "@/hooks/useColors";

const LEVEL_COLORS: Record<string, string> = {
  A1: "#34C759",
  A2: "#FF9500",
  B1: "#AF52DE",
  B2: "#C8102E",
};

function WordRow({ word, index }: { word: Word; index: number }) {
  const colors = useColors();
  const { isWordKnown, toggleKnownWord } = useProgress();
  const known = isWordKnown(word.id);
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = async () => {
    await Haptics.selectionAsync();

    if (speaking) {
      await Speech.stop();
      setSpeaking(false);
      return;
    }

    await Speech.stop();

    Speech.speak(word.polish, {
      language: Platform.OS === "android" ? "pl" : "pl-PL",
      rate: 0.82,
      pitch: 1,
      volume: 1,
      onStart: () => setSpeaking(true),
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => {
        setSpeaking(false);
        Alert.alert(
          "Speech unavailable",
          "Please install or enable a text-to-speech engine and the Polish voice in your phone settings.",
        );
      },
    });
  };

  return (
    <View
      style={[
        styles.wordRow,
        {
          backgroundColor: colors.card,
          borderColor: known ? colors.primary + "40" : colors.border,
          borderWidth: known ? 1.5 : 1,
        },
      ]}
    >
      <View style={[styles.wordIndex, { backgroundColor: colors.primary + "15" }]}>
        <Text style={[styles.wordIndexText, { color: colors.primary }]}>{index + 1}</Text>
      </View>
      <View style={styles.wordContent}>
        <Text style={[styles.polishWord, { color: colors.foreground }]}>{word.polish}</Text>
        <Text style={[styles.phonetic, { color: colors.mutedForeground }]}>{word.phonetic}</Text>
        <Text style={[styles.english, { color: colors.foreground }]}>{word.english}</Text>
        {word.example ? (
          <View style={[styles.exampleBox, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.examplePolish, { color: colors.foreground }]}>
              {word.example}
            </Text>
            <Text style={[styles.exampleEnglish, { color: colors.mutedForeground }]}>
              {word.exampleTranslation}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.wordActions}>
        <Pressable
          onPress={handleSpeak}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Hear ${word.polish}`}
        >
          <Ionicons
            name={speaking ? "volume-high" : "volume-medium-outline"}
            size={24}
            color={speaking ? colors.primary : colors.mutedForeground}
          />
        </Pressable>
        <Pressable
          onPress={() => {
            toggleKnownWord(word.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={known ? "Mark word as not known" : "Mark word as known"}
        >
          <Ionicons
            name={known ? "checkmark-circle" : "checkmark-circle-outline"}
            size={24}
            color={known ? colors.primary : colors.border}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLessonCompleted, completeLesson } = useProgress();

  const lesson = LESSONS.find((l) => l.id === id);

  if (!lesson) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          Lesson not found.
        </Text>
      </View>
    );
  }

  const completed = isLessonCompleted(lesson.id);
  const levelColor = LEVEL_COLORS[lesson.level] ?? "#34C759";

  const DIFF_COLORS: Record<string, string> = {
    beginner: "#34C759",
    intermediate: "#FF9500",
    advanced: "#FF3B30",
  };

  const handleStartQuiz = () => {
    completeLesson(lesson.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/quiz/${lesson.id}`);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={[styles.hero, { backgroundColor: levelColor + "12" }]}>
          <View style={styles.heroMeta}>
            <View style={[styles.levelBadge, { backgroundColor: levelColor + "25" }]}>
              <Text style={[styles.levelText, { color: levelColor }]}>{lesson.level}</Text>
            </View>
            <View style={[styles.diffBadge, { backgroundColor: DIFF_COLORS[lesson.difficulty] + "20" }]}>
              <Text style={[styles.diffText, { color: DIFF_COLORS[lesson.difficulty] }]}>
                {lesson.difficulty}
              </Text>
            </View>
            {completed && (
              <View style={[styles.completedBadge, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={[styles.completedText, { color: colors.primary }]}>Completed</Text>
              </View>
            )}
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>{lesson.title}</Text>
          <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>
            {lesson.description}
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Ionicons name="library-outline" size={15} color={colors.mutedForeground} />
              <Text style={[styles.heroStatText, { color: colors.mutedForeground }]}>
                {lesson.words.length} words
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Ionicons name="time-outline" size={15} color={colors.mutedForeground} />
              <Text style={[styles.heroStatText, { color: colors.mutedForeground }]}>
                {lesson.estimatedMinutes ?? Math.ceil(lesson.words.length / 3)} min
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Ionicons name="school-outline" size={15} color={levelColor} />
              <Text style={[styles.heroStatText, { color: levelColor }]}>
                {lesson.category}
              </Text>
            </View>
          </View>
        </View>

        {/* Grammar Note (if present) */}
        {lesson.grammarNote ? (
          <View
            style={[
              styles.grammarBox,
              { backgroundColor: levelColor + "10", borderColor: levelColor + "35" },
            ]}
          >
            <View style={styles.grammarHeader}>
              <Ionicons name="school" size={18} color={levelColor} />
              <Text style={[styles.grammarTitle, { color: levelColor }]}>Grammar Note</Text>
            </View>
            <Text style={[styles.grammarText, { color: colors.foreground }]}>
              {lesson.grammarNote}
            </Text>
          </View>
        ) : (
          /* Pronunciation tip for lessons without grammar notes */
          <View
            style={[
              styles.grammarBox,
              { backgroundColor: colors.accent, borderColor: colors.primary + "30" },
            ]}
          >
            <View style={styles.grammarHeader}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={[styles.grammarTitle, { color: colors.primary }]}>
                Pronunciation tip
              </Text>
            </View>
            <Text style={[styles.grammarText, { color: colors.foreground }]}>
              Italic text shows how to pronounce each word. Capital letters mark the
              stressed syllable — e.g. "PROH-sheh" means stress the first syllable.
            </Text>
          </View>
        )}

        {/* Vocabulary */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Vocabulary · {lesson.words.length} words
        </Text>
        <View style={styles.wordList}>
          {lesson.words.map((word, i) => (
            <WordRow key={word.id} word={word} index={i} />
          ))}
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.quizBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleStartQuiz}
        >
          <Ionicons name="school-outline" size={20} color={colors.primaryForeground} />
          <Text style={[styles.quizBtnText, { color: colors.primaryForeground }]}>
            {completed ? "Retake Quiz" : "Take Quiz"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 0 },
  errorText: { flex: 1, textAlign: "center", marginTop: 100, fontSize: 16 },
  hero: { borderRadius: 18, padding: 20, marginBottom: 16, marginTop: 8, gap: 8 },
  heroMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  levelText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  diffText: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  heroTitle: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  heroDesc: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  heroStats: { flexDirection: "row", gap: 16, marginTop: 4, flexWrap: "wrap" },
  heroStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  heroStatText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  grammarBox: { borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, gap: 10 },
  grammarHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  grammarTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  grammarText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 12 },
  wordList: { gap: 10 },
  wordRow: { flexDirection: "row", alignItems: "flex-start", padding: 14, borderRadius: 14, gap: 12 },
  wordIndex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  wordIndexText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  wordContent: { flex: 1, gap: 3 },
  wordActions: { alignItems: "center", gap: 12, paddingTop: 2 },
  polishWord: { fontSize: 18, fontFamily: "Inter_700Bold" },
  phonetic: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  english: { fontSize: 15, fontFamily: "Inter_500Medium" },
  exampleBox: { marginTop: 8, padding: 10, borderRadius: 8, gap: 3 },
  examplePolish: { fontSize: 13, fontFamily: "Inter_500Medium" },
  exampleEnglish: { fontSize: 12, fontFamily: "Inter_400Regular" },
  footer: { padding: 16, paddingTop: 12, borderTopWidth: 1 },
  quizBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  quizBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
});
