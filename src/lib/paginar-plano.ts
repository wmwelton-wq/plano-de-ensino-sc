// Divide o plano de ensino em páginas, medindo o layout real do navegador.
//
// Em vez de "fatiar" uma imagem gigante (o que corta texto e abre as caixas),
// montamos cada página como um pedaço de HTML próprio: as linhas das tabelas
// vão sendo colocadas na página enquanto couberem; a que não couber é dividida
// ENTRE os parágrafos/itens (nunca no meio de uma linha de texto) e o resto
// segue na próxima página, numa linha nova com todas as bordas — assim as
// caixas sempre ficam fechadas e alinhadas. A mesma divisão alimenta a
// impressão (Ctrl+P) e o PDF, que por isso saem iguais.

import { ESTILO_TEXTO_PLANO_CSS } from "./estilo-plano";

export interface ResultadoPaginacao {
  /** Uma <div> por página, com a largura exata da área de texto. */
  paginas: HTMLElement[];
  /** Remove da tela o material de medição (as páginas deixam de existir se ainda estiverem nele). */
  limpar: () => void;
}

const BLOCOS = new Set([
  "P", "DIV", "UL", "OL", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "TABLE", "BLOCKQUOTE", "PRE", "SECTION",
]);
const CONTAINERS = new Set(["DIV", "UL", "OL", "SECTION"]);

interface Atomo {
  /** Cadeia de elementos-envoltório (do original) dentro da célula, de fora para dentro. */
  cadeia: Element[];
  /** Nós do original que formam este item (um parágrafo, um item de lista...). */
  nos: Node[];
}

interface Alvo {
  raiz: HTMLElement;
  cadeiaOrig: Element[];
  cadeiaClone: HTMLElement[];
}

function nosUteis(el: Element): ChildNode[] {
  return Array.from(el.childNodes).filter((n) => {
    if (n.nodeType === 8) return false;
    if (n.nodeType === 3) return (n.textContent ?? "").trim() !== "";
    return true;
  });
}

function ehContainerDeBlocos(el: Element): boolean {
  if (!CONTAINERS.has(el.tagName)) return false;
  const nos = nosUteis(el);
  return nos.length > 0 && nos.every((n) => n.nodeType === 1 && BLOCOS.has((n as Element).tagName));
}

/** Quebra o conteúdo de uma célula nos menores blocos que podem ir para páginas diferentes. */
function coletarAtomos(container: Element, cadeia: Element[], saida: Atomo[]) {
  const nos = nosUteis(container);
  const soBlocos = nos.length > 0 && nos.every((n) => n.nodeType === 1 && BLOCOS.has((n as Element).tagName));
  if (!soBlocos) {
    saida.push({ cadeia, nos: Array.from(container.childNodes) });
    return;
  }
  for (const n of nos) {
    const el = n as Element;
    if (ehContainerDeBlocos(el)) coletarAtomos(el, [...cadeia, el], saida);
    else saida.push({ cadeia, nos: [el] });
  }
}

/** Clona um nó fixando o tamanho das imagens (o clone ainda não as carregou). */
function clonar(no: Node): Node {
  const copia = no.cloneNode(true);
  if (no.nodeType !== 1) return copia;
  const original = no as Element;
  const imgsO: Element[] = original.tagName === "IMG" ? [original] : Array.from(original.querySelectorAll("img"));
  const imgsC: Element[] =
    (copia as Element).tagName === "IMG" ? [copia as Element] : Array.from((copia as Element).querySelectorAll("img"));
  imgsO.forEach((img, i) => {
    const alvo = imgsC[i] as HTMLElement | undefined;
    if (!alvo) return;
    const r = img.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      alvo.style.width = `${r.width}px`;
      alvo.style.height = `${r.height}px`;
      alvo.style.maxWidth = "none";
      alvo.style.maxHeight = "none";
    }
  });
  return copia;
}

function colocarAtomo(alvo: Alvo, atomo: Atomo): () => void {
  let k = 0;
  while (k < alvo.cadeiaOrig.length && k < atomo.cadeia.length && alvo.cadeiaOrig[k] === atomo.cadeia[k]) k++;
  const antesOrig = alvo.cadeiaOrig.slice();
  const antesClone = alvo.cadeiaClone.slice();
  alvo.cadeiaOrig = alvo.cadeiaOrig.slice(0, k);
  alvo.cadeiaClone = alvo.cadeiaClone.slice(0, k);
  let pai: HTMLElement = k === 0 ? alvo.raiz : alvo.cadeiaClone[k - 1];
  let primeiroCriado: HTMLElement | null = null;
  for (let j = k; j < atomo.cadeia.length; j++) {
    const envoltorio = atomo.cadeia[j].cloneNode(false) as HTMLElement;
    pai.appendChild(envoltorio);
    if (!primeiroCriado) primeiroCriado = envoltorio;
    alvo.cadeiaOrig.push(atomo.cadeia[j]);
    alvo.cadeiaClone.push(envoltorio);
    pai = envoltorio;
  }
  const copias = atomo.nos.map((n) => clonar(n));
  const paiFinal = pai;
  copias.forEach((c) => paiFinal.appendChild(c));
  return () => {
    copias.forEach((c) => c.parentNode?.removeChild(c));
    primeiroCriado?.parentNode?.removeChild(primeiroCriado);
    alvo.cadeiaOrig = antesOrig;
    alvo.cadeiaClone = antesClone;
  };
}

/**
 * Divide o conteúdo de `original` (o #plano-conteudo) em páginas com `larguraPx`
 * de largura e no máximo `alturaUtilPx` de altura cada.
 */
export function paginarPlano(original: HTMLElement, larguraPx: number, alturaUtilPx: number): ResultadoPaginacao {
  const hospedeiro = document.createElement("div");
  hospedeiro.style.cssText = `position:fixed;left:-100000px;top:0;width:${larguraPx}px;background:#fff;z-index:-1;`;
  document.body.appendChild(hospedeiro);

  const limite = alturaUtilPx;
  const paginas: HTMLElement[] = [];
  let pagina!: HTMLElement;
  let tabelaAtual: { orig: Element; tabela: HTMLElement; tbody: HTMLElement } | null = null;

  function criarPagina(): HTMLElement {
    const p = document.createElement("div");
    p.style.cssText = `width:${larguraPx}px;display:flow-root;background:#fff;${ESTILO_TEXTO_PLANO_CSS}`;
    return p;
  }

  function novaPagina() {
    pagina = criarPagina();
    hospedeiro.appendChild(pagina);
    paginas.push(pagina);
    tabelaAtual = null;
  }

  const altura = () => pagina.getBoundingClientRect().height;
  const paginaVazia = () => pagina.children.length === 0;

  function zerarMargemSeForPrimeiro(el: HTMLElement) {
    if (pagina.children.length === 1) el.style.marginTop = "0";
  }

  function garantirTabela(orig: Element): { tbody: HTMLElement; criada: boolean } {
    if (tabelaAtual && tabelaAtual.orig === orig) return { tbody: tabelaAtual.tbody, criada: false };
    const t = orig.cloneNode(false) as HTMLElement;
    const tb = document.createElement("tbody");
    t.appendChild(tb);
    pagina.appendChild(t);
    zerarMargemSeForPrimeiro(t);
    tabelaAtual = { orig, tabela: t, tbody: tb };
    return { tbody: tb, criada: true };
  }

  function descartarTabelaRecemCriada() {
    if (tabelaAtual) {
      tabelaAtual.tabela.parentNode?.removeChild(tabelaAtual.tabela);
      tabelaAtual = null;
    }
  }

  function adicionarBloco(el: Element) {
    const c = clonar(el) as HTMLElement;
    tabelaAtual = null;
    pagina.appendChild(c);
    zerarMargemSeForPrimeiro(c);
    if (altura() > limite && pagina.children.length > 1) {
      pagina.removeChild(c);
      novaPagina();
      pagina.appendChild(c);
      zerarMargemSeForPrimeiro(c);
    }
  }

  function tentarLinhaInteira(tabela: Element, tr: Element): boolean {
    const { tbody, criada } = garantirTabela(tabela);
    const novo = clonar(tr);
    tbody.appendChild(novo);
    if (altura() <= limite) return true;
    tbody.removeChild(novo);
    if (criada) descartarTabelaRecemCriada();
    return false;
  }

  /** Altura da linha sozinha numa página em branco. */
  function alturaIsolada(tabela: Element, tr: Element): number {
    const teste = criarPagina();
    hospedeiro.appendChild(teste);
    const t = tabela.cloneNode(false) as HTMLElement;
    const tb = document.createElement("tbody");
    t.appendChild(tb);
    tb.appendChild(clonar(tr));
    teste.appendChild(t);
    const h = teste.getBoundingClientRect().height;
    hospedeiro.removeChild(teste);
    return h;
  }

  /**
   * Coloca a linha em fragmentos, dividindo o conteúdo de cada célula entre os
   * itens (parágrafos, itens de lista). O 1º fragmento só começa na página atual
   * se ainda couber ao menos o 1º item de cada célula; `forcar` ignora essa regra.
   */
  function dividirLinha(tabela: Element, tr: Element, forcar: boolean): boolean {
    const celulas = Array.from((tr as HTMLTableRowElement).cells);
    const filas: Atomo[][] = celulas.map((td) => {
      const a: Atomo[] = [];
      coletarAtomos(td, [], a);
      return a;
    });
    const backup = filas.map((f) => f.slice());

    if (!forcar && !paginaVazia() && limite - altura() < limite * 0.1) return false;

    let primeiro = true;
    while (primeiro || filas.some((f) => f.length > 0)) {
      const { tbody, criada } = garantirTabela(tabela);
      const frag = tr.cloneNode(false) as HTMLElement;
      tbody.appendChild(frag);
      const alvos: Alvo[] = celulas.map((td) => {
        const c = td.cloneNode(false) as HTMLElement;
        frag.appendChild(c);
        return { raiz: c, cadeiaOrig: [], cadeiaClone: [] };
      });
      const cheia = celulas.map(() => false);
      let colocados = 0;

      // Modo forçado (página em branco): o 1º item de cada célula entra de qualquer jeito.
      if (forcar && primeiro) {
        celulas.forEach((_, i) => {
          if (filas[i].length > 0) {
            colocarAtomo(alvos[i], filas[i][0]);
            filas[i].shift();
            colocados++;
          }
        });
      }

      let progresso = true;
      while (progresso) {
        progresso = false;
        for (let i = 0; i < celulas.length; i++) {
          if (cheia[i] || filas[i].length === 0) continue;
          const desfazer = colocarAtomo(alvos[i], filas[i][0]);
          if (altura() <= limite) {
            filas[i].shift();
            colocados++;
            progresso = true;
          } else {
            desfazer();
            cheia[i] = true;
          }
        }
      }

      if (primeiro && !forcar) {
        const falhou = celulas.some((_, i) => backup[i].length > 0 && filas[i].length === backup[i].length);
        if (falhou) {
          tbody.removeChild(frag);
          if (criada) descartarTabelaRecemCriada();
          filas.forEach((_, i) => (filas[i] = backup[i].slice()));
          return false;
        }
      }

      // Nada coube numa página em branco (item maior que a página): coloca o 1º item mesmo assim.
      if (colocados === 0) {
        const i = filas.findIndex((f) => f.length > 0);
        if (i >= 0) {
          colocarAtomo(alvos[i], filas[i][0]);
          filas[i].shift();
        }
      }

      primeiro = false;
      if (filas.some((f) => f.length > 0)) novaPagina();
    }
    return true;
  }

  function adicionarLinha(tabela: Element, tr: Element) {
    if (tentarLinhaInteira(tabela, tr)) return;
    const evitar =
      tr.classList.contains("break-inside-avoid") || alturaIsolada(tabela, tr) <= limite * 0.3;
    if (!evitar && dividirLinha(tabela, tr, false)) return;
    if (!paginaVazia()) {
      novaPagina();
      if (tentarLinhaInteira(tabela, tr)) return;
    }
    dividirLinha(tabela, tr, true);
  }

  novaPagina();
  for (const filho of Array.from(original.children)) {
    if (filho.tagName === "TABLE") {
      const linhas = Array.from((filho as HTMLTableElement).rows);
      tabelaAtual = null;
      for (const tr of linhas) adicionarLinha(filho, tr);
      tabelaAtual = null;
    } else {
      adicionarBloco(filho);
    }
  }

  // Descarta página vazia (se sobrou alguma).
  for (let i = paginas.length - 1; i >= 0; i--) {
    if (paginas[i].children.length === 0) {
      paginas[i].parentNode?.removeChild(paginas[i]);
      paginas.splice(i, 1);
    }
  }

  return {
    paginas,
    limpar: () => hospedeiro.parentNode?.removeChild(hospedeiro),
  };
}
