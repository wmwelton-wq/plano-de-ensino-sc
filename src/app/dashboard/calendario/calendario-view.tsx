"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Icone } from "@/components/icones";
import ConfirmarExclusao from "@/components/confirmar-exclusao";
import { useHorarioAulas } from "@/lib/use-horario-aulas";
import {
  NOMES_DIAS_CURTOS,
  NOMES_MESES,
  ROTULO_TIPO,
  SEM_AULA_PADRAO,
  contarAulas,
  datasOficiais,
  diaDaSemana,
  diasEntre,
  iso,
  resumirPeriodo,
  rotuloPeriodo,
  somarDias,
  type DataOficial,
  type EventoCalendario,
  type TipoEvento,
} from "@/lib/feriados";
import Link from "next/link";
import { definirCalendario, excluirEvento, salvarEvento, type CotaCalendarioIA, type EstadoEvento } from "./actions";
import ImportarCalendarioPdf from "./importar-pdf";

interface Props {
  hoje: string;
  mesInicial: string; // AAAA-MM
  ativo: boolean | null;
  eventos: EventoCalendario[];
  escolas: { id: string; nome: string }[];
  /** Escola que veio no endereço (?escola=...); se não vier, usa a primeira. */
  escolaInicial?: string | null;
  cota: CotaCalendarioIA | null;
}

/** Aparência de cada tipo de item do calendário (classes escritas por extenso para o Tailwind enxergar). */
const COR = {
  semAula: { chip: "border-rose-200 bg-rose-100 text-rose-800", ponto: "bg-rose-500", rotulo: "Feriado / sem aula" },
  facultativo: { chip: "border-slate-200 bg-slate-100 text-slate-700", ponto: "bg-slate-400", rotulo: "Facultativo / data lembrada" },
  evento: { chip: "border-blue-200 bg-blue-100 text-blue-800", ponto: "bg-blue-500", rotulo: "Evento da escola" },
  projeto: { chip: "border-violet-200 bg-violet-100 text-violet-800", ponto: "bg-violet-500", rotulo: "Projeto" },
  prova: { chip: "border-amber-200 bg-amber-100 text-amber-800", ponto: "bg-amber-500", rotulo: "Avaliação/prova" },
  reuniao: { chip: "border-cyan-200 bg-cyan-100 text-cyan-800", ponto: "bg-cyan-500", rotulo: "Reunião" },
  outro: { chip: "border-emerald-200 bg-emerald-100 text-emerald-800", ponto: "bg-emerald-500", rotulo: "Outro" },
} as const;

type Cor = keyof typeof COR;

interface ItemDia {
  chave: string;
  titulo: string;
  cor: Cor;
  semAula: boolean;
  evento?: EventoCalendario;
  oficial?: DataOficial;
}

function corDoEvento(e: EventoCalendario): Cor {
  if (e.sem_aula && (e.tipo === "feriado" || e.tipo === "recesso")) return "semAula";
  if (e.tipo === "feriado" || e.tipo === "recesso") return "semAula";
  return e.tipo as Cor;
}

function corOficial(o: DataOficial): Cor {
  return o.semAula ? "semAula" : "facultativo";
}

const DIAS_SEMANA_ESCOLA = [1, 2, 3, 4, 5];

export default function CalendarioView({ hoje, mesInicial, ativo, eventos: todosEventos, escolas, escolaInicial = null, cota }: Props) {
  const [mes, setMes] = useState(mesInicial);
  // Cada escola tem o seu calendário. "" = só as datas gerais (sem escola), que valem para todas as escolas.
  const [escolaSel, setEscolaSel] = useState<string>(() => (escolaInicial && escolas.some((e) => e.id === escolaInicial) ? escolaInicial : escolas[0]?.id ?? ""));
  const eventos = useMemo(
    () => (escolas.length === 0 ? todosEventos : todosEventos.filter((e) => !e.escola_id || e.escola_id === escolaSel)),
    [todosEventos, escolas.length, escolaSel]
  );
  const nomeEscola = escolas.find((e) => e.id === escolaSel)?.nome ?? null;
  const [formAberto, setFormAberto] = useState<{ evento?: EventoCalendario; data?: string } | null>(null);
  const [horario, salvarHorario] = useHorarioAulas();
  const [, iniciar] = useTransition();

  const [ano, mesNum] = mes.split("-").map(Number);
  const primeiroDia = iso(ano, mesNum, 1);
  const ultimoDia = iso(ano, mesNum, new Date(ano, mesNum, 0).getDate());

  function irPara(delta: number) {
    const d = new Date(Date.UTC(ano, mesNum - 1 + delta, 1));
    setMes(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  const oficiais = useMemo(() => datasOficiais(ano), [ano]);

  // Itens de cada dia do mês: datas oficiais + eventos do professor.
  const porDia = useMemo(() => {
    const mapa = new Map<string, ItemDia[]>();
    const add = (d: string, item: ItemDia) => mapa.set(d, [...(mapa.get(d) ?? []), item]);
    for (const o of oficiais) {
      if (o.data >= primeiroDia && o.data <= ultimoDia) add(o.data, { chave: `o-${o.data}-${o.titulo}`, titulo: o.titulo, cor: corOficial(o), semAula: o.semAula, oficial: o });
    }
    for (const e of eventos) {
      if (e.data_fim < primeiroDia || e.data_inicio > ultimoDia) continue;
      const de = e.data_inicio < primeiroDia ? primeiroDia : e.data_inicio;
      const ate = e.data_fim > ultimoDia ? ultimoDia : e.data_fim;
      for (const d of diasEntre(de, ate)) add(d, { chave: `e-${e.id}-${d}`, titulo: e.titulo, cor: corDoEvento(e), semAula: e.sem_aula, evento: e });
    }
    return mapa;
  }, [oficiais, eventos, primeiroDia, ultimoDia]);

  // Grade: começa no domingo da primeira semana.
  const celulas = useMemo(() => {
    const recuo = diaDaSemana(primeiroDia);
    const inicioGrade = somarDias(primeiroDia, -recuo);
    const total = Math.ceil((recuo + Number(ultimoDia.slice(8))) / 7) * 7;
    return Array.from({ length: total }, (_, i) => somarDias(inicioGrade, i));
  }, [primeiroDia, ultimoDia]);

  const resumo = resumirPeriodo(primeiroDia, ultimoDia, eventos);
  const aulas = contarAulas(primeiroDia, ultimoDia, eventos, horario);

  const listaMes = useMemo(() => {
    const linhas: { chave: string; data: string; fim: string; titulo: string; cor: Cor; semAula: boolean; evento?: EventoCalendario; oficial?: DataOficial }[] = [];
    for (const o of oficiais) {
      if (o.data >= primeiroDia && o.data <= ultimoDia) linhas.push({ chave: `o-${o.data}-${o.titulo}`, data: o.data, fim: o.data, titulo: o.titulo, cor: corOficial(o), semAula: o.semAula, oficial: o });
    }
    for (const e of eventos) {
      if (e.data_fim < primeiroDia || e.data_inicio > ultimoDia) continue;
      linhas.push({ chave: `e-${e.id}`, data: e.data_inicio, fim: e.data_fim, titulo: e.titulo, cor: corDoEvento(e), semAula: e.sem_aula, evento: e });
    }
    return linhas.sort((a, b) => a.data.localeCompare(b.data));
  }, [oficiais, eventos, primeiroDia, ultimoDia]);

  function alternarDia(d: number) {
    const dias = horario.dias.includes(d) ? horario.dias.filter((x) => x !== d) : [...horario.dias, d].sort();
    salvarHorario({ ...horario, dias });
  }

  return (
    <div className="space-y-6">
      {/* Escolha: usar ou não o calendário no painel e nos planos */}
      <section aria-label="Usar o calendário" className="painel-cartao p-4 sm:p-5">
        {ativo === true ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-700">
              <strong className="text-emerald-700">Calendário ligado:</strong> os próximos eventos aparecem no painel e, ao montar um plano, você pode escolher o que levar para ele.
            </p>
            <button type="button" onClick={() => iniciar(() => definirCalendario(false))} className="btn-azul-suave">
              Desligar
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-700">
              <strong>Quer usar o calendário no painel e nos seus planos?</strong> É opcional: você escolhe. Ligado, mostramos o que vai acontecer nos próximos dias e oferecemos levar eventos e a contagem de aulas para o plano.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => iniciar(() => definirCalendario(true))} className="btn-azul">
                Sim, usar
              </button>
              {ativo === null && (
                <button type="button" onClick={() => iniciar(() => definirCalendario(false))} className="btn-azul-suave">
                  Agora não
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Escola: cada escola tem o seu calendário */}
      <section aria-label="Escola do calendário" className="painel-cartao p-4 sm:p-5">
        {escolas.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-700">
              <strong>Cada escola tem o seu calendário.</strong> Cadastre primeiro a escola onde você dá aula; depois você adiciona (ou envia em PDF) as datas dela.
            </p>
            <Link href="/dashboard/escolas/nova" className="btn-azul">
              <Icone nome="mais" className="h-4 w-4" />
              Cadastrar escola
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[14rem] flex-1">
              <label htmlFor="escola-calendario" className="field-label">
                Calendário de qual escola?
              </label>
              <select id="escola-calendario" value={escolaSel} onChange={(ev) => setEscolaSel(ev.target.value)} className="input-field">
                {escolas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
                <option value="">Só datas gerais (valem para todas as escolas)</option>
              </select>
            </div>
            <Link href="/dashboard/escolas/nova" className="btn-azul-suave">
              <Icone nome="mais" className="h-4 w-4" />
              Cadastrar outra escola
            </Link>
          </div>
        )}
        {escolas.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            {nomeEscola ? (
              <>
                Mostrando o calendário de <strong>{nomeEscola}</strong>, mais as datas gerais. Ao montar um plano e escolher esta escola, é este calendário que aparece lá.
              </>
            ) : (
              <>Mostrando só as datas gerais, que valem para todas as suas escolas.</>
            )}
          </p>
        )}
      </section>

      {/* Mês */}
      <section aria-label="Mês" className="painel-cartao overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => irPara(-1)} className="btn-azul-suave !px-3" aria-label="Mês anterior">
              <Icone nome="setaEsquerda" className="h-4 w-4" />
            </button>
            <h2 className="min-w-[10.5rem] text-center text-lg font-extrabold text-slate-900 first-letter:uppercase" aria-live="polite">
              {NOMES_MESES[mesNum - 1]} de {ano}
            </h2>
            <button type="button" onClick={() => irPara(1)} className="btn-azul-suave !px-3" aria-label="Próximo mês">
              <Icone nome="setaDireita" className="h-4 w-4" />
            </button>
            {mes !== hoje.slice(0, 7) && (
              <button type="button" onClick={() => setMes(hoje.slice(0, 7))} className="text-sm font-semibold text-primary-700 hover:underline">
                Hoje
              </button>
            )}
          </div>
          <button type="button" onClick={() => setFormAberto({ data: mes === hoje.slice(0, 7) ? hoje : primeiroDia })} className="btn-azul">
            <Icone nome="mais" className="h-4 w-4" />
            Adicionar data
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
          {NOMES_DIAS_CURTOS.map((n) => (
            <div key={n} className="py-2">
              {n}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {celulas.map((d) => {
            const dentro = d >= primeiroDia && d <= ultimoDia;
            const itens = porDia.get(d) ?? [];
            const fimDeSemana = diaDaSemana(d) === 0 || diaDaSemana(d) === 6;
            const ehHoje = d === hoje;
            return (
              <button
                key={d}
                type="button"
                disabled={!dentro}
                onClick={() => setFormAberto({ data: d })}
                aria-label={`${Number(d.slice(8))} de ${NOMES_MESES[Number(d.slice(5, 7)) - 1]}${itens.length ? `: ${itens.map((i) => i.titulo).join(", ")}` : ""}`}
                className={`min-h-[3.75rem] border-b border-r border-slate-100 p-1 text-left align-top transition sm:min-h-[5.5rem] sm:p-1.5 ${
                  dentro ? (fimDeSemana ? "bg-slate-50/70 hover:bg-primary-50/60" : "bg-white hover:bg-primary-50/60") : "bg-slate-50/40 text-slate-300"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    ehHoje ? "bg-primary-600 text-white" : dentro ? "text-slate-700" : "text-slate-300"
                  }`}
                >
                  {Number(d.slice(8))}
                </span>
                {dentro && (
                  <>
                    <span className="mt-0.5 flex flex-wrap gap-0.5 sm:hidden" aria-hidden="true">
                      {itens.slice(0, 4).map((i) => (
                        <span key={i.chave} className={`h-1.5 w-1.5 rounded-full ${COR[i.cor].ponto}`} />
                      ))}
                    </span>
                    <span className="mt-0.5 hidden space-y-0.5 sm:block">
                      {itens.slice(0, 2).map((i) => (
                        <span key={i.chave} className={`block truncate rounded border px-1 py-px text-[10.5px] font-semibold leading-tight ${COR[i.cor].chip}`}>
                          {i.titulo}
                        </span>
                      ))}
                      {itens.length > 2 && <span className="block text-[10.5px] font-semibold text-slate-500">+{itens.length - 2} mais</span>}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-slate-100 px-4 py-3 text-xs text-slate-600 sm:px-5" aria-label="Legenda">
          {(Object.keys(COR) as Cor[]).map((c) => (
            <li key={c} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${COR[c].ponto}`} aria-hidden="true" />
              {COR[c].rotulo}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Lista do mês */}
        <section aria-labelledby="lista-mes" className="painel-cartao p-4 sm:p-5">
          <h2 id="lista-mes" className="text-base font-extrabold text-slate-900 first-letter:uppercase">
            O que há em {NOMES_MESES[mesNum - 1]}
          </h2>
          {listaMes.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">Nada marcado neste mês. Use “Adicionar data” para incluir o que vai acontecer na sua escola.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {listaMes.map((l) => (
                <li key={l.chave} className="flex flex-wrap items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <span className={`mt-0.5 shrink-0 rounded-lg border px-2 py-1 text-xs font-bold ${COR[l.cor].chip}`}>{rotuloPeriodo(l.data, l.fim)}</span>
                  <span className="min-w-[10rem] flex-1">
                    <span className="block text-sm font-bold text-slate-900">{l.titulo}</span>
                    <span className="block text-xs text-slate-500">
                      {l.oficial
                        ? `${l.oficial.esfera === "estadual" ? "Feriado de SC" : l.oficial.natureza === "feriado" ? "Feriado nacional" : l.oficial.natureza === "facultativo" ? "Ponto facultativo" : "Data lembrada"}${l.oficial.nota ? ` · ${l.oficial.nota}` : ""}`
                        : `${ROTULO_TIPO[l.evento!.tipo]}${l.evento!.sem_aula ? " · sem aula" : ""}${!l.evento!.escola_id && escolas.length > 0 ? " · vale para todas as escolas" : ""}${l.evento!.observacao ? ` · ${l.evento!.observacao}` : ""}`}
                    </span>
                  </span>
                  {l.evento && (
                    <span className="ml-auto flex shrink-0 items-center gap-2">
                      <button type="button" onClick={() => setFormAberto({ evento: l.evento })} className="btn-azul-suave !px-3 !py-1.5 !text-xs">
                        Editar
                      </button>
                      <ConfirmarExclusao
                        excluirAction={excluirEvento.bind(null, l.evento.id)}
                        rotulo="Excluir"
                        oQue={`a data “${l.evento.titulo}” do calendário`}
                        classeBotao="btn-perigo-suave !px-3 !py-1.5 !text-xs"
                      />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Contador de aulas */}
        <section aria-labelledby="aulas-mes" className="painel-cartao space-y-4 p-4 sm:p-5">
          <h2 id="aulas-mes" className="text-base font-extrabold text-slate-900">
            Quantas aulas cabem no mês?
          </h2>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-slate-50 p-3">
              <dt className="text-[11px] font-semibold text-slate-500">Dias úteis</dt>
              <dd className="text-2xl font-extrabold text-slate-900">{resumo.diasUteis}</dd>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3">
              <dt className="text-[11px] font-semibold text-rose-700">Sem aula</dt>
              <dd className="text-2xl font-extrabold text-rose-800">{resumo.diasSemAula}</dd>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3">
              <dt className="text-[11px] font-semibold text-emerald-700">Dias letivos</dt>
              <dd className="text-2xl font-extrabold text-emerald-800">{resumo.diasLetivos}</dd>
            </div>
          </dl>

          <fieldset>
            <legend className="field-label">Seus dias de aula com a turma</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DIAS_SEMANA_ESCOLA.map((d) => {
                const on = horario.dias.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => alternarDia(d)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-bold transition ${on ? "border-primary-600 bg-primary-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    {NOMES_DIAS_CURTOS[d]}
                  </button>
                );
              })}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              Aulas por dia
              <input
                type="number"
                min={1}
                max={10}
                value={horario.aulasPorDia}
                onChange={(e) => salvarHorario({ ...horario, aulasPorDia: Math.min(Math.max(Number(e.target.value) || 1, 1), 10) })}
                className="input-field !mt-0 !w-20 !py-1.5"
              />
            </label>
          </fieldset>

          <p className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900">
            Em <strong>{NOMES_MESES[mesNum - 1]}</strong> você tem <strong className="text-xl">{aulas}</strong> {aulas === 1 ? "aula" : "aulas"}, já descontados feriados e recessos.
          </p>
          <p className="text-xs text-slate-500">Seus dias e o número de aulas ficam guardados neste aparelho. Feriados facultativos que a sua escola não segue? Cadastre um evento de “Outro” sem marcar “sem aula”.</p>
        </section>
      </div>

      <ImportarCalendarioPdf escolas={escolas} escolaPadrao={escolaSel} cota={cota} aoSalvar={(id) => setEscolaSel(id)} />

      {formAberto && <FormEvento key={formAberto.evento?.id ?? formAberto.data} estado={formAberto} escolas={escolas} escolaPadrao={escolaSel} aoFechar={() => setFormAberto(null)} />}
    </div>
  );
}

function FormEvento({
  estado,
  escolas,
  escolaPadrao,
  aoFechar,
}: {
  estado: { evento?: EventoCalendario; data?: string };
  escolas: { id: string; nome: string }[];
  escolaPadrao: string;
  aoFechar: () => void;
}) {
  const e = estado.evento;
  const [resultado, acao, pendente] = useActionState<EstadoEvento, FormData>(salvarEvento, {});
  const [tipo, setTipo] = useState<TipoEvento>(e?.tipo ?? "evento");
  const [semAula, setSemAula] = useState(e?.sem_aula ?? SEM_AULA_PADRAO[e?.tipo ?? "evento"]);

  useEffect(() => {
    if (resultado.ok) aoFechar();
  }, [resultado.ok, aoFechar]);

  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => ev.key === "Escape" && aoFechar();
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center" role="presentation" onClick={aoFechar}>
      <form
        action={acao}
        role="dialog"
        aria-modal="true"
        aria-label={e ? "Editar data" : "Adicionar data"}
        onClick={(ev) => ev.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">{e ? "Editar data" : "Adicionar data"}</h2>
          <button type="button" onClick={aoFechar} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
            Fechar
          </button>
        </div>
        {e && <input type="hidden" name="id" value={e.id} />}

        <div>
          <label htmlFor="ev-titulo" className="field-label">
            Nome
          </label>
          <input id="ev-titulo" name="titulo" required maxLength={120} defaultValue={e?.titulo ?? ""} placeholder="Ex.: Festa Junina, Jogos Escolares, Projeto Horta..." className="input-field" />
        </div>

        <div>
          <label htmlFor="ev-tipo" className="field-label">
            Tipo
          </label>
          <select
            id="ev-tipo"
            name="tipo"
            value={tipo}
            onChange={(ev) => {
              const t = ev.target.value as TipoEvento;
              setTipo(t);
              setSemAula(SEM_AULA_PADRAO[t]);
            }}
            className="input-field"
          >
            {(Object.keys(ROTULO_TIPO) as TipoEvento[]).map((t) => (
              <option key={t} value={t}>
                {ROTULO_TIPO[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="ev-ini" className="field-label">
              Data (ou início)
            </label>
            <input id="ev-ini" name="data_inicio" type="date" required defaultValue={e?.data_inicio ?? estado.data ?? ""} className="input-field" />
          </div>
          <div>
            <label htmlFor="ev-fim" className="field-label">
              Até <span className="font-normal text-slate-400">(se durar mais de um dia)</span>
            </label>
            <input id="ev-fim" name="data_fim" type="date" defaultValue={e && e.data_fim !== e.data_inicio ? e.data_fim : ""} className="input-field" />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
          <input type="checkbox" name="sem_aula" checked={semAula} onChange={(ev) => setSemAula(ev.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
          <span>
            <span className="block font-semibold">Neste dia não há aula</span>
            <span className="block text-xs text-slate-500">Marque para descontar da contagem de aulas (feriado municipal, recesso, dia sem aula).</span>
          </span>
        </label>

        {escolas.length > 0 && (
          <div>
            <label htmlFor="ev-escola" className="field-label">
              Calendário de qual escola?
            </label>
            <select id="ev-escola" name="escola_id" defaultValue={e ? e.escola_id ?? "" : escolaPadrao} className="input-field">
              <option value="">Todas as minhas escolas (data geral)</option>
              {escolas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="ev-obs" className="field-label">
            Observação <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <textarea id="ev-obs" name="observacao" rows={2} maxLength={500} defaultValue={e?.observacao ?? ""} className="input-field" />
        </div>

        {resultado.erro && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {resultado.erro}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={aoFechar} className="btn-azul-suave">
            Cancelar
          </button>
          <button type="submit" disabled={pendente} className="btn-azul">
            {pendente ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
