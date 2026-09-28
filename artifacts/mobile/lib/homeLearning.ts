export type HomeLesson = { id: string; level: string };

export type NextLessonResult<TLesson extends HomeLesson> = {
  lesson: TLesson;
  mode: "start" | "continue" | "review";
};

export function getNextAccessibleLesson<TLesson extends HomeLesson>({
  orderedLessons,
  completedLessonIds,
  canAccess,
}: {
  orderedLessons: TLesson[];
  completedLessonIds: string[];
  canAccess: (lesson: TLesson) => boolean;
}): NextLessonResult<TLesson> | null {
  const accessibleLessons = orderedLessons.filter(canAccess);
  if (accessibleLessons.length === 0) return null;

  const completed = new Set(completedLessonIds);
  const nextIncomplete = accessibleLessons.find((lesson) => !completed.has(lesson.id));
  if (nextIncomplete) {
    const hasCompletedAccessibleLesson = accessibleLessons.some((lesson) =>
      completed.has(lesson.id),
    );
    return {
      lesson: nextIncomplete,
      mode: hasCompletedAccessibleLesson ? "continue" : "start",
    };
  }

  return { lesson: accessibleLessons[accessibleLessons.length - 1], mode: "review" };
}
