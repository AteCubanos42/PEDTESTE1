import assert from "node:assert/strict";
import test from "node:test";
import { calculateAntimicrobialRegimen } from "../lib/antimicrobial-calculations.mjs";
import {
  dailyDosePerKgRange,
  ruleWithSelectedDailyDose,
} from "../lib/antimicrobial-dose-selection.mjs";

test("keeps a hospital daily-dose range in mg/kg/day", () => {
  const range = dailyDosePerKgRange({
    basis: "day",
    doseMin: 90,
    doseMax: 120,
    unit: "mg",
    intervalHours: 8,
  });
  assert.deepEqual(range, { minimum: 90, maximum: 120 });
});

test("converts a per-administration oral range to mg/kg/day", () => {
  const range = dailyDosePerKgRange({
    basis: "dose",
    doseMin: 10,
    doseMax: 20,
    unit: "mg",
    intervalHours: 12,
  });
  assert.deepEqual(range, { minimum: 20, maximum: 40 });
});

test("selected meropenem daily dose is divided q8h and capped at the daily maximum", () => {
  const sourceRule = {
    basis: "day",
    doseMin: 90,
    doseMax: 120,
    unit: "mg",
    intervalHours: 8,
    maxDaily: 3000,
  };
  const rule = ruleWithSelectedDailyDose(sourceRule, 120);
  const result = calculateAntimicrobialRegimen({ weightKg: 30, rule });
  assert.ok(result);
  assert.equal(result.doseMin, 1000);
  assert.equal(result.doseMax, 1000);
  assert.equal(result.dailyMin, 3000);
  assert.equal(result.capped, true);
});

test("selected oral ciprofloxacin daily dose still respects the per-dose ceiling", () => {
  const sourceRule = {
    basis: "dose",
    doseMin: 10,
    doseMax: 20,
    unit: "mg",
    intervalHours: 12,
    maxDose: 750,
  };
  const rule = ruleWithSelectedDailyDose(sourceRule, 40);
  const result = calculateAntimicrobialRegimen({ weightKg: 40, rule });
  assert.ok(result);
  assert.equal(result.doseMin, 750);
  assert.equal(result.dailyMin, 1500);
  assert.equal(result.capped, true);
});

test("preserves non-mass units instead of making an unsafe mg conversion", () => {
  const range = dailyDosePerKgRange({
    basis: "day",
    doseMin: 25000,
    unit: "UI",
    intervalHours: 12,
  });
  assert.deepEqual(range, { minimum: 25000, maximum: 25000 });
});
