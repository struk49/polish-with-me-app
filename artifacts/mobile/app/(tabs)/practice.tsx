import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useProgress } from "@/contexts/ProgressContext";
import { isLevelFree } from "@/contexts/SubscriptionContext";
import { useSubscription } from "@/lib/revenuecat";
import { getOrderedLessons, type Lesson, type Word } from "@/data/lessons";
import { useColors } from "@/hooks/useColors";

function FlashCard({
  word,
  onKnow,
  onSkip,
  cardIndex,
  total,
}: {
  word: Word;
  onKnow: () => void;
  onSkip: () => void;
  cardIndex: number;
  total: number;
}) {
  const colors = useColors();
  const [showing, setShowing] = useState(false);
  const scaleX = useSharedValue(1);
  const { isWordKnown } = useProgress();
  const known = isWordKnown(word.id);

  const handleFlip = useCallback(() => {
    Haptics.selectionAsync();
    scaleX.value = withSequence(
      withTiming(0, { duration: 140 }),
      withTiming(1, { duration: 140 })
    );
    setTimeout(() => setShowing((s) => !s), 140);
  }, [scaleX]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: scaleX.value }],
  }));

  const handleKnow = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onKnow();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  };

  return (
    <View style={styles.flashContainer}>
      {/* Counter */}
      <View style={styles.cardCounter}>
        <Text style={[styles.cardCounterText, { color: colors.mutedForeground }]}>
          {cardIndex + 1} / {total}
        </Text>
        {known && (
          <View style={[styles.knownBadge, { backgroundColor: colors.success + "20" }]}>
            <Text style={[styles.knownBadgeText, { color: colors.success }]}>Known ✓</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${((cardIndex) / total) * 100}%` as any,
            },
          ]}
        />
      </View>

      {/* Card area — scrolls so it never overlaps the buttons on short screens */}
      <ScrollView
        style={styles.cardScrollArea}
        contentContainerStyle={styles.cardScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={handleFlip} style={styles.cardPressable}>
          <Animated.View
            style={[
              styles.card,
              cardStyle,
              { backgroundColor: colors.card, borderColor: showing ? colors.primary + "60" : colors.border },
            ]}
          >
            {!showing ? (
              <View style={styles.cardFace}>
                <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>
                  POLISH
                </Text>
                <Text style={[styles.polishWord, { color: colors.foreground }]}>
                  {word.polish}
                </Text>
                <Text style={[styles.phoneticText, { color: colors.mutedForeground }]}>
                  {word.phonetic}
                </Text>
                <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>
                  Tap to reveal English
                </Text>
              </View>
            ) : (
              <View style={styles.cardFace}>
                <Text style={[styles.cardHint, { color: colors.primary }]}>
                  ENGLISH
                </Text>
                <Text style={[styles.englishWord, { color: colors.primary }]}>
                  {word.english}
                </Text>
                <Text style={[styles.polishWordSmall, { color: colors.foreground }]}>
                  {word.polish}
                </Text>
                <Text style={[styles.phoneticText, { color: colors.mutedForeground }]}>
                  {word.phonetic}
                </Text>
                {word.example ? (
                  <View style={[styles.exampleBox, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.exampleLabel, { color: colors.mutedForeground }]}>
                      EXAMPLE
                    </Text>
                    <Text style={[styles.exampleText, { color: colors.foreground }]}>
                      {word.example}
                    </Text>
                    {word.exampleTranslation ? (
                      <Text style={[styles.exampleTranslation, { color: colors.mutedForeground }]}>
                        {word.exampleTranslation}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>
                  Tap to flip back
                </Text>
              </View>
            )}
          </Animated.View>
        </Pressable>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={handleSkip}
        >
          <Text style={styles.actionEmoji}>🔄</Text>
          <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Not yet</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleKnow}
        >
          <Text style={styles.actionEmoji}>✓</Text>
          <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Got it!</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function PracticeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toggleKnownWord, isWordKnown, knownWords } = useProgress();
  const { isPremium } = useSubscription();
  const orderedLessons = getOrderedLessons();
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(orderedLessons[0]);
  const [cardIndex, setCardIndex] = useState(0);
  const [session, setSession] = useState({ known: 0, skipped: 0 });
  const [done, setDone] = useState(false);

  const visibleLessons = orderedLessons.filter(
    (l) => isPremium || isLevelFree(l.level)
  );

  const words = selectedLesson.words;

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCardIndex(0);
    setSession({ known: 0, skipped: 0 });
    setDone(false);
  };

  const advance = (knew: boolean) => {
    const word = words[cardIndex];
    if (knew && !isWordKnown(word.id)) toggleKnownWord(word.id);
    setSession((s) => ({
      known: knew ? s.known + 1 : s.known,
      skipped: knew ? s.skipped : s.skipped + 1,
    }));
    if (cardIndex + 1 >= words.length) {
      setDone(true);
    } else {
      setCardIndex((i) => i + 1);
    }
  };

  const restart = () => {
    setCardIndex(0);
    setSession({ known: 0, skipped: 0 });
    setDone(false);
  };

  const paddingTop = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const paddingBottom = Platform.OS === "web" ? 34 + 80 : insets.bottom + 80;

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop, paddingBottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Practice</Text>
        <View style={[styles.wordsBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.wordsBadgeText, { color: colors.primary }]}>
            {knownWords.length} words mastered
          </Text>
        </View>
      </View>

      {/* Lesson picker */}
      <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>
        CHOOSE LESSON
      </Text>
      <FlatList
        horizontal
        data={visibleLessons}
        keyExtractor={(item) => item.id}
        style={styles.pickerFlatList}
        contentContainerStyle={styles.pickerList}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const active = selectedLesson.id === item.id;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.pickerChip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => handleLessonSelect(item)}
            >
              <Text
                style={[
                  styles.pickerChipText,
                  { color: active ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.pickerChipSub,
                  { color: active ? colors.primaryForeground + "BB" : colors.mutedForeground },
                ]}
              >
                {item.words.length} words
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Card area */}
      <View style={styles.cardArea}>
        {done ? (
          <View
            style={[
              styles.doneCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={[styles.doneTitle, { color: colors.foreground }]}>
              Session Complete!
            </Text>
            <View style={styles.doneStats}>
              <View style={styles.doneStat}>
                <Text style={[styles.doneStatNum, { color: colors.success }]}>
                  {session.known}
                </Text>
                <Text style={[styles.doneStatLabel, { color: colors.mutedForeground }]}>
                  Got it
                </Text>
              </View>
              <View style={[styles.doneStatDiv, { backgroundColor: colors.border }]} />
              <View style={styles.doneStat}>
                <Text style={[styles.doneStatNum, { color: colors.mutedForeground }]}>
                  {session.skipped}
                </Text>
                <Text style={[styles.doneStatLabel, { color: colors.mutedForeground }]}>
                  Review
                </Text>
              </View>
              <View style={[styles.doneStatDiv, { backgroundColor: colors.border }]} />
              <View style={styles.doneStat}>
                <Text style={[styles.doneStatNum, { color: colors.primary }]}>
                  {Math.round((session.known / words.length) * 100)}%
                </Text>
                <Text style={[styles.doneStatLabel, { color: colors.mutedForeground }]}>
                  Score
                </Text>
              </View>
            </View>
            <Text style={[styles.knownTotal, { color: colors.mutedForeground }]}>
              {knownWords.length} total words mastered
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.restartBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={restart}
            >
              <Text style={[styles.restartBtnText, { color: colors.primaryForeground }]}>
                Practice Again
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlashCard
            key={cardIndex}
            word={words[cardIndex]}
            onKnow={() => advance(true)}
            onSkip={() => advance(false)}
            cardIndex={cardIndex}
            total={words.length}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  wordsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  wordsBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  pickerLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  pickerFlatList: {
    flexGrow: 0,
    flexShrink: 0,
    height: 76,
  },
  pickerList: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
    alignItems: "flex-start",
  },
  pickerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    alignSelf: "flex-start",
  },
  pickerChipText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  pickerChipSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cardArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  flashContainer: {
    flex: 1,
    gap: 12,
  },
  cardCounter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  cardCounterText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  knownBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  knownBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  cardScrollArea: {
    flex: 1,
  },
  cardScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  cardPressable: {
    width: "100%",
  },
  card: {
    width: "100%",
    minHeight: 260,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
    justifyContent: "center",
  },
  cardFace: {
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 10,
  },
  cardHint: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  polishWord: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  polishWordSmall: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  englishWord: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 36,
  },
  tapHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  phoneticText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    textAlign: "center",
  },
  exampleBox: {
    borderRadius: 12,
    padding: 14,
    width: "100%",
    gap: 4,
    marginTop: 4,
  },
  exampleLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 2,
    textAlign: "center",
  },
  exampleText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 20,
  },
  exampleTranslation: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  actionEmoji: { fontSize: 18 },
  actionBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  doneCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 16,
  },
  doneEmoji: { fontSize: 48 },
  doneTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  doneStats: { flexDirection: "row", alignItems: "center", gap: 20 },
  doneStat: { alignItems: "center", gap: 4 },
  doneStatNum: { fontSize: 30, fontFamily: "Inter_700Bold" },
  doneStatLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  doneStatDiv: { width: 1, height: 36 },
  knownTotal: { fontSize: 14, fontFamily: "Inter_400Regular" },
  restartBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  restartBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
