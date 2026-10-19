"use client";

import { useEffect, useState } from "react";
import { Icone, type NomeIcone } from "@/components/icones";

const PASSOS: { tom: string; icone: NomeIcone; titulo: string; texto: string }[] = [
  {
    tom: "ambar",
    icone: "escola",
    titulo: "Cadastre suas escolas e turmas",
    texto: "Uma vez só: nome, município e logo da escola. Depois é só escolher a turma — vale para todos os planos seguintes.",
  },
  {
    tom: "violeta",
    icone: "bussola",
    titulo: "Marque habilidades e conteúdos",
    texto: "As habilidades e competências da BNCC e do Currículo Catarinense já estão cadastradas por etapa e componente. Você só marca.",
  },
  {
    tom: "verde",
    icone: "sparkle",
    titulo: "Peça um rascunho do caminho metodológico",
    texto: "Escolha semana ou aula e quantas partes quer. A IA escreve um rascunho no futuro (“Será realizado…”) para você revisar.",
  },
  {
    tom: "azul",
    icone: "baixar",
    titulo: "Revise, ajuste e baixe",
    texto: "Edite do seu jeito e exporte em PDF ou Word, imprima ou mande um link de leitura para a coordenação e para colegas.",
  },
];

function Cena({ indice }: { indice: number }) {
  if (indice === 0) {
    return (
      <div className="space-y-3">
        {[
          ["Escola", "E.E.B. Exemplo (fictícia)"],
          ["Município", "Exemplo/SC"],
          ["Turma", "1ª série A · Matutino"],
          ["Componente", "Língua Portuguesa"],
        ].map(([r, v]) => (
          <div key={r} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{r}</p>
            <p className="text-sm font-semibold text-slate-800">{v}</p>
          </div>
        ))}
      </div>
    );
  }
  if (indice === 1) {
    return (
      <ul className="space-y-2">
        {[
          ["EM13LP01", "Relacionar o texto, na produção e na leitura, com suas condições de produção e contexto.", true],
          ["EM13LP05", "Analisar, em textos argumentativos, os posicionamentos e os argumentos utilizados.", true],
          ["EM13LP02", "Estabelecer relações entre as partes do texto, considerando a coesão e a coerência.", false],
        ].map(([cod, txt, marcado]) => (
          <li key={String(cod)} className={`flex gap-3 rounded-xl border p-3 text-sm ${marcado ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-white"}`}>
            <span className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border ${marcado ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white"}`}>
              {marcado && <Icone nome="check" className="h-3.5 w-3.5" espessura={3} />}
            </span>
            <span>
              <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs font-bold text-violet-700">{String(cod)}</code>
              <span className="mt-1 block text-slate-700">{String(txt)}</span>
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if (indice === 2) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white">Semana</span>
          <span className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600">Aula</span>
          <span className="ml-auto rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">4 semanas</span>
        </div>
        {[
          "PRIMEIRA SEMANA: Será realizada a retomada dos conhecimentos prévios sobre textos argumentativos…",
          "SEGUNDA SEMANA: Serão apresentados exemplos de artigos de opinião para análise em duplas…",
        ].map((t) => (
          <p key={t} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-950">
            <span className="font-bold">{t.split(":")[0]}:</span>
            {t.slice(t.indexOf(":") + 1)}
          </p>
        ))}
        <p className="text-center text-xs font-semibold text-slate-400">+ mais 2 semanas…</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {(
        [
          ["documento", "PDF", "Pronto para entregar"],
          ["lapis", "Word", "Para editar à vontade"],
          ["imprimir", "Imprimir", "Layout já ajustado"],
          ["envelope", "Link e e-mail", "Compartilhe com colegas"],
        ] as [NomeIcone, string, string][]
      ).map(([ic, t, s]) => (
        <div key={t} className="rounded-2xl border border-primary-200 bg-white p-4 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <Icone nome={ic} className="h-5 w-5" />
          </span>
          <p className="mt-2 text-sm font-bold text-slate-900">{t}</p>
          <p className="text-xs text-slate-500">{s}</p>
        </div>
      ))}
    </div>
  );
}

export default function PassosInterativos() {
  const [ativo, setAtivo] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setAtivo((a) => (a + 1) % PASSOS.length), 5200);
    return () => clearTimeout(t);
  }, [ativo, pausado]);

  const p = PASSOS[ativo];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-stretch gap-6 lg:grid-cols-[1fr_1.05fr]" onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}>
      <ol className="space-y-3" role="tablist" aria-label="Passos">
        {PASSOS.map((s, i) => (
          <li key={s.titulo}>
            <button
              type="button"
              role="tab"
              aria-selected={i === ativo}
              data-tom={s.tom}
              onClick={() => setAtivo(i)}
              className={`ld-passo ${i === ativo ? "ld-passo-on" : ""}`}
            >
              <span className="ld-passo-num">{i + 1}</span>
              <span className="min-w-0 text-left">
                <span className="block text-base font-extrabold text-slate-900">{s.titulo}</span>
                <span className={`block overflow-hidden text-sm leading-relaxed text-slate-600 transition-all duration-500 ${i === ativo ? "mt-1.5 max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>{s.texto}</span>
              </span>
              {i === ativo && !pausado && <span key={ativo} className="ld-passo-tempo" aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ol>

      <div data-tom={p.tom} className="ld-cena" role="tabpanel">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white [background:var(--tom)]">
            <Icone nome={p.icone} className="h-5 w-5" />
          </span>
          <p className="text-sm font-extrabold text-slate-900">Passo {ativo + 1} de {PASSOS.length}</p>
          <span className="ml-auto rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-slate-500">Exemplo ilustrativo</span>
        </div>
        <div key={ativo} className="ld-cena-conteudo">
          <Cena indice={ativo} />
        </div>
      </div>
    </div>
  );
}
