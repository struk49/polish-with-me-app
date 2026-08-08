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

import { PHRASE_CATEGORIES, PHRASES, type Phrase } from "@/data/lessons";
import { useColors } from "@/hooks/useColors";

function PhraseItem({ phrase }: { phrase: Phrase }) {
  const colors = useColors();
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
      style={({ pressed }) => [
        styles.phraseCard,
        {
          backgroundColor: colors.card,
          borderColor: speaking ? colors.primary + "50" : colors.border,
          opacity: pressed ? 0.85 : 1,
          borderWidth: speaking ? 1.5 : 1,
        },
      ]}
      onPress={handleSpeak}
    >
      <View style={styles.phraseContent}>
        <Text style={[styles.polishText, { color: colors.foreground }]}>
          {phrase.polish}
        </Text>
        <Text style={[styles.phoneticText, { color: colors.mutedForeground }]}>
          {phrase.phonetic}
        </Text>
        <Text style={[styles.englishText, { color: colors.mutedForeground }]}>
          {phrase.english}
        </Text>
      </View>
      <Ionicons
        name={speaking ? "volume-high" : "volume-medium-outline"}
        size={22}
        color={speaking ? colors.primary : colors.mutedForeground}
      />
    </Pressable>
  );
}

export default function PhrasebookScreen() {
  const colors = useColors();
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
          backgroundColor: colors.background,
          paddingTop: Platform.OS === "web" ? 67 : 0,
        },
      ]}
    >
      {/* Search Bar */}
      <View style={[styles.searchRow, { paddingTop: 16 }]}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search phrases..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.mutedForeground}
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
              style={({ pressed }) => [
                styles.categoryChip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => {
                setActiveCategory(item);
                Haptics.selectionAsync();
              }}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  {
                    color: active
                      ? colors.primaryForeground
                      : colors.foreground,
                  },
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
          <View style={styles.empty}>
            <Ionicons
              name="search-outline"
              size={40}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No phrases found
            </Text>
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
  searchRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  categoryFlatList: {
    flexGrow: 0,
    flexShrink: 0,
  },
  categoryList: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
    alignItems: "flex-start",
  },
  phraseFlatList: {
    flex: 1,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  list: {
    paddingHorizontal: 20,
    gap: 0,
  },
  phraseCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  phraseContent: {
    flex: 1,
    gap: 3,
  },
  polishText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  phoneticText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  englishText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
});
