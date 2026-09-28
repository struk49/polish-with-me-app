import { Link, Stack } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function NotFoundScreen() {
  const colors = useColors();

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.container}
      >
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>
          This screen doesn&apos;t exist.
        </Text>

        <Link
          href="/"
          accessibilityRole="link"
          accessibilityLabel="Go to Home"
          accessibilityHint="Returns to the app home screen"
          style={styles.link}
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Go to home screen!
          </Text>
        </Link>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    maxWidth: "100%",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  link: {
    marginTop: 15,
    minHeight: 48,
    minWidth: 48,
    paddingVertical: 15,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  linkText: {
    fontSize: 14,
    textAlign: "center",
  },
});
