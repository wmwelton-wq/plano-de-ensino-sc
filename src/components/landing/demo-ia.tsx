"use client";

import { useEffect, useRef, useState } from "react";
import { Icone } from "@/components/icones";

type Divisao = "semana" | "aula";
const MAX: Record<Divisao, number> = { semana: 5, aula: 16 };
const ORD = ["PRIMEIRA", "SEGUNDA", "TERCEIRA", "QUARTA", "QUINTA"];

const TEXTOS_SEMANA = [
  "Será realizada a retomada dos conhecimentos prévios sobre textos argumentativos, com roda de conversa e levantamento de exemplos do cotidiano dos estudantes.",
  "Serão apresentados artigos de opinião para leitura compartilhada; os estudantes serão convidados a identificar a tese e os argumentos em duplas.",
  "Será proposta a análise das estratégias de persuasão, com registro coletivo no quadro e comparação entre diferentes pontos de vista.",
  "Será feita a produção inicial de um texto argumentativo, com orientações da professora durante a escrita e troca de rascunhos entre colegas.",
  "Será realizada a revisão colaborativa dos textos, seguida da socialização das produções e da autoavaliação orientada.",
];
const TEXTOS_AULA = [
  "Será apresentada a proposta da sequência e realizada a roda de conversa inicial.",
  "Serão lidos dois textos curtos de opinião, com marcação coletiva das ideias principais.",
  "Os estudantes serão convidados a localizar a tese em cada texto, em duplas.",
  "Será feita a classificação dos argumentos em um quadro compartilhado.",
  "Será proposta a análise de exemplos de contra-argumentação.",
  "Serão exploradas estratégias de persuasão em textos de diferentes gêneros.",
  "Será realizada uma oficina de planejamento do texto individual.",
  "Será iniciada a escrita do primeiro parágrafo, com apoio da professora.",
  "Será feita a troca de rascunhos entre colegas para leitura crítica.",
  "Será realizada a reescrita a partir dos comentários recebidos.",
  "Serão apresentados critérios de revisão em uma lista de verificação.",
  "Será feita a revisão coletiva de um texto-modelo.",
  "Será realizada a leitura em voz alta de trechos selecionados.",
  "Será proposta a autoavaliação orientada da produção.",
  "Será feita a socialização dos textos finais.",
  "Será realizado o fechamento da sequência, com retomada do que foi aprendido.",
];

function rotulo(d: Divisao, i: number) {
  return d === "aula" ? `AULA ${i + 1}` : `${ORD[i]} SEMANA`;
}

export default function DemoIA() {
  const [divisao, setDivisao] = useState<Divisao>("semana");
  const [qtd, setQtd] = useState(4);
  const [itens, setItens] = useState<string[]>([]);
  const [gerando, setGerando] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function limpar() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }
  useEffect(() => limpar, []);

  function trocar(d: Divisao) {
    limpar();
    setGerando(false);
    setItens([]);
    setDivisao(d);
    setQtd(d === "semana" ? 4 : 6);
  }
  function mudarQtd(n: number) {
    limpar();
    setGerando(false);
    setItens([]);
    setQtd(Math.max(1, Math.min(MAX[divisao], n)));
  }

  function gerar() {
    limpar();
    setItens([]);
    setGerando(true);
    const fonte = divisao === "semana" ? TEXTOS_SEMANA : TEXTOS_AULA;
    for (let i = 0; i < qtd; i++) {
      timers.current.push(
        setTimeout(() => {
          setItens((atual) => [...atual, fonte[i]]);
          if (i === qtd - 1) setGerando(false);
        }, 500 + i * 650),
      );
    }
  }

  return (
    <div className="ld-vidro rounded-3xl p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-200">Dividir o texto por</p>
          <div role="radiogroup" aria-label="Dividir o texto por" className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-white/10 p-1">
            {(["semana", "aula"] as const).map((op) => (
              <button
                key={op}
                type="button"
                role="radio"
                aria-checked={divisao === op}
                onClick={() => trocar(op)}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition ${divisao === op ? "bg-white text-primary-800 shadow" : "text-blue-100 hover:bg-white/10"}`}
              >
                {op === "semana" ? "Semana" : "Aula"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-200">
            Quantas {divisao === "semana" ? "semanas" : "aulas"}? <span className="font-medium normal-case text-blue-300">(máx. {MAX[divisao]})</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" aria-label="Diminuir" onClick={() => mudarQtd(qtd - 1)} className="ld-mini-btn">−</button>
            <span className="min-w-12 rounded-xl bg-white/10 px-4 py-2 text-center text-lg font-extrabold tabular-nums text-white">{qtd}</span>
            <button type="button" aria-label="Aumentar" onClick={() => mudarQtd(qtd + 1)} className="ld-mini-btn">+</button>
          </div>
        </div>
      </div>

      <button type="button" onClick={gerar} disabled={gerando} className="btn-verde mt-5 w-full !rounded-xl !py-3 sm:w-auto">
        <Icone nome="sparkle" className="h-4 w-4" />
        {gerando ? "Escrevendo…" : itens.length ? "Gerar outro exemplo" : "Ver um exemplo ao vivo"}
      </button>

      <div className="mt-5 min-h-[14rem] space-y-2.5" aria-live="polite">
        {itens.length === 0 && !gerando && (
          <p className="rounded-2xl border border-dashed border-white/25 p-5 text-sm text-blue-100/80">
            Escolha semana ou aula, defina a quantidade e clique em “Ver um exemplo ao vivo”. Assim o texto chega no aplicativo — como rascunho para você editar.
          </p>
        )}
        {itens.map((t, i) => (
          <p key={`${divisao}-${i}`} className="ld-aparece rounded-2xl bg-white p-3.5 text-sm leading-relaxed text-slate-700 shadow-lg shadow-blue-950/20">
            <span className="font-extrabold text-emerald-700">{rotulo(divisao, i)}:</span> {t}
          </p>
        ))}
        {gerando && (
          <p className="flex items-center gap-2 px-1 text-sm text-blue-100">
            <span className="ld-pontos ld-pontos-claro" aria-hidden="true"><i /><i /><i /></span>
            escrevendo…
          </p>
        )}
      </div>
      <p className="mt-3 text-xs text-blue-200/80">Exemplo ilustrativo e fictício. No aplicativo, o texto usa a turma, as habilidades e os conteúdos que você marcou — e a IA pode errar, por isso tudo chega como rascunho.</p>
    </div>
  );
}
