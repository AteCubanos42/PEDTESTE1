import assert from "node:assert/strict";
import test from "node:test";
import { calculateAntimicrobialRegimen } from "../lib/antimicrobial-calculations.mjs";

test("per-dose regimen calculates administration and 24-hour totals", () => {
  const result = calculateAntimicrobialRegimen({
    weightKg: 12,
    rule: { basis: "dose", doseMin: 40, unit: "mg", intervalHours: 8, maxDaily: 3000 },
  });
  assert.ok(result);
  assert.equal(result.doseMin, 480);
  assert.equal(result.dailyMin, 1440);
  assert.equal(result.administrationsPerDay, 3);
});

test("per-day regimen is divided by the selected interval", () => {
  const result = calculateAntimicrobialRegimen({
    weightKg: 12,
    rule: { basis: "day", doseMin: 60, unit: "mg", intervalHours: 6, maxDaily: 4000 },
  });
  assert.ok(result);
  assert.equal(result.doseMin, 180);
  assert.equal(result.dailyMin, 720);
});

test("per-administration cap keeps daily and dose totals consistent", () => {
  const result = calculateAntimicrobialRegimen({
    weightKg: 20,
    rule: { basis: "day", doseMin: 80, doseMax: 100, unit: "mg", intervalHours: 12, maxDose: 500 },
  });
  assert.ok(result);
  assert.equal(result.doseMin, 500);
  assert.equal(result.doseMax, 500);
  assert.equal(result.dailyMin, 1000);
  assert.equal(result.dailyMax, 1000);
  assert.equal(result.capped, true);
});

test("daily cap limits a weight-based daily regimen", () => {
  const result = calculateAntimicrobialRegimen({
    weightKg: 100,
    rule: { basis: "day", doseMin: 200, unit: "mg", intervalHours: 6, maxDaily: 12000 },
  });
  assert.ok(result);
  assert.equal(result.doseMin, 3000);
  assert.equal(result.dailyMin, 12000);
  assert.equal(result.capped, true);
});

test("fixed daily regimen is split into fixed administrations", () => {
  const result = calculateAntimicrobialRegimen({
    weightKg: 45,
    rule: { basis: "day", fixedDoseMin: 1200, unit: "mg", intervalHours: 12, maxDose: 600 },
  });
  assert.ok(result);
  assert.equal(result.doseMin, 600);
  assert.equal(result.dailyMin, 1200);
});

test("meropenem range is divided into three daily administrations", () => {
  const result = calculateAntimicrobialRegimen({
    weightKg: 12,
    rule: { basis: "day", doseMin: 90, doseMax: 120, unit: "mg", intervalHours: 8, maxDaily: 3000 },
  });
  assert.ok(result);
  assert.equal(result.doseMin, 360);
  assert.equal(result.doseMax, 480);
  assert.equal(result.dailyMin, 1080);
  assert.equal(result.dailyMax, 1440);
});

test("vancomycin range is divided into four daily administrations", () => {
  const result = calculateAntimicrobialRegimen({
    weightKg: 20,
    rule: { basis: "day", doseMin: 40, doseMax: 60, unit: "mg", intervalHours: 6, maxDaily: 4000 },
  });
  assert.ok(result);
  assert.equal(result.doseMin, 200);
  assert.equal(result.doseMax, 300);
  assert.equal(result.dailyMin, 800);
  assert.equal(result.dailyMax, 1200);
});

test("piperacillin-tazobactam q6h keeps the stated daily total", () => {
  const result = calculateAntimicrobialRegimen({
    weightKg: 20,
    rule: { basis: "day", doseMin: 300, unit: "mg", intervalHours: 6, maxDaily: 16000 },
  });
  assert.ok(result);
  assert.equal(result.doseMin, 1500);
  assert.equal(result.dailyMin, 6000);
  assert.equal(result.administrationsPerDay, 4);
});

test("oral amoxicillin daily regimen is split into two administrations", () => {
  const result = calculateAntimicrobialRegimen({
    weightKg: 12,
    rule: { basis: "day", doseMin: 25, unit: "mg", intervalHours: 12, maxDaily: 1000 },
  });
  assert.ok(result);
  assert.equal(result.doseMin, 150);
  assert.equal(result.dailyMin, 300);
  assert.equal(result.administrationsPerDay, 2);
});

test("high-dose amoxicillin-clavulanate uses the amoxicillin component", () => {
  const result = calculateAntimicrobialRegimen({
    weightKg: 12,
    rule: { basis: "day", doseMin: 90, unit: "mg", intervalHours: 12, maxDaily: 3600 },
  });
  assert.ok(result);
  assert.equal(result.doseMin, 540);
  assert.equal(result.dailyMin, 1080);
});

test("oral ciprofloxacin applies the per-dose ceiling", () => {
  const result = calculateAntimicrobialRegimen({
    weightKg: 40,
    rule: { basis: "dose", doseMin: 10, doseMax: 20, unit: "mg", intervalHours: 12, maxDose: 750 },
  });
  assert.ok(result);
  assert.equal(result.doseMin, 400);
  assert.equal(result.doseMax, 750);
  assert.equal(result.dailyMax, 1500);
  assert.equal(result.capped, true);
});
