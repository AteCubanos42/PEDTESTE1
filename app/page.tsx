"use client";

import { useMemo, useState } from "react";
import {
  doseFromInfusion,
  girMixture,
  infusionFromDose,
  maintenanceDaily,
  nitricOxideFlow,
} from "../lib/calculations.mjs";
import { CamCalculator, PainScaleCalculator, PrismCalculator, ScoreCalculator } from "./ScoreTools";
import { AntimicrobialCalculator } from "./AntimicrobialTools";
import { ELECTROLYTE_TOOLS, ElectrolyteCalculator, type ElectrolyteToolId } from "./ElectrolyteTools";
import { OralAntibioticCalculator } from "./OralAntibioticTools";
import { PrescriptionBlock } from "./PrescriptionBlock";
import {
  ANTIMICROBIAL_GROUPS,
  ANTIMICROBIALS,
  type Antimicrobial,
  type AntimicrobialGroup,
} from "./antimicrobials-data";
import {
  ORAL_ANTIBIOTIC_GROUPS,
  ORAL_ANTIBIOTICS,
  type OralAntibiotic,
  type OralAntibioticGroup,
} from "./oral-antibiotics-data";
import { SCORE_CATEGORIES, SCORE_DEFINITIONS, type ScoreDefinition } from "./scores-data";

type DrugGroup = "Analgossedação" | "Vasoativas" | "Outras drogas";

type Drug = {
  id: string;
  name: string;
  group: DrugGroup;
  unit: "mcg" | "mg" | "UI";
  interval: "min" | "h";
  range: string;
  stock: number;
  stockLabel: string;
  prescriptionName?: string;
  note?: string;
};

type ActiveTool =
  | { type: "maintenance" }
  | { type: "gir" }
  | { type: "drug"; drug: Drug }
  | { type: "nitric" }
  | { type: "dual" }
  | { type: "score"; definition: ScoreDefinition }
  | { type: "prism" }
  | { type: "cam" }
  | { type: "pain" }
  | { type: "electrolyte"; tool: ElectrolyteToolId }
  | { type: "antimicrobial"; antimicrobial: Antimicrobial }
  | { type: "oral-antibiotic"; antibiotic: OralAntibiotic }
  | null;

const DRUGS: Drug[] = [
  { id: "midazolam", name: "Midazolam", group: "Analgossedação", unit: "mcg", interval: "min", range: "0,5–4 mcg/kg/min", stock: 5000, stockLabel: "5 mg/mL" },
  { id: "fentanyl", name: "Fentanil", group: "Analgossedação", unit: "mcg", interval: "h", range: "0,5–4 mcg/kg/h", stock: 50, stockLabel: "50 mcg/mL" },
  { id: "dexmedetomidine", name: "Precedex (dexmedetomidina)", group: "Analgossedação", unit: "mcg", interval: "h", range: "0,5–2 mcg/kg/h", stock: 100, stockLabel: "100 mcg/mL" },
  { id: "ketamine", name: "Cetamina", group: "Analgossedação", unit: "mcg", interval: "min", range: "5–30 mcg/kg/min", stock: 50000, stockLabel: "50 mg/mL" },
  { id: "clonidine", name: "Clonidina", group: "Analgossedação", unit: "mcg", interval: "h", range: "0,1–2 mcg/kg/h", stock: 150, stockLabel: "150 mcg/mL" },
  { id: "morphine", name: "Morfina", group: "Analgossedação", unit: "mcg", interval: "h", range: "8–50 mcg/kg/h", stock: 10000, stockLabel: "10 mg/mL" },
  { id: "rocuronium", name: "Rocurônio", group: "Analgossedação", unit: "mcg", interval: "min", range: "7–14 mcg/kg/min", stock: 10000, stockLabel: "10 mg/mL" },
  { id: "lidocaine", name: "Lidocaína", group: "Analgossedação", unit: "mg", interval: "h", range: "1–3 mg/kg/h", stock: 20, stockLabel: "20 mg/mL" },
  { id: "propofol", name: "Propofol", group: "Analgossedação", unit: "mg", interval: "h", range: "0,5–2 mg/kg/h", stock: 10, stockLabel: "10 mg/mL", note: "Uso prolongado ou em altas doses exige vigilância para síndrome de infusão do propofol." },
  { id: "epinephrine", name: "Adrenalina", prescriptionName: "Epinefrina", group: "Vasoativas", unit: "mcg", interval: "min", range: "0,05–2 mcg/kg/min", stock: 1000, stockLabel: "1 mg/mL" },
  { id: "norepinephrine", name: "Noradrenalina", group: "Vasoativas", unit: "mcg", interval: "min", range: "0,05–2 mcg/kg/min", stock: 1000, stockLabel: "1 mg/mL" },
  { id: "dobutamine", name: "Dobutamina", group: "Vasoativas", unit: "mcg", interval: "min", range: "5–15 mcg/kg/min", stock: 12500, stockLabel: "12,5 mg/mL" },
  { id: "milrinone", name: "Milrinona", group: "Vasoativas", unit: "mcg", interval: "min", range: "0,2–1 mcg/kg/min", stock: 1000, stockLabel: "1 mg/mL" },
  { id: "vasopressin", name: "Vasopressina", group: "Vasoativas", unit: "UI", interval: "min", range: "0,00017–0,01 UI/kg/min", stock: 20, stockLabel: "20 UI/mL" },
  { id: "nitroprusside", name: "Nitroprussiato de sódio", group: "Vasoativas", unit: "mcg", interval: "min", range: "1–10 mcg/kg/min", stock: 25000, stockLabel: "25 mg/mL" },
  { id: "alprostadil", name: "Prostaglandina E1", group: "Vasoativas", unit: "mcg", interval: "min", range: "0,01–0,05 mcg/kg/min", stock: 500, stockLabel: "500 mcg/mL" },
  { id: "levosimendan", name: "Levosimendana", group: "Vasoativas", unit: "mcg", interval: "min", range: "0,05–0,2 mcg/kg/min", stock: 2500, stockLabel: "2,5 mg/mL" },
  { id: "salbutamol", name: "Salbutamol", group: "Outras drogas", unit: "mcg", interval: "min", range: "1–10 mcg/kg/min", stock: 1000, stockLabel: "1 mg/mL" },
  { id: "magnesium", name: "Sulfato de magnésio", group: "Outras drogas", unit: "mg", interval: "h", range: "Dose definida pelo protocolo", stock: 500, stockLabel: "500 mg/mL" },
  { id: "terbutaline", name: "Terbutalina", group: "Outras drogas", unit: "mcg", interval: "min", range: "0,1–2 mcg/kg/min", stock: 500, stockLabel: "500 mcg/mL" },
  { id: "furosemide", name: "Furosemida", group: "Outras drogas", unit: "mg", interval: "h", range: "0,1–0,5 mg/kg/h", stock: 10, stockLabel: "10 mg/mL" },
  { id: "heparin", name: "Heparina não fracionada", group: "Outras drogas", unit: "UI", interval: "h", range: "10–25 UI/kg/h", stock: 5000, stockLabel: "5.000 UI/mL" },
];

const GROUP_META: Record<DrugGroup, { icon: string; description: string }> = {
  Analgossedação: { icon: "A", description: "Sedação, analgesia e bloqueio neuromuscular" },
  Vasoativas: { icon: "V", description: "Inotrópicos, vasopressores e vasodilatadores" },
  "Outras drogas": { icon: "O", description: "Asma, diuréticos e anticoagulação" },
};

function number(value: string) {
  if (!value.trim()) return Number.NaN;
  return Number(value.replace(",", "."));
}

function fmt(value: number, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

function fmtFlow(value: number) {
  if (Number.isFinite(value) && value > 0 && value < 0.05) return "<0,1";
  return fmt(value, 1);
}

function roundedTenth(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function fmtClinicalDose(value: number) {
  if (!Number.isFinite(value)) return "—";
  return Math.abs(value) < 0.1 ? fmt(value, 5) : fmt(value, 1);
}

function Field({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  step = "any",
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  min?: number;
  step?: string;
  helper?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="input-wrap">
        <input
          inputMode="decimal"
          min={min}
          onChange={(event) => onChange(event.target.value)}
          step={step}
          type="number"
          value={value}
        />
        {suffix ? <span className="input-suffix">{suffix}</span> : null}
      </span>
      {helper ? <small>{helper}</small> : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="select-wrap">
        <select onChange={(event) => onChange(event.target.value)} value={value}>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </span>
    </label>
  );
}

function ToolModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-modal="true" className="tool-modal" role="dialog">
        <button aria-label="Fechar calculadora" className="modal-close" onClick={onClose}>×</button>
        {children}
      </section>
    </div>
  );
}

function ToolHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="tool-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

function MaintenanceCalculator({ initialWeight }: { initialWeight: string }) {
  const [weight, setWeight] = useState(initialWeight);
  const [quota, setQuota] = useState("100");
  const daily = maintenanceDaily(number(weight));
  const adjusted = daily * (number(quota) / 100);
  const prescriptionValid = Number.isFinite(adjusted) && adjusted > 0;
  const prescription = [
    "VENÓCLISE / MANUTENÇÃO HÍDRICA",
    `VT ${fmt(adjusted)} ML / 24H`,
    `CORRER EM BIC A ${fmt(adjusted / 24)} ML/H, CONTÍNUO.`,
    `QH: ${fmt(number(quota))}% · HOLLIDAY–SEGAR.`,
  ].join("\n");
  return (
    <>
      <ToolHeading eyebrow="Venóclise" title="Manutenção hídrica" description="Estimativa diária por Holliday–Segar, com ajuste percentual da quota hídrica." />
      <div className="formula-chip">100/50/20 mL · kg · dia</div>
      <div className="form-grid two">
        <Field label="Peso do paciente" value={weight} onChange={setWeight} suffix="kg" />
        <Field label="Quota hídrica" value={quota} onChange={setQuota} suffix="%" />
      </div>
      {daily > 0 && number(quota) >= 0 ? (
        <div className="result-panel">
          <div><span>Necessidade de 100%</span><strong>{fmt(daily)} mL/dia</strong></div>
          <div><span>Volume ajustado</span><strong>{fmt(adjusted)} mL/dia</strong></div>
          <div className="result-primary"><span>Programação horária</span><strong>{fmt(adjusted / 24)} mL/h</strong></div>
        </div>
      ) : <p className="empty-result">Informe peso e quota válidos.</p>}
      {prescriptionValid ? <PrescriptionBlock text={prescription} /> : null}
      <div className="clinical-note"><strong>Conferência clínica:</strong> a fórmula estima manutenção fisiológica. Déficit, perdas contínuas, restrições, função renal e condições críticas devem ser avaliados separadamente.</div>
    </>
  );
}

function GirCalculator({ initialWeight }: { initialWeight: string }) {
  const [weight, setWeight] = useState(initialWeight || "3");
  const [gir, setGir] = useState("5");
  const [quota, setQuota] = useState("100");
  const [source, setSource] = useState("50");
  const [base, setBase] = useState("0");
  const [baseLabel, setBaseLabel] = useState("ÁGUA BIDESTILADA");
  const [access, setAccess] = useState<"peripheral" | "central">("peripheral");
  const [na, setNa] = useState(true);
  const [k, setK] = useState(true);
  const [ca, setCa] = useState(true);
  const [naDose, setNaDose] = useState("3");
  const [kDose, setKDose] = useState("2");
  const [caDose, setCaDose] = useState("100");
  const weightNumber = number(weight);
  const naVolume = na ? (number(naDose) * weightNumber) / 3.4 : 0;
  const kVolume = k ? (number(kDose) * weightNumber) / 2.56 : 0;
  const caVolume = ca ? (number(caDose) * weightNumber) / 100 : 0;
  const additiveVolume = naVolume + kVolume + caVolume;
  const result = girMixture({
    weightKg: weightNumber,
    girMgKgMin: number(gir),
    quotaPercent: number(quota),
    sourceGlucosePercent: number(source),
    baseGlucosePercent: number(base),
    additiveVolumeMl: additiveVolume,
  });
  const peripheralWarning = result && access === "peripheral" && result.targetPercent > 12.5;
  const prescriptionValid = Boolean(result?.feasible) && !peripheralWarning;
  const girPrescription = result ? [
    "VENÓCLISE — VIG + ELETRÓLITOS / 24H",
    `GLICOSE ${fmt(number(source))}% ____ ${fmt(result.sourceVolume)} ML`,
    `${baseLabel} ____ ${fmt(result.baseVolume)} ML`,
    ...(na ? [`CLORETO DE SÓDIO 20% ____ ${fmt(naVolume)} ML`] : []),
    ...(k ? [`CLORETO DE POTÁSSIO 19,1% ____ ${fmt(kVolume)} ML`] : []),
    ...(ca ? [`GLUCONATO DE CÁLCIO 10% ____ ${fmt(caVolume)} ML`] : []),
    `VT ${fmt(result.dailyVolume)} ML — CORRER EM BIC A ${fmt(result.flowMlH)} ML/H, CONTÍNUO.`,
    `QH: ${fmt(number(quota))}% · VIG: ${fmt(number(gir))} MG/KG/MIN · NA: ${na ? fmt(number(naDose)) : "0"} MEQ/KG/D · K: ${k ? fmt(number(kDose)) : "0"} MEQ/KG/D · GLUCA: ${ca ? fmt(number(caDose)) : "0"} MG/KG/D.`,
  ].join("\n") : "";
  return (
    <>
      <ToolHeading eyebrow="Venóclise avançada" title="VIG + eletrólitos" description="Calcula a concentração de glicose, os volumes dos aditivos e a vazão final." />
      <div className="segmented">
        <button className={access === "peripheral" ? "active" : ""} onClick={() => setAccess("peripheral")}>Acesso periférico</button>
        <button className={access === "central" ? "active" : ""} onClick={() => setAccess("central")}>Acesso central</button>
      </div>
      <div className="form-grid three">
        <Field label="Peso" value={weight} onChange={setWeight} suffix="kg" />
        <Field label="VIG desejada" value={gir} onChange={setGir} suffix="mg/kg/min" />
        <Field label="Quota hídrica" value={quota} onChange={setQuota} suffix="%" />
        <Field label="Glicose concentrada" value={source} onChange={setSource} suffix="%" />
        <Field label="Glicose da solução-base" value={base} onChange={setBase} suffix="%" />
        <SelectField
          label="Nome da solução-base"
          value={baseLabel}
          onChange={(value) => {
            setBaseLabel(value);
            if (value === "ÁGUA BIDESTILADA" || value === "SF 0,9%") setBase("0");
            if (value === "SG 5%") setBase("5");
            if (value === "SG 10%") setBase("10");
          }}
          options={["ÁGUA BIDESTILADA", "SF 0,9%", "SG 5%", "SG 10%", "OUTRA SOLUÇÃO-BASE"]}
        />
      </div>
      <section className="subsection">
        <div className="subsection-title"><div><span className="eyebrow">Aditivos</span><h3>Eletrólitos por 24 horas</h3></div><span>{fmt(additiveVolume)} mL</span></div>
        <div className="electrolytes">
          <label className="electrolyte-row">
            <input checked={na} onChange={(e) => setNa(e.target.checked)} type="checkbox" />
            <span><strong>NaCl 20%</strong><small>3,4 mEq/mL</small></span>
            <Field label="Dose" value={naDose} onChange={setNaDose} suffix="mEq/kg/d" />
            <b>{fmt(naVolume)} mL</b>
          </label>
          <label className="electrolyte-row">
            <input checked={k} onChange={(e) => setK(e.target.checked)} type="checkbox" />
            <span><strong>KCl 19,1%</strong><small>2,56 mEq/mL</small></span>
            <Field label="Dose" value={kDose} onChange={setKDose} suffix="mEq/kg/d" />
            <b>{fmt(kVolume)} mL</b>
          </label>
          <label className="electrolyte-row">
            <input checked={ca} onChange={(e) => setCa(e.target.checked)} type="checkbox" />
            <span><strong>Gluconato de cálcio 10%</strong><small>100 mg/mL</small></span>
            <Field label="Dose" value={caDose} onChange={setCaDose} suffix="mg/kg/d" />
            <b>{fmt(caVolume)} mL</b>
          </label>
        </div>
      </section>
      {result ? (
        <div className="result-panel mixture">
          <div><span>Volume final</span><strong>{fmt(result.dailyVolume)} mL/dia</strong></div>
          <div><span>Concentração de glicose</span><strong>{fmt(result.targetPercent, 2)}%</strong></div>
          <div><span>Glicose {fmt(number(source))}%</span><strong>{fmt(result.sourceVolume)} mL</strong></div>
          <div><span>Solução-base</span><strong>{fmt(result.baseVolume)} mL</strong></div>
          <div><span>Eletrólitos</span><strong>{fmt(additiveVolume)} mL</strong></div>
          <div className="result-primary"><span>Vazão final</span><strong>{fmt(result.flowMlH)} mL/h</strong></div>
        </div>
      ) : <p className="empty-result">Preencha os campos com valores válidos.</p>}
      {result && !result.feasible ? <div className="danger-note">A mistura não cabe no volume final. Reduza aditivos, ajuste a fonte de glicose ou aumente a quota conforme avaliação clínica.</div> : null}
      {peripheralWarning ? <div className="danger-note">A concentração calculada excede 12,5%. Revise a via de acesso e o protocolo institucional.</div> : null}
      {result ? (
        <PrescriptionBlock
          invalidMessage="A cópia fica bloqueada enquanto a mistura for inviável ou ultrapassar 12,5% em acesso periférico."
          text={girPrescription}
          valid={prescriptionValid}
        />
      ) : null}
      <div className="clinical-note"><strong>Dupla checagem obrigatória:</strong> compatibilidade, estabilidade, idade pós-natal, função renal e momento de introdução dos eletrólitos não são decididos pela calculadora.</div>
    </>
  );
}

function DrugCalculator({ drug, initialWeight }: { drug: Drug; initialWeight: string }) {
  const [mode, setMode] = useState<"flow" | "dose">("flow");
  const [weight, setWeight] = useState(initialWeight);
  const [dose, setDose] = useState("");
  const [flow, setFlow] = useState("");
  const [stock, setStock] = useState(String(drug.stock));
  const [drugVolume, setDrugVolume] = useState("1");
  const [finalVolume, setFinalVolume] = useState("50");
  const [diluent, setDiluent] = useState("SF 0,9%");
  const [pump, setPump] = useState("BIS");
  const shared = {
    weightKg: number(weight),
    stockPerMl: number(stock),
    drugVolumeMl: number(drugVolume),
    finalVolumeMl: number(finalVolume),
    perMinute: drug.interval === "min",
  };
  const forward = mode === "flow" ? infusionFromDose({ ...shared, dose: number(dose) }) : null;
  const reverse = mode === "dose" ? doseFromInfusion({ ...shared, flowMlH: number(flow) }) : null;
  const invalidVolume = number(drugVolume) > number(finalVolume);
  const diluentVolume = number(finalVolume) - number(drugVolume);
  const pumpFlow = mode === "flow" ? forward?.flowMlH : number(flow);
  const finalDose = mode === "flow" ? number(dose) : reverse?.dose;
  const roundedPumpFlow = roundedTenth(Number(pumpFlow));
  const roundedFlowResult = doseFromInfusion({ ...shared, flowMlH: roundedPumpFlow });
  const doseAfterFlowRounding = roundedFlowResult?.dose;
  const flowRoundingValid = Number.isFinite(finalDose)
    && Number(finalDose) > 0
    && Number.isFinite(doseAfterFlowRounding)
    && Math.abs(Number(doseAfterFlowRounding) - Number(finalDose)) / Number(finalDose) <= 0.1;
  const prescriptionValid = Boolean(forward || reverse)
    && Number.isFinite(roundedPumpFlow)
    && roundedPumpFlow >= 0.1
    && Number.isFinite(finalDose)
    && Number(finalDose) > 0
    && flowRoundingValid
    && Number.isFinite(diluentVolume)
    && diluentVolume >= 0;
  const drugPrescription = [
    `${(drug.prescriptionName ?? drug.name).toLocaleUpperCase("pt-BR")} (${fmt(number(stock), 4)} ${drug.unit.toUpperCase()}/ML) ____ ${fmt(number(drugVolume))} ML`,
    ...(diluentVolume > 0 ? [`${diluent} ____ ${fmt(diluentVolume)} ML`] : []),
    `VT ${fmt(number(finalVolume))} ML — CORRER EM ${pump} A ${fmtFlow(roundedPumpFlow)} ML/H, CONTÍNUO.`,
    `DOSE-ALVO: ${fmtClinicalDose(Number(finalDose))} ${drug.unit.toUpperCase()}/KG/${drug.interval.toUpperCase()}.`,
    `OFERTA COM A VAZÃO ARREDONDADA: ${fmtClinicalDose(Number(doseAfterFlowRounding))} ${drug.unit.toUpperCase()}/KG/${drug.interval.toUpperCase()}.`,
  ].join("\n");
  return (
    <>
      <ToolHeading eyebrow={drug.group} title={drug.name} description={`Conversão bidirecional entre dose e vazão. Faixa informativa: ${drug.range}.`} />
      <div className="stock-pill">Apresentação inicial: <strong>{drug.stockLabel}</strong> · editável</div>
      <div className="segmented">
        <button className={mode === "flow" ? "active" : ""} onClick={() => setMode("flow")}>Calcular vazão</button>
        <button className={mode === "dose" ? "active" : ""} onClick={() => setMode("dose")}>Calcular dose</button>
      </div>
      <div className="form-grid two">
        <Field label="Peso do paciente" value={weight} onChange={setWeight} suffix="kg" />
        {mode === "flow" ? (
          <Field label="Dose prescrita" value={dose} onChange={setDose} suffix={`${drug.unit}/kg/${drug.interval}`} />
        ) : (
          <Field label="Vazão observada" value={flow} onChange={setFlow} suffix="mL/h" />
        )}
      </div>
      <section className="subsection dilution-box">
        <div className="subsection-title"><div><span className="eyebrow">Diluição</span><h3>Dados da solução preparada</h3></div></div>
        <div className="form-grid three">
          <Field label="Concentração da ampola" value={stock} onChange={setStock} suffix={`${drug.unit}/mL`} />
          <Field label="Volume da droga" value={drugVolume} onChange={setDrugVolume} suffix="mL" />
          <Field label="Volume final" value={finalVolume} onChange={setFinalVolume} suffix="mL" />
          <SelectField label="Diluente" value={diluent} onChange={setDiluent} options={["SF 0,9%", "SG 5%", "ÁGUA BIDESTILADA", "OUTRO DILUENTE"]} />
          <SelectField label="Tipo de bomba" value={pump} onChange={setPump} options={["BIS", "BIC"]} />
        </div>
      </section>
      {invalidVolume ? <div className="danger-note">O volume da droga não pode superar o volume final.</div> : null}
      {mode === "flow" && forward ? (
        <div className="result-panel">
          <div><span>Quantidade total</span><strong>{fmt(forward.totalAmount)} {drug.unit}</strong></div>
          <div><span>Concentração final</span><strong>{fmt(forward.finalConcentration, 4)} {drug.unit}/mL</strong></div>
          <div><span>Oferta por hora</span><strong>{fmt(forward.amountPerHour, 4)} {drug.unit}/h</strong></div>
          <div className="result-primary"><span>Programar bomba</span><strong>{fmtFlow(roundedPumpFlow)} mL/h</strong></div>
          <div><span>Dose com vazão arredondada</span><strong>{fmtClinicalDose(Number(doseAfterFlowRounding))} {drug.unit}/kg/{drug.interval}</strong></div>
          <div><span>Duração estimada</span><strong>{fmt(forward.durationHours, 1)} h</strong></div>
        </div>
      ) : null}
      {mode === "dose" && reverse ? (
        <div className="result-panel">
          <div><span>Concentração final</span><strong>{fmt(reverse.finalConcentration, 4)} {drug.unit}/mL</strong></div>
          <div><span>Oferta por hora</span><strong>{fmt(reverse.amountPerHour, 4)} {drug.unit}/h</strong></div>
          <div className="result-primary"><span>Dose calculada</span><strong>{fmtClinicalDose(reverse.dose)} {drug.unit}/kg/{drug.interval}</strong></div>
        </div>
      ) : null}
      {!forward && !reverse && !invalidVolume ? <p className="empty-result">Complete os dados para ver o resultado.</p> : null}
      {Number.isFinite(pumpFlow) && Number(pumpFlow) > 0 && roundedPumpFlow < 0.1 ? <div className="danger-note">A vazão calculada ficaria abaixo de 0,1 mL/h após arredondamento. Revise a diluição; a cópia foi bloqueada para evitar programar 0,0 mL/h.</div> : null}
      {(forward || reverse) && Number.isFinite(finalDose) && !flowRoundingValid ? <div className="danger-note">Arredondar a vazão para uma casa decimal altera a oferta em mais de 10%. Ajuste a diluição/volume final antes de copiar.</div> : null}
      {(forward || reverse) ? (
        <PrescriptionBlock
          invalidMessage="A cópia exige dose e vazão maiores que zero e volume de diluente não negativo."
          text={drugPrescription}
          valid={prescriptionValid}
        />
      ) : null}
      {drug.note ? <div className="danger-note">{drug.note}</div> : null}
      <div className="clinical-note"><strong>Antes de administrar:</strong> confira apresentação, unidade, concentração máxima, compatibilidade, via, estabilidade e limites do protocolo local. As faixas exibidas não substituem prescrição.</div>
    </>
  );
}

function NitricOxideCalculator() {
  const [target, setTarget] = useState("20");
  const [source, setSource] = useState("800");
  const [total, setTotal] = useState("10");
  const result = nitricOxideFlow({ targetPpm: number(target), sourcePpm: number(source), totalFlowLMin: number(total) });
  return (
    <>
      <ToolHeading eyebrow="Vasoativas · gás medicinal" title="Óxido nítrico inalatório" description="Conferência matemática da fração de gás necessária para uma concentração-alvo." />
      <div className="form-grid three">
        <Field label="Concentração-alvo" value={target} onChange={setTarget} suffix="ppm" />
        <Field label="Cilindro-fonte" value={source} onChange={setSource} suffix="ppm" />
        <Field label="Fluxo total" value={total} onChange={setTotal} suffix="L/min" />
      </div>
      {result ? (
        <div className="result-panel">
          <div className="result-primary"><span>Fluxo teórico de NO</span><strong>{fmt(result.noFlowMlMin, 1)} mL/min</strong></div>
          <div><span>Equivalente</span><strong>{fmt(result.noFlowLMin, 4)} L/min</strong></div>
        </div>
      ) : <p className="empty-result">A concentração-alvo deve ser menor que a concentração da fonte.</p>}
      <div className="danger-note">Não use este valor para ajuste manual de equipamento. A entrega de NO deve ser realizada por sistema aprovado, calibrado e com monitorização contínua de NO/NO₂.</div>
    </>
  );
}

function DualDiureticCalculator({ initialWeight }: { initialWeight: string }) {
  const [weight, setWeight] = useState(initialWeight);
  const [flow, setFlow] = useState("1");
  const [finalVolume, setFinalVolume] = useState("24");
  const [furoDose, setFuroDose] = useState("0.1");
  const [aminoDose, setAminoDose] = useState("0.25");
  const [furoStock, setFuroStock] = useState("10");
  const [aminoStock, setAminoStock] = useState("24");
  const [diluentName, setDiluentName] = useState("SF 0,9%");
  const w = number(weight);
  const f = number(flow);
  const bag = number(finalVolume);
  const duration = bag / f;
  const furoAmount = number(furoDose) * w * duration;
  const aminoAmount = number(aminoDose) * w * duration;
  const furoVolume = furoAmount / number(furoStock);
  const aminoVolume = aminoAmount / number(aminoStock);
  const diluent = bag - furoVolume - aminoVolume;
  const valid = [w, f, bag, duration, furoAmount, aminoAmount, furoVolume, aminoVolume, diluent].every(Number.isFinite) && w > 0 && f > 0 && bag > 0;
  const dualPrescription = [
    `FUROSEMIDA (${fmt(number(furoStock))} MG/ML) ____ ${fmt(furoVolume)} ML`,
    `AMINOFILINA (${fmt(number(aminoStock))} MG/ML) ____ ${fmt(aminoVolume)} ML`,
    `${diluentName} ____ ${fmt(diluent)} ML`,
    `VT ${fmt(bag)} ML — CORRER EM BIC A ${fmt(f)} ML/H, CONTÍNUO.`,
    `DOSES: FUROSEMIDA ${fmt(number(furoDose), 4)} MG/KG/H · AMINOFILINA ${fmt(number(aminoDose), 4)} MG/KG/H.`,
  ].join("\n");
  return (
    <>
      <ToolHeading eyebrow="Outras drogas" title="Furosemida + aminofilina" description="Preparo matemático de uma solução dupla a partir das duas doses-alvo e da vazão escolhida." />
      <div className="form-grid three">
        <Field label="Peso" value={weight} onChange={setWeight} suffix="kg" />
        <Field label="Vazão escolhida" value={flow} onChange={setFlow} suffix="mL/h" />
        <Field label="Volume final" value={finalVolume} onChange={setFinalVolume} suffix="mL" />
        <SelectField label="Diluente" value={diluentName} onChange={setDiluentName} options={["SF 0,9%", "SG 5%", "ÁGUA BIDESTILADA", "OUTRO DILUENTE"]} />
      </div>
      <section className="subsection">
        <div className="subsection-title"><div><span className="eyebrow">Componente 01</span><h3>Furosemida</h3></div></div>
        <div className="form-grid two"><Field label="Dose-alvo" value={furoDose} onChange={setFuroDose} suffix="mg/kg/h" /><Field label="Apresentação" value={furoStock} onChange={setFuroStock} suffix="mg/mL" /></div>
      </section>
      <section className="subsection">
        <div className="subsection-title"><div><span className="eyebrow">Componente 02</span><h3>Aminofilina</h3></div></div>
        <div className="form-grid two"><Field label="Dose-alvo" value={aminoDose} onChange={setAminoDose} suffix="mg/kg/h" /><Field label="Apresentação" value={aminoStock} onChange={setAminoStock} suffix="mg/mL" /></div>
      </section>
      {valid ? (
        <div className="result-panel mixture">
          <div><span>Furosemida total</span><strong>{fmt(furoAmount)} mg</strong></div>
          <div><span>Volume de furosemida</span><strong>{fmt(furoVolume)} mL</strong></div>
          <div><span>Aminofilina total</span><strong>{fmt(aminoAmount)} mg</strong></div>
          <div><span>Volume de aminofilina</span><strong>{fmt(aminoVolume)} mL</strong></div>
          <div><span>Diluente</span><strong>{fmt(diluent)} mL</strong></div>
          <div className="result-primary"><span>Duração da solução</span><strong>{fmt(duration, 1)} h</strong></div>
        </div>
      ) : <p className="empty-result">Complete todos os dados para calcular a solução.</p>}
      {valid && diluent < 0 ? <div className="danger-note">Os volumes das drogas excedem o volume final; ajuste a vazão, o volume final ou as concentrações.</div> : null}
      {valid && duration > 24 ? <div className="danger-note">A duração calculada supera 24 horas. Confirme estabilidade, validade e rotina de troca da solução.</div> : null}
      {valid ? (
        <PrescriptionBlock
          invalidMessage="Os volumes das drogas excedem o volume final; corrija a composição antes de copiar."
          text={dualPrescription}
          valid={diluent >= 0}
        />
      ) : null}
      <div className="danger-note"><strong>Compatibilidade não presumida:</strong> só prepare a associação se ela estiver prevista no protocolo institucional e validada pela farmácia. A calculadora verifica apenas a quantidade matemática.</div>
    </>
  );
}

export default function Home() {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [weight, setWeight] = useState("12");
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<DrugGroup | "Todos">("Todos");
  const [scoreGroup, setScoreGroup] = useState("Todos");
  const [antibioticSetting, setAntibioticSetting] = useState<"hospital" | "home">("hospital");
  const [antimicrobialSearch, setAntimicrobialSearch] = useState("");
  const [antimicrobialGroup, setAntimicrobialGroup] = useState<AntimicrobialGroup | "Todos">("Todos");
  const [oralSearch, setOralSearch] = useState("");
  const [oralGroup, setOralGroup] = useState<OralAntibioticGroup | "Todos">("Todos");
  const filteredDrugs = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return DRUGS.filter((drug) => (group === "Todos" || drug.group === group) && (!query || drug.name.toLocaleLowerCase("pt-BR").includes(query)));
  }, [group, search]);
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const plainSearch = normalizedSearch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const showDual = (group === "Todos" || group === "Outras drogas") && (!normalizedSearch || "furosemida aminofilina".includes(normalizedSearch));
  const showNitric = (group === "Todos" || group === "Vasoativas") && (!plainSearch || "oxido nitrico nitric oxide".includes(plainSearch));
  const filteredAntimicrobials = useMemo(() => {
    const query = antimicrobialSearch.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return ANTIMICROBIALS.filter((item) => {
      const haystack = `${item.name} ${item.className} ${item.group}`.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return (antimicrobialGroup === "Todos" || item.group === antimicrobialGroup) && (!query || haystack.includes(query));
    });
  }, [antimicrobialGroup, antimicrobialSearch]);
  const filteredOralAntibiotics = useMemo(() => {
    const query = oralSearch.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return ORAL_ANTIBIOTICS.filter((item) => {
      const haystack = `${item.name} ${item.className} ${item.group}`.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return (oralGroup === "Todos" || item.group === oralGroup) && (!query || haystack.includes(query));
    });
  }, [oralGroup, oralSearch]);
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="PED Calc, início">
          <span className="brand-mark">P+</span>
          <span><strong>PED</strong><small>CALC</small></span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#venoclise">Venóclise</a>
          <a href="#eletrolitos">Distúrbios H-E</a>
          <a href="#infusoes">Infusões</a>
          <a href="#scores">Scores</a>
          <a href="#antimicrobianos">Antimicrobianos</a>
        </nav>
        <label className="weight-control">
          <span>Peso rápido</span>
          <input aria-label="Peso rápido em quilogramas" inputMode="decimal" min="0" onChange={(e) => setWeight(e.target.value)} step="0.1" type="number" value={weight} />
          <b>kg</b>
        </label>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <span className="eyebrow light">INTENSIVA PEDIÁTRICA · CÁLCULO À BEIRA-LEITO</span>
          <h1>PED <em>Calc.</em></h1>
          <p>Vazões, diluições, correções hidroeletrolíticas, venóclise, scores e antimicrobianos hospitalares e domiciliares.</p>
          <div className="hero-actions">
            <button className="primary-action" onClick={() => setActiveTool({ type: "maintenance" })}>Calcular venóclise <span>→</span></button>
            <a href="#antimicrobianos">Abrir antimicrobianos</a>
          </div>
        </div>
        <div className="hero-console" aria-label="Resumo rápido">
          <div className="console-top"><span>CASO ATUAL</span><i>● ONLINE</i></div>
          <label className="console-weight">
            <span>PESO</span>
            <span className="console-weight-input"><input aria-label="Peso do caso atual em quilogramas" inputMode="decimal" min="0" onChange={(event) => setWeight(event.target.value)} step="0.1" type="number" value={weight} /><small>kg</small></span>
          </label>
          <button onClick={() => setActiveTool({ type: "maintenance" })}><span>01</span><b>MANUTENÇÃO</b><em>{fmt(maintenanceDaily(number(weight)) / 24)} mL/h</em></button>
          <a href="#eletrolitos"><span>02</span><b>DISTÚRBIOS H-E</b><em>8 ferramentas</em></a>
          <button onClick={() => setActiveTool({ type: "gir" })}><span>03</span><b>VIG + ELETRÓLITOS</b><em>abrir cálculo</em></button>
          <a href="#scores"><span>04</span><b>SCORES</b><em>17 ferramentas</em></a>
          <a href="#antimicrobianos"><span>05</span><b>ANTIMICROBIANOS</b><em>21 hospitalares + 9 VO</em></a>
        </div>
      </section>

      <section className="safety-strip">
        <strong>Ambiente de apoio clínico</strong>
        <span>Resultados matemáticos não substituem prescrição, protocolo institucional nem dupla checagem independente.</span>
      </section>

      <section className="section" id="venoclise">
        <div className="section-heading"><div><span className="eyebrow">MÓDULO 01</span><h2>Venóclise</h2></div><p>Do cálculo básico à composição com VIG e eletrólitos.</p></div>
        <div className="feature-grid two-cards">
          <button className="feature-card maintenance" onClick={() => setActiveTool({ type: "maintenance" })}>
            <span className="card-index">01</span><div className="card-icon">H</div><div><h3>Manutenção hídrica</h3><p>Holliday–Segar com quota de 0 a 200%.</p></div><b>ABRIR →</b>
          </button>
          <button className="feature-card gir" onClick={() => setActiveTool({ type: "gir" })}>
            <span className="card-index">02</span><div className="card-icon">G</div><div><h3>VIG + eletrólitos</h3><p>Mistura personalizada, concentração e via.</p></div><b>ABRIR →</b>
          </button>
        </div>
      </section>

      <section className="section electrolyte-section" id="eletrolitos">
        <div className="section-heading"><div><span className="eyebrow">MÓDULO 02 · CORREÇÕES</span><h2>Distúrbios hidroeletrolíticos</h2></div><p>Fórmulas estruturadas a partir do RFOFOS 2026, com limites, arredondamento e prescrição copiável quando seguro.</p></div>
        <div className="electrolyte-warning"><strong>Uso intensivo e monitorizado</strong><span>Confirme exame, gravidade, etiologia, função renal, volemia, ECG, acesso, compatibilidade e todos os aportes. O módulo não seleciona automaticamente uma intervenção.</span></div>
        <div className="electrolyte-tool-grid">
          {ELECTROLYTE_TOOLS.map((item, index) => (
            <button className="electrolyte-card" key={item.id} onClick={() => setActiveTool({ type: "electrolyte", tool: item.id })}>
              <span className="electrolyte-index">{String(index + 1).padStart(2, "0")}</span><i>{item.symbol}</i><div><small>{item.tag}</small><h3>{item.name}</h3><p>{item.description}</p></div><b>→</b>
            </button>
          ))}
        </div>
      </section>

      <section className="section dark-section" id="infusoes">
        <div className="section-heading inverse"><div><span className="eyebrow light">MÓDULO 03</span><h2>Infusões contínuas</h2></div><p>Calcule vazão ou reconstrua a dose a partir da bomba.</p></div>
        <div className="toolbar">
          <div className="group-tabs" role="tablist" aria-label="Grupos de medicamentos">
            {(["Todos", "Analgossedação", "Vasoativas", "Outras drogas"] as const).map((item) => <button className={group === item ? "active" : ""} key={item} onClick={() => setGroup(item)}>{item}</button>)}
          </div>
          <label className="search-box"><span>⌕</span><input aria-label="Buscar medicamento" onChange={(e) => setSearch(e.target.value)} placeholder="Buscar medicamento" value={search} /></label>
        </div>
        <div className="drug-grid">
          {filteredDrugs.map((drug, index) => (
            <button className="drug-card" data-group={drug.group} key={drug.id} onClick={() => setActiveTool({ type: "drug", drug })}>
              <span className="drug-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="drug-letter">{GROUP_META[drug.group].icon}</span>
              <span><strong>{drug.name}</strong><small>{drug.range}</small></span>
              <b>→</b>
            </button>
          ))}
          {showDual ? (
            <button className="drug-card" data-group="Outras drogas" onClick={() => setActiveTool({ type: "dual" })}>
              <span className="drug-number">23</span><span className="drug-letter">O</span><span><strong>Furosemida + aminofilina</strong><small>Solução dupla por doses-alvo</small></span><b>→</b>
            </button>
          ) : null}
          {showNitric ? (
            <button className="drug-card" data-group="Vasoativas" onClick={() => setActiveTool({ type: "nitric" })}>
              <span className="drug-number">24</span><span className="drug-letter">V</span><span><strong>Óxido nítrico inalatório</strong><small>Conferência de fluxo e ppm</small></span><b>→</b>
            </button>
          ) : null}
        </div>
      </section>

      <section className="section scores-section" id="scores">
        <div className="section-heading"><div><span className="eyebrow">MÓDULO 04</span><h2>Scores clínicos</h2></div><p>Instrumentos pontuados, interpretações e referências em uma única tela.</p></div>
        <div className="score-toolbar">
          <div className="score-tabs">
            {["Todos", "Admissão na UTI", ...SCORE_CATEGORIES].map((category) => <button className={scoreGroup === category ? "active" : ""} key={category} onClick={() => setScoreGroup(category)}>{category}</button>)}
          </div>
          <span>{17} ferramentas</span>
        </div>
        <div className="score-grid">
          {(scoreGroup === "Todos" || scoreGroup === "Admissão na UTI") ? (
            <button className="score-card featured" onClick={() => setActiveTool({ type: "prism" })}>
              <span className="score-card-index">01</span><i>P</i><div><small>Admissão na UTI</small><h3>PRISM IV oficial</h3><p>Probabilidade de mortalidade pelo modelo publicado.</p></div><b>→</b>
            </button>
          ) : null}
          {SCORE_DEFINITIONS.filter((definition) => scoreGroup === "Todos" || definition.category === scoreGroup).map((definition, index) => (
            <button className="score-card" key={definition.id} onClick={() => setActiveTool({ type: "score", definition })}>
              <span className="score-card-index">{String(index + 2).padStart(2, "0")}</span><i>{definition.name.slice(0, 1)}</i><div><small>{definition.category}</small><h3>{definition.name}</h3><p>{definition.summary}</p></div><em>{definition.short}</em><b>→</b>
            </button>
          ))}
          {(scoreGroup === "Todos" || scoreGroup === "Dor") ? (
            <button className="score-card" onClick={() => setActiveTool({ type: "pain" })}>
              <span className="score-card-index">16</span><i>D</i><div><small>Dor</small><h3>Escalas autorreferidas</h3><p>EN, EVA e pontuação das escalas de faces.</p></div><em>0–10</em><b>→</b>
            </button>
          ) : null}
          {(scoreGroup === "Todos" || scoreGroup === "Delirium") ? (
            <button className="score-card" onClick={() => setActiveTool({ type: "cam" })}>
              <span className="score-card-index">17</span><i>C</i><div><small>Delirium</small><h3>pCAM / psCAM-ICU</h3><p>Fluxograma diagnóstico adaptado à idade.</p></div><em>fluxo</em><b>→</b>
            </button>
          ) : null}
        </div>
      </section>

      <section className="section antimicrobial-section" id="antimicrobianos">
        <div className="section-heading">
          <div><span className="eyebrow">MÓDULO 05 · ATB</span><h2>Antimicrobianos</h2></div>
          <p>ATB hospitalares com IV–AVP, IV–AVC e IM quando descritos; ATB domiciliares por via oral em uma área separada.</p>
        </div>
        <div className="antimicrobial-warning">
          <strong>Seleção clínica permanece humana</strong>
          <span>Escolha o fármaco e o esquema somente após avaliar foco, culturas, alergias, antibiograma, função renal/hepática e protocolo institucional. O PDF orienta reservar doses máximas para indicações bem estabelecidas e após discussão com a CCIH.</span>
        </div>
        <div className="antibiotic-setting-tabs" role="tablist" aria-label="Local de uso dos antibióticos">
          <button aria-selected={antibioticSetting === "hospital"} className={antibioticSetting === "hospital" ? "active" : ""} onClick={() => setAntibioticSetting("hospital")} role="tab"><strong>ATB hospitalares</strong><span>21 preparações</span></button>
          <button aria-selected={antibioticSetting === "home"} className={antibioticSetting === "home" ? "active" : ""} onClick={() => setAntibioticSetting("home")} role="tab"><strong>ATB domiciliares</strong><span>Via oral · 9 opções</span></button>
        </div>

        {antibioticSetting === "hospital" ? (
          <>
            <div className="antibiotic-context-note"><strong>Uso hospitalar</strong><span>Escolha a via e, para IV, alterne entre acesso venoso periférico (AVP) e central (AVC) quando o guia trouxer preparos diferentes.</span></div>
            <div className="toolbar antimicrobial-toolbar">
              <div className="group-tabs antimicrobial-tabs" role="tablist" aria-label="Classes de antimicrobianos hospitalares">
                {(["Todos", ...ANTIMICROBIAL_GROUPS] as const).map((item) => <button className={antimicrobialGroup === item ? "active" : ""} key={item} onClick={() => setAntimicrobialGroup(item)}>{item}</button>)}
              </div>
              <label className="search-box antimicrobial-search"><span>⌕</span><input aria-label="Buscar antimicrobiano hospitalar" onChange={(event) => setAntimicrobialSearch(event.target.value)} placeholder="Nome ou classe" value={antimicrobialSearch} /></label>
            </div>
            <div className="antimicrobial-count"><strong>{filteredAntimicrobials.length}</strong><span>preparações hospitalares</span></div>
            <div className="antimicrobial-grid">
              {filteredAntimicrobials.map((item, index) => (
                <button className="antimicrobial-card" data-group={item.group} key={item.id} onClick={() => setActiveTool({ type: "antimicrobial", antimicrobial: item })}>
                  <span className="antimicrobial-index">{String(index + 1).padStart(2, "0")}</span>
                  <i>{item.name.slice(0, 1)}</i>
                  <div><small>{item.className}</small><h3>{item.name}</h3><p>{item.routes} · pág. {item.page}</p></div>
                  <b>→</b>
                </button>
              ))}
            </div>
            {filteredAntimicrobials.length === 0 ? <p className="antimicrobial-empty">Nenhum antimicrobiano hospitalar corresponde aos filtros.</p> : null}
          </>
        ) : (
          <>
            <div className="antibiotic-context-note home"><strong>Uso domiciliar · VO</strong><span>Doses extraídas de bulas oficiais. O sistema não escolhe indicação, antibiótico ou duração; a cópia só é liberada após confirmação clínica.</span></div>
            <div className="toolbar antimicrobial-toolbar">
              <div className="group-tabs antimicrobial-tabs" role="tablist" aria-label="Classes de antibióticos domiciliares">
                {(["Todos", ...ORAL_ANTIBIOTIC_GROUPS] as const).map((item) => <button className={oralGroup === item ? "active" : ""} key={item} onClick={() => setOralGroup(item)}>{item}</button>)}
              </div>
              <label className="search-box antimicrobial-search"><span>⌕</span><input aria-label="Buscar antibiótico domiciliar" onChange={(event) => setOralSearch(event.target.value)} placeholder="Nome ou classe" value={oralSearch} /></label>
            </div>
            <div className="antimicrobial-count"><strong>{filteredOralAntibiotics.length}</strong><span>opções por via oral</span></div>
            <div className="antimicrobial-grid oral-antibiotic-grid">
              {filteredOralAntibiotics.map((item, index) => (
                <button className="antimicrobial-card oral-antibiotic-card" data-group={item.group} key={item.id} onClick={() => setActiveTool({ type: "oral-antibiotic", antibiotic: item })}>
                  <span className="antimicrobial-index">{String(index + 1).padStart(2, "0")}</span>
                  <i>{item.name.slice(0, 1)}</i>
                  <div><small>{item.className}</small><h3>{item.name}</h3><p>VO · {item.rules.length} {item.rules.length === 1 ? "esquema" : "esquemas"}</p></div>
                  <b>→</b>
                </button>
              ))}
            </div>
            {filteredOralAntibiotics.length === 0 ? <p className="antimicrobial-empty">Nenhum antibiótico domiciliar corresponde aos filtros.</p> : null}
          </>
        )}
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">P+</span><span><strong>PED</strong><small>CALC</small></span></div>
        <p>Ferramenta independente de apoio matemático para profissionais habilitados.</p>
        <div><a href="https://pubmed.ncbi.nlm.nih.gov/13431307/" target="_blank" rel="noreferrer">Holliday–Segar</a><a href="https://www.cpccrn.org/calculators/prismivcalculator/" target="_blank" rel="noreferrer">PRISM IV oficial</a><span>RFOFOS 2026 + referências pediátricas oficiais</span></div>
      </footer>

      {activeTool ? (
        <ToolModal onClose={() => setActiveTool(null)}>
          {activeTool.type === "maintenance" ? <MaintenanceCalculator initialWeight={weight} /> : null}
          {activeTool.type === "gir" ? <GirCalculator initialWeight={weight} /> : null}
          {activeTool.type === "drug" ? <DrugCalculator drug={activeTool.drug} initialWeight={weight} /> : null}
          {activeTool.type === "nitric" ? <NitricOxideCalculator /> : null}
          {activeTool.type === "dual" ? <DualDiureticCalculator initialWeight={weight} /> : null}
          {activeTool.type === "score" ? <ScoreCalculator definition={activeTool.definition} /> : null}
          {activeTool.type === "prism" ? <PrismCalculator /> : null}
          {activeTool.type === "cam" ? <CamCalculator /> : null}
          {activeTool.type === "pain" ? <PainScaleCalculator /> : null}
          {activeTool.type === "electrolyte" ? <ElectrolyteCalculator initialWeight={weight} tool={activeTool.tool} /> : null}
          {activeTool.type === "antimicrobial" ? <AntimicrobialCalculator antimicrobial={activeTool.antimicrobial} initialWeight={weight} /> : null}
          {activeTool.type === "oral-antibiotic" ? <OralAntibioticCalculator antibiotic={activeTool.antibiotic} initialWeight={weight} /> : null}
        </ToolModal>
      ) : null}
    </main>
  );
}
