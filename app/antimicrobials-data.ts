export type AntimicrobialGroup =
  | "Betalactâmicos"
  | "Aminoglicosídeos"
  | "Outros antibióticos"
  | "Antifúngicos"
  | "Antiviral";

export type AntimicrobialRule = {
  id: string;
  label: string;
  population: string;
  basis: "dose" | "day";
  doseMin?: number;
  doseMax?: number;
  fixedDoseMin?: number;
  fixedDoseMax?: number;
  unit: "mg" | "UI";
  intervalHours?: number;
  intervalLabel?: string;
  once?: boolean;
  maxDose?: number;
  maxDaily?: number;
  route: string;
  note?: string;
};

export type AccessProfile = {
  label: string;
  targetConcentration: number;
  diluent: "SF 0,9%" | "SG 5%" | "SF 0,9% OU SG 5%" | "SEM REDILUIÇÃO";
  concentrationKind: "ideal" | "maximum" | "direct";
  diluentMultiple?: number;
};

export type IvPreparationProfile = {
  kind: "powder" | "solution";
  vialAmount?: number;
  reconstitutionVolume?: number;
  stockConcentration?: number;
  reconstitutionDiluent?: string;
  peripheral: AccessProfile;
  central?: AccessProfile;
  infusionMin: number;
  infusionMax: number;
  verificationRequired?: boolean;
  verificationText?: string;
};

export type ImPreparationProfile = {
  concentration?: number;
  preparation: string;
};

export type Antimicrobial = {
  id: string;
  name: string;
  group: AntimicrobialGroup;
  className: string;
  routes: string;
  page: 1 | 2;
  summary: string;
  presentation: string;
  reconstitution: string;
  peripheral: string;
  central: string;
  infusion: string;
  observations: string;
  critical?: string;
  iv: IvPreparationProfile;
  im?: ImPreparationProfile;
  rules: AntimicrobialRule[];
};

export const ANTIMICROBIAL_GROUPS: AntimicrobialGroup[] = [
  "Betalactâmicos",
  "Aminoglicosídeos",
  "Outros antibióticos",
  "Antifúngicos",
  "Antiviral",
];

const ivPowder = (
  vialAmount: number,
  reconstitutionVolume: number,
  peripheral: AccessProfile,
  infusionMin: number,
  infusionMax = infusionMin,
  central?: AccessProfile,
  verification?: string,
): IvPreparationProfile => ({
  kind: "powder",
  vialAmount,
  reconstitutionVolume,
  reconstitutionDiluent: "ÁGUA BIDESTILADA",
  peripheral,
  central,
  infusionMin,
  infusionMax,
  verificationRequired: Boolean(verification),
  verificationText: verification,
});

const ivSolution = (
  stockConcentration: number,
  peripheral: AccessProfile,
  infusionMin: number,
  infusionMax = infusionMin,
  central?: AccessProfile,
  verification?: string,
): IvPreparationProfile => ({
  kind: "solution",
  stockConcentration,
  peripheral,
  central,
  infusionMin,
  infusionMax,
  verificationRequired: Boolean(verification),
  verificationText: verification,
});

const direct = (targetConcentration: number): AccessProfile => ({
  label: "Sem rediluição",
  targetConcentration,
  diluent: "SEM REDILUIÇÃO",
  concentrationKind: "direct",
});

const peripheral = (targetConcentration: number, diluent: AccessProfile["diluent"] = "SF 0,9% OU SG 5%", label = "Acesso venoso periférico"): AccessProfile => ({
  label,
  targetConcentration,
  diluent,
  concentrationKind: "ideal",
});

const central = (targetConcentration: number, diluent: AccessProfile["diluent"] = "SF 0,9% OU SG 5%", label = "Acesso venoso central"): AccessProfile => ({
  label,
  targetConcentration,
  diluent,
  concentrationKind: "maximum",
});

const diluted = (profile: AccessProfile, diluentMultiple: number): AccessProfile => ({ ...profile, diluentMultiple });

export const ANTIMICROBIALS: Antimicrobial[] = [
  {
    id: "cephalothin-hospital",
    name: "Cefalotina",
    group: "Betalactâmicos",
    className: "Cefalosporina de 1ª geração",
    routes: "IV",
    page: 1,
    summary: "Preparo intravenoso direto após reconstituição, conforme o referencial de diluição hospitalar.",
    presentation: "Frasco-ampola de 1 g.",
    reconstitution: "1 g em 10 mL de água bidestilada; concentração resultante de 100 mg/mL.",
    peripheral: "Sem rediluição; usar a concentração reconstituída de 100 mg/mL.",
    central: "O quadro não diferencia o preparo por acesso.",
    infusion: "Administração lenta em 3–5 minutos.",
    observations: "Dose total diária do quadro, fracionada de 6/6 h.",
    iv: ivPowder(1000, 10, direct(100), 3, 5),
    rules: [{ id: "standard", label: "Esquema hospitalar", population: "Pediátrica", basis: "day", doseMin: 100, unit: "mg", intervalHours: 6, maxDaily: 12000, route: "IV" }],
  },
  {
    id: "ampicillin-hospital",
    name: "Ampicilina",
    group: "Betalactâmicos",
    className: "Aminopenicilina",
    routes: "IV / IM",
    page: 1,
    summary: "Faixa geral e linha de 200 mg/kg/dia para as situações destacadas no guia.",
    presentation: "Frasco-ampola de 1 g.",
    reconstitution: "IV: 1 g em 10 mL de água bidestilada, resultando em 100 mg/mL. IM: 1 g em 4 mL.",
    peripheral: "Sem rediluição na via IV.",
    central: "O quadro não diferencia o preparo por acesso.",
    infusion: "Administração IV lenta em 3–5 minutos.",
    observations: "O guia destaca 200 mg/kg/dia para meningite, endocardite e derrame pleural.",
    iv: ivPowder(1000, 10, direct(100), 3, 5),
    im: { concentration: 250, preparation: "Reconstituir o frasco de 1 g com 4 mL de água bidestilada." },
    rules: [
      { id: "standard", label: "Faixa geral", population: "Pediátrica", basis: "day", doseMin: 150, doseMax: 200, unit: "mg", intervalHours: 6, maxDaily: 12000, route: "IV / IM" },
      { id: "high", label: "Meningite / endocardite / derrame pleural", population: "Situação destacada no guia", basis: "day", doseMin: 200, unit: "mg", intervalHours: 6, maxDaily: 12000, route: "IV / IM" },
    ],
  },
  {
    id: "ceftriaxone-hospital",
    name: "Ceftriaxona",
    group: "Betalactâmicos",
    className: "Cefalosporina de 3ª geração",
    routes: "IV / IM",
    page: 1,
    summary: "Concentrações-alvo distintas para acesso periférico e central.",
    presentation: "Frasco-ampola de 1 g.",
    reconstitution: "1 g em 10 mL de água bidestilada; 100 mg/mL.",
    peripheral: "Rediluir em SF 0,9% ou SG 5% até aproximadamente 20 mg/mL.",
    central: "Limite indicado de 40 mg/mL em SF 0,9% ou SG 5%.",
    infusion: "30 minutos.",
    observations: "Para IM, o quadro cita 2–4 mL de água bidestilada ou 3,5 mL de lidocaína 1%; conferir apresentação e protocolo.",
    iv: ivPowder(1000, 10, diluted(peripheral(20), 4), 30, 30, diluted(central(40), 1.5)),
    im: { preparation: "O guia oferece mais de um volume de reconstituição IM; informe a concentração final validada pela farmácia." },
    rules: [{ id: "standard", label: "Faixa hospitalar", population: "Pediátrica", basis: "day", doseMin: 50, doseMax: 100, unit: "mg", intervalHours: 12, maxDaily: 4000, route: "IV / IM" }],
  },
  {
    id: "oxacillin-hospital",
    name: "Oxacilina",
    group: "Betalactâmicos",
    className: "Penicilina resistente a penicilinase",
    routes: "IV / IM",
    page: 1,
    summary: "Reconstituição a 100 mg/mL, seguida de rediluição intravenosa.",
    presentation: "Frasco-ampola de 500 mg.",
    reconstitution: "500 mg em 5 mL de água bidestilada; 100 mg/mL.",
    peripheral: "Adicionar quatro volumes de SF 0,9% ou SG 5% para cada volume aspirado; concentração final aproximada de 20 mg/mL.",
    central: "O quadro não diferencia o preparo por acesso.",
    infusion: "30 minutos.",
    observations: "Para IM, o quadro indica reconstituição com 3 mL de água bidestilada.",
    iv: ivPowder(500, 5, diluted(peripheral(20), 4), 30),
    im: { concentration: 166.6667, preparation: "Reconstituir o frasco de 500 mg com 3 mL de água bidestilada." },
    rules: [{ id: "standard", label: "Esquema hospitalar", population: "Pediátrica", basis: "day", doseMin: 200, unit: "mg", intervalHours: 4, maxDaily: 12000, route: "IV / IM" }],
  },
  {
    id: "clindamycin-hospital",
    name: "Clindamicina",
    group: "Outros antibióticos",
    className: "Lincosamida",
    routes: "IV / IM",
    page: 1,
    summary: "Solução injetável rediluída para concentração intravenosa máxima de 6 mg/mL.",
    presentation: "Ampola de 150 mg/mL, com 4 ou 6 mL.",
    reconstitution: "Não requer reconstituição.",
    peripheral: "Rediluir em SF 0,9% ou SG 5% até 6 mg/mL.",
    central: "O quadro não diferencia o preparo por acesso.",
    infusion: "30 minutos.",
    observations: "Para IM, usar a solução sem diluição e respeitar o volume máximo por músculo.",
    iv: ivSolution(150, diluted(peripheral(6), 25), 30),
    im: { concentration: 150, preparation: "Usar a apresentação de 150 mg/mL sem diluição." },
    rules: [{ id: "standard", label: "Esquema hospitalar", population: "Pediátrica", basis: "day", doseMin: 30, unit: "mg", intervalHours: 8, maxDaily: 1800, route: "IV / IM" }],
  },
  {
    id: "cefepime-hospital",
    name: "Cefepime",
    group: "Betalactâmicos",
    className: "Cefalosporina de 4ª geração",
    routes: "IV / IM",
    page: 1,
    summary: "Preparo intravenoso calculado pelo limite de concentração informado no quadro.",
    presentation: "Frasco-ampola de 1 g.",
    reconstitution: "1 g em 10 mL de água bidestilada; 100 mg/mL.",
    peripheral: "Rediluir em SF 0,9% ou SG 5% sem ultrapassar 30 mg/mL.",
    central: "O quadro não diferencia o preparo por acesso.",
    infusion: "60 minutos.",
    observations: "A rediluição de 2,5 volumes resulta em concentração próxima e inferior ao limite de 30 mg/mL. Para IM, confirmar o volume final após usar 2–3 mL de água bidestilada.",
    iv: ivPowder(1000, 10, diluted({ ...central(30), label: "Via intravenosa" }, 2.5), 60),
    im: { preparation: "O guia oferece uma faixa de 2–3 mL para reconstituição IM; informe a concentração final validada." },
    rules: [{ id: "standard", label: "Esquema hospitalar", population: "Pediátrica", basis: "day", doseMin: 150, unit: "mg", intervalHours: 8, maxDaily: 6000, route: "IV / IM" }],
  },
  {
    id: "gentamicin-hospital",
    name: "Gentamicina",
    group: "Aminoglicosídeos",
    className: "Aminoglicosídeo",
    routes: "IV / IM",
    page: 1,
    summary: "Ampola de 40 mg/mL, rediluída para até 10 mg/mL na via IV.",
    presentation: "Ampola de 40 mg/mL, com 1 ou 2 mL.",
    reconstitution: "Não requer reconstituição.",
    peripheral: "Rediluir em SF 0,9% ou SG 5% até 10 mg/mL.",
    central: "O quadro não diferencia o preparo por acesso.",
    infusion: "60 minutos.",
    observations: "Para IM, usar sem diluição e respeitar o volume máximo por músculo.",
    iv: ivSolution(40, diluted({ ...central(10), label: "Via intravenosa" }, 3), 60),
    im: { concentration: 40, preparation: "Usar a apresentação de 40 mg/mL sem diluição." },
    rules: [{ id: "standard", label: "Esquema hospitalar", population: "Pediátrica", basis: "day", doseMin: 5, unit: "mg", intervalHours: 24, maxDaily: 240, route: "IV / IM" }],
  },
  {
    id: "piperacillin-tazobactam-4g-hospital",
    name: "Piperacilina/tazobactam 4 g",
    group: "Betalactâmicos",
    className: "Penicilina antipseudomonas + inibidor",
    routes: "IV",
    page: 1,
    summary: "Apresentação de 4 g, com alvo de 20 mg/mL em acesso periférico e limite de 80 mg/mL em central.",
    presentation: "Frasco-ampola identificado no guia como 4 g.",
    reconstitution: "4 g em 20 mL de água bidestilada; 200 mg/mL.",
    peripheral: "Rediluir em SF 0,9% ou SG 5% até cerca de 20 mg/mL.",
    central: "Limite indicado de 80 mg/mL.",
    infusion: "1–3 horas.",
    observations: "O guia oferece fracionamento de 8/8 h ou 6/6 h; selecione explicitamente.",
    iv: ivPowder(4000, 20, diluted(peripheral(20), 10), 60, 180, diluted(central(80), 1.5)),
    rules: [
      { id: "q8h", label: "300 mg/kg/dia · 8/8 h", population: "Pediátrica", basis: "day", doseMin: 300, unit: "mg", intervalHours: 8, maxDaily: 16000, route: "IV" },
      { id: "q6h", label: "300 mg/kg/dia · 6/6 h", population: "Pediátrica", basis: "day", doseMin: 300, unit: "mg", intervalHours: 6, maxDaily: 16000, route: "IV" },
    ],
  },
  {
    id: "piperacillin-tazobactam-2g-hospital",
    name: "Piperacilina/tazobactam 2 g",
    group: "Betalactâmicos",
    className: "Penicilina antipseudomonas + inibidor",
    routes: "IV",
    page: 1,
    summary: "Mesmas concentrações-alvo do quadro, usando o frasco de 2 g.",
    presentation: "Frasco-ampola identificado no guia como 2 g.",
    reconstitution: "2 g em 10 mL de água bidestilada; 200 mg/mL.",
    peripheral: "Rediluir em SF 0,9% ou SG 5% até cerca de 20 mg/mL.",
    central: "Limite indicado de 80 mg/mL.",
    infusion: "1–3 horas.",
    observations: "O guia oferece fracionamento de 8/8 h ou 6/6 h; selecione explicitamente.",
    iv: ivPowder(2000, 10, diluted(peripheral(20), 10), 60, 180, diluted(central(80), 1.5)),
    rules: [
      { id: "q8h", label: "300 mg/kg/dia · 8/8 h", population: "Pediátrica", basis: "day", doseMin: 300, unit: "mg", intervalHours: 8, maxDaily: 16000, route: "IV" },
      { id: "q6h", label: "300 mg/kg/dia · 6/6 h", population: "Pediátrica", basis: "day", doseMin: 300, unit: "mg", intervalHours: 6, maxDaily: 16000, route: "IV" },
    ],
  },
  {
    id: "meropenem-hospital",
    name: "Meropenem",
    group: "Betalactâmicos",
    className: "Carbapenêmico",
    routes: "IV",
    page: 1,
    summary: "Faixa diária de 90–120 mg/kg, com preparo diferente conforme o acesso.",
    presentation: "Frasco-ampola de 1 g.",
    reconstitution: "1 g em 20 mL de água bidestilada; 50 mg/mL.",
    peripheral: "Rediluir em SF 0,9% ou SG 5% até aproximadamente 20 mg/mL.",
    central: "Pode permanecer a 50 mg/mL, sem rediluição adicional.",
    infusion: "1–3 horas.",
    observations: "A dose escolhida deve permanecer dentro da faixa calculada e do teto diário.",
    iv: ivPowder(1000, 20, diluted(peripheral(20), 1.5), 60, 180, { ...direct(50), label: "Acesso venoso central" }),
    rules: [{ id: "standard", label: "Faixa hospitalar", population: "Pediátrica", basis: "day", doseMin: 90, doseMax: 120, unit: "mg", intervalHours: 8, maxDaily: 3000, route: "IV" }],
  },
  {
    id: "vancomycin-hospital",
    name: "Vancomicina",
    group: "Outros antibióticos",
    className: "Glicopeptídeo",
    routes: "IV",
    page: 1,
    summary: "Faixa de 40–60 mg/kg/dia, com concentração menor no acesso periférico.",
    presentation: "Frasco-ampola de 500 mg.",
    reconstitution: "500 mg em 5 mL de água bidestilada; 100 mg/mL.",
    peripheral: "Rediluir em SF 0,9% ou SG 5% até cerca de 5 mg/mL.",
    central: "Limite indicado de 10 mg/mL.",
    infusion: "60–120 minutos.",
    observations: "O cálculo de preparo não substitui monitorização farmacocinética e ajuste individual.",
    iv: ivPowder(500, 5, diluted(peripheral(5), 20), 60, 120, diluted(central(10), 10)),
    rules: [{ id: "standard", label: "Faixa hospitalar", population: "Pediátrica", basis: "day", doseMin: 40, doseMax: 60, unit: "mg", intervalHours: 6, maxDaily: 4000, route: "IV" }],
  },
  {
    id: "amikacin-250-hospital",
    name: "Amicacina 250 mg/mL",
    group: "Aminoglicosídeos",
    className: "Aminoglicosídeo",
    routes: "IV / IM",
    page: 1,
    summary: "Perfil específico para a ampola mais concentrada listada no guia.",
    presentation: "Ampola de 250 mg/mL, 2 mL.",
    reconstitution: "Não requer reconstituição.",
    peripheral: "Rediluir em SF 0,9% ou SG 5% até cerca de 5 mg/mL.",
    central: "Limite indicado de 10 mg/mL.",
    infusion: "60 minutos.",
    observations: "Para IM, usar sem diluição e respeitar o volume máximo por músculo.",
    iv: ivSolution(250, diluted(peripheral(5), 50), 60, 60, diluted(central(10), 25)),
    im: { concentration: 250, preparation: "Usar a apresentação de 250 mg/mL sem diluição." },
    rules: [{ id: "standard", label: "Esquema hospitalar", population: "Pediátrica", basis: "day", doseMin: 15, unit: "mg", intervalHours: 24, maxDaily: 1000, route: "IV / IM" }],
  },
  {
    id: "amikacin-50-hospital",
    name: "Amicacina 50 mg/mL",
    group: "Aminoglicosídeos",
    className: "Aminoglicosídeo",
    routes: "IV / IM",
    page: 1,
    summary: "Perfil específico para a ampola de 50 mg/mL listada no guia.",
    presentation: "Ampola de 50 mg/mL, 2 mL.",
    reconstitution: "Não requer reconstituição.",
    peripheral: "Rediluir em SF 0,9% ou SG 5% até cerca de 5 mg/mL.",
    central: "Limite indicado de 10 mg/mL.",
    infusion: "60 minutos.",
    observations: "Para IM, usar sem diluição e respeitar o volume máximo por músculo.",
    iv: ivSolution(50, diluted(peripheral(5), 10), 60, 60, diluted(central(10), 5)),
    im: { concentration: 50, preparation: "Usar a apresentação de 50 mg/mL sem diluição." },
    rules: [{ id: "standard", label: "Esquema hospitalar", population: "Pediátrica", basis: "day", doseMin: 15, unit: "mg", intervalHours: 24, maxDaily: 1000, route: "IV / IM" }],
  },
  {
    id: "ciprofloxacin-hospital",
    name: "Ciprofloxacino",
    group: "Outros antibióticos",
    className: "Fluoroquinolona",
    routes: "IV / VO*",
    page: 2,
    summary: "Solução pronta a 2 mg/mL, sem rediluição.",
    presentation: "Bolsa de 100 mL, 2 mg/mL.",
    reconstitution: "Não se aplica.",
    peripheral: "Usar a solução pronta, sem rediluição.",
    central: "O quadro não diferencia o preparo por acesso.",
    infusion: "60 minutos.",
    observations: "As apresentações em bolsa não devem ser rediluídas. *O esquema oral pediátrico oficial está disponível separadamente na aba Domiciliares.",
    iv: ivSolution(2, direct(2), 60),
    rules: [{ id: "standard", label: "Faixa hospitalar", population: "Pediátrica", basis: "day", doseMin: 20, doseMax: 30, unit: "mg", intervalHours: 12, maxDaily: 1200, route: "IV" }],
  },
  {
    id: "linezolid-hospital",
    name: "Linezolida",
    group: "Outros antibióticos",
    className: "Oxazolidinona",
    routes: "IV",
    page: 2,
    summary: "Solução pronta a 2 mg/mL; a apresentação impressa no PDF exige conferência.",
    presentation: "Solução de 2 mg/mL; o PDF recebido descreve bolsa de 600 mL.",
    reconstitution: "Não se aplica.",
    peripheral: "Usar a solução pronta, sem rediluição.",
    central: "O quadro não diferencia o preparo por acesso.",
    infusion: "60–120 minutos.",
    observations: "As apresentações em bolsa não devem ser rediluídas.",
    critical: "Confirme o volume real da bolsa: o valor de 600 mL impresso no PDF é incomum e pode ser erro de digitação.",
    iv: ivSolution(2, direct(2), 60, 120, undefined, "Confirmei no rótulo que a solução disponível contém 2 mg/mL; o volume da bolsa foi conferido separadamente."),
    rules: [{ id: "standard", label: "Esquema pediátrico do quadro", population: "Pediátrica", basis: "day", doseMin: 30, unit: "mg", intervalHours: 8, maxDaily: 1800, route: "IV" }],
  },
  {
    id: "polymyxin-b-hospital",
    name: "Polimixina B",
    group: "Outros antibióticos",
    className: "Polimixina",
    routes: "IV",
    page: 2,
    summary: "Dose em unidades internacionais, com valores de concentração que precisam de validação institucional.",
    presentation: "Frasco-ampola de 500.000 UI.",
    reconstitution: "500.000 UI em 5 mL de água bidestilada; 100.000 UI/mL.",
    peripheral: "O quadro imprime concentração ideal de 1.667 UI/mL em SF 0,9% ou SG 5%.",
    central: "O quadro imprime limite de 1.000 UI/mL em SF 0,9% ou SG 5%.",
    infusion: "60–120 minutos.",
    observations: "Os multiplicadores e as concentrações impressas no documento não são coerentes entre si.",
    critical: "Há inconsistência interna entre acesso periférico, central, multiplicadores e concentrações. O sistema usa as concentrações numéricas impressas e bloqueia a cópia até confirmação explícita.",
    iv: ivPowder(500000, 5, peripheral(1667), 60, 120, central(1000), "Confirmei com a farmácia/CCIH as concentrações de Polimixina B antes de liberar esta prescrição."),
    rules: [{ id: "standard", label: "Esquema hospitalar", population: "Pediátrica", basis: "day", doseMin: 25000, unit: "UI", intervalHours: 12, maxDaily: 2000000, route: "IV" }],
  },
  {
    id: "metronidazole-hospital",
    name: "Metronidazol",
    group: "Outros antibióticos",
    className: "Nitroimidazólico",
    routes: "IV",
    page: 2,
    summary: "Solução pronta a 5 mg/mL, sem rediluição.",
    presentation: "Bolsa de 100 mL, 5 mg/mL.",
    reconstitution: "Não se aplica.",
    peripheral: "Usar a solução pronta, sem rediluição.",
    central: "O quadro não diferencia o preparo por acesso.",
    infusion: "60–120 minutos.",
    observations: "As apresentações em bolsa não devem ser rediluídas.",
    iv: ivSolution(5, direct(5), 60, 120),
    rules: [{ id: "standard", label: "Esquema hospitalar", population: "Pediátrica", basis: "day", doseMin: 30, unit: "mg", intervalHours: 8, maxDaily: 4000, route: "IV" }],
  },
  {
    id: "fluconazole-hospital",
    name: "Fluconazol",
    group: "Antifúngicos",
    className: "Triazólico",
    routes: "IV",
    page: 2,
    summary: "Solução pronta a 2 mg/mL, sem rediluição.",
    presentation: "Bolsa de 100 mL, 2 mg/mL.",
    reconstitution: "Não se aplica.",
    peripheral: "Usar a solução pronta, sem rediluição.",
    central: "O quadro não diferencia o preparo por acesso.",
    infusion: "60–120 minutos.",
    observations: "As apresentações em bolsa não devem ser rediluídas.",
    iv: ivSolution(2, direct(2), 60, 120),
    rules: [{ id: "standard", label: "Faixa hospitalar", population: "Pediátrica", basis: "day", doseMin: 6, doseMax: 12, unit: "mg", intervalHours: 24, maxDaily: 800, route: "IV" }],
  },
  {
    id: "micafungin-hospital",
    name: "Micafungina",
    group: "Antifúngicos",
    className: "Equinocandina",
    routes: "IV",
    page: 2,
    summary: "Concentração-alvo baseada nos valores explícitos do referencial hospitalar.",
    presentation: "Frasco-ampola de 100 mg.",
    reconstitution: "100 mg em 10 mL de água bidestilada; 10 mg/mL.",
    peripheral: "Concentração indicada de 2 mg/mL em SF 0,9% ou SG 5%.",
    central: "Limite indicado de 4 mg/mL.",
    infusion: "60 minutos.",
    observations: "Os multiplicadores impressos não correspondem às concentrações resultantes.",
    critical: "O sistema usa 2 mg/mL para acesso periférico e 4 mg/mL para central, mas exige conferência porque os multiplicadores do PDF divergem desses valores.",
    iv: ivPowder(100, 10, peripheral(2), 60, 60, central(4), "Confirmei com a farmácia/protocolo local as concentrações de 2 mg/mL (AVP) ou 4 mg/mL (AVC)."),
    rules: [{ id: "standard", label: "Faixa hospitalar", population: "Pediátrica", basis: "day", doseMin: 2, doseMax: 4, unit: "mg", intervalHours: 24, maxDaily: 100, route: "IV" }],
  },
  {
    id: "amphotericin-b-hospital",
    name: "Anfotericina B convencional",
    group: "Antifúngicos",
    className: "Polieno",
    routes: "IV",
    page: 2,
    summary: "Formulação convencional com diluição exclusiva em glicose 5%.",
    presentation: "Frasco-ampola de 50 mg.",
    reconstitution: "50 mg em 10 mL de água bidestilada; 5 mg/mL.",
    peripheral: "Diluir somente em SG 5% até cerca de 0,1 mg/mL.",
    central: "Limite indicado de 0,25 mg/mL, somente em SG 5%.",
    infusion: "4–6 horas.",
    observations: "Não diluir com solução fisiológica. Confirmar que se trata da formulação convencional.",
    critical: "Formulações de anfotericina B não são intercambiáveis. Este perfil corresponde apenas à convencional descrita no material hospitalar.",
    iv: ivPowder(50, 10, diluted(peripheral(0.1, "SG 5%"), 50), 240, 360, diluted(central(0.25, "SG 5%"), 20)),
    rules: [{ id: "standard", label: "Formulação convencional do guia", population: "Pediátrica", basis: "day", doseMin: 1, unit: "mg", intervalHours: 24, maxDaily: 50, route: "IV" }],
  },
  {
    id: "acyclovir-hospital",
    name: "Aciclovir",
    group: "Antiviral",
    className: "Análogo de nucleosídeo",
    routes: "IV",
    page: 2,
    summary: "Faixa diária de 30–45 mg/kg, com concentração ajustada ao acesso.",
    presentation: "Frasco-ampola de 250 mg.",
    reconstitution: "250 mg em 10 mL de água bidestilada; 25 mg/mL.",
    peripheral: "Rediluir em SF 0,9% ou SG 5% até aproximadamente 5 mg/mL.",
    central: "Limite indicado de 7 mg/mL.",
    infusion: "60 minutos.",
    observations: "Revisar função renal e hidratação conforme protocolo clínico antes da prescrição.",
    iv: ivPowder(250, 10, diluted(peripheral(5), 5), 60, 60, diluted(central(7), 3.5)),
    rules: [{ id: "standard", label: "Faixa hospitalar", population: "Pediátrica", basis: "day", doseMin: 30, doseMax: 45, unit: "mg", intervalHours: 8, maxDaily: 1200, route: "IV" }],
  },
];
