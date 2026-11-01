"use client";

import { useAnoCompetencia } from "../usuario-contexto";

/**
 * "Ano letivo" do plano. Plano novo: usa o ano de competência escolhido no topo da página e não deixa mudar (assim
 * os anos não se misturam). Plano já salvo: mostra o ano dele, que ainda pode ser corrigido.
 */
export default function CampoAnoLetivo({ valorInicial, novo }: { valorInicial?: number | null; novo: boolean }) {
  const anoCompetencia = useAnoCompetencia();
  const valor = novo ? anoCompetencia : valorInicial ?? anoCompetencia;
  return (
    <div>
      <label htmlFor="ano_letivo" className="field-label">
        Ano letivo
      </label>
      <input
        id="ano_letivo"
        name="ano_letivo"
        type="number"
        required
        key={valor}
        defaultValue={valor}
        readOnly={novo}
        className={`input-field ${novo ? "cursor-not-allowed bg-slate-50 text-slate-600" : ""}`}
      />
      {novo && <p className="mt-1 text-xs text-slate-500">Ano de competência escolhido no topo da página (botão &quot;Ano&quot;).</p>}
    </div>
  );
}
