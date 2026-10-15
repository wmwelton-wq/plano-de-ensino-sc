"use client";

import { useState, useTransition } from "react";
import { alternarFavorito } from "./actions";

/** Estrela de "favorito / em uso": favoritos aparecem primeiro nas listas. */
export default function EstrelaFavorito({
  tipo,
  planoId,
  favorito,
  rotulo = false,
}: {
  tipo: "mensais" | "anuais";
  planoId: string;
  favorito: boolean;
  /** Mostra também o texto ao lado da estrela (usado no topo do plano). */
  rotulo?: boolean;
}) {
  const [ativo, setAtivo] = useState(favorito);
  const [pendente, iniciar] = useTransition();

  function alternar() {
    const novo = !ativo;
    setAtivo(novo);
    iniciar(async () => {
      const ok = await alternarFavorito(tipo, planoId, novo);
      if (!ok) setAtivo(!novo);
    });
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={pendente}
      aria-pressed={ativo}
      title={ativo ? "Tirar dos favoritos" : "Marcar como favorito (em uso)"}
      className={`flex shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-lg font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        ativo
          ? "border-amber-400 bg-amber-50 text-amber-500"
          : "border-slate-200 bg-white text-slate-300 hover:border-amber-300 hover:text-amber-400"
      } ${rotulo ? "py-2 text-sm" : ""}`}
    >
      <span aria-hidden="true" className="text-xl leading-none">
        {ativo ? "★" : "☆"}
      </span>
      {rotulo ? <span className="text-slate-700">{ativo ? "Favorito (em uso)" : "Marcar como favorito"}</span> : <span className="sr-only">Favorito</span>}
    </button>
  );
}
