"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface ItemBusca {
  id: string;
  titulo: string;
  tipo: "mensais" | "anuais";
  turma: string;
  escola: string;
  status: string;
}

const norm = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Caixa de busca geral: título, escola ou turma. */
export default function BuscaPlanos({ itens }: { itens: ItemBusca[] }) {
  const [termo, setTermo] = useState("");

  const resultados = useMemo(() => {
    const palavras = norm(termo).split(/\s+/).filter(Boolean);
    if (palavras.length === 0) return [];
    return itens
      .filter((i) => {
        const alvo = norm(`${i.titulo} ${i.escola} ${i.turma}`);
        return palavras.every((p) => alvo.includes(p));
      })
      .slice(0, 12);
  }, [termo, itens]);

  return (
    <div>
      <label htmlFor="busca-geral" className="sr-only">
        Buscar plano por título, escola ou turma
      </label>
      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          🔎
        </span>
        <input
          id="busca-geral"
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar plano por título, escola ou turma..."
          className="w-full rounded-2xl border-2 border-primary-300 bg-white py-3 pl-11 pr-4 text-base shadow-sm focus:border-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        />
      </div>

      {termo.trim() !== "" && (
        <div className="mt-3">
          {resultados.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
              Nenhum plano encontrado para essa busca.
            </p>
          ) : (
            <ul className="space-y-2">
              {resultados.map((r) => (
                <li key={`${r.tipo}-${r.id}`}>
                  <Link
                    href={`${r.tipo === "anuais" ? "/dashboard/anual" : "/dashboard/planos"}/${r.id}`}
                    className="card card-interactive flex flex-wrap items-center justify-between gap-2 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-900">{r.titulo}</span>
                      <span className="block truncate text-sm text-slate-500">
                        {r.escola || "Sem escola definida"} · {r.turma || "Sem turma definida"}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs font-bold">
                      <span className="rounded-full bg-primary-100 px-2.5 py-1 text-primary-800">
                        {r.tipo === "anuais" ? "Anual" : "Mensal"}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 ${
                          r.status === "finalizado" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {r.status === "finalizado" ? "Finalizado" : "Rascunho"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
