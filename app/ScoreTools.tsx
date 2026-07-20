"use client";

import { useMemo, useState } from "react";
import { prismIVMortality } from "../lib/calculations.mjs";
import { scoreBand, type ScoreDefinition } from "./scores-data";

function fmt(value: number, digits = 2) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(value);
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

export function ScoreCalculator({ definition }: { definition: ScoreDefinition }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const completed = Object.keys(answers).length;
  const isComplete = completed === definition.questions.length;
  const total = Object.values(answers).reduce((sum, value) => sum + value, 0);
  const band = isComplete ? scoreBand(definition, total) : null;
  return (
    <>
      <ToolHeading eyebrow={definition.category} title={definition.name} description={definition.summary} />
      <div className="score-progress" aria-label={`${completed} de ${definition.questions.length} critérios preenchidos`}>
        <span style={{ width: `${(completed / definition.questions.length) * 100}%` }} />
        <b>{completed}/{definition.questions.length}</b>
      </div>
      <div className="score-questions">
        {definition.questions.map((question, questionIndex) => (
          <fieldset className="score-question" key={question.id}>
            <legend><span>{String(questionIndex + 1).padStart(2, "0")}</span>{question.title}</legend>
            {question.hint ? <p>{question.hint}</p> : null}
            <div className="score-options">
              {question.options.map((option) => (
                <button
                  aria-pressed={answers[question.id] === option.score}
                  className={answers[question.id] === option.score ? "selected" : ""}
                  key={`${question.id}-${option.label}`}
                  onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.score }))}
                  type="button"
                >
                  <span>{option.label}</span><b>{option.score > 0 ? `+${option.score}` : option.score}</b>
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <section className={`score-result ${band?.tone ?? "neutral"}`} aria-live="polite">
        <div><span>Escore total</span><strong>{isComplete ? total : "—"}<small>{definition.id === "rass" ? " · faixa −5 a +4" : ` / ${definition.max}`}</small></strong></div>
        <div><span>Interpretação</span><h3>{band?.label ?? "Complete todos os critérios"}</h3><p>{band?.detail ?? "O resultado será exibido após o preenchimento integral."}</p></div>
      </section>
      <div className="score-actions">
        <button onClick={() => setAnswers({})} type="button">Limpar respostas</button>
        {definition.sourceUrl ? <a href={definition.sourceUrl} target="_blank" rel="noreferrer">{definition.sourceLabel ?? "Ver referência"} ↗</a> : null}
      </div>
      {definition.caveat ? <div className="clinical-note"><strong>Limitação:</strong> {definition.caveat}</div> : null}
      <div className="clinical-note"><strong>Uso responsável:</strong> este instrumento organiza a pontuação; diagnóstico, tendência temporal e conduta continuam dependentes da avaliação clínica.</div>
    </>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="select-wrap"><select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></span>
    </label>
  );
}

function NumericField({ label, value, onChange, suffix }: { label: string; value: string; onChange: (value: string) => void; suffix?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="input-wrap"><input min="0" inputMode="numeric" type="number" value={value} onChange={(event) => onChange(event.target.value)} />{suffix ? <span className="input-suffix">{suffix}</span> : null}</span>
    </label>
  );
}

function Toggle({ checked, onChange, title, description }: { checked: boolean; onChange: (value: boolean) => void; title: string; description?: string }) {
  return (
    <label className="toggle-row">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span><strong>{title}</strong>{description ? <small>{description}</small> : null}</span>
      <i>{checked ? "SIM" : "NÃO"}</i>
    </label>
  );
}

export function PrismCalculator() {
  const [age, setAge] = useState("child");
  const [source, setSource] = useState("or");
  const [cpr, setCpr] = useState(false);
  const [cancer, setCancer] = useState(false);
  const [lowRisk, setLowRisk] = useState(false);
  const [neuro, setNeuro] = useState("0");
  const [nonNeuro, setNonNeuro] = useState("0");
  const result = prismIVMortality({
    ageGroup: age,
    admissionSource: source,
    cpr,
    cancer,
    lowRiskSystem: lowRisk,
    neurologicScore: Number(neuro),
    nonNeurologicScore: Number(nonNeuro),
  });
  return (
    <>
      <ToolHeading eyebrow="Admissão na UTI" title="PRISM IV oficial" description="Probabilidade de mortalidade hospitalar pelo algoritmo de Pollack et al., publicado em domínio público." />
      <div className="method-banner"><strong>Janela correta:</strong> variáveis clínicas nas primeiras 4 h de UTI; exames de 2 h antes até 4 h após a admissão.</div>
      <div className="form-grid two">
        <SelectField label="Faixa etária" value={age} onChange={setAge}>
          <option value="newborn">0 a &lt;14 dias</option>
          <option value="neonate">14 dias a &lt;1 mês</option>
          <option value="infant">1 a &lt;12 meses</option>
          <option value="child">12 meses a 18 anos</option>
        </SelectField>
        <SelectField label="Origem da admissão" value={source} onChange={setSource}>
          <option value="or">Centro cirúrgico / recuperação</option>
          <option value="hospital">Outro hospital</option>
          <option value="inpatient">Unidade de internação</option>
          <option value="emergency">Emergência</option>
        </SelectField>
        <NumericField label="Subscore neurológico PRISM" value={neuro} onChange={setNeuro} suffix="pts" />
        <NumericField label="Subscore não neurológico PRISM" value={nonNeuro} onChange={setNonNeuro} suffix="pts" />
      </div>
      <div className="toggle-list">
        <Toggle checked={cpr} onChange={setCpr} title="RCP nas 24 h anteriores à admissão na UTI" />
        <Toggle checked={cancer} onChange={setCancer} title="Câncer agudo ou crônico" />
        <Toggle checked={lowRisk} onChange={setLowRisk} title="Sistema primário de baixo risco" description="Endócrino, hematológico, musculoesquelético ou renal." />
      </div>
      {result ? (
        <section className="prism-result">
          <span>Probabilidade estimada de mortalidade hospitalar</span>
          <strong>{fmt(result.percent, 2)}%</strong>
          <div><i style={{ width: `${Math.min(100, result.percent)}%` }} /></div>
          <small>Logit {fmt(result.logit, 4)} · estimativa populacional, não prognóstico individual determinístico.</small>
        </section>
      ) : null}
      <div className="danger-note"><strong>Correção importante:</strong> ventilação mecânica, choque ou “doença grave” não recebem pontos avulsos no PRISM IV oficial. O cálculo depende dos subscores fisiológicos e dos coeficientes publicados.</div>
      <div className="score-actions references-inline">
        <a href="https://www.cpccrn.org/documents/2015_PMID26492059_Pollack.pdf" target="_blank" rel="noreferrer">Artigo e coeficientes ↗</a>
        <a href="https://www.cpccrn.org/calculators/prismiiicalculator/" target="_blank" rel="noreferrer">Calcular subscores PRISM ↗</a>
      </div>
    </>
  );
}

type TriState = true | false | null;

function YesNoFeature({ title, value, onChange }: { title: string; value: TriState; onChange: (value: boolean) => void }) {
  return (
    <div className="cam-feature">
      <strong>{title}</strong>
      <div><button className={value === false ? "selected" : ""} onClick={() => onChange(false)}>Não</button><button className={value === true ? "selected" : ""} onClick={() => onChange(true)}>Sim</button></div>
    </div>
  );
}

export function CamCalculator() {
  const [mode, setMode] = useState<"pcam" | "pscam">("pcam");
  const [acute, setAcute] = useState<TriState>(null);
  const [attention, setAttention] = useState<TriState>(null);
  const [consciousness, setConsciousness] = useState<TriState>(null);
  const [thinking, setThinking] = useState<TriState>(null);
  const complete = [acute, attention, consciousness, thinking].every((value) => value !== null);
  const positive = acute === true && attention === true && (consciousness === true || thinking === true);
  return (
    <>
      <ToolHeading eyebrow="Delirium" title={mode === "pcam" ? "pCAM-ICU" : "psCAM-ICU"} description="Fluxograma de quatro características para triagem de delirium na UTI pediátrica." />
      <div className="segmented">
        <button className={mode === "pcam" ? "active" : ""} onClick={() => setMode("pcam")}>≥ 5 anos</button>
        <button className={mode === "pscam" ? "active" : ""} onClick={() => setMode("pscam")}>6 meses a &lt;5 anos</button>
      </div>
      <div className="method-banner">{mode === "pcam" ? "Use avaliação de atenção e pensamento compatível com o desenvolvimento da criança." : "Use observações e tarefas pré-escolares adequadas à idade e ao desenvolvimento."}</div>
      <div className="cam-flow">
        <YesNoFeature title="1 · Início agudo ou curso flutuante" value={acute} onChange={setAcute} />
        <YesNoFeature title="2 · Desatenção" value={attention} onChange={setAttention} />
        <div className="cam-either">
          <YesNoFeature title="3 · Nível de consciência alterado" value={consciousness} onChange={setConsciousness} />
          <span>OU</span>
          <YesNoFeature title="4 · Pensamento desorganizado" value={thinking} onChange={setThinking} />
        </div>
      </div>
      <section className={`score-result ${complete && positive ? "high" : complete ? "low" : "neutral"}`}>
        <div><span>Resultado</span><strong className="cam-result-text">{complete ? positive ? "TRIAGEM POSITIVA" : "TRIAGEM NEGATIVA" : "INCOMPLETO"}</strong></div>
        <div><span>Regra</span><p>Características 1 e 2 presentes, associadas à característica 3 ou 4.</p></div>
      </section>
      <div className="clinical-note">Uma triagem positiva deve motivar investigação clínica de causas e diferenciais; não equivale, isoladamente, a diagnóstico definitivo.</div>
    </>
  );
}

export function PainScaleCalculator() {
  const [scale, setScale] = useState("en");
  const [value, setValue] = useState(0);
  const values = useMemo(() => (scale === "wong" || scale === "fpsr" ? [0, 2, 4, 6, 8, 10] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), [scale]);
  const label = value === 0 ? "Sem dor" : value <= 3 ? "Dor leve" : value <= 6 ? "Dor moderada" : "Dor intensa";
  return (
    <>
      <ToolHeading eyebrow="Dor autorreferida" title="Escalas numéricas" description="Registro padronizado de intensidade quando o paciente consegue autorrelatar." />
      <SelectField label="Instrumento" value={scale} onChange={(next) => { setScale(next); setValue(0); }}>
        <option value="en">Escala numérica (EN)</option>
        <option value="eva">Escala visual analógica (EVA)</option>
        <option value="wong">Wong–Baker · pontuação numérica</option>
        <option value="fpsr">Faces Pain Scale–Revised · pontuação numérica</option>
      </SelectField>
      <div className="pain-scale" role="group" aria-label="Intensidade da dor">
        {values.map((item) => <button aria-pressed={value === item} className={value === item ? "selected" : ""} key={item} onClick={() => setValue(item)}>{item}</button>)}
      </div>
      <section className={`score-result ${value <= 3 ? "low" : value <= 6 ? "mid" : "high"}`}>
        <div><span>Intensidade</span><strong>{value}<small> / 10</small></strong></div>
        <div><span>Classificação descritiva</span><h3>{label}</h3><p>Registre também localização, padrão, duração e resposta à intervenção.</p></div>
      </section>
      {(scale === "wong" || scale === "fpsr") ? <div className="clinical-note">Os desenhos faciais licenciados não são reproduzidos aqui. Para aplicação formal, apresente ao paciente o cartão original autorizado e registre apenas a pontuação neste campo.</div> : null}
    </>
  );
}
