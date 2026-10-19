"use client";

import { useState } from "react";
import { Icone } from "@/components/icones";

/** Dias corridos do período, contando o primeiro e o último dia (ex.: 01/03 a 30/03 = 30 dias). */
function diasCorridos(inicio: string, fim: string): number | null {
  if (!inicio || !fim) return null;
  const a = Date.parse(`${inicio}T00:00:00Z`);
  const b = Date.parse(`${fim}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86400000) + 1;
}

interface Props {
  inicioInicial?: string | null;
  fimInicial?: string | null;
  rotuloInicio?: string;
  rotuloFim?: string;
  dicaFim?: string;
}

/**
 * As duas datas do plano. Os campos guardam o valor no próprio formulário (não se perdem ao trocar de passo) e,
 * se o período passar de 30 dias corridos, aparece um aviso: o Estado aceita no máximo 30 dias corridos por plano mensal.
 */
export default function CamposPeriodo({ inicioInicial, fimInicial, rotuloInicio = "Data de início", rotuloFim = "Data de fim", dicaFim }: Props) {
  const [inicio, setInicio] = useState(inicioInicial ?? "");
  const [fim, setFim] = useState(fimInicial ?? "");
  const dias = diasCorridos(inicio, fim);
  const invertido = dias !== null && dias < 1;
  const longo = dias !== null && dias > 30;

  return (
    <>
      <div>
        <label htmlFor="data_inicio" className="field-label">
          {rotuloInicio}
        </label>
        <input id="data_inicio" name="data_inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="input-field" />
      </div>

      <div>
        <label htmlFor="data_fim" className="field-label">
          {rotuloFim}
        </label>
        <input id="data_fim" name="data_fim" type="date" value={fim} min={inicio || undefined} onChange={(e) => setFim(e.target.value)} className="input-field" />
        {dicaFim && <p className="field-hint">{dicaFim}</p>}
      </div>

      {(longo || invertido) && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 sm:col-span-2">
          <Icone nome="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
          {invertido ? (
            <span>A data de fim está antes da data de início. Confira as datas.</span>
          ) : (
            <span>
              Este período tem <strong>{dias} dias corridos</strong>. O Estado permite no <strong>máximo 30 dias corridos</strong> em cada plano mensal. Ajuste as datas ou faça um segundo plano para o restante do período.
            </span>
          )}
        </p>
      )}
    </>
  );
}
