export type ScoreOption = { label: string; score: number; note?: string };
export type ScoreQuestion = { id: string; title: string; hint?: string; options: ScoreOption[] };
export type ScoreBand = { max: number; label: string; detail: string; tone: "low" | "mid" | "high" | "neutral" };
export type ScoreDefinition = {
  id: string;
  name: string;
  short: string;
  category: string;
  summary: string;
  max: number;
  questions: ScoreQuestion[];
  bands: ScoreBand[];
  sourceUrl?: string;
  sourceLabel?: string;
  caveat?: string;
};

const noYes = (points = 1): ScoreOption[] => [
  { label: "Não", score: 0 },
  { label: "Sim", score: points },
];

const neverToAlways = (reversed = false): ScoreOption[] =>
  ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"].map((label, index) => ({
    label,
    score: reversed ? 4 - index : index,
  }));

export const SCORE_DEFINITIONS: ScoreDefinition[] = [
  {
    id: "pram",
    name: "PRAM",
    short: "0–12",
    category: "Respiratório",
    summary: "Gravidade da exacerbação asmática em crianças de 2 a 17 anos.",
    max: 12,
    questions: [
      { id: "spo2", title: "Saturação em ar ambiente", options: [{ label: "≥ 95%", score: 0 }, { label: "92–94%", score: 1 }, { label: "< 92%", score: 2 }] },
      { id: "suprasternal", title: "Retração supraesternal", options: noYes(2) },
      { id: "scalene", title: "Uso de musculatura escalena", options: noYes(2) },
      { id: "air", title: "Entrada de ar", options: [{ label: "Preservada", score: 0 }, { label: "Reduzida nas bases", score: 1 }, { label: "Reduzida difusamente", score: 2 }, { label: "Mínima ou ausente", score: 3 }] },
      { id: "wheeze", title: "Sibilância", options: [{ label: "Ausente", score: 0 }, { label: "Somente expiratória", score: 1 }, { label: "Inspiratória e/ou expiratória", score: 2 }, { label: "Audível sem estetoscópio ou tórax silencioso", score: 3 }] },
    ],
    bands: [
      { max: 3, label: "Leve", detail: "Escore baixo; correlacione com resposta ao tratamento e história clínica.", tone: "low" },
      { max: 7, label: "Moderada", detail: "Exacerbação intermediária; requer reavaliação clínica seriada.", tone: "mid" },
      { max: 12, label: "Grave", detail: "Alta gravidade; avaliação e tratamento imediatos conforme protocolo.", tone: "high" },
    ],
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/15995041/",
    sourceLabel: "Validação do PRAM",
  },
  {
    id: "wood-downes",
    name: "Wood–Downes modificado",
    short: "0–12",
    category: "Respiratório",
    summary: "Avaliação clínica do desconforto respiratório e broncoespasmo.",
    max: 12,
    questions: [
      { id: "wheeze", title: "Sibilância", options: [{ label: "Ausente", score: 0 }, { label: "Moderada", score: 1 }, { label: "Intensa", score: 2 }] },
      { id: "retractions", title: "Tiragem / musculatura acessória", options: [{ label: "Ausente", score: 0 }, { label: "Moderada", score: 1 }, { label: "Máxima", score: 2 }] },
      { id: "rr", title: "Frequência respiratória para a idade", options: [{ label: "Na faixa esperada", score: 0 }, { label: "Elevada", score: 1 }, { label: "Muito elevada", score: 2 }] },
      { id: "hr", title: "Frequência cardíaca para a idade", options: [{ label: "Na faixa esperada", score: 0 }, { label: "Elevada", score: 1 }, { label: "Muito elevada", score: 2 }] },
      { id: "air", title: "Ventilação / entrada de ar", options: [{ label: "Preservada", score: 0 }, { label: "Diminuída", score: 1 }, { label: "Murmúrio ausente", score: 2 }] },
      { id: "cyanosis", title: "Cianose", options: [{ label: "Ausente", score: 0 }, { label: "Presente apesar de oxigênio", score: 1 }, { label: "Presente em ar ambiente", score: 2 }] },
    ],
    bands: [
      { max: 3, label: "Leve", detail: "Poucos sinais de gravidade no instrumento.", tone: "low" },
      { max: 7, label: "Moderado", detail: "Monitorar evolução e resposta terapêutica.", tone: "mid" },
      { max: 12, label: "Grave", detail: "Desconforto importante; priorize avaliação imediata.", tone: "high" },
    ],
    caveat: "Há diferentes versões publicadas. Use a versão adotada pelo seu serviço para seguimento seriado.",
  },
  {
    id: "silverman",
    name: "Silverman–Andersen",
    short: "0–10",
    category: "Respiratório",
    summary: "Quantificação do desconforto respiratório no recém-nascido.",
    max: 10,
    questions: [
      { id: "chest", title: "Sincronia toracoabdominal", options: [{ label: "Movimento sincronizado", score: 0 }, { label: "Atraso discreto do tórax", score: 1 }, { label: "Movimento paradoxal", score: 2 }] },
      { id: "intercostal", title: "Retração intercostal", options: [{ label: "Ausente", score: 0 }, { label: "Discreta", score: 1 }, { label: "Acentuada", score: 2 }] },
      { id: "xiphoid", title: "Retração xifoide", options: [{ label: "Ausente", score: 0 }, { label: "Discreta", score: 1 }, { label: "Acentuada", score: 2 }] },
      { id: "nasal", title: "Batimento de asa nasal", options: [{ label: "Ausente", score: 0 }, { label: "Discreto", score: 1 }, { label: "Acentuado", score: 2 }] },
      { id: "grunt", title: "Gemido expiratório", options: [{ label: "Ausente", score: 0 }, { label: "Audível ao estetoscópio", score: 1 }, { label: "Audível sem estetoscópio", score: 2 }] },
    ],
    bands: [
      { max: 0, label: "Sem desconforto pelo escore", detail: "Mantenha avaliação clínica e monitorização indicadas.", tone: "low" },
      { max: 3, label: "Leve", detail: "Sinais leves; acompanhe tendência do escore.", tone: "low" },
      { max: 6, label: "Moderado", detail: "Desconforto intermediário.", tone: "mid" },
      { max: 10, label: "Importante", detail: "Escore alto; requer abordagem imediata conforme contexto neonatal.", tone: "high" },
    ],
  },
  {
    id: "pas",
    name: "PAS · Apendicite pediátrica",
    short: "0–10",
    category: "Infeccioso / cirúrgico",
    summary: "Estratificação clínica de suspeita de apendicite em crianças.",
    max: 10,
    questions: [
      { id: "rlq", title: "Dor à palpação do quadrante inferior direito", options: noYes(2) },
      { id: "movement", title: "Dor com tosse, percussão ou salto", options: noYes(2) },
      { id: "migration", title: "Migração da dor para o quadrante inferior direito", options: noYes() },
      { id: "anorexia", title: "Anorexia", options: noYes() },
      { id: "nausea", title: "Náusea ou vômito", options: noYes() },
      { id: "fever", title: "Temperatura ≥ 38 °C", options: noYes() },
      { id: "wbc", title: "Leucócitos > 10.000/mm³", options: noYes() },
      { id: "neutrophils", title: "Neutrófilos > 75%", options: noYes() },
    ],
    bands: [
      { max: 3, label: "Baixa probabilidade", detail: "Não exclui apendicite; reavalie se evolução clínica incompatível.", tone: "low" },
      { max: 6, label: "Risco intermediário", detail: "Faixa que costuma exigir observação, exames e/ou imagem conforme protocolo.", tone: "mid" },
      { max: 10, label: "Alta probabilidade", detail: "Favorece avaliação cirúrgica, sem substituir exame e imagem quando indicados.", tone: "high" },
    ],
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/11735892/",
    sourceLabel: "Escore de Samuel",
  },
  {
    id: "rodwell",
    name: "Rodwell modificado",
    short: "0–10",
    category: "Infeccioso / cirúrgico",
    summary: "Triagem hematológica de sepse neonatal; versão expandida usada em alguns serviços.",
    max: 10,
    questions: [
      { id: "leukocytosis", title: "Leucocitose acima do limite para a idade pós-natal", hint: "Ex.: >25.000 ao nascer; >30.000 entre 12–24 h; >21.000 após 48 h.", options: noYes() },
      { id: "leukopenia", title: "Leucócitos < 5.000/mm³", options: noYes() },
      { id: "neutrophilia", title: "Neutrofilia acima do limite para a idade", options: noYes() },
      { id: "neutropenia", title: "Neutropenia abaixo do limite para a idade", options: noYes() },
      { id: "immature", title: "Contagem absoluta de neutrófilos imaturos elevada", options: noYes() },
      { id: "it", title: "Relação imaturos/total elevada", hint: "Use o limite validado pelo laboratório e pelo protocolo neonatal.", options: noYes() },
      { id: "im", title: "Relação imaturos/maduros > 0,3", options: noYes() },
      { id: "toxic", title: "Alterações tóxicas ou vacuolização neutrofílica", options: noYes() },
      { id: "platelets", title: "Plaquetas < 150.000/mm³", options: noYes() },
      { id: "crp", title: "PCR acima do ponto de corte local", hint: "Confirme especialmente a unidade: mg/L e mg/dL não são equivalentes.", options: noYes() },
    ],
    bands: [
      { max: 0, label: "Sem critérios no instrumento", detail: "Não exclui sepse se houver suspeita clínica ou fatores de risco.", tone: "low" },
      { max: 2, label: "Achados inespecíficos", detail: "Correlacione com clínica, culturas e evolução seriada.", tone: "mid" },
      { max: 10, label: "Triagem positiva", detail: "Três ou mais critérios aumentam a suspeita; não é critério isolado para iniciar ou suspender antibiótico.", tone: "high" },
    ],
    caveat: "Esta versão combina critérios de diferentes adaptações e deve acompanhar o protocolo neonatal institucional.",
  },
  {
    id: "strongkids",
    name: "STRONGkids",
    short: "0–5",
    category: "Nutrição",
    summary: "Risco nutricional pediátrico na admissão hospitalar.",
    max: 5,
    questions: [
      { id: "clinical", title: "Impressão clínica de desnutrição ou perda de tecido", options: noYes() },
      { id: "highrisk", title: "Doença de alto risco nutricional ou cirurgia de grande porte", options: noYes(2) },
      { id: "intake", title: "Baixa ingestão, perdas ou impossibilidade de alimentação", options: noYes() },
      { id: "weight", title: "Perda de peso ou ganho ponderal insuficiente recente", options: noYes() },
    ],
    bands: [
      { max: 0, label: "Baixo risco", detail: "Manter avaliação antropométrica e vigilância de rotina.", tone: "low" },
      { max: 3, label: "Risco moderado", detail: "Requer plano nutricional e reavaliação periódica.", tone: "mid" },
      { max: 5, label: "Alto risco", detail: "Indica avaliação nutricional especializada precoce.", tone: "high" },
    ],
  },
  {
    id: "stamp",
    name: "STAMP",
    short: "0–9",
    category: "Nutrição",
    summary: "Triagem hospitalar de desnutrição pediátrica.",
    max: 9,
    questions: [
      { id: "diagnosis", title: "Impacto nutricional do diagnóstico", options: [{ label: "Nenhum ou mínimo", score: 0 }, { label: "Possível", score: 2 }, { label: "Definido", score: 3 }] },
      { id: "intake", title: "Ingestão nutricional atual", options: [{ label: "Adequada", score: 0 }, { label: "Recentemente reduzida", score: 2 }, { label: "Muito reduzida ou ausente", score: 3 }] },
      { id: "anthro", title: "Peso e estatura nas curvas de referência", options: [{ label: "Sem preocupação", score: 0 }, { label: "Diferença de 1 canal centílico", score: 1 }, { label: "Diferença ≥ 2 canais ou fora da curva", score: 3 }] },
    ],
    bands: [
      { max: 1, label: "Baixo risco", detail: "Prosseguir com cuidados usuais e repetir triagem conforme rotina.", tone: "low" },
      { max: 3, label: "Risco moderado", detail: "Monitorar ingestão e repetir avaliação em curto intervalo.", tone: "mid" },
      { max: 9, label: "Alto risco", detail: "Solicitar avaliação nutricional e plano assistencial.", tone: "high" },
    ],
  },
  {
    id: "glasgow",
    name: "Glasgow pediátrico",
    short: "3–15",
    category: "Neurológico / sedação",
    summary: "Resposta ocular, verbal/comunicativa e motora adaptada ao desenvolvimento.",
    max: 15,
    questions: [
      { id: "eyes", title: "Resposta ocular", options: [{ label: "Nenhuma", score: 1 }, { label: "À pressão/dor", score: 2 }, { label: "À voz", score: 3 }, { label: "Espontânea", score: 4 }] },
      { id: "verbal", title: "Resposta verbal ou comunicativa para a idade", options: [{ label: "Nenhuma", score: 1 }, { label: "Sons incompreensíveis / inconsolável", score: 2 }, { label: "Palavras inadequadas / choro persistente", score: 3 }, { label: "Confusa / irritável, mas consolável", score: 4 }, { label: "Orientada ou interação apropriada", score: 5 }] },
      { id: "motor", title: "Resposta motora", options: [{ label: "Nenhuma", score: 1 }, { label: "Extensão anormal", score: 2 }, { label: "Flexão anormal", score: 3 }, { label: "Retirada à dor", score: 4 }, { label: "Localiza dor", score: 5 }, { label: "Obedece comandos / movimento espontâneo adequado", score: 6 }] },
    ],
    bands: [
      { max: 8, label: "Comprometimento grave", detail: "Interprete junto de sedação, bloqueio, via aérea e condições metabólicas.", tone: "high" },
      { max: 12, label: "Comprometimento moderado", detail: "Avaliação neurológica seriada é essencial.", tone: "mid" },
      { max: 15, label: "Leve ou sem redução pelo escore", detail: "O escore isolado não exclui lesão neurológica.", tone: "low" },
    ],
  },
  {
    id: "comfort-b",
    name: "COMFORT-B",
    short: "6–30",
    category: "Neurológico / sedação",
    summary: "Avaliação comportamental de sedação e desconforto em terapia intensiva pediátrica.",
    max: 30,
    questions: [
      { id: "alert", title: "Estado de alerta", options: [{ label: "Sono profundo", score: 1 }, { label: "Sono leve", score: 2 }, { label: "Sonolento", score: 3 }, { label: "Acordado e alerta", score: 4 }, { label: "Hiperalerta", score: 5 }] },
      { id: "calm", title: "Calma ou agitação", options: [{ label: "Calmo", score: 1 }, { label: "Levemente ansioso", score: 2 }, { label: "Ansioso", score: 3 }, { label: "Muito ansioso", score: 4 }, { label: "Agitação intensa", score: 5 }] },
      { id: "resp", title: "Resposta respiratória ou choro", options: [{ label: "Sem resistência / sem choro", score: 1 }, { label: "Resposta ocasional", score: 2 }, { label: "Resposta frequente", score: 3 }, { label: "Resistência ou choro ativo", score: 4 }, { label: "Resposta intensa e contínua", score: 5 }] },
      { id: "movement", title: "Movimento corporal", options: [{ label: "Ausente", score: 1 }, { label: "Ocasional", score: 2 }, { label: "Frequente e discreto", score: 3 }, { label: "Vigoroso nas extremidades", score: 4 }, { label: "Vigoroso incluindo tronco/cabeça", score: 5 }] },
      { id: "tone", title: "Tônus muscular", options: [{ label: "Muito reduzido", score: 1 }, { label: "Reduzido", score: 2 }, { label: "Normal", score: 3 }, { label: "Aumentado", score: 4 }, { label: "Rigidez acentuada", score: 5 }] },
      { id: "face", title: "Tensão facial", options: [{ label: "Face relaxada", score: 1 }, { label: "Tônus habitual", score: 2 }, { label: "Tensão ocasional", score: 3 }, { label: "Tensão frequente", score: 4 }, { label: "Tensão contínua", score: 5 }] },
    ],
    bands: [
      { max: 10, label: "Possível sedação excessiva", detail: "Revise metas, fármacos, bloqueio e contexto neurológico.", tone: "high" },
      { max: 22, label: "Faixa usualmente compatível com conforto", detail: "A meta individual pode ser diferente; siga o protocolo do serviço.", tone: "low" },
      { max: 30, label: "Possível sedação insuficiente / desconforto", detail: "Investigue dor, delirium, abstinência, ventilação e outras causas.", tone: "high" },
    ],
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/15636661/",
    sourceLabel: "Validação do COMFORT-B",
  },
  {
    id: "rass",
    name: "RASS pediátrica",
    short: "−5 a +4",
    category: "Neurológico / sedação",
    summary: "Nível de agitação e sedação em escala ordinal.",
    max: 4,
    questions: [
      { id: "rass", title: "Melhor descrição observada", options: [
        { label: "+4 · Combativo, risco imediato", score: 4 },
        { label: "+3 · Muito agitado", score: 3 },
        { label: "+2 · Agitado", score: 2 },
        { label: "+1 · Inquieto", score: 1 },
        { label: "0 · Alerta e calmo", score: 0 },
        { label: "−1 · Sonolento, desperta à voz por >10 s", score: -1 },
        { label: "−2 · Sedação leve, contato breve à voz", score: -2 },
        { label: "−3 · Movimento à voz, sem contato", score: -3 },
        { label: "−4 · Movimento apenas ao estímulo físico", score: -4 },
        { label: "−5 · Sem resposta à voz ou estímulo físico", score: -5 },
      ] },
    ],
    bands: [
      { max: -4, label: "Sedação profunda", detail: "Compare com a meta prescrita e fatores neurológicos.", tone: "high" },
      { max: -1, label: "Sedado", detail: "A adequação depende da meta individual.", tone: "mid" },
      { max: 0, label: "Alerta e calmo", detail: "Resultado descritivo; não define conduta isoladamente.", tone: "low" },
      { max: 4, label: "Agitação", detail: "Investigue dor, hipóxia, delirium, abstinência e desconforto.", tone: "high" },
    ],
  },
  {
    id: "wat1",
    name: "WAT-1",
    short: "0–12",
    category: "Abstinência",
    summary: "Sinais de abstinência iatrogênica por opioides e benzodiazepínicos.",
    max: 12,
    questions: [
      { id: "stool", title: "Fezes amolecidas ou líquidas nas últimas 12 h", options: noYes() },
      { id: "vomit", title: "Vômito, ânsia ou regurgitação nas últimas 12 h", options: noYes() },
      { id: "temp", title: "Temperatura predominante > 37,8 °C", options: noYes() },
      { id: "state", title: "Acordado e agitado antes do estímulo", options: noYes() },
      { id: "tremor", title: "Tremor moderado ou intenso", options: noYes() },
      { id: "sweat", title: "Sudorese", options: noYes() },
      { id: "movement", title: "Movimentos descoordenados ou repetitivos moderados/intensos", options: noYes() },
      { id: "yawn", title: "Dois ou mais bocejos/espirros", options: noYes() },
      { id: "startle", title: "Sobressalto moderado ou intenso ao toque", options: noYes() },
      { id: "tone", title: "Tônus muscular aumentado", options: noYes() },
      { id: "calm", title: "Tempo para retornar à calma", options: [{ label: "< 2 minutos", score: 0 }, { label: "2–5 minutos", score: 1 }, { label: "> 5 minutos", score: 2 }] },
    ],
    bands: [
      { max: 2, label: "Abaixo do ponto de corte", detail: "Continue avaliação seriada; tendência em relação ao basal também importa.", tone: "low" },
      { max: 12, label: "Triagem positiva", detail: "Escore ≥3 sugere abstinência clinicamente relevante e requer avaliação do protocolo de desmame.", tone: "high" },
    ],
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2775493/",
    sourceLabel: "Validação original do WAT-1",
  },
  {
    id: "wata2a",
    name: "WAT-A2A",
    short: "0–6",
    category: "Abstinência",
    summary: "Monitorização de abstinência por agonistas alfa-2.",
    max: 6,
    questions: [
      { id: "hr", title: "Frequência cardíaca em relação ao basal", options: [{ label: "Próxima ao basal", score: 0 }, { label: "20% a <50% acima", score: 1 }, { label: "≥50% acima", score: 2 }] },
      { id: "dbp", title: "Pressão diastólica em relação ao basal", options: [{ label: "Próxima ao basal", score: 0 }, { label: "20% a <50% acima", score: 1 }, { label: "≥50% acima", score: 2 }] },
      { id: "state", title: "Comportamento", options: [{ label: "Dormindo, acordado ou calmo", score: 0 }, { label: "Acordado e em sofrimento/agitação", score: 1 }] },
      { id: "tremor", title: "Tremor", options: [{ label: "Ausente, leve ou intermitente", score: 0 }, { label: "Moderado ou intenso", score: 1 }] },
    ],
    bands: [
      { max: 3, label: "Sem sinalização de alta intensidade", detail: "Acompanhe a tendência e o basal individual.", tone: "low" },
      { max: 6, label: "Possível abstinência significativa", detail: "O ponto de corte ainda exige validação externa; correlacione com o desmame e outras causas.", tone: "high" },
    ],
    caveat: "Instrumento emergente; não possui a mesma base de validação do WAT-1.",
  },
  {
    id: "capd",
    name: "CAPD",
    short: "0–32",
    category: "Delirium",
    summary: "Triagem observacional de delirium pediátrico em qualquer idade.",
    max: 32,
    questions: [
      { id: "eye", title: "Mantém contato visual apropriado com o cuidador", options: neverToAlways(true) },
      { id: "purpose", title: "Ações têm propósito", options: neverToAlways(true) },
      { id: "aware", title: "Percebe o ambiente ao redor", options: neverToAlways(true) },
      { id: "needs", title: "Consegue comunicar necessidades", options: neverToAlways(true) },
      { id: "restless", title: "Apresenta inquietação motora", options: neverToAlways(false) },
      { id: "console", title: "É difícil de consolar", options: neverToAlways(false) },
      { id: "underactive", title: "Mostra-se hipoativo ou muito lento", options: neverToAlways(false) },
      { id: "response", title: "Demora mais que o habitual para responder", options: neverToAlways(false) },
    ],
    bands: [
      { max: 8, label: "Triagem negativa", detail: "Não exclui delirium se houver flutuação ou forte suspeita clínica.", tone: "low" },
      { max: 32, label: "Triagem positiva", detail: "Escore ≥9 requer avaliação das causas, contexto do desenvolvimento e diagnóstico diferencial.", tone: "high" },
    ],
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5527829/",
    sourceLabel: "Validação do CAPD",
  },
  {
    id: "flacc",
    name: "FLACC",
    short: "0–10",
    category: "Dor",
    summary: "Dor observacional por face, pernas, atividade, choro e consolabilidade.",
    max: 10,
    questions: [
      { id: "face", title: "Expressão facial", options: [{ label: "Relaxada", score: 0 }, { label: "Desconforto ocasional", score: 1 }, { label: "Desconforto frequente ou acentuado", score: 2 }] },
      { id: "legs", title: "Pernas", options: [{ label: "Relaxadas", score: 0 }, { label: "Inquietas ou tensas", score: 1 }, { label: "Muito tensas, fletidas ou com chutes", score: 2 }] },
      { id: "activity", title: "Atividade corporal", options: [{ label: "Normal ou relaxada", score: 0 }, { label: "Tensa ou com movimentos repetitivos", score: 1 }, { label: "Rigidez ou arqueamento importante", score: 2 }] },
      { id: "cry", title: "Choro", options: [{ label: "Ausente", score: 0 }, { label: "Gemido ou queixa ocasional", score: 1 }, { label: "Choro persistente ou gritos", score: 2 }] },
      { id: "console", title: "Consolabilidade", options: [{ label: "Confortável", score: 0 }, { label: "Consola com contato ou distração", score: 1 }, { label: "Difícil de consolar", score: 2 }] },
    ],
    bands: [
      { max: 0, label: "Sem dor observada", detail: "Reavalie após procedimentos e mudanças clínicas.", tone: "low" },
      { max: 3, label: "Dor leve", detail: "Interpretar com o comportamento basal e o contexto.", tone: "low" },
      { max: 6, label: "Dor moderada", detail: "Requer avaliação e intervenção conforme protocolo.", tone: "mid" },
      { max: 10, label: "Dor intensa", detail: "Requer abordagem imediata e reavaliação após intervenção.", tone: "high" },
    ],
  },
];

export const SCORE_CATEGORIES = [
  "Respiratório",
  "Infeccioso / cirúrgico",
  "Dor",
  "Nutrição",
  "Neurológico / sedação",
  "Abstinência",
  "Delirium",
];

export function scoreBand(definition: ScoreDefinition, total: number) {
  return definition.bands.find((band) => total <= band.max) ?? definition.bands.at(-1)!;
}
