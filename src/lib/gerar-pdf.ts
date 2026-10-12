// Geração de PDF no navegador (client-side), a partir do conteúdo já
// renderizado do plano de ensino. O PDF sai com texto de verdade (Arial/
// Helvetica, nítido e selecionável), bordas em linhas e imagens — não é mais
// uma "foto" da tela. As páginas são montadas por paginar-plano.ts, que divide
// o conteúdo entre os parágrafos e mantém as caixas fechadas; aqui só
// desenhamos cada página no PDF. Importação dinâmica para não aumentar o
// bundle das páginas que não geram PDF.

import { geometriaPagina, MARGEM_LATERAL_MM, MARGEM_VERTICAL_MM } from "./estilo-plano";
import { paginarPlano } from "./paginar-plano";
import { desenharPaginaNoPdf } from "./pdf-vetorial";

export type Orientacao = "retrato" | "paisagem";

function nomeArquivo(titulo: string): string {
  const base = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${base || "plano-de-ensino"}.pdf`;
}

/**
 * Monta um PDF A4 (retrato ou paisagem) do elemento com o id informado, com
 * 2 cm de margem à esquerda e à direita e 1,5 cm em cima e embaixo.
 * Retorna o PDF já como File, pronto para download ou compartilhamento.
 */
export async function gerarPdfDoElemento(
  elementId: string,
  titulo: string,
  orientacao: Orientacao = "retrato"
): Promise<File> {
  const { default: jsPDF } = await import("jspdf");

  const original = document.getElementById(elementId);
  if (!original) {
    throw new Error("Conteúdo do plano não encontrado para gerar o PDF.");
  }

  const paisagem = orientacao === "paisagem";
  const geo = geometriaPagina(paisagem);

  if (document.fonts?.ready) await document.fonts.ready;

  const resultado = paginarPlano(original, geo.larguraPx, geo.alturaUtilPx);
  try {
    const pdf = new jsPDF({ orientation: paisagem ? "landscape" : "portrait", unit: "mm", format: "a4" });
    pdf.setProperties({ title: titulo });

    for (let i = 0; i < resultado.paginas.length; i++) {
      if (i > 0) pdf.addPage();
      await desenharPaginaNoPdf(pdf, resultado.paginas[i], MARGEM_LATERAL_MM, MARGEM_VERTICAL_MM);
    }

    const blob = pdf.output("blob");
    return new File([blob], nomeArquivo(titulo), { type: "application/pdf" });
  } finally {
    resultado.limpar();
  }
}
