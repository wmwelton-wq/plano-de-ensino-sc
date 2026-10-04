"use client";

import { useId, useMemo, useState } from "react";
import type { CompetenciaCurricular } from "@/lib/database.types";

interface CompetenciaPickerProps {
  titulo: string;
  descricaoAjuda?: string;
  competencias: CompetenciaCurricular[];
  selecionadasIniciais: string[];
  vazio: string;
}

export default function CompetenciaPicker({
  titulo,
  descricaoAjuda,
  competencias,
  selecionadasIniciais,
  vazio,
}: CompetenciaPickerProps) {
  const [busca, setBusca] = useState("");
  const [selecionadas, setSelecionadas] = useState<Set<string>>(
    new Set(selecionadasIniciais)
  );
  const buscaId = useId();

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return competencias;
    return competencias.filter(
      (c) =>
        c.titulo?.toLowerCase().includes(termo) ||
        c.descricao.toLowerCase().includes(termo)
    );
  }, [busca, competencias]);

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

      {competencias.length === 0 ? (
        <p className="mt-2 rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-400">
          {vazio}
        </p>
      ) : (
        <div className="mt-1 rounded-md border border-slate-300">
          <label htmlFor={buscaId} className="sr-only">
            Buscar em &quot;{titulo}&quot; por palavra-chave
          </label>
          <input
            id={buscaId}
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por palavra-chave..."
            className="w-full border-b border-slate-200 px-3 py-2 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary-500"
          />
          <div className="max-h-56 overflow-y-auto p-2">
            {filtradas.length === 0 && (
              <p className="px-2 py-2 text-sm text-slate-400">
                Nenhuma competência encontrada para essa busca.
              </p>
            )}
            {filtradas.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  name="competencia_ids"
                  value={c.id}
                  checked={selecionadas.has(c.id)}
                  onChange={() => alternar(c.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span>
                  <span className="font-medium text-slate-900">
                    ({c.numero}){c.titulo ? ` ${c.titulo} - ` : " "}
                  </span>
                  <span className="text-slate-600">{c.descricao}</span>
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
