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
    <div role="alert" className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <h2 className="text-lg font-semibold text-red-800">Não foi possível carregar esta página</h2>
      <p className="mt-2 text-sm text-red-700">
        Verifique sua conexão e tente novamente. Seus planos salvos não foram afetados.
      </p>
      {error.digest && <p className="mt-2 text-xs text-red-600">Código: {error.digest}</p>}
      <button type="button" onClick={() => reset()} className="btn-azul mt-4">
        Tentar novamente
      </button>
    </div>
  );
}
