"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icone } from "@/components/icones";
import FormularioSugestao, { type ContextoSugestao } from "./formulario-sugestao";

/**
 * Botão "Faltou algo?" para usar dentro do plano: abre uma janela sobreposta (fora do formulário do plano, para não
 * misturar os campos) já com a disciplina e a série preenchidas.
 */
export default function FaltouAlgoBotao({ tipo = "objeto_conhecimento", contexto, rotulo = "Faltou algo? Avise a gente" }: { tipo?: string; contexto?: ContextoSugestao; rotulo?: string }) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const tecla = (ev: KeyboardEvent) => ev.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aberto]);

  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-700 underline-offset-2 hover:underline">
        <Icone nome="lampada" className="h-4 w-4" />
        {rotulo}
      </button>
      {aberto &&
        typeof document !== "undefined" &&
        createPortal(
          // O portal leva a janela para fora do <form> do plano; paramos os eventos para que digitar aqui não conte como mudança no plano.
          <div
            className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center"
            role="presentation"
            onClick={() => setAberto(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Faltou algo no plano?"
              onClick={(ev) => ev.stopPropagation()}
              onChange={(ev) => ev.stopPropagation()}
              onInput={(ev) => ev.stopPropagation()}
              onKeyDown={(ev) => ev.stopPropagation()}
              className="my-auto w-full max-w-xl space-y-3 rounded-3xl bg-white p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Faltou algo no plano?</h2>
                  <p className="text-sm text-slate-600">Conte o que você não achou. Nós analisamos e atualizamos o aplicativo.</p>
                </div>
                <button type="button" onClick={() => setAberto(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
                  Fechar
                </button>
              </div>
              <FormularioSugestao tipoInicial={tipo} contexto={contexto} />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
