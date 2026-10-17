// Recomposição das aprendizagens (planos mensais): o professor de Língua Portuguesa ou de Matemática pode
// retomar habilidades e conteúdos de anos/etapas anteriores. Aqui ficam os tipos e as funções puras que
// organizam as listas do currículo por nível (Anos Iniciais, Anos Finais, Ensino Médio) e por ano/série.

export type NivelRecomposicao = "iniciais" | "finais" | "medio";
export type ComponenteRecomposicao = "portugues" | "matematica";

export interface InfoNivel {
  id: NivelRecomposicao;
  rotulo: string;
  resumo: string;
  anos: number[];
  /** "3º ano", "2ª série"... */
  rotuloAno: (ano: number) => string;
  /** Rótulos de etapa usados na tabela de disciplinas/habilidades (o Médio tem duas grafias no banco). */
  etapas: string[];
}

export const NIVEIS: InfoNivel[] = [
  {
    id: "iniciais",
    rotulo: "Anos iniciais do Ensino Fundamental",
    resumo: "1º ao 5º ano",
    anos: [1, 2, 3, 4, 5],
    rotuloAno: (a) => `${a}º ano`,
    etapas: ["Ensino Fundamental - Anos Iniciais"],
  },
  {
    id: "finais",
    rotulo: "Anos finais do Ensino Fundamental",
    resumo: "6º ao 9º ano",
    anos: [6, 7, 8, 9],
    rotuloAno: (a) => `${a}º ano`,
    etapas: ["Ensino Fundamental - Anos Finais"],
  },
  {
    id: "medio",
    rotulo: "Ensino Médio",
    resumo: "1ª a 3ª série",
    anos: [1, 2, 3],
    rotuloAno: (a) => `${a}ª série`,
    etapas: ["Ensino Médio", "ensino_medio"],
  },
];

export const infoNivel = (id: NivelRecomposicao): InfoNivel => NIVEIS.find((n) => n.id === id) ?? NIVEIS[0];

/** Habilidade como vem do currículo (só as colunas que a recomposição usa). */
export interface HabilidadeRecomposicao {
  id: string;
  codigo: string | null;
  descricao: string;
  ano_serie: string | null;
  objeto_conhecimento: string | null;
  conteudos: string | null;
  fonte: string;
}

export interface ObjetoMedioRecomposicao {
  serie: number;
  objeto: string;
  conteudos: string | null;
}

export interface DadosRecomposicao {
  habilidades: HabilidadeRecomposicao[];
  objetosMedio: ObjetoMedioRecomposicao[];
  erro?: string;
}

function semAcento(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Só Língua Portuguesa e Matemática têm recomposição; devolve qual dos dois (ou null). */
export function componenteDeRecomposicao(nome: string | null | undefined): ComponenteRecomposicao | null {
  const n = semAcento(nome ?? "");
  if (n === "portugues" || n.startsWith("lingua portuguesa")) return "portugues";
  if (n === "matematica") return "matematica";
  return null;
}

/** "6º ano" -> [6]; "6º e 7º anos" -> [6, 7]; "6º ao 9º ano" -> [6, 7, 8, 9]. */
export function anosDoRotulo(rotulo: string | null): number[] {
  if (!rotulo) return [];
  const numeros = Array.from(rotulo.matchAll(/(\d+)\s*[ºª°]/g)).map((m) => Number(m[1]));
  if (numeros.length === 0) return [];
  if (numeros.length >= 2 && /\s(a|ao|até)\s/i.test(rotulo)) {
    const anos: number[] = [];
    for (let a = numeros[0]; a <= numeros[numeros.length - 1]; a++) anos.push(a);
    return anos;
  }
  return numeros;
}

/** "Unidade Temática: Objeto" -> "Objeto". */
function nomeDoObjeto(objeto: string): string {
  const i = objeto.indexOf(": ");
  return (i >= 0 ? objeto.slice(i + 2) : objeto).trim();
}

/** Quebra o texto de conteúdos em itens, tirando o marcador "• ". */
export function itensDeConteudo(texto: string | null | undefined): string[] {
  if (!texto) return [];
  return texto
    .split("\n")
    .map((l) => l.replace(/^[\s•\-–*]+/, "").trim())
    .filter((l) => l.length > 0);
}

function semRepetidos(itens: string[]): string[] {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const i of itens) {
    const k = semAcento(i);
    if (!vistos.has(k)) {
      vistos.add(k);
      saida.push(i);
    }
  }
  return saida;
}

/** Habilidades do ano escolhido, sem repetir o mesmo código, em ordem de código. No Médio não há ano: vêm todas. */
export function habilidadesDoAno(nivel: NivelRecomposicao, ano: number, dados: DadosRecomposicao): HabilidadeRecomposicao[] {
  const doAno = dados.habilidades.filter((h) => nivel === "medio" || anosDoRotulo(h.ano_serie).includes(ano));
  const vistos = new Set<string>();
  const lista: HabilidadeRecomposicao[] = [];
  for (const h of doAno) {
    const chave = h.codigo ? semAcento(h.codigo) : semAcento(h.descricao).slice(0, 80);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    lista.push(h);
  }
  return lista.sort((a, b) => (a.codigo ?? "￿").localeCompare(b.codigo ?? "￿", "pt-BR", { numeric: true }));
}

export interface ObjetoRecomposicao {
  /** Nome do objeto de conhecimento (sem a unidade temática). */
  objeto: string;
  conteudos: string[];
}

/** Objetos de conhecimento do ano escolhido (com os conteúdos sugeridos), em ordem alfabética. */
export function objetosDoAno(nivel: NivelRecomposicao, ano: number, dados: DadosRecomposicao): ObjetoRecomposicao[] {
  const mapa = new Map<string, ObjetoRecomposicao>();
  const juntar = (nome: string, conteudos: string[]) => {
    const limpo = nome.trim();
    if (!limpo) return;
    const chave = semAcento(limpo);
    const atual = mapa.get(chave);
    if (atual) atual.conteudos = semRepetidos([...atual.conteudos, ...conteudos]);
    else mapa.set(chave, { objeto: limpo, conteudos: semRepetidos(conteudos) });
  };

  if (nivel === "medio") {
    for (const o of dados.objetosMedio) {
      if (o.serie === ano) juntar(o.objeto, itensDeConteudo(o.conteudos));
    }
  } else {
    for (const h of dados.habilidades) {
      if (!h.objeto_conhecimento || !anosDoRotulo(h.ano_serie).includes(ano)) continue;
      // Na BNCC uma linha pode reunir vários objetos, separados por " | ".
      const partes = h.fonte === "bncc" ? h.objeto_conhecimento.split(" | ") : [h.objeto_conhecimento];
      for (const p of partes) juntar(nomeDoObjeto(p), itensDeConteudo(h.conteudos));
    }
  }
  return reunirObjetosRepetidos(Array.from(mapa.values())).sort((a, b) =>
    a.objeto.localeCompare(b.objeto, "pt-BR", { sensitivity: "base" })
  );
}

/** Texto sem acento/maiúscula e com cada palavra reduzida (singular, 6 letras) para comparar nomes quase iguais. */
function chaveDeParte(t: string): string {
  return semAcento(t)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.replace(/s$/, "").slice(0, 6))
    .join(" ");
}

/** "A / B / C" (ou "A/ B") -> partes comparáveis [a, b, c]. */
function partesDoNome(objeto: string): string[] {
  return objeto.split(/\s*\/\s+|\s+\/\s*/).map(chaveDeParte).filter(Boolean);
}

/**
 * O currículo traz, para o mesmo ano, um objeto "reunido" (ex.: "Compreensão em leitura / Pesquisa") e também cada
 * parte solta ("Compreensão em leitura"), repetindo os mesmos conteúdos. Mostramos só o reunido, com os conteúdos
 * de todos juntos: nada se perde, mas não há mais itens repetidos nem caixinhas que se confundem.
 */
function reunirObjetosRepetidos(objetos: ObjetoRecomposicao[]): ObjetoRecomposicao[] {
  const info = objetos.map((o) => ({ o, partes: partesDoNome(o.objeto) }));
  const destino = new Map<number, number>();
  info.forEach((a, ia) => {
    if (a.partes.length === 0) return;
    let melhor = -1;
    info.forEach((b, ib) => {
      if (ia === ib || !a.partes.every((p) => b.partes.includes(p))) return;
      const maior = b.partes.length > a.partes.length;
      const igualMaisCanonico = b.partes.length === a.partes.length && b.o.objeto < a.o.objeto;
      if (!maior && !igualMaisCanonico) return;
      if (melhor === -1 || b.partes.length > info[melhor].partes.length) melhor = ib;
    });
    if (melhor !== -1) destino.set(ia, melhor);
  });
  if (destino.size === 0) return objetos;
  // Segue a cadeia até o objeto que fica (um objeto pode apontar para outro que também foi reunido).
  const final = (i: number): number => (destino.has(i) ? final(destino.get(i) as number) : i);
  const extras = new Map<number, string[]>();
  destino.forEach((_, ia) => {
    const f = final(ia);
    extras.set(f, [...(extras.get(f) ?? []), ...info[ia].o.conteudos]);
  });
  return info
    .map((x, i) => ({ x, i }))
    .filter(({ i }) => !destino.has(i))
    .map(({ x, i }) => ({ objeto: x.o.objeto, conteudos: semRepetidos([...x.o.conteudos, ...(extras.get(i) ?? [])]) }));
}

/** Linha que a caixinha de uma habilidade escreve no campo de texto. */
export function linhaDaHabilidade(h: HabilidadeRecomposicao): string {
  return h.codigo ? `(${h.codigo}) ${h.descricao}` : h.descricao;
}
