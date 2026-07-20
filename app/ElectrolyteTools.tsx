"use client";

import { useState } from "react";
import {
  bicarbonateDeficit,
  calciumGluconate,
  correctedCalcium,
  hyperkalemiaEmergency,
  hypernatremiaFreeWater,
  hyponatremiaAdrogue,
  magnesiumIv,
  phosphateIv,
  potassiumEnteral,
  potassiumIv,
} from "../lib/electrolyte-calculations.mjs";
import { PrescriptionBlock } from "./PrescriptionBlock";

export type ElectrolyteToolId = "potassium" | "hyponatremia" | "hypernatremia" | "magnesium" | "calcium" | "phosphate" | "bicarbonate" | "hyperkalemia";

export const ELECTROLYTE_TOOLS: Array<{ id: ElectrolyteToolId; symbol: string; name: string; description: string; tag: string }> = [
  { id: "potassium", symbol: "K", name: "Correção de potássio", description: "Hipocalemia enteral ou fase rápida IV, com limites por acesso.", tag: "K+" },
  { id: "hyponatremia", symbol: "Na", name: "Hiponatremia", description: "Planejamento de NaCl 3% em 24 h pela fórmula de Adrogué.", tag: "Na baixo" },
  { id: "hypernatremia", symbol: "Na", name: "Hipernatremia", description: "Água livre por queda desejada, com limite diário explícito.", tag: "Na alto" },
  { id: "magnesium", symbol: "Mg", name: "Hipomagnesemia", description: "Sulfato de magnésio 50%, rediluição e velocidade máxima.", tag: "Mg2+" },
  { id: "calcium", symbol: "Ca", name: "Correção de cálcio", description: "Cálcio corrigido e gluconato 10% na hipocalcemia sintomática.", tag: "Ca2+" },
  { id: "phosphate", symbol: "P", name: "Hipofosfatemia", description: "Fosfato IV, concentração por acesso e carga concomitante de K.", tag: "PO₄" },
  { id: "bicarbonate", symbol: "H", name: "Reposição de bicarbonato", description: "Déficit pelo excesso de bases, com indicação crítica confirmada.", tag: "HCO₃" },
  { id: "hyperkalemia", symbol: "K", name: "Hipercalemia", description: "Painel de conferência matemática das medidas emergenciais.", tag: "K alto" },
];

function number(value: string) {
  if (!value.trim()) return Number.NaN;
  return Number(value.replace(",", "."));
}

function fmt(value: number, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(value);
}

function NumberField({ label, value, onChange, suffix, min, max, step = "0.1", helper }: { label: string; value: string; onChange: (value: string) => void; suffix: string; min?: number; max?: number; step?: string; helper?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="input-wrap"><input inputMode="decimal" max={max} min={min} onChange={(event) => onChange(event.target.value)} step={step} type="number" value={value} /><span className="input-suffix">{suffix}</span></span>
      {helper ? <small>{helper}</small> : null}
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="field"><span className="field-label">{label}</span><span className="select-wrap"><select onChange={(event) => onChange(event.target.value)} value={value}>{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></span></label>;
}

function ToolHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="tool-heading electrolyte-heading"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}

function Confirmation({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) {
  return <label className="guide-verification electrolyte-verification"><input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" /><span>{children}</span></label>;
}

function ResultGrid({ children }: { children: React.ReactNode }) {
  return <div className="result-panel electrolyte-results">{children}</div>;
}

function Sources({ children }: { children?: React.ReactNode }) {
  return (
    <div className="antimicrobial-source-note electrolyte-sources">
      <strong>Referências:</strong> material RFOFOS 2026 fornecido pelo usuário, com conferência de limites em fontes pediátricas oficiais. {children}
    </div>
  );
}

function PotassiumCalculator({ initialWeight }: { initialWeight: string }) {
  const [weight, setWeight] = useState(initialWeight);
  const [serumPotassium, setSerumPotassium] = useState("2.4");
  const [mode, setMode] = useState<"enteral" | "iv">("iv");
  const [dailyDose, setDailyDose] = useState("2");
  const [rateDose, setRateDose] = useState("0.5");
  const [access, setAccess] = useState<"AVP" | "AVC">("AVP");
  const [concentration, setConcentration] = useState("4");
  const [confirmed, setConfirmed] = useState(false);
  const weightKg = number(weight);
  const potassium = number(serumPotassium);
  const enteralDose = number(dailyDose);
  const rate = number(rateDose);
  const targetConcentration = number(concentration);
  const enteral = potassiumEnteral({ weightKg, dailyDoseMeqKg: enteralDose });
  const iv = potassiumIv({ weightKg, rateMeqKgHour: rate, targetMeqPer100Ml: targetConcentration });
  const concentrationLimit = access === "AVP" ? 6 : 12;
  const enteralRoundingValid = Boolean(enteral) && Math.abs((enteral?.deliveredDailyMeq ?? 0) - (enteral?.dailyMeq ?? 0)) / (enteral?.dailyMeq ?? 1) <= 0.05;
  const ivRoundingValid = Boolean(iv) && Math.abs((iv?.deliveredTotalMeq ?? 0) - (iv?.targetTotalMeq ?? 0)) / (iv?.targetTotalMeq ?? 1) <= 0.05;
  const enteralValid = mode === "enteral" && potassium > 2.5 && enteralDose >= 2 && enteralDose <= 4 && enteralRoundingValid && confirmed;
  const ivValid = mode === "iv" && potassium < 2.5 && rate >= 0.5 && rate <= 1 && targetConcentration >= 4 && targetConcentration <= concentrationLimit && ivRoundingValid && confirmed;
  const prescription = mode === "enteral" && enteral
    ? [
        "CLORETO DE POTÁSSIO XAROPE 6% (0,8 MEQ/ML).",
        `ADMINISTRAR ${fmt(enteral.volumePerDoseMl)} ML VO DE 6/6H.`,
        `OFERTA: ${fmt(enteral.deliveredPerDoseMeq)} MEQ/DOSE; ${fmt(enteral.deliveredDailyMeq)} MEQ/DIA.`,
      ].join("\n")
    : iv
      ? [
          `CLORETO DE POTÁSSIO 10% (1,34 MEQ/ML) ____ ${fmt(iv.stockVolumeMl)} ML.`,
          `SF 0,9% ____ ${fmt(iv.diluentVolumeMl)} ML.`,
          `VT ${fmt(iv.finalVolumeMl)} ML EV EM 4H, EM BIC A ${fmt(iv.pumpRateMlHour)} ML/H.`,
          `ACESSO ${access}; CONCENTRAÇÃO FINAL ${fmt(iv.finalConcentrationMeq100Ml)} MEQ/100 ML.`,
          `OFERTA TOTAL: ${fmt(iv.deliveredTotalMeq)} MEQ (${fmt(rate)} MEQ/KG/H POR 4H).`,
          "MANTER ECG CONTÍNUO E REPETIR POTÁSSIO EM 4–6H.",
        ].join("\n")
      : "";

  function updateAccess(next: string) {
    const value = next as "AVP" | "AVC";
    setAccess(value);
    setConcentration(value === "AVP" ? "4" : "8");
  }

  return (
    <>
      <ToolHeading eyebrow="Distúrbios hidroeletrolíticos" title="Correção de potássio">Escolha a gravidade já definida e confira a oferta enteral ou a fase rápida IV.</ToolHeading>
      <div className="segmented"><button className={mode === "enteral" ? "active" : ""} onClick={() => setMode("enteral")}>Leve/moderada · VO</button><button className={mode === "iv" ? "active" : ""} onClick={() => setMode("iv")}>Grave · IV</button></div>
      <div className="form-grid two"><NumberField label="Peso" value={weight} onChange={setWeight} suffix="kg" min={0} /><NumberField label="Potássio sérico" value={serumPotassium} onChange={setSerumPotassium} suffix="mEq/L" min={0} /></div>
      {mode === "enteral" ? (
        <div className="form-grid two"><NumberField label="Dose diária escolhida" value={dailyDose} onChange={setDailyDose} suffix="mEq/kg/dia" min={2} max={4} helper="Faixa do material: 2–4 mEq/kg/dia, dividida em quatro tomadas; máximo 240 mEq/dia." />{enteral ? <div className="derived-field"><span>POR TOMADA</span><strong>{fmt(enteral.volumePerDoseMl)} mL</strong><small>{fmt(enteral.deliveredPerDoseMeq)} mEq por dose.</small></div> : null}</div>
      ) : (
        <div className="form-grid three"><NumberField label="Dose da fase rápida" value={rateDose} onChange={setRateDose} suffix="mEq/kg/h" min={0.5} max={1} /><SelectField label="Acesso" value={access} onChange={updateAccess} options={[{ value: "AVP", label: "Venoso periférico (AVP)" }, { value: "AVC", label: "Venoso central (AVC)" }]} /><NumberField label="Concentração escolhida" value={concentration} onChange={setConcentration} suffix="mEq/100 mL" min={4} max={concentrationLimit} helper={`Limite configurado: ${concentrationLimit} mEq/100 mL.`} /></div>
      )}
      {mode === "enteral" && enteral ? <ResultGrid><div><span>Total diário</span><strong>{fmt(enteral.deliveredDailyMeq)} mEq</strong></div><div><span>Volume por dose</span><strong>{fmt(enteral.volumePerDoseMl)} mL</strong></div><div><span>Frequência</span><strong>6/6 h</strong></div><div className="result-primary"><span>Dose por administração</span><strong>{fmt(enteral.deliveredPerDoseMeq)} mEq</strong></div></ResultGrid> : null}
      {mode === "iv" && iv ? <ResultGrid><div><span>KCl 10%</span><strong>{fmt(iv.stockVolumeMl)} mL</strong></div><div><span>SF 0,9%</span><strong>{fmt(iv.diluentVolumeMl)} mL</strong></div><div><span>Volume final</span><strong>{fmt(iv.finalVolumeMl)} mL</strong></div><div className="result-primary"><span>Programar BIC</span><strong>{fmt(iv.pumpRateMlHour)} mL/h</strong></div></ResultGrid> : null}
      {mode === "iv" && potassium >= 2.5 ? <div className="danger-note">A fase rápida IV está configurada apenas para K &lt; 2,5 mEq/L; confirme gravidade e indicação.</div> : null}
      {mode === "enteral" && potassium <= 2.5 ? <div className="danger-note">Com K ≤ 2,5 mEq/L, o modo enteral isolado não corresponde ao cenário configurado no material.</div> : null}
      {!enteralRoundingValid && mode === "enteral" ? <div className="danger-note">O arredondamento para 0,1 mL altera a oferta em mais de 5%; ajuste a apresentação.</div> : null}
      {!ivRoundingValid && mode === "iv" ? <div className="danger-note">O arredondamento para 0,1 mL altera a dose em mais de 5%; ajuste o preparo.</div> : null}
      <Confirmation checked={confirmed} onChange={setConfirmed}>Confirmei função renal e diurese, magnésio, via/acesso, concentração institucional, ECG quando IV e plano de nova dosagem em 4–6 horas.</Confirmation>
      <PrescriptionBlock invalidMessage="Revise gravidade, faixa de dose, concentração por acesso, arredondamento e confirmação clínica." text={prescription} valid={mode === "enteral" ? enteralValid : ivValid} />
      <Sources><a href="https://pch.health.wa.gov.au/~/media/Files/Hospitals/PCH/General-documents/Health-professionals/MedicationMonographs/Potassium.pdf" rel="noreferrer" target="_blank">Monografia pediátrica oficial de potássio</a>.</Sources>
    </>
  );
}

function HyponatremiaCalculator({ initialWeight }: { initialWeight: string }) {
  const [weight, setWeight] = useState(initialWeight);
  const [currentSodium, setCurrentSodium] = useState("115");
  const [desiredIncrease, setDesiredIncrease] = useState("6");
  const [symptomatic, setSymptomatic] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const current = number(currentSodium);
  const desired = number(desiredIncrease);
  const result = hyponatremiaAdrogue({ weightKg: number(weight), currentSodium: current, desiredIncrease: desired });
  const indicationValid = current < 120 || symptomatic;
  const valid = Boolean(result) && desired > 0 && desired <= 8 && (result?.expectedIncrease ?? 99) <= 8 && indicationValid && confirmed;
  const prescription = result ? [
    "CORREÇÃO PLANEJADA DE HIPONATREMIA — FASE ÚNICA DE 24H.",
    `NACL 20% ____ ${fmt(result.sodiumChloride20Ml)} ML.`,
    `SG 5% ____ ${fmt(result.glucose5Ml)} ML.`,
    `VT ${fmt(result.finalVolumeMl)} ML EV EM 24H, EM BIC A ${fmt(result.pumpRateMlHour)} ML/H.`,
    `VARIAÇÃO ESTIMADA: +${fmt(result.expectedIncrease)} MEQ/L EM 24H.`,
  ].join("\n") : "";
  return (
    <>
      <ToolHeading eyebrow="Distúrbios hidroeletrolíticos" title="Hiponatremia · Adrogué">Planejamento de NaCl 3% em 24 horas; não substitui o protocolo de bolus para emergência neurológica.</ToolHeading>
      <div className="form-grid three"><NumberField label="Peso" value={weight} onChange={setWeight} suffix="kg" min={0} /><NumberField label="Sódio atual" value={currentSodium} onChange={setCurrentSodium} suffix="mEq/L" min={0} /><NumberField label="Aumento desejado em 24 h" value={desiredIncrease} onChange={setDesiredIncrease} suffix="mEq/L" min={0.1} max={8} helper="Preferência do material: 6–8 mEq/L/24 h; a ferramenta não permite mais que 8." /></div>
      <label className="guide-verification indication-check"><input checked={symptomatic} onChange={(event) => setSymptomatic(event.target.checked)} type="checkbox" /><span>Há indicação clínica confirmada apesar de Na ≥120 mEq/L.</span></label>
      {result ? <ResultGrid><div><span>ΔNa por 1 L de NaCl 3%</span><strong>{fmt(result.changePerLiter)} mEq/L</strong></div><div><span>NaCl 20%</span><strong>{fmt(result.sodiumChloride20Ml)} mL</strong></div><div><span>SG 5%</span><strong>{fmt(result.glucose5Ml)} mL</strong></div><div className="result-primary"><span>BIC por 24 h</span><strong>{fmt(result.pumpRateMlHour)} mL/h</strong></div></ResultGrid> : null}
      {!indicationValid ? <div className="danger-note">O material restringe esta reposição a Na &lt;120 mEq/L ou quadro sintomático confirmado.</div> : null}
      {desired > 8 ? <div className="danger-note">Aumento acima de 8 mEq/L em 24 horas foi bloqueado.</div> : null}
      <div className="danger-note"><strong>Cenário agudo:</strong> sintomas neurológicos graves exigem protocolo emergencial específico e avaliação intensiva; não use esta fase de 24 horas como substituto de bolus.</div>
      <Confirmation checked={confirmed} onChange={setConfirmed}>Confirmei cronicidade, sintomas, volemia, função renal, todos os fluidos/fontes de sódio e monitorização seriada; o preparo de NaCl 3% será validado pela farmácia.</Confirmation>
      <PrescriptionBlock invalidMessage="Revise indicação, alvo máximo de correção, preparo de NaCl 3% e confirmação clínica." text={prescription} valid={valid} />
      <Sources><a href="https://www.rch.org.au/clinicalguide/guideline_index/hyponatraemia/" rel="noreferrer" target="_blank">Diretriz pediátrica oficial de hiponatremia</a>.</Sources>
    </>
  );
}

function HypernatremiaCalculator({ initialWeight }: { initialWeight: string }) {
  const [weight, setWeight] = useState(initialWeight);
  const [currentSodium, setCurrentSodium] = useState("160");
  const [desiredDecrease, setDesiredDecrease] = useState("8");
  const [confirmed, setConfirmed] = useState(false);
  const current = number(currentSodium);
  const desired = number(desiredDecrease);
  const result = hypernatremiaFreeWater({ weightKg: number(weight), desiredDecrease: desired });
  const valid = Boolean(result) && current > 145 && desired > 0 && desired <= 10 && (result?.expectedDecrease ?? 99) <= 10 && confirmed;
  const prescription = result ? [
    "ÁGUA LIVRE PARA CORREÇÃO PLANEJADA DE HIPERNATREMIA.",
    `SG 5% ____ ${fmt(result.finalVolumeMl)} ML.`,
    `CORRER EV EM 24H, EM BIC A ${fmt(result.pumpRateMlHour)} ML/H.`,
    `QUEDA ESTIMADA: ${fmt(result.expectedDecrease)} MEQ/L EM 24H.`,
  ].join("\n") : "";
  return (
    <>
      <ToolHeading eyebrow="Distúrbios hidroeletrolíticos" title="Hipernatremia · água livre">Cálculo por 4 mL/kg para cada 1 mEq/L de queda desejada, integrado ao plano hídrico total.</ToolHeading>
      <div className="form-grid three"><NumberField label="Peso" value={weight} onChange={setWeight} suffix="kg" min={0} /><NumberField label="Sódio atual" value={currentSodium} onChange={setCurrentSodium} suffix="mEq/L" min={0} /><NumberField label="Queda desejada em 24 h" value={desiredDecrease} onChange={setDesiredDecrease} suffix="mEq/L" min={0.1} max={10} /></div>
      {result ? <ResultGrid><div><span>Volume exato calculado</span><strong>{fmt(result.exactVolumeMl)} mL</strong></div><div><span>Volume programado</span><strong>{fmt(result.finalVolumeMl)} mL</strong></div><div><span>Queda estimada</span><strong>{fmt(result.expectedDecrease)} mEq/L</strong></div><div className="result-primary"><span>BIC por 24 h</span><strong>{fmt(result.pumpRateMlHour)} mL/h</strong></div></ResultGrid> : null}
      {current <= 145 ? <div className="danger-note">Informe hipernatremia confirmada; este cálculo está bloqueado para Na ≤145 mEq/L.</div> : null}
      {desired > 10 ? <div className="danger-note">Queda acima de 10 mEq/L em 24 horas foi bloqueada.</div> : null}
      <Confirmation checked={confirmed} onChange={setConfirmed}>Confirmei volemia, etiologia, diurese, glicemia, perdas contínuas, manutenção e demais fluidos. O volume calculado foi incorporado ao balanço hídrico total.</Confirmation>
      <PrescriptionBlock invalidMessage="Revise sódio atual, queda máxima, estado volêmico, plano hídrico total e confirmação clínica." text={prescription} valid={valid} />
      <Sources><a href="https://www.rch.org.au/clinicalguide/guideline_index/hypernatraemia/" rel="noreferrer" target="_blank">Diretriz pediátrica oficial de hipernatremia</a>.</Sources>
    </>
  );
}

function MagnesiumCalculator({ initialWeight }: { initialWeight: string }) {
  const [weight, setWeight] = useState(initialWeight);
  const [dose, setDose] = useState("0.2");
  const [infusionMinutes, setInfusionMinutes] = useState("60");
  const [confirmed, setConfirmed] = useState(false);
  const weightKg = number(weight);
  const doseMeqKg = number(dose);
  const time = number(infusionMinutes);
  const result = magnesiumIv({ weightKg, doseMeqKg });
  const speed = result ? result.deliveredDoseMeq / weightKg / (time / 60) : Number.NaN;
  const roundingValid = Boolean(result) && Math.abs((result?.deliveredDoseMeq ?? 0) - (result?.targetDoseMeq ?? 0)) / (result?.targetDoseMeq ?? 1) <= 0.05;
  const valid = Boolean(result) && doseMeqKg >= 0.2 && doseMeqKg <= 0.4 && time >= (result?.minimumInfusionMinutes ?? Number.POSITIVE_INFINITY) && speed <= 1 && roundingValid && confirmed;
  const prescription = result ? [
    `SULFATO DE MAGNÉSIO 50% (4 MEQ/ML) ____ ${fmt(result.stockVolumeMl)} ML.`,
    `SF 0,9% ____ ${fmt(result.diluentVolumeMl)} ML.`,
    `VT ${fmt(result.finalVolumeMl)} ML EV EM ${fmt(time, 0)} MIN, EM BIS.`,
    `OFERTA: ${fmt(result.deliveredDoseMeq)} MEQ (${fmt(result.deliveredDoseMeq / weightKg)} MEQ/KG/DOSE).`,
  ].join("\n") : "";
  return (
    <>
      <ToolHeading eyebrow="Distúrbios hidroeletrolíticos" title="Hipomagnesemia sintomática">Sulfato de magnésio 50% com teto de 16 mEq, rediluição total 1:10 e velocidade máxima explícita.</ToolHeading>
      <div className="form-grid three"><NumberField label="Peso" value={weight} onChange={setWeight} suffix="kg" min={0} /><NumberField label="Dose escolhida" value={dose} onChange={setDose} suffix="mEq/kg/dose" min={0.2} max={0.4} /><NumberField label="Tempo de infusão" value={infusionMinutes} onChange={setInfusionMinutes} suffix="min" min={1} helper={result ? `Mínimo matemático pela velocidade de 1 mEq/kg/h: ${result.minimumInfusionMinutes} min.` : undefined} /></div>
      {result ? <ResultGrid><div><span>MgSO₄ 50%</span><strong>{fmt(result.stockVolumeMl)} mL</strong></div><div><span>SF 0,9%</span><strong>{fmt(result.diluentVolumeMl)} mL</strong></div><div><span>Dose entregue</span><strong>{fmt(result.deliveredDoseMeq)} mEq</strong></div><div className="result-primary"><span>Volume final</span><strong>{fmt(result.finalVolumeMl)} mL</strong></div></ResultGrid> : null}
      {speed > 1 ? <div className="danger-note">A velocidade calculada ultrapassa 1 mEq/kg/h. Aumente o tempo de infusão.</div> : null}
      {!roundingValid ? <div className="danger-note">O arredondamento do volume altera a dose em mais de 5%.</div> : null}
      <Confirmation checked={confirmed} onChange={setConfirmed}>Confirmei indicação sintomática, função renal, magnésio sérico, ECG/monitorização quando indicada, acesso, compatibilidade e nova dosagem após a reposição.</Confirmation>
      <PrescriptionBlock invalidMessage="Revise faixa, teto, velocidade, arredondamento e confirmação clínica." text={prescription} valid={valid} />
      <Sources><a href="https://pch.health.wa.gov.au/~/media/Files/Hospitals/PCH/General-documents/Health-professionals/MedicationMonographs/Magnesium.pdf" rel="noreferrer" target="_blank">Monografia pediátrica oficial de magnésio</a>.</Sources>
    </>
  );
}

function CalciumCalculator({ initialWeight }: { initialWeight: string }) {
  const [weight, setWeight] = useState(initialWeight);
  const [measuredCalcium, setMeasuredCalcium] = useState("7.5");
  const [albumin, setAlbumin] = useState("3");
  const [dose, setDose] = useState("0.5");
  const [ratio, setRatio] = useState("3");
  const [confirmed, setConfirmed] = useState(false);
  const weightKg = number(weight);
  const doseMlKg = number(dose);
  const diluentRatio = number(ratio);
  const corrected = correctedCalcium({ measuredCalciumMgDl: number(measuredCalcium), albuminGDl: number(albumin) });
  const result = calciumGluconate({ weightKg, doseMlKg, diluentVolumesPerDrugVolume: diluentRatio });
  const roundingValid = Boolean(result) && Math.abs((result?.stockVolumeMl ?? 0) - (result?.exactStockVolumeMl ?? 0)) / (result?.exactStockVolumeMl ?? 1) <= 0.05;
  const valid = Boolean(result) && doseMlKg >= 0.5 && doseMlKg <= 1 && diluentRatio >= 3 && diluentRatio <= 10 && roundingValid && confirmed;
  const prescription = result ? [
    `GLUCONATO DE CÁLCIO 10% (9,8 MG DE CA ELEMENTAR/ML) ____ ${fmt(result.stockVolumeMl)} ML.`,
    `SF 0,9% ____ ${fmt(result.diluentVolumeMl)} ML.`,
    `VT ${fmt(result.finalVolumeMl)} ML EV EM 10 MIN, EM BIS.`,
    `OFERTA: ${fmt(result.stockVolumeMl * 9.8)} MG DE CÁLCIO ELEMENTAR.`,
  ].join("\n") : "";
  return (
    <>
      <ToolHeading eyebrow="Distúrbios hidroeletrolíticos" title="Correção de cálcio">Cálcio corrigido com fator 0,8 verificado e preparo de gluconato 10% para hipocalcemia sintomática.</ToolHeading>
      <section className="subsection"><div className="subsection-title"><div><span className="eyebrow">Conferência laboratorial</span><h3>Cálcio corrigido</h3></div></div><div className="form-grid three"><NumberField label="Cálcio total medido" value={measuredCalcium} onChange={setMeasuredCalcium} suffix="mg/dL" min={0} /><NumberField label="Albumina" value={albumin} onChange={setAlbumin} suffix="g/dL" min={0} />{corrected !== null ? <div className="derived-field"><span>CÁLCIO CORRIGIDO</span><strong>{fmt(corrected)} mg/dL</strong><small>Ca total + 0,8 × (4 − albumina).</small></div> : null}</div></section>
      <section className="subsection dilution-box"><div className="subsection-title"><div><span className="eyebrow">Hipocalcemia sintomática</span><h3>Gluconato de cálcio 10%</h3></div></div><div className="form-grid three"><NumberField label="Peso" value={weight} onChange={setWeight} suffix="kg" min={0} /><NumberField label="Dose escolhida" value={dose} onChange={setDose} suffix="mL/kg" min={0.5} max={1} /><NumberField label="Volumes de diluente" value={ratio} onChange={setRatio} suffix="× volume da droga" min={3} max={10} step="1" /></div></section>
      {result ? <ResultGrid><div><span>Gluconato 10%</span><strong>{fmt(result.stockVolumeMl)} mL</strong></div><div><span>SF 0,9%</span><strong>{fmt(result.diluentVolumeMl)} mL</strong></div><div><span>Cálcio elementar</span><strong>{fmt(result.stockVolumeMl * 9.8)} mg</strong></div><div className="result-primary"><span>Volume final</span><strong>{fmt(result.finalVolumeMl)} mL</strong></div></ResultGrid> : null}
      {result?.capped ? <div className="clinical-note"><strong>Teto aplicado:</strong> o volume de gluconato de cálcio 10% foi limitado a 20 mL conforme a monografia pediátrica oficial.</div> : null}
      <div className="clinical-note"><strong>Fator corrigido:</strong> o material recebido imprime “8”; a automação usa 0,8 após conferência em fontes oficiais. Prefira cálcio ionizado quando clinicamente indicado.</div>
      <div className="danger-note">Não administrar na mesma solução ou via simultânea com bicarbonato, fosfato ou outras incompatibilidades sem validação farmacêutica.</div>
      <Confirmation checked={confirmed} onChange={setConfirmed}>Confirmei sintomas/indicação, cálcio ionizado quando disponível, acesso pérvio, ECG/monitorização, compatibilidade e controle laboratorial após a infusão.</Confirmation>
      <PrescriptionBlock invalidMessage="Revise indicação, dose, rediluição, incompatibilidades, arredondamento e confirmação clínica." text={prescription} valid={valid} />
      <Sources><a href="https://www.accessdata.fda.gov/drugsatfda_docs/nda/2015/204016Orig1s000Approv.pdf" rel="noreferrer" target="_blank">Fórmula com fator 0,8</a> e <a href="https://pch.health.wa.gov.au/~/media/Files/Hospitals/PCH/General-documents/Health-professionals/MedicationMonographs/Calcium.pdf" rel="noreferrer" target="_blank">monografia pediátrica oficial de cálcio</a>.</Sources>
    </>
  );
}

function PhosphateCalculator({ initialWeight }: { initialWeight: string }) {
  const [weight, setWeight] = useState(initialWeight);
  const [dose, setDose] = useState("0.15");
  const [presentation, setPresentation] = useState<"10" | "25">("10");
  const [access, setAccess] = useState<"AVP" | "AVC">("AVP");
  const [diluent, setDiluent] = useState("SF 0,9%");
  const [confirmed, setConfirmed] = useState(false);
  const profile = presentation === "10" ? { p: 1.1, k: 2, label: "Fosfato ácido de potássio 10%" } : { p: 3.3, k: 4.4, label: "Fosfato ácido de potássio 25%" };
  const maxConcentration = access === "AVP" ? 0.05 : 0.12;
  const doseMmolKg = number(dose);
  const result = phosphateIv({ weightKg: number(weight), doseMmolKg, stockPhosphateMmolMl: profile.p, stockPotassiumMeqMl: profile.k, maxConcentrationMmolMl: maxConcentration });
  const roundingValid = Boolean(result) && Math.abs((result?.deliveredPhosphateMmol ?? 0) - (result?.targetPhosphateMmol ?? 0)) / (result?.targetPhosphateMmol ?? 1) <= 0.05;
  const valid = Boolean(result) && doseMmolKg >= 0.15 && doseMmolKg <= 0.3 && (result?.diluentVolumeMl ?? -1) >= 0 && (result?.finalConcentrationMmolMl ?? 99) <= maxConcentration && roundingValid && confirmed;
  const prescription = result ? [
    `${profile.label.toLocaleUpperCase("pt-BR")} ____ ${fmt(result.stockVolumeMl)} ML.`,
    `${diluent} ____ ${fmt(result.diluentVolumeMl)} ML.`,
    `VT ${fmt(result.finalVolumeMl)} ML EV EM 6H, EM BIC A ${fmt(result.pumpRateMlHour)} ML/H.`,
    `ACESSO ${access}; CONCENTRAÇÃO DE P ${fmt(result.finalConcentrationMmolMl, 3)} MMOL/ML.`,
    `OFERTA: ${fmt(result.deliveredPhosphateMmol)} MMOL DE P + ${fmt(result.concomitantPotassiumMeq)} MEQ DE K.`,
  ].join("\n") : "";
  return (
    <>
      <ToolHeading eyebrow="Distúrbios hidroeletrolíticos" title="Hipofosfatemia moderada/grave">Reposição IV com dose de fósforo explícita e cálculo obrigatório do potássio concomitante.</ToolHeading>
      <div className="form-grid three"><NumberField label="Peso" value={weight} onChange={setWeight} suffix="kg" min={0} /><NumberField label="Dose escolhida" value={dose} onChange={setDose} suffix="mmol/kg/dose" min={0.15} max={0.3} /><SelectField label="Apresentação" value={presentation} onChange={(value) => setPresentation(value as "10" | "25")} options={[{ value: "10", label: "Fosfato ácido de potássio 10%" }, { value: "25", label: "Fosfato ácido de potássio 25%" }]} /><SelectField label="Acesso" value={access} onChange={(value) => setAccess(value as "AVP" | "AVC")} options={[{ value: "AVP", label: "Venoso periférico (AVP)" }, { value: "AVC", label: "Venoso central (AVC)" }]} /><SelectField label="Diluente compatível" value={diluent} onChange={setDiluent} options={[{ value: "SF 0,9%", label: "SF 0,9%" }, { value: "SG 5%", label: "SG 5%" }]} />{result ? <div className="derived-field"><span>POTÁSSIO CONCOMITANTE</span><strong>{fmt(result.concomitantPotassiumMeq)} mEq</strong><small>Deve entrar no balanço total de K.</small></div> : null}</div>
      {result ? <ResultGrid><div><span>Volume da apresentação</span><strong>{fmt(result.stockVolumeMl)} mL</strong></div><div><span>Diluente</span><strong>{fmt(result.diluentVolumeMl)} mL</strong></div><div><span>Fósforo entregue</span><strong>{fmt(result.deliveredPhosphateMmol)} mmol</strong></div><div className="result-primary"><span>BIC por 6 h</span><strong>{fmt(result.pumpRateMlHour)} mL/h</strong></div></ResultGrid> : null}
      {!roundingValid ? <div className="danger-note">O arredondamento do volume altera a dose de fósforo em mais de 5%.</div> : null}
      <div className="danger-note">Fosfato precipita com cálcio e magnésio. Não coadministrar sem checagem de compatibilidade; monitorar também potássio, cálcio e função renal.</div>
      <Confirmation checked={confirmed} onChange={setConfirmed}>Confirmei P &lt;1 mg/dL ou indicação institucional, função renal, potássio total recebido, acesso, diluente, compatibilidade, monitorização cardíaca quando aplicável e controle após reposição.</Confirmation>
      <PrescriptionBlock invalidMessage="Revise indicação, apresentação, potássio concomitante, concentração por acesso, compatibilidade e confirmação clínica." text={prescription} valid={valid} />
      <Sources><a href="https://pch.health.wa.gov.au/~/media/Files/Hospitals/PCH/General-documents/Health-professionals/MedicationMonographs/Phosphate.pdf" rel="noreferrer" target="_blank">Monografia pediátrica oficial de fosfato</a>.</Sources>
    </>
  );
}

function BicarbonateCalculator({ initialWeight }: { initialWeight: string }) {
  const [weight, setWeight] = useState(initialWeight);
  const [baseExcess, setBaseExcess] = useState("-10");
  const [ph, setPh] = useState("7.05");
  const [minutes, setMinutes] = useState("60");
  const [indicationConfirmed, setIndicationConfirmed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const time = number(minutes);
  const phValue = number(ph);
  const result = bicarbonateDeficit({ weightKg: number(weight), baseExcess: number(baseExcess) });
  const valid = Boolean(result) && phValue < 7.1 && time >= 30 && time <= 60 && indicationConfirmed && confirmed;
  const prescription = result ? [
    `BICARBONATO DE SÓDIO 8,4% (1 MEQ/ML) ____ ${fmt(result.volumeMl)} ML.`,
    "VIA E REDILUIÇÃO: CONFORME PROTOCOLO INSTITUCIONAL E ACESSO DISPONÍVEL.",
    `ADMINISTRAR EM ${fmt(time, 0)} MIN SOB MONITORIZAÇÃO.`,
    `OFERTA CALCULADA: ${fmt(result.deliveredMeq)} MEQ.`,
  ].join("\n") : "";
  return (
    <>
      <ToolHeading eyebrow="Distúrbios hidroeletrolíticos" title="Reposição de bicarbonato">Cálculo pelo déficit de bases: |BE| × peso × 0,3. A ferramenta não define a indicação nem a rediluição.</ToolHeading>
      <div className="form-grid three"><NumberField label="Peso" value={weight} onChange={setWeight} suffix="kg" min={0} /><NumberField label="Excesso de bases" value={baseExcess} onChange={setBaseExcess} suffix="mEq/L" max={-0.1} helper="Informe um valor negativo." /><NumberField label="pH" value={ph} onChange={setPh} suffix="" min={0} max={14} step="0.01" /><NumberField label="Tempo escolhido" value={minutes} onChange={setMinutes} suffix="min" min={30} max={60} /></div>
      {result ? <ResultGrid><div><span>Déficit calculado</span><strong>{fmt(result.targetMeq)} mEq</strong></div><div><span>Bicarbonato 8,4%</span><strong>{fmt(result.volumeMl)} mL</strong></div><div><span>Concentração</span><strong>1 mEq/mL</strong></div><div className="result-primary"><span>Administrar em</span><strong>{fmt(time, 0)} min</strong></div></ResultGrid> : null}
      <label className="guide-verification indication-check"><input checked={indicationConfirmed} onChange={(event) => setIndicationConfirmed(event.target.checked)} type="checkbox" /><span>Indicação crítica foi confirmada pelo médico responsável (por exemplo, acidose metabólica grave no cenário apropriado).</span></label>
      {phValue >= 7.1 ? <div className="danger-note">A liberação está bloqueada para pH ≥7,1 neste módulo de fase rápida.</div> : null}
      <div className="danger-note">A rediluição, osmolaridade, carga de sódio, ventilação e causa da acidose precisam ser revistas antes de administrar.</div>
      <Confirmation checked={confirmed} onChange={setConfirmed}>Confirmei gasometria, ventilação, eletrólitos, função renal, carga de sódio, via/acesso, rediluição institucional e nova gasometria após a intervenção.</Confirmation>
      <PrescriptionBlock invalidMessage="Revise indicação, pH, BE negativo, tempo, rediluição institucional e confirmações clínicas." text={prescription} valid={valid} />
      <Sources />
    </>
  );
}

function HyperkalemiaCalculator({ initialWeight }: { initialWeight: string }) {
  const [weight, setWeight] = useState(initialWeight);
  const [youngerThanFive, setYoungerThanFive] = useState(true);
  const result = hyperkalemiaEmergency({ weightKg: number(weight), youngerThanFive });
  return (
    <>
      <ToolHeading eyebrow="Distúrbios hidroeletrolíticos" title="Hipercalemia · conferência">Painel aritmético das medidas descritas no material. Não constitui uma prescrição combinada e não escolhe quais intervenções usar.</ToolHeading>
      <div className="form-grid two"><NumberField label="Peso" value={weight} onChange={setWeight} suffix="kg" min={0} /><SelectField label="Faixa etária para glicose" value={youngerThanFive ? "younger" : "older"} onChange={(value) => setYoungerThanFive(value === "younger")} options={[{ value: "younger", label: "Menor de 5 anos" }, { value: "older", label: "5 anos ou mais" }]} /></div>
      {result ? <ResultGrid><div><span>Insulina regular</span><strong>{fmt(result.insulinUnits)} UI</strong></div><div><span>Glicose</span><strong>{fmt(result.glucoseGrams)} g · {fmt(result.glucoseVolumeMl)} mL</strong></div><div><span>Gluconato de cálcio 10%</span><strong>{fmt(result.calciumGluconateMl)} mL</strong></div><div><span>Bicarbonato</span><strong>{fmt(result.bicarbonateMeq)} mEq</strong></div><div><span>Furosemida, se indicada</span><strong>{fmt(result.furosemideMg)} mg</strong></div><div className="result-primary"><span>Conduta imediata</span><strong>ECG + protocolo local</strong></div></ResultGrid> : null}
      <div className="danger-note"><strong>Emergência tempo-dependente:</strong> K ≥6,5 mEq/L ou alterações no ECG exigem monitorização e manejo imediato. As opções acima têm indicações, contraindicações e sequenciamento próprios.</div>
      <div className="clinical-note"><strong>Sem botão de copiar:</strong> a seleção automática de uma combinação terapêutica seria insegura; use os números apenas para dupla checagem de uma conduta já definida.</div>
      <Sources><a href="https://www.rch.org.au/clinicalguide/guideline_index/Electrolyte_abnormalities/" rel="noreferrer" target="_blank">Abordagem oficial a distúrbios eletrolíticos</a>.</Sources>
    </>
  );
}

export function ElectrolyteCalculator({ tool, initialWeight }: { tool: ElectrolyteToolId; initialWeight: string }) {
  if (tool === "potassium") return <PotassiumCalculator initialWeight={initialWeight} />;
  if (tool === "hyponatremia") return <HyponatremiaCalculator initialWeight={initialWeight} />;
  if (tool === "hypernatremia") return <HypernatremiaCalculator initialWeight={initialWeight} />;
  if (tool === "magnesium") return <MagnesiumCalculator initialWeight={initialWeight} />;
  if (tool === "calcium") return <CalciumCalculator initialWeight={initialWeight} />;
  if (tool === "phosphate") return <PhosphateCalculator initialWeight={initialWeight} />;
  if (tool === "bicarbonate") return <BicarbonateCalculator initialWeight={initialWeight} />;
  return <HyperkalemiaCalculator initialWeight={initialWeight} />;
}
