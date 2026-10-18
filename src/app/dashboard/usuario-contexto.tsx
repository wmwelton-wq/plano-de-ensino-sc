"use client";

import { createContext, useContext } from "react";

const UsuarioContexto = createContext<{ primeiroNome: string }>({ primeiroNome: "" });

/** Leva o primeiro nome do professor (já buscado no layout) até a faixa de boas-vindas, sem nova consulta ao banco. */
export function UsuarioProvider({ primeiroNome, children }: { primeiroNome: string; children: React.ReactNode }) {
  return <UsuarioContexto.Provider value={{ primeiroNome }}>{children}</UsuarioContexto.Provider>;
}

export function PrimeiroNome() {
  return <>{useContext(UsuarioContexto).primeiroNome}</>;
}
