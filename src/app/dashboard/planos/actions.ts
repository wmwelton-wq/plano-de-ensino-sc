"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EtapaPlano } from "@/lib/database.types";
import { prepararCampoParaSalvar } from "@/lib/texto-rico";

export interface EstadoFormulario {
  erro?: string;
}

const ETAPAS_VALIDAS: EtapaPlano[] = [
  "educacao_infantil",
  "fundamental_anos_iniciais",
  "fundamental_anos_finais",
  "ensino_medio",
];

function lerEtapa(formData: FormData): EtapaPlano {
  const valor = formData.get("etapa") as string;
  return (ETAPAS_VALIDAS as string[]).includes(valor) ? (valor as EtapaPlano) : "ensino_medio";
}

function lerVinculo(formData: FormData) {
  const vinculoTipo = formData.get("vinculo_tipo") as string;
  const vinculoId = formData.get("vinculo_id") as string;

  return {
    disciplina_id: vinculoTipo === "disciplina" ? vinculoId : null,
    curso_tecnico_id: vinculoTipo === "curso" ? vinculoId : null,
  };
}

/** Fonte do currículo escolhida no formulário; só gravamos quando o formulário a envia. */
function lerFonteCurriculo(formData: FormData): { fonte_curriculo?: "bncc" | "curriculo_catarinense" } {
  const valor = formData.get("fonte_curriculo");
  return valor === "bncc" || valor === "curriculo_catarinense" ? { fonte_curriculo: valor } : {};
}

function lerHabilidadeIds(formData: FormData) {
  return formData.getAll("habilidade_ids").filter((v): v is string => typeof v === "string" && v.length > 0);
}

function lerCompetenciaIds(formData: FormData) {
  return formData.getAll("competencia_ids").filter((v): v is string => typeof v === "string" && v.length > 0);
}

function lerDisciplinaIds(formData: FormData) {
  return formData.getAll("disciplina_ids").filter((v): v is string => typeof v === "string" && v.length > 0);
}

/**
 * O modelo oficial "PLANO DE AULA DOS ANOS INICIAIS DO ENSINO FUNDAMENTAL"
 * limita o período do plano a, no máximo, 30 dias. Só validamos quando as
 * duas datas foram informadas — os campos continuam opcionais.
 */
function validarPeriodoAnosIniciais(formData: FormData, etapa: EtapaPlano): string | null {
  if (etapa !== "fundamental_anos_iniciais") return null;

  const inicio = formData.get("data_inicio") as string;
  const fim = formData.get("data_fim") as string;
  if (!inicio || !fim) return null;

  const dataInicio = new Date(inicio);
  const dataFim = new Date(fim);
  if (Number.isNaN(dataInicio.getTime()) || Number.isNaN(dataFim.getTime())) return null;

  const diffDias = (dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDias < 0) return "A data de fim não pode ser anterior à data de início.";
  if (diffDias > 30) {
    return "O período do plano não pode ultrapassar 30 dias, conforme o modelo oficial dos Anos Iniciais.";
  }
  return null;
}

async function sincronizarHabilidades(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planoId: string,
  habilidadeIds: string[]
) {
  // RLS em planos_habilidades garante que só é possível vincular habilidades
  // a um plano que pertença ao professor autenticado.
  await supabase.from("planos_habilidades").delete().eq("plano_id", planoId);

  if (habilidadeIds.length > 0) {
    await supabase.from("planos_habilidades").insert(
      habilidadeIds.map((habilidade_id) => ({ plano_id: planoId, habilidade_id }))
    );
  }
}

async function sincronizarCompetencias(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planoId: string,
  competenciaIds: string[]
) {
  // RLS em planos_competencias garante que só é possível vincular competências
  // a um plano que pertença ao professor autenticado.
  await supabase.from("planos_competencias").delete().eq("plano_id", planoId);

  if (competenciaIds.length > 0) {
    await supabase.from("planos_competencias").insert(
      competenciaIds.map((competencia_id) => ({ plano_id: planoId, competencia_id }))
    );
  }
}

async function sincronizarDisciplinas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planoId: string,
  disciplinaIds: string[]
) {
  // RLS em planos_disciplinas garante que só é possível vincular componentes
  // curriculares a um plano que pertença ao professor autenticado.
  await supabase.from("planos_disciplinas").delete().eq("plano_id", planoId);

  if (disciplinaIds.length > 0) {
    await supabase.from("planos_disciplinas").insert(
      disciplinaIds.map((disciplina_id) => ({ plano_id: planoId, disciplina_id }))
    );
  }
}

export async function criarPlano(
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: "Sessão expirada. Faça login novamente." };
  }

  const etapa = lerEtapa(formData);
  const { disciplina_id, curso_tecnico_id } = lerVinculo(formData);
  const disciplinaIds = lerDisciplinaIds(formData);

  if (!disciplina_id && !curso_tecnico_id) {
    return {
      erro:
        etapa === "fundamental_anos_iniciais"
          ? "Selecione ao menos um componente curricular."
          : "Selecione uma disciplina ou um curso técnico.",
    };
  }

  const erroPeriodo = validarPeriodoAnosIniciais(formData, etapa);
  if (erroPeriodo) {
    return { erro: erroPeriodo };
  }

  const quantidadeAulasRaw = formData.get("quantidade_aulas") as string;

  const { data, error } = await supabase
    .from("planos_de_ensino")
    .insert({
      professor_id: user.id,
      disciplina_id,
      curso_tecnico_id,
      etapa,
      escola_id: (formData.get("escola_id") as string) || null,
      ...lerFonteCurriculo(formData),
      grupo_etario: (formData.get("grupo_etario") as string) || null,
      segundo_professor_nome: (formData.get("segundo_professor_nome") as string) || null,
      incluir_logo_estado: formData.get("incluir_logo_estado") === "on",
      incluir_logo_escola: formData.get("incluir_logo_escola") === "on",
      usar_curriculo_digital: formData.get("usar_curriculo_digital") === "on",
      titulo: formData.get("titulo") as string,
      ano_letivo: Number(formData.get("ano_letivo")),
      turma: (formData.get("turma") as string) || null,
      data_inicio: (formData.get("data_inicio") as string) || null,
      data_fim: (formData.get("data_fim") as string) || null,
      quantidade_aulas: quantidadeAulasRaw ? Number(quantidadeAulasRaw) : null,
      objetivos: (formData.get("objetivos") as string) || null,
      conteudos_programaticos: prepararCampoParaSalvar(formData.get("conteudos_programaticos")),
      metodologia: prepararCampoParaSalvar(formData.get("metodologia")),
      avaliacao: prepararCampoParaSalvar(formData.get("avaliacao")),
      instrumentos_avaliacao: prepararCampoParaSalvar(formData.get("instrumentos_avaliacao")),
      cronograma: (formData.get("cronograma") as string) || null,
      referencias: (formData.get("referencias") as string) || null,
      status: (formData.get("status") as string) || "rascunho",
    })
    .select("id")
    .single();

  if (error) {
    return { erro: "Não foi possível salvar o plano. Tente novamente." };
  }

  await sincronizarHabilidades(supabase, data.id, lerHabilidadeIds(formData));
  await sincronizarCompetencias(supabase, data.id, lerCompetenciaIds(formData));
  if (etapa === "fundamental_anos_iniciais") {
    await sincronizarDisciplinas(supabase, data.id, disciplinaIds);
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/planos/${data.id}`);
}

export async function atualizarPlano(
  planoId: string,
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const supabase = await createClient();

  const etapa = lerEtapa(formData);
  const { disciplina_id, curso_tecnico_id } = lerVinculo(formData);
  const disciplinaIds = lerDisciplinaIds(formData);

  if (!disciplina_id && !curso_tecnico_id) {
    return {
      erro:
        etapa === "fundamental_anos_iniciais"
          ? "Selecione ao menos um componente curricular."
          : "Selecione uma disciplina ou um curso técnico.",
    };
  }

  const erroPeriodo = validarPeriodoAnosIniciais(formData, etapa);
  if (erroPeriodo) {
    return { erro: erroPeriodo };
  }

  const quantidadeAulasRaw = formData.get("quantidade_aulas") as string;

  // RLS em planos_de_ensino garante que este UPDATE só afeta uma linha se
  // ela pertencer ao professor autenticado (professor_id = auth.uid()) —
  // um professor nunca consegue alterar o plano de outro.
  const { error } = await supabase
    .from("planos_de_ensino")
    .update({
      disciplina_id,
      curso_tecnico_id,
      etapa,
      escola_id: (formData.get("escola_id") as string) || null,
      ...lerFonteCurriculo(formData),
      grupo_etario: (formData.get("grupo_etario") as string) || null,
      segundo_professor_nome: (formData.get("segundo_professor_nome") as string) || null,
      incluir_logo_estado: formData.get("incluir_logo_estado") === "on",
      incluir_logo_escola: formData.get("incluir_logo_escola") === "on",
      usar_curriculo_digital: formData.get("usar_curriculo_digital") === "on",
      titulo: formData.get("titulo") as string,
      ano_letivo: Number(formData.get("ano_letivo")),
      turma: (formData.get("turma") as string) || null,
      data_inicio: (formData.get("data_inicio") as string) || null,
      data_fim: (formData.get("data_fim") as string) || null,
      quantidade_aulas: quantidadeAulasRaw ? Number(quantidadeAulasRaw) : null,
      objetivos: (formData.get("objetivos") as string) || null,
      conteudos_programaticos: prepararCampoParaSalvar(formData.get("conteudos_programaticos")),
      metodologia: prepararCampoParaSalvar(formData.get("metodologia")),
      avaliacao: prepararCampoParaSalvar(formData.get("avaliacao")),
      instrumentos_avaliacao: prepararCampoParaSalvar(formData.get("instrumentos_avaliacao")),
      cronograma: (formData.get("cronograma") as string) || null,
      referencias: (formData.get("referencias") as string) || null,
      status: (formData.get("status") as string) || "rascunho",
    })
    .eq("id", planoId);

  if (error) {
    return { erro: "Não foi possível salvar as alterações. Tente novamente." };
  }

  await sincronizarHabilidades(supabase, planoId, lerHabilidadeIds(formData));
  await sincronizarCompetencias(supabase, planoId, lerCompetenciaIds(formData));
  if (etapa === "fundamental_anos_iniciais") {
    await sincronizarDisciplinas(supabase, planoId, disciplinaIds);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/planos/${planoId}`);
  redirect(`/dashboard/planos/${planoId}`);
}

export async function excluirPlano(planoId: string) {
  const supabase = await createClient();
  await supabase.from("planos_de_ensino").delete().eq("id", planoId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/**
 * Cria cópias do plano para outras turmas. Cada cópia nasce como rascunho,
 * guarda a referência ao plano de origem (replicado_de_id) e leva junto as
 * habilidades, competências e componentes escolhidos.
 */
export async function replicarPlano(
  planoId: string,
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { erro: "Sessão expirada. Faça login novamente." };
  }

  const turmas = Array.from(
    new Set(
      formData
        .getAll("turmas_destino")
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
    )
  );
  if (turmas.length === 0) {
    return { erro: "Informe ao menos uma turma de destino." };
  }
  if (turmas.length > 30) {
    return { erro: "Replique para no máximo 30 turmas por vez." };
  }

  // O RLS garante que só enxergamos planos do próprio professor.
  const { data: origem } = await supabase.from("planos_de_ensino").select("*").eq("id", planoId).single();
  if (!origem) {
    return { erro: "Plano de origem não encontrado." };
  }

  const [{ data: hab }, { data: comp }, { data: disc }] = await Promise.all([
    supabase.from("planos_habilidades").select("habilidade_id").eq("plano_id", planoId),
    supabase.from("planos_competencias").select("competencia_id").eq("plano_id", planoId),
    supabase.from("planos_disciplinas").select("disciplina_id").eq("plano_id", planoId),
  ]);

  const base: Record<string, unknown> = { ...origem };
  for (const campo of ["id", "created_at", "updated_at", "pdf_path", "pdf_gerado_em"]) {
    delete base[campo];
  }

  let criados = 0;
  for (const turma of turmas) {
    const titulo = origem.titulo.includes(turma) ? origem.titulo : `${origem.titulo} — ${turma}`;
    const { data: novo, error } = await supabase
      .from("planos_de_ensino")
      .insert({
        ...base,
        titulo,
        turma,
        status: "rascunho",
        gerado_por_ia: false,
        replicado_de_id: planoId,
      })
      .select("id")
      .single();

    if (error || !novo) {
      return {
        erro:
          criados > 0
            ? `Foram criados ${criados} plano(s), mas houve falha ao criar o da turma "${turma}". Confira em "Meus planos".`
            : "Não foi possível replicar o plano. Tente novamente.",
      };
    }

    if (hab && hab.length > 0) {
      await supabase
        .from("planos_habilidades")
        .insert(hab.map((h) => ({ plano_id: novo.id, habilidade_id: h.habilidade_id })));
    }
    if (comp && comp.length > 0) {
      await supabase
        .from("planos_competencias")
        .insert(comp.map((c) => ({ plano_id: novo.id, competencia_id: c.competencia_id })));
    }
    if (disc && disc.length > 0) {
      await supabase
        .from("planos_disciplinas")
        .insert(disc.map((d) => ({ plano_id: novo.id, disciplina_id: d.disciplina_id })));
    }
    criados += 1;
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
