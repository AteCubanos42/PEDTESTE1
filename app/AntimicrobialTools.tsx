"use client";

import { useState } from "react";
import { calculateAntimicrobialRegimen } from "../lib/antimicrobial-calculations.mjs";
import { dailyDosePerKgRange, ruleWithSelectedDailyDose } from "../lib/antimicrobial-dose-selection.mjs";
import type { Antimicrobial } from "./antimicrobials-data";
import { AntimicrobialPrescriptionBuilder } from "./AntimicrobialPrescription";

function parseNumber(value: string) {
  if (!value.trim()) return Number.NaN;
  return Number(value.replace(",", "."));
}

function format(value: number | null, unit: string, digits = 1) {
  if (value === null || !Number.isFinite(value)) return "—";
  const maximumFractionDigits = unit === "UI" && Math.abs(value) >= 1000 ? 0 : digits;
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits }).format(value)} ${unit}`;
}

function formatRange(min: number | null, max: number | null, unit: string) {
  if (min === null || max === null) return "—";
  const left = format(min, unit);
  const right = format(max, unit);
  return Math.abs(min - max) < 1e-9 ? left : `${left} – ${right}`;
}

export function AntimicrobialCalculator({
  antimicrobial,
  initialWeight,
}: {
  antimicrobial: Antimicrobial;
  initialWeight: string;
}) {
  const [weight, setWeight] = useState(initialWeight);
  const [ruleId, setRuleId] = useState(antimicrobial.rules[0]?.id ?? "");
  const rule = antimicrobial.rules.find((item) => item.id === ruleId) ?? antimicrobial.rules[0];
  const dailyRange = dailyDosePerKgRange(rule);
  const [dailyDosePerKg, setDailyDosePerKg] = useState(dailyRange ? String(dailyRange.minimum) : "");
  const selectedDailyDose = parseNumber(dailyDosePerKg);
  const dailyDoseValid = Boolean(dailyRange)
    && Number.isFinite(selectedDailyDose)
    && selectedDailyDose >= (dailyRange?.minimum ?? Number.POSITIVE_INFINITY) - 1e-8
    && selectedDailyDose <= (dailyRange?.maximum ?? Number.NEGATIVE_INFINITY) + 1e-8;
  const effectiveRule = dailyDoseValid ? ruleWithSelectedDailyDose(rule, selectedDailyDose) : null;
  const result = calculateAntimicrobialRegimen({ weightKg: parseNumber(weight), rule: effectiveRule });
  const interval = rule?.intervalLabel ?? (rule?.intervalHours ? `${rule.intervalHours}/${rule.intervalHours} h` : "confirmar");

  function updateRule(value: string) {
    const nextRule = antimicrobial.rules.find((item) => item.id === value) ?? antimicrobial.rules[0];
    const nextRange = dailyDosePerKgRange(nextRule);
    setRuleId(value);
    setDailyDosePerKg(nextRange ? String(nextRange.minimum) : "");
  }

  return (
    <>
      <header className="tool-heading antimicrobial-heading">
        <span className="eyebrow">ATB hospitalar · preparo pediátrico</span>
        <h2>{antimicrobial.name}</h2>
        <p>{antimicrobial.summary}</p>
        <div className="antimicrobial-badges">
          <span>{antimicrobial.className}</span>
          <span>{antimicrobial.routes}</span>
          <span>Uso hospitalar</span>
        </div>
      </header>

      {antimicrobial.critical ? <div className="antimicrobial-critical"><strong>Atenção</strong><span>{antimicrobial.critical}</span></div> : null}
      {antimicrobial.id === "ciprofloxacin-hospital" ? <div className="clinical-note"><strong>Via oral:</strong> o esquema pediátrico VO para ITU complicada/pielonefrite, com suspensão e duração, está na aba <strong>Domiciliares</strong> e usa fonte oficial separada dos esquemas hospitalares.</div> : null}

      <section className="antimicrobial-prescription">
        <div className="antimicrobial-step"><span>01</span><div><strong>Selecione o esquema hospitalar</strong><small>A calculadora não escolhe o antimicrobiano nem a indicação.</small></div></div>
        <label className="select-field">
          <span>População / esquema já definido</span>
          <select aria-label="População e esquema antimicrobiano" onChange={(event) => updateRule(event.target.value)} value={ruleId}>
            {antimicrobial.rules.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Peso do paciente</span>
          <span className="input-wrap">
            <input inputMode="decimal" min="0" onChange={(event) => setWeight(event.target.value)} step="0.1" type="number" value={weight} />
            <span className="input-suffix">kg</span>
          </span>
        </label>
        {dailyRange ? (
          <label className="field daily-dose-selector">
            <span className="field-label">Dose diária escolhida</span>
            <span className="input-wrap">
              <input aria-label="Dose diária por quilograma" inputMode="decimal" max={dailyRange.maximum} min={dailyRange.minimum} onChange={(event) => setDailyDosePerKg(event.target.value)} step={rule.unit === "UI" ? "1000" : "1"} type="number" value={dailyDosePerKg} />
              <span className="input-suffix">{rule.unit}/kg/dia</span>
            </span>
            <small>Selecione entre {format(dailyRange.minimum, rule.unit)} e {format(dailyRange.maximum, rule.unit)}/kg/dia. Tetos por dose e por 24 h são aplicados automaticamente.</small>
          </label>
        ) : null}

        {rule ? (
          <div className="selected-regimen">
            <span>{rule.population}</span>
            <strong>Dose total diária por peso</strong>
            <p>
              {dailyRange ? `${format(selectedDailyDose, rule.unit)}/kg/dia` : "Dose diária indisponível para este esquema"}
              {` · ${interval} · ${rule.route}`}
            </p>
          </div>
        ) : null}
      </section>

      {!dailyDoseValid ? <div className="danger-note">A dose escolhida deve permanecer dentro da faixa diária exibida.</div> : null}

      {result && effectiveRule ? (
        <>
          <section className="antimicrobial-result" aria-live="polite">
            <div className="result-kicker">RESULTADO ARITMÉTICO</div>
            <div className="antimicrobial-result-grid">
              <div className="result-primary"><span>Por administração</span><strong>{formatRange(result.doseMin, result.doseMax, effectiveRule.unit)}</strong></div>
              <div><span>Intervalo</span><strong>{interval}</strong></div>
              <div><span>Via selecionável</span><strong>{effectiveRule.route}</strong></div>
              <div><span>Total em 24 h após teto</span><strong>{formatRange(result.dailyMin, result.dailyMax, effectiveRule.unit)}</strong></div>
            </div>
            {result.capped ? <p className="cap-note">O teto descrito no guia foi aplicado ao resultado.</p> : null}
            {rule.note ? <p className="regimen-note">{rule.note}</p> : null}
          </section>
          <AntimicrobialPrescriptionBuilder
            antimicrobial={antimicrobial}
            key={`${rule.id}:${selectedDailyDose}:${result.doseMin}:${result.doseMax}`}
            result={result}
            rule={effectiveRule}
          />
        </>
      ) : <p className="empty-result">Informe um peso válido para obter a conferência matemática.</p>}

      <section className="antimicrobial-monograph">
        <article><span>APRESENTAÇÃO</span><p>{antimicrobial.presentation}</p></article>
        <article><span>RECONSTITUIÇÃO</span><p>{antimicrobial.reconstitution}</p></article>
        <article><span>ACESSO PERIFÉRICO</span><p>{antimicrobial.peripheral}</p></article>
        <article><span>ACESSO CENTRAL</span><p>{antimicrobial.central}</p></article>
        <article><span>TEMPO DE INFUSÃO</span><p>{antimicrobial.infusion}</p></article>
        <article className="renal-card"><span>OBSERVAÇÕES DO GUIA</span><p>{antimicrobial.observations}</p></article>
      </section>

      <div className="antimicrobial-source-note">
        <strong>Referência hospitalar:</strong> conteúdo factual reestruturado a partir do material fornecido pelo usuário. Sempre conferir indicação, alergias, culturas, antibiograma, função renal/hepática, apresentação disponível e protocolo institucional vigente.
      </div>
    </>
  );
}
