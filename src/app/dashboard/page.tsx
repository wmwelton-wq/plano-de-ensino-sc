import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BuscaPlanos, { type ItemBusca } from "./busca-planos";
import TutorialInicial from "./tutorial-inicial";
import { Suspense } from "react";
import { CartaoPlano, type PlanoLista } from "./meus-planos/dados";
import { normalizarDados } from "@/lib/plano-anual";
import { TRIMESTRES_ROTULOS } from "@/lib/plano-anual";
import { Icone, type NomeIcone } from "@/components/icones";

type Tom = "azul" | "verde" | "violeta" | "ambar" | "ciano" | "ardosia" | "rosa";

interface Atalho {
  href: string;
  icone: NomeIcone;
  tom: Tom;
  titulo: string;
  texto: string;
}

/** Atalho com a cor do assunto: anual = azul, mensal = verde, escolas = âmbar, ajuda = ciano, opinião = rosa. */
function Cartao({ href, icone, tom, titulo, texto }: Atalho) {
  return (
    <Link
      href={href}
      data-tom={tom}
      className="card card-interactive group flex items-start gap-4 border-l-4 p-5 [border-left-color:var(--tom)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg [background:var(--tom-claro)] [color:var(--tom)]"
        aria-hidden="true"
      >
        <Icone nome={icone} className="h-6 w-6" />
      </span>
      <span>
        <span className="block text-base font-bold text-slate-900">{titulo}</span>
        <span className="mt-0.5 block text-sm text-slate-600">{texto}</span>
      </span>
    </Link>
  );
}

function Indicador({ rotulo, valor, tom }: { rotulo: string; valor: number; tom: Tom }) {
  return (
    <div data-tom={tom} className="card border-t-4 p-5 [border-top-color:var(--tom)]">
      <p className="text-sm text-slate-600">{rotulo}</p>
      <p className="mt-1 text-2xl font-bold [color:var(--tom)]">{valor}</p>
    </div>
  );
}

function Titulo2({ id, icone, tom, children }: { id?: string; icone: NomeIcone; tom: Tom; children: React.ReactNode }) {
  return (
    <h2 id={id} data-tom={tom} className="flex items-center gap-2 text-lg font-bold text-slate-900">
      <span className="flex h-7 w-7 items-center justify-center rounded-md [background:var(--tom-claro)] [color:var(--tom)]" aria-hidden="true">
        <Icone nome={icone} className="h-4 w-4" />
      </span>
      {children}
    </h2>
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
      <h1 className="text-2xl font-bold text-slate-900">Início</h1>
      <p className="mt-1 text-sm text-slate-600">
        Tudo o que você precisa está aqui. Você também pode usar o menu no topo da página.
      </p>

      {total > 0 && (
        <div className="mt-5">
          <BuscaPlanos itens={itensBusca} />
        </div>
      )}

      {total > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Indicador rotulo="Total de planos" valor={total} tom="azul" />
          <Indicador rotulo="Finalizados" valor={finalizados} tom="verde" />
          <Indicador rotulo="Em rascunho" valor={total - finalizados} tom="ambar" />
          <Indicador rotulo="Escolas cadastradas" valor={escolas?.length ?? 0} tom="ardosia" />
        </div>
      )}

      <section className="mt-8" aria-labelledby="pendencias">
        <Titulo2 id="pendencias" icone="alerta" tom="ambar">
          Pendências
        </Titulo2>
        {total === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Quando você criar planos, as pendências aparecem aqui.</p>
        ) : rascunhos + semEscola + turmasSemAnual.size + trimestresVazios.length === 0 ? (
          <p className="mt-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Tudo em dia. Nenhuma pendência no momento.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {rascunhos > 0 && (
              <li className="rounded-lg border border-amber-300 border-l-4 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <strong>{rascunhos}</strong> {rascunhos === 1 ? "plano está" : "planos estão"} em rascunho.{" "}
                <Link href="/dashboard/meus-planos" className="font-semibold underline">
                  Ver meus planos
                </Link>
              </li>
            )}
            {semEscola > 0 && (
              <li className="rounded-lg border border-amber-300 border-l-4 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <strong>{semEscola}</strong> {semEscola === 1 ? "plano está" : "planos estão"} sem escola definida (ficam na pasta &quot;Sem escola
                definida&quot;).
              </li>
            )}
            {Array.from(turmasSemAnual.values())
              .slice(0, 5)
              .map((nome) => (
                <li key={nome} className="rounded-lg border border-amber-300 border-l-4 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  A turma <strong>{nome}</strong> tem plano mensal, mas ainda não tem plano anual.{" "}
                  <Link href="/dashboard/anual/novo" className="font-semibold underline">
                    Criar plano anual
                  </Link>
                </li>
              ))}
            {trimestresVazios.slice(0, 5).map((t, i) => (
              <li key={`${t.id}-${i}`} className="rounded-lg border border-amber-300 border-l-4 bg-amber-50 px-4 py-3 text-sm text-amber-900">
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
          <Titulo2 id="favoritos" icone="estrela" tom="ambar">
            Favoritos (em uso)
          </Titulo2>
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

      <div className="mt-8">
        <Titulo2 icone="pasta" tom="azul">
          Planos
        </Titulo2>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Cartao href="/dashboard/meus-planos" icone="pasta" tom="ardosia" titulo="Meus planos" texto="Veja todos os planos, organizados por escola e turma." />
        <Cartao href="/dashboard/meus-planos/anuais" icone="calendario" tom="azul" titulo="Planos anuais" texto={`${anuais.length} plano(s) — por escola e turma.`} />
        <Cartao href="/dashboard/meus-planos/mensais" icone="livro" tom="verde" titulo="Planos mensais" texto={`${mensais.length} plano(s) — por escola e turma.`} />
        <Cartao href="/dashboard/anual/novo" icone="mais" tom="azul" titulo="Cadastrar plano anual" texto="Comece um plano anual novo." />
        <Cartao href="/dashboard/planos/novo" icone="mais" tom="verde" titulo="Cadastrar plano mensal" texto="Comece um plano mensal novo." />
      </div>

      <div className="mt-8">
        <Titulo2 icone="ajuda" tom="ciano">
          Ajuda e opinião
        </Titulo2>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Cartao href="/dashboard/ajuda" icone="lampada" tom="ciano" titulo="Ajuda" texto="Passo a passo, dicas e vídeos curtos." />
        <Cartao href="/dashboard/opiniao" icone="balao" tom="rosa" titulo="Dar minha opinião" texto="3 perguntas rápidas para melhorarmos o app." />
      </div>

      <div className="mt-8">
        <Titulo2 icone="escola" tom="ambar">
          Escolas
        </Titulo2>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Cartao href="/dashboard/escolas" icone="escola" tom="ambar" titulo="Minhas escolas" texto="Veja e edite as escolas cadastradas." />
        <Cartao href="/dashboard/escolas/nova" icone="mais" tom="ambar" titulo="Cadastrar escola" texto="Cadastre o nome, o município e a logo." />
      </div>
    </div>
  );
}
