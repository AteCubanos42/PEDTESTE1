function finitePositive(value) {
  return Number.isFinite(value) && value > 0;
}

export function administrationsPerDay(rule) {
  if (finitePositive(rule?.intervalHours)) return 24 / rule.intervalHours;
  if (rule?.once) return 1;
  return null;
}

export function dailyDosePerKgRange(rule) {
  if (!rule || finitePositive(rule.fixedDoseMin) || finitePositive(rule.fixedDoseMax)) return null;
  const minimum = rule.doseMin ?? rule.doseMax;
  const maximum = rule.doseMax ?? rule.doseMin;
  if (!finitePositive(minimum) || !finitePositive(maximum)) return null;
  if (rule.basis === "day") return { minimum, maximum };
  const administrations = administrationsPerDay(rule);
  if (!finitePositive(administrations)) return null;
  return {
    minimum: minimum * administrations,
    maximum: maximum * administrations,
  };
}

export function ruleWithSelectedDailyDose(rule, selectedDailyDosePerKg) {
  if (!rule || !finitePositive(selectedDailyDosePerKg)) return null;
  return {
    ...rule,
    basis: "day",
    doseMin: selectedDailyDosePerKg,
    doseMax: selectedDailyDosePerKg,
    fixedDoseMin: undefined,
    fixedDoseMax: undefined,
  };
}
