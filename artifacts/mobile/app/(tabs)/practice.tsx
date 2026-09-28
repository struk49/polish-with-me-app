import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
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

import { ProgressBar, StatusBadge } from "@/components/HomePrimitives";
import { designRadii, designSpacing } from "@/constants/designSystem";
import { useProgress } from "@/contexts/ProgressContext";
import { isLevelFree } from "@/contexts/SubscriptionContext";
import { getOrderedLessons, type Lesson, type Word } from "@/data/lessons";
import { useDesignTokens } from "@/hooks/useDesignTokens";
import { getAccessiblePracticeSelection } from "@/lib/practiceAccess";
import { useSubscription } from "@/lib/revenuecat";

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
  const { colors } = useDesignTokens();
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
        <Text style={[styles.cardCounterText, { color: colors.textSecondary }]}>
          Card {cardIndex + 1} of {total}
        </Text>
        {known ? <StatusBadge label="KNOWN" backgroundColor={colors.successSoft} color={colors.success} icon="checkmark" /> : null}
      </View>

      <ProgressBar value={(cardIndex / total) * 100} height={6} label={`Practice progress, card ${cardIndex + 1} of ${total}`} />

      {/* Card area — scrolls so it never overlaps the buttons on short screens */}
      <ScrollView
        style={styles.cardScrollArea}
        contentContainerStyle={styles.cardScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showing ? `English: ${word.english}. Polish: ${word.polish}` : `Polish word: ${word.polish}`}
          accessibilityHint={showing ? "Flips back to the Polish side" : "Reveals the English translation"}
          onPress={handleFlip}
          style={styles.cardPressable}
        >
          <Animated.View
            style={[
              styles.card,
              cardStyle,
              { backgroundColor: colors.surfacePrimary, borderColor: showing ? colors.brandPrimary : colors.borderDefault },
            ]}
          >
            {!showing ? (
              <View style={styles.cardFace}>
                <Text style={[styles.cardHint, { color: colors.textMuted }]}>
                  POLISH
                </Text>
                <Text style={[styles.polishWord, { color: colors.textPrimary }]}>
                  {word.polish}
                </Text>
                <Text style={[styles.phoneticText, { color: colors.textSecondary }]}>
                  {word.phonetic}
                </Text>
                <View style={[styles.flipHint, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="sync-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.tapHint, { color: colors.textMuted }]}>Tap to reveal English</Text>
                </View>
              </View>
            ) : (
              <View style={styles.cardFace}>
                <Text style={[styles.cardHint, { color: colors.brandPrimary }]}>
                  ENGLISH
                </Text>
                <Text style={[styles.englishWord, { color: colors.brandPrimary }]}>
                  {word.english}
                </Text>
                <Text style={[styles.polishWordSmall, { color: colors.textPrimary }]}>
                  {word.polish}
                </Text>
                <Text style={[styles.phoneticText, { color: colors.textSecondary }]}>
                  {word.phonetic}
                </Text>
                {word.example ? (
                  <View style={[styles.exampleBox, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.exampleLabel, { color: colors.textMuted }]}>
                      EXAMPLE
                    </Text>
                    <Text style={[styles.exampleText, { color: colors.textPrimary }]}>
                      {word.example}
                    </Text>
                    {word.exampleTranslation ? (
                      <Text style={[styles.exampleTranslation, { color: colors.textSecondary }]}>
                        {word.exampleTranslation}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                <View style={[styles.flipHint, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="sync-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.tapHint, { color: colors.textMuted }]}>Tap to flip back</Text>
                </View>
              </View>
            )}
          </Animated.View>
        </Pressable>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Not yet"
          accessibilityHint="Marks this word for more review and moves to the next card"
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: pressed ? colors.surfaceSecondary : colors.surfacePrimary, borderColor: colors.borderStrong },
          ]}
          onPress={handleSkip}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Not yet</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Got it"
          accessibilityHint="Marks this word as known and moves to the next card"
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: pressed ? colors.brandPressed : colors.brandPrimary, borderColor: pressed ? colors.brandPressed : colors.brandPrimary },
          ]}
          onPress={handleKnow}
        >
          <Ionicons name="checkmark" size={20} color={colors.textInverse} />
          <Text style={[styles.actionBtnText, { color: colors.textInverse }]}>Got it</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function PracticeScreen() {
  const { colors } = useDesignTokens();
  const insets = useSafeAreaInsets();
  const { toggleKnownWord, isWordKnown, knownWords } = useProgress();
  const { isPremium, isEntitlementLoading } = useSubscription();
  const orderedLessons = getOrderedLessons();
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(orderedLessons[0]);
  const [cardIndex, setCardIndex] = useState(0);
  const [session, setSession] = useState({ known: 0, skipped: 0 });
  const [done, setDone] = useState(false);

  const visibleLessons = orderedLessons.filter(
    (l) => isPremium || isLevelFree(l.level)
  );
  const activeLesson =
    getAccessiblePracticeSelection({
      selectedLesson,
      accessibleLessons: visibleLessons,
      entitlementReady: !isEntitlementLoading,
    }) ?? selectedLesson;

  useEffect(() => {
    if (activeLesson.id === selectedLesson.id) return;

    setSelectedLesson(activeLesson);
    setCardIndex(0);
    setSession({ known: 0, skipped: 0 });
    setDone(false);
  }, [activeLesson, selectedLesson]);

  const words = activeLesson.words;

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

  const paddingTop = Platform.OS === "web" ? 67 + 16 : insets.top + designSpacing.card;
  const paddingBottom = Platform.OS === "web" ? 34 + 80 : insets.bottom + 80;

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.backgroundPrimary, paddingTop, paddingBottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Build your vocabulary</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Practice</Text>
        </View>
        <View style={[styles.wordsBadge, { backgroundColor: colors.brandSoft }]} accessible accessibilityLabel={`${knownWords.length} words mastered`}>
          <Ionicons name="ribbon-outline" size={16} color={colors.brandPrimary} />
          <Text style={[styles.wordsBadgeText, { color: colors.brandPrimary }]}>{knownWords.length}</Text>
        </View>
      </View>

      {/* Lesson picker */}
      <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Choose a lesson</Text>
      <FlatList
        horizontal
        data={visibleLessons}
        keyExtractor={(item) => item.id}
        style={styles.pickerFlatList}
        contentContainerStyle={styles.pickerList}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const active = activeLesson.id === item.id;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.level}, ${item.words.length} words`}
              accessibilityHint="Starts practice with this lesson"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.pickerChip,
                {
                  backgroundColor: active ? colors.brandSoft : pressed ? colors.surfaceSecondary : colors.surfacePrimary,
                  borderColor: active ? colors.brandPrimary : colors.borderDefault,
                  borderWidth: active ? 2 : 1,
                },
              ]}
              onPress={() => handleLessonSelect(item)}
            >
              <Text
                style={[
                  styles.pickerChipText,
                  { color: active ? colors.brandPrimary : colors.textPrimary },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.pickerChipSub,
                  { color: active ? colors.brandPrimary : colors.textMuted },
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
              { backgroundColor: colors.surfacePrimary, borderColor: colors.borderDefault },
            ]}
          >
            <View style={[styles.doneIcon, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="checkmark" size={30} color={colors.success} />
            </View>
            <View style={styles.doneHeading}>
              <Text style={[styles.doneTitle, { color: colors.textPrimary }]}>Practice complete</Text>
              <Text style={[styles.doneSubtitle, { color: colors.textSecondary }]}>{activeLesson.title}</Text>
            </View>
            <View style={styles.doneStats}>
              <View style={[styles.doneStat, { backgroundColor: colors.successSoft }]}>
                <Text style={[styles.doneStatNum, { color: colors.success }]}>
                  {session.known}
                </Text>
                <Text style={[styles.doneStatLabel, { color: colors.textSecondary }]}>
                  Got it
                </Text>
              </View>
              <View style={[styles.doneStat, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.doneStatNum, { color: colors.textPrimary }]}>
                  {session.skipped}
                </Text>
                <Text style={[styles.doneStatLabel, { color: colors.textSecondary }]}>
                  Review
                </Text>
              </View>
              <View style={[styles.doneStat, { backgroundColor: colors.brandSoft }]}>
                <Text style={[styles.doneStatNum, { color: colors.brandPrimary }]}>
                  {Math.round((session.known / words.length) * 100)}%
                </Text>
                <Text style={[styles.doneStatLabel, { color: colors.textSecondary }]}>
                  Score
                </Text>
              </View>
            </View>
            <Text style={[styles.knownTotal, { color: colors.textMuted }]}>
              {knownWords.length} total words mastered
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Practice again"
              accessibilityHint={`Restarts ${activeLesson.title} from the first card`}
              style={({ pressed }) => [
                styles.restartBtn,
                { backgroundColor: pressed ? colors.brandPressed : colors.brandPrimary },
              ]}
              onPress={restart}
            >
              <Text style={[styles.restartBtnText, { color: colors.textInverse }]}>Practice again</Text>
              <Ionicons name="refresh" size={20} color={colors.textInverse} />
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
    paddingHorizontal: designSpacing.gutter,
    marginBottom: designSpacing.card,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular", marginBottom: 2 },
  headerTitle: { fontSize: 28, lineHeight: 34, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  wordsBadge: {
    minWidth: 48,
    minHeight: 36,
    paddingHorizontal: designSpacing.element,
    borderRadius: designRadii.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  wordsBadgeText: { fontSize: 13, lineHeight: 18, fontFamily: "Inter_700Bold" },
  pickerLabel: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: designSpacing.gutter,
    marginBottom: designSpacing.compact,
  },
  pickerFlatList: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 76,
  },
  pickerList: {
    paddingHorizontal: designSpacing.gutter,
    paddingBottom: designSpacing.card,
    gap: designSpacing.compact,
    alignItems: "flex-start",
  },
  pickerChip: {
    minHeight: 56,
    paddingHorizontal: designSpacing.element,
    paddingVertical: designSpacing.compact,
    borderRadius: designRadii.control,
    borderWidth: 1,
    justifyContent: "center",
    gap: 1,
    alignSelf: "flex-start",
  },
  pickerChipText: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_600SemiBold" },
  pickerChipSub: { fontSize: 11, lineHeight: 16, fontFamily: "Inter_400Regular" },
  cardArea: {
    flex: 1,
    paddingHorizontal: designSpacing.gutter,
    paddingTop: 2,
    paddingBottom: designSpacing.card,
  },
  flashContainer: {
    flex: 1,
    gap: designSpacing.element,
  },
  cardCounter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  cardCounterText: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_500Medium" },
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
    minHeight: 248,
    borderRadius: designRadii.feature,
    borderWidth: 2,
    overflow: "hidden",
    justifyContent: "center",
  },
  cardFace: {
    alignItems: "center",
    justifyContent: "center",
    padding: designSpacing.section,
    gap: designSpacing.compact,
  },
  cardHint: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  polishWord: {
    fontSize: 32,
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
  flipHint: { minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: designRadii.pill, paddingHorizontal: designSpacing.element, marginTop: 4 },
  tapHint: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_500Medium" },
  phoneticText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    textAlign: "center",
  },
  exampleBox: {
    borderRadius: designRadii.control,
    padding: designSpacing.element,
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
    gap: designSpacing.element,
  },
  actionBtn: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: designSpacing.element,
    paddingVertical: designSpacing.element,
    borderRadius: designRadii.control,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  actionBtnText: { fontSize: 15, lineHeight: 20, fontFamily: "Inter_600SemiBold" },
  doneCard: {
    borderRadius: designRadii.feature,
    borderWidth: 1,
    padding: designSpacing.gutter,
    alignItems: "center",
    gap: designSpacing.card,
  },
  doneIcon: { width: 56, height: 56, borderRadius: designRadii.pill, alignItems: "center", justifyContent: "center" },
  doneHeading: { alignItems: "center", gap: 2 },
  doneTitle: { fontSize: 24, lineHeight: 31, fontFamily: "Inter_700Bold", textAlign: "center" },
  doneSubtitle: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular", textAlign: "center" },
  doneStats: { width: "100%", flexDirection: "row", gap: designSpacing.compact },
  doneStat: { flex: 1, minWidth: 0, alignItems: "center", gap: 2, paddingVertical: designSpacing.element, borderRadius: designRadii.control },
  doneStatNum: { fontSize: 22, lineHeight: 28, fontFamily: "Inter_700Bold" },
  doneStatLabel: { fontSize: 11, lineHeight: 16, fontFamily: "Inter_500Medium" },
  knownTotal: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular", textAlign: "center" },
  restartBtn: {
    width: "100%",
    minHeight: 48,
    paddingHorizontal: designSpacing.card,
    borderRadius: designRadii.control,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: designSpacing.compact,
  },
  restartBtnText: { fontSize: 16, lineHeight: 20, fontFamily: "Inter_600SemiBold" },
});
