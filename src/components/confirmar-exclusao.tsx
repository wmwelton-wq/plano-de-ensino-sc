"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Icone } from "@/components/icones";

interface ConfirmarExclusaoProps {
  /** Ação do servidor que apaga o item (a mesma que já era usada). */
  excluirAction: () => Promise<void>;
  /** Texto do botão que abre o aviso (ex.: "Excluir plano"). */
  rotulo: string;
  /** O que será apagado, em poucas palavras (ex.: "este plano"). */
  oQue: string;
  /** Frase extra sobre as consequências (opcional). */
  detalhe?: string;
  /** Classe do botão que abre o aviso. */
  classeBotao?: string;
}

function BotaoConfirmar({ liberado }: { liberado: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!liberado || pending}
      aria-busy={pending}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Excluindo…" : "Excluir para sempre"}
    </button>
  );
}

/**
 * Aviso bem visível antes de excluir: explica que não há como recuperar e só libera o botão vermelho depois que o
 * professor marca que entendeu. Ao confirmar, envia o mesmo formulário de antes (a exclusão em si não mudou).
 */
export default function ConfirmarExclusao({ excluirAction, rotulo, oQue, detalhe, classeBotao = "btn-perigo-suave" }: ConfirmarExclusaoProps) {
  const [aberto, setAberto] = useState(false);
  const [entendi, setEntendi] = useState(false);
  const idTitulo = useId();
  const cancelar = useRef<HTMLButtonElement>(null);

  function fechar() {
    setAberto(false);
    setEntendi(false);
  }

  useEffect(() => {
    if (!aberto) return;
    cancelar.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aberto]);

  return (
    <form action={excluirAction}>
      <button type="button" onClick={() => setAberto(true)} className={classeBotao}>
        {rotulo}
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center print:hidden" role="presentation" onClick={fechar}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={idTitulo}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-red-200 bg-white shadow-2xl"
          >
            <div className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-rose-600 px-5 py-4 text-white">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20" aria-hidden="true">
                <Icone nome="alerta" className="h-6 w-6" />
              </span>
              <h2 id={idTitulo} className="text-lg font-extrabold leading-tight">
                Atenção: exclusão definitiva
              </h2>
            </div>
            <div className="space-y-3 p-5 text-sm text-slate-700">
              <p>
                Você vai excluir <strong>{oQue}</strong>.
              </p>
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 font-semibold text-red-800">
                Depois de excluir, não será mais possível recuperar. Não existe lixeira nem como desfazer.
              </p>
              {detalhe && <p className="text-slate-600">{detalhe}</p>}
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={entendi}
                  onChange={(e) => setEntendi(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                Entendi que não poderei recuperar.
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
              <button ref={cancelar} type="button" onClick={fechar} className="btn-azul-suave">
                Cancelar, manter
              </button>
              <BotaoConfirmar liberado={entendi} />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
