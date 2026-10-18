"use client";

import { useActionState, useEffect, useId } from "react";
import { Icone } from "@/components/icones";
import { salvarColega, type Colega, type EstadoColega } from "./actions";

interface Props {
  /** Colega que está sendo editado (vazio = novo). */
  colega?: Colega;
  onSalvo?: (c: Colega) => void;
  onCancelar?: () => void;
  rotuloBotao?: string;
}

/** Formulário simples: nome + e-mail do colega. */
export default function FormColega({ colega, onSalvo, onCancelar, rotuloBotao }: Props) {
  const idBase = useId();
  const [estado, acao, pendente] = useActionState<EstadoColega, FormData>(salvarColega, {});

  useEffect(() => {
    if (estado.ok && estado.colega) onSalvo?.(estado.colega);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  return (
    <form action={acao} className="space-y-3" key={estado.ok ? `ok-${estado.colega?.id}` : "form"}>
      {colega && <input type="hidden" name="id" value={colega.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor={`${idBase}-nome`}>
            Nome do colega
          </label>
          <input id={`${idBase}-nome`} name="nome" required maxLength={120} defaultValue={colega?.nome ?? ""} autoComplete="off" className="input-field" placeholder="Ex.: Prof. Maria Souza" />
        </div>
        <div>
          <label className="field-label" htmlFor={`${idBase}-email`}>
            E-mail
          </label>
          <input id={`${idBase}-email`} name="email" type="email" required maxLength={254} defaultValue={colega?.email ?? ""} autoComplete="off" className="input-field" placeholder="maria@exemplo.com" />
        </div>
      </div>
      {estado.erro && (
        <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          <Icone nome="alerta" className="h-4 w-4 shrink-0" />
          {estado.erro}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pendente} className="btn-azul">
          <Icone nome="check" className="h-4 w-4" />
          {pendente ? "Salvando..." : (rotuloBotao ?? (colega ? "Salvar alterações" : "Cadastrar colega"))}
        </button>
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="btn-azul-suave">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
