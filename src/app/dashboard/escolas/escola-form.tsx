"use client";

import { useActionState } from "react";
import type { Escola } from "@/lib/database.types";
import type { EstadoFormularioEscola } from "./actions";

interface EscolaFormProps {
  escola?: Escola;
  action: (estado: EstadoFormularioEscola, formData: FormData) => Promise<EstadoFormularioEscola>;
  textoBotao: string;
  /** Tela para onde voltar depois de salvar (já validada no servidor). */
  voltar?: string;
}

export default function EscolaForm({ escola, action, textoBotao, voltar }: EscolaFormProps) {
  const [estado, formAction, pendente] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {voltar && <input type="hidden" name="voltar" value={voltar} />}
      <div>
        <label htmlFor="nome" className="field-label">
          Nome da escola
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          defaultValue={escola?.nome}
          placeholder="Ex.: EEB Helio Wasum"
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="municipio" className="field-label">
          Município
        </label>
        <input
          id="municipio"
          name="municipio"
          type="text"
          required
          defaultValue={escola?.municipio}
          placeholder="Ex.: Bandeirante"
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="logo" className="field-label">
          Logo da escola <span className="text-slate-400">(opcional)</span>
        </label>
        {escola?.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={escola.logo_url}
            alt={`Logo atual de ${escola.nome}`}
            className="mt-2 h-16 w-16 rounded-lg border border-slate-200 bg-white object-contain p-1"
          />
        )}
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="mt-1 w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
        <p className="field-hint">
          Usada no cabeçalho dos planos de ensino gerados para esta escola.
        </p>
      </div>

      {estado.erro && (
        <p role="alert" className="text-sm text-red-600">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="btn-primary"
      >
        {pendente ? "Salvando..." : textoBotao}
      </button>
    </form>
  );
}
