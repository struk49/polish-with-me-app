import { useResolvedScheme } from "@/contexts/ThemeContext";
import colors from "@/constants/colors";

type ColorPalette = typeof colors.light;

export function useColors(): ColorPalette & { radius: number } {
  const scheme = useResolvedScheme();
  const palette = scheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
