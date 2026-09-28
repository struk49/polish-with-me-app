export function getAccessiblePracticeSelection<T extends { id: string }>({
  selectedLesson,
  accessibleLessons,
  entitlementReady,
}: {
  selectedLesson: T;
  accessibleLessons: T[];
  entitlementReady: boolean;
}): T | null {
  if (!entitlementReady) return selectedLesson;

  return (
    accessibleLessons.find((lesson) => lesson.id === selectedLesson.id) ??
    accessibleLessons[0] ??
    null
  );
}
