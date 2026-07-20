export type AntimicrobialRule = {
  basis: "dose" | "day";
  doseMin?: number;
  doseMax?: number;
  fixedDoseMin?: number;
  fixedDoseMax?: number;
  intervalHours?: number;
  once?: boolean;
  maxDose?: number;
  maxDaily?: number;
};

export type AntimicrobialResult = {
  doseMin: number | null;
  doseMax: number | null;
  dailyMin: number | null;
  dailyMax: number | null;
  administrationsPerDay: number | null;
  capped: boolean;
};

export function calculateAntimicrobialRegimen(input: {
  weightKg: number;
  rule: AntimicrobialRule;
}): AntimicrobialResult | null;
