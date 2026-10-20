"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acaoDefinirCadastros } from "./actions";

export default function CadastrosSwitch({ abertos }: { abertos: boolean }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function alternar() {
    const novo = !abertos;
    const texto = novo ? "Abrir os cadastros? Qualquer pessoa poderá criar conta." : "Fechar os cadastros? Quem já tem conta continua entrando normalmente.";
    if (!window.confirm(texto)) return;
    setErro(null);
    iniciar(async () => {
      const r = await acaoDefinirCadastros(novo);
      if (r.erro) setErro(r.erro);
      else router.refresh();
    });
  }

  return (
    <div className={`card flex flex-wrap items-center justify-between gap-3 p-4 ${abertos ? "" : "border-amber-200"}`}>
      <div>
        <p className="text-sm font-bold text-slate-900">Novos cadastros: {abertos ? "abertos" : "fechados (fase de testes)"}</p>
        <p className="text-xs text-slate-500">{abertos ? "Qualquer pessoa pode criar conta." : "Ninguém novo consegue se cadastrar, nem pelo Google. Quem já tem conta não é afetado."}</p>
        {erro && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {erro}
          </p>
        )}
      </div>
      <button type="button" onClick={alternar} disabled={pendente} className="btn-secondary">
        {pendente ? "Salvando..." : abertos ? "Fechar cadastros" : "Abrir cadastros"}
      </button>
    </div>
  );
}
