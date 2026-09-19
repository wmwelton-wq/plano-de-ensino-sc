// Tipos TypeScript que espelham o schema criado no Supabase.
// (Pode futuramente ser gerado automaticamente via `supabase gen types typescript`.)

export type Fonte = "bncc" | "curriculo_catarinense" | "matriz_curso_tecnico";
export type TipoCurso = "itinerario_integrado" | "cedup_concomitante_subsequente";
export type StatusPlano = "rascunho" | "finalizado";

export interface Professor {
  id: string;
  nome: string;
  email: string;
  escola: string | null;
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

export interface HabilidadeCurricular {
  id: string;
  codigo: string | null;
  descricao: string;
  fonte: Fonte;
  disciplina_id: string | null;
  curso_tecnico_id: string | null;
  created_at: string;
}

export interface PlanoDeEnsino {
  id: string;
  professor_id: string;
  disciplina_id: string | null;
  curso_tecnico_id: string | null;
  titulo: string;
  ano_letivo: number;
  turma: string | null;
  objetivos: string | null;
  conteudos_programaticos: string | null;
  metodologia: string | null;
  avaliacao: string | null;
  cronograma: string | null;
  status: StatusPlano;
  created_at: string;
  updated_at: string;
}
