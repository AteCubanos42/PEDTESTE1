function positive(value) {
  return Number.isFinite(value) && value > 0;
}

export function roundTenth(value) {
  if (!Number.isFinite(value)) return Number.NaN;
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export function roundUpTenth(value) {
  if (!Number.isFinite(value)) return Number.NaN;
  return Math.ceil((value - 1e-9) * 10) / 10;
}

export function roundDownTenth(value) {
  if (!Number.isFinite(value)) return Number.NaN;
  return Math.floor((value + 1e-9) * 10) / 10;
}

export function potassiumEnteral({
  weightKg,
  dailyDoseMeqKg,
  administrationsPerDay = 4,
  stockMeqMl = 0.8,
  maxDailyMeq = 240,
}) {
  if (![weightKg, dailyDoseMeqKg, administrationsPerDay, stockMeqMl, maxDailyMeq].every(positive)) return null;
  const requestedDailyMeq = weightKg * dailyDoseMeqKg;
  const dailyMeq = Math.min(requestedDailyMeq, maxDailyMeq);
  const targetPerDoseMeq = dailyMeq / administrationsPerDay;
  const exactVolumeMl = targetPerDoseMeq / stockMeqMl;
  const volumePerDoseMl = roundTenth(exactVolumeMl);
  const deliveredPerDoseMeq = volumePerDoseMl * stockMeqMl;
  const deliveredDailyMeq = deliveredPerDoseMeq * administrationsPerDay;
  return {
    requestedDailyMeq,
    dailyMeq,
    targetPerDoseMeq,
    exactVolumeMl,
    volumePerDoseMl,
    deliveredPerDoseMeq,
    deliveredDailyMeq,
    capped: dailyMeq < requestedDailyMeq,
  };
}

export function potassiumIv({
  weightKg,
  rateMeqKgHour,
  durationHours = 4,
  targetMeqPer100Ml,
  stockMeqMl = 1.34,
}) {
  if (![weightKg, rateMeqKgHour, durationHours, targetMeqPer100Ml, stockMeqMl].every(positive)) return null;
  const targetTotalMeq = weightKg * rateMeqKgHour * durationHours;
  const exactStockVolumeMl = targetTotalMeq / stockMeqMl;
  const stockVolumeMl = roundTenth(exactStockVolumeMl);
  const deliveredTotalMeq = stockVolumeMl * stockMeqMl;
  const diluentVolumeMl = roundUpTenth((deliveredTotalMeq / targetMeqPer100Ml) * 100);
  const finalVolumeMl = roundTenth(diluentVolumeMl + stockVolumeMl);
  const pumpRateMlHour = roundTenth(finalVolumeMl / durationHours);
  const finalConcentrationMeq100Ml = (deliveredTotalMeq / finalVolumeMl) * 100;
  return {
    targetTotalMeq,
    exactStockVolumeMl,
    stockVolumeMl,
    deliveredTotalMeq,
    diluentVolumeMl,
    finalVolumeMl,
    pumpRateMlHour,
    finalConcentrationMeq100Ml,
  };
}

export function hyponatremiaAdrogue({
  weightKg,
  currentSodium,
  desiredIncrease,
  infusateSodium = 513,
  distributionFactor = 0.6,
  hours = 24,
}) {
  if (![weightKg, currentSodium, desiredIncrease, infusateSodium, distributionFactor, hours].every(positive)) return null;
  const denominator = weightKg * distributionFactor + 1;
  const changePerLiter = (infusateSodium - currentSodium) / denominator;
  if (!positive(changePerLiter)) return null;
  const exactVolumeMl = (desiredIncrease / changePerLiter) * 1000;
  const pumpRateMlHour = roundDownTenth(exactVolumeMl / hours);
  if (!positive(pumpRateMlHour)) return null;
  const finalVolumeMl = roundTenth(pumpRateMlHour * hours);
  const expectedIncrease = (finalVolumeMl / 1000) * changePerLiter;
  const sodiumChloride20Ml = roundTenth(finalVolumeMl * 0.15);
  const glucose5Ml = roundTenth(finalVolumeMl - sodiumChloride20Ml);
  return {
    denominator,
    changePerLiter,
    exactVolumeMl,
    pumpRateMlHour,
    finalVolumeMl,
    expectedIncrease,
    sodiumChloride20Ml,
    glucose5Ml,
  };
}

export function hypernatremiaFreeWater({ weightKg, desiredDecrease, hours = 24 }) {
  if (![weightKg, desiredDecrease, hours].every(positive)) return null;
  const exactVolumeMl = 4 * weightKg * desiredDecrease;
  const pumpRateMlHour = roundDownTenth(exactVolumeMl / hours);
  if (!positive(pumpRateMlHour)) return null;
  const finalVolumeMl = roundTenth(pumpRateMlHour * hours);
  const expectedDecrease = finalVolumeMl / (4 * weightKg);
  return { exactVolumeMl, pumpRateMlHour, finalVolumeMl, expectedDecrease };
}

export function magnesiumIv({
  weightKg,
  doseMeqKg,
  stockMeqMl = 4,
  dilutionTotalFactor = 10,
  maxDoseMeq = 16,
}) {
  if (![weightKg, doseMeqKg, stockMeqMl, dilutionTotalFactor, maxDoseMeq].every(positive)) return null;
  const requestedDoseMeq = weightKg * doseMeqKg;
  const targetDoseMeq = Math.min(requestedDoseMeq, maxDoseMeq);
  const exactStockVolumeMl = targetDoseMeq / stockMeqMl;
  const stockVolumeMl = roundTenth(exactStockVolumeMl);
  const deliveredDoseMeq = stockVolumeMl * stockMeqMl;
  const finalVolumeMl = roundTenth(stockVolumeMl * dilutionTotalFactor);
  const diluentVolumeMl = roundTenth(finalVolumeMl - stockVolumeMl);
  const minimumInfusionMinutes = Math.ceil((deliveredDoseMeq / weightKg) * 60);
  return {
    requestedDoseMeq,
    targetDoseMeq,
    exactStockVolumeMl,
    stockVolumeMl,
    deliveredDoseMeq,
    finalVolumeMl,
    diluentVolumeMl,
    minimumInfusionMinutes,
    capped: targetDoseMeq < requestedDoseMeq,
  };
}

export function calciumGluconate({ weightKg, doseMlKg, diluentVolumesPerDrugVolume = 3, maxStockVolumeMl = 20 }) {
  if (![weightKg, doseMlKg, diluentVolumesPerDrugVolume, maxStockVolumeMl].every(positive)) return null;
  const requestedStockVolumeMl = weightKg * doseMlKg;
  const exactStockVolumeMl = Math.min(requestedStockVolumeMl, maxStockVolumeMl);
  const stockVolumeMl = roundTenth(exactStockVolumeMl);
  const diluentVolumeMl = roundTenth(stockVolumeMl * diluentVolumesPerDrugVolume);
  const finalVolumeMl = roundTenth(stockVolumeMl + diluentVolumeMl);
  return { requestedStockVolumeMl, exactStockVolumeMl, stockVolumeMl, diluentVolumeMl, finalVolumeMl, capped: exactStockVolumeMl < requestedStockVolumeMl };
}

export function correctedCalcium({ measuredCalciumMgDl, albuminGDl }) {
  if (![measuredCalciumMgDl, albuminGDl].every(positive)) return null;
  return measuredCalciumMgDl + 0.8 * (4 - albuminGDl);
}

export function phosphateIv({
  weightKg,
  doseMmolKg,
  stockPhosphateMmolMl,
  stockPotassiumMeqMl,
  maxConcentrationMmolMl,
  durationHours = 6,
}) {
  if (![weightKg, doseMmolKg, stockPhosphateMmolMl, stockPotassiumMeqMl, maxConcentrationMmolMl, durationHours].every(positive)) return null;
  const targetPhosphateMmol = weightKg * doseMmolKg;
  const exactStockVolumeMl = targetPhosphateMmol / stockPhosphateMmolMl;
  const stockVolumeMl = roundTenth(exactStockVolumeMl);
  const deliveredPhosphateMmol = stockVolumeMl * stockPhosphateMmolMl;
  const concomitantPotassiumMeq = stockVolumeMl * stockPotassiumMeqMl;
  const finalVolumeMl = roundUpTenth(deliveredPhosphateMmol / maxConcentrationMmolMl);
  const diluentVolumeMl = roundTenth(finalVolumeMl - stockVolumeMl);
  const pumpRateMlHour = roundTenth(finalVolumeMl / durationHours);
  const finalConcentrationMmolMl = Math.round((deliveredPhosphateMmol / finalVolumeMl) * 1e12) / 1e12;
  return {
    targetPhosphateMmol,
    exactStockVolumeMl,
    stockVolumeMl,
    deliveredPhosphateMmol,
    concomitantPotassiumMeq,
    finalVolumeMl,
    diluentVolumeMl,
    pumpRateMlHour,
    finalConcentrationMmolMl,
  };
}

export function bicarbonateDeficit({ weightKg, baseExcess, distributionFactor = 0.3, stockMeqMl = 1 }) {
  if (!positive(weightKg) || !Number.isFinite(baseExcess) || baseExcess >= 0 || !positive(distributionFactor) || !positive(stockMeqMl)) return null;
  const targetMeq = Math.abs(baseExcess) * weightKg * distributionFactor;
  const exactVolumeMl = targetMeq / stockMeqMl;
  const volumeMl = roundTenth(exactVolumeMl);
  const deliveredMeq = volumeMl * stockMeqMl;
  return { targetMeq, exactVolumeMl, volumeMl, deliveredMeq };
}

export function hyperkalemiaEmergency({ weightKg, youngerThanFive }) {
  if (!positive(weightKg)) return null;
  const insulinUnits = Math.min(weightKg * 0.1, 10);
  const glucoseVolumeMl = youngerThanFive
    ? weightKg * 5
    : Math.min(weightKg * 2, 100);
  const glucoseGrams = glucoseVolumeMl * (youngerThanFive ? 0.1 : 0.25);
  const calciumGluconateMl = Math.min(weightKg * 0.5, 20);
  const bicarbonateMeq = Math.min(weightKg, 50);
  const furosemideMg = Math.min(weightKg, 40);
  return {
    insulinUnits,
    glucoseGrams,
    glucoseVolumeMl,
    calciumGluconateMl,
    bicarbonateMeq,
    furosemideMg,
  };
}
