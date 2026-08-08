import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useProgress } from "@/contexts/ProgressContext";
import { isLevelFree } from "@/contexts/SubscriptionContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSubscription } from "@/lib/revenuecat";
import { getOrderedLessons, LESSONS, LEVELS, type Lesson } from "@/data/lessons";
import { useColors } from "@/hooks/useColors";

const LEVEL_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  A1: { bg: "#34C75915", text: "#34C759", accent: "#34C759" },
  A2: { bg: "#FF950015", text: "#FF9500", accent: "#FF9500" },
  B1: { bg: "#AF52DE15", text: "#AF52DE", accent: "#AF52DE" },
  B2: { bg: "#C8102E15", text: "#C8102E", accent: "#C8102E" },
};

function LessonCard({ lesson }: { lesson: Lesson }) {
  const colors = useColors();
  const router = useRouter();
  const { isLessonCompleted, quizScores } = useProgress();
  const { isPremium } = useSubscription();
  const completed = isLessonCompleted(lesson.id);
  const score = quizScores[lesson.id];
  const lvl = LEVEL_COLORS[lesson.level];
  const locked = !isPremium && !isLevelFree(lesson.level);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.lessonCard,
        {
          backgroundColor: locked ? colors.secondary : colors.card,
          borderColor: locked
            ? colors.border
            : completed
            ? colors.primary + "40"
            : colors.border,
          opacity: pressed ? 0.85 : 1,
          borderWidth: completed && !locked ? 1.5 : 1,
        },
      ]}
      onPress={() => {
        if (locked) {
          router.push("/paywall");
        } else {
          router.push(`/lesson/${lesson.id}`);
        }
      }}
    >
      <View style={styles.lessonCardLeft}>
        <View
          style={[
            styles.lessonIcon,
            {
              backgroundColor: locked
                ? colors.border + "60"
                : completed
                ? colors.primary + "15"
                : colors.secondary,
            },
          ]}
        >
          <Ionicons
            name={locked ? "lock-closed-outline" : completed ? "checkmark-circle" : "book-outline"}
            size={22}
            color={locked ? colors.mutedForeground : completed ? colors.primary : colors.mutedForeground}
          />
        </View>
        <View style={styles.lessonInfo}>
          <Text
            style={[styles.lessonTitle, { color: locked ? colors.mutedForeground : colors.foreground }]}
            numberOfLines={1}
          >
            {lesson.title}
          </Text>
          <Text style={[styles.lessonDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
            {lesson.words.length} words · {lesson.estimatedMinutes ?? Math.ceil(lesson.words.length / 3)} min
          </Text>
        </View>
      </View>
      <View style={styles.lessonCardRight}>
        {!locked && score !== undefined && (
          <Text style={[styles.scoreText, { color: colors.primary }]}>{score}%</Text>
        )}
        {!locked && lesson.grammarNote && (
          <View style={[styles.grammarDot, { backgroundColor: lvl.accent + "30" }]}>
            <Text style={[styles.grammarDotText, { color: lvl.accent }]}>G</Text>
          </View>
        )}
        {locked ? (
          <View style={[styles.lockBadge, { backgroundColor: "#C8102E15" }]}>
            <Text style={[styles.lockBadgeText, { color: "#C8102E" }]}>PRO</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        )}
      </View>
    </Pressable>
  );
}

function LevelSection({
  levelId,
  label,
  description,
  lessons,
}: {
  levelId: "A1" | "A2" | "B1" | "B2";
  label: string;
  description: string;
  lessons: Lesson[];
}) {
  const colors = useColors();
  const { isLessonCompleted } = useProgress();
  const [expanded, setExpanded] = useState(levelId === "A1");
  const lvl = LEVEL_COLORS[levelId];
  const completedCount = lessons.filter((l) => isLessonCompleted(l.id)).length;
  const pct = Math.round((completedCount / lessons.length) * 100);

  return (
    <View style={styles.levelSection}>
      <Pressable
        style={({ pressed }) => [
          styles.levelHeader,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={() => setExpanded((v) => !v)}
      >
        <View style={[styles.levelBadge, { backgroundColor: lvl.bg }]}>
          <Text style={[styles.levelBadgeText, { color: lvl.text }]}>{levelId}</Text>
        </View>
        <View style={styles.levelHeaderContent}>
          <Text style={[styles.levelLabel, { color: colors.foreground }]}>{label}</Text>
          <Text style={[styles.levelDesc, { color: colors.mutedForeground }]}>{description}</Text>
          <View style={styles.levelProgress}>
            <View style={[styles.levelProgressTrack, { backgroundColor: colors.secondary }]}>
              <View
                style={[
                  styles.levelProgressFill,
                  { backgroundColor: lvl.accent, width: `${pct}%` as any },
                ]}
              />
            </View>
            <Text style={[styles.levelProgressText, { color: colors.mutedForeground }]}>
              {completedCount}/{lessons.length}
            </Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </Pressable>
      {expanded && (
        <View style={styles.lessonList}>
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scheme, setPref } = useTheme();
  const { completedLessons, streak, totalXP } = useProgress();

  const orderedLessons = getOrderedLessons();
  const firstLesson = orderedLessons.find((lesson) => lesson.level === "A1") ?? orderedLessons[0];
  const completionRate = Math.round((completedLessons.length / orderedLessons.length) * 100);
  const totalWords = orderedLessons.reduce((sum, l) => sum + l.words.length, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? 67 + 16 : 16,
          paddingBottom: Platform.OS === "web" ? 34 + 100 : insets.bottom + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Witaj! Welcome
          </Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Polish with Me
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => setPref(scheme === "dark" ? "light" : "dark")}
            hitSlop={8}
            style={({ pressed }) => [
              styles.themeBtn,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              scheme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            <Ionicons
              name={scheme === "dark" ? "sunny" : "moon"}
              size={18}
              color={colors.foreground}
            />
          </Pressable>
          <View style={[styles.streakBadge, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="flame" size={18} color={colors.primary} />
            <Text style={[styles.streakNum, { color: colors.primary }]}>{streak}</Text>
          </View>
        </View>
      </View>

      {/* Start Here */}
      <View style={[styles.startCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "35" }]}>
        <View style={styles.startHeader}>
          <View style={[styles.startIcon, { backgroundColor: colors.primary + "18" }]}>
            <Ionicons name="compass-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.startTextWrap}>
            <Text style={[styles.startTitle, { color: colors.foreground }]}>Start here</Text>
            <Text style={[styles.startText, { color: colors.mutedForeground }]}>
              Follow A1 from top to bottom. Learn the words, tap the sound buttons in each lesson, then take the quiz.
            </Text>
          </View>
        </View>
        {firstLesson ? (
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push(`/lesson/${firstLesson.id}`)}
          >
            <Text style={[styles.startButtonText, { color: colors.primaryForeground }]}>
              Begin with {firstLesson.title}
            </Text>
            <Ionicons name="arrow-forward" size={17} color={colors.primaryForeground} />
          </Pressable>
        ) : null}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{completedLessons.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Lessons{"\n"}done</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{totalXP}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total{"\n"}XP</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{orderedLessons.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Lessons{"\n"}total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{totalWords}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Words{"\n"}total</Text>
        </View>
      </View>

      {/* Overall Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: colors.foreground }]}>Overall Progress</Text>
          <Text style={[styles.progressPct, { color: colors.primary }]}>{completionRate}%</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${completionRate}%` as any },
            ]}
          />
        </View>
        <Text style={[styles.progressSub, { color: colors.mutedForeground }]}>
          {completedLessons.length} of {orderedLessons.length} lessons completed
        </Text>
      </View>

      {/* Grammar note legend */}
      <View style={[styles.legendRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={[styles.grammarDot, { backgroundColor: "#FF950030" }]}>
          <Text style={[styles.grammarDotText, { color: "#FF9500" }]}>G</Text>
        </View>
        <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
          Lessons marked G include a grammar explanation
        </Text>
      </View>

      {/* Level Sections */}
      <Text style={[styles.sectionHeading, { color: colors.mutedForeground }]}>CURRICULUM</Text>
      {LEVELS.map((level) => {
        const levelLessons = orderedLessons.filter((l) => l.level === level.id);
        return (
          <LevelSection
            key={level.id}
            levelId={level.id}
            label={level.label}
            description={level.description}
            lessons={levelLessons}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 2 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakNum: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  startCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, gap: 14 },
  startHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  startIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  startTextWrap: { flex: 1, gap: 4 },
  startTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  startText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startButtonText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  progressContainer: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  progressPct: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 4 },
  progressSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  legendText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  sectionHeading: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  levelSection: { marginBottom: 12 },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  levelBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  levelHeaderContent: { flex: 1, gap: 3 },
  levelLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  levelDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  levelProgress: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  levelProgressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  levelProgressFill: { height: "100%", borderRadius: 2 },
  levelProgressText: { fontSize: 11, fontFamily: "Inter_400Regular", minWidth: 30 },
  lessonList: { paddingTop: 6, gap: 0 },
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  lessonCardLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  lessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  lessonDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  lessonCardRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  scoreText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  grammarDot: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  grammarDotText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  lockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lockBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
});
