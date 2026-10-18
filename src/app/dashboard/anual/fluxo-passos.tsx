"use client";

import { Icone, type NomeIcone } from "@/components/icones";
import type { TomSecao } from "../planos/secao-plano";

export interface PassoFluxo {
  chave: string;
  rotulo: string;
  /** Já tem o que é essencial neste passo. */
  feito: boolean;
  /** Cor do passo (cada tipo de passo tem a sua). */
  tom: TomSecao;
  /** Passo que pode ficar em branco (não conta para "completo" e aparece com a etiqueta "opcional"). */
  opcional?: boolean;
}

export interface GrupoFluxo {
  id: string;
  rotulo: string;
  tom: TomSecao;
  icone: NomeIcone;
  passos: PassoFluxo[];
}

/**
 * Barra de etapas do plano passo a passo: em cima, os grupos (Identificação, uma etiqueta por disciplina, Fechamento);
 * embaixo, os passos do grupo em que o professor está. Só um passo aparece na tela de cada vez.
 */
export default function FluxoPassos({ grupos, atual, aoIr }: { grupos: GrupoFluxo[]; atual: string; aoIr: (chave: string) => void }) {
  const grupoAtual = grupos.find((g) => g.passos.some((p) => p.chave === atual)) ?? grupos[0];

  return (
    <nav aria-label="Etapas do plano" className="fluxo-barra sticky top-[4.25rem] z-[5] -mx-1 space-y-2 p-3 print:hidden">
      <ol className="flex gap-1.5 overflow-x-auto pb-0.5">
        {grupos.map((g) => {
          const ativo = g.id === grupoAtual.id;
          const obrigatorios = g.passos.filter((p) => !p.opcional);
          const feitos = obrigatorios.filter((p) => p.feito).length;
          const completo = feitos === obrigatorios.length;
          return (
            <li key={g.id} className="shrink-0" data-tom={g.tom}>
              <button
                type="button"
                onClick={() => aoIr(ativo ? atual : g.passos[0].chave)}
                aria-current={ativo ? "step" : undefined}
                className="fluxo-grupo"
              >
                <Icone nome={completo && !ativo ? "check" : g.icone} className="h-4 w-4" />
                <span className="max-w-[11rem] truncate">{g.rotulo}</span>
                {obrigatorios.length > 1 && (
                  <span className={`rounded-full px-1.5 text-xs font-bold ${ativo ? "bg-white/25" : "bg-white/80 text-slate-600"}`}>
                    {feitos}/{obrigatorios.length}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      {grupoAtual.passos.length > 1 && (
        <ol className="flex gap-1.5 overflow-x-auto rounded-2xl bg-slate-50 p-1.5 ring-1 ring-slate-200/70">
          {grupoAtual.passos.map((p, i) => {
            const ativo = p.chave === atual;
            return (
              <li key={p.chave} className="shrink-0" data-tom={p.tom}>
                <button
                  type="button"
                  onClick={() => aoIr(p.chave)}
                  aria-current={ativo ? "step" : undefined}
                  className="fluxo-passo"
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
                    style={ativo ? { background: "rgba(255,255,255,.25)", color: "#fff" } : { background: p.feito ? "var(--tom)" : "var(--tom-claro)", color: p.feito ? "#fff" : "var(--tom)" }}
                  >
                    {p.feito ? <Icone nome="check" className="h-3 w-3" espessura={3} /> : i + 1}
                  </span>
                  {p.rotulo}
                  {p.opcional && !ativo && <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">opcional</span>}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}
