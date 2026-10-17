// Junta vários planos num ÚNICO arquivo PDF (cada plano começa numa página nova).
// Cada plano é buscado na sua página de visualização, colocado fora da tela e
// paginado pelo mesmo código do PDF individual — por isso o resultado é igual.

import { geometriaPagina, MARGEM_LATERAL_MM, MARGEM_VERTICAL_MM } from "./estilo-plano";
import { paginarPlano } from "./paginar-plano";
import { desenharPaginaNoPdf } from "./pdf-vetorial";

export interface ItemPdf {
  /** Endereço da página de visualização do plano. */
  url: string;
  titulo: string;
  orientacao: "retrato" | "paisagem";
}

export interface ResultadoPdfVarios {
  arquivo: File | null;
  /** Títulos dos planos que não puderam ser incluídos. */
  falhas: string[];
}

async function aguardarImagens(raiz: HTMLElement) {
  const imagens = Array.from(raiz.querySelectorAll("img"));
  await Promise.all(
    imagens.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

export async function gerarPdfDeVarios(
  itens: ItemPdf[],
  nomeArquivo: string,
  aoProgredir?: (feitos: number, total: number, titulo: string) => void
): Promise<ResultadoPdfVarios> {
  const { default: jsPDF } = await import("jspdf");
  if (document.fonts?.ready) await document.fonts.ready;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pdf: any = null;
  const falhas: string[] = [];

  for (let n = 0; n < itens.length; n++) {
    const item = itens[n];
    aoProgredir?.(n, itens.length, item.titulo);
    const paisagem = item.orientacao === "paisagem";
    const geo = geometriaPagina(paisagem);
    const hospedeiro = document.createElement("div");
    hospedeiro.style.cssText = `position:fixed;left:-100000px;top:0;width:${geo.larguraPx}px;z-index:-1;`;
    document.body.appendChild(hospedeiro);
    let limpar: (() => void) | null = null;
    try {
      const resposta = await fetch(item.url, { credentials: "same-origin" });
      if (!resposta.ok) throw new Error("falha ao abrir o plano");
      const doc = new DOMParser().parseFromString(await resposta.text(), "text/html");
      const encontrado = doc.getElementById("plano-conteudo");
      if (!encontrado) throw new Error("conteúdo do plano não encontrado");

      const original = document.importNode(encontrado, true) as HTMLElement;
      hospedeiro.appendChild(original);
      await aguardarImagens(original);

      const resultado = paginarPlano(original, geo.larguraPx, geo.alturaUtilPx);
      limpar = resultado.limpar;

      const orientacao = paisagem ? "landscape" : "portrait";
      for (let i = 0; i < resultado.paginas.length; i++) {
        if (!pdf) {
          pdf = new jsPDF({ orientation: orientacao, unit: "mm", format: "a4" });
        } else {
          pdf.addPage("a4", orientacao);
        }
        await desenharPaginaNoPdf(pdf, resultado.paginas[i], MARGEM_LATERAL_MM, MARGEM_VERTICAL_MM);
      }
    } catch {
      falhas.push(item.titulo);
    } finally {
      limpar?.();
      hospedeiro.remove();
    }
  }
  aoProgredir?.(itens.length, itens.length, "");

  if (!pdf) return { arquivo: null, falhas };
  pdf.setProperties({ title: nomeArquivo });
  const base = nomeArquivo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const blob = pdf.output("blob");
  return { arquivo: new File([blob], `${base || "planos"}.pdf`, { type: "application/pdf" }), falhas };
}
