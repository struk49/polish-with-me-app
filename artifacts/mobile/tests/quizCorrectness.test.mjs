import assert from "node:assert/strict";
import test from "node:test";

import { calculateQuizScore } from "../lib/quizScoring.ts";
import { finishQuizProgress } from "../lib/progressState.ts";

const NOW = new Date("2026-09-15T12:00:00Z");

function progress(overrides = {}) {
  return {
    completedLessons: [],
    quizScores: {},
    streak: 0,
    lastStudyDate: null,
    knownWords: [],
    totalXP: 0,
    ...overrides,
  };
}

test("one-question correct quiz is 100%", () => {
  assert.equal(calculateQuizScore(1, 1), 100);
});

test("one-question wrong quiz is 0%", () => {
  assert.equal(calculateQuizScore(0, 1), 0);
});

test("multi-question score includes a correct final answer", () => {
  const correctBeforeFinal = 2;
  const finalAnswerCorrect = 1;
  assert.equal(calculateQuizScore(correctBeforeFinal + finalAnswerCorrect, 4), 75);
});

test("multi-question score includes a wrong final answer", () => {
  const correctBeforeFinal = 2;
  const finalAnswerCorrect = 0;
  assert.equal(calculateQuizScore(correctBeforeFinal + finalAnswerCorrect, 4), 50);
});

test("all correct answers produce 100%", () => {
  assert.equal(calculateQuizScore(8, 8), 100);
});

test("all wrong answers produce 0%", () => {
  assert.equal(calculateQuizScore(0, 8), 0);
});

test("final answer is counted exactly once", () => {
  const scoreBeforeFinal = 3;
  const scoreAfterFinal = scoreBeforeFinal + 1;
  assert.equal(calculateQuizScore(scoreAfterFinal, 4), 100);
});

test("finishing a quiz completes its lesson", () => {
  const next = finishQuizProgress(progress(), "greetings", 70, NOW);
  assert.deepEqual(next.completedLessons, ["greetings"]);
});

test("first completion awards 50 completion XP plus existing score bonus", () => {
  const next = finishQuizProgress(progress(), "greetings", 70, NOW);
  assert.equal(next.totalXP, 57);
});

test("re-completing a lesson does not duplicate completion XP", () => {
  const first = finishQuizProgress(progress(), "greetings", 70, NOW);
  const repeated = finishQuizProgress(first, "greetings", 70, NOW);
  assert.equal(repeated.totalXP, first.totalXP);
  assert.deepEqual(repeated.completedLessons, ["greetings"]);
});

test("higher quiz score replaces the previous best and awards only improvement XP", () => {
  const current = progress({
    completedLessons: ["greetings"],
    quizScores: { greetings: 60 },
    totalXP: 56,
  });
  const next = finishQuizProgress(current, "greetings", 90, NOW);
  assert.equal(next.quizScores.greetings, 90);
  assert.equal(next.totalXP, 59);
});

test("lower quiz score preserves the previous best and XP", () => {
  const current = progress({
    completedLessons: ["greetings"],
    quizScores: { greetings: 90 },
    totalXP: 59,
  });
  const next = finishQuizProgress(current, "greetings", 40, NOW);
  assert.equal(next.quizScores.greetings, 90);
  assert.equal(next.totalXP, 59);
});
