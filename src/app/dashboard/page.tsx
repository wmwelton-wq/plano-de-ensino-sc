import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BuscaPlanos, { type ItemBusca } from "./busca-planos";
import TutorialInicial from "./tutorial-inicial";
import PrimeirosPassos from "./primeiros-passos";
import AgendaPainel from "./agenda-painel";
import { PrimeiroNome } from "./usuario-contexto";
import { Suspense } from "react";
import { CartaoPlano, type PlanoLista } from "./meus-planos/dados";
import { normalizarDados } from "@/lib/plano-anual";
import { TRIMESTRES_ROTULOS } from "@/lib/plano-anual";
import { Icone, type NomeIcone } from "@/components/icones";
import { AnelProgresso, Ilustracao, IlustracaoBoasVindas, type NomeIlustracao } from "@/components/ilustracoes";

type Tom = "azul" | "verde" | "violeta" | "ambar" | "ciano" | "ardosia" | "rosa";

/** Cores vivas dos números e ícones (as mesmas famílias de cor de sempre: anual = azul, mensal = verde, escolas = âmbar...). */
const TONS: Record<Tom, { tile: string; texto: string; suave: string }> = {
  azul: { tile: "from-blue-500 to-indigo-500", texto: "text-blue-700", suave: "bg-blue-50 text-blue-700" },
  verde: { tile: "from-emerald-500 to-teal-500", texto: "text-emerald-700", suave: "bg-emerald-50 text-emerald-700" },
  violeta: { tile: "from-violet-500 to-purple-500", texto: "text-violet-700", suave: "bg-violet-50 text-violet-700" },
  ambar: { tile: "from-amber-400 to-orange-500", texto: "text-amber-700", suave: "bg-amber-50 text-amber-700" },
  ciano: { tile: "from-cyan-500 to-sky-500", texto: "text-cyan-700", suave: "bg-cyan-50 text-cyan-700" },
  ardosia: { tile: "from-slate-500 to-slate-700", texto: "text-slate-700", suave: "bg-slate-100 text-slate-700" },
  rosa: { tile: "from-pink-500 to-rose-500", texto: "text-rose-700", suave: "bg-rose-50 text-rose-700" },
};

const FUSO = "America/Sao_Paulo";

function saudacaoDoMomento(): string {
  const hora = Number(new Date().toLocaleString("pt-BR", { timeZone: FUSO, hour: "numeric", hour12: false })) % 24;
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

function dataPorExtenso(): string {
  const t = new Date().toLocaleDateString("pt-BR", { timeZone: FUSO, weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function diaDoAno(): number {
  const agora = new Date(new Date().toLocaleString("en-US", { timeZone: FUSO }));
  return Math.floor((agora.getTime() - new Date(agora.getFullYear(), 0, 0).getTime()) / 86_400_000);
}

function quandoAtualizou(iso?: string): string {
  if (!iso) return "";
  const dia = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: FUSO });
  const antes = new Date(iso);
  const dias = Math.round((new Date(dia(new Date())).getTime() - new Date(dia(antes)).getTime()) / 86_400_000);
  if (Number.isNaN(dias)) return "";
  if (dias <= 0) return "Atualizado hoje";
  if (dias === 1) return "Atualizado ontem";
  if (dias < 30) return `Atualizado há ${dias} dias`;
  return `Atualizado em ${antes.toLocaleDateString("pt-BR", { timeZone: FUSO })}`;
}

const DICAS = [
  "Cadastre a logo da sua escola: ela aparece no cabeçalho de todos os seus planos.",
  "No plano anual, o botão “Gerar planos mensais” faz o trabalho pesado por você.",
  "Seus planos podem ser baixados em PDF ou em Word, prontos para entregar.",
  "Faça o plano anual uma vez por ano. Depois, os planos mensais saem dele.",
  "Use a busca aqui no painel para achar um plano pelo título, pela escola ou pela turma.",
  "Marque com estrela os planos que você está usando: eles ficam aqui, à mão, nos favoritos.",
  "Ficou com dúvida? No menu Ajuda tem passo a passo, dicas e vídeos curtos.",
];

/* ───────────── Peças da tela ───────────── */

interface Atalho {
  href: string;
  ilustracao: NomeIlustracao;
  tom: Tom;
  titulo: string;
  texto: string;
  mais?: boolean;
}

/** Atalho com desenho no alto e seta que se move ao passar o mouse. */
function Cartao({ href, ilustracao, tom, titulo, texto, mais }: Atalho) {
  return (
    <Link
      href={href}
      data-tom={tom}
      className="atalho-ilustrado group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      <div className="atalho-arte h-[116px] px-4 py-2.5">
        <Ilustracao nome={ilustracao} tom={tom} mais={mais} />
      </div>
      <div className="flex flex-1 items-start justify-between gap-3 p-4 pt-3">
        <div className="min-w-0">
          <p className="text-base font-bold leading-snug text-slate-900">{titulo}</p>
          <p className="mt-0.5 text-sm leading-snug text-slate-600">{texto}</p>
        </div>
        <span className="atalho-seta flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500" aria-hidden="true">
          <Icone nome="setaDireita" className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

/** Cartão grande para criar um plano novo. */
function CartaoCriar({ href, ilustracao, tom, titulo, texto, botao }: { href: string; ilustracao: NomeIlustracao; tom: Tom; titulo: string; texto: string; botao: string }) {
  const verde = tom === "verde";
  return (
    <Link
      href={href}
      data-tom={tom}
      className="atalho-ilustrado group flex flex-col sm:flex-row focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      <div className="atalho-arte h-[112px] shrink-0 px-4 pt-3 sm:h-auto sm:w-[44%] sm:px-3 sm:py-3">
        <Ilustracao nome={ilustracao} tom={tom} mais />
      </div>
      <div className="flex flex-1 flex-col justify-center p-5">
        <p className="text-lg font-extrabold leading-snug text-slate-900">{titulo}</p>
        <p className="mt-1 text-sm leading-snug text-slate-600">{texto}</p>
        <span
          className={`mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors ${
            verde ? "bg-emerald-600 group-hover:bg-emerald-700" : "bg-primary-600 group-hover:bg-primary-700"
          }`}
        >
          {botao}
          <Icone nome="setaDireita" className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function Indicador({ rotulo, valor, detalhe, tom, icone }: { rotulo: string; valor: number; detalhe: string; tom: Tom; icone: NomeIcone }) {
  const t = TONS[tom];
  return (
    <div className="painel-cartao flex items-center gap-3.5 p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${t.tile}`} aria-hidden="true">
        <Icone nome={icone} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{rotulo}</p>
        <p className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900">{valor}</p>
        <p className={`text-xs font-semibold leading-snug ${t.texto}`}>{detalhe}</p>
      </div>
    </div>
  );
}

function Secao({ id, icone, tom, titulo, texto }: { id?: string; icone: NomeIcone; tom: Tom; titulo: string; texto?: string }) {
  const t = TONS[tom];
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.suave}`} aria-hidden="true">
        <Icone nome={icone} className="h-[18px] w-[18px]" />
      </span>
      <div>
        <h2 id={id} className="text-lg font-extrabold leading-tight text-slate-900">
          {titulo}
        </h2>
        {texto && <p className="text-sm text-slate-500">{texto}</p>}
      </div>
    </div>
  );
}

function Pendencia({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white px-4 py-3 text-sm text-slate-700">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700" aria-hidden="true">
        <Icone nome="alerta" className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 leading-relaxed">{children}</span>
    </li>
  );
}

const linkPendencia =
  "ml-1 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100";

interface LinhaPlano {
  id: string;
  titulo: string;
  ano_letivo: number;
  turma: string | null;
  etapa: string;
  status: string;
  escola_id: string | null;
  favorito: boolean | null;
  updated_at?: string | null;
  escolas: { nome: string; municipio: string } | { nome: string; municipio: string }[] | null;
  trimestres?: unknown;
}

function nomeEscola(l: LinhaPlano): string {
  const e = Array.isArray(l.escolas) ? l.escolas[0] : l.escolas;
  return e?.nome ?? "";
}

const COLUNAS = "id, titulo, ano_letivo, turma, etapa, status, escola_id, favorito, updated_at, escolas(nome, municipio)";

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
  const totalEscolas = escolas?.length ?? 0;

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
  const totalPendencias = rascunhos + semEscola + turmasSemAnual.size + trimestresVazios.length;

  const favoritos = todos.filter((p) => p.favorito);

  // ── Continue de onde parou: os planos mexidos mais recentemente (rascunhos primeiro) ──
  const anualIds = new Set(anuais.map((a) => a.id));
  const maisRecentes = [...todos].sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));
  const continuar = [...maisRecentes.filter((p) => p.status !== "finalizado"), ...maisRecentes.filter((p) => p.status === "finalizado")].slice(0, 3);

  const percentual = total > 0 ? Math.round((finalizados / total) * 100) : 0;
  const dica = DICAS[diaDoAno() % DICAS.length];

  const mensagem =
    total === 0
      ? "Que bom ter você aqui! Cadastre sua escola e monte seu primeiro plano em poucos minutos."
      : rascunhos > 0
        ? `Você tem ${rascunhos} ${rascunhos === 1 ? "plano em rascunho esperando" : "planos em rascunho esperando"} por você. Que tal finalizar hoje?`
        : "Todos os seus planos estão finalizados. Excelente trabalho!";

  return (
    <div className="space-y-9">
      <Suspense fallback={null}>
        <TutorialInicial />
      </Suspense>

      {/* ── Faixa de boas-vindas ── */}
      <section className="hero-painel painel-entra" aria-labelledby="boas-vindas">
        <div className="relative grid items-center gap-2 px-6 py-8 sm:px-10 sm:py-10 md:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
              <Icone nome="calendario" className="h-4 w-4 text-primary-600" />
              {dataPorExtenso()}
            </span>
            <h1 id="boas-vindas" className="mt-4 text-[1.9rem] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-[2.5rem]">
              {saudacaoDoMomento()},{" "}
              <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                <PrimeiroNome />!
              </span>
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600">{mensagem}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard/anual/novo" className="btn-azul px-5 py-3 shadow-glow">
                <Icone nome="mais" className="h-4 w-4" />
                Novo plano anual
              </Link>
              <Link href="/dashboard/planos/novo" className="btn-verde px-5 py-3">
                <Icone nome="mais" className="h-4 w-4" />
                Novo plano mensal
              </Link>
            </div>

            {total > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                <li className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm ring-1 ring-slate-200">
                  <Icone nome="documento" className="h-3.5 w-3.5 text-primary-600" />
                  {total} {total === 1 ? "plano" : "planos"}
                </li>
                <li className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm ring-1 ring-slate-200">
                  <Icone nome="escola" className="h-3.5 w-3.5 text-amber-600" />
                  {totalEscolas} {totalEscolas === 1 ? "escola" : "escolas"}
                </li>
                <li className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm ring-1 ring-slate-200">
                  <Icone nome="check" className="h-3.5 w-3.5 text-emerald-600" />
                  {percentual}% concluído
                </li>
              </ul>
            )}
          </div>

          <div className="relative hidden h-[270px] md:block lg:h-[300px]">
            <IlustracaoBoasVindas />
          </div>
        </div>
      </section>

      {/* ── Busca ── */}
      {total > 0 && <BuscaPlanos itens={itensBusca} />}

      {/* ── Números ── */}
      {total > 0 && (
        <section className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4" aria-label="Resumo dos seus planos">
          <Indicador rotulo="Total de planos" valor={total} detalhe={`${anuais.length} ${anuais.length === 1 ? "anual" : "anuais"} · ${mensais.length} ${mensais.length === 1 ? "mensal" : "mensais"}`} tom="azul" icone="documento" />
          <Indicador rotulo="Finalizados" valor={finalizados} detalhe={`${percentual}% do total`} tom="verde" icone="check" />
          <Indicador rotulo="Em rascunho" valor={total - finalizados} detalhe={total - finalizados === 0 ? "Nada pendente" : "Faltam finalizar"} tom="ambar" icone="lapis" />
          <Indicador rotulo="Escolas" valor={totalEscolas} detalhe={totalEscolas === 0 ? "Cadastre a primeira" : "Cadastradas por você"} tom="ardosia" icone="escola" />
        </section>
      )}

      {/* ── Primeiros passos: marca sozinho o que já foi feito e some quando tudo estiver pronto ── */}
      <PrimeirosPassos temEscola={totalEscolas > 0} temAnual={anuais.length > 0} temMensal={mensais.length > 0} temFinalizado={finalizados > 0} />

      {/* ── Agenda escolar (opcional: só aparece se o professor ligou o calendário; antes disso, um convite) ── */}
      <Suspense fallback={null}>
        <AgendaPainel />
      </Suspense>

      {/* ── Continue de onde parou + Progresso ── */}
      {total > 0 && (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]" aria-labelledby="continuar">
          <div className="painel-cartao min-w-0 p-5 sm:p-6">
            <Secao id="continuar" icone="lapis" tom="azul" titulo="Continue de onde parou" texto="Seus planos mexidos por último." />
            <ul className="mt-4 space-y-2.5">
              {continuar.map((p) => {
                const anual = anualIds.has(p.id);
                const final = p.status === "finalizado";
                return (
                  <li key={`${anual ? "a" : "m"}-${p.id}`}>
                    <Link
                      href={`${anual ? "/dashboard/anual" : "/dashboard/planos"}/${p.id}`}
                      className="group flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${anual ? TONS.azul.tile : TONS.verde.tile}`}
                        aria-hidden="true"
                      >
                        <Icone nome={anual ? "calendario" : "livro"} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-slate-900">{p.titulo}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {anual ? "Anual" : "Mensal"} · {nomeEscola(p) || "Sem escola definida"}
                          {p.turma ? ` · ${p.turma}` : ""} · {quandoAtualizou(p.updated_at ?? undefined)}
                        </span>
                      </span>
                      <span className={`badge hidden shrink-0 sm:inline-flex ${final ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${final ? "bg-emerald-600" : "bg-amber-600"}`} />
                        {final ? "Finalizado" : "Rascunho"}
                      </span>
                      <span className="atalho-seta flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 group-hover:translate-x-0.5 group-hover:bg-primary-600 group-hover:text-white" aria-hidden="true">
                        <Icone nome="setaDireita" className="h-4 w-4" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <div className="painel-cartao flex items-center gap-5 p-5 sm:p-6">
              <AnelProgresso percentual={percentual} tamanho={112} espessura={13}>
                <span className="text-2xl font-extrabold leading-none text-slate-900">{percentual}%</span>
                <span className="mt-0.5 text-[11px] font-semibold text-slate-500">concluído</span>
              </AnelProgresso>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-slate-900">Seu progresso</h2>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    {finalizados} {finalizados === 1 ? "finalizado" : "finalizados"}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" aria-hidden="true" />
                    {total - finalizados} em rascunho
                  </li>
                </ul>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-[0_12px_28px_-18px_rgba(217,119,6,0.35)] sm:p-6">
              <div className="flex items-center gap-2.5 text-amber-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100" aria-hidden="true">
                  <Icone nome="lampada" className="h-[18px] w-[18px]" />
                </span>
                <h2 className="text-sm font-extrabold uppercase tracking-wide">Dica do dia</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{dica}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Pendências ── */}
      <section aria-labelledby="pendencias" className="space-y-3">
        <Secao id="pendencias" icone="alerta" tom="ambar" titulo="Pendências" texto={totalPendencias > 0 ? "O que ainda pede a sua atenção." : undefined} />
        {total === 0 ? (
          <p className="text-sm text-slate-500">Quando você criar planos, as pendências aparecem aqui.</p>
        ) : totalPendencias === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3.5 text-sm font-semibold text-emerald-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white" aria-hidden="true">
              <Icone nome="check" className="h-4 w-4" espessura={2.6} />
            </span>
            Tudo em dia. Nenhuma pendência no momento.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {rascunhos > 0 && (
              <Pendencia>
                <strong>{rascunhos}</strong> {rascunhos === 1 ? "plano está" : "planos estão"} em rascunho.
                <Link href="/dashboard/meus-planos" className={linkPendencia}>
                  Ver meus planos
                </Link>
              </Pendencia>
            )}
            {semEscola > 0 && (
              <Pendencia>
                <strong>{semEscola}</strong> {semEscola === 1 ? "plano está" : "planos estão"} sem escola definida (ficam na pasta &quot;Sem escola
                definida&quot;).
              </Pendencia>
            )}
            {Array.from(turmasSemAnual.values())
              .slice(0, 5)
              .map((nome) => (
                <Pendencia key={nome}>
                  A turma <strong>{nome}</strong> tem plano mensal, mas ainda não tem plano anual.
                  <Link href="/dashboard/anual/novo" className={linkPendencia}>
                    Criar plano anual
                  </Link>
                </Pendencia>
              ))}
            {trimestresVazios.slice(0, 5).map((t, i) => (
              <Pendencia key={`${t.id}-${i}`}>
                No plano anual <strong>{t.titulo}</strong>, o <strong>{t.rotulo.toLowerCase()}</strong> está vazio.
                <Link href={`/dashboard/anual/${t.id}`} className={linkPendencia}>
                  Abrir plano
                </Link>
              </Pendencia>
            ))}
          </ul>
        )}
      </section>

      {/* ── Favoritos ── */}
      {favoritos.length > 0 && (
        <section aria-labelledby="favoritos" className="space-y-3">
          <Secao id="favoritos" icone="estrela" tom="ambar" titulo="Favoritos (em uso)" texto="Os planos que você marcou com estrela." />
          <ul className="space-y-3">
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

      {/* ── Atalhos ── */}
      <section aria-labelledby="criar" className="space-y-4">
        <Secao id="criar" icone="mais" tom="azul" titulo="Criar um plano" texto="Escolha por onde começar." />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <CartaoCriar href="/dashboard/anual/novo" ilustracao="anual" tom="azul" titulo="Cadastrar plano anual" texto="Comece o ano com as habilidades de cada trimestre." botao="Começar agora" />
          <CartaoCriar href="/dashboard/planos/novo" ilustracao="mensal" tom="verde" titulo="Cadastrar plano mensal" texto="Monte o plano do mês para levar à sala de aula." botao="Começar agora" />
        </div>
      </section>

      <section aria-labelledby="seus-planos" className="space-y-4">
        <Secao id="seus-planos" icone="pasta" tom="ardosia" titulo="Seus planos" texto="Tudo organizado por escola e turma." />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Cartao href="/dashboard/meus-planos" ilustracao="meusPlanos" tom="ardosia" titulo="Meus planos" texto="Veja todos os planos, organizados por escola e turma." />
          <Cartao href="/dashboard/meus-planos/anuais" ilustracao="anual" tom="azul" titulo="Planos anuais" texto={`${anuais.length} plano(s) — por escola e turma.`} />
          <Cartao href="/dashboard/meus-planos/mensais" ilustracao="mensal" tom="verde" titulo="Planos mensais" texto={`${mensais.length} plano(s) — por escola e turma.`} />
        </div>
      </section>

      <section aria-labelledby="mais-opcoes" className="space-y-4">
        <Secao id="mais-opcoes" icone="escola" tom="ambar" titulo="Escolas, conta e ajuda" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Cartao href="/dashboard/escolas" ilustracao="escola" tom="ambar" titulo="Minhas escolas" texto="Veja e edite as escolas cadastradas." />
          <Cartao href="/dashboard/conta" ilustracao="conta" tom="violeta" titulo="Minha conta" texto="Seu nome, sua senha e a privacidade." />
          <Cartao href="/dashboard/ajuda" ilustracao="ajuda" tom="ciano" titulo="Ajuda" texto="Passo a passo, dicas e vídeos curtos." />
          <Cartao href="/dashboard/opiniao" ilustracao="opiniao" tom="rosa" titulo="Dar minha opinião" texto="3 perguntas rápidas para melhorarmos o app." />
        </div>
      </section>
    </div>
  );
}
