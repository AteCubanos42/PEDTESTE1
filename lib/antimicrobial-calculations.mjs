function finitePositive(value) {
  return Number.isFinite(value) && value > 0;
}

function applyCap(value, cap) {
  return finitePositive(cap) ? Math.min(value, cap) : value;
}

/**
 * Arithmetic helper for a regimen already selected by a qualified clinician.
 * It does not select an antimicrobial or decide which regimen is appropriate.
 */
export function calculateAntimicrobialRegimen({ weightKg, rule }) {
  if (!finitePositive(weightKg) || !rule) return null;

  const administrationsPerDay = finitePositive(rule.intervalHours)
    ? 24 / rule.intervalHours
    : rule.once
      ? 1
      : null;

  if (finitePositive(rule.fixedDoseMin) || finitePositive(rule.fixedDoseMax)) {
    const fixedMin = rule.fixedDoseMin ?? rule.fixedDoseMax;
    const fixedMax = rule.fixedDoseMax ?? rule.fixedDoseMin;
    if (rule.basis === "day") {
      const initialDailyMin = applyCap(fixedMin, rule.maxDaily);
      const initialDailyMax = applyCap(fixedMax, rule.maxDaily);
      const doseMin = administrationsPerDay ? applyCap(initialDailyMin / administrationsPerDay, rule.maxDose) : null;
      const doseMax = administrationsPerDay ? applyCap(initialDailyMax / administrationsPerDay, rule.maxDose) : null;
      const dailyMin = administrationsPerDay && doseMin !== null ? doseMin * administrationsPerDay : initialDailyMin;
      const dailyMax = administrationsPerDay && doseMax !== null ? doseMax * administrationsPerDay : initialDailyMax;
      return {
        doseMin,
        doseMax,
        dailyMin,
        dailyMax,
        administrationsPerDay,
        capped: dailyMin !== fixedMin || dailyMax !== fixedMax,
      };
    }

    const dailyDoseCap = administrationsPerDay && finitePositive(rule.maxDaily)
      ? rule.maxDaily / administrationsPerDay
      : undefined;
    const perDoseCap = finitePositive(rule.maxDose) && finitePositive(dailyDoseCap)
      ? Math.min(rule.maxDose, dailyDoseCap)
      : rule.maxDose ?? dailyDoseCap;
    const doseMin = applyCap(fixedMin, perDoseCap);
    const doseMax = applyCap(fixedMax, perDoseCap);
    const dailyMin = administrationsPerDay ? doseMin * administrationsPerDay : null;
    const dailyMax = administrationsPerDay ? doseMax * administrationsPerDay : null;
    return {
      doseMin,
      doseMax,
      dailyMin,
      dailyMax,
      administrationsPerDay,
      capped: doseMin !== fixedMin || doseMax !== fixedMax,
    };
  }

  if (!finitePositive(rule.doseMin) && !finitePositive(rule.doseMax)) return null;

  const rawMin = weightKg * (rule.doseMin ?? rule.doseMax);
  const rawMax = weightKg * (rule.doseMax ?? rule.doseMin);

  if (rule.basis === "day") {
    const initialDailyMin = applyCap(rawMin, rule.maxDaily);
    const initialDailyMax = applyCap(rawMax, rule.maxDaily);
    const doseMin = administrationsPerDay ? applyCap(initialDailyMin / administrationsPerDay, rule.maxDose) : null;
    const doseMax = administrationsPerDay ? applyCap(initialDailyMax / administrationsPerDay, rule.maxDose) : null;
    const dailyMin = administrationsPerDay && doseMin !== null ? doseMin * administrationsPerDay : initialDailyMin;
    const dailyMax = administrationsPerDay && doseMax !== null ? doseMax * administrationsPerDay : initialDailyMax;
    return {
      doseMin,
      doseMax,
      dailyMin,
      dailyMax,
      administrationsPerDay,
      capped: dailyMin !== rawMin || dailyMax !== rawMax,
    };
  }

  const dailyDoseCap = administrationsPerDay && finitePositive(rule.maxDaily)
    ? rule.maxDaily / administrationsPerDay
    : undefined;
  const perDoseCap = finitePositive(rule.maxDose) && finitePositive(dailyDoseCap)
    ? Math.min(rule.maxDose, dailyDoseCap)
    : rule.maxDose ?? dailyDoseCap;
  const doseMin = applyCap(rawMin, perDoseCap);
  const doseMax = applyCap(rawMax, perDoseCap);
  const dailyMin = administrationsPerDay ? doseMin * administrationsPerDay : null;
  const dailyMax = administrationsPerDay ? doseMax * administrationsPerDay : null;
  return {
    doseMin,
    doseMax,
    dailyMin,
    dailyMax,
    administrationsPerDay,
    capped:
      doseMin !== rawMin ||
      doseMax !== rawMax ||
      false,
  };
}
