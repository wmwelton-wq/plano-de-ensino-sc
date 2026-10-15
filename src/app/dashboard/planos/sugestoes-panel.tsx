"use client";

import { useId, useMemo, useState, type RefObject } from "react";
import { ordenarAlfabeticamente } from "./sugestoes-avaliacao";
import type { EditorTextoRicoHandle } from "./editor-texto-rico";
import { useAvisoTemporario, useLinhasDoEditor } from "./linhas-do-editor";

interface SugestoesPanelProps {
  rotulo: string;
  itens: string[];
  /** Campo de texto que recebe os itens marcados (e perde os desmarcados). */
  editorRef: RefObject<EditorTextoRicoHandle | null>;
}

/** Lista recolhível de sugestões em ordem alfabética, com caixinhas: marcar põe o item no campo; desmarcar tira. */
export default function SugestoesPanel({ rotulo, itens, editorRef }: SugestoesPanelProps) {
  const texto = useLinhasDoEditor(editorRef);
  const { aviso, mostrar } = useAvisoTemporario();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const idBusca = useId();

  const ordenados = useMemo(() => ordenarAlfabeticamente(itens), [itens]);
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return termo ? ordenados.filter((i) => i.toLowerCase().includes(termo)) : ordenados;
  }, [ordenados, busca]);

  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
        className="btn-azul !px-4 !py-2.5"
      >
        <span aria-hidden="true">{aberto ? "▲" : "▼"}</span>
        {aberto
          ? `Ocultar sugestões de ${rotulo}`
          : `Clique aqui para escolher sugestões de ${rotulo} (${ordenados.length})`}
      </button>

      {aberto && (
        <div className="mt-3 rounded-xl border border-primary-200 bg-white shadow-sm">
          <label htmlFor={idBusca} className="sr-only">
            Buscar nas sugestões
          </label>
          <input
            id={idBusca}
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nas sugestões..."
            className="w-full rounded-t-xl border-b border-primary-100 px-3 py-2 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary-500"
          />
          <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto">
            {filtrados.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-400">Nenhuma sugestão encontrada.</li>
            )}
            {filtrados.map((item) => {
              const marcado = texto.tem(item);
              return (
                <li key={item}>
                  <label className="flex cursor-pointer items-start gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-primary-50">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => {
                        if (marcado) {
                          texto.desmarcar([item]);
                          mostrar("Retirado do campo acima.");
                        } else {
                          texto.marcar([item], "lista");
                          mostrar("Adicionado ao campo acima.");
                        }
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{item}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-slate-200 px-3 py-1.5 text-xs text-slate-400">
            Marque a caixinha para colocar no campo (desmarque para tirar). Você também pode escrever livremente acima.
          </p>
          <p
            role="status"
            aria-live="polite"
            className={`px-3 py-1.5 text-xs font-semibold transition ${aviso ? "bg-emerald-50 text-emerald-800" : "text-transparent"}`}
          >
            {aviso ? `✓ ${aviso}` : "."}
          </p>
        </div>
      )}
    </div>
  );
}
