import { designColors, levelColors } from "@/constants/designSystem";
import { useResolvedScheme } from "@/contexts/ThemeContext";

export function useDesignTokens() {
  const scheme = useResolvedScheme();
  return { scheme, colors: designColors[scheme], levels: levelColors[scheme] };
}
