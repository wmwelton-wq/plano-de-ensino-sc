import type { PlanoDeEnsino } from "@/lib/database.types";

interface OpcoesLogoProps {
  plano?: PlanoDeEnsino;
}

/**
 * Escolha dos brasões do cabeçalho do plano: o do Estado (lado esquerdo) e o da escola
 * (lado direito). Cada um pode ser mantido ou retirado de forma independente.
 */
export default function OpcoesLogo({ plano }: OpcoesLogoProps) {
  return (
    <fieldset className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <legend className="px-1 text-sm font-bold text-slate-800">Brasões do cabeçalho</legend>
      <p className="text-xs text-slate-400">
        O brasão do Estado fica à esquerda e o da escola, à direita (a logo vem do cadastro da escola).
        Desmarque o que não quiser que apareça no plano.
      </p>
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <input
            id="incluir_logo_estado"
            name="incluir_logo_estado"
            type="checkbox"
            defaultChecked={plano?.incluir_logo_estado ?? true}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="incluir_logo_estado" className="text-sm text-slate-700">
            Brasão do Estado de Santa Catarina
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="incluir_logo_escola"
            name="incluir_logo_escola"
            type="checkbox"
            defaultChecked={plano?.incluir_logo_escola ?? true}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="incluir_logo_escola" className="text-sm text-slate-700">
            Brasão/logo da escola
          </label>
        </div>
      </div>
    </fieldset>
  );
}
