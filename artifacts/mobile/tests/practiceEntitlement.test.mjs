import assert from "node:assert/strict";
import test from "node:test";

import { getAccessiblePracticeSelection } from "../lib/practiceAccess.ts";

const a1Lesson = { id: "a1-first", level: "A1" };
const paidLesson = { id: "a2-first", level: "A2" };

test("paid Practice selection is preserved while entitlement remains Pro", () => {
  const result = getAccessiblePracticeSelection({
    selectedLesson: paidLesson,
    accessibleLessons: [a1Lesson, paidLesson],
    entitlementReady: true,
  });

  assert.equal(result, paidLesson);
});

test("revoked paid Practice selection falls back to the first accessible A1 lesson", () => {
  const result = getAccessiblePracticeSelection({
    selectedLesson: paidLesson,
    accessibleLessons: [a1Lesson],
    entitlementReady: true,
  });

  assert.equal(result, a1Lesson);
});

test("accessible A1 selection is preserved when entitlement changes", () => {
  const result = getAccessiblePracticeSelection({
    selectedLesson: a1Lesson,
    accessibleLessons: [a1Lesson],
    entitlementReady: true,
  });

  assert.equal(result, a1Lesson);
});

test("initializing entitlement does not downgrade a selected paid lesson", () => {
  const result = getAccessiblePracticeSelection({
    selectedLesson: paidLesson,
    accessibleLessons: [a1Lesson],
    entitlementReady: false,
  });

  assert.equal(result, paidLesson);
});
