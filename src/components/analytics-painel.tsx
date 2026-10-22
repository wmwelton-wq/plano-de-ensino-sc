"use client";

import { Analytics } from "@vercel/analytics/next";

/**
 * Estatísticas de uso (Vercel Web Analytics): sem cookies e sem identificar a pessoa.
 * Antes de enviar cada visita, tiramos da URL tudo o que é pessoal ou secreto (parâmetros da
 * página, identificadores de plano e o código do link de leitura compartilhado).
 */
export default function AnalyticsPainel() {
  return (
    <Analytics
      beforeSend={(evento) => {
        try {
          const url = new URL(evento.url);
          url.search = "";
          url.hash = "";
          url.pathname = url.pathname
            .replace(/^\/p\/[^/]+/, "/p/[codigo]")
            .replace(/^\/dashboard\/(planos|anual)\/[^/]+/, "/dashboard/$1/[id]")
            .replace(/^\/dashboard\/escolas\/[^/]+/, "/dashboard/escolas/[id]");
          return { ...evento, url: url.toString() };
        } catch {
          return null; // se algo estranho acontecer, não envia
        }
      }}
    />
  );
}
