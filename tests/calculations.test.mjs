import test from "node:test";
import assert from "node:assert/strict";
import {
  doseFromInfusion,
  girMixture,
  infusionFromDose,
  maintenanceDaily,
  nitricOxideFlow,
  prismIVMortality,
} from "../lib/calculations.mjs";

test("Holliday-Segar daily maintenance", () => {
  assert.equal(maintenanceDaily(5), 500);
  assert.equal(maintenanceDaily(12), 1100);
  assert.equal(maintenanceDaily(30), 1700);
});

test("infusion forward and reverse calculations are reciprocal", () => {
  const forward = infusionFromDose({
    weightKg: 12,
    dose: 1,
    stockPerMl: 5000,
    drugVolumeMl: 1,
    finalVolumeMl: 50,
    perMinute: true,
  });
  assert.ok(forward);
  assert.equal(Number(forward.flowMlH.toFixed(2)), 7.2);
  const reverse = doseFromInfusion({
    weightKg: 12,
    flowMlH: forward.flowMlH,
    stockPerMl: 5000,
    drugVolumeMl: 1,
    finalVolumeMl: 50,
    perMinute: true,
  });
  assert.ok(reverse);
  assert.equal(Number(reverse.dose.toFixed(6)), 1);
});

test("epinephrine example keeps the dilution arithmetic consistent", () => {
  const result = infusionFromDose({
    weightKg: 2.363,
    dose: 0.1,
    stockPerMl: 1000,
    drugVolumeMl: 5,
    finalVolumeMl: 60,
    perMinute: true,
  });
  assert.ok(result);
  assert.equal(Number(result.flowMlH.toFixed(3)), 0.17);
  assert.equal(result.totalAmount, 5000);
  assert.equal(60 - 5, 55);
});

test("GIR mixture reproduces requested GIR", () => {
  const mix = girMixture({
    weightKg: 3,
    girMgKgMin: 5,
    quotaPercent: 100,
    sourceGlucosePercent: 50,
    baseGlucosePercent: 0,
  });
  assert.ok(mix);
  assert.equal(Number(mix.dailyVolume.toFixed(1)), 300);
  assert.equal(Number(mix.targetPercent.toFixed(2)), 7.2);
  assert.equal(Number(mix.sourceVolume.toFixed(2)), 43.2);
});

test("PRISM IV public-domain equation baseline", () => {
  const result = prismIVMortality({
    ageGroup: "child",
    admissionSource: "or",
    cpr: false,
    cancer: false,
    lowRiskSystem: false,
    neurologicScore: 0,
    nonNeurologicScore: 0,
  });
  assert.ok(result);
  assert.equal(Number(result.percent.toFixed(3)), 0.309);
});

test("hourly-unit infusion does not apply the 60-minute factor", () => {
  const result = infusionFromDose({
    weightKg: 10,
    dose: 2,
    stockPerMl: 50,
    drugVolumeMl: 10,
    finalVolumeMl: 50,
    perMinute: false,
  });
  assert.ok(result);
  assert.equal(result.finalConcentration, 10);
  assert.equal(result.flowMlH, 2);
});

test("GIR mixture accounts for additive displacement", () => {
  const result = girMixture({
    weightKg: 3,
    girMgKgMin: 5,
    quotaPercent: 100,
    sourceGlucosePercent: 50,
    baseGlucosePercent: 5,
    additiveVolumeMl: 10,
  });
  assert.ok(result);
  const glucoseFromMix =
    (result.sourceVolume * 50 + result.baseVolume * 5) / 100;
  assert.equal(Number(glucoseFromMix.toFixed(4)), Number(result.glucoseGDay.toFixed(4)));
});

test("nitric oxide flow is a concentration fraction of total flow", () => {
  const result = nitricOxideFlow({ targetPpm: 20, sourcePpm: 800, totalFlowLMin: 10 });
  assert.ok(result);
  assert.equal(result.noFlowMlMin, 250);
});
