// Plano dos Anos Iniciais com vários componentes curriculares: cada componente
// tem a sua própria seção (como no modelo em PDF), com os textos que o professor
// escreve separados por componente.

/** Textos de um componente curricular dentro do plano (HTML do editor, já gravado). */
export interface SecaoComponente {
  disciplina_id: string;
  conteudos?: string | null;
  metodologia?: string | null;
  criterios?: string | null;
  instrumentos?: string | null;
  recomposicao_objetos?: string | null;
  recomposicao_habilidades?: string | null;
}

/** Campos de cada seção, com o prefixo usado nos campos do formulário (`sec_<campo>__<id do componente>`). */
export const CAMPOS_SECAO = [
  "conteudos",
  "metodologia",
  "criterios",
  "instrumentos",
  "recomposicao_objetos",
  "recomposicao_habilidades",
] as const;
export type CampoSecao = (typeof CAMPOS_SECAO)[number];

export const nomeCampoSecao = (campo: CampoSecao, disciplinaId: string) => `sec_${campo}__${disciplinaId}`;

const ORDEM_PADRAO = [
  "língua portuguesa",
  "português",
  "matemática",
  "ciências",
  "história",
  "geografia",
  "arte",
  "educação física",
  "ensino religioso",
  "língua inglesa",
];

function chaveOrdem(nome: string): number {
  const i = ORDEM_PADRAO.indexOf(nome.trim().toLowerCase());
  return i >= 0 ? i : ORDEM_PADRAO.length;
}

/** Ordem dos componentes no plano: Português, Matemática, Ciências, História, Geografia... (como no modelo). */
export function ordenarComponentes<T extends { nome: string }>(lista: T[]): T[] {
  return [...lista].sort(
    (a, b) => chaveOrdem(a.nome) - chaveOrdem(b.nome) || a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );
}

/** Lê com segurança o JSON gravado no banco. */
export function lerSecoes(valor: unknown): SecaoComponente[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter(
    (s): s is SecaoComponente => typeof s === "object" && s !== null && typeof (s as SecaoComponente).disciplina_id === "string"
  );
}
