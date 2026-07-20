export function maintenanceDaily(weightKg: number): number;
export function maintenanceHourly(weightKg: number): number;
export function infusionFromDose(input: {
  weightKg: number;
  dose: number;
  stockPerMl: number;
  drugVolumeMl: number;
  finalVolumeMl: number;
  perMinute?: boolean;
}): null | {
  totalAmount: number;
  finalConcentration: number;
  amountPerHour: number;
  flowMlH: number;
  durationHours: number;
};
export function doseFromInfusion(input: {
  weightKg: number;
  flowMlH: number;
  stockPerMl: number;
  drugVolumeMl: number;
  finalVolumeMl: number;
  perMinute?: boolean;
}): null | {
  totalAmount: number;
  finalConcentration: number;
  amountPerHour: number;
  dose: number;
};
export function girMixture(input: {
  weightKg: number;
  girMgKgMin: number;
  quotaPercent?: number;
  sourceGlucosePercent?: number;
  baseGlucosePercent?: number;
  additiveVolumeMl?: number;
}): null | {
  dailyVolume: number;
  glucoseGDay: number;
  targetPercent: number;
  sourceVolume: number;
  baseVolume: number;
  flowMlH: number;
  feasible: boolean;
};
export function prismIVMortality(input: {
  ageGroup: string;
  admissionSource: string;
  cpr: boolean;
  cancer: boolean;
  lowRiskSystem: boolean;
  neurologicScore: number;
  nonNeurologicScore: number;
}): null | { logit: number; probability: number; percent: number };
export function nitricOxideFlow(input: {
  targetPpm: number;
  sourcePpm: number;
  totalFlowLMin: number;
}): null | { noFlowLMin: number; noFlowMlMin: number };
