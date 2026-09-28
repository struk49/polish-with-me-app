import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { designRadii, designSpacing } from "@/constants/designSystem";
import { PHRASE_CATEGORIES, PHRASES, type Phrase } from "@/data/lessons";
import { useDesignTokens } from "@/hooks/useDesignTokens";

function PhraseItem({ phrase }: { phrase: Phrase }) {
  const { colors } = useDesignTokens();
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = async () => {
    await Haptics.selectionAsync();

    if (speaking) {
      await Speech.stop();
      setSpeaking(false);
      return;
    }

    // Expo Speech 14 (SDK 54) passes Android's language value to
    // java.util.Locale(String), which expects "pl" rather than "pl-PL".
    // Clear the native queue first so repeated taps play immediately.
    await Speech.stop();

    Speech.speak(phrase.polish, {
      language: Platform.OS === "android" ? "pl" : "pl-PL",
      rate: 0.85,
      pitch: 1,
      volume: 1,
      onStart: () => setSpeaking(true),
      onDone: () => setSpeaking(false),
      onError: () => {
        setSpeaking(false);
        Alert.alert(
          "Speech unavailable",
          "Please install or enable a text-to-speech engine and the Polish voice in your phone settings.",
        );
      },
      onStopped: () => setSpeaking(false),
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${phrase.polish}. ${phrase.english}. Pronunciation: ${phrase.phonetic}`}
      accessibilityHint={speaking ? "Stops pronunciation playback" : "Plays the Polish pronunciation"}
      accessibilityState={{ selected: speaking }}
      style={({ pressed }) => [
        styles.phraseCard,
        {
          backgroundColor: pressed ? colors.surfaceSecondary : colors.surfacePrimary,
          borderColor: speaking ? colors.brandPrimary : colors.borderDefault,
          borderWidth: speaking ? 2 : 1,
        },
      ]}
      onPress={handleSpeak}
    >
      <View style={styles.phraseContent}>
        <Text style={[styles.polishText, { color: colors.textPrimary }]}>
          {phrase.polish}
        </Text>
        <Text style={[styles.englishText, { color: colors.textSecondary }]}>
          {phrase.english}
        </Text>
        <View style={styles.pronunciationRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.phoneticText, { color: colors.textMuted }]}>{phrase.phonetic}</Text>
        </View>
      </View>
      <View style={[styles.audioControl, { backgroundColor: speaking ? colors.brandSoft : colors.backgroundSecondary }]}>
        <Ionicons
          name={speaking ? "stop" : "volume-medium-outline"}
          size={21}
          color={speaking ? colors.brandPrimary : colors.textSecondary}
        />
      </View>
    </Pressable>
  );
}

export default function PhrasebookScreen() {
  const { colors } = useDesignTokens();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(() => {
    return PHRASES.filter((p) => {
      const matchesCategory =
        activeCategory === "All" || p.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.polish.toLowerCase().includes(q) ||
        p.english.toLowerCase().includes(q) ||
        p.phonetic.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.backgroundPrimary,
          paddingTop: Platform.OS === "web" ? 83 : designSpacing.card,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Everyday Polish, close at hand</Text>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Phrases</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Find the words you need and hear how they sound.</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.surfacePrimary, borderColor: colors.borderDefault },
          ]}
        >
          <Ionicons name="search" size={19} color={colors.textMuted} />
          <TextInput
            accessibilityLabel="Search phrases"
            accessibilityHint="Searches Polish, English, and pronunciation text"
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search phrases..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear phrase search"
              accessibilityHint="Clears the current search text"
              onPress={() => setSearch("")}
              style={({ pressed }) => [styles.searchClear, { backgroundColor: pressed ? colors.backgroundSecondary : "transparent" }]}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category Chips */}
      <FlatList
        horizontal
        data={PHRASE_CATEGORIES}
        keyExtractor={(item) => item}
        style={styles.categoryFlatList}
        contentContainerStyle={styles.categoryList}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const active = activeCategory === item;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item} category`}
              accessibilityHint="Filters the phrase list"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.categoryChip,
                {
                  backgroundColor: active ? colors.brandSoft : pressed ? colors.surfaceSecondary : colors.surfacePrimary,
                  borderColor: active ? colors.brandPrimary : colors.borderDefault,
                  borderWidth: active ? 2 : 1,
                },
              ]}
              onPress={() => {
                setActiveCategory(item);
                Haptics.selectionAsync();
              }}
            >
              {active ? <Ionicons name="checkmark" size={16} color={colors.brandPrimary} /> : null}
              <Text
                style={[
                  styles.categoryChipText,
                  { color: active ? colors.brandPrimary : colors.textPrimary },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Phrase List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={styles.phraseFlatList}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom:
              Platform.OS === "web" ? 34 + 100 : insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderDefault }]}>
            <Ionicons
              name="search-outline"
              size={28}
              color={colors.textMuted}
            />
            <View style={styles.emptyCopy}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No phrases found</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Try another search or category.</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <PhraseItem phrase={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: designSpacing.gutter,
    marginBottom: designSpacing.card,
  },
  eyebrow: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular", marginBottom: 2 },
  headerTitle: { fontSize: 28, lineHeight: 34, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular", marginTop: 3 },
  searchRow: {
    paddingHorizontal: designSpacing.gutter,
    paddingBottom: designSpacing.element,
  },
  searchBox: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: designSpacing.compact,
    paddingLeft: designSpacing.element,
    paddingRight: 4,
    borderRadius: designRadii.control,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
    paddingVertical: designSpacing.element,
  },
  searchClear: { width: 48, minHeight: 48, borderRadius: designRadii.control, alignItems: "center", justifyContent: "center" },
  categoryFlatList: {
    flexGrow: 0,
    flexShrink: 0,
  },
  categoryList: {
    paddingHorizontal: designSpacing.gutter,
    paddingBottom: designSpacing.element,
    gap: designSpacing.compact,
    alignItems: "flex-start",
  },
  phraseFlatList: {
    flex: 1,
  },
  categoryChip: {
    minHeight: 48,
    paddingHorizontal: designSpacing.element,
    borderRadius: designRadii.pill,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  categoryChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    paddingHorizontal: designSpacing.gutter,
    gap: designSpacing.compact,
  },
  phraseCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: designSpacing.element,
    borderRadius: designRadii.card,
    borderWidth: 1,
    gap: designSpacing.element,
  },
  phraseContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  polishText: {
    fontSize: 18,
    lineHeight: 25,
    fontFamily: "Inter_600SemiBold",
  },
  englishText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  pronunciationRow: { flexDirection: "row", alignItems: "flex-start", gap: 5, marginTop: 2 },
  phoneticText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  audioControl: { width: 48, height: 48, flexShrink: 0, borderRadius: designRadii.control, alignItems: "center", justifyContent: "center" },
  empty: {
    flexDirection: "row",
    alignItems: "center",
    padding: designSpacing.card,
    borderRadius: designRadii.card,
    borderWidth: 1,
    gap: designSpacing.element,
    marginTop: designSpacing.compact,
  },
  emptyCopy: { flex: 1, gap: 2 },
  emptyTitle: { fontSize: 16, lineHeight: 22, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
  },
});
