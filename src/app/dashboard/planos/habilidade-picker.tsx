"use client";

import { useId, useMemo, useState } from "react";
import type { HabilidadeCurricular } from "@/lib/database.types";

interface HabilidadePickerProps {
  titulo: string;
  descricaoAjuda?: string;
  habilidades: HabilidadeCurricular[];
  selecionadasIniciais: string[];
  vazio: string;
}

export default function HabilidadePicker({
  titulo,
  descricaoAjuda,
  habilidades,
  selecionadasIniciais,
  vazio,
}: HabilidadePickerProps) {
  const [busca, setBusca] = useState("");
  const [selecionadas, setSelecionadas] = useState<Set<string>>(
    new Set(selecionadasIniciais)
  );
  const buscaId = useId();

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return habilidades;
    return habilidades.filter(
      (h) =>
        h.codigo?.toLowerCase().includes(termo) ||
        h.descricao.toLowerCase().includes(termo)
    );
  }, [busca, habilidades]);

  function alternar(id: string) {
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) {
        novo.delete(id);
      } else {
        novo.add(id);
      }
      return novo;
    });
  }

  return (
    <div>
      <label className="field-label">{titulo}</label>
      {descricaoAjuda && <p className="text-xs text-slate-400">{descricaoAjuda}</p>}

      {habilidades.length === 0 ? (
        <p className="mt-2 rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-400">
          {vazio}
        </p>
      ) : (
        <div className="mt-1 rounded-md border border-slate-300">
          <label htmlFor={buscaId} className="sr-only">
            Buscar em &quot;{titulo}&quot; por código ou palavra-chave
          </label>
          <input
            id={buscaId}
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por código ou palavra-chave..."
            className="w-full border-b border-slate-200 px-3 py-2 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary-500"
          />
          <div className="max-h-56 overflow-y-auto p-2">
            {filtradas.length === 0 && (
              <p className="px-2 py-2 text-sm text-slate-400">
                Nenhuma habilidade encontrada para essa busca.
              </p>
            )}
            {filtradas.map((h) => (
              <label
                key={h.id}
                className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  name="habilidade_ids"
                  value={h.id}
                  checked={selecionadas.has(h.id)}
                  onChange={() => alternar(h.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span>
                  {h.codigo && (
                    <span className="font-medium text-slate-900">({h.codigo}) </span>
                  )}
                  <span className="text-slate-600">{h.descricao}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="border-t border-slate-200 px-3 py-1.5 text-xs text-slate-400">
            {selecionadas.size} selecionada(s)
          </p>
        </div>
      )}
    </div>
  );
}
