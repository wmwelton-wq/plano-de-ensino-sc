import CartaoIlustrado from "@/components/cartao-ilustrado";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EtapaPlano, PlanoDeEnsino } from "@/lib/database.types";
import EstrelaFavorito from "./estrela-favorito";
import type { ItemPlano } from "./lista-planos";
import type { NomeIcone } from "@/components/icones";
import { Ilustracao, type NomeIlustracao } from "@/components/ilustracoes";

export type TipoPlano = "mensais" | "anuais";

export const TIPOS: Record<TipoPlano, { tabela: string; base: string; titulo: string; singular: string; novo: string }> = {
  mensais: {
    tabela: "planos_de_ensino",
    base: "/dashboard/planos",
    titulo: "Planos mensais",
    singular: "plano mensal",
    novo: "/dashboard/planos/novo",
  },
  anuais: {
    tabela: "planos_anuais",
    base: "/dashboard/anual",
    titulo: "Planos anuais",
    singular: "plano anual",
    novo: "/dashboard/anual/novo",
  },
};

export function tipoValido(t: string): t is TipoPlano {
  return t === "mensais" || t === "anuais";
}

export const SEM_ESCOLA = "sem-escola";
export const SEM_TURMA = "sem-turma";

export interface PlanoLista {
  id: string;
  titulo: string;
  ano_letivo: number;
  turma: string | null;
  etapa: string;
  status: string;
  escola_id: string | null;
  favorito?: boolean | null;
  /** Mensais: datas que o professor escolheu para o plano. */
  data_inicio?: string | null;
  data_fim?: string | null;
  updated_at?: string | null;
  escolas: EscolaDoPlano | EscolaDoPlano[] | null;
}

interface EscolaDoPlano {
  nome: string;
  municipio: string;
  logo_url?: string | null;
}

const statusLabel: Record<PlanoDeEnsino["status"], string> = {
  rascunho: "Rascunho",
  finalizado: "Finalizado",
};

const etapaLabel: Record<EtapaPlano, string> = {
  educacao_infantil: "Educação Infantil",
  fundamental_anos_iniciais: "Fundamental — Anos Iniciais",
  fundamental_anos_finais: "Fundamental — Anos Finais",
  ensino_medio: "Ensino Médio / Técnico",
};

const ARTE_DA_ETAPA: Record<EtapaPlano, NomeIlustracao> = {
  educacao_infantil: "infantil",
  fundamental_anos_iniciais: "iniciais",
  fundamental_anos_finais: "finais",
  ensino_medio: "medio",
};

export const comparar = (a: string, b: string) =>
  a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });

export async function carregarPlanos(supabase: SupabaseClient, tipo: TipoPlano): Promise<PlanoLista[]> {
  // Só o plano mensal tem datas de início e fim; no anual mostramos quando foi atualizado.
  const colunas =
    "id, titulo, ano_letivo, turma, etapa, status, updated_at, escola_id, favorito" +
    (tipo === "mensais" ? ", data_inicio, data_fim" : "") +
    ", escolas(nome, municipio, logo_url)";
  const { data } = await supabase
    .from(TIPOS[tipo].tabela)
    .select(colunas)
    .order("favorito", { ascending: false })
    .order("updated_at", { ascending: false });
  return (data ?? []) as unknown as PlanoLista[];
}

/** Links de leitura ainda válidos: id do plano → data de validade. Só os do próprio professor (regra do banco). */
export async function carregarCompartilhados(supabase: SupabaseClient, tipo: TipoPlano): Promise<Record<string, string>> {
  const { data } = await supabase
    .from("plano_compartilhamentos")
    .select("plano_id, expira_em")
    .eq("plano_tipo", tipo === "anuais" ? "anual" : "mensal")
    .gt("expira_em", new Date().toISOString());
  const mapa: Record<string, string> = {};
  for (const l of (data ?? []) as { plano_id: string; expira_em: string }[]) {
    if (!mapa[l.plano_id] || l.expira_em > mapa[l.plano_id]) mapa[l.plano_id] = l.expira_em;
  }
  return mapa;
}

/** "2026-08-31" ou "2026-08-31T12:00:00Z" → "31/08/2026". */
export function formatarDataBr(valor: string | null | undefined): string {
  if (!valor) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/** Linha com a data do plano: o período escolhido (mensal) ou a última atualização (anual). */
export function textoDeData(plano: Pick<PlanoLista, "data_inicio" | "data_fim" | "updated_at">, tipo: TipoPlano): string {
  if (tipo === "mensais") {
    if (plano.data_inicio === undefined && plano.data_fim === undefined) return ""; // lista que não carregou as datas
    const ini = formatarDataBr(plano.data_inicio);
    const fim = formatarDataBr(plano.data_fim);
    if (ini && fim) return `Período: ${ini} a ${fim}`;
    if (ini || fim) return `Período: ${ini || fim}`;
    return "Período não informado";
  }
  const att = formatarDataBr(plano.updated_at);
  return att ? `Atualizado em ${att}` : "";
}

export function nomeDaEscola(plano: PlanoLista): string | null {
  const e = Array.isArray(plano.escolas) ? plano.escolas[0] : plano.escolas;
  return e?.nome ?? null;
}

export function chaveEscola(plano: PlanoLista): string {
  return plano.escola_id && nomeDaEscola(plano) ? plano.escola_id : SEM_ESCOLA;
}

/**
 * Endereço da pasta (escola > turma) onde um plano aparece em "Meus planos".
 * O botão "Voltar" da tela do plano usa isto para levar o professor de volta à turma certa.
 */
export function urlDaPasta(tipo: TipoPlano, escolaId: string | null | undefined, turma: string | null | undefined): string {
  const base = `/dashboard/meus-planos/${tipo}`;
  const escola = escolaId ? `${base}/${escolaId}` : `${base}/${SEM_ESCOLA}`;
  const t = turma?.trim() ?? "";
  return `${escola}?turma=${encodeURIComponent(t || SEM_TURMA)}`;
}

export function nomeTurma(plano: PlanoLista): string {
  return plano.turma?.trim() ?? "";
}

export interface GrupoEscola {
  chave: string;
  nome: string;
  /** Logo que o professor enviou para a escola (se tiver). */
  logoUrl: string | null;
  planos: PlanoLista[];
}

export function logoDaEscola(plano: PlanoLista): string | null {
  const e = Array.isArray(plano.escolas) ? plano.escolas[0] : plano.escolas;
  return e?.logo_url ?? null;
}

/** Escolas que têm plano (em ordem alfabética), com "Sem escola definida" por último. */
export function agruparPorEscola(planos: PlanoLista[]): GrupoEscola[] {
  const mapa = new Map<string, GrupoEscola>();
  for (const p of planos) {
    const chave = chaveEscola(p);
    const nome = chave === SEM_ESCOLA ? "Sem escola definida" : (nomeDaEscola(p) ?? "Sem escola definida");
    const g = mapa.get(chave) ?? { chave, nome, logoUrl: chave === SEM_ESCOLA ? null : logoDaEscola(p), planos: [] };
    g.planos.push(p);
    mapa.set(chave, g);
  }
  return Array.from(mapa.values()).sort(
    (a, b) => (a.chave === SEM_ESCOLA ? 1 : 0) - (b.chave === SEM_ESCOLA ? 1 : 0) || comparar(a.nome, b.nome)
  );
}

export interface GrupoTurma {
  chave: string;
  nome: string;
  planos: PlanoLista[];
}

export function agruparPorTurma(planos: PlanoLista[]): GrupoTurma[] {
  const mapa = new Map<string, GrupoTurma>();
  for (const p of planos) {
    const t = nomeTurma(p);
    const chave = t || SEM_TURMA;
    const g = mapa.get(chave) ?? { chave, nome: t || "Sem turma definida", planos: [] };
    g.planos.push(p);
    mapa.set(chave, g);
  }
  return Array.from(mapa.values()).sort(
    (a, b) => (a.chave === SEM_TURMA ? 1 : 0) - (b.chave === SEM_TURMA ? 1 : 0) || comparar(a.nome, b.nome)
  );
}

/** Prepara os planos para a lista com botões (dados simples, que podem ir do servidor para a tela). */
export function paraItens(planos: PlanoLista[], tipo: TipoPlano, compartilhados: Record<string, string>): ItemPlano[] {
  return planos.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    etapaRotulo: etapaLabel[p.etapa as EtapaPlano] ?? p.etapa,
    ano: p.ano_letivo,
    situacao: p.status === "finalizado" ? "finalizado" : "rascunho",
    situacaoRotulo: statusLabel[p.status as PlanoDeEnsino["status"]] ?? p.status,
    arte: ARTE_DA_ETAPA[p.etapa as EtapaPlano] ?? "mensal",
    data: textoDeData(p, tipo),
    favorito: !!p.favorito,
    compartilhadoAte: compartilhados[p.id] ?? null,
  }));
}

export function Migalhas({ itens }: { itens: { rotulo: string; href?: string }[] }) {
  return (
    <nav aria-label="Você está aqui" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
      {itens.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && (
            <span aria-hidden="true" className="text-slate-400">
              ›
            </span>
          )}
          {item.href ? (
            <Link href={item.href} className="font-semibold text-primary-600 hover:text-primary-700 hover:underline">
              {item.rotulo}
            </Link>
          ) : (
            <span className="font-semibold text-slate-800">{item.rotulo}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** Cartão ilustrado e clicável usado nas telas de escolha (tipo, escola, turma). */
export function CartaoPasta({
  href,
  icone,
  tom = "ardosia",
  titulo,
  detalhe,
  contagem,
  logoUrl,
}: {
  href: string;
  icone: NomeIcone;
  tom?: "azul" | "verde" | "violeta" | "ambar" | "ciano" | "ardosia" | "rosa";
  titulo: string;
  detalhe?: string;
  contagem: number;
  /** Logo da escola, quando o professor enviou uma. */
  logoUrl?: string | null;
}) {
  const ilustracao = icone === "escola" ? "escola" : icone === "usuarios" ? "turma" : "meusPlanos";
  return (
    <CartaoIlustrado
      href={href}
      ilustracao={ilustracao}
      tom={tom}
      titulo={titulo}
      texto={detalhe}
      selo={`${contagem} ${contagem === 1 ? "plano" : "planos"}`}
      logoUrl={logoUrl}
      nomeLogo={titulo}
    />
  );
}

export function CartaoPlano({ plano, base, tipo }: { plano: PlanoLista; base: string; tipo: TipoPlano }) {
  const finalizado = plano.status === "finalizado";
  return (
    <li className="flex items-stretch gap-2">
      <EstrelaFavorito tipo={tipo} planoId={plano.id} favorito={!!plano.favorito} />
      <Link
        href={`${base}/${plano.id}`}
        data-tom={tipo === "anuais" ? "azul" : "verde"}
        className="card card-interactive flex min-w-0 flex-1 items-center justify-between gap-4 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <div className="hidden h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-xl sm:block atalho-arte" aria-hidden="true">
          <Ilustracao nome={ARTE_DA_ETAPA[plano.etapa as EtapaPlano] ?? "mensal"} tom={tipo === "anuais" ? "azul" : "verde"} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{plano.titulo}</p>
          <p className="mt-0.5 text-sm text-slate-500">
            {etapaLabel[plano.etapa as EtapaPlano] ?? plano.etapa} · {plano.ano_letivo}
          </p>
          {textoDeData(plano, tipo) && <p className="mt-0.5 text-xs text-slate-500">{textoDeData(plano, tipo)}</p>}
        </div>
        <span className={`badge shrink-0 ${finalizado ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${finalizado ? "bg-green-600" : "bg-amber-600"}`} />
          {statusLabel[plano.status as PlanoDeEnsino["status"]] ?? plano.status}
        </span>
      </Link>
    </li>
  );
}
