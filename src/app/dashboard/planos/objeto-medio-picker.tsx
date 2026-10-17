"use client";

import { useEffect, useId, useMemo, useState, type RefObject } from "react";
import type { ObjetoConhecimentoMedio } from "@/lib/database.types";
import type { EditorTextoRicoHandle } from "./editor-texto-rico";
import { useAvisoTemporario, useCaixinhasIndependentes, type ItemCaixinha } from "./linhas-do-editor";

interface ObjetoMedioPickerProps {
  /** Objetos de conhecimento da disciplina escolhida (todas as séries). */
  objetos: ObjetoConhecimentoMedio[];
  /** Série sugerida pelo seletor de turma (1 a 3); o professor pode trocar. */
  serieSugerida?: number | null;
  /** Campo de texto dos conteúdos: marcar uma caixinha escreve a linha nele e desmarcar a tira. */
  editorRef: RefObject<EditorTextoRicoHandle | null>;
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
  objetos,
  serieSugerida = null,
  editorRef,
  vazio,
}: ObjetoMedioPickerProps) {
  const idSerie = useId();
  const idBusca = useId();
  const caixas = useCaixinhasIndependentes(editorRef);
  const { aviso, mostrar } = useAvisoTemporario();

  const series = useMemo(
    () => Array.from(new Set(objetos.map((o) => o.serie))).sort((a, b) => a - b),
    [objetos]
  );
  const [serieManual, setSerieManual] = useState<number | null>(null);
  const preferida = serieManual ?? serieSugerida;
  const serie = preferida !== null && series.includes(preferida) ? preferida : series[0] ?? null;

  const [ativo, setAtivo] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [painelAberto, setPainelAberto] = useState(false);

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

  // Plano já salvo: marca as caixinhas dos objetos e conteúdos que já estão escritos no campo.
  const { textoPronto, jaDecidiu, semear } = caixas;
  useEffect(() => {
    if (objetos.length === 0 || !textoPronto || jaDecidiu()) return;
    const candidatos: ItemCaixinha[] = [];
    for (const o of doAno) {
      candidatos.push({ chave: `o:${o.id}`, linha: o.objeto });
      for (const c of itensDeConteudo(o.conteudos)) candidatos.push({ chave: `c:${o.id}||${c}`, linha: c, pai: `o:${o.id}` });
    }
    semear(candidatos);
  }, [doAno, textoPronto]); // eslint-disable-line react-hooks/exhaustive-deps

  if (objetos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-primary-200 bg-white px-3 py-4 text-sm text-slate-500">
        {vazio}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        aria-expanded={painelAberto}
        onClick={() => setPainelAberto((a) => !a)}
        className="btn-verde w-full sm:w-auto"
      >
        <span aria-hidden="true">{painelAberto ? "▲" : "＋"}</span>
        {painelAberto
          ? "Fechar sugestões de objetos e conteúdos"
          : "Clique aqui para escolher objetos e conteúdos sugeridos"}
      </button>

      {painelAberto && (
        <div className="space-y-3 rounded-xl border border-primary-200 bg-white p-4 shadow-sm">
          <p
            role="status"
            aria-live="polite"
            className={`min-h-[2.25rem] rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              aviso ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "text-transparent"
            }`}
          >
            {aviso ? `✓ ${aviso}` : "."}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div className="overflow-hidden rounded-xl border border-primary-200">
            <div className="border-b border-primary-100 bg-primary-50/50 px-3 py-2">
              <p className="text-sm font-bold text-slate-800">
                Objetos de conhecimento <span className="font-normal text-slate-400">(ordem alfabética)</span>
              </p>
              <p className="text-xs text-slate-500">
                Marque a caixinha do objeto para colocá-lo no plano com todos os conteúdos sugeridos. Abra “Conteúdos” para marcar só alguns. Desmarcar tira do plano.
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
                className="mt-2 w-full rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
              />
            </div>

            <ul className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto">
              {filtrados.length === 0 && (
                <li className="px-3 py-3 text-sm text-slate-400">Nenhum objeto encontrado para essa busca.</li>
              )}
              {filtrados.map((o) => {
                const aberto = ativo === o.id;
                const conteudos = itensDeConteudo(o.conteudos);
                const itemObjeto: ItemCaixinha = { chave: `o:${o.id}`, linha: o.objeto };
                const itensConteudo: ItemCaixinha[] = conteudos.map((c) => ({ chave: `c:${o.id}||${c}`, linha: c }));
                const objetoMarcado = caixas.marcado(itemObjeto.chave);
                const conteudosMarcados = itensConteudo.filter((i) => caixas.marcado(i.chave)).length;
                const parcial = conteudosMarcados > 0 && (!objetoMarcado || conteudosMarcados < conteudos.length);

                function alternarObjeto() {
                  if (objetoMarcado || conteudosMarcados > 0) {
                    caixas.desmarcar([itemObjeto, ...itensConteudo]);
                    mostrar("Retirado do plano.");
                  } else {
                    caixas.marcar([itemObjeto, ...itensConteudo]);
                    mostrar(
                      conteudos.length > 0
                        ? "Objeto e conteúdos adicionados ao plano, no campo logo abaixo."
                        : "Objeto adicionado ao plano, no campo logo abaixo."
                    );
                  }
                }
                function alternarConteudo(i: ItemCaixinha) {
                  if (caixas.marcado(i.chave)) {
                    caixas.desmarcar([i]);
                    mostrar("Conteúdo retirado do plano.");
                  } else {
                    caixas.marcar(objetoMarcado ? [i] : [itemObjeto, i]);
                    mostrar("Conteúdo adicionado ao plano, no campo logo abaixo.");
                  }
                }

                return (
                  <li key={o.id}>
                    <div className={`flex items-start gap-2 px-3 py-2.5 text-sm ${aberto ? "bg-primary-50/70" : ""}`}>
                      <input
                        id={`${idBusca}-obj-${o.id}`}
                        type="checkbox"
                        checked={objetoMarcado}
                        ref={(el) => {
                          if (el) el.indeterminate = parcial;
                        }}
                        onChange={alternarObjeto}
                        aria-label={`Colocar no plano: ${o.objeto}`}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor={`${idBusca}-obj-${o.id}`} className="min-w-0 flex-1 cursor-pointer text-slate-800">
                        {o.objeto}
                      </label>
                      {conteudos.length > 0 && (
                        <button
                          type="button"
                          aria-expanded={aberto}
                          onClick={() => setAtivo(aberto ? null : o.id)}
                          className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                        >
                          {conteudosMarcados > 0 ? `${conteudosMarcados}/${conteudos.length} · ` : ""}
                          Conteúdos ({conteudos.length}) {aberto ? "▲" : "▼"}
                        </button>
                      )}
                    </div>
                    {aberto && conteudos.length > 0 && (
                      <div className="space-y-0.5 bg-primary-50/40 px-3 pb-3 pt-1 pl-9">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Conteúdos sugeridos</p>
                        {itensConteudo.map((ic) => (
                          <label
                            key={ic.chave}
                            className="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1 text-sm text-slate-700 hover:bg-white"
                          >
                            <input
                              type="checkbox"
                              checked={caixas.marcado(ic.chave)}
                              onChange={() => alternarConteudo(ic)}
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span>{ic.linha}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
