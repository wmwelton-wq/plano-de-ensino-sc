"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prepararCampoParaSalvar } from "@/lib/texto-rico";
import { normalizarDados, type EtapaAnual } from "@/lib/plano-anual";
import type { EstadoFormulario } from "../planos/actions";

const ETAPAS: EtapaAnual[] = ["fundamental_anos_iniciais", "fundamental_anos_finais", "ensino_medio"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Limite de segurança do conteúdo (a plataforma aceita corpos de até ~4 MB). */
const LIMITE_CARACTERES = 3_700_000;

function txt(formData: FormData, campo: string, max: number): string | null {
  const v = formData.get(campo);
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t.length > 0 ? t : null;
}

function uuidOuNulo(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" && UUID.test(v) ? v : null;
}

/** Lê e valida os campos do formulário. Devolve o objeto pronto para gravar ou uma mensagem de erro. */
function lerFormulario(formData: FormData): { erro: string } | { valores: Record<string, unknown> } {
  const etapaBruta = formData.get("etapa");
  const etapa = (ETAPAS as string[]).includes(String(etapaBruta)) ? (etapaBruta as EtapaAnual) : null;
  if (!etapa) return { erro: "Escolha a etapa de ensino." };

  const componente = txt(formData, "componente", 200);
  if (!componente) return { erro: "Informe o componente curricular (disciplina)." };

  const ano = Number(formData.get("ano_letivo"));
  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) return { erro: "Informe um ano letivo válido." };

  let bruto: unknown = {};
  const dadosTexto = formData.get("dados");
  if (typeof dadosTexto === "string" && dadosTexto.length > 0) {
    if (dadosTexto.length > LIMITE_CARACTERES) return { erro: "As listas escolhidas ficaram grandes demais." };
    try {
      bruto = JSON.parse(dadosTexto);
    } catch {
      return { erro: "Não foi possível ler as listas escolhidas. Recarregue a página e tente de novo." };
    }
  }
  const dados = normalizarDados((bruto ?? {}) as Record<string, unknown>);

  const textoLivre = prepararCampoParaSalvar(formData.get("texto_livre"));
  if (textoLivre && textoLivre.length > LIMITE_CARACTERES) {
    return { erro: "O texto livre está grande demais (provavelmente por causa das imagens). Reduza ou remova algumas imagens." };
  }

  const turma = txt(formData, "turma", 80);
  const tituloDigitado = txt(formData, "titulo", 200);
  const titulo = tituloDigitado ?? `Plano de Ensino Anual — ${componente}${turma ? ` — ${turma}` : ""} — ${ano}`;

  const disciplinaId = uuidOuNulo(formData.get("disciplina_id"));
  const status = formData.get("status") === "finalizado" ? "finalizado" : "rascunho";

  return {
    valores: {
      escola_id: uuidOuNulo(formData.get("escola_id")),
      disciplina_id: disciplinaId,
      etapa,
      titulo,
      ano_letivo: ano,
      componente,
      area: txt(formData, "area", 200),
      turma,
      turno: txt(formData, "turno", 40),
      docente: txt(formData, "docente", 200),
      formacao: txt(formData, "formacao", 300),
      incluir_logo_estado: formData.get("incluir_logo_estado") === "on",
      incluir_logo_escola: formData.get("incluir_logo_escola") === "on",
      ementa: dados.ementa,
      competencias_gerais: dados.competenciasGerais,
      competencias_especificas: dados.competenciasEspecificas,
      trimestres: dados.trimestres,
      texto_livre: textoLivre,
      status,
    },
  };
}

export async function criarPlanoAnual(_anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Faça login novamente." };

  const lido = lerFormulario(formData);
  if ("erro" in lido) return { erro: lido.erro };

  const { data, error } = await supabase
    .from("planos_anuais")
    .insert({ professor_id: user.id, ...lido.valores })
    .select("id")
    .single();

  if (error || !data) return { erro: "Não foi possível salvar o plano anual. Tente novamente." };

  revalidatePath("/dashboard");
  redirect(`/dashboard/anual/${(data as { id: string }).id}?salvo=1`);
}

export async function atualizarPlanoAnual(
  planoId: string,
  _anterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const supabase = await createClient();
  const lido = lerFormulario(formData);
  if ("erro" in lido) return { erro: lido.erro };

  const { error } = await supabase
    .from("planos_anuais")
    .update({ ...lido.valores, updated_at: new Date().toISOString() })
    .eq("id", planoId);

  if (error) return { erro: "Não foi possível salvar as alterações. Tente novamente." };

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/anual/${planoId}`);
  redirect(`/dashboard/anual/${planoId}?salvo=1`);
}

export async function excluirPlanoAnual(planoId: string) {
  const supabase = await createClient();
  await supabase.from("planos_anuais").delete().eq("id", planoId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
