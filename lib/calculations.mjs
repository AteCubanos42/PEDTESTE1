export function maintenanceDaily(weightKg) {
  const weight = Number(weightKg);
  if (!Number.isFinite(weight) || weight <= 0) return 0;
  if (weight <= 10) return weight * 100;
  if (weight <= 20) return 1000 + (weight - 10) * 50;
  return 1500 + (weight - 20) * 20;
}

export function maintenanceHourly(weightKg) {
  return maintenanceDaily(weightKg) / 24;
}

export function infusionFromDose({
  weightKg,
  dose,
  stockPerMl,
  drugVolumeMl,
  finalVolumeMl,
  perMinute = false,
}) {
  const weight = Number(weightKg);
  const prescribed = Number(dose);
  const stock = Number(stockPerMl);
  const drugVolume = Number(drugVolumeMl);
  const finalVolume = Number(finalVolumeMl);
  if (
    ![weight, prescribed, stock, drugVolume, finalVolume].every(Number.isFinite) ||
    weight <= 0 ||
    prescribed < 0 ||
    stock <= 0 ||
    drugVolume <= 0 ||
    finalVolume <= 0 ||
    drugVolume > finalVolume
  ) {
    return null;
  }
  const totalAmount = stock * drugVolume;
  const finalConcentration = totalAmount / finalVolume;
  const amountPerHour = prescribed * weight * (perMinute ? 60 : 1);
  const flowMlH = amountPerHour / finalConcentration;
  return {
    totalAmount,
    finalConcentration,
    amountPerHour,
    flowMlH,
    durationHours: flowMlH > 0 ? finalVolume / flowMlH : 0,
  };
}

export function doseFromInfusion({
  weightKg,
  flowMlH,
  stockPerMl,
  drugVolumeMl,
  finalVolumeMl,
  perMinute = false,
}) {
  const weight = Number(weightKg);
  const flow = Number(flowMlH);
  const stock = Number(stockPerMl);
  const drugVolume = Number(drugVolumeMl);
  const finalVolume = Number(finalVolumeMl);
  if (
    ![weight, flow, stock, drugVolume, finalVolume].every(Number.isFinite) ||
    weight <= 0 ||
    flow < 0 ||
    stock <= 0 ||
    drugVolume <= 0 ||
    finalVolume <= 0 ||
    drugVolume > finalVolume
  ) {
    return null;
  }
  const totalAmount = stock * drugVolume;
  const finalConcentration = totalAmount / finalVolume;
  const amountPerHour = flow * finalConcentration;
  const dose = amountPerHour / weight / (perMinute ? 60 : 1);
  return { totalAmount, finalConcentration, amountPerHour, dose };
}

export function girMixture({
  weightKg,
  girMgKgMin,
  quotaPercent = 100,
  sourceGlucosePercent = 50,
  baseGlucosePercent = 0,
  additiveVolumeMl = 0,
}) {
  const weight = Number(weightKg);
  const gir = Number(girMgKgMin);
  const quota = Number(quotaPercent);
  const source = Number(sourceGlucosePercent);
  const base = Number(baseGlucosePercent);
  const additives = Number(additiveVolumeMl);
  if (
    ![weight, gir, quota, source, base, additives].every(Number.isFinite) ||
    weight <= 0 ||
    gir < 0 ||
    quota <= 0 ||
    source <= base ||
    base < 0 ||
    additives < 0
  ) {
    return null;
  }
  const dailyVolume = maintenanceDaily(weight) * (quota / 100);
  const glucoseMgDay = gir * weight * 1440;
  const glucoseGDay = glucoseMgDay / 1000;
  const targetPercent = (glucoseGDay / dailyVolume) * 100;
  const sourceVolume =
    (targetPercent * dailyVolume - base * (dailyVolume - additives)) /
    (source - base);
  const baseVolume = dailyVolume - sourceVolume - additives;
  const flowMlH = dailyVolume / 24;
  return {
    dailyVolume,
    glucoseGDay,
    targetPercent,
    sourceVolume,
    baseVolume,
    flowMlH,
    feasible: sourceVolume >= 0 && baseVolume >= 0,
  };
}

export function prismIVMortality({
  ageGroup,
  admissionSource,
  cpr,
  cancer,
  lowRiskSystem,
  neurologicScore,
  nonNeurologicScore,
}) {
  const age = {
    newborn: 1.311,
    neonate: 0.968,
    infant: 0.357,
    child: 0,
  }[ageGroup] ?? 0;
  const source = {
    or: 0,
    hospital: 1.012,
    inpatient: 1.626,
    emergency: 0.693,
  }[admissionSource] ?? 0;
  const neuro = Number(neurologicScore);
  const nonNeuro = Number(nonNeurologicScore);
  if (![neuro, nonNeuro].every(Number.isFinite) || neuro < 0 || nonNeuro < 0) {
    return null;
  }
  const logit =
    -5.776 +
    age +
    source +
    (cpr ? 1.082 : 0) +
    (cancer ? 0.766 : 0) +
    (lowRiskSystem ? -1.697 : 0) +
    neuro * 0.197 +
    nonNeuro * 0.163;
  const probability = 1 / (1 + Math.exp(-logit));
  return { logit, probability, percent: probability * 100 };
}

export function nitricOxideFlow({ targetPpm, sourcePpm, totalFlowLMin }) {
  const target = Number(targetPpm);
  const source = Number(sourcePpm);
  const total = Number(totalFlowLMin);
  if (
    ![target, source, total].every(Number.isFinite) ||
    target < 0 ||
    source <= 0 ||
    target >= source ||
    total <= 0
  ) {
    return null;
  }
  const noFlowLMin = (target / source) * total;
  return { noFlowLMin, noFlowMlMin: noFlowLMin * 1000 };
}
