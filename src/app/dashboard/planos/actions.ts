"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EtapaPlano } from "@/lib/database.types";

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
      grupo_etario: (formData.get("grupo_etario") as string) || null,
      segundo_professor_nome: (formData.get("segundo_professor_nome") as string) || null,
      incluir_logo_estado: formData.get("incluir_logo_estado") === "on",
      usar_curriculo_digital: formData.get("usar_curriculo_digital") === "on",
      titulo: formData.get("titulo") as string,
      ano_letivo: Number(formData.get("ano_letivo")),
      turma: (formData.get("turma") as string) || null,
      data_inicio: (formData.get("data_inicio") as string) || null,
      data_fim: (formData.get("data_fim") as string) || null,
      quantidade_aulas: quantidadeAulasRaw ? Number(quantidadeAulasRaw) : null,
      objetivos: (formData.get("objetivos") as string) || null,
      conteudos_programaticos: (formData.get("conteudos_programaticos") as string) || null,
      metodologia: (formData.get("metodologia") as string) || null,
      avaliacao: (formData.get("avaliacao") as string) || null,
      instrumentos_avaliacao: (formData.get("instrumentos_avaliacao") as string) || null,
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
      grupo_etario: (formData.get("grupo_etario") as string) || null,
      segundo_professor_nome: (formData.get("segundo_professor_nome") as string) || null,
      incluir_logo_estado: formData.get("incluir_logo_estado") === "on",
      usar_curriculo_digital: formData.get("usar_curriculo_digital") === "on",
      titulo: formData.get("titulo") as string,
      ano_letivo: Number(formData.get("ano_letivo")),
      turma: (formData.get("turma") as string) || null,
      data_inicio: (formData.get("data_inicio") as string) || null,
      data_fim: (formData.get("data_fim") as string) || null,
      quantidade_aulas: quantidadeAulasRaw ? Number(quantidadeAulasRaw) : null,
      objetivos: (formData.get("objetivos") as string) || null,
      conteudos_programaticos: (formData.get("conteudos_programaticos") as string) || null,
      metodologia: (formData.get("metodologia") as string) || null,
      avaliacao: (formData.get("avaliacao") as string) || null,
      instrumentos_avaliacao: (formData.get("instrumentos_avaliacao") as string) || null,
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
