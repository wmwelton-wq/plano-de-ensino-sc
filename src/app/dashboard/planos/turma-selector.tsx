"use client";

import { useId, useMemo, useState } from "react";
import type { EtapaPlano } from "@/lib/database.types";

/** Nomes iguais aos da tabela series_ensino. */
export const SERIES_POR_ETAPA: Record<EtapaPlano, string[]> = {
  educacao_infantil: ["Berçário I", "Berçário II", "Maternal I", "Maternal II", "Pré I", "Pré II"],
  fundamental_anos_iniciais: ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano"],
  fundamental_anos_finais: ["6º Ano", "7º Ano", "8º Ano", "9º Ano"],
  ensino_medio: ["1ª Série", "2ª Série", "3ª Série"],
};

/** Sugestão de grupo etário (Educação Infantil) a partir da turma escolhida. */
export const GRUPO_ETARIO_POR_SERIE: Record<string, string> = {
  "Berçário I": "Bebês",
  "Berçário II": "Bebês",
  "Maternal I": "Crianças bem pequenas",
  "Maternal II": "Crianças bem pequenas",
  "Pré I": "Crianças pequenas",
  "Pré II": "Crianças pequenas",
};

const OUTRA = "__outra__";

/** Separa "7º ano A" em { serie: "7º Ano", turma: "A" }; se não reconhecer, devolve a série como "outra". */
export function separarTurma(
  etapa: EtapaPlano,
  valor: string | null | undefined
): { serie: string; ident: string } {
  const texto = (valor ?? "").trim();
  if (!texto) return { serie: "", ident: "" };
  const baixo = texto.toLowerCase();
  // Testa os nomes mais longos primeiro ("Maternal II" antes de "Maternal I").
  const candidatas = [...SERIES_POR_ETAPA[etapa]].sort((a, b) => b.length - a.length);
  for (const s of candidatas) {
    const sb = s.toLowerCase();
    if (baixo === sb || baixo.startsWith(sb + " ")) {
      return { serie: s, ident: texto.slice(s.length).trim() };
    }
  }
  return { serie: OUTRA, ident: texto };
}

interface TurmaSelectorProps {
  etapa: EtapaPlano;
  /** Valor gravado em planos_de_ensino.turma. */
  valorInicial?: string | null;
  rotuloSerie?: string;
  rotuloTurma?: string;
  /** Avisa quando a série muda (usado na Educação Infantil para sugerir o grupo etário). */
  onSerieChange?: (serie: string) => void;
}

export default function TurmaSelector({
  etapa,
  valorInicial,
  rotuloSerie = "Ano/série",
  rotuloTurma = "Turma",
  onSerieChange,
}: TurmaSelectorProps) {
  const idSerie = useId();
  const idIdent = useId();
  const inicial = useMemo(() => separarTurma(etapa, valorInicial), [etapa, valorInicial]);
  const [serie, setSerie] = useState(inicial.serie);
  const [ident, setIdent] = useState(inicial.ident);

  const valor = serie === OUTRA ? ident.trim() : [serie, ident.trim()].filter(Boolean).join(" ");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:col-span-2">
      <input type="hidden" name="turma" value={valor} />
      <div>
        <label htmlFor={idSerie} className="field-label">
          {rotuloSerie}
        </label>
        <select
          id={idSerie}
          value={serie}
          onChange={(e) => {
            setSerie(e.target.value);
            if (e.target.value !== OUTRA) onSerieChange?.(e.target.value);
          }}
          className="input-field"
        >
          <option value="">Selecione...</option>
          {SERIES_POR_ETAPA[etapa].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          <option value={OUTRA}>Outra (digitar)</option>
        </select>
      </div>
      <div>
        <label htmlFor={idIdent} className="field-label">
          {serie === OUTRA ? `${rotuloSerie} / ${rotuloTurma.toLowerCase()}` : `${rotuloTurma} (letra ou número)`}
        </label>
        <input
          id={idIdent}
          type="text"
          value={ident}
          onChange={(e) => setIdent(e.target.value)}
          placeholder={serie === OUTRA ? "Ex.: EJA módulo 2" : "Ex.: A, B ou 501"}
          className="input-field"
        />
      </div>
    </div>
  );
}
