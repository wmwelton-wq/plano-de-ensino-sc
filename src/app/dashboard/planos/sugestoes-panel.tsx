"use client";

import { useId, useMemo, useState } from "react";
import { ordenarAlfabeticamente } from "./sugestoes-avaliacao";

interface SugestoesPanelProps {
  rotulo: string;
  itens: string[];
  onAdicionar: (item: string) => void;
}

/** Lista recolhível de sugestões em ordem alfabética; cada clique acrescenta o item ao campo. */
export default function SugestoesPanel({ rotulo, itens, onAdicionar }: SugestoesPanelProps) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const idBusca = useId();

  const ordenados = useMemo(() => ordenarAlfabeticamente(itens), [itens]);
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return termo ? ordenados.filter((i) => i.toLowerCase().includes(termo)) : ordenados;
  }, [ordenados, busca]);

  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
        className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
      >
        {aberto ? "▲ Ocultar sugestões" : "▼ Ver sugestões"} ({rotulo}: {ordenados.length})
      </button>

      {aberto && (
        <div className="mt-2 rounded-md border border-slate-300 bg-white">
          <label htmlFor={idBusca} className="sr-only">
            Buscar nas sugestões
          </label>
          <input
            id={idBusca}
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nas sugestões..."
            className="w-full rounded-t-md border-b border-slate-200 px-3 py-2 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary-500"
          />
          <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto">
            {filtrados.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-400">Nenhuma sugestão encontrada.</li>
            )}
            {filtrados.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onAdicionar(item)}
                  className="flex w-full items-start gap-2 px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span aria-hidden="true" className="font-bold text-primary-600">
                    +
                  </span>
                  <span>{item}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t border-slate-200 px-3 py-1.5 text-xs text-slate-400">
            Clique para adicionar ao campo. Você também pode escrever livremente acima.
          </p>
        </div>
      )}
    </div>
  );
}
