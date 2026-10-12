// Geração de PDF no navegador (client-side), a partir do conteúdo já
// renderizado do plano de ensino. Usa importação dinâmica para não
// aumentar o bundle inicial das páginas que não geram PDF.

export type Orientacao = "retrato" | "paisagem";

// Margens do PDF (mm): 2 cm nas laterais e 1,5 cm em cima e embaixo de cada página.
const MARGEM_LATERAL_MM = 20;
const MARGEM_VERTICAL_MM = 15;
const PX_POR_MM = 96 / 25.4;

function nomeArquivo(titulo: string): string {
  const base = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${base || "plano-de-ensino"}.pdf`;
}

interface Intervalo {
  topo: number;
  base: number;
}

/**
 * Mede o clone já posicionado e devolve:
 *  - `proibidos`: faixas verticais onde NÃO se pode cortar a página (linhas de
 *    texto, imagens e linhas de tabela curtas, que não devem ser divididas);
 *  - `candidatos`: posições (base de qualquer elemento) onde um corte cairia
 *    entre duas linhas de texto;
 *  - `celulas`: faixas das células de tabela, para saber se um corte caiu no
 *    meio de uma tabela (e então desenhar a borda de fechamento).
 */
function medirClone(raiz: HTMLElement, alturaUtilPx: number) {
  const topoRaiz = raiz.getBoundingClientRect().top;
  const proibidos: Intervalo[] = [];
  const candidatos = new Set<number>();
  const celulas: Intervalo[] = [];

  const relativo = (r: DOMRect): Intervalo => ({ topo: r.top - topoRaiz, base: r.bottom - topoRaiz });

  // Linhas de texto: cada retângulo de cada nó de texto é uma linha que não pode ser cortada ao meio.
  const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let no = walker.nextNode();
  while (no) {
    if (no.textContent && no.textContent.trim().length > 0) {
      range.selectNodeContents(no);
      for (const r of Array.from(range.getClientRects())) {
        if (r.height > 0 && r.width > 0) {
          const i = relativo(r);
          proibidos.push(i);
          candidatos.add(Math.round(i.base));
        }
      }
    }
    no = walker.nextNode();
  }

  raiz.querySelectorAll("img").forEach((img) => {
    proibidos.push(relativo(img.getBoundingClientRect()));
  });

  raiz.querySelectorAll("tr").forEach((tr) => {
    const i = relativo(tr.getBoundingClientRect());
    // Linhas curtas ficam inteiras numa página; as longas podem ser divididas entre as linhas de texto.
    if (i.base - i.topo <= alturaUtilPx * 0.25) proibidos.push(i);
    candidatos.add(Math.round(i.base));
  });

  raiz.querySelectorAll("td, th").forEach((c) => celulas.push(relativo(c.getBoundingClientRect())));

  raiz.querySelectorAll("*").forEach((el) => {
    candidatos.add(Math.round(relativo(el.getBoundingClientRect()).base));
  });

  return {
    proibidos,
    candidatos: Array.from(candidatos).sort((a, b) => b - a), // do maior para o menor
    celulas,
  };
}

function podeCortarEm(y: number, proibidos: Intervalo[]): boolean {
  const folga = 0.5;
  return !proibidos.some((i) => y > i.topo + folga && y < i.base - folga);
}

/**
 * Captura o elemento com o id informado e monta um PDF A4 (retrato ou
 * paisagem), com 2 cm de margem à esquerda e à direita e 1,5 cm em cima e
 * embaixo de cada página.
 *
 * O conteúdo é renderizado numa cópia fora da tela, com a MESMA largura útil
 * da página (assim os tamanhos de letra ficam iguais aos da impressão), e
 * depois fatiado em páginas. Os cortes só acontecem entre linhas de texto —
 * nunca no meio de uma linha, de uma imagem ou de uma linha curta de tabela —
 * e cada página é preenchida o máximo possível. Quando o corte cai no meio de
 * uma tabela, as bordas são fechadas no fim da página e reabertas na seguinte.
 *
 * Retorna o PDF já como File, pronto para download ou compartilhamento.
 */
export async function gerarPdfDoElemento(
  elementId: string,
  titulo: string,
  orientacao: Orientacao = "retrato"
): Promise<File> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const original = document.getElementById(elementId);
  if (!original) {
    throw new Error("Conteúdo do plano não encontrado para gerar o PDF.");
  }

  const paisagem = orientacao === "paisagem";
  const paginaLarguraMm = paisagem ? 297 : 210;
  const paginaAlturaMm = paisagem ? 210 : 297;
  const conteudoLarguraMm = paginaLarguraMm - 2 * MARGEM_LATERAL_MM;
  const alturaUtilMm = paginaAlturaMm - 2 * MARGEM_VERTICAL_MM;
  const larguraPx = Math.round(conteudoLarguraMm * PX_POR_MM);
  const alturaUtilPx = alturaUtilMm * PX_POR_MM;
  const mmPorPx = conteudoLarguraMm / larguraPx;

  // Cópia fora da tela, com a largura exata da área útil da página.
  const hospedeiro = document.createElement("div");
  hospedeiro.style.cssText = `position:fixed;left:-100000px;top:0;width:${larguraPx}px;background:#fff;z-index:-1;`;
  const clone = original.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.style.cssText = `width:${larguraPx}px;max-width:none;padding:0;margin:0;background:#fff;`;
  hospedeiro.appendChild(clone);
  document.body.appendChild(hospedeiro);

  try {
    // Garante que imagens e fontes terminaram de carregar antes de medir.
    await Promise.all(
      Array.from(clone.querySelectorAll("img")).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
      )
    );
    if (document.fonts?.ready) await document.fonts.ready;

    const alturaTotalPx = clone.scrollHeight;
    const { proibidos, candidatos, celulas } = medirClone(clone, alturaUtilPx);

    // Pontos de corte (em px do clone).
    const cortes: number[] = [0];
    let inicio = 0;
    while (alturaTotalPx - inicio > alturaUtilPx + 0.5) {
      const limite = inicio + alturaUtilPx;
      const minimo = inicio + alturaUtilPx * 0.2; // evita páginas quase vazias
      let corte = candidatos.find((y) => y <= limite && y > minimo && podeCortarEm(y, proibidos));
      if (corte === undefined) corte = limite; // sem opção melhor: corte forçado na altura da página
      cortes.push(corte);
      inicio = corte;
    }
    cortes.push(alturaTotalPx);

    // Rasteriza (limitando a escala para não estourar o tamanho máximo do canvas do navegador).
    const escala = Math.min(2, 15000 / Math.max(alturaTotalPx, 1));
    const canvas = await html2canvas(clone, {
      scale: escala,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: larguraPx,
      windowWidth: larguraPx,
    });
    const fator = canvas.width / larguraPx;

    const pdf = new jsPDF({ orientation: paisagem ? "landscape" : "portrait", unit: "mm", format: "a4" });
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.26);

    const dentroDeTabela = (y: number) => celulas.some((c) => y > c.topo + 1 && y < c.base - 1);

    let primeira = true;
    for (let i = 0; i < cortes.length - 1; i++) {
      const y0 = cortes[i];
      const y1 = cortes[i + 1];
      const alturaPx = Math.round((y1 - y0) * fator);
      if (alturaPx <= 0) continue;

      const fatia = document.createElement("canvas");
      fatia.width = canvas.width;
      fatia.height = alturaPx;
      const ctx = fatia.getContext("2d");
      if (!ctx) continue;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, fatia.width, fatia.height);
      ctx.drawImage(canvas, 0, Math.round(y0 * fator), canvas.width, alturaPx, 0, 0, canvas.width, alturaPx);

      if (!primeira) pdf.addPage();
      primeira = false;

      const alturaMm = (alturaPx / fator) * mmPorPx;
      pdf.addImage(
        fatia.toDataURL("image/jpeg", 0.92),
        "JPEG",
        MARGEM_LATERAL_MM,
        MARGEM_VERTICAL_MM,
        conteudoLarguraMm,
        alturaMm
      );

      // Corte no meio de uma tabela: fecha a borda embaixo e reabre em cima da página seguinte.
      const xIni = MARGEM_LATERAL_MM;
      const xFim = MARGEM_LATERAL_MM + conteudoLarguraMm;
      if (i > 0 && dentroDeTabela(y0)) {
        pdf.line(xIni, MARGEM_VERTICAL_MM, xFim, MARGEM_VERTICAL_MM);
      }
      if (i < cortes.length - 2 && dentroDeTabela(y1)) {
        pdf.line(xIni, MARGEM_VERTICAL_MM + alturaMm, xFim, MARGEM_VERTICAL_MM + alturaMm);
      }
    }

    const blob = pdf.output("blob");
    return new File([blob], nomeArquivo(titulo), { type: "application/pdf" });
  } finally {
    hospedeiro.remove();
  }
}
