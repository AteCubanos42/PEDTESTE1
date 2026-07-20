function positive(value) {
  return Number.isFinite(value) && value > 0;
}

/**
 * Returns the smallest final volume that respects both the guide's stated
 * diluent multiplier and its printed target/maximum concentration.
 */
export function guideFinalVolume({ dose, stockConcentration, targetConcentration, diluentMultiple }) {
  if (!positive(dose) || !positive(stockConcentration) || !positive(targetConcentration)) return Number.NaN;
  const minimumForConcentration = dose / targetConcentration;
  if (!Number.isFinite(diluentMultiple) || diluentMultiple < 0) return minimumForConcentration;
  const volumeFromMultiplier = (dose / stockConcentration) * (1 + diluentMultiple);
  return Math.max(minimumForConcentration, volumeFromMultiplier);
}
