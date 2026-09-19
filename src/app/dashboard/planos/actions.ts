"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface EstadoFormulario {
  erro?: string;
}

function lerVinculo(formData: FormData) {
  const vinculoTipo = formData.get("vinculo_tipo") as string;
  const vinculoId = formData.get("vinculo_id") as string;

  return {
    disciplina_id: vinculoTipo === "disciplina" ? vinculoId : null,
    curso_tecnico_id: vinculoTipo === "curso" ? vinculoId : null,
  };
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

  const { disciplina_id, curso_tecnico_id } = lerVinculo(formData);

  if (!disciplina_id && !curso_tecnico_id) {
    return { erro: "Selecione uma disciplina ou um curso técnico." };
  }

  const { data, error } = await supabase
    .from("planos_de_ensino")
    .insert({
      professor_id: user.id,
      disciplina_id,
      curso_tecnico_id,
      titulo: formData.get("titulo") as string,
      ano_letivo: Number(formData.get("ano_letivo")),
      turma: (formData.get("turma") as string) || null,
      objetivos: (formData.get("objetivos") as string) || null,
      conteudos_programaticos: (formData.get("conteudos_programaticos") as string) || null,
      metodologia: (formData.get("metodologia") as string) || null,
      avaliacao: (formData.get("avaliacao") as string) || null,
      cronograma: (formData.get("cronograma") as string) || null,
      status: (formData.get("status") as string) || "rascunho",
    })
    .select("id")
    .single();

  if (error) {
    return { erro: "Não foi possível salvar o plano. Tente novamente." };
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

  const { disciplina_id, curso_tecnico_id } = lerVinculo(formData);

  if (!disciplina_id && !curso_tecnico_id) {
    return { erro: "Selecione uma disciplina ou um curso técnico." };
  }

  const { error } = await supabase
    .from("planos_de_ensino")
    .update({
      disciplina_id,
      curso_tecnico_id,
      titulo: formData.get("titulo") as string,
      ano_letivo: Number(formData.get("ano_letivo")),
      turma: (formData.get("turma") as string) || null,
      objetivos: (formData.get("objetivos") as string) || null,
      conteudos_programaticos: (formData.get("conteudos_programaticos") as string) || null,
      metodologia: (formData.get("metodologia") as string) || null,
      avaliacao: (formData.get("avaliacao") as string) || null,
      cronograma: (formData.get("cronograma") as string) || null,
      status: (formData.get("status") as string) || "rascunho",
    })
    .eq("id", planoId);

  if (error) {
    return { erro: "Não foi possível salvar as alterações. Tente novamente." };
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
