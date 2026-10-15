import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BuscaPlanos, { type ItemBusca } from "./busca-planos";
import TutorialInicial from "./tutorial-inicial";
import { Suspense } from "react";
import { CartaoPlano, type PlanoLista } from "./meus-planos/dados";
import { normalizarDados } from "@/lib/plano-anual";
import { TRIMESTRES_ROTULOS } from "@/lib/plano-anual";

interface Atalho {
  href: string;
  icone: string;
  titulo: string;
  texto: string;
  destaque?: boolean;
}

function Cartao({ href, icone, titulo, texto, destaque }: Atalho) {
  return (
    <Link
      href={href}
      className={`card card-interactive flex items-start gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        destaque ? "border-2 border-primary-400 bg-primary-50/50" : ""
      }`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-2xl" aria-hidden="true">
        {icone}
      </span>
      <span>
        <span className="block text-lg font-bold text-slate-900">{titulo}</span>
        <span className="mt-0.5 block text-sm text-slate-500">{texto}</span>
      </span>
    </Link>
  );
}

interface LinhaPlano {
  id: string;
  titulo: string;
  ano_letivo: number;
  turma: string | null;
  etapa: string;
  status: string;
  escola_id: string | null;
  favorito: boolean | null;
  escolas: { nome: string; municipio: string } | { nome: string; municipio: string }[] | null;
  trimestres?: unknown;
}

function nomeEscola(l: LinhaPlano): string {
  const e = Array.isArray(l.escolas) ? l.escolas[0] : l.escolas;
  return e?.nome ?? "";
}

const COLUNAS = "id, titulo, ano_letivo, turma, etapa, status, escola_id, favorito, escolas(nome, municipio)";

export default async function InicioPage() {
  const supabase = await createClient();

  const [{ data: mensaisBrutos }, { data: anuaisBrutos }, { data: escolas }] = await Promise.all([
    supabase.from("planos_de_ensino").select(COLUNAS).order("updated_at", { ascending: false }),
    supabase.from("planos_anuais").select(`${COLUNAS}, trimestres`).order("updated_at", { ascending: false }),
    supabase.from("escolas").select("id"),
  ]);

  const mensais = (mensaisBrutos ?? []) as unknown as LinhaPlano[];
  const anuais = (anuaisBrutos ?? []) as unknown as LinhaPlano[];
  const todos = [...mensais, ...anuais];
  const total = todos.length;
  const finalizados = todos.filter((p) => p.status === "finalizado").length;

  const itensBusca: ItemBusca[] = [
    ...anuais.map((p) => ({ id: p.id, titulo: p.titulo, tipo: "anuais" as const, turma: p.turma ?? "", escola: nomeEscola(p), status: p.status })),
    ...mensais.map((p) => ({ id: p.id, titulo: p.titulo, tipo: "mensais" as const, turma: p.turma ?? "", escola: nomeEscola(p), status: p.status })),
  ];

  // ── Pendências ──
  const rascunhos = todos.filter((p) => p.status !== "finalizado").length;
  const semEscola = todos.filter((p) => !p.escola_id).length;
  const chaveTurma = (p: LinhaPlano) => `${p.escola_id ?? ""}|${(p.turma ?? "").trim().toLowerCase()}|${p.ano_letivo}`;
  const turmasComAnual = new Set(anuais.map(chaveTurma));
  const turmasSemAnual = new Map<string, string>();
  for (const p of mensais) {
    if (!(p.turma ?? "").trim() || turmasComAnual.has(chaveTurma(p))) continue;
    const nome = nomeEscola(p);
    turmasSemAnual.set(chaveTurma(p), `${(p.turma ?? "").trim()}${nome ? ` — ${nome}` : ""} (${p.ano_letivo})`);
  }
  const trimestresVazios: { id: string; titulo: string; rotulo: string }[] = [];
  for (const p of anuais) {
    const d = normalizarDados({ trimestres: p.trimestres });
    d.trimestres.forEach((t, i) => {
      if (t.habilidades.length === 0 && t.objetos.length === 0 && t.unidades.length === 0) {
        trimestresVazios.push({ id: p.id, titulo: p.titulo, rotulo: TRIMESTRES_ROTULOS[i] });
      }
    });
  }

  const favoritos = todos.filter((p) => p.favorito);

  return (
    <div>
      <Suspense fallback={null}>
        <TutorialInicial />
      </Suspense>
      <h1 className="text-2xl font-semibold text-slate-900">Início</h1>
      <p className="mt-1 text-sm text-slate-500">
        Tudo o que você precisa está aqui. Você também pode usar o menu no topo da página.
      </p>

      {total > 0 && (
        <div className="mt-5">
          <BuscaPlanos itens={itensBusca} />
        </div>
      )}

      {total > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="card p-5">
            <p className="text-sm text-slate-500">Total de planos</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{total}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">Finalizados</p>
            <p className="mt-1 text-2xl font-semibold text-green-700">{finalizados}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">Em rascunho</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">{total - finalizados}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">Escolas cadastradas</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{escolas?.length ?? 0}</p>
          </div>
        </div>
      )}

      <section className="mt-8" aria-labelledby="pendencias">
        <h2 id="pendencias" className="text-lg font-bold text-slate-900">
          Pendências
        </h2>
        {total === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Quando você criar planos, as pendências aparecem aqui.</p>
        ) : rascunhos + semEscola + turmasSemAnual.size + trimestresVazios.length === 0 ? (
          <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Tudo em dia. Nenhuma pendência no momento.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {rascunhos > 0 && (
              <li className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <strong>{rascunhos}</strong> {rascunhos === 1 ? "plano está" : "planos estão"} em rascunho.{" "}
                <Link href="/dashboard/meus-planos" className="font-semibold underline">
                  Ver meus planos
                </Link>
              </li>
            )}
            {semEscola > 0 && (
              <li className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <strong>{semEscola}</strong> {semEscola === 1 ? "plano está" : "planos estão"} sem escola definida (ficam na pasta &quot;Sem escola
                definida&quot;).
              </li>
            )}
            {Array.from(turmasSemAnual.values())
              .slice(0, 5)
              .map((nome) => (
                <li key={nome} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  A turma <strong>{nome}</strong> tem plano mensal, mas ainda não tem plano anual.{" "}
                  <Link href="/dashboard/anual/novo" className="font-semibold underline">
                    Criar plano anual
                  </Link>
                </li>
              ))}
            {trimestresVazios.slice(0, 5).map((t, i) => (
              <li key={`${t.id}-${i}`} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                No plano anual <strong>{t.titulo}</strong>, o <strong>{t.rotulo.toLowerCase()}</strong> está vazio.{" "}
                <Link href={`/dashboard/anual/${t.id}`} className="font-semibold underline">
                  Abrir plano
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {favoritos.length > 0 && (
        <section className="mt-8" aria-labelledby="favoritos">
          <h2 id="favoritos" className="text-lg font-bold text-slate-900">
            ★ Favoritos (em uso)
          </h2>
          <ul className="mt-2 space-y-3">
            {favoritos.slice(0, 6).map((p) => {
              const anual = anuais.some((a) => a.id === p.id);
              return (
                <CartaoPlano
                  key={p.id}
                  plano={p as unknown as PlanoLista}
                  base={anual ? "/dashboard/anual" : "/dashboard/planos"}
                  tipo={anual ? "anuais" : "mensais"}
                />
              );
            })}
          </ul>
        </section>
      )}

      <h2 className="mt-8 text-lg font-bold text-slate-900">Planos</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Cartao href="/dashboard/meus-planos" icone="📚" titulo="Meus planos" texto="Veja todos os planos, organizados por escola e turma." destaque />
        <Cartao href="/dashboard/meus-planos/anuais" icone="📅" titulo="Planos anuais" texto={`${anuais.length} plano(s) — por escola e turma.`} />
        <Cartao href="/dashboard/meus-planos/mensais" icone="🗓️" titulo="Planos mensais" texto={`${mensais.length} plano(s) — por escola e turma.`} />
        <Cartao href="/dashboard/anual/novo" icone="➕" titulo="Cadastrar plano anual" texto="Comece um plano anual novo." />
        <Cartao href="/dashboard/planos/novo" icone="➕" titulo="Cadastrar plano mensal" texto="Comece um plano mensal novo." />
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Ajuda e opinião</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Cartao href="/dashboard/ajuda" icone="💡" titulo="Ajuda" texto="Passo a passo, dicas e vídeos curtos." />
        <Cartao href="/dashboard/opiniao" icone="💬" titulo="Dar minha opinião" texto="3 perguntas rápidas para melhorarmos o app." />
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Escolas</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Cartao href="/dashboard/escolas" icone="🏫" titulo="Minhas escolas" texto="Veja e edite as escolas cadastradas." />
        <Cartao href="/dashboard/escolas/nova" icone="➕" titulo="Cadastrar escola" texto="Cadastre o nome, o município e a logo." />
      </div>
    </div>
  );
}
