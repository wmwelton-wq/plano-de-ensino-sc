"use client";

import { useEffect } from "react";

export default function ErroDashboard({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro na tela do dashboard", error.digest ?? "", error.message);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-lg rounded-3xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-red-800">Não foi possível carregar esta página</h2>
      <p className="mt-2 text-sm text-red-700">
        Verifique sua conexão e tente novamente. Seus planos salvos não foram afetados.
      </p>
      {error.digest && <p className="mt-2 text-xs text-red-600">Código: {error.digest}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={() => reset()} className="btn-azul">
          Tentar novamente
        </button>
        <a href="/dashboard" className="btn-azul-suave">
          Voltar ao início
        </a>
      </div>
    </div>
  );
}
