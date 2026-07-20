import assert from "node:assert/strict";
import test from "node:test";
import {
  bicarbonateDeficit,
  calciumGluconate,
  correctedCalcium,
  hyperkalemiaEmergency,
  hypernatremiaFreeWater,
  hyponatremiaAdrogue,
  magnesiumIv,
  phosphateIv,
  potassiumEnteral,
  potassiumIv,
} from "../lib/electrolyte-calculations.mjs";

function close(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
}

test("enteral potassium divides the capped daily offer into four rounded doses", () => {
  const result = potassiumEnteral({ weightKg: 10, dailyDoseMeqKg: 2 });
  assert.ok(result);
  assert.equal(result.volumePerDoseMl, 6.3);
  close(result.deliveredPerDoseMeq, 5.04);
  close(result.deliveredDailyMeq, 20.16);
});

test("IV potassium calculates stock, final volume and four-hour pump rate", () => {
  const result = potassiumIv({ weightKg: 10, rateMeqKgHour: 0.5, targetMeqPer100Ml: 4 });
  assert.ok(result);
  assert.equal(result.stockVolumeMl, 14.9);
  close(result.deliveredTotalMeq, 19.966);
  assert.equal(result.diluentVolumeMl, 499.2);
  assert.equal(result.finalVolumeMl, 514.1);
  assert.equal(result.pumpRateMlHour, 128.5);
  assert.ok(result.finalConcentrationMeq100Ml <= 4);
});

test("Adrogue calculation rounds the pump down and preserves an increase below the target", () => {
  const result = hyponatremiaAdrogue({ weightKg: 10, currentSodium: 115, desiredIncrease: 6 });
  assert.ok(result);
  assert.equal(result.pumpRateMlHour, 4.3);
  assert.equal(result.finalVolumeMl, 103.2);
  assert.ok(result.expectedIncrease <= 6);
  close(result.sodiumChloride20Ml + result.glucose5Ml, result.finalVolumeMl, 0.11);
});

test("hypernatremia free-water formula uses 4 mL/kg per desired mEq/L decrease", () => {
  const result = hypernatremiaFreeWater({ weightKg: 10, desiredDecrease: 8 });
  assert.ok(result);
  assert.equal(result.exactVolumeMl, 320);
  assert.equal(result.pumpRateMlHour, 13.3);
  assert.ok(result.expectedDecrease <= 8);
});

test("magnesium dose honors the 16 mEq ceiling and total 1:10 dilution", () => {
  const result = magnesiumIv({ weightKg: 100, doseMeqKg: 0.4 });
  assert.ok(result);
  assert.equal(result.targetDoseMeq, 16);
  assert.equal(result.stockVolumeMl, 4);
  assert.equal(result.diluentVolumeMl, 36);
  assert.equal(result.finalVolumeMl, 40);
  assert.equal(result.capped, true);
});

test("corrected calcium uses the verified 0.8 factor", () => {
  assert.equal(correctedCalcium({ measuredCalciumMgDl: 7.5, albuminGDl: 3 }), 8.3);
  const preparation = calciumGluconate({ weightKg: 10, doseMlKg: 0.5, diluentVolumesPerDrugVolume: 3 });
  assert.deepEqual(preparation, { requestedStockVolumeMl: 5, exactStockVolumeMl: 5, stockVolumeMl: 5, diluentVolumeMl: 15, finalVolumeMl: 20, capped: false });
  const capped = calciumGluconate({ weightKg: 30, doseMlKg: 1, diluentVolumesPerDrugVolume: 3 });
  assert.ok(capped);
  assert.equal(capped.stockVolumeMl, 20);
  assert.equal(capped.capped, true);
});

test("phosphate calculation respects peripheral concentration and exposes potassium load", () => {
  const result = phosphateIv({
    weightKg: 10,
    doseMmolKg: 0.3,
    stockPhosphateMmolMl: 1.1,
    stockPotassiumMeqMl: 2,
    maxConcentrationMmolMl: 0.05,
  });
  assert.ok(result);
  assert.equal(result.stockVolumeMl, 2.7);
  close(result.deliveredPhosphateMmol, 2.97);
  close(result.concomitantPotassiumMeq, 5.4);
  assert.equal(result.finalVolumeMl, 59.4);
  assert.ok(result.finalConcentrationMmolMl <= 0.05);
});

test("bicarbonate deficit and hyperkalemia panel apply their stated ceilings", () => {
  const bicarbonate = bicarbonateDeficit({ weightKg: 10, baseExcess: -10 });
  assert.deepEqual(bicarbonate, { targetMeq: 30, exactVolumeMl: 30, volumeMl: 30, deliveredMeq: 30 });
  const emergency = hyperkalemiaEmergency({ weightKg: 120, youngerThanFive: false });
  assert.ok(emergency);
  assert.equal(emergency.insulinUnits, 10);
  assert.equal(emergency.glucoseGrams, 25);
  assert.equal(emergency.glucoseVolumeMl, 100);
  assert.equal(emergency.calciumGluconateMl, 20);
  assert.equal(emergency.bicarbonateMeq, 50);
  assert.equal(emergency.furosemideMg, 40);
  const younger = hyperkalemiaEmergency({ weightKg: 10, youngerThanFive: true });
  assert.ok(younger);
  assert.equal(younger.glucoseVolumeMl, 50);
  assert.equal(younger.glucoseGrams, 5);
});
