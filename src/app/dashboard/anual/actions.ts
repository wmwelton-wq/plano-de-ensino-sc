"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prepararCampoParaSalvar } from "@/lib/texto-rico";
import { normalizarDados, type EtapaAnual } from "@/lib/plano-anual";
import { MARCADOR_HTML } from "@/lib/texto-rico";
import { MESES, conteudosEmHtml, ehUuid, periodoDoMes, repartir } from "@/lib/mensal-do-anual";
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
  redirect("/dashboard/meus-planos");
}

/** Cria cópias do plano anual para outras turmas (e/ou outro ano letivo e escola). O conteúdo vai junto; vira rascunho. */
export async function duplicarPlanoAnual(
  planoId: string,
  _anterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Faça login novamente." };

  const { data: origem } = await supabase.from("planos_anuais").select("*").eq("id", planoId).single();
  if (!origem) return { erro: "Plano de origem não encontrado." };
  const o = origem as Record<string, unknown>;

  const ano = Number(formData.get("ano_letivo"));
  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) return { erro: "Informe um ano letivo válido." };

  const escolaId = uuidOuNulo(formData.get("escola_id"));
  const turmasBrutas = String(formData.get("turmas") ?? "")
    .split(/[\n;]+/)
    .map((t) => t.trim().slice(0, 80))
    .filter(Boolean);
  const turmas = Array.from(new Set(turmasBrutas)).slice(0, 20);
  if (turmas.length === 0) return { erro: "Escreva pelo menos uma turma (uma por linha)." };

  const componente = (o.componente as string | null) ?? "";
  const linhas = turmas.map((turma) => {
    const copia: Record<string, unknown> = { ...o };
    for (const campo of ["id", "created_at", "updated_at"]) delete copia[campo];
    return {
      ...copia,
      professor_id: user.id,
      escola_id: escolaId,
      ano_letivo: ano,
      turma,
      titulo: `Plano de Ensino Anual — ${componente}${turma ? ` — ${turma}` : ""} — ${ano}`,
      status: "rascunho",
      favorito: false,
    };
  });

  const { data, error } = await supabase.from("planos_anuais").insert(linhas).select("id");
  if (error || !data) return { erro: "Não foi possível criar as cópias. Tente novamente." };

  revalidatePath("/dashboard", "layout");
  const ids = (data as { id: string }[]).map((d) => d.id);
  if (ids.length === 1) redirect(`/dashboard/anual/${ids[0]}?salvo=1`);
  redirect(`/dashboard/meus-planos/anuais?copias=${ids.length}`);
}

/** Gera planos MENSAIS (rascunho) a partir de um trimestre do plano anual. */
export async function gerarMensaisDoAnual(
  planoId: string,
  _anterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Faça login novamente." };

  const { data: origem } = await supabase.from("planos_anuais").select("*").eq("id", planoId).single();
  if (!origem) return { erro: "Plano anual não encontrado." };
  const o = origem as {
    escola_id: string | null;
    disciplina_id: string | null;
    etapa: EtapaAnual;
    ano_letivo: number;
    componente: string | null;
    turma: string | null;
    incluir_logo_estado: boolean;
    incluir_logo_escola: boolean;
    competencias_especificas: unknown;
    trimestres: unknown;
    ementa: unknown;
    competencias_gerais: unknown;
  };

  const tri = Number(formData.get("trimestre"));
  if (![0, 1, 2].includes(tri)) return { erro: "Escolha o trimestre." };
  const meses = Array.from(
    new Set(formData.getAll("meses").map(Number).filter((m) => Number.isInteger(m) && m >= 1 && m <= 12))
  ).sort((a, b) => a - b);
  if (meses.length === 0) return { erro: "Marque pelo menos um mês." };
  const dividir = formData.get("modo") === "dividir";

  const dados = normalizarDados(o as unknown as Record<string, unknown>);
  const t = dados.trimestres[tri];
  const habPorMes = dividir ? repartir(t.habilidades, meses.length) : meses.map(() => t.habilidades);
  const objPorMes = dividir ? repartir(t.objetos, meses.length) : meses.map(() => t.objetos);
  const competenciasIds = [...dados.competenciasEspecificas.bncc, ...dados.competenciasEspecificas.curriculo]
    .map((c) => c.id)
    .filter(ehUuid);

  const criados: string[] = [];
  for (let k = 0; k < meses.length; k++) {
    const mes = meses[k];
    const { inicio, fim } = periodoDoMes(o.ano_letivo, mes);
    const habilidades = habPorMes[k];
    const manuais = habilidades
      .filter((h) => !ehUuid(h.id))
      .map((h) => ({ codigo: h.codigo ?? null, descricao: h.texto }));

    const { data, error } = await supabase
      .from("planos_de_ensino")
      .insert({
        professor_id: user.id,
        disciplina_id: o.disciplina_id,
        etapa: o.etapa,
        escola_id: o.escola_id,
        incluir_logo_estado: o.incluir_logo_estado,
        incluir_logo_escola: o.incluir_logo_escola,
        titulo: `Plano mensal — ${o.componente ?? "Componente"}${o.turma ? ` — ${o.turma}` : ""} — ${MESES[mes - 1]}/${o.ano_letivo}`,
        ano_letivo: o.ano_letivo,
        turma: o.turma,
        data_inicio: inicio,
        data_fim: fim,
        habilidades_manuais: manuais,
        conteudos_programaticos: conteudosEmHtml(objPorMes[k].map((x) => x.texto), MARCADOR_HTML),
        status: "rascunho",
      })
      .select("id")
      .single();
    if (error || !data) return { erro: "Não foi possível criar todos os planos mensais. Confira a lista em Meus planos." };
    const novoId = (data as { id: string }).id;
    criados.push(novoId);

    const habIds = habilidades.map((h) => h.id).filter(ehUuid);
    if (habIds.length > 0) {
      await supabase.from("planos_habilidades").insert(habIds.map((habilidade_id) => ({ plano_id: novoId, habilidade_id })));
    }
    if (competenciasIds.length > 0) {
      await supabase
        .from("planos_competencias")
        .insert(competenciasIds.map((competencia_id) => ({ plano_id: novoId, competencia_id })));
    }
    if (o.etapa === "fundamental_anos_iniciais" && o.disciplina_id) {
      await supabase.from("planos_disciplinas").insert({ plano_id: novoId, disciplina_id: o.disciplina_id });
    }
  }

  revalidatePath("/dashboard", "layout");
  if (criados.length === 1) redirect(`/dashboard/planos/${criados[0]}`);
  redirect(`/dashboard/meus-planos/mensais?novos=${criados.length}`);
}
