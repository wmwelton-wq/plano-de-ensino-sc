"use client";

import { useEffect, useRef } from "react";
import { geometriaPagina, MARGEM_LATERAL_MM, MARGEM_VERTICAL_MM } from "@/lib/estilo-plano";
import { paginarPlano } from "@/lib/paginar-plano";

/**
 * Impressão (Ctrl+P ou botão Imprimir): logo antes de a caixa de impressão
 * abrir, o plano é dividido em páginas (as mesmas do PDF) — a divisão acontece
 * entre os parágrafos e cada caixa fica fechada. A tela comum continua
 * mostrando o plano normalmente; estas páginas só existem na impressão.
 */
export default function ImpressaoPaginada({ paisagem }: { paisagem: boolean }) {
  const destino = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function montar() {
      const alvo = destino.current;
      const original = document.getElementById("plano-conteudo");
      if (!alvo || !original) return;
      alvo.replaceChildren();

      const geo = geometriaPagina(paisagem);
      const resultado = paginarPlano(original, geo.larguraPx, geo.alturaUtilPx);
      const total = resultado.paginas.length;

      resultado.paginas.forEach((pagina, i) => {
        const folha = document.createElement("div");
        folha.style.cssText =
          `box-sizing:border-box;width:${geo.paginaLarguraMm}mm;height:${geo.paginaAlturaMm - 0.6}mm;` +
          `padding:${MARGEM_VERTICAL_MM}mm ${MARGEM_LATERAL_MM}mm;overflow:hidden;` +
          (i < total - 1 ? "break-after:page;page-break-after:always;" : "");
        folha.appendChild(pagina);
        alvo.appendChild(folha);
      });
      resultado.limpar();
    }

    function limpar() {
      destino.current?.replaceChildren();
    }

    window.addEventListener("beforeprint", montar);
    window.addEventListener("afterprint", limpar);
    return () => {
      window.removeEventListener("beforeprint", montar);
      window.removeEventListener("afterprint", limpar);
    };
  }, [paisagem]);

  return <div ref={destino} aria-hidden="true" className="hidden print:block" />;
}
