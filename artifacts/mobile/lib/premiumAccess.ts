export const FREE_LEVELS = ["A1"] as const;

export function isLevelFree(level: string): boolean {
  return FREE_LEVELS.includes(level as "A1");
}

export function canAccessLevel(isPremium: boolean, level: string): boolean {
  return isPremium || isLevelFree(level);
}
