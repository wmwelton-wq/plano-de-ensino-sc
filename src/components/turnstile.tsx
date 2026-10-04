"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

// Tipagem mínima do objeto global que o script do Cloudflare Turnstile injeta.
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileProps {
  onToken: (token: string | null) => void;
}

/**
 * Widget "não sou um robô" (Cloudflare Turnstile). A chave pública
 * (NEXT_PUBLIC_TURNSTILE_SITE_KEY) é segura de expor no navegador — é assim
 * que o Turnstile funciona. A validação de verdade acontece no servidor, em
 * /api/turnstile-verify, usando a chave secreta (nunca exposta ao cliente).
 *
 * Para gerar um novo token após um envio de formulário (o token é de uso
 * único), monte este componente novamente passando uma `key` diferente no
 * componente pai.
 */
export default function Turnstile({ onToken }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(
    typeof window !== "undefined" && !!window.turnstile
  );

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current) return;

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => onToken(token),
      "expired-callback": () => onToken(null),
      "error-callback": () => onToken(null),
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      {/* Texto só para leitor de tela: avisa o que está por vir antes do
          iframe do Cloudflare carregar (ele tem seu próprio rótulo interno,
          mas só depois de pronto). */}
      <span className="sr-only">Verificação de segurança: confirme que você não é um robô.</span>
      <div ref={containerRef} />
    </>
  );
}
