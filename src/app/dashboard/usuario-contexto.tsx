"use client";

import { createContext, useContext } from "react";

const UsuarioContexto = createContext<{ primeiroNome: string; anoCompetencia: number }>({ primeiroNome: "", anoCompetencia: new Date().getFullYear() });

/** Leva o primeiro nome do professor (já buscado no layout) até a faixa de boas-vindas, sem nova consulta ao banco. */
export function UsuarioProvider({ primeiroNome, anoCompetencia, children }: { primeiroNome: string; anoCompetencia: number; children: React.ReactNode }) {
  return <UsuarioContexto.Provider value={{ primeiroNome, anoCompetencia }}>{children}</UsuarioContexto.Provider>;
}

/** Ano de competência escolhido pelo professor nesta sessão (o layout já leu o cookie). */
export function useAnoCompetencia(): number {
  return useContext(UsuarioContexto).anoCompetencia;
}

export function PrimeiroNome() {
  return <>{useContext(UsuarioContexto).primeiroNome}</>;
}
