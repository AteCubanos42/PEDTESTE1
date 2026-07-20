import type { AntimicrobialRule } from "./antimicrobials-data";

export type OralAntibioticGroup = "Penicilinas" | "Cefalosporinas" | "Macrolídeos" | "Outros";

export type OralFormulation = {
  id: string;
  label: string;
  concentrationMgMl: number;
};

export type OralRule = AntimicrobialRule & {
  ageLabel: string;
  durationMin?: number;
  durationMax?: number;
  defaultDuration?: number;
  durationGuidance?: string;
  sourceTitle: string;
  sourceUrl: string;
  doseComponent?: string;
  requiredFormulationId?: string;
  maxWeightKg?: number;
};

export type OralAntibiotic = {
  id: string;
  name: string;
  group: OralAntibioticGroup;
  className: string;
  summary: string;
  formulations: OralFormulation[];
  rules: OralRule[];
  warning?: string;
};

export const ORAL_ANTIBIOTIC_GROUPS: OralAntibioticGroup[] = ["Penicilinas", "Cefalosporinas", "Macrolídeos", "Outros"];

export const ORAL_ANTIBIOTICS: OralAntibiotic[] = [
  {
    id: "amoxicillin-oral",
    name: "Amoxicilina",
    group: "Penicilinas",
    className: "Aminopenicilina",
    summary: "Esquemas pediátricos por gravidade para pacientes acima de 3 meses.",
    formulations: [
      { id: "250-5", label: "250 mg/5 mL", concentrationMgMl: 50 },
      { id: "400-5", label: "400 mg/5 mL", concentrationMgMl: 80 },
    ],
    rules: [
      { id: "mild-q12", label: "Infecção leve/moderada · 12/12 h", population: "Pediátrica", ageLabel: ">3 meses e <40 kg", maxWeightKg: 40, basis: "day", doseMin: 25, unit: "mg", intervalHours: 12, maxDaily: 1000, route: "VO", durationGuidance: "A tabela de dose consultada não fixa uma duração única; informe a duração definida para o diagnóstico e protocolo local.", sourceTitle: "DailyMed — Amoxicillin", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=88e76bdd-39f2-48c4-91ca-609511afd382" },
      { id: "severe-q12", label: "Infecção grave / trato respiratório inferior · 12/12 h", population: "Pediátrica", ageLabel: ">3 meses e <40 kg", maxWeightKg: 40, basis: "day", doseMin: 45, unit: "mg", intervalHours: 12, maxDaily: 1750, route: "VO", durationGuidance: "A tabela de dose consultada não fixa uma duração única; informe a duração definida para o diagnóstico e protocolo local.", sourceTitle: "DailyMed — Amoxicillin", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=88e76bdd-39f2-48c4-91ca-609511afd382" },
    ],
  },
  {
    id: "amoxicillin-clavulanate-oral",
    name: "Amoxicilina + clavulanato",
    group: "Penicilinas",
    className: "Aminopenicilina + inibidor",
    summary: "Cálculo sempre baseado no componente amoxicilina; a proporção do clavulanato deve ser preservada.",
    formulations: [
      { id: "400-57", label: "400 mg + 57 mg/5 mL", concentrationMgMl: 80 },
      { id: "600-42.9", label: "600 mg + 42,9 mg/5 mL", concentrationMgMl: 120 },
      { id: "200-28.5", label: "200 mg + 28,5 mg/5 mL", concentrationMgMl: 40 },
    ],
    warning: "Não intercambiar formulações apenas pelo volume: as proporções amoxicilina/clavulanato são diferentes.",
    rules: [
      { id: "mild", label: "Infecção menos grave · 12/12 h", population: "Pediátrica", ageLabel: "≥3 meses e <40 kg", maxWeightKg: 40, basis: "day", doseMin: 25, unit: "mg", intervalHours: 12, maxDaily: 1000, route: "VO", durationGuidance: "A tabela de dose consultada não fixa uma duração única; informe a duração definida para o diagnóstico e protocolo local.", doseComponent: "amoxicilina", sourceTitle: "DailyMed — Augmentin", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=174cc098-fe49-4f1a-87e2-601c7573f0db" },
      { id: "severe", label: "Otite / sinusite / infecção mais grave · 12/12 h", population: "Pediátrica", ageLabel: "≥3 meses e <40 kg", maxWeightKg: 40, basis: "day", doseMin: 45, unit: "mg", intervalHours: 12, maxDaily: 1750, route: "VO", durationGuidance: "A tabela de dose consultada não fixa uma duração única; informe a duração definida para o diagnóstico e protocolo local.", doseComponent: "amoxicilina", sourceTitle: "DailyMed — Augmentin", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=174cc098-fe49-4f1a-87e2-601c7573f0db" },
      { id: "es-90", label: "Formulação 600/42,9 · 90 mg/kg/dia", population: "Pediátrica", ageLabel: "≥3 meses e ≤40 kg", maxWeightKg: 40, basis: "day", doseMin: 90, unit: "mg", intervalHours: 12, maxDaily: 3600, route: "VO", durationMin: 10, durationMax: 10, defaultDuration: 10, doseComponent: "amoxicilina", requiredFormulationId: "600-42.9", note: "Usar somente a formulação 600 mg + 42,9 mg/5 mL prevista para este regime.", sourceTitle: "DailyMed — amoxicillin/clavulanate 600/42.9", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=08a35bfc-3945-4f95-948a-8af36cda715c" },
    ],
  },
  {
    id: "cephalexin-oral",
    name: "Cefalexina",
    group: "Cefalosporinas",
    className: "Cefalosporina de 1ª geração",
    summary: "Faixa usual e faixa para infecções graves, divididas em doses iguais.",
    formulations: [
      { id: "125-5", label: "125 mg/5 mL", concentrationMgMl: 25 },
      { id: "250-5", label: "250 mg/5 mL", concentrationMgMl: 50 },
    ],
    rules: [
      { id: "usual-q12", label: "Faixa usual · 12/12 h", population: "Pediátrica", ageLabel: ">1 ano", basis: "day", doseMin: 25, doseMax: 50, unit: "mg", intervalHours: 12, maxDaily: 4000, route: "VO", durationMin: 7, durationMax: 14, defaultDuration: 7, sourceTitle: "DailyMed — Cephalexin", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=19307ff0-71de-477b-965d-ea243e5ede3a" },
      { id: "severe-q6", label: "Infecção grave · 6/6 h", population: "Pediátrica", ageLabel: ">1 ano", basis: "day", doseMin: 50, doseMax: 100, unit: "mg", intervalHours: 6, maxDaily: 4000, route: "VO", durationMin: 7, durationMax: 14, defaultDuration: 10, sourceTitle: "DailyMed — Cephalexin", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=19307ff0-71de-477b-965d-ea243e5ede3a" },
    ],
  },
  {
    id: "cefuroxime-oral",
    name: "Cefuroxima axetil",
    group: "Cefalosporinas",
    className: "Cefalosporina de 2ª geração",
    summary: "Esquemas específicos da suspensão oral para faringite e otite/sinusite/impetigo.",
    formulations: [
      { id: "125-5", label: "125 mg/5 mL", concentrationMgMl: 25 },
      { id: "250-5", label: "250 mg/5 mL", concentrationMgMl: 50 },
    ],
    warning: "A suspensão deve ser administrada com alimento; comprimidos não devem ser triturados para substituir a suspensão.",
    rules: [
      { id: "pharyngitis", label: "Faringite / amigdalite", population: "Pediátrica", ageLabel: "3 meses–12 anos", basis: "day", doseMin: 20, unit: "mg", intervalHours: 12, maxDaily: 500, route: "VO", durationMin: 10, durationMax: 10, defaultDuration: 10, sourceTitle: "DailyMed — Cefuroxime axetil suspension", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=135e2dfc-eb47-4d04-a903-a081d36c267e" },
      { id: "aom-sinusitis", label: "Otite / sinusite / impetigo", population: "Pediátrica", ageLabel: "3 meses–12 anos", basis: "day", doseMin: 30, unit: "mg", intervalHours: 12, maxDaily: 1000, route: "VO", durationMin: 10, durationMax: 10, defaultDuration: 10, sourceTitle: "DailyMed — Cefuroxime axetil suspension", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=135e2dfc-eb47-4d04-a903-a081d36c267e" },
    ],
  },
  {
    id: "azithromycin-oral",
    name: "Azitromicina",
    group: "Macrolídeos",
    className: "Macrolídeo",
    summary: "Regimes oficiais de três ou cinco dias; não usar como substituição automática em alergia.",
    formulations: [
      { id: "100-5", label: "100 mg/5 mL", concentrationMgMl: 20 },
      { id: "200-5", label: "200 mg/5 mL", concentrationMgMl: 40 },
    ],
    rules: [
      { id: "aom-sinusitis-3d", label: "Otite / sinusite · 10 mg/kg/dia por 3 dias", population: "Pediátrica", ageLabel: "Indicação e idade conforme bula", basis: "dose", doseMin: 10, unit: "mg", intervalHours: 24, maxDose: 500, route: "VO", durationMin: 3, durationMax: 3, defaultDuration: 3, sourceTitle: "DailyMed — Azithromycin suspension", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=5c756d25-d561-4cd2-9da3-89aacc72a154" },
      { id: "pharyngitis-5d", label: "Faringite / amigdalite · 12 mg/kg/dia", population: "Pediátrica", ageLabel: "≥2 anos", basis: "dose", doseMin: 12, unit: "mg", intervalHours: 24, maxDose: 500, route: "VO", durationMin: 5, durationMax: 5, defaultDuration: 5, sourceTitle: "DailyMed — Azithromycin suspension", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=5c756d25-d561-4cd2-9da3-89aacc72a154" },
    ],
  },
  {
    id: "clindamycin-oral",
    name: "Clindamicina",
    group: "Outros",
    className: "Lincosamida",
    summary: "Faixas da solução pediátrica divididas em três administrações ao dia.",
    formulations: [{ id: "75-5", label: "75 mg/5 mL", concentrationMgMl: 15 }],
    warning: "Reavaliar imediatamente se ocorrer diarreia importante; revisar indicação e risco de colite associada a antibióticos.",
    rules: [
      { id: "serious", label: "Infecção séria", population: "Pediátrica", ageLabel: "Conforme bula e avaliação clínica", basis: "day", doseMin: 8, doseMax: 12, unit: "mg", intervalHours: 8, maxDaily: 1800, route: "VO", durationGuidance: "Informe a duração definida para o foco tratado e o protocolo local; a faixa de dose da bula não determina uma duração única.", sourceTitle: "DailyMed — Clindamycin pediatric solution", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=a85e28ea-03be-471f-ad7f-f5c55c67ac97" },
      { id: "more-severe", label: "Infecção mais grave", population: "Pediátrica", ageLabel: "Conforme bula e avaliação clínica", basis: "day", doseMin: 17, doseMax: 25, unit: "mg", intervalHours: 8, maxDaily: 1800, route: "VO", durationGuidance: "Informe a duração definida para o foco tratado e o protocolo local; a faixa de dose da bula não determina uma duração única.", sourceTitle: "DailyMed — Clindamycin pediatric solution", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=a85e28ea-03be-471f-ad7f-f5c55c67ac97" },
    ],
  },
  {
    id: "tmp-smx-oral",
    name: "Sulfametoxazol + trimetoprima",
    group: "Outros",
    className: "Sulfonamida + inibidor de folato",
    summary: "Cálculo baseado exclusivamente no componente trimetoprima.",
    formulations: [{ id: "200-40-5", label: "200 mg SMX + 40 mg TMP/5 mL", concentrationMgMl: 8 }],
    warning: "Contraindicado abaixo de 2 meses na bula consultada. Confirmar função renal, alergia a sulfonamidas e interações.",
    rules: [
      { id: "uti-aom", label: "ITU ou otite média", population: "Pediátrica", ageLabel: "≥2 meses", basis: "day", doseMin: 8, unit: "mg", intervalHours: 12, maxDaily: 320, route: "VO", durationMin: 10, durationMax: 10, defaultDuration: 10, doseComponent: "trimetoprima", sourceTitle: "DailyMed — Sulfamethoxazole/trimethoprim", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=fea44910-400c-4688-bedc-bbb1615cd8f5" },
      { id: "shigellosis", label: "Shigelose", population: "Pediátrica", ageLabel: "≥2 meses", basis: "day", doseMin: 8, unit: "mg", intervalHours: 12, maxDaily: 320, route: "VO", durationMin: 5, durationMax: 5, defaultDuration: 5, doseComponent: "trimetoprima", sourceTitle: "DailyMed — Sulfamethoxazole/trimethoprim", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=fea44910-400c-4688-bedc-bbb1615cd8f5" },
    ],
  },
  {
    id: "nitrofurantoin-oral",
    name: "Nitrofurantoína",
    group: "Outros",
    className: "Nitrofurano",
    summary: "Faixa pediátrica em quatro administrações diárias para infecção urinária baixa selecionada.",
    formulations: [{ id: "25-5", label: "25 mg/5 mL", concentrationMgMl: 5 }],
    warning: "Não é opção para pielonefrite. Contraindicada abaixo de 1 mês; administrar com alimento e conferir função renal.",
    rules: [
      { id: "uti", label: "Infecção urinária baixa", population: "Pediátrica", ageLabel: "≥1 mês", basis: "day", doseMin: 5, doseMax: 7, unit: "mg", intervalHours: 6, maxDaily: 400, route: "VO", durationMin: 7, durationMax: 10, defaultDuration: 7, sourceTitle: "DailyMed — Nitrofurantoin suspension", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=04af8b73-7e15-7da8-e063-6294a90af284&type=display" },
    ],
  },
  {
    id: "ciprofloxacin-oral",
    name: "Ciprofloxacino VO",
    group: "Outros",
    className: "Fluoroquinolona",
    summary: "Uso pediátrico oral restrito à indicação selecionada na bula; não é antibiótico domiciliar de rotina.",
    formulations: [
      { id: "250-5", label: "250 mg/5 mL", concentrationMgMl: 50 },
      { id: "500-5", label: "500 mg/5 mL", concentrationMgMl: 100 },
    ],
    warning: "Uso pediátrico restrito. A escolha exige cultura, susceptibilidade e avaliação individual de riscos e alternativas.",
    rules: [
      { id: "cuti-pyelo", label: "ITU complicada / pielonefrite da bula", population: "Pediátrica", ageLabel: "1–17 anos", basis: "dose", doseMin: 10, doseMax: 20, unit: "mg", intervalHours: 12, maxDose: 750, route: "VO", durationMin: 10, durationMax: 21, defaultDuration: 10, sourceTitle: "DailyMed — Ciprofloxacin", sourceUrl: "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=905503ef-4277-44ca-aa4a-5a969a041e16" },
    ],
  },
];
