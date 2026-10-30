// Tipos TypeScript que espelham o schema criado no Supabase.
// (Pode futuramente ser gerado automaticamente via `supabase gen types typescript`.)

export type Fonte =
  | "bncc"
  | "curriculo_catarinense"
  | "matriz_curso_tecnico"
  | "curriculo_educacao_digital";
export type TipoCurso = "itinerario_integrado" | "cedup_concomitante_subsequente";
export type StatusPlano = "rascunho" | "finalizado";
export type EtapaPlano =
  | "educacao_infantil"
  | "fundamental_anos_iniciais"
  | "fundamental_anos_finais"
  | "ensino_medio";

export interface Professor {
  id: string;
  nome: string;
  email: string;
  escola: string | null;
  role: "professor" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Disciplina {
  id: string;
  nome: string;
  area: string | null;
  etapa: string | null;
  created_at: string;
}

export interface CursoTecnico {
  id: string;
  nome: string;
  tipo: TipoCurso;
  eixo_tecnologico: string | null;
  created_at: string;
}

export interface Escola {
  id: string;
  professor_id: string;
  nome: string;
  municipio: string;
  logo_url: string | null;
  /** Imagem personalizada (lado esquerdo) do cabeçalho dos planos. */
  imagem_esquerda_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabilidadeCurricular {
  id: string;
  codigo: string | null;
  descricao: string;
  fonte: Fonte;
  disciplina_id: string | null;
  curso_tecnico_id: string | null;
  version_id: string | null;
  etapa: string | null;
  area: string | null;
  ano_serie: string | null;
  unidade_tematica: string | null;
  objeto_conhecimento: string | null;
  /** Conteúdos sugeridos (Currículo Catarinense), um item por linha iniciado por "• ". */
  conteudos?: string | null;
  validado: boolean;
  created_at: string;
}

/** Objeto de conhecimento do Ensino Médio, por disciplina e série (1 a 3). */
export interface ObjetoConhecimentoMedio {
  id: string;
  disciplina_id: string;
  serie: number;
  objeto: string;
  /** Conteúdos sugeridos, um por linha iniciado por "• ". */
  conteudos: string | null;
  created_at: string;
  /** Habilidades sugeridas para o objeto (aproximação a partir do Caderno 2); vem junto na consulta. */
  habilidade_objeto_medio?: { habilidade_id: string }[] | null;
}

export interface CompetenciaCurricular {
  id: string;
  numero: number;
  titulo: string | null;
  descricao: string;
  area: string | null;
  disciplina_id: string | null;
  etapa: string | null;
  fonte: string;
  created_at: string;
}

/** Habilidade digitada à mão pelo professor (fora das listas oficiais). */
export interface HabilidadeManual {
  codigo: string | null;
  descricao: string;
}

export interface PlanoDeEnsino {
  id: string;
  professor_id: string;
  disciplina_id: string | null;
  curso_tecnico_id: string | null;
  escola_id: string | null;
  etapa: EtapaPlano;
  grupo_etario: string | null;
  segundo_professor_nome: string | null;
  /** Brasão do Estado de Santa Catarina no cabeçalho. */
  incluir_logo_estado: boolean;
  /** Logo/brasão da escola no cabeçalho (o espaço fica reservado do lado oposto ao brasão do Estado). */
  incluir_logo_escola: boolean;
  usar_curriculo_digital: boolean;
  /** Anos Iniciais: textos de cada componente curricular (conteúdos, metodologia, critérios, instrumentos, recomposição). */
  secoes_componentes?: import("./secoes-componentes").SecaoComponente[] | null;
  /** Habilidades do currículo de educação digital digitadas manualmente. */
  habilidades_manuais: HabilidadeManual[] | null;
  titulo: string;
  ano_letivo: number;
  turma: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  quantidade_aulas: number | null;
  contexto_turma: string | null;
  objetivos: string | null;
  conteudos_programaticos: string | null;
  metodologia: string | null;
  avaliacao: string | null;
  instrumentos_avaliacao: string | null;
  cronograma: string | null;
  referencias: string | null;
  status: StatusPlano;
  pdf_path: string | null;
  pdf_gerado_em: string | null;
  gerado_por_ia: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanoHabilidade {
  plano_id: string;
  habilidade_id: string;
}

export interface PlanoCompetencia {
  plano_id: string;
  competencia_id: string;
}

/** Componentes curriculares vinculados a um plano interdisciplinar (Fundamental Anos Iniciais). */
export interface PlanoDisciplina {
  plano_id: string;
  disciplina_id: string;
}
