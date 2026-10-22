"use client";

import { useEffect, useState } from "react";

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const CHAVE = "plano-docente:instalar-dispensado";

/**
 * Cartão "Instale no celular" na tela inicial do painel: aparece só quando dá para instalar
 * (Android/Chrome) ou no iPhone (com o passo a passo), some depois de instalado e pode ser dispensado.
 */
export default function CartaoInstalar() {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null);
  const [ios, setIos] = useState(false);
  const [oculto, setOculto] = useState(true);
  const [passos, setPassos] = useState(false);

  useEffect(() => {
    let dispensado = false;
    try {
      dispensado = localStorage.getItem(CHAVE) === "1";
    } catch {
      /* sem armazenamento: o cartão simplesmente reaparece */
    }
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setOculto(dispensado || standalone);
    const antes = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalacao);
    };
    const depois = () => setOculto(true);
    window.addEventListener("beforeinstallprompt", antes);
    window.addEventListener("appinstalled", depois);
    return () => {
      window.removeEventListener("beforeinstallprompt", antes);
      window.removeEventListener("appinstalled", depois);
    };
  }, []);

  if (oculto || (!evento && !ios)) return null;

  function dispensar() {
    try {
      localStorage.setItem(CHAVE, "1");
    } catch {
      /* ignora */
    }
    setOculto(true);
  }

  async function instalar() {
    if (evento) {
      await evento.prompt();
      await evento.userChoice.catch(() => undefined);
      setEvento(null);
    } else {
      setPassos((v) => !v);
    }
  }

  return (
    <section aria-label="Instalar no celular" className="card flex flex-wrap items-center gap-3 p-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800">Instale o Plano Docente no celular</p>
        <p className="text-xs text-slate-500">Um ícone na tela inicial abre o aplicativo direto, sem digitar o endereço.</p>
        {passos && (
          <p role="note" className="mt-2 text-xs text-slate-600">
            No iPhone: toque no botão de compartilhar do Safari e escolha “Adicionar à Tela de Início”.
          </p>
        )}
      </div>
      <button type="button" onClick={instalar} className="btn-primary">
        {evento ? "Instalar" : "Como instalar"}
      </button>
      <button type="button" onClick={dispensar} className="text-xs text-slate-500 underline hover:text-slate-700">
        Agora não
      </button>
    </section>
  );
}
