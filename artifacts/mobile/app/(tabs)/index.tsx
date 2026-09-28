import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MetricCard, PrimaryButton, ProgressBar, SectionHeader, StatusBadge, SurfaceCard } from "@/components/HomePrimitives";
import { designRadii, designSpacing } from "@/constants/designSystem";
import { useProgress } from "@/contexts/ProgressContext";
import { canAccessLevel, isLevelFree } from "@/contexts/SubscriptionContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getOrderedLessons, LEVELS, type Lesson } from "@/data/lessons";
import { useDesignTokens } from "@/hooks/useDesignTokens";
import { getNextAccessibleLesson } from "@/lib/homeLearning";
import { useSubscription } from "@/lib/revenuecat";

type LevelId = "A1" | "A2" | "B1" | "B2";

function LessonCard({ lesson, isCurrent }: { lesson: Lesson; isCurrent: boolean }) {
  const router = useRouter();
  const { colors, levels } = useDesignTokens();
  const { isLessonCompleted, quizScores } = useProgress();
  const { isPremium } = useSubscription();
  const completed = isLessonCompleted(lesson.id);
  const locked = !isPremium && !isLevelFree(lesson.level);
  const score = quizScores[lesson.id];
  const level = levels[lesson.level];
  const stateLabel = locked ? "Pro locked" : completed ? "Completed" : isCurrent ? "Next lesson" : "Available";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${lesson.title}, ${lesson.level}, ${stateLabel}`}
      accessibilityHint={locked ? "Opens the Pro upgrade screen" : "Opens this lesson"}
      onPress={() => router.push(locked ? "/paywall" : `/lesson/${lesson.id}`)}
      style={({ pressed }) => [
        styles.lessonCard,
        {
          backgroundColor: locked ? colors.lockedSurface : colors.surfacePrimary,
          borderColor: completed ? colors.success : isCurrent ? colors.brandPrimary : colors.borderDefault,
          borderWidth: completed || isCurrent ? 2 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={[styles.lessonIcon, { backgroundColor: locked ? colors.backgroundSecondary : completed ? colors.successSoft : level.soft }]}>
        <Ionicons
          name={locked ? "lock-closed-outline" : completed ? "checkmark-circle" : "book-outline"}
          size={22}
          color={locked ? colors.lockedIcon : completed ? colors.success : level.strong}
        />
      </View>
      <View style={styles.lessonInfo}>
        <Text style={[styles.lessonTitle, { color: colors.textPrimary }]}>{lesson.title}</Text>
        <Text style={[styles.lessonMeta, { color: colors.textMuted }]}>
          {lesson.words.length} words · {lesson.estimatedMinutes ?? Math.ceil(lesson.words.length / 3)} min
        </Text>
      </View>
      <View style={styles.lessonTrailing}>
        {!locked && lesson.grammarNote ? (
          <StatusBadge label="G" backgroundColor={level.soft} color={level.strong} />
        ) : null}
        {locked ? <StatusBadge label="PRO" backgroundColor={colors.proSoft} color={colors.proPrimary} /> : null}
        {!locked && completed ? <StatusBadge label={score === undefined ? "Done" : `${score}%`} backgroundColor={colors.successSoft} color={colors.success} icon="checkmark" /> : null}
        {!locked && !completed && isCurrent ? <StatusBadge label="NEXT" backgroundColor={colors.brandSoft} color={colors.brandPrimary} /> : null}
        {!locked && !completed && !isCurrent ? <Ionicons name="chevron-forward" size={20} color={colors.textMuted} /> : null}
      </View>
    </Pressable>
  );
}

function LevelSection({ levelId, label, description, lessons, currentLessonId, initiallyExpanded, isLast }: {
  levelId: LevelId;
  label: string;
  description: string;
  lessons: Lesson[];
  currentLessonId?: string;
  initiallyExpanded: boolean;
  isLast: boolean;
}) {
  const { colors, levels } = useDesignTokens();
  const { isLessonCompleted } = useProgress();
  const { isPremium } = useSubscription();
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const level = levels[levelId];
  const completedCount = lessons.filter((lesson) => isLessonCompleted(lesson.id)).length;
  const percentage = lessons.length === 0 ? 0 : Math.round((completedCount / lessons.length) * 100);
  const locked = !isPremium && !isLevelFree(levelId);

  useEffect(() => {
    if (initiallyExpanded) setExpanded(true);
  }, [initiallyExpanded]);

  return (
    <View style={styles.levelSection}>
      {!isLast ? <View style={[styles.pathConnector, { backgroundColor: colors.borderStrong }]} /> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${completedCount} of ${lessons.length} lessons completed${locked ? ", Pro" : ""}`}
        accessibilityHint={expanded ? "Collapses this level" : "Expands this level"}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.levelHeader, { backgroundColor: pressed ? colors.surfaceSecondary : colors.surfacePrimary, borderColor: colors.borderDefault }]}
      >
        <View style={[styles.levelBadge, { backgroundColor: level.soft }]}>
          <Text style={[styles.levelBadgeText, { color: level.strong }]}>{levelId}</Text>
        </View>
        <View style={styles.levelHeaderContent}>
          <View style={styles.levelTitleRow}>
            <Text style={[styles.levelLabel, { color: colors.textPrimary }]}>{label}</Text>
            {locked ? <StatusBadge label="PRO" backgroundColor={colors.proSoft} color={colors.proPrimary} /> : null}
          </View>
          <Text style={[styles.levelDescription, { color: colors.textMuted }]}>{description}</Text>
          <View style={styles.levelProgressRow}>
            <View style={styles.levelProgressBar}>
              <ProgressBar value={percentage} height={6} color={level.strong} label={`${label} progress, ${completedCount} of ${lessons.length} lessons`} />
            </View>
            <Text style={[styles.levelCount, { color: colors.textMuted }]}>{completedCount}/{lessons.length}</Text>
          </View>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.textMuted} />
      </Pressable>
      {expanded ? (
        <View style={styles.lessonList}>
          {lessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} isCurrent={lesson.id === currentLessonId} />)}
        </View>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, setPref } = useTheme();
  const { colors, levels } = useDesignTokens();
  const { completedLessons, streak, totalXP } = useProgress();
  const { isPremium, isEntitlementLoading } = useSubscription();

  const orderedLessons = useMemo(() => getOrderedLessons(), []);
  const nextLesson = isEntitlementLoading
    ? null
    : getNextAccessibleLesson({
        orderedLessons,
        completedLessonIds: completedLessons,
        canAccess: (lesson) => canAccessLevel(isPremium, lesson.level),
      });
  const completionRate = orderedLessons.length === 0 ? 0 : Math.round((completedLessons.length / orderedLessons.length) * 100);
  const totalWords = orderedLessons.reduce((sum, lesson) => sum + lesson.words.length, 0);
  const learnerLevel = Math.floor(totalXP / 100) + 1;
  const currentLevelLessons = nextLesson ? orderedLessons.filter((lesson) => lesson.level === nextLesson.lesson.level) : [];
  const currentLevelCompleted = currentLevelLessons.filter((lesson) => completedLessons.includes(lesson.id)).length;
  const currentLevelProgress = currentLevelLessons.length === 0 ? 0 : Math.round((currentLevelCompleted / currentLevelLessons.length) * 100);
  const nextModeLabel = nextLesson?.mode === "start" ? "START LEARNING" : nextLesson?.mode === "review" ? "REVIEW" : "CONTINUE LEARNING";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.backgroundPrimary }}
      contentContainerStyle={[styles.container, { paddingTop: Platform.OS === "web" ? 83 : designSpacing.card, paddingBottom: Platform.OS === "web" ? 134 : insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>Witaj! Welcome</Text>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Polish with Me</Text>
          <Text style={[styles.learnerContext, { color: colors.textSecondary }]}>Level {learnerLevel} learner</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.streakBadge, { backgroundColor: colors.warningSoft }]} accessible accessibilityLabel={`${streak} day streak`}>
            <Ionicons name="flame" size={18} color={colors.warning} />
            <Text style={[styles.streakText, { color: colors.warning }]}>{streak} days</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={scheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            accessibilityHint="Changes the app colour theme"
            onPress={() => setPref(scheme === "dark" ? "light" : "dark")}
            style={({ pressed }) => [styles.iconButton, { backgroundColor: pressed ? colors.surfaceSecondary : colors.surfacePrimary, borderColor: colors.borderDefault }]}
          >
            <Ionicons name={scheme === "dark" ? "sunny-outline" : "moon-outline"} size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {isEntitlementLoading ? (
        <View style={styles.primarySection}>
          <SurfaceCard feature>
            <View style={styles.learningPathLoading} accessible accessibilityLabel="Loading your learning path">
              <ActivityIndicator color={colors.brandPrimary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your learning path…</Text>
            </View>
          </SurfaceCard>
        </View>
      ) : nextLesson ? (
        <View style={styles.primarySection}>
          <SurfaceCard feature>
            <View style={styles.continueTopRow}>
              <StatusBadge label={nextModeLabel} backgroundColor={colors.brandSoft} color={colors.brandPrimary} icon={nextLesson.mode === "review" ? "refresh" : "book-outline"} />
              <StatusBadge label={nextLesson.lesson.level} backgroundColor={levels[nextLesson.lesson.level].soft} color={levels[nextLesson.lesson.level].strong} />
            </View>
            <Text style={[styles.continueTitle, { color: colors.textPrimary }]}>{nextLesson.lesson.title}</Text>
            <Text style={[styles.continueDescription, { color: colors.textSecondary }]}>{nextLesson.lesson.description}</Text>
            <View style={styles.continueMetaRow}>
              <View style={styles.inlineMeta}><Ionicons name="library-outline" size={16} color={colors.textMuted} /><Text style={[styles.metaText, { color: colors.textMuted }]}>{nextLesson.lesson.words.length} words</Text></View>
              <View style={styles.inlineMeta}><Ionicons name="time-outline" size={16} color={colors.textMuted} /><Text style={[styles.metaText, { color: colors.textMuted }]}>{nextLesson.lesson.estimatedMinutes ?? Math.ceil(nextLesson.lesson.words.length / 3)} min</Text></View>
            </View>
            <View style={styles.continueProgress}>
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>{nextLesson.lesson.level} progress</Text>
                <Text style={[styles.progressValue, { color: levels[nextLesson.lesson.level].strong }]}>{currentLevelCompleted}/{currentLevelLessons.length}</Text>
              </View>
              <ProgressBar value={currentLevelProgress} color={levels[nextLesson.lesson.level].strong} label={`${nextLesson.lesson.level} progress, ${currentLevelCompleted} of ${currentLevelLessons.length} lessons`} />
            </View>
            <PrimaryButton label={nextLesson.mode === "review" ? "Review lesson" : "Continue learning"} accessibilityHint={`Opens ${nextLesson.lesson.title}`} onPress={() => router.push(`/lesson/${nextLesson.lesson.id}`)} />
          </SurfaceCard>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Your progress" subtitle="A quick view of your learning momentum" />
        <View style={styles.metricsGrid}>
          <MetricCard icon="ribbon-outline" value={learnerLevel} label="Learning level" accent={colors.brandPrimary} />
          <MetricCard icon="flash-outline" value={totalXP} label="Total XP" accent={colors.xp} />
          <MetricCard icon="checkmark-circle-outline" value={completedLessons.length} label="Lessons done" accent={colors.success} />
          <MetricCard icon="library-outline" value={totalWords} label="Words available" accent={colors.textSecondary} />
        </View>
        <SurfaceCard>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.progressSummaryTitle, { color: colors.textPrimary }]}>Overall curriculum</Text>
            <Text style={[styles.progressValue, { color: colors.brandPrimary }]}>{completionRate}%</Text>
          </View>
          <ProgressBar value={completionRate} label={`Overall curriculum progress, ${completedLessons.length} of ${orderedLessons.length} lessons completed`} />
          <Text style={[styles.progressSummaryText, { color: colors.textMuted }]}>{completedLessons.length} of {orderedLessons.length} lessons completed</Text>
        </SurfaceCard>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Learning path" subtitle="Work through each level in curriculum order" />
        {LEVELS.map((level, index) => (
          <LevelSection
            key={level.id}
            levelId={level.id}
            label={level.label}
            description={level.description}
            lessons={orderedLessons.filter((lesson) => lesson.level === level.id)}
            currentLessonId={nextLesson?.lesson.id}
            initiallyExpanded={nextLesson?.lesson.level === level.id}
            isLast={index === LEVELS.length - 1}
          />
        ))}
        <View style={[styles.grammarLegend, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={[styles.grammarBadge, { backgroundColor: colors.warningSoft }]}><Text style={[styles.grammarBadgeText, { color: colors.warning }]}>G</Text></View>
          <Text style={[styles.grammarLegendText, { color: colors.textMuted }]}>Lessons marked G include a grammar explanation.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: designSpacing.gutter },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: designSpacing.gutter },
  headerCopy: { flex: 1 },
  greeting: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular", marginBottom: 2 },
  screenTitle: { fontSize: 28, lineHeight: 34, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  learnerContext: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_500Medium", marginTop: 2 },
  headerActions: { alignItems: "flex-end", gap: 8 },
  streakBadge: { minHeight: 32, paddingHorizontal: 10, borderRadius: designRadii.pill, flexDirection: "row", alignItems: "center", gap: 4 },
  streakText: { fontSize: 12, lineHeight: 16, fontFamily: "Inter_600SemiBold" },
  iconButton: { width: 48, height: 48, borderRadius: designRadii.control, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  primarySection: { marginBottom: designSpacing.gutter },
  learningPathLoading: { minHeight: 112, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 15, lineHeight: 23, fontFamily: "Inter_500Medium", textAlign: "center" },
  continueTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: designSpacing.element },
  continueTitle: { fontSize: 26, lineHeight: 33, fontFamily: "Inter_700Bold", letterSpacing: -0.2, marginBottom: 4 },
  continueDescription: { fontSize: 15, lineHeight: 23, fontFamily: "Inter_400Regular" },
  continueMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: designSpacing.card, marginTop: designSpacing.element },
  inlineMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },
  continueProgress: { marginVertical: designSpacing.card },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8 },
  progressLabel: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_500Medium" },
  progressValue: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_700Bold" },
  section: { marginBottom: designSpacing.section },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: designSpacing.compact, marginBottom: designSpacing.element },
  progressSummaryTitle: { fontSize: 16, lineHeight: 22, fontFamily: "Inter_600SemiBold" },
  progressSummaryText: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular", marginTop: 8 },
  levelSection: { position: "relative", marginBottom: designSpacing.element },
  pathConnector: { position: "absolute", top: 76, bottom: -designSpacing.element, left: 37, width: 2 },
  levelHeader: { zIndex: 1, minHeight: 84, flexDirection: "row", alignItems: "center", padding: designSpacing.card, borderRadius: designRadii.card, borderWidth: 1, gap: designSpacing.element },
  levelBadge: { width: 44, height: 44, borderRadius: designRadii.control, alignItems: "center", justifyContent: "center" },
  levelBadgeText: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_700Bold" },
  levelHeaderContent: { flex: 1, gap: 4 },
  levelTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  levelLabel: { flex: 1, fontSize: 17, lineHeight: 23, fontFamily: "Inter_700Bold" },
  levelDescription: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },
  levelProgressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  levelProgressBar: { flex: 1 },
  levelCount: { minWidth: 34, fontSize: 12, lineHeight: 17, fontFamily: "Inter_500Medium", textAlign: "right" },
  lessonList: { zIndex: 1, paddingTop: designSpacing.compact, gap: designSpacing.compact },
  lessonCard: { minHeight: 72, flexDirection: "row", alignItems: "center", borderRadius: designRadii.card, padding: designSpacing.element, gap: designSpacing.element, marginLeft: designSpacing.compact },
  lessonIcon: { width: 44, height: 44, borderRadius: designRadii.control, alignItems: "center", justifyContent: "center" },
  lessonInfo: { flex: 1, minWidth: 0 },
  lessonTitle: { fontSize: 17, lineHeight: 23, fontFamily: "Inter_600SemiBold", letterSpacing: -0.1, marginBottom: 2 },
  lessonMeta: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular" },
  lessonTrailing: { alignItems: "flex-end", justifyContent: "center", gap: 4 },
  grammarLegend: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: designRadii.control, marginTop: 4 },
  grammarBadge: { width: 24, height: 24, borderRadius: designRadii.small, alignItems: "center", justifyContent: "center" },
  grammarBadgeText: { fontSize: 11, lineHeight: 15, fontFamily: "Inter_700Bold" },
  grammarLegendText: { flex: 1, fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular" },
});
