"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Icone, type NomeIcone } from "@/components/icones";
import FluxoPassos, { type GrupoFluxo } from "../anual/fluxo-passos";
import type { TomSecao } from "./secao-plano";

/** Um passo do plano mensal: pertence a um grupo (a faixa de cima) e mostra uma seção de cada vez. */
export interface PassoMensal {
  chave: string;
  rotulo: string;
  grupo: string;
  grupoRotulo: string;
  grupoTom: TomSecao;
  grupoIcone: NomeIcone;
  tom: TomSecao;
  /** Passo que pode ficar em branco (aparece com a etiqueta "opcional"). */
  opcional?: boolean;
}

/**
 * Controle do plano mensal passo a passo: guarda o passo atual e quais já foram vistos. Os campos de TODOS os
 * passos continuam na página (os que não estão na vez ficam escondidos), por isso nada do que o professor
 * escreveu se perde ao trocar de passo e tudo é enviado ao salvar.
 */
export function useFluxoMensal(passos: PassoMensal[]) {
  const [bruto, setBruto] = useState(passos[0]?.chave ?? "");
  const [vistos, setVistos] = useState<Set<string>>(() => new Set());
  const atual = passos.some((p) => p.chave === bruto) ? bruto : passos[0]?.chave ?? "";
  const indice = Math.max(
    0,
    passos.findIndex((p) => p.chave === atual)
  );
  const topo = useRef<HTMLDivElement>(null);
  const primeira = useRef(true);

  function ir(chave: string) {
    setVistos((v) => (v.has(atual) ? v : new Set(v).add(atual)));
    setBruto(chave);
  }

  // Ao trocar de passo, volta ao início do formulário (menos na primeira exibição da tela).
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    topo.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [atual]);

  return {
    atual,
    indice,
    topo,
    vistos,
    ir,
    avancar: () => indice < passos.length - 1 && ir(passos[indice + 1].chave),
    voltar: () => indice > 0 && ir(passos[indice - 1].chave),
    ultimo: indice === passos.length - 1,
  };
}

/** Faixa de cima: grupos (Identificação, uma etiqueta por componente...) e, embaixo, os passos do grupo atual. */
export function FluxoTopo({
  passos,
  atual,
  vistos,
  aoIr,
  topo,
}: {
  passos: PassoMensal[];
  atual: string;
  vistos: Set<string>;
  aoIr: (chave: string) => void;
  topo: RefObject<HTMLDivElement | null>;
}) {
  const grupos = useMemo<GrupoFluxo[]>(() => {
    const out: GrupoFluxo[] = [];
    for (const p of passos) {
      let g = out.find((x) => x.id === p.grupo);
      if (!g) {
        g = { id: p.grupo, rotulo: p.grupoRotulo, tom: p.grupoTom, icone: p.grupoIcone, passos: [] };
        out.push(g);
      }
      g.passos.push({ chave: p.chave, rotulo: p.rotulo, feito: vistos.has(p.chave) && p.chave !== atual, tom: p.tom, opcional: p.opcional });
    }
    return out;
  }, [passos, vistos, atual]);

  return (
    <div ref={topo} className="scroll-mt-20">
      <FluxoPassos grupos={grupos} atual={atual} aoIr={aoIr} />
    </div>
  );
}

/** Barra de baixo: Voltar / Próximo e, no último passo, o botão de salvar. */
export function FluxoRodape({
  passos,
  indice,
  ultimo,
  voltar,
  avancar,
  pendente,
  textoBotao,
  erro,
}: {
  passos: PassoMensal[];
  indice: number;
  ultimo: boolean;
  voltar: () => void;
  avancar: () => void;
  pendente: boolean;
  textoBotao: string;
  erro?: string;
}) {
  const passo = passos[indice];
  return (
    <div className="sticky bottom-3 z-[5] space-y-2">
      {erro && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 shadow-sm">
          <Icone nome="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
          {erro}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur">
        <button type="button" onClick={voltar} disabled={indice === 0} className="btn-azul-suave">
          <Icone nome="setaEsquerda" className="h-4 w-4" />
          Voltar
        </button>
        <p className="order-last w-full text-center text-xs text-slate-600 sm:order-none sm:w-auto">
          Passo {indice + 1} de {passos.length} · <span className="font-semibold text-slate-800">{passo?.grupoRotulo ? `${passo.grupoRotulo} · ` : ""}{passo?.rotulo}</span>
        </p>
        <div className="flex items-center gap-2">
          <button type="submit" disabled={pendente} className={ultimo ? "btn-azul" : "btn-azul-suave"}>
            {pendente ? "Salvando..." : ultimo ? textoBotao : "Salvar e continuar depois"}
          </button>
          {!ultimo && (
            <button type="button" onClick={avancar} className="btn-azul">
              Próximo
              <Icone nome="setaDireita" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Se o navegador recusar o envio porque um campo obrigatório (título, ano letivo, disciplina) está vazio num passo
 * escondido, volta para o passo da identificação e mostra o aviso ali — senão o botão pareceria "não fazer nada".
 */
export function aoCampoInvalido(irParaIdentificacao: () => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    const alvo = e.target as HTMLInputElement | HTMLSelectElement;
    if (alvo.offsetParent !== null) return; // campo visível: o navegador já mostra o aviso
    e.preventDefault();
    irParaIdentificacao();
    window.setTimeout(() => alvo.reportValidity?.(), 80);
  };
}

/** Enter dentro de um campo de uma linha não deve salvar o plano sem querer (agora que o plano tem vários passos). */
export function semEnterQueEnvia(e: React.KeyboardEvent<HTMLFormElement>) {
  const alvo = e.target as HTMLElement;
  if (e.key === "Enter" && alvo.tagName === "INPUT" && (alvo as HTMLInputElement).type !== "submit") e.preventDefault();
}
