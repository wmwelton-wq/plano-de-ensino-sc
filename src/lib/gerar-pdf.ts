// Geração de PDF no navegador (client-side), a partir do conteúdo já
// renderizado do plano de ensino. Usa importação dinâmica para não
// aumentar o bundle inicial das páginas que não geram PDF.

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
 * Percorre os filhos diretos do elemento capturado e devolve a lista de
 * "unidades" que nunca podem ser cortadas ao meio ao paginar o PDF: cada
 * linha (<tr>) de cada tabela, e cada bloco de nível superior fora de
 * tabelas (cabeçalho, título etc.). Uma tabela inteira não é tratada como
 * uma unidade só — senão ela nunca poderia quebrar de página —, mas cada
 * uma de suas linhas é.
 */
function coletarUnidades(container: HTMLElement): HTMLElement[] {
  const unidades: HTMLElement[] = [];

  Array.from(container.children).forEach((filho) => {
    if (filho instanceof HTMLTableElement) {
      const linhas = filho.querySelectorAll("tbody > tr");
      if (linhas.length > 0) {
        linhas.forEach((linha) => unidades.push(linha as HTMLElement));
        return;
      }
    }
    unidades.push(filho as HTMLElement);
  });

  return unidades;
}

/**
 * Captura o elemento com o id informado e monta um PDF A4 na horizontal
 * (mesmo formato do modelo oficial da SED/SC), paginado sem cortar
 * nenhuma linha de tabela ou bloco de conteúdo ao meio.
 *
 * Como o html2canvas rasteriza o elemento inteiro numa única imagem, a
 * técnica usada é: medir, ANTES de rasterizar, a posição (em px) de cada
 * "unidade" que não pode ser dividida (coletarUnidades); depois, fatiar a
 * imagem final exatamente nas bordas dessas unidades — nunca no meio de
 * uma — respeitando a altura útil de uma página. Só no caso raro de uma
 * unidade sozinha ser mais alta que uma página inteira ela acaba cortada,
 * por não haver como evitar sem quebrar o próprio conteúdo em pedaços
 * menores.
 *
 * Retorna o PDF já como File, pronto para download ou compartilhamento.
 */
export async function gerarPdfDoElemento(
  elementId: string,
  titulo: string
): Promise<File> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const elemento = document.getElementById(elementId);
  if (!elemento) {
    throw new Error("Conteúdo do plano não encontrado para gerar o PDF.");
  }

  // Medido ANTES do html2canvas (que clona o elemento para renderizar):
  // como as duas medições abaixo acontecem no mesmo instante, sobre o
  // mesmo layout ainda não alterado, as posições relativas capturadas
  // aqui continuam válidas depois, mesmo que a página role ou mude.
  const containerTopo = elemento.getBoundingClientRect().top;
  const larguraElemento = elemento.offsetWidth;
  const limitesUnidades = coletarUnidades(elemento).map((unidade) => {
    const rect = unidade.getBoundingClientRect();
    return {
      topo: rect.top - containerTopo,
      base: rect.bottom - containerTopo,
    };
  });

  const canvas = await html2canvas(elemento, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const larguraPagina = pdf.internal.pageSize.getWidth();
  const alturaPagina = pdf.internal.pageSize.getHeight();

  // Fator real de conversão de px do DOM para px do canvas rasterizado
  // (não assume que bateu exatamente com `scale: 2` acima).
  const escalaCanvas = canvas.width / larguraElemento;
  // Cada px do canvas, quando a imagem é esticada para caber na largura
  // da página, corresponde a esta altura em mm.
  const mmPorPxCanvas = larguraPagina / canvas.width;
  const alturaPaginaEmPxCanvas = alturaPagina / mmPorPxCanvas;

  // Calcula os pontos de corte (em px do canvas), respeitando as bordas
  // das unidades coletadas: cada página tem, no máximo, a altura útil de
  // uma página A4 na horizontal, e os cortes só caem "no meio" de uma
  // unidade quando ela sozinha já é mais alta que uma página inteira.
  const cortes: number[] = [0];
  let inicioPaginaPx = 0;

  for (const limite of limitesUnidades) {
    const topoPx = limite.topo * escalaCanvas;
    const basePx = limite.base * escalaCanvas;

    if (basePx - inicioPaginaPx > alturaPaginaEmPxCanvas && topoPx > inicioPaginaPx) {
      cortes.push(topoPx);
      inicioPaginaPx = topoPx;
    }

    // Se mesmo começando no topo de uma página nova a unidade ainda for
    // mais alta que a página inteira, avança em incrementos de altura de
    // página — único caso em que um corte cai dentro da própria unidade.
    while (basePx - inicioPaginaPx > alturaPaginaEmPxCanvas) {
      const proximoCorte = inicioPaginaPx + alturaPaginaEmPxCanvas;
      cortes.push(proximoCorte);
      inicioPaginaPx = proximoCorte;
    }
  }

  cortes.push(canvas.height);

  // Remove cortes fora de ordem ou duplicados (pode acontecer quando uma
  // unidade termina exatamente numa borda de página).
  const cortesOrdenados = Array.from(new Set(cortes)).sort((a, b) => a - b);

  let primeiraPagina = true;
  for (let i = 0; i < cortesOrdenados.length - 1; i++) {
    const y0 = cortesOrdenados[i];
    const y1 = cortesOrdenados[i + 1];
    const alturaFatiaPx = Math.round(y1 - y0);
    if (alturaFatiaPx <= 0) continue;

    const fatia = document.createElement("canvas");
    fatia.width = canvas.width;
    fatia.height = alturaFatiaPx;
    const ctx = fatia.getContext("2d");
    if (!ctx) continue;
    ctx.drawImage(
      canvas,
      0,
      y0,
      canvas.width,
      alturaFatiaPx,
      0,
      0,
      canvas.width,
      alturaFatiaPx
    );

    if (!primeiraPagina) {
      pdf.addPage();
    }
    primeiraPagina = false;

    const alturaFatiaMm = alturaFatiaPx * mmPorPxCanvas;
    pdf.addImage(fatia.toDataURL("image/png"), "PNG", 0, 0, larguraPagina, alturaFatiaMm);
  }

  const blob = pdf.output("blob");
  return new File([blob], nomeArquivo(titulo), { type: "application/pdf" });
}
