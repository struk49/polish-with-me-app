import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
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

interface QuizQuestion {
  word: Word;
  options: string[];
  correctIndex: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(lessonId: string): QuizQuestion[] {
  const lesson = LESSONS.find((l) => l.id === lessonId);
  if (!lesson) return [];

  const sameLessonWords = lesson.words;
  const sameCategoryWords = LESSONS
    .filter((l) => l.id !== lesson.id && l.level === lesson.level && l.category === lesson.category)
    .flatMap((l) => l.words);
  const sameLevelWords = LESSONS
    .filter((l) => l.id !== lesson.id && l.level === lesson.level)
    .flatMap((l) => l.words);
  const allWords = LESSONS.flatMap((l) => l.words);

  const chooseDistractors = (word: Word) => {
    const seen = new Set([word.english]);
    const options: string[] = [];
    const pools = [sameLessonWords, sameCategoryWords, sameLevelWords, allWords];

    for (const pool of pools) {
      for (const candidate of shuffle(pool)) {
        if (candidate.id === word.id || seen.has(candidate.english)) continue;
        options.push(candidate.english);
        seen.add(candidate.english);
        if (options.length === 3) return options;
      }
    }

    return options;
  };

  return shuffle(lesson.words).map((word) => {
    const distractors = chooseDistractors(word);

    const options = shuffle([word.english, ...distractors]);
    return {
      word,
      options,
      correctIndex: options.indexOf(word.english),
    };
  });
}

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { saveQuizScore } = useProgress();

  const questions = useMemo(() => buildQuestions(id ?? ""), [id]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<QuizQuestion[]>([]);

  const question = questions[current];
  const progress = (current / questions.length) * 100;

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (answered) return;
      setSelected(optionIndex);
      setAnswered(true);

      const correct = optionIndex === question.correctIndex;
      if (correct) {
        setScore((s) => s + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setWrongAnswers((wa) => [...wa, question]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [answered, question]
  );

  const handleNext = useCallback(() => {
      if (current + 1 >= questions.length) {
      const finalScore = Math.round((score / questions.length) * 100);
      saveQuizScore(id ?? "", finalScore);
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  }, [current, questions.length, score, selected, question, saveQuizScore, id]);

  if (!question || questions.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          Quiz not available.
        </Text>
      </View>
    );
  }

  const finalScore = Math.round((score / questions.length) * 100);

  if (done) {
    const passed = finalScore >= 60;
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.doneContainer,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View
          style={[
            styles.scoreCircle,
            {
              backgroundColor: passed ? colors.primary : colors.secondary,
              borderColor: passed ? colors.primary : colors.border,
            },
          ]}
        >
          <Text style={[styles.scorePct, { color: passed ? "#FFFFFF" : colors.foreground }]}>
            {finalScore}%
          </Text>
          <Text
            style={[
              styles.scoreLabel,
              { color: passed ? "rgba(255,255,255,0.8)" : colors.mutedForeground },
            ]}
          >
            {score}/{questions.length} correct
          </Text>
        </View>

        <Text style={[styles.doneTitle, { color: colors.foreground }]}>
          {finalScore >= 90
            ? "Excellent!"
            : finalScore >= 70
            ? "Good job!"
            : finalScore >= 50
            ? "Keep practicing!"
            : "Need more review"}
        </Text>
        <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
          {passed
            ? "You're making great progress with Polish!"
            : "Review the lesson and try again to improve your score."}
        </Text>

        {wrongAnswers.length > 0 && (
          <View style={styles.reviewSection}>
            <Text style={[styles.reviewTitle, { color: colors.foreground }]}>
              Review These Words
            </Text>
            {wrongAnswers.map((q) => (
              <View
                key={q.word.id}
                style={[
                  styles.reviewCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.reviewPolish, { color: colors.foreground }]}
                >
                  {q.word.polish}
                </Text>
                <Text
                  style={[
                    styles.reviewPhonetic,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {q.word.phonetic}
                </Text>
                <Text
                  style={[styles.reviewEnglish, { color: colors.primary }]}
                >
                  {q.word.english}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.doneActions}>
          <Pressable
            style={({ pressed }) => [
              styles.retryBtn,
              {
                backgroundColor: colors.secondary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={() => {
              setCurrent(0);
              setSelected(null);
              setAnswered(false);
              setScore(0);
              setDone(false);
              setWrongAnswers([]);
            }}
          >
            <Ionicons name="refresh" size={18} color={colors.foreground} />
            <Text style={[styles.retryBtnText, { color: colors.foreground }]}>
              Try Again
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.continueBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => router.back()}
          >
            <Text
              style={[styles.continueBtnText, { color: colors.primaryForeground }]}
            >
              Continue
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.primaryForeground}
            />
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Progress */}
      <View style={styles.progressArea}>
        <View
          style={[styles.progressTrack, { backgroundColor: colors.secondary }]}
        >
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${progress}%` as any },
            ]}
          />
        </View>
        <Text style={[styles.qCounter, { color: colors.mutedForeground }]}>
          {current + 1} / {questions.length}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.quizContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Question */}
        <View
          style={[
            styles.questionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.questionHint, { color: colors.mutedForeground }]}>
            WHAT DOES THIS MEAN?
          </Text>
          <Text style={[styles.questionWord, { color: colors.foreground }]}>
            {question.word.polish}
          </Text>
          <Text
            style={[styles.questionPhonetic, { color: colors.mutedForeground }]}
          >
            {question.word.phonetic}
          </Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {question.options.map((option, idx) => {
            let bgColor = colors.card;
            let borderColor = colors.border;
            let textColor = colors.foreground;

            if (answered) {
              if (idx === question.correctIndex) {
                bgColor = colors.success + "20";
                borderColor = colors.success;
                textColor = colors.success;
              } else if (idx === selected && idx !== question.correctIndex) {
                bgColor = colors.destructive + "15";
                borderColor = colors.destructive;
                textColor = colors.destructive;
              }
            } else if (selected === idx) {
              bgColor = colors.primary + "15";
              borderColor = colors.primary;
            }

            return (
              <Pressable
                key={idx}
                style={({ pressed }) => [
                  styles.optionBtn,
                  {
                    backgroundColor: bgColor,
                    borderColor,
                    opacity: pressed && !answered ? 0.85 : 1,
                  },
                ]}
                onPress={() => handleSelect(idx)}
                disabled={answered}
              >
                <View
                  style={[
                    styles.optionLetter,
                    {
                      backgroundColor:
                        answered && idx === question.correctIndex
                          ? colors.success + "30"
                          : answered && idx === selected
                          ? colors.destructive + "20"
                          : colors.secondary,
                    },
                  ]}
                >
                  <Text
                    style={[styles.optionLetterText, { color: textColor }]}
                  >
                    {["A", "B", "C", "D"][idx]}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: textColor }]}>
                  {option}
                </Text>
                {answered && idx === question.correctIndex && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.success}
                  />
                )}
                {answered && idx === selected && idx !== question.correctIndex && (
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={colors.destructive}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Next Button */}
        {answered && (
          <Pressable
            style={({ pressed }) => [
              styles.nextBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={handleNext}
          >
            <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
              {current + 1 >= questions.length ? "See Results" : "Next Question"}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.primaryForeground}
            />
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 100,
  },
  progressArea: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  qCounter: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "right",
  },
  quizContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  questionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  questionHint: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  questionWord: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  questionPhonetic: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  options: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLetterText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  nextBtnText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  doneContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
    gap: 16,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    gap: 4,
    marginBottom: 8,
  },
  scorePct: {
    fontSize: 44,
    fontFamily: "Inter_700Bold",
  },
  scoreLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  doneTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  doneSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  reviewSection: {
    width: "100%",
    gap: 10,
  },
  reviewTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  reviewCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  reviewPolish: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  reviewPhonetic: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  reviewEnglish: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  doneActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  retryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  continueBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  continueBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
