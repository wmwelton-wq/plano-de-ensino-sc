import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EtapaPlano, PlanoDeEnsino } from "@/lib/database.types";

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
  escolas: { nome: string; municipio: string } | { nome: string; municipio: string }[] | null;
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

export const comparar = (a: string, b: string) =>
  a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });

export async function carregarPlanos(supabase: SupabaseClient, tipo: TipoPlano): Promise<PlanoLista[]> {
  const { data } = await supabase
    .from(TIPOS[tipo].tabela)
    .select("id, titulo, ano_letivo, turma, etapa, status, updated_at, escola_id, escolas(nome, municipio)")
    .order("updated_at", { ascending: false });
  return (data ?? []) as unknown as PlanoLista[];
}

export function nomeDaEscola(plano: PlanoLista): string | null {
  const e = Array.isArray(plano.escolas) ? plano.escolas[0] : plano.escolas;
  return e?.nome ?? null;
}

export function chaveEscola(plano: PlanoLista): string {
  return plano.escola_id && nomeDaEscola(plano) ? plano.escola_id : SEM_ESCOLA;
}

export function nomeTurma(plano: PlanoLista): string {
  return plano.turma?.trim() ?? "";
}

export interface GrupoEscola {
  chave: string;
  nome: string;
  planos: PlanoLista[];
}

/** Escolas que têm plano (em ordem alfabética), com "Sem escola definida" por último. */
export function agruparPorEscola(planos: PlanoLista[]): GrupoEscola[] {
  const mapa = new Map<string, GrupoEscola>();
  for (const p of planos) {
    const chave = chaveEscola(p);
    const nome = chave === SEM_ESCOLA ? "Sem escola definida" : (nomeDaEscola(p) ?? "Sem escola definida");
    const g = mapa.get(chave) ?? { chave, nome, planos: [] };
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

/** Cartão grande e clicável usado nas telas de escolha (tipo, escola, turma). */
export function CartaoPasta({
  href,
  icone,
  titulo,
  detalhe,
  contagem,
}: {
  href: string;
  icone: string;
  titulo: string;
  detalhe?: string;
  contagem: number;
}) {
  return (
    <Link
      href={href}
      className="card card-interactive flex items-center gap-4 px-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-2xl" aria-hidden="true">
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-lg font-bold text-slate-900">{titulo}</span>
        {detalhe && <span className="block truncate text-sm text-slate-500">{detalhe}</span>}
      </span>
      <span className="shrink-0 rounded-full bg-primary-600 px-3 py-1 text-sm font-bold text-white">
        {contagem} {contagem === 1 ? "plano" : "planos"}
      </span>
    </Link>
  );
}

export function CartaoPlano({ plano, base }: { plano: PlanoLista; base: string }) {
  const finalizado = plano.status === "finalizado";
  return (
    <li>
      <Link
        href={`${base}/${plano.id}`}
        className="card card-interactive flex items-center justify-between gap-4 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <div>
          <p className="font-medium text-slate-900">{plano.titulo}</p>
          <p className="mt-0.5 text-sm text-slate-500">
            {etapaLabel[plano.etapa as EtapaPlano] ?? plano.etapa} · {plano.ano_letivo}
          </p>
        </div>
        <span className={`badge ${finalizado ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${finalizado ? "bg-green-600" : "bg-amber-600"}`} />
          {statusLabel[plano.status as PlanoDeEnsino["status"]] ?? plano.status}
        </span>
      </Link>
    </li>
  );
}
