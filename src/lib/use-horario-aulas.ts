"use client";

import { useEffect, useState } from "react";
import type { HorarioAulas } from "@/lib/feriados";

const CHAVE = "plano-docente:horario-aulas";
const PADRAO: HorarioAulas = { dias: [1, 3], aulasPorDia: 2 };

/** Lembra no navegador em quais dias da semana o professor tem aula e quantas aulas por dia (usado na contagem de aulas). */
export function useHorarioAulas(): [HorarioAulas, (h: HorarioAulas) => void, boolean] {
  const [horario, setHorario] = useState<HorarioAulas>(PADRAO);
  const [lido, setLido] = useState(false);

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE);
      if (bruto) {
        const v = JSON.parse(bruto) as Partial<HorarioAulas>;
        const dias = Array.isArray(v.dias) ? v.dias.filter((d) => Number.isInteger(d) && d >= 1 && d <= 5) : PADRAO.dias;
        const aulas = Number.isInteger(v.aulasPorDia) ? Math.min(Math.max(Number(v.aulasPorDia), 1), 10) : PADRAO.aulasPorDia;
        setHorario({ dias, aulasPorDia: aulas });
      }
    } catch {
      /* sem armazenamento ou dado inválido: usa o padrão */
    }
    setLido(true);
  }, []);

  function salvar(h: HorarioAulas) {
    setHorario(h);
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(h));
    } catch {
      /* ignora */
    }
  }

  return [horario, salvar, lido];
}
