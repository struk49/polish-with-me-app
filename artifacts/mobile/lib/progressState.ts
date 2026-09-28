export interface ProgressData {
  completedLessons: string[];
  quizScores: Record<string, number>;
  streak: number;
  lastStudyDate: string | null;
  knownWords: string[];
  totalXP: number;
}

function markStudied(current: ProgressData, now: Date): ProgressData {
  const today = now.toDateString();
  if (current.lastStudyDate === today) return current;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday = current.lastStudyDate === yesterday.toDateString();

  return {
    ...current,
    streak: wasYesterday ? current.streak + 1 : 1,
    lastStudyDate: today,
  };
}

export function finishQuizProgress(
  current: ProgressData,
  lessonId: string,
  score: number,
  now: Date = new Date(),
): ProgressData {
  const studied = markStudied(current, now);
  const firstCompletion = !studied.completedLessons.includes(lessonId);
  const existingScore = studied.quizScores[lessonId] ?? 0;
  const bestScore = Math.max(existingScore, score);
  const scoreBonusXP =
    score > existingScore ? Math.round((score - existingScore) / 10) : 0;

  return {
    ...studied,
    completedLessons: firstCompletion
      ? [...studied.completedLessons, lessonId]
      : studied.completedLessons,
    quizScores: { ...studied.quizScores, [lessonId]: bestScore },
    totalXP:
      studied.totalXP + (firstCompletion ? 50 : 0) + scoreBonusXP,
  };
}
