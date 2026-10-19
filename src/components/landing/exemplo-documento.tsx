"use client";

import { useState } from "react";

const MODELOS = [
  {
    id: "medio",
    aba: "Ensino Médio",
    legenda: "Ensino Médio · Língua Portuguesa",
    cabecalho: ["Escola Estadual Exemplo (fictícia)", "Exemplo/SC", "1º bimestre"],
    linhas: [
      ["Área de conhecimento", "Linguagens e suas Tecnologias"],
      ["Componente curricular", "Língua Portuguesa — 1ª série do Ensino Médio"],
      ["Número de aulas", "4 aulas (50 minutos cada)"],
      ["Habilidades", "EM13LP01 — Relacionar o texto, tanto na produção como na leitura/escuta, com suas condições de produção e seu contexto sócio-histórico de circulação."],
      ["Conteúdos", "Textos argumentativos: contexto de produção e circulação; estratégias de persuasão; construção da argumentação."],
      ["Caminho metodológico", "Será realizada a leitura e análise coletiva de um artigo de opinião, identificando tese e estratégias de persuasão; serão produzidos, em duplas, textos argumentativos sobre temas de interesse da turma."],
      ["Avaliação", "Produção textual individual; participação na roda de leitura; autoavaliação orientada por rubrica."],
    ],
  },
  {
    id: "infantil",
    aba: "Educação Infantil",
    legenda: "Educação Infantil · Quantidades e relações",
    cabecalho: ["Centro de Educação Infantil Exemplo (fictício)", "Exemplo/SC", "2º trimestre"],
    linhas: [
      ["Campo de experiência", "Espaços, tempos, quantidades, relações e transformações"],
      ["Grupo etário", "Crianças pequenas (4 anos a 5 anos e 11 meses)"],
      ["Objetivos", "EI03ET01 — Estabelecer relações de comparação entre objetos, observando suas propriedades."],
      ["Experiências e interações", "Serão propostas brincadeiras de contagem com material concreto e um jogo de trilha com dados, registrando as quantidades percorridas."],
      ["Metodologia / rotina", "Atividade em pequenos grupos, com manipulação de material concreto antes do registro gráfico; rotina semanal alternando jogos e registro coletivo."],
      ["Instrumentos de registro", "Observação dirigida com anotações no portfólio individual da criança."],
    ],
  },
];

export default function ExemploDocumento() {
  const [id, setId] = useState(MODELOS[0].id);
  const m = MODELOS.find((x) => x.id === id) ?? MODELOS[0];

  return (
    <div>
      <div role="tablist" aria-label="Etapa do exemplo" className="mx-auto mb-6 flex w-fit gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {MODELOS.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={x.id === id} onClick={() => setId(x.id)} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${x.id === id ? "bg-primary-700 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}>
            {x.aba}
          </button>
        ))}
      </div>

      <div key={m.id} className="ld-aparece mx-auto max-w-3xl">
        <div className="ld-folha">
          <span className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800 sm:absolute sm:right-4 sm:top-4 sm:mb-0">Exemplo ilustrativo · dados fictícios</span>
          <p className="pr-40 text-sm font-extrabold uppercase tracking-wide text-slate-900">Plano de ensino</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            <b>Escola:</b> {m.cabecalho[0]} &nbsp;·&nbsp; <b>Município:</b> {m.cabecalho[1]}
            <br />
            <b>Professor(a):</b> [nome do professor] &nbsp;·&nbsp; <b>Período:</b> {m.cabecalho[2]}
          </p>
          <table className="mt-4 w-full border-collapse text-left text-[13px]">
            <tbody>
              {m.linhas.map(([r, v]) => (
                <tr key={r} className="border-t border-slate-200 align-top">
                  <th scope="row" className="w-[30%] bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">{r}</th>
                  <td className="px-3 py-2 leading-relaxed text-slate-700">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-slate-500">{m.legenda}</p>
      </div>
    </div>
  );
}
