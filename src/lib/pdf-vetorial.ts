// Desenha uma página já montada (ver paginar-plano.ts) dentro de um PDF, com
// TEXTO de verdade (fonte Arial/Helvetica, nítida e selecionável), bordas em
// linhas e imagens — nada de "foto" da tela. As posições vêm do layout real do
// navegador, então o PDF fica idêntico ao que aparece na página/impressão.

import type { jsPDF } from "jspdf";

const MM_POR_PX = 25.4 / 96;
const PT_POR_PX = 0.75;

interface EstiloTexto {
  tamanhoPx: number;
  negrito: boolean;
  italico: boolean;
  cor: [number, number, number];
  maiusculas: boolean;
  minusculas: boolean;
  sublinhado: boolean;
  riscado: boolean;
  /** Fonte padrão do PDF mais parecida com a do texto. */
  familia: "helvetica" | "times" | "courier";
  /** Valor CSS de font-family, para desenhar caracteres especiais no canvas. */
  familiaCss: string;
  pesoCss: string;
}

/** As fontes embutidas do PDF são só três: escolhe a que mais se parece com a fonte pedida. */
function familiaDoPdf(css: string): "helvetica" | "times" | "courier" {
  const primeira = (css.split(",")[0] ?? "").replace(/["']/g, "").trim().toLowerCase();
  if (/courier|consolas|monaco|mono/.test(primeira)) return "courier";
  if (!/sans/.test(primeira) && /times|georgia|cambria|garamond|palatino|book antiqua|serif/.test(primeira)) return "times";
  return "helvetica";
}

function lerCor(valor: string): [number, number, number] {
  const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(valor);
  if (!m) return [0, 0, 0];
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** As fontes padrão do PDF só têm o alfabeto latino: troca o resto por equivalentes simples. */
function limparTexto(texto: string): string {
  let s = "";
  for (const ch of texto) {
    const c = ch.codePointAt(0) ?? 0;
    if (c < 32) continue;
    if (c <= 255) {
      s += ch;
      continue;
    }
    switch (ch) {
      case "‘":
      case "’":
      case "‚":
        s += "'";
        break;
      case "“":
      case "”":
      case "„":
        s += '"';
        break;
      case "–":
      case "—":
      case "−":
        s += "-";
        break;
      case "…":
        s += "...";
        break;
      case "€":
        s += "EUR";
        break;
      default:
        s += "?";
    }
  }
  return s;
}

function estiloDe(el: Element, raiz: Element, cache: Map<Element, EstiloTexto>): EstiloTexto {
  const cacheado = cache.get(el);
  if (cacheado) return cacheado;
  const cs = getComputedStyle(el);
  const peso = cs.fontWeight;
  const negrito = peso === "bold" || peso === "bolder" || Number(peso) >= 600;
  let sublinhado = false;
  let riscado = false;
  for (let a: Element | null = el; a; a = a.parentElement) {
    const dec = getComputedStyle(a).textDecorationLine;
    if (dec.includes("underline")) sublinhado = true;
    if (dec.includes("line-through")) riscado = true;
    if (a === raiz) break;
  }
  const estilo: EstiloTexto = {
    tamanhoPx: parseFloat(cs.fontSize) || 14,
    negrito,
    italico: cs.fontStyle === "italic" || cs.fontStyle === "oblique",
    cor: lerCor(cs.color),
    maiusculas: cs.textTransform === "uppercase",
    minusculas: cs.textTransform === "lowercase",
    sublinhado,
    riscado,
    familia: familiaDoPdf(cs.fontFamily),
    familiaCss: cs.fontFamily,
    pesoCss: cs.fontWeight,
  };
  cache.set(el, estilo);
  return estilo;
}

/** Quanto o texto fica acima/abaixo da linha de base, medido no próprio navegador. */
function metricasDaFonte(el: Element, cache: Map<string, { subida: number; altura: number }>) {
  const cs = getComputedStyle(el);
  const chave = `${cs.fontFamily}|${cs.fontSize}|${cs.fontWeight}|${cs.fontStyle}`;
  const achado = cache.get(chave);
  if (achado) return achado;
  const sonda = document.createElement("span");
  sonda.style.cssText =
    "position:fixed;left:-100000px;top:0;white-space:nowrap;line-height:normal;" +
    `font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};font-style:${cs.fontStyle};`;
  sonda.textContent = "Hxg";
  const marca = document.createElement("span");
  marca.style.cssText = "display:inline-block;width:0;height:0;";
  sonda.appendChild(marca);
  document.body.appendChild(sonda);
  const rSonda = sonda.getBoundingClientRect();
  const rMarca = marca.getBoundingClientRect();
  const metricas = { subida: rMarca.bottom - rSonda.top, altura: rSonda.height };
  document.body.removeChild(sonda);
  cache.set(chave, metricas);
  return metricas;
}

/** Divide uma palavra que o navegador quebrou em duas linhas (ex.: endereço muito longo). */
function fragmentosDePalavra(no: Text, ini: number, fim: number): { texto: string; rect: DOMRect }[] {
  const saida: { texto: string; rect: DOMRect }[] = [];
  const r = document.createRange();
  for (let i = ini; i < fim; i++) {
    r.setStart(no, i);
    r.setEnd(no, i + 1);
    const rect = r.getClientRects()[0];
    if (!rect) continue;
    const ultimo = saida[saida.length - 1];
    if (ultimo && Math.abs(ultimo.rect.top - rect.top) < 2) {
      ultimo.texto += no.data[i];
      ultimo.rect = new DOMRect(
        ultimo.rect.left,
        ultimo.rect.top,
        rect.right - ultimo.rect.left,
        ultimo.rect.height
      );
    } else {
      saida.push({ texto: no.data[i], rect });
    }
  }
  return saida;
}

async function carregarImagem(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}

/**
 * JPEG: usa o arquivo original, byte a byte (sem redesenhar nem recomprimir), para não perder nitidez.
 * Só quando a imagem não é grande demais para o tamanho em que aparece (senão o PDF ficaria pesado).
 */
async function jpegOriginal(img: HTMLImageElement, larguraPx: number): Promise<string | null> {
  try {
    const src = img.currentSrc || img.src;
    if (!src || !img.naturalWidth || img.naturalWidth > larguraPx * 6) return null;
    const ehJpeg = /\.jpe?g($|\?)/i.test(src) || src.startsWith("data:image/jpeg");
    if (!ehJpeg) return null;
    const resposta = await fetch(src, { cache: "force-cache" });
    if (!resposta.ok) return null;
    const blob = await resposta.blob();
    if (blob.type !== "image/jpeg") return null;
    return await new Promise<string | null>((resolve) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(typeof leitor.result === "string" ? leitor.result : null);
      leitor.onerror = () => resolve(null);
      leitor.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function imagemParaDados(img: HTMLImageElement, larguraPx: number): { dados: string; formato: "JPEG" | "PNG" } | null {
  try {
    if (!img.naturalWidth) return null;
    // Até 6x o tamanho em que aparece (≈ 570 dpi), sem ampliar além do original.
    const escala = Math.min(1, (larguraPx * 6) / img.naturalWidth);
    const w = Math.max(1, Math.round(img.naturalWidth * escala));
    const h = Math.max(1, Math.round(img.naturalHeight * escala));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const src = img.currentSrc || img.src;
    const ehJpeg = /\.jpe?g($|\?)/i.test(src) || src.startsWith("data:image/jpeg");
    if (ehJpeg) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    return ehJpeg
      ? { dados: canvas.toDataURL("image/jpeg", 1), formato: "JPEG" }
      : { dados: canvas.toDataURL("image/png"), formato: "PNG" };
  } catch {
    return null; // imagem de outro site sem permissão: fica em branco
  }
}

/**
 * Imagem de OUTRO endereço (ex.: logo da escola guardada no Supabase): o navegador "suja" o canvas e
 * não deixa ler os pixels. Baixa o arquivo (permitido pelo servidor) e desenha a partir dele.
 */
async function imagemViaDownload(img: HTMLImageElement, larguraPx: number): Promise<{ dados: string; formato: "JPEG" | "PNG" } | null> {
  try {
    const src = img.currentSrc || img.src;
    if (!src || src.startsWith("data:")) return null;
    const resposta = await fetch(src, { mode: "cors", cache: "force-cache" });
    if (!resposta.ok) return null;
    const blob = await resposta.blob();
    const bitmap = await createImageBitmap(blob);
    const escala = Math.min(1, (larguraPx * 6) / bitmap.width);
    const w = Math.max(1, Math.round(bitmap.width * escala));
    const h = Math.max(1, Math.round(bitmap.height * escala));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const jpeg = blob.type === "image/jpeg";
    if (jpeg) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    return jpeg ? { dados: canvas.toDataURL("image/jpeg", 1), formato: "JPEG" } : { dados: canvas.toDataURL("image/png"), formato: "PNG" };
  } catch {
    return null;
  }
}

/** O caractere (ou sequência) pode ser escrito com as fontes do PDF? */
function ehSeguro(grupo: string): boolean {
  for (const ch of grupo) {
    const c = ch.codePointAt(0) ?? 0;
    if (c <= 255) continue;
    if ("‘’‚“”„–—−…€".includes(ch)) continue;
    return false;
  }
  return true;
}

function grafemas(texto: string): { texto: string; indice: number }[] {
  const saida: { texto: string; indice: number }[] = [];
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment: (t: string) => Iterable<{ segment: string; index: number }> } }).Segmenter;
  if (Seg) {
    for (const g of new Seg("pt", { granularity: "grapheme" }).segment(texto)) saida.push({ texto: g.segment, indice: g.index });
    return saida;
  }
  let i = 0;
  for (const ch of texto) {
    saida.push({ texto: ch, indice: i });
    i += ch.length;
  }
  return saida;
}

/** Desenha um símbolo/emoji num canvas (com a fonte e a cor do texto) e devolve a imagem. */
function simboloParaDados(
  grupo: string,
  larguraPx: number,
  alturaPx: number,
  subidaPx: number,
  estilo: EstiloTexto
): string | null {
  try {
    const escala = 8;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(larguraPx * escala));
    canvas.height = Math.max(1, Math.ceil(alturaPx * escala));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.font = `${estilo.italico ? "italic " : ""}${estilo.pesoCss} ${estilo.tamanhoPx * escala}px ${estilo.familiaCss}`;
    ctx.fillStyle = `rgb(${estilo.cor[0]},${estilo.cor[1]},${estilo.cor[2]})`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(grupo, 0, subidaPx * escala);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/** Cor de fundo (com ou sem transparência) misturada ao branco; null se não houver fundo. */
function lerFundo(valor: string): [number, number, number] | null {
  const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/.exec(valor);
  if (!m) return null;
  const a = m[4] === undefined ? 1 : Number(m[4]);
  if (!(a > 0)) return null;
  const mix = (c: number) => Math.round(255 + (Number(c) - 255) * Math.min(1, a));
  const cor: [number, number, number] = [mix(Number(m[1])), mix(Number(m[2])), mix(Number(m[3]))];
  return cor[0] === 255 && cor[1] === 255 && cor[2] === 255 ? null : cor;
}

const LADOS = [
  { nome: "Top", linha: (r: DOMRect) => [r.left, r.top, r.right, r.top] },
  { nome: "Right", linha: (r: DOMRect) => [r.right, r.top, r.right, r.bottom] },
  { nome: "Bottom", linha: (r: DOMRect) => [r.left, r.bottom, r.right, r.bottom] },
  { nome: "Left", linha: (r: DOMRect) => [r.left, r.top, r.left, r.bottom] },
] as const;

/**
 * Desenha `pagina` no PDF, com o canto superior esquerdo em (origemXmm, origemYmm).
 * Cada página do PDF recebe uma chamada.
 */
export async function desenharPaginaNoPdf(
  pdf: jsPDF,
  pagina: HTMLElement,
  origemXmm: number,
  origemYmm: number
): Promise<void> {
  const raiz = pagina.getBoundingClientRect();
  const X = (px: number) => origemXmm + (px - raiz.left) * MM_POR_PX;
  const Y = (px: number) => origemYmm + (px - raiz.top) * MM_POR_PX;

  const todos = Array.from(pagina.querySelectorAll("*"));

  // 0) Fundos coloridos (sombreamento de células/parágrafos, marca-texto), antes de tudo.
  for (const el of todos) {
    const fundo = lerFundo(getComputedStyle(el).backgroundColor);
    if (!fundo) continue;
    pdf.setFillColor(fundo[0], fundo[1], fundo[2]);
    for (const r of Array.from(el.getClientRects())) {
      if (r.width <= 0 || r.height <= 0) continue;
      pdf.rect(X(r.left), Y(r.top), r.width * MM_POR_PX, r.height * MM_POR_PX, "F");
    }
  }

  // 1) Bordas (células de tabela etc.), como linhas.
  pdf.setLineCap(2);
  for (const el of todos) {
    const cs = getComputedStyle(el);
    if ((el.tagName === "TABLE" || el.tagName === "TR") && cs.borderCollapse === "collapse") continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    for (const lado of LADOS) {
      const largura = parseFloat(cs.getPropertyValue(`border-${lado.nome.toLowerCase()}-width`));
      const estilo = cs.getPropertyValue(`border-${lado.nome.toLowerCase()}-style`);
      if (!(largura > 0) || estilo === "none" || estilo === "hidden") continue;
      const [cr, cg, cb] = lerCor(cs.getPropertyValue(`border-${lado.nome.toLowerCase()}-color`));
      pdf.setDrawColor(cr, cg, cb);
      pdf.setLineWidth(Math.max(0.15, largura * MM_POR_PX));
      const [x1, y1, x2, y2] = lado.linha(rect);
      pdf.line(X(x1), Y(y1), X(x2), Y(y2));
    }
  }

  // 2) Imagens (brasões/logos).
  for (const img of Array.from(pagina.querySelectorAll("img"))) {
    await carregarImagem(img);
    const rect = img.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    const largura = rect.width * MM_POR_PX;
    const altura = rect.height * MM_POR_PX;
    let colocada = false;
    const original = await jpegOriginal(img, rect.width);
    if (original) {
      try {
        pdf.addImage(original, "JPEG", X(rect.left), Y(rect.top), largura, altura, `orig:${img.currentSrc || img.src}`);
        colocada = true;
      } catch {
        colocada = false; // JPEG de um tipo que o PDF não aceita direto: usa o desenho abaixo
      }
    }
    if (!colocada) {
      const dados = imagemParaDados(img, rect.width) ?? (await imagemViaDownload(img, rect.width));
      if (dados) pdf.addImage(dados.dados, dados.formato, X(rect.left), Y(rect.top), largura, altura);
    }
  }

  // 3) Texto, palavra por palavra, nas posições medidas.
  const cacheEstilos = new Map<Element, EstiloTexto>();
  const cacheMetricas = new Map<string, { subida: number; altura: number }>();
  const andador = document.createTreeWalker(pagina, NodeFilter.SHOW_TEXT);
  const range = document.createRange();

  for (let no = andador.nextNode() as Text | null; no; no = andador.nextNode() as Text | null) {
    const pai = no.parentElement;
    if (!pai || !no.data.trim()) continue;
    if (getComputedStyle(pai).visibility === "hidden") continue;
    const estilo = estiloDe(pai, pagina, cacheEstilos);
    const { subida, altura: alturaFonte } = metricasDaFonte(pai, cacheMetricas);
    const fonte = estilo.negrito ? (estilo.italico ? "bolditalic" : "bold") : estilo.italico ? "italic" : "normal";
    pdf.setFont(estilo.familia, fonte);
    pdf.setFontSize(estilo.tamanhoPx * PT_POR_PX);
    pdf.setTextColor(estilo.cor[0], estilo.cor[1], estilo.cor[2]);
    pdf.setDrawColor(estilo.cor[0], estilo.cor[1], estilo.cor[2]);
    pdf.setLineWidth(Math.max(0.1, estilo.tamanhoPx * 0.06 * MM_POR_PX));

    const regex = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(no.data))) {
      range.setStart(no, m.index);
      range.setEnd(no, m.index + m[0].length);
      const rects = range.getClientRects();
      if (rects.length === 0) continue;

      if (!ehSeguro(m[0])) {
        // Palavra com símbolo/emoji: letras normais viram texto; símbolos viram imagem.
        for (const g of grafemas(m[0])) {
          const ini = m.index + g.indice;
          range.setStart(no, ini);
          range.setEnd(no, ini + g.texto.length);
          const rg = range.getClientRects()[0];
          if (!rg) continue;
          if (ehSeguro(g.texto)) {
            let t = g.texto;
            if (estilo.maiusculas) t = t.toUpperCase();
            else if (estilo.minusculas) t = t.toLowerCase();
            t = limparTexto(t);
            if (t) pdf.text(t, X(rg.left), Y(rg.top + subida));
          } else {
            const dados = simboloParaDados(g.texto, rg.width, alturaFonte, subida, estilo);
            if (dados) {
              pdf.addImage(dados, "PNG", X(rg.left), Y(rg.top), rg.width * MM_POR_PX, alturaFonte * MM_POR_PX, `sim:${g.texto}:${estilo.tamanhoPx}:${estilo.cor.join(",")}:${estilo.pesoCss}:${estilo.italico ? 1 : 0}`);
            }
          }
          const baseG = rg.top + subida;
          if (estilo.sublinhado) {
            const yl = Y(baseG + estilo.tamanhoPx * 0.1);
            pdf.line(X(rg.left), yl, X(rg.right), yl);
          }
          if (estilo.riscado) {
            const yl = Y(baseG - estilo.tamanhoPx * 0.3);
            pdf.line(X(rg.left), yl, X(rg.right), yl);
          }
        }
        continue;
      }

      const pedacos =
        rects.length === 1
          ? [{ texto: m[0], rect: rects[0] }]
          : fragmentosDePalavra(no, m.index, m.index + m[0].length);
      for (const p of pedacos) {
        let texto = p.texto;
        if (estilo.maiusculas) texto = texto.toUpperCase();
        else if (estilo.minusculas) texto = texto.toLowerCase();
        texto = limparTexto(texto);
        if (!texto) continue;
        const x = X(p.rect.left);
        const base = p.rect.top + subida;
        pdf.text(texto, x, Y(base));
        if (estilo.sublinhado) {
          const yl = Y(base + estilo.tamanhoPx * 0.1);
          pdf.line(x, yl, X(p.rect.right), yl);
        }
        if (estilo.riscado) {
          const yl = Y(base - estilo.tamanhoPx * 0.3);
          pdf.line(x, yl, X(p.rect.right), yl);
        }
      }
    }
  }

  // 4) Marcadores de lista (bolinhas e números).
  for (const el of todos) {
    if (el.tagName !== "LI") continue;
    const cs = getComputedStyle(el);
    if (cs.display !== "list-item") continue;
    const tipo = cs.listStyleType;
    if (tipo === "none") continue;
    const rects = el.getClientRects();
    if (rects.length === 0) continue;
    const estilo = estiloDe(el, pagina, cacheEstilos);
    const { subida, altura } = metricasDaFonte(el, cacheMetricas);
    const lh = parseFloat(cs.lineHeight) || altura;
    const linhaBase = rects[0].top + (lh - altura) / 2 + subida;
    pdf.setTextColor(estilo.cor[0], estilo.cor[1], estilo.cor[2]);
    pdf.setFillColor(estilo.cor[0], estilo.cor[1], estilo.cor[2]);
    if (tipo === "disc" || tipo === "circle" || tipo === "square") {
      const cx = X(rects[0].left - estilo.tamanhoPx * 0.68);
      const cy = Y(linhaBase - estilo.tamanhoPx * 0.31);
      pdf.circle(cx, cy, Math.max(0.3, estilo.tamanhoPx * 0.15 * MM_POR_PX), "F");
    } else if (tipo === "decimal") {
      const lista = el.parentElement;
      const inicio = lista ? Number(lista.getAttribute("start") ?? "1") || 1 : 1;
      const irmaos = lista ? Array.from(lista.children).filter((c) => c.tagName === "LI") : [];
      const n = inicio + Math.max(0, irmaos.indexOf(el));
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(estilo.tamanhoPx * PT_POR_PX);
      pdf.text(`${n}.`, X(rects[0].left - estilo.tamanhoPx * 0.3), Y(linhaBase), { align: "right" });
    }
  }
}
