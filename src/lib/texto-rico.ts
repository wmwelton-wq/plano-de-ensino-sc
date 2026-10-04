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
]);

/** Tags sem fechamento. */
const TAGS_VAZIAS = new Set(["br"]);

/** Tags cujo conteúdo inteiro (e não só a tag) deve ser descartado. */
const TAGS_DESCARTAR_CONTEUDO = new Set(["script", "style", "iframe", "object", "embed", "template"]);

const COR = /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\)|[a-z]{3,20})$/i;
const TAMANHO =
  /^(xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|\d{1,3}(\.\d+)?(px|pt|em|rem|%))$/i;

function estiloSeguro(estilo: string): string {
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
    }
  }
  return saida.join("; ");
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
      saida.push(`<${nome}>`);
      continue;
    }

    const estilo = estiloSeguro(lerAtributoStyle(m[2] ?? ""));
    saida.push(estilo ? `<${nome} style="${estilo}">` : `<${nome}>`);
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
  const temItemDeLista = /<li[\s>]/.test(limpo);
  if (!temItemDeLista && textoSimples(limpo).length === 0) return null;
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
