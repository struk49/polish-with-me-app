import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProgressBar, SectionHeader } from "@/components/HomePrimitives";
import { designRadii, designSpacing } from "@/constants/designSystem";
import { useProgress } from "@/contexts/ProgressContext";
import { useTheme, type ThemePref } from "@/contexts/ThemeContext";
import { LESSONS } from "@/data/lessons";
import { useDesignTokens } from "@/hooks/useDesignTokens";

type LevelId = "A1" | "A2" | "B1" | "B2";

interface AchievementProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  unlocked: boolean;
}

function Achievement({ icon, title, description, unlocked }: AchievementProps) {
  const { colors } = useDesignTokens();
  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${description}. ${unlocked ? "Earned" : "Not yet earned"}`}
      style={[
        styles.achievement,
        {
          backgroundColor: unlocked ? colors.successSoft : colors.surfacePrimary,
          borderColor: unlocked ? colors.success : colors.borderDefault,
          borderWidth: unlocked ? 2 : 1,
        },
      ]}
    >
      <View style={[styles.achievementIcon, { backgroundColor: unlocked ? colors.successSoft : colors.backgroundSecondary }]}>
        <Ionicons name={unlocked ? icon : "lock-closed-outline"} size={21} color={unlocked ? colors.success : colors.lockedIcon} />
      </View>
      <View style={styles.achievementText}>
        <View style={styles.achievementTitleRow}>
          <Text style={[styles.achievementTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.achievementState, { color: unlocked ? colors.success : colors.textMuted }]}>{unlocked ? "Earned" : "In progress"}</Text>
        </View>
        <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>{description}</Text>
      </View>
      {unlocked ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : null}
    </View>
  );
}

function ProgressMetric({ icon, value, label, accent }: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  accent: string;
}) {
  const { colors } = useDesignTokens();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={[styles.metric, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderDefault }]}>
      <View style={[styles.metricIcon, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <View style={styles.metricCopy}>
        <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
      </View>
    </View>
  );
}

const THEME_OPTIONS: { value: ThemePref; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "system", label: "System", icon: "phone-portrait-outline" },
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
];

const LEVEL_IDS: LevelId[] = ["A1", "A2", "B1", "B2"];

export default function ProgressScreen() {
  const { colors, levels } = useDesignTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { pref, setPref } = useTheme();
  const { completedLessons, quizScores, streak, totalXP, knownWords, resetProgress } = useProgress();

  const scoreValues = Object.values(quizScores);
  const averageScore = scoreValues.length > 0 ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : 0;
  const learningLevel = Math.floor(totalXP / 100) + 1;
  const xpInLevel = totalXP % 100;
  const xpToNextLevel = 100 - xpInLevel;
  const curriculumProgress = LESSONS.length === 0 ? 0 : Math.round((completedLessons.length / LESSONS.length) * 100);

  const achievements: AchievementProps[] = [
    { icon: "star", title: "First Steps", description: "Complete your first lesson", unlocked: completedLessons.length >= 1 },
    { icon: "flame", title: "On Fire", description: "Maintain a 3-day streak", unlocked: streak >= 3 },
    { icon: "book", title: "Bookworm", description: "Complete 5 lessons", unlocked: completedLessons.length >= 5 },
    { icon: "trophy", title: "Scholar", description: "Complete 8 lessons", unlocked: completedLessons.length >= 8 },
    { icon: "bulb", title: "Vocabulary Pro", description: "Learn 30 words", unlocked: knownWords.length >= 30 },
    { icon: "ribbon", title: "Quiz Master", description: "Score 90%+ on any quiz", unlocked: scoreValues.some((score) => score >= 90) },
    { icon: "medal", title: "Streak Champion", description: "Maintain a 7-day streak", unlocked: streak >= 7 },
    { icon: "diamond", title: "Polish Expert", description: "Earn 500 XP", unlocked: totalXP >= 500 },
  ];
  const earnedAchievements = achievements.filter((achievement) => achievement.unlocked).length;
  const nextAchievement = achievements.find((achievement) => !achievement.unlocked);

  const handleReset = () => {
    Alert.alert("Reset Progress", "This will delete all your progress. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => {
        resetProgress();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } },
    ]);
  };

  const handleSendFeedback = () => {
    const subject = encodeURIComponent("Polish with Me feedback");
    const body = encodeURIComponent("Hi Andrew,\n\nI have feedback about Polish with Me:\n\nWhat I liked:\n\nWhat was confusing:\n\nWhat I would improve:\n\nMy Android device:\n");
    Linking.openURL(`mailto:podgeaisolutions@gmail.com?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert("Email unavailable", "Please email feedback to podgeaisolutions@gmail.com.");
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.backgroundPrimary }}
      contentContainerStyle={[styles.container, { paddingTop: Platform.OS === "web" ? 83 : designSpacing.card, paddingBottom: Platform.OS === "web" ? 134 : insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Your learning, at a glance</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Progress</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>See how your Polish is growing and what comes next.</Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderDefault }]}>
        <View style={styles.summaryTop}>
          <View style={styles.levelSummary}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>LEARNING LEVEL</Text>
            <Text style={[styles.levelNumber, { color: colors.textPrimary }]}>{learningLevel}</Text>
          </View>
          <View style={[styles.completionBadge, { backgroundColor: colors.brandSoft }]} accessible accessibilityLabel={`${curriculumProgress}% of curriculum completed`}>
            <Text style={[styles.completionValue, { color: colors.brandPrimary }]}>{curriculumProgress}%</Text>
            <Text style={[styles.completionLabel, { color: colors.brandPrimary }]}>complete</Text>
          </View>
        </View>
        <View style={styles.summaryProgress}>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>Overall curriculum</Text>
            <Text style={[styles.progressCount, { color: colors.textMuted }]}>{completedLessons.length}/{LESSONS.length} lessons</Text>
          </View>
          <ProgressBar value={curriculumProgress} label={`Overall curriculum progress, ${completedLessons.length} of ${LESSONS.length} lessons completed`} />
        </View>
        <View style={[styles.levelMilestone, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.milestoneCopy}>
            <Text style={[styles.milestoneTitle, { color: colors.textPrimary }]}>{totalXP} XP</Text>
            <Text style={[styles.milestoneText, { color: colors.textMuted }]}>{xpToNextLevel} XP to learning level {learningLevel + 1}</Text>
          </View>
          <ProgressBar value={xpInLevel} height={6} color={colors.xp} label={`Learning level ${learningLevel} progress, ${xpInLevel} of 100 XP`} />
        </View>
        {nextAchievement ? (
          <Text style={[styles.nextMilestone, { color: colors.textMuted }]}>Next achievement: {nextAchievement.title} — {nextAchievement.description}</Text>
        ) : (
          <Text style={[styles.nextMilestone, { color: colors.success }]}>All achievements earned.</Text>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Learning metrics" subtitle="Real progress from your lessons and practice" />
        <View style={styles.metricsGrid}>
          <ProgressMetric icon="flash-outline" value={totalXP} label="Total XP" accent={colors.xp} />
          <ProgressMetric icon="flame-outline" value={streak} label="Day streak" accent={colors.warning} />
          <ProgressMetric icon="checkmark-circle-outline" value={`${completedLessons.length}/${LESSONS.length}`} label="Lessons done" accent={colors.success} />
          <ProgressMetric icon="library-outline" value={knownWords.length} label="Words learned" accent={colors.brandPrimary} />
          <ProgressMetric icon="school-outline" value={scoreValues.length} label="Quizzes taken" accent={colors.textSecondary} />
          <ProgressMetric icon="analytics-outline" value={`${averageScore}%`} label="Average score" accent={colors.brandPrimary} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Curriculum progress" subtitle="Your completed lessons across A1–B2" />
        <View style={[styles.curriculumCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderDefault }]}>
          {LEVEL_IDS.map((levelId, index) => {
            const levelLessons = LESSONS.filter((lesson) => lesson.level === levelId);
            const levelCompleted = levelLessons.filter((lesson) => completedLessons.includes(lesson.id)).length;
            const percentage = levelLessons.length === 0 ? 0 : Math.round((levelCompleted / levelLessons.length) * 100);
            const levelColors = levels[levelId];
            return (
              <View key={levelId} style={[styles.levelProgress, index < LEVEL_IDS.length - 1 && { borderBottomColor: colors.borderDefault, borderBottomWidth: 1 }]}>
                <View style={styles.levelProgressHeader}>
                  <View style={[styles.levelBadge, { backgroundColor: levelColors.soft }]}>
                    <Text style={[styles.levelBadgeText, { color: levelColors.strong }]}>{levelId}</Text>
                  </View>
                  <View style={styles.levelProgressCopy}>
                    <Text style={[styles.levelProgressTitle, { color: colors.textPrimary }]}>{percentage === 100 ? "Level complete" : `${percentage}% complete`}</Text>
                    <Text style={[styles.levelProgressCount, { color: colors.textMuted }]}>{levelCompleted} of {levelLessons.length} lessons</Text>
                  </View>
                </View>
                <ProgressBar value={percentage} height={6} color={levelColors.strong} label={`${levelId} progress, ${levelCompleted} of ${levelLessons.length} lessons completed`} />
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Achievements" subtitle={`${earnedAchievements} of ${achievements.length} earned`} />
        <View style={styles.achievements}>
          {achievements.map((achievement) => <Achievement key={achievement.title} {...achievement} />)}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Appearance" />
        <View style={[styles.segmented, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderDefault }]}>
          {THEME_OPTIONS.map((option) => {
            const active = pref === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${option.label} theme`}
                accessibilityHint="Changes the app colour theme"
                onPress={() => { Haptics.selectionAsync(); setPref(option.value); }}
                style={[styles.segment, { backgroundColor: active ? colors.surfacePrimary : "transparent", borderColor: active ? colors.borderDefault : "transparent" }]}
              >
                <Ionicons name={option.icon} size={17} color={active ? colors.brandPrimary : colors.textMuted} />
                <Text style={[styles.segmentText, { color: active ? colors.textPrimary : colors.textMuted }]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Help improve the app" />
        <View style={[styles.feedbackCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderDefault }]}>
          <View style={styles.feedbackHeader}>
            <View style={[styles.feedbackIcon, { backgroundColor: colors.brandSoft }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={21} color={colors.brandPrimary} />
            </View>
            <View style={styles.feedbackTextWrap}>
              <Text style={[styles.feedbackTitle, { color: colors.textPrimary }]}>Send feedback</Text>
              <Text style={[styles.feedbackText, { color: colors.textMuted }]}>Tell us what felt useful, confusing, broken or missing. Your suggestions help shape the next version.</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Email feedback" accessibilityHint="Opens your email app with a feedback template" onPress={handleSendFeedback} style={({ pressed }) => [styles.feedbackButton, { backgroundColor: pressed ? colors.brandPressed : colors.brandPrimary }]}>
            <Text style={[styles.feedbackButtonText, { color: colors.textInverse }]}>Email feedback</Text>
            <Ionicons name="mail-outline" size={18} color={colors.textInverse} />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Privacy" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Privacy Policy"
          accessibilityHint="Opens the in-app Privacy Policy"
          onPress={() => router.push("/privacy-policy")}
          style={({ pressed }) => [
            styles.privacyButton,
            {
              backgroundColor: pressed ? colors.surfaceSecondary : colors.surfacePrimary,
              borderColor: colors.borderDefault,
            },
          ]}
        >
          <Ionicons name="shield-checkmark-outline" size={21} color={colors.brandPrimary} />
          <Text style={[styles.privacyButtonText, { color: colors.textPrimary }]}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Reset progress" accessibilityHint="Opens a confirmation before deleting all learning progress" onPress={handleReset} style={({ pressed }) => [styles.resetButton, { backgroundColor: pressed ? colors.brandSoft : colors.surfacePrimary, borderColor: colors.brandPrimary }]}>
        <Ionicons name="refresh-outline" size={18} color={colors.brandPrimary} />
        <Text style={[styles.resetText, { color: colors.brandPrimary }]}>Reset progress</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: designSpacing.gutter },
  header: { marginBottom: designSpacing.gutter },
  eyebrow: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular", marginTop: 3 },
  summaryCard: { borderRadius: designRadii.feature, borderWidth: 2, padding: designSpacing.gutter, marginBottom: designSpacing.section, gap: designSpacing.card },
  summaryTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: designSpacing.element },
  levelSummary: { flex: 1 },
  summaryLabel: { fontSize: 11, lineHeight: 16, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  levelNumber: { fontSize: 40, lineHeight: 46, fontFamily: "Inter_700Bold" },
  completionBadge: { minWidth: 84, paddingHorizontal: designSpacing.element, paddingVertical: designSpacing.compact, borderRadius: designRadii.control, alignItems: "center" },
  completionValue: { fontSize: 22, lineHeight: 27, fontFamily: "Inter_700Bold" },
  completionLabel: { fontSize: 11, lineHeight: 16, fontFamily: "Inter_600SemiBold" },
  summaryProgress: { gap: designSpacing.compact },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: designSpacing.element, flexWrap: "wrap" },
  progressTitle: { fontSize: 15, lineHeight: 21, fontFamily: "Inter_600SemiBold" },
  progressCount: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_500Medium" },
  levelMilestone: { padding: designSpacing.element, borderRadius: designRadii.control, gap: designSpacing.compact },
  milestoneCopy: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: designSpacing.element, flexWrap: "wrap" },
  milestoneTitle: { fontSize: 15, lineHeight: 21, fontFamily: "Inter_700Bold" },
  milestoneText: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular" },
  nextMilestone: { fontSize: 12, lineHeight: 18, fontFamily: "Inter_400Regular" },
  section: { marginBottom: designSpacing.section },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: designSpacing.compact },
  metric: { width: "48.5%", minHeight: 72, borderRadius: designRadii.control, borderWidth: 1, padding: designSpacing.element, flexDirection: "row", alignItems: "center", gap: designSpacing.compact },
  metricIcon: { width: 32, height: 32, flexShrink: 0, borderRadius: designRadii.small, alignItems: "center", justifyContent: "center" },
  metricCopy: { flex: 1, minWidth: 0 },
  metricValue: { fontSize: 19, lineHeight: 24, fontFamily: "Inter_700Bold" },
  metricLabel: { fontSize: 11, lineHeight: 16, fontFamily: "Inter_500Medium" },
  curriculumCard: { borderRadius: designRadii.card, borderWidth: 1, overflow: "hidden" },
  levelProgress: { padding: designSpacing.card, gap: designSpacing.element },
  levelProgressHeader: { flexDirection: "row", alignItems: "center", gap: designSpacing.element },
  levelBadge: { width: 42, height: 42, borderRadius: designRadii.control, alignItems: "center", justifyContent: "center" },
  levelBadgeText: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_700Bold" },
  levelProgressCopy: { flex: 1, minWidth: 0 },
  levelProgressTitle: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_600SemiBold" },
  levelProgressCount: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular", marginTop: 1 },
  achievements: { gap: designSpacing.compact },
  achievement: { flexDirection: "row", alignItems: "center", padding: designSpacing.element, borderRadius: designRadii.card, gap: designSpacing.element },
  achievementIcon: { width: 42, height: 42, flexShrink: 0, borderRadius: designRadii.control, alignItems: "center", justifyContent: "center" },
  achievementText: { flex: 1, minWidth: 0 },
  achievementTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: designSpacing.compact, flexWrap: "wrap" },
  achievementTitle: { flexShrink: 1, fontSize: 15, lineHeight: 21, fontFamily: "Inter_600SemiBold" },
  achievementState: { fontSize: 11, lineHeight: 16, fontFamily: "Inter_600SemiBold" },
  achievementDesc: { fontSize: 12, lineHeight: 18, fontFamily: "Inter_400Regular", marginTop: 2 },
  segmented: { flexDirection: "row", borderRadius: designRadii.control, borderWidth: 1, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 4, borderRadius: designRadii.small, borderWidth: 1 },
  segmentText: { flexShrink: 1, fontSize: 13, lineHeight: 18, fontFamily: "Inter_600SemiBold" },
  feedbackCard: { borderRadius: designRadii.card, borderWidth: 1, padding: designSpacing.card, gap: designSpacing.element },
  feedbackHeader: { flexDirection: "row", alignItems: "flex-start", gap: designSpacing.element },
  feedbackIcon: { width: 42, height: 42, flexShrink: 0, borderRadius: designRadii.control, alignItems: "center", justifyContent: "center" },
  feedbackTextWrap: { flex: 1, minWidth: 0, gap: 3 },
  feedbackTitle: { fontSize: 16, lineHeight: 22, fontFamily: "Inter_700Bold" },
  feedbackText: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },
  feedbackButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: designSpacing.compact, paddingHorizontal: designSpacing.card, borderRadius: designRadii.control },
  feedbackButtonText: { fontSize: 15, lineHeight: 20, fontFamily: "Inter_600SemiBold" },
  privacyButton: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: designSpacing.element, paddingHorizontal: designSpacing.card, paddingVertical: designSpacing.compact, borderRadius: designRadii.control, borderWidth: 1 },
  privacyButtonText: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 21, fontFamily: "Inter_600SemiBold" },
  resetButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: designSpacing.compact, paddingHorizontal: designSpacing.card, borderRadius: designRadii.control, borderWidth: 1, marginBottom: designSpacing.compact },
  resetText: { fontSize: 15, lineHeight: 20, fontFamily: "Inter_500Medium" },
});
