"use client";

import { useEffect, useState } from "react";

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Link discreto "Instalar no celular": usa o botão do navegador quando existe e, no iPhone, mostra o passo a passo. */
export default function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null);
  const [ios, setIos] = useState(false);
  const [instalado, setInstalado] = useState(true);
  const [dica, setDica] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalado(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const antes = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalacao);
    };
    const depois = () => setInstalado(true);
    window.addEventListener("beforeinstallprompt", antes);
    window.addEventListener("appinstalled", depois);
    return () => {
      window.removeEventListener("beforeinstallprompt", antes);
      window.removeEventListener("appinstalled", depois);
    };
  }, []);

  if (instalado || (!evento && !ios)) return null;

  async function instalar() {
    if (evento) {
      await evento.prompt();
      await evento.userChoice.catch(() => undefined);
      setEvento(null);
    } else {
      setDica((v) => !v);
    }
  }

  return (
    <>
      <span className="mx-2" aria-hidden="true">
        ·
      </span>
      <button type="button" onClick={instalar} className="link-primary text-xs">
        Instalar no celular
      </button>
      {dica && (
        <span role="note" className="mt-2 block text-xs text-slate-500">
          No iPhone: toque no botão de compartilhar do Safari e escolha “Adicionar à Tela de Início”.
        </span>
      )}
    </>
  );
}
