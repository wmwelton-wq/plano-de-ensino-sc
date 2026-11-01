// Temas Contemporâneos Transversais (TCTs) da BNCC, como aparecem nos Currículos Base do Território Catarinense
// (Educação Infantil e Ensino Fundamental, 2019; Ensino Médio, 2021): 15 temas em 6 macroáreas. O caderno do
// Ensino Médio de Ciências da Natureza acrescenta a "Educação Inclusiva" (tecnologias assistivas e espaços inclusivos).
//
// Os cadernos NÃO ligam cada tema a objetos de conhecimento ou habilidades específicas: eles dão orientações e
// exemplos. Por isso as sugestões deste arquivo são aproximadas: "ideias" curtas inspiradas nos cadernos e
// "palavras" que o formulário procura nas habilidades e nos objetos de conhecimento do próprio plano. O professor
// sempre decide o que usar e pode escrever as suas próprias.

export type MacroareaId =
  | "meio-ambiente"
  | "economia"
  | "saude"
  | "cidadania-civismo"
  | "multiculturalismo"
  | "ciencia-tecnologia"
  | "educacao-inclusiva";

export interface Macroarea {
  id: MacroareaId;
  nome: string;
}

export const MACROAREAS: Macroarea[] = [
  { id: "meio-ambiente", nome: "Meio Ambiente" },
  { id: "economia", nome: "Economia" },
  { id: "saude", nome: "Saúde" },
  { id: "cidadania-civismo", nome: "Cidadania e Civismo" },
  { id: "multiculturalismo", nome: "Multiculturalismo" },
  { id: "ciencia-tecnologia", nome: "Ciência e Tecnologia" },
  { id: "educacao-inclusiva", nome: "Educação Inclusiva" },
];

export interface TemaCatalogo {
  id: string;
  nome: string;
  macroarea: MacroareaId;
  /** Frase curta para o professor entender o tema. */
  resumo: string;
  /**
   * Começos de palavra (sem acento, minúsculas) procurados nas habilidades e nos objetos de conhecimento.
   * Terminando em "$", a palavra tem de acabar ali (ex.: "fome$" não pega "fomentar").
   */
  palavras: string[];
  /** Ideias de abordagem, inspiradas nos cadernos. */
  ideias: string[];
  /** Só aparece no Ensino Médio (tema acrescentado pelo caderno de Ciências da Natureza de SC). */
  somenteMedio?: boolean;
}

export const TEMAS: TemaCatalogo[] = [
  {
    id: "educacao-ambiental",
    nome: "Educação Ambiental",
    macroarea: "meio-ambiente",
    resumo: "Relação dos grupos e sociedades com a natureza, seus impactos socioambientais e a sustentabilidade.",
    palavras: [
      "ambient", "sustentab", "ecolog", "ecossistem", "biodiversidade", "poluic", "polui", "residuo", "lixo",
      "reciclag", "aquecimento global", "mudanca climatic", "mudancas climatic", "clima", "desmatamento",
      "recursos naturais", "preservac", "saneamento", "energia renovavel", "energias renovaveis", "agua potavel",
      "efeito estufa", "queimada", "extincao", "impacto ambiental", "agrotoxic",
    ],
    ideias: [
      "Mapear o descarte de resíduos da escola (por exemplo, medir a massa de papel descartado) e propor ações para reduzi-lo, como na gincana ambiental sugerida no Currículo Base do Ensino Médio.",
      "Seguir o tripé do caderno: informação, sensibilização e mobilização social para mudar comportamentos diante das questões ambientais.",
      "Estudar eventos climáticos extremos e suas consequências na realidade catarinense e na comunidade da escola.",
      "Investigar a água e o saneamento do bairro e as doenças de veiculação hídrica (hepatite, cólera, verminoses, dengue).",
      "Discutir desmatamento, mudanças climáticas e perda de biodiversidade a partir de dados locais e regionais.",
      "Propor ações de escola sustentável: horta, compostagem, coleta seletiva, economia de água e de energia.",
      "Ensino Médio: relacionar o ambiente às dimensões das sociedades sustentáveis (ambiental, econômica, social, territorial, cultural, política e psicológica).",
    ],
  },
  {
    id: "educacao-consumo",
    nome: "Educação para o Consumo",
    macroarea: "meio-ambiente",
    resumo: "Modos de produção e consumo, seus impactos socioambientais e o consumo responsável.",
    palavras: [
      "consumo", "consumismo", "consumidor responsavel", "consumidor consciente", "direitos do consumidor",
      "defesa do consumidor", "publicidade", "propaganda", "descarte", "obsolescencia", "producao e consumo",
    ],
    ideias: [
      "Analisar a cultura e a moda do consumo e a sua relação com a sustentabilidade.",
      "Ler e discutir anúncios e propagandas: que desejos criam e que impactos têm; conhecer o Código de Defesa do Consumidor.",
      "Comparar produção, consumo e descarte de um produto do dia a dia, do local ao global.",
      "Propor hábitos de consumo consciente na escola e em casa (reduzir, reutilizar, reparar, reciclar).",
      "Pesquisar o ciclo de vida de um objeto (da matéria-prima ao lixo) e seus impactos socioambientais.",
    ],
  },
  {
    id: "trabalho",
    nome: "Trabalho",
    macroarea: "economia",
    resumo: "Mundo do trabalho, profissões, direitos trabalhistas e formação para o trabalho e para a cidadania.",
    palavras: [
      "trabalh", "profiss", "emprego", "ocupacao profissional", "ocupacoes profissionais", "carreira", "empreendedor", "projeto de vida", "salario",
      "sindicat", "precarizac", "economia solidaria", "cooperativ",
    ],
    ideias: [
      "Pesquisar as profissões e os setores de trabalho da região e como eles mudam com a tecnologia.",
      "Discutir trabalho decente, direitos trabalhistas, trabalho infantil e trabalho análogo ao escravo.",
      "Conhecer a economia solidária e o cooperativismo como alternativas de trabalho e renda.",
      "Relacionar o conteúdo da disciplina a profissões que o utilizam (formação para o trabalho).",
      "Entrevistar trabalhadores da comunidade e registrar o que aprenderam sobre o seu ofício.",
    ],
  },
  {
    id: "educacao-financeira",
    nome: "Educação Financeira",
    macroarea: "economia",
    resumo: "Organização financeira pessoal e familiar, consumo planejado, juros e endividamento.",
    palavras: [
      "financ", "dinheiro", "juros", "poupanc", "investiment", "orcament", "endivid", "divida", "moeda",
      "credito", "inflac", "lucro", "prejuizo", "porcentage", "desconto", "acrescimo", "cedula", "troco",
      "preco", "sistema monetario", "compra e venda",
    ],
    ideias: [
      "Montar um orçamento (pessoal, familiar ou da turma) em planilha eletrônica e discutir prioridades de gastos.",
      "Analisar situações de endividamento e juros em compras parceladas e no cartão de crédito.",
      "Usar a regra de três e a porcentagem em situações de compra, desconto, acréscimo e financiamento.",
      "Comparar preços e formas de pagamento em panfletos, lojas virtuais e encartes.",
      "Planejar uma meta de poupança e calcular em quanto tempo ela seria atingida.",
    ],
  },
  {
    id: "educacao-fiscal",
    nome: "Educação Fiscal",
    macroarea: "economia",
    resumo: "Tributos, serviços públicos e o uso responsável do dinheiro público.",
    palavras: [
      "fiscal", "tribut", "imposto", "servico publico", "servicos publicos", "arrecad", "gasto publico",
      "orcamento publico", "nota fiscal", "contribuic",
    ],
    ideias: [
      "Identificar os impostos que aparecem em uma nota fiscal ou conta de consumo e para que servem.",
      "Pesquisar quais serviços públicos da cidade são pagos com tributos (escola, saúde, transporte, limpeza urbana).",
      "Discutir o orçamento público e como a comunidade pode acompanhar o uso do dinheiro público.",
      "Analisar gráficos e tabelas de arrecadação e de gastos do município ou do estado.",
    ],
  },
  {
    id: "saude",
    nome: "Saúde",
    macroarea: "saude",
    resumo: "Cuidado com o corpo e com a saúde individual e coletiva, prevenção de doenças e bem-estar.",
    palavras: [
      "saude", "doenc", "vacin", "epidemi", "pandemi", "higiene", "bem-estar", "prevencao", "sexualidade",
      "drogas", "infecc", "patogen", "imunid", "puberdade", "gravidez", "contracepc", "sistema unico de saude",
      "sedentarismo", "atividade fisica", "acessibilidade", "estresse",
    ],
    ideias: [
      "Discutir saúde e acessibilidade: o que impede ou facilita o acesso de todas as pessoas aos serviços e espaços de saúde.",
      "Pesquisar a saúde de populações indígena e negra e a relação com o racismo, a partir de dados locais.",
      "Estudar vacinas, vacinação e prevenção de doenças e o papel da saúde pública.",
      "Relacionar água não tratada e doenças de veiculação hídrica e transmitidas por vetores com a qualidade de vida.",
      "Cuidar da saúde mental e do corpo: escuta do próprio corpo, esporte, lazer e convivência.",
      "Analisar dados de saúde da comunidade em tabelas e gráficos.",
    ],
  },
  {
    id: "alimentar-nutricional",
    nome: "Educação Alimentar e Nutricional",
    macroarea: "saude",
    resumo: "Hábitos alimentares saudáveis, nutrição e segurança alimentar.",
    palavras: [
      "aliment", "nutri", "dieta", "obesidade", "fome$", "vitamina", "caloria", "proteina", "carboidrato",
      "lipidio", "seguranca alimentar", "agrotoxic", "transgenic", "merenda", "horta", "rotulo",
    ],
    ideias: [
      "Analisar rótulos de alimentos (nutrientes, calorias, aditivos) e comparar escolhas mais saudáveis.",
      "Discutir segurança alimentar e nutricional e a fome, local e globalmente.",
      "Debater agrotóxicos e transgênicos e a sua relação com a segurança alimentar.",
      "Montar horta ou cardápio saudável na escola; valorizar a alimentação regional e os alimentos da estação.",
      "Pesquisar a origem dos alimentos da merenda escolar e o trabalho de quem os produz.",
    ],
  },
  {
    id: "vida-familiar-social",
    nome: "Vida Familiar e Social",
    macroarea: "cidadania-civismo",
    resumo: "Convivência, cooperação, relações familiares e sociais e enfrentamento da violência.",
    palavras: [
      "vida familiar", "relacoes familiares", "arranjos familiares", "familia", "convivencia", "convivio",
      "cooperac", "empatia", "bullying", "violencia", "conflito", "vida em sociedade", "amizade", "respeito mutuo",
      "relacoes sociais", "solidariedade", "igualdade de genero",
    ],
    ideias: [
      "Trabalhar a violência contra a mulher (violência doméstica): contextualizar com reportagens e dados, organizar pesquisa, tabular e analisar, como sugere o Currículo Base do Ensino Médio.",
      "Discutir diferentes arranjos familiares e o respeito às diferenças.",
      "Combinar regras de convivência da turma e resolver conflitos pelo diálogo e pela cooperação.",
      "Enfrentar bullying e ciberbullying com rodas de conversa, jogos e brincadeiras cooperativas.",
      "Promover projetos de solidariedade que envolvam a família e a comunidade escolar.",
    ],
  },
  {
    id: "transito",
    nome: "Educação para o Trânsito",
    macroarea: "cidadania-civismo",
    resumo: "Segurança, respeito às regras e convivência nas vias, a pé, de bicicleta ou em veículos.",
    palavras: [
      "transito", "trafego", "seguranca viaria", "sinalizac", "veiculo automotor", "veiculos automotores", "pedestre",
      "mobilidade urbana", "acidentes de transito", "acidente de transito", "motorista", "ciclovia", "frenagem", "rodovia", "semaforo", "transporte coletivo",
      "transporte publico",
    ],
    ideias: [
      "Ler e interpretar a sinalização do entorno da escola e propor melhorias de segurança.",
      "Estudar o Código de Trânsito Brasileiro e discutir direitos e deveres de pedestres, ciclistas e motoristas.",
      "Analisar dados de acidentes de trânsito em tabelas e gráficos e propor ações de prevenção.",
      "Relacionar velocidade, distância de frenagem e segurança no trânsito.",
      "Discutir mobilidade urbana e transporte coletivo na cidade.",
    ],
  },
  {
    id: "direitos-humanos",
    nome: "Educação em Direitos Humanos",
    macroarea: "cidadania-civismo",
    resumo: "Conhecer, valorizar e defender os direitos humanos, combatendo discriminações.",
    palavras: [
      "direitos humanos", "cidadan", "democra", "justica", "igualdade", "discrimin", "racismo", "preconceito",
      "desigualdade", "dignidade", "constituic", "direitos e deveres", "liberdade", "xenofobia", "machismo",
      "escravid", "tolerancia", "minorias",
    ],
    ideias: [
      "Ler textos legais (Constituição, ECA, regimento escolar) para identificar direitos garantidos e proibições.",
      "Discutir acessibilidade como direito humano na escola e na cidade.",
      "Pesquisar situações de racismo, machismo, xenofobia e outras discriminações e como enfrentá-las.",
      "Promover rodas de conversa e projetos participativos que fortaleçam a cultura dos direitos humanos na escola.",
      "Relacionar desigualdades sociais a dados de renda, moradia, educação e saúde.",
    ],
  },
  {
    id: "criancas-adolescentes",
    nome: "Direitos da Criança e do Adolescente",
    macroarea: "cidadania-civismo",
    resumo: "Direitos e proteção de crianças e adolescentes, conforme o Estatuto da Criança e do Adolescente (ECA).",
    palavras: [
      "estatuto da crianca", "eca$", "direitos da crianca", "direitos das criancas", "trabalho infantil", "adolescen",
      "juventude", "infancia", "protagonismo juvenil", "ciberbullying", "cyberbullying", "exploracao sexual",
      "direito de brincar", "criancas e adolescentes",
    ],
    ideias: [
      "Conhecer o ECA (Lei nº 8.069/1990) e relacionar seus artigos com situações do dia a dia da escola.",
      "Discutir trabalho infantil, exploração e outras violações de direitos, e a quem recorrer (Conselho Tutelar).",
      "Debater segurança e respeito na internet: ciberbullying, exposição de imagens e dados pessoais.",
      "Promover o direito de brincar e a participação das crianças e adolescentes nas decisões da escola.",
    ],
  },
  {
    id: "idosos",
    nome: "Respeito e Valorização do Idoso",
    macroarea: "cidadania-civismo",
    resumo: "Processo de envelhecimento, respeito, direitos e valorização das pessoas idosas.",
    palavras: [
      "idoso", "idosa", "envelhec", "longevidade", "velhice", "aposentad", "terceira idade", "mais velhos",
      "entre geracoes", "intergeracional",
    ],
    ideias: [
      "Entrevistar pessoas idosas da comunidade e registrar memórias, saberes e histórias de vida.",
      "Conhecer o Estatuto da Pessoa Idosa (Lei nº 10.741/2003) e discutir o respeito e a acessibilidade.",
      "Analisar dados do envelhecimento da população brasileira e catarinense em tabelas e gráficos.",
      "Promover encontros entre gerações: jogos, brincadeiras e oficinas com avós e idosos da comunidade.",
    ],
  },
  {
    id: "diversidade-cultural",
    nome: "Diversidade Cultural",
    macroarea: "multiculturalismo",
    resumo: "Reconhecer e respeitar a diversidade de povos, culturas, línguas e tradições (interculturalidade).",
    palavras: [
      "diversidade", "indigen", "afro", "quilomb", "migra", "imigra", "patrimonio cultural", "patrimonio imaterial",
      "tradicoes", "povos", "etnia", "folclor", "manifestacoes culturais", "interculturalidade", "cultura popular",
      "identidade cultural", "culturas",
    ],
    ideias: [
      "Adotar a perspectiva intercultural: promover o diálogo entre grupos culturais valorizando as diferenças e o respeito durante a interação.",
      "Estudar a formação do povo brasileiro e dos territórios e fronteiras, reconhecendo as relações de poder envolvidas.",
      "Valorizar a negritude e a identidade dos povos indígenas: pinturas, danças, brincadeiras, produções literárias, vocabulário e movimentos sociais.",
      "Pesquisar a diversidade cultural de Santa Catarina: povos indígenas, açorianos, imigrantes europeus e comunidades quilombolas.",
      "Organizar mostras, feiras e rodas de conversa sobre as tradições das famílias da turma.",
    ],
  },
  {
    id: "matrizes-culturais",
    nome: "Valorização do Multiculturalismo nas Matrizes Históricas e Culturais Brasileiras",
    macroarea: "multiculturalismo",
    resumo: "Reconhecer as matrizes indígena, africana, europeia e outras na formação cultural do Brasil.",
    palavras: [
      "matrizes culturais", "matrizes historicas", "matriz africana", "matriz indigena", "matriz europeia", "indigen",
      "africa", "afro", "europe", "miscigenac", "formacao do povo", "povos originarios", "quilomb", "colonizac",
      "escravid", "negritude", "etnico-racia",
    ],
    ideias: [
      "Pesquisar contribuições das matrizes indígena, africana e europeia à língua, à música, à culinária e às festas brasileiras.",
      "Trabalhar as Leis nº 10.639/2003 e nº 11.645/2008 (história e cultura afro-brasileira, africana e indígena).",
      "Reconhecer as culturas como processos em movimento, com identidades abertas, sem estereótipos.",
      "Dar voz a saberes e lutas de resistência de povos indígenas e comunidades negras e quilombolas.",
      "Discutir o caráter multiétnico e plurilinguístico do Brasil.",
    ],
  },
  {
    id: "ciencia-tecnologia",
    nome: "Ciência e Tecnologia",
    macroarea: "ciencia-tecnologia",
    resumo: "Relações entre ciência, tecnologia, sociedade e ambiente, e uso crítico das tecnologias.",
    palavras: [
      "tecnologia", "tecnologic", "metodos cientificos", "divulgacao cientifica", "inovac", "invencao", "robot",
      "inteligencia artificial", "internet", "algoritm", "biotecnologia", "transgenic", "energia nuclear",
      "computac", "digital", "planilha", "software", "aplicativo", "midia digital",
    ],
    ideias: [
      "Discutir, numa visão ciência, tecnologia, sociedade e ambiente (CTSA), temas como desmatamento, mudanças climáticas, energia nuclear e transgênicos.",
      "Usar planilhas eletrônicas e aplicativos para tabular, representar graficamente e analisar dados de uma pesquisa da turma.",
      "Tomar decisões baseadas em argumentos e fontes de natureza científica, comparando diferentes pontos de vista.",
      "Debater o uso ético e responsável de redes sociais, inteligência artificial e outras tecnologias digitais.",
      "Pesquisar como uma invenção ou descoberta científica mudou o trabalho, a saúde ou o cotidiano.",
    ],
  },
  {
    id: "educacao-inclusiva",
    nome: "Educação Inclusiva",
    macroarea: "educacao-inclusiva",
    resumo: "Direito de todas as pessoas à educação: tecnologias assistivas e espaços inclusivos (tema do Ensino Médio em SC).",
    palavras: [
      "inclusao", "educacao inclusiva", "escola inclusiva", "espaco inclusivo", "espacos inclusivos", "acessibilidade",
      "assistiva", "deficiencia", "libras", "braille", "necessidades especificas",
    ],
    ideias: [
      "Pesquisar tecnologias assistivas que ajudam estudantes a aprender os conceitos científicos.",
      "Avaliar a acessibilidade dos espaços da escola e propor espaços mais inclusivos.",
      "Planejar atividades que todos os estudantes possam realizar, com recursos e linguagens variados.",
      "Conhecer o atendimento educacional especializado previsto em Santa Catarina e como articulá-lo ao plano.",
    ],
    somenteMedio: true,
  },
];

const POR_ID = new Map(TEMAS.map((t) => [t.id, t]));

export function temaPorId(id: string): TemaCatalogo | undefined {
  return POR_ID.get(id);
}

/** Temas disponíveis para a etapa (o de Educação Inclusiva só existe no Ensino Médio). */
export function temasDaEtapa(etapa: string): TemaCatalogo[] {
  return TEMAS.filter((t) => !t.somenteMedio || etapa === "ensino_medio");
}

// ───────────────────────── escolha do professor ─────────────────────────

/** Um tema escolhido, com o que o professor marcou ou escreveu dentro dele. */
export interface TemaEscolhido {
  /** Componente (Anos Iniciais) ou null quando o plano tem um só componente (Anos Finais / Ensino Médio). */
  disciplina_id: string | null;
  /** Identificador do tema no catálogo. */
  tema: string;
  ideias: string[];
  objetos: string[];
  habilidades: string[];
}

export const LIMITES_TEMAS = {
  temasPorGrupo: TEMAS.length,
  itensPorLista: 30,
  caracteresPorItem: 700,
  caracteresTotal: 60000,
} as const;

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function limparTexto(valor: unknown): string {
  if (typeof valor !== "string") return "";
  return valor
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LIMITES_TEMAS.caracteresPorItem);
}

function limparLista(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const item of valor) {
    const texto = limparTexto(item);
    const chave = texto.toLowerCase();
    if (!texto || vistos.has(chave)) continue;
    vistos.add(chave);
    saida.push(texto);
    if (saida.length >= LIMITES_TEMAS.itensPorLista) break;
  }
  return saida;
}

/**
 * Lê (sem confiar) o que veio do navegador ou do banco: só aceita temas do catálogo, e disciplina_id só se for
 * um UUID. Nunca lança erro; devolve só dados limpos.
 */
export function normalizarTemas(valor: unknown, disciplinaFixa?: string | null): TemaEscolhido[] {
  if (!Array.isArray(valor)) return [];
  const saida: TemaEscolhido[] = [];
  const vistos = new Set<string>();
  for (const bruto of valor) {
    if (typeof bruto !== "object" || bruto === null) continue;
    const item = bruto as Record<string, unknown>;
    const tema = typeof item.tema === "string" ? item.tema : "";
    if (!POR_ID.has(tema)) continue;
    let disciplina: string | null;
    if (disciplinaFixa !== undefined) {
      disciplina = disciplinaFixa;
    } else if (typeof item.disciplina_id === "string" && REGEX_UUID.test(item.disciplina_id)) {
      disciplina = item.disciplina_id;
    } else {
      disciplina = null;
    }
    const chave = `${disciplina ?? ""}|${tema}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    saida.push({
      disciplina_id: disciplina,
      tema,
      ideias: limparLista(item.ideias),
      objetos: limparLista(item.objetos),
      habilidades: limparLista(item.habilidades),
    });
  }
  return saida;
}

/** Lê o JSON gravado no banco (coluna jsonb). */
export function lerTemas(valor: unknown): TemaEscolhido[] {
  return normalizarTemas(valor);
}

/** Temas de um componente (ou do plano inteiro, com `null`), na ordem do catálogo. */
export function temasDoGrupo(temas: TemaEscolhido[], disciplinaId: string | null): TemaEscolhido[] {
  const ordem = new Map(TEMAS.map((t, i) => [t.id, i]));
  return temas
    .filter((t) => t.disciplina_id === disciplinaId)
    .sort((a, b) => (ordem.get(a.tema) ?? 0) - (ordem.get(b.tema) ?? 0));
}

/** Um tema só entra no plano se o professor escolheu o tema (ele pode não marcar nada dentro dele). */
export function temaTemConteudo(t: TemaEscolhido): boolean {
  return t.ideias.length + t.objetos.length + t.habilidades.length > 0;
}

// ───────────────────────── sugestões a partir do currículo ─────────────────────────

export function normalizarBusca(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const CACHE_REGEX = new Map<string, RegExp>();

function regexDoTema(tema: TemaCatalogo): RegExp {
  let r = CACHE_REGEX.get(tema.id);
  if (!r) {
    const partes = tema.palavras.map((p) => (p.endsWith("$") ? `${escaparRegex(p.slice(0, -1))}(?![a-z0-9])` : escaparRegex(p)));
    r = new RegExp(`(?:^|[^a-z0-9])(?:${partes.join("|")})`, "g");
    CACHE_REGEX.set(tema.id, r);
  }
  return r;
}

/** Quantas palavras do tema aparecem no texto (0 = sem relação). */
export function pontuarTexto(tema: TemaCatalogo, texto: string): number {
  const r = regexDoTema(tema);
  r.lastIndex = 0;
  const achados = normalizarBusca(texto).match(r);
  return achados ? achados.length : 0;
}

export interface ItemCurriculo {
  codigo?: string | null;
  descricao: string;
  /** Texto extra usado só para procurar (objeto de conhecimento, conteúdos). */
  contexto?: string | null;
}

export interface SugestaoItem {
  /** Texto que vai para o plano. */
  texto: string;
  pontos: number;
}

/** Textos prontos de habilidade para o plano: "(EF01LP01) descrição". */
export function textoDaHabilidade(h: { codigo?: string | null; descricao: string }): string {
  const codigo = h.codigo ? `(${h.codigo}) ` : "";
  return `${codigo}${h.descricao}`.replace(/\s+/g, " ").trim();
}

/** Habilidades do plano relacionadas ao tema, das mais para as menos ligadas. */
export function sugerirHabilidades(tema: TemaCatalogo, habilidades: ItemCurriculo[], limite = 60): SugestaoItem[] {
  const lista: SugestaoItem[] = [];
  for (const h of habilidades) {
    const pontos = pontuarTexto(tema, `${h.descricao} ${h.contexto ?? ""}`);
    if (pontos > 0) lista.push({ texto: textoDaHabilidade(h), pontos });
  }
  return ordenar(lista).slice(0, limite);
}

/** Objetos de conhecimento do plano relacionados ao tema. `contexto` (conteúdos) ajuda a achar, mas não é gravado. */
export function sugerirObjetos(
  tema: TemaCatalogo,
  objetos: { objeto: string; contexto?: string | null }[],
  limite = 40
): SugestaoItem[] {
  const porTexto = new Map<string, SugestaoItem>();
  for (const o of objetos) {
    const texto = o.objeto.replace(/\s+/g, " ").trim();
    if (!texto) continue;
    const pontos = pontuarTexto(tema, `${texto} ${o.contexto ?? ""}`);
    if (pontos <= 0) continue;
    const atual = porTexto.get(texto);
    if (!atual || atual.pontos < pontos) porTexto.set(texto, { texto, pontos });
  }
  return ordenar(Array.from(porTexto.values())).slice(0, limite);
}

function ordenar(lista: SugestaoItem[]): SugestaoItem[] {
  return lista.sort((a, b) => b.pontos - a.pontos || a.texto.localeCompare(b.texto, "pt-BR"));
}
