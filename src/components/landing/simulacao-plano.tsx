"use client";

import { useEffect, useState } from "react";
import { Icone, type NomeIcone } from "@/components/icones";

const ETAPAS: { tom: string; icone: NomeIcone; rotulo: string; detalhe: string }[] = [
  { tom: "ardosia", icone: "pessoa", rotulo: "Identificação", detalhe: "Escola, turma e componente" },
  { tom: "azul", icone: "livro", rotulo: "Ementa", detalhe: "Objetos de conhecimento" },
  { tom: "ciano", icone: "globo", rotulo: "Competências", detalhe: "Gerais e específicas" },
  { tom: "violeta", icone: "bussola", rotulo: "Habilidades da BNCC", detalhe: "Marque, sem digitar código" },
  { tom: "verde", icone: "sparkle", rotulo: "Caminho metodológico", detalhe: "Rascunho com IA, por semana" },
  { tom: "ambar", icone: "baixar", rotulo: "PDF ou Word pronto", detalhe: "Com a logo da sua escola" },
];

/** Cartão animado do hero: as etapas do plano vão sendo concluídas sozinhas (e o visitante pode clicar). */
export default function SimulacaoPlano() {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setAtual((a) => (a + 1) % (ETAPAS.length + 1)), 1700);
    return () => clearInterval(t);
  }, [pausado]);

  const concluidas = Math.min(atual, ETAPAS.length);
  const pct = Math.round((concluidas / ETAPAS.length) * 100);

  return (
    <div className="relative" onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}>
      <div className="ld-flutua-a absolute -bottom-5 -left-6 z-10 hidden items-center gap-2 rounded-2xl bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xl shadow-blue-950/30 sm:flex">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
          <Icone nome="check" className="h-3.5 w-3.5" espessura={2.6} />
        </span>
        Alinhado à BNCC
      </div>
      <div className="ld-flutua-b absolute -right-3 bottom-16 z-10 hidden items-center gap-2 rounded-2xl bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xl shadow-blue-950/30 sm:flex">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
          <Icone nome="sparkle" className="h-3.5 w-3.5" />
        </span>
        Rascunho com IA
      </div>

      <div className="ld-janela">
        <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ml-3 truncate text-xs font-semibold text-slate-500">Plano anual · Língua Portuguesa · 1ª série do Ensino Médio</span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>{concluidas === ETAPAS.length ? "Plano pronto!" : "Montando o plano…"}</span>
            <span className="tabular-nums text-primary-700">{pct}%</span>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full ld-barra" style={{ width: `${pct}%` }} />
          </div>

          <ol className="space-y-2">
            {ETAPAS.map((e, i) => {
              const feita = i < concluidas;
              const ativa = i === concluidas && concluidas < ETAPAS.length;
              return (
                <li key={e.rotulo}>
                  <button
                    type="button"
                    data-tom={e.tom}
                    onClick={() => setAtual(i + 1)}
                    className={`ld-etapa ${feita ? "ld-etapa-feita" : ""} ${ativa ? "ld-etapa-ativa" : ""}`}
                    aria-label={`${e.rotulo}: ${feita ? "concluída" : ativa ? "em andamento" : "pendente"}`}
                  >
                    <span className="ld-etapa-icone">
                      <Icone nome={feita ? "check" : e.icone} className="h-4 w-4" espessura={feita ? 2.6 : 1.8} />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-bold text-slate-900">{e.rotulo}</span>
                      <span className="block truncate text-xs text-slate-500">{e.detalhe}</span>
                    </span>
                    {ativa && <span className="ld-pontos" aria-hidden="true"><i /><i /><i /></span>}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className={`mt-4 rounded-xl border border-dashed p-3 text-xs leading-relaxed transition-all duration-500 ${concluidas >= 5 ? "border-violet-300 bg-violet-50 text-violet-900" : "border-slate-200 bg-slate-50 text-slate-400"}`}>
            <span className="font-bold">PRIMEIRA SEMANA:</span>{" "}
            {concluidas >= 5 ? "Será realizada a retomada dos conhecimentos prévios, seguida da leitura compartilhada de um texto de opinião…" : "O texto do caminho metodológico aparece aqui."}
          </div>
        </div>
      </div>
    </div>
  );
}
