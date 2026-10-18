"use client";

import { useEffect, useState } from "react";
import { Icone } from "@/components/icones";

const CHAVE = "plano-docente:tema";

function lerPreferencia(): boolean {
  try {
    const t = window.localStorage.getItem(CHAVE);
    if (t === "escuro") return true;
    if (t === "claro") return false;
  } catch {
    /* sem armazenamento: segue o tema do aparelho */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Botão lua/sol do cabeçalho. O modo escuro vale só dentro do painel e é lembrado neste aparelho. */
export default function AlternarTema() {
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    const e = lerPreferencia();
    setEscuro(e);
    document.documentElement.classList.toggle("dark", e);
    // Ao sair do painel (login, site público), volta ao visual claro.
    return () => document.documentElement.classList.remove("dark");
  }, []);

  function alternar() {
    const novo = !escuro;
    setEscuro(novo);
    document.documentElement.classList.toggle("dark", novo);
    try {
      window.localStorage.setItem(CHAVE, novo ? "escuro" : "claro");
    } catch {
      /* ignora */
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={escuro}
      aria-label={escuro ? "Voltar para o modo claro" : "Ativar o modo escuro"}
      title={escuro ? "Modo claro" : "Modo escuro (bom para escrever à noite)"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      <Icone nome={escuro ? "sol" : "lua"} className="h-5 w-5" />
    </button>
  );
}
