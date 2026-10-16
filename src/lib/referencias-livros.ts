// Livros e obras de apoio sugeridos para as "Referências bibliográficas" de cada disciplina.
// São SUGESTÕES: o professor confere edição e ano do livro que a escola realmente adota,
// edita ou apaga à vontade no editor.

const chaveTexto = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

type Etapa = "fundamental_anos_iniciais" | "fundamental_anos_finais" | "ensino_medio" | string;

const ARTE = [
  "BARBOSA, Ana Mae. A imagem no ensino da arte. São Paulo: Perspectiva.",
  "GOMBRICH, Ernst H. A história da arte. Rio de Janeiro: LTC.",
];
const EDUCACAO_FISICA = [
  "DARIDO, Suraya Cristina; RANGEL, Irene Conceição Andrade. Educação física na escola: implicações para a prática pedagógica. Rio de Janeiro: Guanabara Koogan.",
  "COLETIVO DE AUTORES. Metodologia do ensino de educação física. São Paulo: Cortez.",
];
const ENSINO_RELIGIOSO = [
  "FONAPER. Parâmetros Curriculares Nacionais: Ensino Religioso. São Paulo: Ave-Maria.",
  "JUNQUEIRA, Sérgio (org.). Ensino religioso no Brasil. Florianópolis: Insular.",
];
const INGLES = [
  "MURPHY, Raymond. English grammar in use. Cambridge: Cambridge University Press.",
  "SOUZA, Adriana Grade Fiori de et al. Leitura em língua inglesa: uma abordagem instrumental. São Paulo: Disal.",
];
const PORTUGUES_FINAIS_MEDIO = [
  "CEREJA, William Roberto; MAGALHÃES, Thereza Cochar. Português: linguagens. São Paulo: Saraiva.",
  "BECHARA, Evanildo. Moderna gramática portuguesa. Rio de Janeiro: Nova Fronteira.",
];

const COLECOES_INICIAIS = (componente: string): string[] => [
  `ÁPIS: ${componente} – Ensino Fundamental, Anos Iniciais. São Paulo: Ática.`,
  `BURITI MAIS: ${componente} – Ensino Fundamental, Anos Iniciais. São Paulo: Moderna.`,
];

const INICIAIS: Record<string, string[]> = {
  "lingua portuguesa": COLECOES_INICIAIS("Língua Portuguesa"),
  matematica: COLECOES_INICIAIS("Matemática"),
  ciencias: COLECOES_INICIAIS("Ciências"),
  historia: COLECOES_INICIAIS("História"),
  geografia: COLECOES_INICIAIS("Geografia"),
  arte: ARTE,
  "educacao fisica": EDUCACAO_FISICA,
  "ensino religioso": ENSINO_RELIGIOSO,
};

const FINAIS: Record<string, string[]> = {
  "lingua portuguesa": PORTUGUES_FINAIS_MEDIO,
  matematica: [
    "DANTE, Luiz Roberto. Teláris: Matemática. São Paulo: Ática.",
    "ANDRINI, Álvaro; VASCONCELLOS, Maria José. Praticando Matemática. São Paulo: Editora do Brasil.",
  ],
  ciencias: [
    "GEWANDSZNAJDER, Fernando. Teláris: Ciências. São Paulo: Ática.",
    "ARARIBÁ MAIS: Ciências – Ensino Fundamental, Anos Finais. São Paulo: Moderna.",
  ],
  historia: [
    "BOULOS JÚNIOR, Alfredo. História: sociedade & cidadania. São Paulo: FTD.",
    "ARARIBÁ MAIS: História – Ensino Fundamental, Anos Finais. São Paulo: Moderna.",
  ],
  geografia: [
    "VESENTINI, José William. Geografia: o mundo em transição. São Paulo: Ática.",
    "ARARIBÁ MAIS: Geografia – Ensino Fundamental, Anos Finais. São Paulo: Moderna.",
  ],
  "lingua inglesa": INGLES,
  arte: ARTE,
  "educacao fisica": EDUCACAO_FISICA,
  "ensino religioso": ENSINO_RELIGIOSO,
};

const MEDIO: Record<string, string[]> = {
  "lingua portuguesa": PORTUGUES_FINAIS_MEDIO,
  matematica: [
    "DANTE, Luiz Roberto. Matemática: contexto & aplicações. São Paulo: Ática.",
    "IEZZI, Gelson et al. Matemática: ciência e aplicações. São Paulo: Saraiva.",
  ],
  biologia: [
    "AMABIS, José Mariano; MARTHO, Gilberto Rodrigues. Biologia em contexto. São Paulo: Moderna.",
    "LINHARES, Sérgio; GEWANDSZNAJDER, Fernando. Biologia hoje. São Paulo: Ática.",
  ],
  fisica: [
    "RAMALHO JÚNIOR, Francisco; FERRARO, Nicolau Gilberto; SOARES, Paulo Antônio de Toledo. Os fundamentos da física. São Paulo: Moderna.",
    "BISCUOLA, Gualter José; VILLAS BÔAS, Newton; DOCA, Ricardo Helou. Tópicos de física. São Paulo: Saraiva.",
  ],
  quimica: [
    "FELTRE, Ricardo. Química. São Paulo: Moderna.",
    "USBERCO, João; SALVADOR, Edgard. Química. São Paulo: Saraiva.",
  ],
  historia: [
    "MOTA, Myriam Becho; BRAICK, Patrícia Ramos. História: das cavernas ao terceiro milênio. São Paulo: Moderna.",
    "BOULOS JÚNIOR, Alfredo. História: sociedade & cidadania. São Paulo: FTD.",
  ],
  geografia: [
    "MOREIRA, João Carlos; SENE, Eustáquio de. Geografia geral e do Brasil: espaço geográfico e globalização. São Paulo: Scipione.",
    "VESENTINI, José William. Geografia: o mundo em transição. São Paulo: Ática.",
  ],
  filosofia: [
    "CHAUI, Marilena. Convite à filosofia. São Paulo: Ática.",
    "ARANHA, Maria Lúcia de Arruda; MARTINS, Maria Helena Pires. Filosofando: introdução à filosofia. São Paulo: Moderna.",
  ],
  sociologia: [
    "OLIVEIRA, Pérsio Santos de. Introdução à sociologia. São Paulo: Ática.",
    "TOMAZI, Nelson Dacio (coord.). Sociologia para o ensino médio. São Paulo: Saraiva.",
  ],
  "lingua inglesa": INGLES,
  arte: ARTE,
  "educacao fisica": EDUCACAO_FISICA,
};

/** Os dois livros/obras sugeridos para uma disciplina da etapa (vazio se não houver sugestão). */
export function livrosDaDisciplina(etapa: Etapa, disciplina: string): string[] {
  const tabela = etapa === "fundamental_anos_iniciais" ? INICIAIS : etapa === "fundamental_anos_finais" ? FINAIS : MEDIO;
  return tabela[chaveTexto(disciplina)] ?? [];
}

/** Livros de várias disciplinas juntos, sem repetir, em ordem alfabética (como pede a ABNT). */
export function livrosDasDisciplinas(etapa: Etapa, disciplinas: string[]): string[] {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const d of disciplinas) {
    for (const l of livrosDaDisciplina(etapa, d)) {
      if (vistos.has(l)) continue;
      vistos.add(l);
      saida.push(l);
    }
  }
  return saida.sort((a, b) => a.localeCompare(b, "pt-BR"));
}
