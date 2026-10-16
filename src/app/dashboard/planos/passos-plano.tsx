"use client";

import { useEffect, useState } from "react";

export interface PassoPlano {
  id: string;
  rotulo: string;
}

/**
 * Barra fixa no topo do formulário com os passos do plano: o professor vê
 * onde está, quantos passos faltam e pode pular direto para qualquer um.
 */
export default function PassosPlano({ passos }: { passos: PassoPlano[] }) {
  const [ativo, setAtivo] = useState(passos[0]?.id ?? "");

  useEffect(() => {
    const elementos = passos
      .map((p) => document.getElementById(p.id))
      .filter((e): e is HTMLElement => e !== null);
    if (elementos.length === 0 || typeof IntersectionObserver === "undefined") return;

    const observador = new IntersectionObserver(
      (entradas) => {
        const visiveis = entradas.filter((e) => e.isIntersecting);
        if (visiveis.length > 0) {
          visiveis.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setAtivo(visiveis[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px" }
    );
    elementos.forEach((e) => observador.observe(e));
    return () => observador.disconnect();
  }, [passos]);

  return (
    <nav
      aria-label="Passos do plano"
      className="sticky top-[4.25rem] z-[5] -mx-1 overflow-x-auto rounded-xl border border-slate-300 bg-white px-2 py-2 shadow-sm print:hidden"
    >
      <ol className="flex min-w-max items-center gap-1">
        {passos.map((p, i) => {
          const atual = p.id === ativo;
          return (
            <li key={p.id} className="flex items-center">
              <a
                href={`#${p.id}`}
                aria-current={atual ? "step" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  atual
                    ? "bg-primary-800 text-white"
                    : "text-slate-600 hover:bg-primary-50 hover:text-primary-700"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    atual ? "bg-white/25" : "bg-primary-100 text-primary-700"
                  }`}
                >
                  {i + 1}
                </span>
                {p.rotulo}
              </a>
              {i < passos.length - 1 && (
                <span aria-hidden="true" className="mx-0.5 text-slate-300">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
