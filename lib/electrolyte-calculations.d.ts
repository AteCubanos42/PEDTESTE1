export function roundTenth(value: number): number;
export function roundUpTenth(value: number): number;
export function roundDownTenth(value: number): number;

export function potassiumEnteral(input: { weightKg: number; dailyDoseMeqKg: number; administrationsPerDay?: number; stockMeqMl?: number; maxDailyMeq?: number }): null | {
  requestedDailyMeq: number; dailyMeq: number; targetPerDoseMeq: number; exactVolumeMl: number; volumePerDoseMl: number; deliveredPerDoseMeq: number; deliveredDailyMeq: number; capped: boolean;
};
export function potassiumIv(input: { weightKg: number; rateMeqKgHour: number; durationHours?: number; targetMeqPer100Ml: number; stockMeqMl?: number }): null | {
  targetTotalMeq: number; exactStockVolumeMl: number; stockVolumeMl: number; deliveredTotalMeq: number; diluentVolumeMl: number; finalVolumeMl: number; pumpRateMlHour: number; finalConcentrationMeq100Ml: number;
};
export function hyponatremiaAdrogue(input: { weightKg: number; currentSodium: number; desiredIncrease: number; infusateSodium?: number; distributionFactor?: number; hours?: number }): null | {
  denominator: number; changePerLiter: number; exactVolumeMl: number; pumpRateMlHour: number; finalVolumeMl: number; expectedIncrease: number; sodiumChloride20Ml: number; glucose5Ml: number;
};
export function hypernatremiaFreeWater(input: { weightKg: number; desiredDecrease: number; hours?: number }): null | {
  exactVolumeMl: number; pumpRateMlHour: number; finalVolumeMl: number; expectedDecrease: number;
};
export function magnesiumIv(input: { weightKg: number; doseMeqKg: number; stockMeqMl?: number; dilutionTotalFactor?: number; maxDoseMeq?: number }): null | {
  requestedDoseMeq: number; targetDoseMeq: number; exactStockVolumeMl: number; stockVolumeMl: number; deliveredDoseMeq: number; finalVolumeMl: number; diluentVolumeMl: number; minimumInfusionMinutes: number; capped: boolean;
};
export function calciumGluconate(input: { weightKg: number; doseMlKg: number; diluentVolumesPerDrugVolume?: number; maxStockVolumeMl?: number }): null | {
  requestedStockVolumeMl: number; exactStockVolumeMl: number; stockVolumeMl: number; diluentVolumeMl: number; finalVolumeMl: number; capped: boolean;
};
export function correctedCalcium(input: { measuredCalciumMgDl: number; albuminGDl: number }): number | null;
export function phosphateIv(input: { weightKg: number; doseMmolKg: number; stockPhosphateMmolMl: number; stockPotassiumMeqMl: number; maxConcentrationMmolMl: number; durationHours?: number }): null | {
  targetPhosphateMmol: number; exactStockVolumeMl: number; stockVolumeMl: number; deliveredPhosphateMmol: number; concomitantPotassiumMeq: number; finalVolumeMl: number; diluentVolumeMl: number; pumpRateMlHour: number; finalConcentrationMmolMl: number;
};
export function bicarbonateDeficit(input: { weightKg: number; baseExcess: number; distributionFactor?: number; stockMeqMl?: number }): null | {
  targetMeq: number; exactVolumeMl: number; volumeMl: number; deliveredMeq: number;
};
export function hyperkalemiaEmergency(input: { weightKg: number; youngerThanFive: boolean }): null | {
  insulinUnits: number; glucoseGrams: number; glucoseVolumeMl: number; calciumGluconateMl: number; bicarbonateMeq: number; furosemideMg: number;
};
