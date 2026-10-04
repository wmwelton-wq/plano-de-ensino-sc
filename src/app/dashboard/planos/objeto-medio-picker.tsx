"use client";

import { useId, useMemo, useState } from "react";
import type { ObjetoConhecimentoMedio } from "@/lib/database.types";

interface ObjetoMedioPickerProps {
  titulo: string;
  descricaoAjuda?: string;
  /** Objetos de conhecimento da disciplina escolhida (todas as séries). */
  objetos: ObjetoConhecimentoMedio[];
  /** Série sugerida pelo seletor de turma (1 a 3); o professor pode trocar. */
  serieSugerida?: number | null;
  /** Chamado ao clicar em "Adicionar ao plano": recebe as linhas a acrescentar no campo de conteúdos. */
  onAdicionarConteudos: (linhas: string[]) => void;
  vazio: string;
}

function itensDeConteudo(texto: string | null | undefined): string[] {
  if (!texto) return [];
  return texto
    .split("\n")
    .map((l) => l.replace(/^[\s•\-–*]+/, "").trim())
    .filter((l) => l.length > 0);
}

export default function ObjetoMedioPicker({
  titulo,
  descricaoAjuda,
  objetos,
  serieSugerida = null,
  onAdicionarConteudos,
  vazio,
}: ObjetoMedioPickerProps) {
  const idSerie = useId();
  const idBusca = useId();

  const series = useMemo(
    () => Array.from(new Set(objetos.map((o) => o.serie))).sort((a, b) => a - b),
    [objetos]
  );
  const [serieManual, setSerieManual] = useState<number | null>(null);
  const preferida = serieManual ?? serieSugerida;
  const serie = preferida !== null && series.includes(preferida) ? preferida : series[0] ?? null;

  const [ativo, setAtivo] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const doAno = useMemo(
    () =>
      objetos
        .filter((o) => o.serie === serie)
        .sort((a, b) => a.objeto.localeCompare(b.objeto, "pt-BR", { sensitivity: "base" })),
    [objetos, serie]
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return doAno;
    return doAno.filter((o) => `${o.objeto} ${o.conteudos ?? ""}`.toLowerCase().includes(termo));
  }, [doAno, busca]);

  if (objetos.length === 0) {
    return (
      <div>
        <p className="field-label">{titulo}</p>
        <p className="mt-2 rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-400">
          {vazio}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="field-label">{titulo}</p>
      {descricaoAjuda && <p className="text-xs text-slate-400">{descricaoAjuda}</p>}

      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={idSerie} className="field-label">
            Série
          </label>
          <select
            id={idSerie}
            value={serie ?? ""}
            onChange={(e) => {
              setSerieManual(Number(e.target.value));
              setAtivo(null);
            }}
            className="input-field"
          >
            {series.map((s) => (
              <option key={s} value={s}>
                {s}ª série
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-slate-300">
        <div className="border-b border-slate-200 px-3 py-2">
          <p className="text-sm font-bold text-slate-800">
            Objetos de conhecimento <span className="font-normal text-slate-400">(ordem alfabética)</span>
          </p>
          <p className="text-xs text-slate-400">
            Clique em um objeto para ver os conteúdos sugeridos e adicioná-los ao plano.
          </p>
          <label htmlFor={idBusca} className="sr-only">
            Buscar objeto de conhecimento
          </label>
          <input
            id={idBusca}
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar objeto de conhecimento..."
            className="mt-2 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
          />
        </div>

        <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
          {filtrados.length === 0 && (
            <li className="px-3 py-3 text-sm text-slate-400">Nenhum objeto encontrado para essa busca.</li>
          )}
          {filtrados.map((o) => {
            const aberto = ativo === o.id;
            const conteudos = itensDeConteudo(o.conteudos);
            return (
              <li key={o.id}>
                <button
                  type="button"
                  aria-expanded={aberto}
                  onClick={() => setAtivo(aberto ? null : o.id)}
                  className={`flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                    aberto ? "bg-primary-50/60" : ""
                  }`}
                >
                  <span className="text-slate-800">{o.objeto}</span>
                  <span className="shrink-0 text-xs text-slate-400">{aberto ? "▲" : "▼"}</span>
                </button>
                {aberto && (
                  <div className="space-y-2 bg-slate-50/60 px-3 pb-3 pt-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Conteúdos sugeridos
                    </p>
                    {conteudos.length > 0 ? (
                      <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-600">
                        {conteudos.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400">Este objeto não traz conteúdos sugeridos.</p>
                    )}
                    <button
                      type="button"
                      onClick={() => onAdicionarConteudos([o.objeto, ...conteudos])}
                      className="btn-secondary !px-3 !py-1.5 !text-xs"
                    >
                      {conteudos.length > 0 ? "Adicionar objeto e conteúdos ao plano" : "Adicionar objeto ao plano"}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
