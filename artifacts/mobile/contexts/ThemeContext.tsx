import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { captureOperationalError } from "@/lib/observability";

export type ThemePref = "light" | "dark" | "system";
export type ResolvedScheme = "light" | "dark";

interface ThemeContextType {
  /** The user's chosen preference. */
  pref: ThemePref;
  /** The scheme actually applied right now ("system" resolved against the OS). */
  scheme: ResolvedScheme;
  setPref: (pref: ThemePref) => void;
}

const STORAGE_KEY = "@polish_theme_v1";

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw === "light" || raw === "dark" || raw === "system") {
          setPrefState(raw);
        }
      })
      .catch((error) => {
        captureOperationalError({ category: "STORAGE_READ_FAILURE", operation: "storage", storage: "theme", error });
      })
      .finally(() => setLoaded(true));
  }, []);

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch((error) => {
      captureOperationalError({ category: "STORAGE_WRITE_FAILURE", operation: "storage", storage: "theme", error });
    });
  }, []);

  const scheme: ResolvedScheme =
    pref === "system" ? (systemScheme === "dark" ? "dark" : "light") : pref;

  const value = useMemo(
    () => ({ pref, scheme, setPref }),
    [pref, scheme, setPref]
  );

  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/**
 * Resolved "light" | "dark" scheme. Falls back to the OS scheme when used
 * outside a ThemeProvider so low-level consumers never crash.
 */
export function useResolvedScheme(): ResolvedScheme {
  const ctx = useContext(ThemeContext);
  const systemScheme = useColorScheme();
  if (ctx) return ctx.scheme;
  return systemScheme === "dark" ? "dark" : "light";
}
