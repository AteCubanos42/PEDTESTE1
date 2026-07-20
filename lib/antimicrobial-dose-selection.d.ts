import type { AntimicrobialRule } from "../app/antimicrobials-data";

export function administrationsPerDay(rule: AntimicrobialRule): number | null;
export function dailyDosePerKgRange(rule: AntimicrobialRule): { minimum: number; maximum: number } | null;
export function ruleWithSelectedDailyDose<T extends AntimicrobialRule>(rule: T, selectedDailyDosePerKg: number): T | null;
