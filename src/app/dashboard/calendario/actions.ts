"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SEM_AULA_PADRAO, type TipoEvento } from "@/lib/feriados";

export interface EstadoEvento {
  erro?: string;
  ok?: boolean;
}

const TIPOS = Object.keys(SEM_AULA_PADRAO) as TipoEvento[];
const DATA = /^\d{4}-\d{2}-\d{2}$/;

function dataValida(v: string): boolean {
  if (!DATA.test(v)) return false;
  const [a, m, d] = v.split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1, d));
  return t.getUTCFullYear() === a && t.getUTCMonth() === m - 1 && t.getUTCDate() === d && a >= 2000 && a <= 2100;
}

function texto(formData: FormData, nome: string, max: number): string {
  const v = formData.get(nome);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Confere que a escola existe e é do professor (a regra de segurança do banco já esconde as dos outros). */
async function escolaValida(supabase: Awaited<ReturnType<typeof createClient>>, escolaId: string | null): Promise<boolean> {
  if (!escolaId) return true;
  const { data } = await supabase.from("escolas").select("id").eq("id", escolaId).maybeSingle();
  return Boolean(data);
}

/** Cria ou edita um evento do calendário do professor. */
export async function salvarEvento(_anterior: EstadoEvento, formData: FormData): Promise<EstadoEvento> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Faça login novamente." };

  const id = texto(formData, "id", 60);
  const titulo = texto(formData, "titulo", 120);
  const tipoBruto = texto(formData, "tipo", 20) as TipoEvento;
  const inicio = texto(formData, "data_inicio", 10);
  const fim = texto(formData, "data_fim", 10) || inicio;
  const observacao = texto(formData, "observacao", 500) || null;
  const escolaId = texto(formData, "escola_id", 60) || null;

  if (!(await escolaValida(supabase, escolaId))) return { erro: "Escolha uma escola da sua lista." };
  if (!titulo) return { erro: "Escreva o nome do evento." };
  if (!TIPOS.includes(tipoBruto)) return { erro: "Escolha o tipo do evento." };
  if (!dataValida(inicio) || !dataValida(fim)) return { erro: "Confira as datas." };
  if (fim < inicio) return { erro: "A data final não pode ser antes da inicial." };
  if ((Date.parse(fim) - Date.parse(inicio)) / 86400000 > 400) return { erro: "O período é longo demais (máximo de pouco mais de um ano)." };

  const registro = {
    titulo,
    tipo: tipoBruto,
    sem_aula: formData.get("sem_aula") === "on",
    data_inicio: inicio,
    data_fim: fim,
    observacao,
    escola_id: escolaId,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("calendario_eventos").update(registro).eq("id", id);
    if (error) return { erro: "Não foi possível salvar. Tente novamente." };
  } else {
    const { error } = await supabase.from("calendario_eventos").insert({ ...registro, professor_id: user.id });
    if (error) return { erro: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/dashboard/calendario");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Salva vários eventos de uma vez (usado depois de revisar o que a IA leu do PDF do calendário). */
export async function salvarEventosEmLote(
  eventos: { titulo: string; tipo: TipoEvento; sem_aula: boolean; data_inicio: string; data_fim: string }[],
  escolaId: string
): Promise<EstadoEvento> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Faça login novamente." };
  if (!escolaId || !(await escolaValida(supabase, escolaId))) return { erro: "Escolha para qual escola é este calendário." };
  if (!Array.isArray(eventos) || eventos.length === 0) return { erro: "Não há datas para salvar." };
  if (eventos.length > 150) return { erro: "São datas demais de uma vez (máximo de 150)." };

  const linhas = [];
  for (const e of eventos) {
    const titulo = String(e.titulo ?? "").trim().slice(0, 120);
    const inicio = String(e.data_inicio ?? "");
    const fim = String(e.data_fim ?? "") || inicio;
    if (!titulo || !TIPOS.includes(e.tipo) || !dataValida(inicio) || !dataValida(fim) || fim < inicio) continue;
    linhas.push({
      professor_id: user.id,
      escola_id: escolaId,
      titulo,
      tipo: e.tipo,
      sem_aula: !!e.sem_aula,
      data_inicio: inicio,
      data_fim: fim,
      origem: "pdf" as const,
    });
  }
  if (linhas.length === 0) return { erro: "Nenhuma data válida para salvar." };

  const { error } = await supabase.from("calendario_eventos").insert(linhas);
  if (error) return { erro: "Não foi possível salvar as datas. Tente novamente." };

  revalidatePath("/dashboard/calendario");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function excluirEvento(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("calendario_eventos").delete().eq("id", id);
  revalidatePath("/dashboard/calendario");
  revalidatePath("/dashboard");
}

/**
 * Apaga datas do calendário em bloco (útil na virada do ano letivo).
 *  - "escola": todas as datas da escola informada (as datas gerais ficam);
 *  - "gerais": só as datas gerais (sem escola);
 *  - "todos":  tudo, de todas as escolas e as gerais.
 * Só mexe nas datas do próprio professor (a regra de acesso do banco também confere isso).
 */
export async function excluirCalendario(escopo: "escola" | "gerais" | "todos", escolaId?: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  let consulta = supabase.from("calendario_eventos").delete().eq("professor_id", user.id);
  if (escopo === "escola") {
    if (!escolaId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(escolaId)) return;
    consulta = consulta.eq("escola_id", escolaId);
  } else if (escopo === "gerais") {
    consulta = consulta.is("escola_id", null);
  } else if (escopo !== "todos") {
    return;
  }
  await consulta;
  revalidatePath("/dashboard/calendario");
  revalidatePath("/dashboard");
}

/** O professor escolhe se quer usar o calendário (agenda no painel e ajuda dentro dos planos). */
export async function definirCalendario(ativo: boolean): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("professores").update({ calendario_ativo: ativo }).eq("id", user.id);
  revalidatePath("/dashboard/calendario");
  revalidatePath("/dashboard");
}

/** Quantos calendários com IA o professor ainda pode enviar (6 no primeiro mês de uso; depois, 1 por mês). */
export interface CotaCalendarioIA {
  ilimitado: boolean;
  periodo: "primeiro_mes" | "mensal" | "ilimitado";
  limite: number | null;
  usados: number;
  restantes: number | null;
  liberacao?: string | null;
}

export async function cotaCalendarioIA(): Promise<CotaCalendarioIA | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("calendario_cota");
  if (error || !data) return null;
  return data as CotaCalendarioIA;
}

type EventoPlano = { id: string; titulo: string; tipo: TipoEvento; sem_aula: boolean; data_inicio: string; data_fim: string };

/**
 * Datas do calendário do professor dentro de um período (usado ao montar o plano). Cada escola tem o seu calendário:
 * com a escola do plano vêm as datas dela mais as "gerais" (sem escola, que valem para todas). Sem escola escolhida,
 * vêm só as gerais. Devolve ativo=false se ele não ligou o calendário.
 */
export async function eventosDoPeriodo(
  inicio: string,
  fim: string,
  escolaId?: string | null
): Promise<{ ativo: boolean; eventos: EventoPlano[]; escolaNecessaria: boolean }> {
  const vazio = { ativo: false, eventos: [] as EventoPlano[], escolaNecessaria: false };
  if (!dataValida(inicio) || !dataValida(fim) || fim < inicio || (Date.parse(fim) - Date.parse(inicio)) / 86400000 > 400) return vazio;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return vazio;
  const { data: prof } = await supabase.from("professores").select("calendario_ativo").eq("id", user.id).single();
  if ((prof as { calendario_ativo?: boolean | null } | null)?.calendario_ativo !== true) return vazio;
  const idEscola = escolaId && /^[0-9a-f-]{36}$/i.test(escolaId) ? escolaId : null;
  let consulta = supabase
    .from("calendario_eventos")
    .select("id, titulo, tipo, sem_aula, data_inicio, data_fim")
    .lte("data_inicio", fim)
    .gte("data_fim", inicio)
    .order("data_inicio")
    .limit(80);
  consulta = idEscola ? consulta.or(`escola_id.is.null,escola_id.eq.${idEscola}`) : consulta.is("escola_id", null);
  const { data } = await consulta;
  let escolaNecessaria = false;
  if (!idEscola) {
    const { count } = await supabase.from("calendario_eventos").select("id", { count: "exact", head: true }).not("escola_id", "is", null);
    escolaNecessaria = (count ?? 0) > 0;
  }
  return { ativo: true, eventos: (data ?? []) as EventoPlano[], escolaNecessaria };
}
