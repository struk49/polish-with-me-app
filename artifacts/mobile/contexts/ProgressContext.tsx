import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { finishQuizProgress, type ProgressData } from "@/lib/progressState";
import { captureOperationalError } from "@/lib/observability";

interface ProgressContextType extends ProgressData {
  completeLesson: (lessonId: string) => void;
  saveQuizScore: (lessonId: string, score: number) => void;
  finishQuiz: (lessonId: string, score: number) => void;
  toggleKnownWord: (wordId: string) => void;
  isWordKnown: (wordId: string) => boolean;
  isLessonCompleted: (lessonId: string) => boolean;
  addXP: (amount: number) => void;
  resetProgress: () => void;
}

const STORAGE_KEY = "@polish_progress_v1";

const defaultProgress: ProgressData = {
  completedLessons: [],
  quizScores: {},
  streak: 0,
  lastStudyDate: null,
  knownWords: [],
  totalXP: 0,
};

const ProgressContext = createContext<ProgressContextType | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ProgressData>(defaultProgress);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed: ProgressData = JSON.parse(raw);
            setData(parsed);
            checkAndUpdateStreak(parsed);
          } catch (error) {
            captureOperationalError({ category: "STORAGE_PARSE_FAILURE", operation: "storage", storage: "progress", error });
          }
        }
      })
      .catch((error) => {
        captureOperationalError({ category: "STORAGE_READ_FAILURE", operation: "storage", storage: "progress", error });
      })
      .finally(() => setLoaded(true));
  }, []);

  const checkAndUpdateStreak = (current: ProgressData) => {
    const today = new Date().toDateString();
    if (!current.lastStudyDate) return;
    const last = new Date(current.lastStudyDate);
    const diff = Math.floor(
      (new Date().getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff > 1) {
      const updated = { ...current, streak: 0 };
      setData(updated);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch((error) => {
        captureOperationalError({ category: "STORAGE_WRITE_FAILURE", operation: "storage", storage: "progress", error });
      });
    }
  };

  const save = useCallback((updated: ProgressData) => {
    setData(updated);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch((error) => {
      captureOperationalError({ category: "STORAGE_WRITE_FAILURE", operation: "storage", storage: "progress", error });
    });
  }, []);

  const markStudied = useCallback(
    (current: ProgressData): ProgressData => {
      const today = new Date().toDateString();
      if (current.lastStudyDate === today) return current;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = current.lastStudyDate === yesterday.toDateString();
      return {
        ...current,
        streak: wasYesterday ? current.streak + 1 : 1,
        lastStudyDate: today,
      };
    },
    []
  );

  const completeLesson = useCallback(
    (lessonId: string) => {
      setData((prev) => {
        const base = markStudied(prev);
        if (base.completedLessons.includes(lessonId)) {
          save(base);
          return base;
        }
        const updated = {
          ...base,
          completedLessons: [...base.completedLessons, lessonId],
          totalXP: base.totalXP + 50,
        };
        save(updated);
        return updated;
      });
    },
    [markStudied, save]
  );

  const saveQuizScore = useCallback(
    (lessonId: string, score: number) => {
      setData((prev) => {
        const base = markStudied(prev);
        const existing = base.quizScores[lessonId] ?? 0;
        const bonusXP = score > existing ? Math.round((score - existing) / 10) : 0;
        const updated: ProgressData = {
          ...base,
          quizScores: { ...base.quizScores, [lessonId]: Math.max(existing, score) },
          totalXP: base.totalXP + bonusXP,
        };
        save(updated);
        return updated;
      });
    },
    [markStudied, save]
  );

  const finishQuiz = useCallback((lessonId: string, score: number) => {
    setData((prev) => {
      const updated = finishQuizProgress(prev, lessonId, score);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch((error) => {
        captureOperationalError({ category: "STORAGE_WRITE_FAILURE", operation: "storage", storage: "progress", error });
      });
      return updated;
    });
  }, []);

  const toggleKnownWord = useCallback(
    (wordId: string) => {
      setData((prev) => {
        const knows = new Set(prev.knownWords);
        if (knows.has(wordId)) {
          knows.delete(wordId);
        } else {
          knows.add(wordId);
        }
        const updated = { ...prev, knownWords: Array.from(knows) };
        save(updated);
        return updated;
      });
    },
    [save]
  );

  const addXP = useCallback(
    (amount: number) => {
      setData((prev) => {
        const updated = { ...prev, totalXP: prev.totalXP + amount };
        save(updated);
        return updated;
      });
    },
    [save]
  );

  const resetProgress = useCallback(() => {
    save(defaultProgress);
  }, [save]);

  const isWordKnown = useCallback(
    (wordId: string) => data.knownWords.includes(wordId),
    [data.knownWords]
  );

  const isLessonCompleted = useCallback(
    (lessonId: string) => data.completedLessons.includes(lessonId),
    [data.completedLessons]
  );

  if (!loaded) return null;

  return (
    <ProgressContext.Provider
      value={{
        ...data,
        completeLesson,
        saveQuizScore,
        finishQuiz,
        toggleKnownWord,
        isWordKnown,
        isLessonCompleted,
        addXP,
        resetProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
