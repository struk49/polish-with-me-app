import assert from "node:assert/strict";
import test from "node:test";

import { canAccessLevel } from "../lib/premiumAccess.ts";
import { getNextAccessibleLesson } from "../lib/homeLearning.ts";

const lessons = [
  { id: "a1-first", level: "A1" },
  { id: "a1-second", level: "A1" },
  { id: "a2-first", level: "A2" },
  { id: "b1-first", level: "B1" },
];

function select(completedLessonIds, isPremium, orderedLessons = lessons) {
  return getNextAccessibleLesson({
    orderedLessons,
    completedLessonIds,
    canAccess: (lesson) => canAccessLevel(isPremium, lesson.level),
  });
}

test("new learner starts with the first available A1 lesson", () => {
  assert.deepEqual(select([], false), { lesson: lessons[0], mode: "start" });
});

test("returning learner receives the next incomplete lesson", () => {
  assert.deepEqual(select(["a1-first"], false), { lesson: lessons[1], mode: "continue" });
});

test("completed lessons are skipped without reordering the curriculum", () => {
  const customOrder = [lessons[1], lessons[0], lessons[2]];
  assert.equal(select(["a1-second"], false, customOrder)?.lesson.id, "a1-first");
});

test("locked Pro lessons are not treated as accessible for a free learner", () => {
  assert.deepEqual(select(["a1-first", "a1-second"], false), { lesson: lessons[1], mode: "review" });
});

test("Pro learner continues into the first incomplete paid level", () => {
  assert.equal(select(["a1-first", "a1-second"], true)?.lesson.id, "a2-first");
});

test("all accessible lessons completed falls back to review", () => {
  assert.deepEqual(select(["a1-first", "a1-second"], false), { lesson: lessons[1], mode: "review" });
});

test("empty or inaccessible curriculum fails safely", () => {
  assert.equal(select([], false, []), null);
  assert.equal(select([], false, [{ id: "paid", level: "B2" }]), null);
});

test("unknown completed IDs do not turn a new learner into a returning learner", () => {
  assert.equal(select(["missing-lesson"], false)?.mode, "start");
});
