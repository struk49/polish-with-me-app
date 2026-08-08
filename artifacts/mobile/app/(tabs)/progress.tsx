import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useProgress } from "@/contexts/ProgressContext";
import { useTheme, type ThemePref } from "@/contexts/ThemeContext";
import { LESSONS } from "@/data/lessons";
import { useColors } from "@/hooks/useColors";

interface AchievementProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  unlocked: boolean;
}

function Achievement({ icon, title, description, unlocked }: AchievementProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.achievement,
        {
          backgroundColor: colors.card,
          borderColor: unlocked ? colors.primary + "40" : colors.border,
          borderWidth: unlocked ? 1.5 : 1,
          opacity: unlocked ? 1 : 0.5,
        },
      ]}
    >
      <View
        style={[
          styles.achievementIcon,
          {
            backgroundColor: unlocked
              ? colors.primary + "15"
              : colors.secondary,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={unlocked ? colors.primary : colors.mutedForeground}
        />
      </View>
      <View style={styles.achievementText}>
        <Text style={[styles.achievementTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        <Text
          style={[styles.achievementDesc, { color: colors.mutedForeground }]}
        >
          {description}
        </Text>
      </View>
      {unlocked && (
        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
      )}
    </View>
  );
}

const THEME_OPTIONS: {
  value: ThemePref;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: "system", label: "System", icon: "phone-portrait-outline" },
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
];

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pref, setPref } = useTheme();
  const {
    completedLessons,
    quizScores,
    streak,
    totalXP,
    knownWords,
    resetProgress,
  } = useProgress();

  const averageScore =
    Object.values(quizScores).length > 0
      ? Math.round(
          Object.values(quizScores).reduce((a, b) => a + b, 0) /
            Object.values(quizScores).length
        )
      : 0;

  const level = Math.floor(totalXP / 100) + 1;
  const xpToNextLevel = 100 - (totalXP % 100);

  const handleReset = () => {
    Alert.alert(
      "Reset Progress",
      "This will delete all your progress. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetProgress();
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning
            );
          },
        },
      ]
    );
  };

  const handleSendFeedback = () => {
    const subject = encodeURIComponent("Polish with Me feedback");
    const body = encodeURIComponent(
      "Hi Andrew,\n\nI have feedback about Polish with Me:\n\nWhat I liked:\n\nWhat was confusing:\n\nWhat I would improve:\n\nMy Android device:\n",
    );
    Linking.openURL(`mailto:podgeaisolutions@gmail.com?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert(
        "Email unavailable",
        "Please email feedback to podgeaisolutions@gmail.com.",
      );
    });
  };

  const achievements: AchievementProps[] = [
    {
      icon: "star",
      title: "First Steps",
      description: "Complete your first lesson",
      unlocked: completedLessons.length >= 1,
    },
    {
      icon: "flame",
      title: "On Fire",
      description: "Maintain a 3-day streak",
      unlocked: streak >= 3,
    },
    {
      icon: "book",
      title: "Bookworm",
      description: "Complete 5 lessons",
      unlocked: completedLessons.length >= 5,
    },
    {
      icon: "trophy",
      title: "Scholar",
      description: "Complete all 8 lessons",
      unlocked: completedLessons.length >= 8,
    },
    {
      icon: "bulb",
      title: "Vocabulary Pro",
      description: "Learn 30 words",
      unlocked: knownWords.length >= 30,
    },
    {
      icon: "ribbon",
      title: "Quiz Master",
      description: "Score 90%+ on any quiz",
      unlocked: Object.values(quizScores).some((s) => s >= 90),
    },
    {
      icon: "medal",
      title: "Streak Champion",
      description: "Maintain a 7-day streak",
      unlocked: streak >= 7,
    },
    {
      icon: "diamond",
      title: "Polish Expert",
      description: "Earn 500 XP",
      unlocked: totalXP >= 500,
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? 67 + 16 : 16,
          paddingBottom:
            Platform.OS === "web" ? 34 + 100 : insets.bottom + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={[styles.title, { color: colors.foreground }]}>
        Your Progress
      </Text>

      {/* Level Card */}
      <View
        style={[
          styles.levelCard,
          { backgroundColor: colors.primary },
        ]}
      >
        <View style={styles.levelTop}>
          <View>
            <Text style={[styles.levelLabel, { color: "rgba(255,255,255,0.7)" }]}>
              LEVEL
            </Text>
            <Text style={[styles.levelNum, { color: "#FFFFFF" }]}>
              {level}
            </Text>
          </View>
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={32} color="rgba(255,255,255,0.9)" />
            <Text style={[styles.streakNum, { color: "#FFFFFF" }]}>
              {streak}
            </Text>
            <Text style={[styles.streakLabel, { color: "rgba(255,255,255,0.7)" }]}>
              day streak
            </Text>
          </View>
        </View>
        <View>
          <View style={styles.xpRow}>
            <Text style={[styles.xpText, { color: "rgba(255,255,255,0.9)" }]}>
              {totalXP} XP
            </Text>
            <Text style={[styles.xpNext, { color: "rgba(255,255,255,0.6)" }]}>
              {xpToNextLevel} to level {level + 1}
            </Text>
          </View>
          <View style={styles.xpTrack}>
            <View
              style={[
                styles.xpFill,
                { width: `${100 - xpToNextLevel}%` as any },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          {
            icon: "book" as const,
            value: `${completedLessons.length}/${LESSONS.length}`,
            label: "Lessons Done",
          },
          {
            icon: "library" as const,
            value: knownWords.length,
            label: "Words Learned",
          },
          {
            icon: "school" as const,
            value: Object.keys(quizScores).length,
            label: "Quizzes Taken",
          },
          {
            icon: "analytics" as const,
            value: `${averageScore}%`,
            label: "Avg Score",
          },
        ].map((stat) => (
          <View
            key={stat.label}
            style={[
              styles.statBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name={stat.icon}
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Achievements */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Achievements
      </Text>
      <View style={styles.achievements}>
        {achievements.map((a) => (
          <Achievement key={a.title} {...a} />
        ))}
      </View>

      {/* Appearance */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Appearance
      </Text>
      <View
        style={[
          styles.segmented,
          { backgroundColor: colors.secondary, borderColor: colors.border },
        ]}
      >
        {THEME_OPTIONS.map((opt) => {
          const active = pref === opt.value;
          return (
            <Pressable
              key={opt.value}
              style={[
                styles.segment,
                active && {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setPref(opt.value);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${opt.label} theme`}
            >
              <Ionicons
                name={opt.icon}
                size={16}
                color={active ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: active ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Feedback */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Help Improve the App
      </Text>
      <View style={[styles.feedbackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.feedbackHeader}>
          <View style={[styles.feedbackIcon, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.feedbackTextWrap}>
            <Text style={[styles.feedbackTitle, { color: colors.foreground }]}>
              Send feedback
            </Text>
            <Text style={[styles.feedbackText, { color: colors.mutedForeground }]}>
              Tell us what felt useful, confusing, broken or missing. Your suggestions help shape the next version.
            </Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.feedbackButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleSendFeedback}
        >
          <Text style={[styles.feedbackButtonText, { color: colors.primaryForeground }]}>
            Email Feedback
          </Text>
          <Ionicons name="mail-outline" size={17} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {/* Reset */}
      <Pressable
        style={({ pressed }) => [
          styles.resetBtn,
          {
            borderColor: colors.destructive + "60",
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        onPress={handleReset}
      >
        <Ionicons name="refresh" size={18} color={colors.destructive} />
        <Text style={[styles.resetText, { color: colors.destructive }]}>
          Reset Progress
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  levelCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    gap: 16,
  },
  levelTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  levelLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  levelNum: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    lineHeight: 56,
  },
  streakContainer: {
    alignItems: "center",
    gap: 2,
  },
  streakNum: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  streakLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  xpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  xpText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  xpNext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  xpTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    width: "47.5%",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  achievements: {
    gap: 10,
    marginBottom: 24,
  },
  achievement: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  segmented: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: 24,
  },
  feedbackCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    marginBottom: 24,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  feedbackIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackTextWrap: { flex: 1, gap: 4 },
  feedbackTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  feedbackText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  feedbackButtonText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  segmentText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  resetText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
