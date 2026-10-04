"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import type { EtapaPlano } from "@/lib/database.types";
import type { EstadoFormulario } from "../../actions";
import { SERIES_POR_ETAPA, separarTurma } from "../../turma-selector";

interface ReplicarFormProps {
  etapa: EtapaPlano;
  turmaAtual: string | null;
  planoId: string;
  action: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
}

/** Monta as turmas de destino: uma série + várias identificações ("A, B, C"). */
export default function ReplicarForm({ etapa, turmaAtual, planoId, action }: ReplicarFormProps) {
  const [estado, formAction, pendente] = useActionState(action, {});
  const inicial = useMemo(() => separarTurma(etapa, turmaAtual), [etapa, turmaAtual]);

  const [serie, setSerie] = useState(
    inicial.serie && inicial.serie !== "__outra__" ? inicial.serie : SERIES_POR_ETAPA[etapa][0]
  );
  const [identificacoes, setIdentificacoes] = useState("");

  const turmas = useMemo(() => {
    const ids = identificacoes
      .split(/[,;\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    // Sem identificação, replica só para a série escolhida.
    return ids.length === 0 ? [serie] : ids.map((i) => `${serie} ${i}`);
  }, [serie, identificacoes]);

  return (
    <form action={formAction} className="space-y-5">
      {turmas.map((t) => (
        <input key={t} type="hidden" name="turmas_destino" value={t} />
      ))}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="serie_destino" className="field-label">
            Ano/série de destino
          </label>
          <select
            id="serie_destino"
            value={serie}
            onChange={(e) => setSerie(e.target.value)}
            className="input-field"
          >
            {SERIES_POR_ETAPA[etapa].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="turmas_texto" className="field-label">
            Turmas (separe por vírgula)
          </label>
          <input
            id="turmas_texto"
            type="text"
            value={identificacoes}
            onChange={(e) => setIdentificacoes(e.target.value)}
            placeholder="Ex.: A, B, C"
            className="input-field"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-800">
          Serão criados {turmas.length} plano(s) em rascunho:
        </p>
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-600">
          {turmas.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-400">
          Cada cópia leva o conteúdo, as habilidades e as competências do plano original. Depois você
          pode ajustar cada uma separadamente.
        </p>
      </div>

      {estado.erro && (
        <p role="alert" className="text-sm text-red-600">
          {estado.erro}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pendente} className="btn-primary">
          {pendente ? "Replicando..." : "Replicar plano"}
        </button>
        <Link href={`/dashboard/planos/${planoId}`} className="btn-secondary">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
