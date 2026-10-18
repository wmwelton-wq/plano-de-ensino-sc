"use client";

import { useEffect, useState } from "react";

/** Registra o service worker (app instalável) e avisa, em faixa discreta, quando a internet cai. */
export default function RegistrarApp() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }
    const atualizar = () => setOffline(!navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 shadow-lg print:hidden">
      Sem internet. O que você escreveu continua na tela — clique em <strong>Salvar</strong> quando a conexão voltar.
    </div>
  );
}
