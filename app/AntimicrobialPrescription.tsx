"use client";

import { useState } from "react";
import type { AntimicrobialResult } from "../lib/antimicrobial-calculations";
import { guideFinalVolume } from "../lib/preparation-calculations.mjs";
import type { AccessProfile, Antimicrobial, AntimicrobialRule } from "./antimicrobials-data";
import { PrescriptionBlock } from "./PrescriptionBlock";

type AdministrationRoute = "IV" | "IM";
type VenousAccess = "AVP" | "AVC";

const DILUENTS = ["SF 0,9%", "SG 5%", "SEM REDILUIÇÃO", "OUTRO DILUENTE"];

function parseNumber(value: string) {
  if (!value.trim()) return Number.NaN;
  return Number(value.replace(",", "."));
}

function formatNumber(value: number, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(value);
}

function roundToTenth(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function roundUpToTenth(value: number) {
  return Math.ceil((value - Number.EPSILON) * 10) / 10;
}

function suggestedVolume({
  dose,
  stockConcentration,
  profile,
}: {
  dose: number;
  stockConcentration: number;
  profile: AccessProfile;
}) {
  const exact = guideFinalVolume({
    dose,
    stockConcentration,
    targetConcentration: profile.targetConcentration,
    diluentMultiple: profile.diluentMultiple,
  });
  return profile.concentrationKind === "direct" ? roundToTenth(exact) : roundUpToTenth(exact);
}

function availableRoutes(route: string): AdministrationRoute[] {
  const values = route
    .toUpperCase()
    .split("/")
    .map((item) => item.trim())
    .filter((item): item is AdministrationRoute => item === "IV" || item === "IM");
  return values.length ? values : ["IV"];
}

function frequencyText(rule: AntimicrobialRule) {
  if (rule.once) return "DOSE ÚNICA";
  if (rule.intervalHours) return `DE ${formatNumber(rule.intervalHours)}/${formatNumber(rule.intervalHours)}H`;
  return (rule.intervalLabel || "FREQUÊNCIA A CONFIRMAR").toLocaleUpperCase("pt-BR");
}

function infusionTimeText(minutes: number) {
  if (minutes >= 60 && minutes % 60 === 0) return `${formatNumber(minutes / 60)}H`;
  return `${formatNumber(minutes)} MIN`;
}

function preferredDiluent(access: AccessProfile) {
  return access.diluent === "SF 0,9% OU SG 5%" ? "SF 0,9%" : access.diluent;
}

function allowedDiluent(access: AccessProfile, selected: string) {
  if (access.diluent === "SF 0,9% OU SG 5%") return selected === "SF 0,9%" || selected === "SG 5%";
  return selected === access.diluent;
}

function InputField({
  label,
  value,
  onChange,
  suffix,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix: string;
  helper?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="input-wrap">
        <input inputMode="decimal" min="0" onChange={(event) => onChange(event.target.value)} step="any" type="number" value={value} />
        <span className="input-suffix">{suffix}</span>
      </span>
      {helper ? <small>{helper}</small> : null}
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
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

export function AntimicrobialPrescriptionBuilder({
  antimicrobial,
  rule,
  result,
}: {
  antimicrobial: Antimicrobial;
  rule: AntimicrobialRule;
  result: AntimicrobialResult;
}) {
  const iv = antimicrobial.iv;
  const routes = availableRoutes(rule.route);
  const initialRoute = routes.includes("IV") ? "IV" : routes[0];
  const initialDose = result.doseMin ?? result.doseMax ?? Number.NaN;
  const [route, setRoute] = useState<AdministrationRoute>(initialRoute);
  const [access, setAccess] = useState<VenousAccess>("AVP");
  const initialAccessProfile = iv.peripheral;
  const initialStockConcentration = iv.kind === "powder"
    ? (iv.vialAmount ?? Number.NaN) / (iv.reconstitutionVolume ?? Number.NaN)
    : iv.stockConcentration ?? Number.NaN;
  const [vialAmount, setVialAmount] = useState(iv.vialAmount ? String(iv.vialAmount) : "");
  const [reconstitutionVolume, setReconstitutionVolume] = useState(iv.reconstitutionVolume ? String(iv.reconstitutionVolume) : "");
  const [stockConcentration, setStockConcentration] = useState(iv.stockConcentration ? String(iv.stockConcentration) : "");
  const [finalVolume, setFinalVolume] = useState(Number.isFinite(initialDose) ? String(suggestedVolume({ dose: initialDose, stockConcentration: initialStockConcentration, profile: initialAccessProfile })) : "");
  const [imConcentration, setImConcentration] = useState(antimicrobial.im?.concentration ? String(antimicrobial.im.concentration) : "");
  const [reconstitutionDiluent, setReconstitutionDiluent] = useState(iv.reconstitutionDiluent ?? "ÁGUA BIDESTILADA");
  const [diluent, setDiluent] = useState<string>(preferredDiluent(initialAccessProfile));
  const [infusionMinutes, setInfusionMinutes] = useState(String(iv.infusionMin));
  const [pump, setPump] = useState("BIS");
  const [verified, setVerified] = useState(false);

  const accessProfile = access === "AVC" && iv.central ? iv.central : iv.peripheral;
  const dose = initialDose;
  const minimumDose = result.doseMin ?? result.doseMax ?? Number.NaN;
  const maximumDose = result.doseMax ?? result.doseMin ?? Number.NaN;
  const doseInRange = Number.isFinite(dose)
    && dose > 0
    && Number.isFinite(minimumDose)
    && Number.isFinite(maximumDose)
    && dose >= minimumDose - 1e-8
    && dose <= maximumDose + 1e-8;
  const vial = parseNumber(vialAmount);
  const reconVolume = parseNumber(reconstitutionVolume);
  const concentrationAfterPreparation = iv.kind === "powder" ? vial / reconVolume : parseNumber(stockConcentration);
  const exactAspiratedVolume = dose / concentrationAfterPreparation;
  const aspiratedVolume = roundToTenth(exactAspiratedVolume);
  const administeredIvDose = aspiratedVolume * concentrationAfterPreparation;
  const final = parseNumber(finalVolume);
  const diluentVolume = roundToTenth(final - aspiratedVolume);
  const finalConcentration = administeredIvDose / final;
  const suggestedFinalVolume = suggestedVolume({ dose, stockConcentration: concentrationAfterPreparation, profile: accessProfile });
  const time = parseNumber(infusionMinutes);
  const imStock = parseNumber(imConcentration);
  const exactImVolume = dose / imStock;
  const imVolume = roundToTenth(exactImVolume);
  const administeredImDose = imVolume * imStock;
  const vialsNeeded = iv.kind === "powder" && Number.isFinite(vial) && vial > 0 ? Math.ceil(dose / vial) : 0;
  const directAdministration = accessProfile.concentrationKind === "direct";
  const concentrationValid = directAdministration
    ? Math.abs(final - aspiratedVolume) <= 0.005
    : Number.isFinite(finalConcentration) && finalConcentration <= accessProfile.targetConcentration + 1e-8;
  const timeValid = Number.isFinite(time) && time >= iv.infusionMin && time <= iv.infusionMax;
  const diluentValid = allowedDiluent(accessProfile, diluent);
  const verificationValid = !iv.verificationRequired || verified;
  const ivDoseAfterRoundingValid = Number.isFinite(administeredIvDose)
    && administeredIvDose >= minimumDose - 1e-8
    && administeredIvDose <= maximumDose + 1e-8
    && Math.abs(administeredIvDose - dose) / dose <= 0.05;
  const imDoseAfterRoundingValid = Number.isFinite(administeredImDose)
    && administeredImDose >= minimumDose - 1e-8
    && administeredImDose <= maximumDose + 1e-8
    && Math.abs(administeredImDose - dose) / dose <= 0.05;

  const ivValid = doseInRange
    && Number.isFinite(concentrationAfterPreparation)
    && concentrationAfterPreparation > 0
    && Number.isFinite(exactAspiratedVolume)
    && exactAspiratedVolume >= 0.05
    && aspiratedVolume > 0
    && ivDoseAfterRoundingValid
    && Number.isFinite(final)
    && final > 0
    && Number.isFinite(diluentVolume)
    && diluentVolume >= -0.005
    && concentrationValid
    && timeValid
    && diluentValid
    && verificationValid;
  const imValid = Boolean(antimicrobial.im)
    && doseInRange
    && Number.isFinite(imStock)
    && imStock > 0
    && Number.isFinite(exactImVolume)
    && exactImVolume >= 0.05
    && imVolume > 0
    && imDoseAfterRoundingValid;
  const valid = route === "IV" ? ivValid : imValid;
  const unit = rule.unit.toUpperCase();
  const frequency = frequencyText(rule);

  function updateAccess(value: string) {
    const nextAccess = value as VenousAccess;
    const nextProfile = nextAccess === "AVC" && iv.central ? iv.central : iv.peripheral;
    setAccess(nextAccess);
    setDiluent(preferredDiluent(nextProfile));
    if (Number.isFinite(dose) && dose > 0) setFinalVolume(String(suggestedVolume({ dose, stockConcentration: concentrationAfterPreparation, profile: nextProfile })));
  }

  const accessLine = iv.central ? `ACESSO: ${access}.` : "VIA INTRAVENOSA.";
  const ivLines = iv.kind === "powder"
    ? [
        `${antimicrobial.name.toLocaleUpperCase("pt-BR")} — ${String(vialsNeeded).padStart(2, "0")} FA DE ${formatNumber(vial, rule.unit === "UI" ? 0 : 1)} ${unit}.`,
        `RECONSTITUIR CADA FA + ${reconstitutionDiluent} ${formatNumber(reconVolume)} ML (${formatNumber(concentrationAfterPreparation, 3)} ${unit}/ML).`,
        directAdministration
          ? `ASPIRAR ${formatNumber(aspiratedVolume)} ML. SEM REDILUIÇÃO. VT ${formatNumber(final)} ML.`
          : `ASPIRAR ${formatNumber(aspiratedVolume)} ML + ${diluent} ${formatNumber(Math.max(0, diluentVolume))} ML. VT ${formatNumber(final)} ML (${formatNumber(finalConcentration, 3)} ${unit}/ML).`,
        accessLine,
        `CORRER EM ${pump} POR ${infusionTimeText(time)}, ${frequency}.`,
        `DOSE: ${formatNumber(administeredIvDose, rule.unit === "UI" ? 0 : 1)} ${unit} IV.`,
      ]
    : [
        `${antimicrobial.name.toLocaleUpperCase("pt-BR")} (${formatNumber(concentrationAfterPreparation, 3)} ${unit}/ML) — ASPIRAR ${formatNumber(aspiratedVolume)} ML.`,
        directAdministration
          ? `SEM REDILUIÇÃO. VT ${formatNumber(final)} ML.`
          : `${diluent} ${formatNumber(Math.max(0, diluentVolume))} ML. VT ${formatNumber(final)} ML (${formatNumber(finalConcentration, 3)} ${unit}/ML).`,
        accessLine,
        `CORRER EM ${pump} POR ${infusionTimeText(time)}, ${frequency}.`,
        `DOSE: ${formatNumber(administeredIvDose, rule.unit === "UI" ? 0 : 1)} ${unit} IV.`,
      ];

  const imLines = [
    `${antimicrobial.name.toLocaleUpperCase("pt-BR")} (${formatNumber(imStock, 3)} ${unit}/ML).`,
    antimicrobial.im?.preparation.toLocaleUpperCase("pt-BR") ?? "CONFIRMAR PREPARO IM.",
    `ASPIRAR E ADMINISTRAR ${formatNumber(imVolume)} ML IM, ${frequency}.`,
    `DOSE: ${formatNumber(administeredImDose, rule.unit === "UI" ? 0 : 1)} ${unit}.`,
  ];

  const prescription = (route === "IV" ? ivLines : imLines).join("\n");

  return (
    <section className="antimicrobial-builder">
      <div className="antimicrobial-step"><span>02</span><div><strong>Monte o preparo da apresentação disponível</strong><small>A dose por aplicação deriva da dose diária selecionada; apresentação, acesso, volumes e tempo permanecem explícitos para dupla checagem.</small></div></div>
      <div className="form-grid two antimicrobial-builder-grid">
        <SelectField label="Via de administração" value={route} onChange={(value) => setRoute(value as AdministrationRoute)} options={routes} />
        <div className="derived-field"><span>DOSE CALCULADA POR APLICAÇÃO</span><strong>{formatNumber(dose, rule.unit === "UI" ? 0 : 1)} {unit}</strong><small>Após fracionamento e aplicação do teto.</small></div>
      </div>

      {route === "IM" ? (
        <>
          <div className="form-grid two antimicrobial-builder-grid">
            <InputField helper={antimicrobial.im?.preparation ?? "Confirme o preparo IM com a farmácia clínica."} label="Concentração final para IM" onChange={setImConcentration} suffix={`${unit}/mL`} value={imConcentration} />
            <div className="derived-field"><span>VOLUME POR DOSE IM</span><strong>{formatNumber(imVolume)} mL</strong></div>
            <div className="derived-field"><span>DOSE APÓS ARREDONDAMENTO</span><strong>{formatNumber(administeredImDose, rule.unit === "UI" ? 0 : 1)} {unit}</strong></div>
          </div>
          <div className="clinical-note"><strong>Via IM:</strong> respeite o volume máximo permitido por músculo e a apresentação efetivamente disponível.</div>
        </>
      ) : (
        <>
          {iv.central ? (
            <div className="form-grid two antimicrobial-builder-grid">
              <SelectField label="Tipo de acesso venoso" value={access} onChange={updateAccess} options={["AVP", "AVC"]} />
              <div className="derived-field"><span>CONCENTRAÇÃO-ALVO / LIMITE HOSPITALAR</span><strong>{formatNumber(accessProfile.targetConcentration, 3)} {unit}/mL{Number.isFinite(accessProfile.diluentMultiple) ? ` · +${formatNumber(accessProfile.diluentMultiple ?? 0)}× diluente` : ""}</strong></div>
            </div>
          ) : (
            <div className="form-grid two antimicrobial-builder-grid">
              <div className="derived-field"><span>PREPARO IV DO GUIA</span><strong>{accessProfile.label}</strong></div>
              <div className="derived-field"><span>CONCENTRAÇÃO-ALVO / LIMITE HOSPITALAR</span><strong>{formatNumber(accessProfile.targetConcentration, 3)} {unit}/mL{Number.isFinite(accessProfile.diluentMultiple) ? ` · +${formatNumber(accessProfile.diluentMultiple ?? 0)}× diluente` : ""}</strong></div>
            </div>
          )}

          <div className="form-grid three antimicrobial-builder-grid">
            {iv.kind === "powder" ? (
              <>
                <InputField label="Conteúdo do frasco" onChange={setVialAmount} suffix={unit} value={vialAmount} />
                <InputField label="Volume de reconstituição" onChange={setReconstitutionVolume} suffix="mL/FA" value={reconstitutionVolume} />
                <label className="field"><span className="field-label">Diluente da reconstituição</span><span className="input-wrap"><input onChange={(event) => setReconstitutionDiluent(event.target.value)} type="text" value={reconstitutionDiluent} /></span></label>
              </>
            ) : (
              <InputField helper="Confirme no rótulo da bolsa ou ampola." label="Concentração disponível" onChange={setStockConcentration} suffix={`${unit}/mL`} value={stockConcentration} />
            )}
            <div className="derived-field"><span>CONCENTRAÇÃO APÓS PREPARO</span><strong>{formatNumber(concentrationAfterPreparation, 3)} {unit}/mL</strong></div>
            <div className="derived-field"><span>VOLUME A ASPIRAR</span><strong>{formatNumber(aspiratedVolume)} mL</strong></div>
            <div className="derived-field"><span>DOSE APÓS ARREDONDAMENTO</span><strong>{formatNumber(administeredIvDose, rule.unit === "UI" ? 0 : 1)} {unit}</strong></div>
            <div className="derived-field"><span>NÚMERO MÍNIMO DE FRASCOS</span><strong>{iv.kind === "powder" ? vialsNeeded : "SOLUÇÃO PRONTA"}</strong></div>
          </div>

          <div className="form-grid three antimicrobial-builder-grid">
            <InputField helper={`Sugestão segura em uma casa decimal: ${formatNumber(suggestedFinalVolume)} mL`} label="Volume final da dose" onChange={setFinalVolume} suffix="mL" value={finalVolume} />
            <SelectField label="Diluente final" value={diluent} onChange={setDiluent} options={DILUENTS} />
            <InputField helper={`Faixa hospitalar: ${formatNumber(iv.infusionMin)}–${formatNumber(iv.infusionMax)} min`} label="Tempo de infusão" onChange={setInfusionMinutes} suffix="min" value={infusionMinutes} />
            <SelectField label="Tipo de bomba" value={pump} onChange={setPump} options={["BIS", "BIC"]} />
            <div className="derived-field"><span>VOLUME DO DILUENTE</span><strong>{formatNumber(diluentVolume)} mL</strong></div>
            <div className="derived-field"><span>CONCENTRAÇÃO FINAL</span><strong>{formatNumber(finalConcentration, 3)} {unit}/mL</strong></div>
          </div>
        </>
      )}

      {!doseInRange ? <div className="danger-note">A dose final precisa ficar dentro da faixa calculada para o esquema selecionado.</div> : null}
      {route === "IV" && doseInRange && !ivDoseAfterRoundingValid ? <div className="danger-note">Com uma casa decimal, o volume aspirado altera a dose em mais de 5% ou sai da faixa selecionada. Ajuste a dose/concentração ou valide uma diluição com a farmácia; a cópia foi bloqueada.</div> : null}
      {route === "IM" && doseInRange && !imDoseAfterRoundingValid ? <div className="danger-note">Com uma casa decimal, o volume IM altera a dose em mais de 5% ou sai da faixa selecionada. Ajuste o preparo antes de copiar.</div> : null}
      {route === "IV" && Number.isFinite(exactAspiratedVolume) && exactAspiratedVolume < 0.05 ? <div className="danger-note">O volume a aspirar ficaria abaixo de 0,1 mL após arredondamento. A cópia foi bloqueada; valide outra concentração/diluição.</div> : null}
      {route === "IM" && Number.isFinite(exactImVolume) && exactImVolume < 0.05 ? <div className="danger-note">O volume IM ficaria abaixo de 0,1 mL após arredondamento. A cópia foi bloqueada.</div> : null}
      {route === "IV" && !concentrationValid ? <div className="danger-note">O volume final excede a concentração-alvo/limite hospitalar ou conflita com a orientação de não rediluir.</div> : null}
      {route === "IV" && !diluentValid ? <div className="danger-note">O diluente selecionado não corresponde ao preparo hospitalar descrito.</div> : null}
      {route === "IV" && !timeValid ? <div className="danger-note">O tempo precisa permanecer dentro da faixa hospitalar de infusão indicada.</div> : null}
      {iv.verificationRequired && route === "IV" ? (
        <label className="guide-verification">
          <input checked={verified} onChange={(event) => setVerified(event.target.checked)} type="checkbox" />
          <span>{iv.verificationText}</span>
        </label>
      ) : null}
      <PrescriptionBlock
        invalidMessage="Complete e valide dose, apresentação, via/acesso, reconstituição, volume final e tempo. A cópia permanece bloqueada se houver dado ausente, volume negativo ou divergência do limite do guia."
        text={prescription}
        valid={valid}
      />
    </section>
  );
}
