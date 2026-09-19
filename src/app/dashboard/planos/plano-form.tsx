"use client";

import { useActionState } from "react";
import type { Disciplina, CursoTecnico, PlanoDeEnsino } from "@/lib/database.types";
import type { EstadoFormulario } from "./actions";

interface PlanoFormProps {
  disciplinas: Disciplina[];
  cursos: CursoTecnico[];
  plano?: PlanoDeEnsino;
  action: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  textoBotao: string;
}

const camposTexto: {
  campo: keyof PlanoDeEnsino;
  rotulo: string;
  dica?: string;
}[] = [
  { campo: "objetivos", rotulo: "Objetivos de aprendizagem" },
  { campo: "conteudos_programaticos", rotulo: "Conteúdos programáticos" },
  { campo: "metodologia", rotulo: "Metodologia" },
  { campo: "avaliacao", rotulo: "Avaliação" },
  { campo: "cronograma", rotulo: "Cronograma", dica: "Ex.: distribuição por bimestre/unidade" },
];

export default function PlanoForm({
  disciplinas,
  cursos,
  plano,
  action,
  textoBotao,
}: PlanoFormProps) {
  const [estado, formAction, pendente] = useActionState(action, {});

  const vinculoInicial = plano?.disciplina_id
    ? `disciplina:${plano.disciplina_id}`
    : plano?.curso_tecnico_id
    ? `curso:${plano.curso_tecnico_id}`
    : "";

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="titulo" className="block text-sm font-medium text-slate-700">
            Título do plano
          </label>
          <input
            id="titulo"
            name="titulo"
            type="text"
            required
            defaultValue={plano?.titulo}
            placeholder="Ex.: Plano de Ensino — Biologia — 2º ano"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="vinculo" className="block text-sm font-medium text-slate-700">
            Disciplina ou curso técnico
          </label>
          <select
            id="vinculo"
            required
            defaultValue={vinculoInicial}
            onChange={(e) => {
              const [tipo, id] = e.target.value.split(":");
              const tipoInput = document.getElementById("vinculo_tipo") as HTMLInputElement;
              const idInput = document.getElementById("vinculo_id") as HTMLInputElement;
              tipoInput.value = tipo ?? "";
              idInput.value = id ?? "";
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Selecione...</option>
            <optgroup label="Formação Geral Básica">
              {disciplinas.map((d) => (
                <option key={d.id} value={`disciplina:${d.id}`}>
                  {d.nome}
                </option>
              ))}
            </optgroup>
            {cursos.length > 0 && (
              <optgroup label="Cursos técnicos">
                {cursos.map((c) => (
                  <option key={c.id} value={`curso:${c.id}`}>
                    {c.nome}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <input
            type="hidden"
            id="vinculo_tipo"
            name="vinculo_tipo"
            defaultValue={vinculoInicial.split(":")[0] ?? ""}
          />
          <input
            type="hidden"
            id="vinculo_id"
            name="vinculo_id"
            defaultValue={vinculoInicial.split(":")[1] ?? ""}
          />
        </div>

        <div>
          <label htmlFor="ano_letivo" className="block text-sm font-medium text-slate-700">
            Ano letivo
          </label>
          <input
            id="ano_letivo"
            name="ano_letivo"
            type="number"
            required
            defaultValue={plano?.ano_letivo ?? new Date().getFullYear()}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="turma" className="block text-sm font-medium text-slate-700">
            Turma <span className="text-slate-400">(opcional)</span>
          </label>
          <input
            id="turma"
            name="turma"
            type="text"
            defaultValue={plano?.turma ?? ""}
            placeholder="Ex.: 2º A"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {camposTexto.map(({ campo, rotulo, dica }) => (
        <div key={campo}>
          <label htmlFor={campo} className="block text-sm font-medium text-slate-700">
            {rotulo}
          </label>
          {dica && <p className="text-xs text-slate-400">{dica}</p>}
          <textarea
            id={campo}
            name={campo}
            rows={4}
            defaultValue={(plano?.[campo] as string) ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      ))}

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-slate-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={plano?.status ?? "rascunho"}
          className="mt-1 w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="rascunho">Rascunho</option>
          <option value="finalizado">Finalizado</option>
        </select>
      </div>

      {estado.erro && <p className="text-sm text-red-600">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="rounded-md bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {pendente ? "Salvando..." : textoBotao}
      </button>
    </form>
  );
}
