"use client";

import { useMemo, useState } from "react";
import { atualizarSugestao } from "./actions";

export interface Sugestao {
  id: string;
  tipo: string;
  etapa: string | null;
  disciplina: string | null;
  serie: string | null;
  descricao: string;
  status: string;
  nota_admin: string | null;
  primeiro_nome: string;
  data: string;
}

const ROTULO_TIPO: Record<string, string> = {
  competencia: "Competências",
  objeto_conhecimento: "Objetos de conhecimento",
  habilidade: "Habilidades",
  conteudo: "Conteúdos",
  avaliacao: "Avaliação",
  referencia: "Referências",
  outro: "Outros",
};

const ROTULO_STATUS: Record<string, string> = {
  nova: "Nova",
  analisando: "Em análise",
  aprovada: "Aprovada",
  feita: "Já atualizado",
  descartada: "Descartada",
};

const COR_STATUS: Record<string, string> = {
  nova: "bg-rose-100 text-rose-800",
  analisando: "bg-amber-100 text-amber-800",
  aprovada: "bg-blue-100 text-blue-800",
  feita: "bg-emerald-100 text-emerald-800",
  descartada: "bg-slate-100 text-slate-600",
};

function Linha({ s }: { s: Sugestao }) {
  const [status, setStatus] = useState(s.status);
  const [nota, setNota] = useState(s.nota_admin ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    setMsg(null);
    const r = await atualizarSugestao(s.id, status, nota);
    setSalvando(false);
    setMsg(r.erro ?? "Salvo.");
  }

  return (
    <li className="card space-y-2 p-4 text-sm">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${COR_STATUS[status] ?? COR_STATUS.nova}`}>{ROTULO_STATUS[status] ?? status}</span>
        <span className="font-semibold text-slate-900">{s.primeiro_nome}</span>
        <span className="text-xs text-slate-400">
          {[s.etapa, s.disciplina, s.serie].filter(Boolean).join(" · ")}
          {s.etapa || s.disciplina || s.serie ? " · " : ""}
          {s.data}
        </span>
      </p>
      <p className="whitespace-pre-wrap text-slate-800">{s.descricao}</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-semibold text-slate-600">
          Situação
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field !mt-1 !py-1.5">
            {Object.entries(ROTULO_STATUS).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[12rem] flex-1 text-xs font-semibold text-slate-600">
          Minha anotação
          <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={500} className="input-field !mt-1 !py-1.5" placeholder="Opcional" />
        </label>
        <button type="button" onClick={salvar} disabled={salvando} className="btn-azul !py-2">
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        {msg && <span className="text-xs font-semibold text-primary-700">{msg}</span>}
      </div>
    </li>
  );
}

/** Avisos "Faltou algo?" dos professores, organizados por tipo e por situação. */
export default function Sugestoes({ itens }: { itens: Sugestao[] }) {
  const [filtro, setFiltro] = useState<"abertas" | "todas">("abertas");
  const visiveis = useMemo(() => (filtro === "abertas" ? itens.filter((i) => i.status === "nova" || i.status === "analisando") : itens), [itens, filtro]);
  const porTipo = useMemo(() => {
    const m = new Map<string, Sugestao[]>();
    for (const i of visiveis) m.set(i.tipo, [...(m.get(i.tipo) ?? []), i]);
    return Object.keys(ROTULO_TIPO)
      .filter((t) => m.has(t))
      .map((t) => ({ tipo: t, lista: m.get(t)! }));
  }, [visiveis]);
  const novas = itens.filter((i) => i.status === "nova").length;

  return (
    <section aria-labelledby="sugestoes-titulo" className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="sugestoes-titulo" className="text-lg font-bold text-slate-900">
            Faltou algo? — avisos dos professores
          </h2>
          <p className="text-sm text-slate-500">
            {itens.length} aviso(s) · {novas} novo(s). Organizados por tipo: decida o que entra na próxima atualização.
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Filtro">
          <button type="button" aria-pressed={filtro === "abertas"} onClick={() => setFiltro("abertas")} className={filtro === "abertas" ? "btn-azul !py-1.5" : "btn-azul-suave !py-1.5"}>
            Para analisar
          </button>
          <button type="button" aria-pressed={filtro === "todas"} onClick={() => setFiltro("todas")} className={filtro === "todas" ? "btn-azul !py-1.5" : "btn-azul-suave !py-1.5"}>
            Todas
          </button>
        </div>
      </div>
      {porTipo.length === 0 ? (
        <p className="card mt-3 p-4 text-sm text-slate-500">{filtro === "abertas" ? "Nenhum aviso para analisar agora." : "Ainda não chegou nenhum aviso."}</p>
      ) : (
        porTipo.map(({ tipo, lista }) => (
          <div key={tipo} className="mt-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-600">
              {ROTULO_TIPO[tipo]} <span className="font-semibold text-slate-400">({lista.length})</span>
            </h3>
            <ul className="mt-2 space-y-2">
              {lista.map((s) => (
                <Linha key={s.id} s={s} />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
