"use server";

import { createClient } from "@/lib/supabase/server";
import { chamarIA } from "@/lib/ia/provedores";
import {
  SISTEMA_METODOLOGIA,
  montarPromptContinuacao,
  montarPromptMetodologia,
  normalizarDivisao,
  paragrafosComTitulo,
  quantidadeDePartes,
  textosDaResposta,
  type DadosMetodologia,
} from "@/lib/ia/metodologia";
import type { ContextoIA } from "./metodologia-ia";

export type ResultadoMetodologia = { ok: true; paragrafos: string[]; aviso?: string } | { ok: false; erro: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ids(lista: unknown, max: number): string[] {
  return Array.isArray(lista) ? lista.filter((v): v is string => typeof v === "string" && UUID.test(v)).slice(0, max) : [];
}

function curto(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/**
 * Cria o texto do caminho metodológico (a única parte do plano que usa IA).
 * O resultado volta como rascunho: o professor lê, edita e só então salva.
 */
export async function gerarMetodologia(contexto: ContextoIA): Promise<ResultadoMetodologia> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const habilidadeIds = ids(contexto?.habilidadeIds, 20);
  const competenciaIds = ids(contexto?.competenciaIds, 6);
  const manuais = Array.isArray(contexto?.habilidadesManuais) ? contexto.habilidadesManuais.slice(0, 10) : [];
  const conteudos = curto(contexto?.conteudos, 1500);

  if (habilidadeIds.length === 0 && manuais.length === 0 && !conteudos && !curto(contexto?.titulo, 120)) {
    return { ok: false, erro: "Preencha antes o título, escolha habilidades ou escreva os conteúdos. A IA usa isso para montar o caminho." };
  }

  const reserva = await supabase.rpc("ia_reservar", { p_operacao: "metodologia" });
  const r = reserva.data as { ok?: boolean; id?: string; motivo?: string } | null;
  if (reserva.error || !r?.ok || !r.id) {
    return { ok: false, erro: r?.motivo ?? "Não foi possível usar a IA agora. Tente novamente em instantes." };
  }

  try {
    const [hab, comp, vinc] = await Promise.all([
      habilidadeIds.length
        ? supabase.from("habilidades_curriculares").select("codigo, descricao").in("id", habilidadeIds)
        : Promise.resolve({ data: [] as { codigo: string | null; descricao: string }[] }),
      competenciaIds.length
        ? supabase.from("competencias_curriculares").select("descricao").in("id", competenciaIds)
        : Promise.resolve({ data: [] as { descricao: string }[] }),
      vinculoNome(supabase, curto(contexto?.vinculo, 80)),
    ]);

    const divisao = normalizarDivisao(contexto?.divisao);
    const quantidade = quantidadeDePartes(divisao, contexto?.quantidade, curto(contexto?.dataInicio, 10), curto(contexto?.dataFim, 10), curto(contexto?.quantidadeAulas, 10));
    const dados: DadosMetodologia = {
      componente: vinc || curto(contexto?.titulo, 120),
      turma: curto(contexto?.turma, 80),
      divisao,
      quantidade,
      quantidadeAulas: curto(contexto?.quantidadeAulas, 10),
      habilidades: [
        ...((hab.data ?? []) as { codigo: string | null; descricao: string }[]).map((h) => `${h.codigo ? `${h.codigo} ` : ""}${h.descricao}`),
        ...manuais.map((m) => `${curto(m?.codigo, 40)} ${curto(m?.descricao, 400)}`.trim()),
      ],
      competencias: ((comp.data ?? []) as { descricao: string }[]).map((c) => c.descricao),
      conteudos,
      instrucoes: curto(contexto?.instrucoes, 500),
    };

    // Espaço de resposta proporcional ao número de partes (cada parte é um parágrafo).
    const porParte = divisao === "aula" ? 260 : 420;
    const maxTokens = Math.min(7000, 700 + quantidade * porParte);
    let resposta = await chamarIA({ sistema: SISTEMA_METODOLOGIA, usuario: montarPromptMetodologia(dados), maxTokens, json: true, temperatura: 0.6 });
    let textos = textosDaResposta(resposta.texto).slice(0, quantidade);
    let tokensEntrada = resposta.tokensEntrada;
    let tokensSaida = resposta.tokensSaida;
    let custo = resposta.custo;

    // A IA devolveu menos partes do que o pedido: pedimos só as que faltam (uma única vez).
    if (textos.length > 0 && textos.length < quantidade) {
      try {
        const extra = await chamarIA({
          sistema: SISTEMA_METODOLOGIA,
          usuario: montarPromptContinuacao(dados, textos),
          maxTokens: Math.min(7000, 700 + (quantidade - textos.length) * porParte),
          json: true,
          temperatura: 0.6,
        });
        tokensEntrada += extra.tokensEntrada;
        tokensSaida += extra.tokensSaida;
        custo += extra.custo;
        textos = [...textos, ...textosDaResposta(extra.texto).slice(0, quantidade - textos.length)];
        resposta = { ...resposta, tokensEntrada, tokensSaida, custo };
      } catch {
        // Segue com o que já temos; o aviso abaixo conta ao professor o que faltou.
      }
    }
    const paragrafos = paragrafosComTitulo(textos, divisao);
    const nome = divisao === "aula" ? "aulas" : "semanas";
    const aviso =
      paragrafos.length > 0 && paragrafos.length < quantidade
        ? `A IA escreveu só ${paragrafos.length} de ${quantidade} ${nome}. Escreva as que faltam ou clique em criar de novo.`
        : undefined;
    await supabase.rpc("ia_finalizar", {
      p_id: r.id,
      p_modelo: `${resposta.provedor}:${resposta.modelo}`,
      p_tokens_entrada: resposta.tokensEntrada,
      p_tokens_saida: resposta.tokensSaida,
      p_custo: resposta.custo,
      p_status: paragrafos.length ? "ok" : "erro",
    });
    if (paragrafos.length === 0) return { ok: false, erro: "A IA respondeu em um formato que não deu para aproveitar. Tente de novo." };
    return { ok: true, paragrafos, aviso };
  } catch {
    await supabase.rpc("ia_finalizar", { p_id: r.id, p_modelo: "-", p_tokens_entrada: 0, p_tokens_saida: 0, p_custo: 0, p_status: "erro" });
    return { ok: false, erro: "A IA está indisponível neste momento. Seu uso não foi descontado; tente novamente em alguns minutos." };
  }
}

async function vinculoNome(supabase: Awaited<ReturnType<typeof createClient>>, vinculo: string): Promise<string> {
  const [tipo, id] = vinculo.split(":");
  if (!id || !UUID.test(id)) return "";
  if (tipo === "disciplina") {
    const { data } = await supabase.from("disciplinas").select("nome").eq("id", id).maybeSingle();
    return data?.nome ?? "";
  }
  if (tipo === "curso") {
    const { data } = await supabase.from("cursos_tecnicos").select("nome").eq("id", id).maybeSingle();
    return data?.nome ?? "";
  }
  return "";
}
