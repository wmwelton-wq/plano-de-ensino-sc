/**
 * Texto formatado (negrito, listas, cores etc.) dos campos livres do plano.
 *
 * Os campos continuam sendo colunas de texto no banco. Quando o professor usa
 * o editor formatado, gravamos HTML higienizado precedido do marcador
 * MARCADOR_HTML. Planos antigos (texto simples, um item por linha) continuam
 * funcionando: sem o marcador, o conteúdo é tratado como texto simples.
 *
 * Este arquivo não depende de DOM, então roda no servidor (Server Action e
 * página de impressão) e no navegador (editor).
 */

export const MARCADOR_HTML = "<!--rt-->";

const TAGS_PERMITIDAS = new Set([
  "p",
  "div",
  "br",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "ul",
  "ol",
  "li",
  "span",
  // Recursos do editor livre do plano anual (tabelas, imagens, títulos, etc.).
  "sub",
  "sup",
  "s",
  "strike",
  "h1",
  "h2",
  "h3",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
  "colgroup",
  "col",
  "img",
]);

/** Tags sem fechamento. */
const TAGS_VAZIAS = new Set(["br", "img", "col"]);

/** Tags cujo conteúdo inteiro (e não só a tag) deve ser descartado. */
const TAGS_DESCARTAR_CONTEUDO = new Set(["script", "style", "iframe", "object", "embed", "template"]);

const COR_VALOR =
  "(#[0-9a-f]{3,8}|rgba?\\(\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*(,\\s*[\\d.]+\\s*)?\\)|[a-z]{3,20})";
const COR = new RegExp(`^${COR_VALOR}$`, "i");
const TAMANHO =
  /^(xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|smaller|larger|\d{1,3}(\.\d+)?(px|pt|em|rem|%))$/i;
const COMPRIMENTO = /^-?\d{1,4}(\.\d+)?(px|pt|em|rem|%)?$/i;
const COMPRIMENTOS = /^(-?\d{1,4}(\.\d+)?(px|pt|em|rem|%)?\s*){1,4}$/i;
const BORDA = new RegExp(`^(none|\\d(\\.\\d+)?px\\s+(solid|dashed|dotted|double)(\\s+${COR_VALOR})?)$`, "i");
const SOMBRA = new RegExp(`^(none|-?\\d{1,2}px\\s+-?\\d{1,2}px\\s+\\d{1,2}px\\s+${COR_VALOR})$`, "i");
const FAMILIA = /^[\p{L}0-9\s,'.\-]{1,120}$/u;

function decodificarEntidades(t: string): string {
  return t
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function estiloSeguro(estiloBruto: string): string {
  const estilo = decodificarEntidades(estiloBruto);
  const saida: string[] = [];
  for (const par of estilo.split(";")) {
    const i = par.indexOf(":");
    if (i < 0) continue;
    const prop = par.slice(0, i).trim().toLowerCase();
    const valor = par.slice(i + 1).trim();
    if (!valor) continue;
    if ((prop === "color" || prop === "background-color") && COR.test(valor)) {
      saida.push(`${prop}: ${valor}`);
    } else if (prop === "font-size" && TAMANHO.test(valor)) {
      saida.push(`font-size: ${valor}`);
    } else if (prop === "font-family") {
      const v = valor.replace(/"/g, "'");
      if (FAMILIA.test(v)) saida.push(`font-family: ${v}`);
    } else if (prop === "font-weight" && /^(bold|normal|[1-9]00)$/i.test(valor)) {
      saida.push(`font-weight: ${valor}`);
    } else if (prop === "font-style" && /^(italic|normal)$/i.test(valor)) {
      saida.push(`font-style: ${valor}`);
    } else if (prop === "text-decoration" || prop === "text-decoration-line") {
      if (/^(underline|line-through|none)( (underline|line-through))*$/i.test(valor)) {
        saida.push(`text-decoration: ${valor}`);
      }
    } else if (prop === "text-align" && /^(left|center|right|justify)$/i.test(valor)) {
      saida.push(`text-align: ${valor}`);
    } else if (prop === "line-height" && /^\d{1,3}(\.\d+)?(px|pt|em|%)?$/i.test(valor)) {
      saida.push(`line-height: ${valor}`);
    } else if (prop === "vertical-align" && /^(top|middle|bottom|baseline|sub|super|text-top|text-bottom)$/i.test(valor)) {
      saida.push(`vertical-align: ${valor}`);
    } else if (
      (prop === "text-indent" || prop === "margin-left" || prop === "margin-right" || prop === "margin-top" ||
        prop === "margin-bottom" || prop === "padding-left") &&
      COMPRIMENTO.test(valor)
    ) {
      saida.push(`${prop}: ${valor}`);
    } else if ((prop === "margin" || prop === "padding") && COMPRIMENTOS.test(valor)) {
      saida.push(`${prop}: ${valor}`);
    } else if ((prop === "width" || prop === "height" || prop === "max-width") && /^(auto|\d{1,4}(\.\d+)?(px|%|pt))$/i.test(valor)) {
      saida.push(`${prop}: ${valor}`);
    } else if (/^border(-top|-right|-bottom|-left)?$/.test(prop) && BORDA.test(valor)) {
      saida.push(`${prop}: ${valor}`);
    } else if (prop === "border-collapse" && /^(collapse|separate)$/i.test(valor)) {
      saida.push(`border-collapse: ${valor}`);
    } else if (prop === "table-layout" && /^(fixed|auto)$/i.test(valor)) {
      saida.push(`table-layout: ${valor}`);
    } else if (prop === "text-shadow" && SOMBRA.test(valor)) {
      saida.push(`text-shadow: ${valor}`);
    } else if (
      prop === "list-style-type" &&
      /^(disc|circle|square|decimal|lower-alpha|upper-alpha|lower-roman|upper-roman|none)$/i.test(valor)
    ) {
      saida.push(`list-style-type: ${valor}`);
    }
  }
  return saida.join("; ");
}

function lerAtributo(atributos: string, nome: string): string {
  const m = new RegExp(`(?:^|\\s)${nome}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i").exec(atributos);
  return m ? decodificarEntidades(m[1] ?? m[2] ?? m[3] ?? "") : "";
}

function escaparAtributo(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const IMAGEM_DADOS = /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+$/;

/** Atributos que mantemos além do style: tamanho/posição de células e as imagens embutidas (só data:image). */
function atributosExtras(nome: string, atributos: string): { texto: string; descartarTag: boolean } {
  if (nome === "td" || nome === "th") {
    let t = "";
    for (const a of ["colspan", "rowspan"]) {
      const v = lerAtributo(atributos, a);
      if (/^\d{1,2}$/.test(v) && Number(v) > 1) t += ` ${a}="${v}"`;
    }
    return { texto: t, descartarTag: false };
  }
  if (nome === "img") {
    const src = lerAtributo(atributos, "src");
    if (!IMAGEM_DADOS.test(src)) return { texto: "", descartarTag: true };
    let t = ` src="${src}"`;
    const alt = lerAtributo(atributos, "alt");
    if (alt) t += ` alt="${escaparAtributo(alt.slice(0, 200))}"`;
    return { texto: t, descartarTag: false };
  }
  return { texto: "", descartarTag: false };
}

function lerAtributoStyle(atributos: string): string {
  const m = /(?:^|\s)style\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(atributos);
  return m ? (m[1] ?? m[2] ?? "") : "";
}

export function ehHtml(texto: string | null | undefined): boolean {
  return !!texto && texto.trimStart().startsWith(MARCADOR_HTML);
}

/** Texto visível, sem marcação (para detectar campo vazio e para buscas). */
export function textoSimples(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

/**
 * Mantém só as tags/estilos da lista de permitidos. Tudo o que não for
 * reconhecido é removido (o texto interno é preservado, exceto de <script> e
 * afins).
 */
export function sanitizarHtml(entrada: string): string {
  const html = entrada.startsWith(MARCADOR_HTML) ? entrada.slice(MARCADOR_HTML.length) : entrada;
  const padrao = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>|[^<]+|</g;

  const saida: string[] = [];
  const pilha: string[] = [];
  let descartandoAte: string | null = null;

  let m: RegExpExecArray | null;
  while ((m = padrao.exec(html)) !== null) {
    const token = m[0];

    if (token.startsWith("<!--")) continue;

    if (token === "<") {
      if (!descartandoAte) saida.push("&lt;");
      continue;
    }

    if (!m[1]) {
      // Texto puro. O navegador já entrega com "&", "<" e ">" escapados; um ">"
      // solto é inofensivo, mas escapamos por consistência.
      if (!descartandoAte) saida.push(token.replace(/>/g, "&gt;"));
      continue;
    }

    const nome = m[1].toLowerCase();
    const fechando = token.startsWith("</");

    if (descartandoAte) {
      if (fechando && nome === descartandoAte) descartandoAte = null;
      continue;
    }

    if (TAGS_DESCARTAR_CONTEUDO.has(nome)) {
      if (!fechando && !token.endsWith("/>")) descartandoAte = nome;
      continue;
    }

    if (!TAGS_PERMITIDAS.has(nome)) continue;

    if (fechando) {
      const i = pilha.lastIndexOf(nome);
      if (i < 0) continue;
      // Fecha tudo o que estiver aberto por dentro, para manter o HTML bem formado.
      while (pilha.length > i) {
        saida.push(`</${pilha.pop()}>`);
      }
      continue;
    }

    if (TAGS_VAZIAS.has(nome)) {
      const extrasV = atributosExtras(nome, m[2] ?? "");
      if (extrasV.descartarTag) continue;
      const estiloV = estiloSeguro(lerAtributoStyle(m[2] ?? ""));
      saida.push(`<${nome}${extrasV.texto}${estiloV ? ` style="${escaparAtributo(estiloV)}"` : ""}>`);
      continue;
    }

    const extras = atributosExtras(nome, m[2] ?? "");
    if (extras.descartarTag) continue;
    const estilo = estiloSeguro(lerAtributoStyle(m[2] ?? ""));
    saida.push(`<${nome}${extras.texto}${estilo ? ` style="${escaparAtributo(estilo)}"` : ""}>`);
    pilha.push(nome);
  }

  while (pilha.length > 0) saida.push(`</${pilha.pop()}>`);

  return saida.join("");
}

/**
 * Usado na Server Action: devolve o valor pronto para gravar.
 * - Texto simples (outros formulários) passa como veio.
 * - HTML do editor é higienizado e recebe o marcador; vazio vira null.
 */
export function prepararCampoParaSalvar(valor: FormDataEntryValue | null): string | null {
  if (typeof valor !== "string") return null;
  if (!ehHtml(valor)) return valor.length > 0 ? valor : null;
  const limpo = sanitizarHtml(valor);
  const temConteudoVisual = /<(li|img|table)[\s>]/.test(limpo);
  if (!temConteudoVisual && textoSimples(limpo).length === 0) return null;
  return MARCADOR_HTML + limpo;
}

function escaparHtml(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Converte o texto simples antigo (uma linha = um item) em HTML do editor. */
export function textoSimplesParaHtml(texto: string | null | undefined, comoLista = false): string {
  if (!texto) return "";
  const linhas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map(escaparHtml);
  if (linhas.length === 0) return "";
  return comoLista
    ? `<ul>${linhas.map((l) => `<li>${l}</li>`).join("")}</ul>`
    : linhas.map((l) => `<p>${l}</p>`).join("");
}

/** HTML inicial do editor a partir do valor gravado (HTML do editor ou texto antigo). */
export function valorGravadoParaHtml(valor: string | null | undefined, comoLista = false): string {
  if (!valor) return "";
  if (ehHtml(valor)) return sanitizarHtml(valor);
  return textoSimplesParaHtml(valor, comoLista);
}
