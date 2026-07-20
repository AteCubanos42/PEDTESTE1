import assert from "node:assert/strict";
import test from "node:test";
import { guideFinalVolume } from "../lib/preparation-calculations.mjs";

test("ceftriaxone AVP respects four diluent volumes and 20 mg/mL", () => {
  const finalVolume = guideFinalVolume({ dose: 300, stockConcentration: 100, targetConcentration: 20, diluentMultiple: 4 });
  assert.equal(finalVolume, 15);
});

test("cefepime uses the 2.5-volume redilution because it is below 30 mg/mL", () => {
  const finalVolume = guideFinalVolume({ dose: 600, stockConcentration: 100, targetConcentration: 30, diluentMultiple: 2.5 });
  assert.equal(finalVolume, 21);
  assert.ok(600 / finalVolume < 30);
});

test("printed concentration limit wins when a multiplier would be too concentrated", () => {
  const finalVolume = guideFinalVolume({ dose: 500000, stockConcentration: 100000, targetConcentration: 1000, diluentMultiple: 60 });
  assert.equal(finalVolume, 500);
  assert.equal(500000 / finalVolume, 1000);
});
