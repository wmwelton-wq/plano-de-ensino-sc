"use client";

import { useActionState } from "react";
import type { EstadoFormulario } from "../../../planos/actions";

interface Props {
  escolas: { id: string; nome: string; municipio: string }[];
  escolaInicial: string | null;
  anoInicial: number;
  turmaOrigem: string | null;
  action: (anterior: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
}

export default function DuplicarForm({ escolas, escolaInicial, anoInicial, turmaOrigem, action }: Props) {
  const [estado, formAction, pendente] = useActionState(action, {});

  return (
    <form action={formAction} className="card space-y-5 p-6">
      <div>
        <label htmlFor="turmas" className="field-label">
          Turmas que vão receber uma cópia
        </label>
        <textarea
          id="turmas"
          name="turmas"
          rows={4}
          required
          placeholder={`Uma turma por linha. Ex.:\n${turmaOrigem ? turmaOrigem.replace(/\w$/, "B") : "1ª Série B"}\n${turmaOrigem ? turmaOrigem.replace(/\w$/, "C") : "1ª Série C"}`}
          className="input-field"
        />
        <p className="field-hint">
          Cada linha vira um plano novo, com o mesmo conteúdo. Depois é só abrir e ajustar o que for diferente.
          {turmaOrigem ? ` (A turma do plano original é: ${turmaOrigem}.)` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="escola_id" className="field-label">
            Escola
          </label>
          <select id="escola_id" name="escola_id" defaultValue={escolaInicial ?? ""} className="input-field">
            <option value="">Nenhuma / preencher depois</option>
            {escolas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome} — {e.municipio}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ano_letivo" className="field-label">
            Ano letivo
          </label>
          <input id="ano_letivo" name="ano_letivo" type="number" required defaultValue={anoInicial} className="input-field" />
        </div>
      </div>

      {estado.erro && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {estado.erro}
        </p>
      )}

      <button type="submit" disabled={pendente} className="btn-azul">
        {pendente ? "Criando cópias..." : "Criar cópias"}
      </button>
    </form>
  );
}
