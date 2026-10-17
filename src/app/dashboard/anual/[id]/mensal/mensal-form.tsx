"use client";

import { useActionState, useState } from "react";
import type { EstadoFormulario } from "../../../planos/actions";
import { MESES, MESES_SUGERIDOS } from "@/lib/mensal-do-anual";

interface Props {
  ano: number;
  resumo: { habilidades: number; objetos: number }[];
  action: (anterior: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
}

export default function MensalForm({ ano, resumo, action }: Props) {
  const [estado, formAction, pendente] = useActionState(action, {});
  const [tri, setTri] = useState(0);
  const [meses, setMeses] = useState<number[]>(MESES_SUGERIDOS[0]);
  const vazio = resumo[tri].habilidades === 0 && resumo[tri].objetos === 0;

  function escolherTri(i: number) {
    setTri(i);
    setMeses(MESES_SUGERIDOS[i]);
  }

  function alternarMes(m: number) {
    setMeses((atual) => (atual.includes(m) ? atual.filter((x) => x !== m) : [...atual, m].sort((a, b) => a - b)));
  }

  return (
    <form action={formAction} className="card space-y-6 p-6">
      <fieldset>
        <legend className="field-label">1. De qual trimestre?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {resumo.map((r, i) => (
            <label
              key={i}
              className={`cursor-pointer rounded-xl border-2 px-4 py-2 text-sm font-bold transition ${
                tri === i ? "border-red-600 bg-red-600 text-white shadow" : "border-red-300 bg-white text-red-700 hover:bg-red-50"
              }`}
            >
              <input type="radio" name="trimestre" value={i} checked={tri === i} onChange={() => escolherTri(i)} className="sr-only" />
              {i + 1}º trimestre
              <span className="ml-2 font-normal opacity-90">
                ({r.habilidades} habilidade(s) · {r.objetos} objeto(s))
              </span>
            </label>
          ))}
        </div>
        {vazio && (
          <p className="mt-2 text-sm text-amber-700">
            Este trimestre ainda não tem habilidades nem objetos no plano anual. Os planos mensais sairão só com o cabeçalho.
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="field-label">2. Para quais meses? (um plano mensal para cada mês marcado)</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MESES.map((nome, i) => {
            const m = i + 1;
            const marcado = meses.includes(m);
            return (
              <label
                key={m}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition ${
                  marcado ? "border-primary-600 bg-primary-50 text-primary-800" : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <input type="checkbox" name="meses" value={m} checked={marcado} onChange={() => alternarMes(m)} className="h-4 w-4" />
                {nome}
              </label>
            );
          })}
        </div>
        <p className="field-hint">Os planos usam o ano letivo {ano}, do primeiro ao último dia de cada mês.</p>
      </fieldset>

      <fieldset>
        <legend className="field-label">3. O que levar para cada mês?</legend>
        <div className="mt-2 space-y-2">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="radio" name="modo" value="dividir" defaultChecked className="mt-1" />
            <span>
              <strong>Dividir</strong> as habilidades e os objetos do trimestre entre os meses marcados (cada mês fica com uma parte).
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="radio" name="modo" value="todos" className="mt-1" />
            <span>
              <strong>Levar tudo</strong> do trimestre para todos os meses (depois você tira o que não vai usar).
            </span>
          </label>
        </div>
      </fieldset>

      <p className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900">
        Os planos mensais são criados como <strong>rascunho</strong>, já com escola, turma, componente, período, habilidades e
        objetos de conhecimento. Depois é só abrir cada um, completar metodologia e avaliação e finalizar.
      </p>

      {estado.erro && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {estado.erro}
        </p>
      )}

      <button type="submit" disabled={pendente || meses.length === 0} className="btn-azul">
        {pendente ? "Criando planos..." : `Criar ${meses.length} plano(s) mensal(is)`}
      </button>
    </form>
  );
}
