export const designSpacing = {
  compact: 8,
  element: 12,
  card: 16,
  gutter: 20,
  section: 24,
  large: 32,
} as const;

export const designRadii = {
  small: 8,
  control: 12,
  card: 16,
  feature: 20,
  pill: 999,
} as const;

export const designColors = {
  light: {
    backgroundPrimary: "#FAFAF8", backgroundSecondary: "#F3F2EF",
    surfacePrimary: "#FFFFFF", surfaceSecondary: "#F6F5F2",
    textPrimary: "#1C1C1E", textSecondary: "#4D4D52", textMuted: "#6F7076", textInverse: "#FFFFFF",
    borderDefault: "#E2E1DE", borderStrong: "#B8B7B3",
    brandPrimary: "#C8102E", brandPressed: "#A90D27", brandSoft: "#FBEAEC",
    success: "#187A3D", successSoft: "#E7F5EC",
    warning: "#A85A00", warningSoft: "#FFF2DD",
    proPrimary: "#A50E28", proSoft: "#F8E7EB",
    lockedIcon: "#73747A", lockedSurface: "#F1F0ED",
    progressTrack: "#E8E7E3", xp: "#7540A1",
  },
  dark: {
    backgroundPrimary: "#18181A", backgroundSecondary: "#202023",
    surfacePrimary: "#29292D", surfaceSecondary: "#323237",
    textPrimary: "#F5F5F7", textSecondary: "#C9C9CF", textMuted: "#A7A7AF", textInverse: "#18181A",
    borderDefault: "#3E3E44", borderStrong: "#5C5C64",
    brandPrimary: "#FF5A5F", brandPressed: "#FF7377", brandSoft: "#3A2025",
    success: "#55D982", successSoft: "#193526",
    warning: "#FFB14A", warningSoft: "#3B2C18",
    proPrimary: "#FF777B", proSoft: "#3A2228",
    lockedIcon: "#A8A8B0", lockedSurface: "#252529",
    progressTrack: "#3A3A40", xp: "#C88BEA",
  },
} as const;

export const levelColors = {
  light: {
    A1: { strong: "#187A3D", soft: "#E7F5EC" },
    A2: { strong: "#A85A00", soft: "#FFF2DD" },
    B1: { strong: "#7540A1", soft: "#F1E9F8" },
    B2: { strong: "#A50E28", soft: "#F8E7EB" },
  },
  dark: {
    A1: { strong: "#55D982", soft: "#193526" },
    A2: { strong: "#FFB14A", soft: "#3B2C18" },
    B1: { strong: "#C88BEA", soft: "#30243A" },
    B2: { strong: "#FF777B", soft: "#3A2228" },
  },
} as const;
