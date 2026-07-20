"use client";

import { useState } from "react";
import { calculateAntimicrobialRegimen } from "../lib/antimicrobial-calculations.mjs";
import { dailyDosePerKgRange, ruleWithSelectedDailyDose } from "../lib/antimicrobial-dose-selection.mjs";
import { PrescriptionBlock } from "./PrescriptionBlock";
import type { OralAntibiotic, OralRule } from "./oral-antibiotics-data";

function parseNumber(value: string) {
  if (!value.trim()) return Number.NaN;
  return Number(value.replace(",", "."));
}

function formatNumber(value: number | null, digits = 1) {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(value);
}

function formatRange(minimum: number | null, maximum: number | null, unit = "mg") {
  if (minimum === null || maximum === null) return "—";
  if (Math.abs(minimum - maximum) < 1e-9) return `${formatNumber(minimum)} ${unit}`;
  return `${formatNumber(minimum)}–${formatNumber(maximum)} ${unit}`;
}

function frequencyText(rule: OralRule) {
  if (rule.once) return "DOSE ÚNICA";
  return rule.intervalHours ? `DE ${formatNumber(rule.intervalHours, 0)}/${formatNumber(rule.intervalHours, 0)}H` : "FREQUÊNCIA A CONFIRMAR";
}

function roundToTenth(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function OralPrescriptionBuilder({
  antibiotic,
  rule,
  result,
  weightKg,
}: {
  antibiotic: OralAntibiotic;
  rule: OralRule;
  result: NonNullable<ReturnType<typeof calculateAntimicrobialRegimen>>;
  weightKg: number;
}) {
  const requiredFormulation = rule.requiredFormulationId
    ? antibiotic.formulations.find((item) => item.id === rule.requiredFormulationId)
    : undefined;
  const initialFormulation = requiredFormulation ?? antibiotic.formulations[0];
  const initialDose = roundToTenth(result.doseMin ?? result.doseMax ?? Number.NaN);
  const [formulationId, setFormulationId] = useState(initialFormulation.id);
  const [concentration, setConcentration] = useState(String(initialFormulation.concentrationMgMl));
  const [duration, setDuration] = useState(rule.defaultDuration ? String(rule.defaultDuration) : "");
  const [confirmed, setConfirmed] = useState(false);
  const formulation = antibiotic.formulations.find((item) => item.id === formulationId) ?? initialFormulation;
  const dose = initialDose;
  const minimumDose = result.doseMin ?? result.doseMax ?? Number.NaN;
  const maximumDose = result.doseMax ?? result.doseMin ?? Number.NaN;
  const doseValid = Number.isFinite(dose)
    && dose > 0
    && dose >= minimumDose - 0.051
    && dose <= maximumDose + 0.051;
  const stock = parseNumber(concentration);
  const exactVolume = dose / stock;
  const roundedVolume = roundToTenth(exactVolume);
  const administeredDose = roundedVolume * stock;
  const doseAfterRoundingValid = Number.isFinite(administeredDose)
    && administeredDose >= minimumDose - 1e-8
    && administeredDose <= maximumDose + 1e-8
    && Math.abs(administeredDose - dose) / dose <= 0.05;
  const days = parseNumber(duration);
  const hasSourceDuration = Number.isFinite(rule.durationMin) && Number.isFinite(rule.durationMax);
  const durationValid = Number.isInteger(days)
    && days > 0
    && (!hasSourceDuration || (days >= (rule.durationMin ?? 0) && days <= (rule.durationMax ?? Number.POSITIVE_INFINITY)));
  const administrationsPerDay = result.administrationsPerDay ?? 1;
  const totalVolume = Math.ceil(roundedVolume * administrationsPerDay * days * 10) / 10;
  const formulationValid = !rule.requiredFormulationId || formulation.id === rule.requiredFormulationId;
  const weightValid = !rule.maxWeightKg || weightKg <= rule.maxWeightKg;
  const measurableVolume = Number.isFinite(exactVolume) && exactVolume >= 0.05;
  const valid = doseValid
    && Number.isFinite(stock)
    && stock > 0
    && durationValid
    && formulationValid
    && weightValid
    && measurableVolume
    && doseAfterRoundingValid
    && confirmed;
  const component = rule.doseComponent ? `, calculada pelo componente ${rule.doseComponent}` : "";
  const prescription = [
    `${antibiotic.name.toLocaleUpperCase("pt-BR")} SUSPENSÃO ORAL (${formulation.label}).`,
    `ADMINISTRAR ${formatNumber(roundedVolume)} ML VO ${frequencyText(rule)} POR ${formatNumber(days, 0)} DIAS.`,
    `DOSE: ${formatNumber(administeredDose)} MG/DOSE${component.toLocaleUpperCase("pt-BR")}.`,
    `DISPENSAR PELO MENOS ${formatNumber(totalVolume)} ML.`,
  ].join("\n");

  function updateFormulation(value: string) {
    const selected = antibiotic.formulations.find((item) => item.id === value);
    setFormulationId(value);
    if (selected) setConcentration(String(selected.concentrationMgMl));
  }

  return (
    <section className="antimicrobial-builder oral-builder">
      <div className="antimicrobial-step"><span>02</span><div><strong>Transforme a dose em prescrição domiciliar</strong><small>Formulação, dose e duração permanecem explícitas e editáveis.</small></div></div>
      <div className="form-grid three antimicrobial-builder-grid">
        <label className="field">
          <span className="field-label">Formulação da suspensão</span>
          <span className="select-wrap"><select onChange={(event) => updateFormulation(event.target.value)} value={formulationId}>{antibiotic.formulations.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></span>
        </label>
        <label className="field"><span className="field-label">Concentração usada no cálculo</span><span className="input-wrap"><input inputMode="decimal" min="0" onChange={(event) => setConcentration(event.target.value)} step="any" type="number" value={concentration} /><span className="input-suffix">mg/mL</span></span><small>Confirme no frasco dispensado.</small></label>
        <div className="derived-field"><span>DOSE CALCULADA POR ADMINISTRAÇÃO</span><strong>{formatNumber(dose)} mg</strong><small>Derivada da dose diária escolhida e do intervalo.</small></div>
        <label className="field"><span className="field-label">Duração definida clinicamente</span><span className="input-wrap"><input inputMode="numeric" min={hasSourceDuration ? rule.durationMin : 1} max={hasSourceDuration ? rule.durationMax : undefined} onChange={(event) => setDuration(event.target.value)} placeholder="Informar" step="1" type="number" value={duration} /><span className="input-suffix">dias</span></span><small>{hasSourceDuration ? `Faixa da fonte: ${rule.durationMin === rule.durationMax ? `${rule.durationMin} dias` : `${rule.durationMin}–${rule.durationMax} dias`}.` : rule.durationGuidance}</small></label>
        <div className="derived-field"><span>VOLUME POR DOSE</span><strong>{measurableVolume ? formatNumber(roundedVolume) : "<0,1"} mL</strong></div>
        <div className="derived-field"><span>DOSE APÓS ARREDONDAMENTO</span><strong>{formatNumber(administeredDose)} mg</strong></div>
        <div className="derived-field"><span>VOLUME TOTAL ESTIMADO</span><strong>{formatNumber(totalVolume)} mL</strong></div>
      </div>

      {!doseValid ? <div className="danger-note">A dose escolhida precisa permanecer dentro da faixa calculada para o esquema selecionado.</div> : null}
      {!durationValid ? <div className="danger-note">Informe uma duração inteira válida{hasSourceDuration ? " dentro da faixa descrita na fonte oficial" : " conforme o diagnóstico e o protocolo local"}; a calculadora não a escolhe automaticamente.</div> : null}
      {!formulationValid ? <div className="danger-note">Este esquema exige a formulação {requiredFormulation?.label}; a cópia foi bloqueada.</div> : null}
      {!weightValid ? <div className="danger-note">Este esquema da bula é limitado a pacientes de até {rule.maxWeightKg} kg; acima disso, use o regime adulto institucional.</div> : null}
      {!measurableVolume ? <div className="danger-note">O volume calculado ficaria abaixo de 0,1 mL após arredondamento. Se necessário, use formulação/diluição validada pela farmácia; a cópia está bloqueada.</div> : null}
      {doseValid && measurableVolume && !doseAfterRoundingValid ? <div className="danger-note">Arredondar o volume para uma casa decimal altera a dose em mais de 5% ou a retira da faixa selecionada. Escolha outra formulação/dose ou valide o preparo com a farmácia.</div> : null}
      {antibiotic.warning ? <div className="danger-note">{antibiotic.warning}</div> : null}
      {rule.note ? <div className="clinical-note"><strong>Regra selecionada:</strong> {rule.note}</div> : null}
      <label className="guide-verification">
        <input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />
        <span>Confirmei indicação bacteriana, idade, peso, alergias, função renal/hepática, interações, cultura/antibiograma quando aplicável e formulação realmente dispensada.</span>
      </label>
      <PrescriptionBlock invalidMessage="Revise esquema, dose, apresentação, duração e confirmação clínica. A cópia permanece bloqueada enquanto houver divergência." text={prescription} valid={valid} />
    </section>
  );
}

export function OralAntibioticCalculator({ antibiotic, initialWeight }: { antibiotic: OralAntibiotic; initialWeight: string }) {
  const [weight, setWeight] = useState(initialWeight);
  const [ruleId, setRuleId] = useState(antibiotic.rules[0]?.id ?? "");
  const rule = antibiotic.rules.find((item) => item.id === ruleId) ?? antibiotic.rules[0];
  const dailyRange = dailyDosePerKgRange(rule);
  const [dailyDosePerKg, setDailyDosePerKg] = useState(dailyRange ? String(dailyRange.minimum) : "");
  const selectedDailyDose = parseNumber(dailyDosePerKg);
  const dailyDoseValid = Boolean(dailyRange)
    && Number.isFinite(selectedDailyDose)
    && selectedDailyDose >= (dailyRange?.minimum ?? Number.POSITIVE_INFINITY) - 1e-8
    && selectedDailyDose <= (dailyRange?.maximum ?? Number.NEGATIVE_INFINITY) + 1e-8;
  const effectiveRule = dailyDoseValid ? ruleWithSelectedDailyDose(rule, selectedDailyDose) : null;
  const weightKg = parseNumber(weight);
  const result = calculateAntimicrobialRegimen({ weightKg, rule: effectiveRule });
  const interval = rule.intervalHours ? `${formatNumber(rule.intervalHours, 0)}/${formatNumber(rule.intervalHours, 0)} h` : "confirmar";

  function updateRule(value: string) {
    const nextRule = antibiotic.rules.find((item) => item.id === value) ?? antibiotic.rules[0];
    const nextRange = dailyDosePerKgRange(nextRule);
    setRuleId(value);
    setDailyDosePerKg(nextRange ? String(nextRange.minimum) : "");
  }

  return (
    <>
      <header className="tool-heading antimicrobial-heading">
        <span className="eyebrow">Antibiótico domiciliar · via oral</span>
        <h2>{antibiotic.name}</h2>
        <p>{antibiotic.summary}</p>
        <div className="antimicrobial-badges"><span>{antibiotic.className}</span><span>VO</span><span>Fonte oficial</span></div>
      </header>
      <section className="antimicrobial-prescription">
        <div className="antimicrobial-step"><span>01</span><div><strong>Selecione a indicação e o esquema já definidos</strong><small>A calculadora não diagnostica, não escolhe o antibiótico e não substitui o protocolo local.</small></div></div>
        <label className="select-field"><span>Indicação / esquema</span><select onChange={(event) => updateRule(event.target.value)} value={ruleId}>{antibiotic.rules.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="field"><span className="field-label">Peso do paciente</span><span className="input-wrap"><input inputMode="decimal" min="0" onChange={(event) => setWeight(event.target.value)} step="0.1" type="number" value={weight} /><span className="input-suffix">kg</span></span></label>
        {dailyRange ? <label className="field daily-dose-selector"><span className="field-label">Dose diária escolhida</span><span className="input-wrap"><input inputMode="decimal" max={dailyRange.maximum} min={dailyRange.minimum} onChange={(event) => setDailyDosePerKg(event.target.value)} step="1" type="number" value={dailyDosePerKg} /><span className="input-suffix">mg/kg/dia</span></span><small>Faixa convertida para 24 h: {formatNumber(dailyRange.minimum)}–{formatNumber(dailyRange.maximum)} mg/kg/dia. Tetos da fonte permanecem ativos.</small></label> : null}
        <div className="selected-regimen"><span>{rule.ageLabel}</span><strong>Dose total diária por peso</strong><p>{formatNumber(selectedDailyDose)} mg/kg/dia · {interval} · VO</p></div>
      </section>

      {!dailyDoseValid ? <div className="danger-note">A dose escolhida deve permanecer dentro da faixa diária exibida.</div> : null}

      {result && effectiveRule ? (
        <>
          <section className="antimicrobial-result" aria-live="polite">
            <div className="result-kicker">RESULTADO ARITMÉTICO</div>
            <div className="antimicrobial-result-grid">
              <div className="result-primary"><span>Por administração</span><strong>{formatRange(result.doseMin, result.doseMax)}</strong></div>
              <div><span>Intervalo</span><strong>{interval}</strong></div>
              <div><span>Via</span><strong>Oral</strong></div>
              <div><span>Total em 24 h</span><strong>{formatRange(result.dailyMin, result.dailyMax)}</strong></div>
            </div>
            {result.capped ? <p className="cap-note">O teto adulto descrito na fonte foi aplicado ao resultado.</p> : null}
          </section>
          <OralPrescriptionBuilder antibiotic={antibiotic} key={`${rule.id}:${selectedDailyDose}:${result.doseMin}:${result.doseMax}`} result={result} rule={effectiveRule} weightKg={weightKg} />
        </>
      ) : <p className="empty-result">Informe um peso válido para obter a conferência matemática.</p>}

      <div className="antimicrobial-source-note oral-source-note">
        <strong>Fonte do esquema:</strong> <a href={rule.sourceUrl} rel="noreferrer" target="_blank">{rule.sourceTitle}</a>. A disponibilidade de apresentações e recomendações locais pode diferir; validar com bula brasileira, CCIH/farmácia e protocolo vigente.
      </div>
    </>
  );
}
