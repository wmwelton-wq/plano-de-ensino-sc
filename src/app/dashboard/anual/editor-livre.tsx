"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { MouseEvent as MouseEventReact, PointerEvent as PointerEventReact, ReactNode } from "react";
import { MARCADOR_HTML, sanitizarHtml, valorGravadoParaHtml } from "@/lib/texto-rico";
import { FAMILIA_FONTE } from "@/lib/estilo-plano";
import { Icone } from "@/components/icones";

/**
 * Editor de texto "estilo Word" para o restante do plano anual (a partir do item 6).
 * Fonte, tamanho, negrito/itálico/sublinhado/tachado, sobrescrito/subscrito, cor da
 * letra, destaque, listas, alinhamento, espaçamento entre linhas, sombreamento,
 * bordas, símbolos, formas, figuras, imagens e tabelas.
 *
 * O conteúdo é gravado como HTML higienizado (ver lib/texto-rico.ts) e, na
 * visualização, sai igual no PDF, na impressão e no Word.
 */

interface EditorLivreProps {
  id: string;
  /** Nome do campo enviado no formulário. */
  name: string;
  valorInicial?: string | null;
  /** Linhas de "Referências oficiais" que o botão "Referências" insere no texto. */
  referencias?: string[];
  /** Grupos de frases prontas (avaliação, metodologia...) que o botão "Sugestões" insere no texto. */
  sugestoes?: { titulo: string; itens: string[] }[];
  /** Chamado com o HTML gravado sempre que o conteúdo é sincronizado (digitação, troca de passo, envio). */
  onSincronizar?: (valor: string) => void;
  /** Altura mínima da área de escrita (px). */
  alturaMinima?: number;
}

const FONTES = [
  "Arial",
  "Aptos",
  "Calibri",
  "Cambria",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Courier New",
  "Comic Sans MS",
];

const TAMANHOS_PT = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

const ESPACAMENTOS = ["1.0", "1.15", "1.5", "2.0", "2.5", "3.0"];

const PALETA = [
  "#000000", "#434343", "#666666", "#999999", "#cccccc", "#ffffff",
  "#dc2626", "#ea580c", "#f59e0b", "#16a34a", "#0d9488", "#2563eb",
  "#1e3a8a", "#7c3aed", "#c026d3", "#db2777", "#78350f", "#0f766e",
];

const PALETA_CLARA = [
  "#fef08a", "#fde68a", "#fed7aa", "#fecaca", "#fbcfe8", "#e9d5ff",
  "#bfdbfe", "#bae6fd", "#a7f3d0", "#bbf7d0", "#d9f99d", "#e2e8f0",
  "#f1f5f9", "#dbeafe", "#fff7ed", "#ecfccb", "#cffafe", "#ffffff",
];

const SIMBOLOS: { nome: string; itens: string[] }[] = [
  {
    nome: "Matemática",
    itens: "± × ÷ ≤ ≥ ≠ ≈ ≡ ∞ √ ∛ ∑ ∏ ∫ ∂ ∆ ∇ π µ ° ′ ″ ‰ ² ³ ¹ ½ ¼ ¾ ⅓ ⅔ ⅛ ∈ ∉ ⊂ ⊃ ⊆ ∪ ∩ ∅ ∴ ∵ ∠ ⊥ ∥ ∝ ∀ ∃ ¬ ∧ ∨ % ‰ ℕ ℤ ℚ ℝ ℂ".split(" "),
  },
  {
    nome: "Letras gregas",
    itens: "α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω Α Β Γ Δ Ε Θ Λ Ξ Π Σ Φ Ψ Ω".split(" "),
  },
  {
    nome: "Química/Física",
    itens: "₀ ₁ ₂ ₃ ₄ ₅ ₆ ₇ ₈ ₉ ⁰ ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ⁺ ⁻ ₊ ₋ → ← ⇌ ⇄ ⇒ ⇔ ↑ ↓ ° Å ℃ ℉ Ω µ ħ ℓ".split(" "),
  },
  {
    nome: "Setas",
    itens: "→ ← ↑ ↓ ↔ ↕ ↗ ↘ ↙ ↖ ⇒ ⇐ ⇑ ⇓ ⇔ ➜ ➔ ➤ ➡ ⬅ ⬆ ⬇ ↩ ↪ ↺ ↻ ⟲ ⟳".split(" "),
  },
  {
    nome: "Texto",
    itens: "§ ¶ © ® ™ € £ ¥ ¢ • ‣ ◦ – — … « » ¿ ¡ ª º № † ‡ ✓ ✔ ✗ ✘ ☑ ☒ ☐ ✚ ✱ ✦ ✧ ❖".split(" "),
  },
];

const FORMAS = "■ □ ▪ ▫ ▬ ▭ ▮ ▯ ▲ △ ▴ ▵ ▼ ▽ ◀ ▶ ◄ ► ◆ ◇ ◈ ● ○ ◉ ◎ ◐ ◑ ◒ ◓ ◖ ◗ ⬛ ⬜ ⬟ ⬠ ⬡ ⬢ ⭕ ★ ☆ ✪ ✯ ✶ ✷ ✸ ❂ ♥ ♡ ♦ ♣ ♠ ☀ ☁ ☂ ☃ ☾ ♪ ♫ ⚑ ⚐ ⚙ ⚖ ⚠ ♻ ✿ ❀ ❁ ✂ ✎ ✏ ✒ ✉ ☎ ☺ ☹ ⌛ ⌚ ➕ ➖ ✖ ➗".split(" ");

const FIGURAS =
  "📚 📖 📝 ✏️ 📓 🔬 🧪 🧫 🧬 🔭 🌎 🌍 🌱 🌳 🌊 ♻️ 💧 🔥 ⚡ 🧲 💡 🎯 🏆 🥇 ⭐ 🧮 📐 📏 🖥️ 💻 📱 🔍 📊 📈 📉 🗓️ ⏰ ✅ ❌ ⚠️ ❓ ❗ 👩‍🏫 👨‍🏫 🎓 🏫 🎨 🎭 🎵 🎬 📷 ⚽ 🏃 🚴 🏊 🍎 🥗 ❤️ 😀 👍 🙌 👏 🧠 🤝 💬 📌 📎 🔔 🌈 ☀️ 🌙 🗺️ 🏛️ ⚖️ 🕊️".split(
    " "
  );

const botao =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-primary-300 bg-white px-2.5 text-sm font-semibold text-primary-900 shadow-sm transition hover:border-primary-500 hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-40";
const botaoAtivo = "!border-primary-600 !bg-primary-100 !text-primary-800";

const MAX_CARACTERES = 3_300_000;

function escaparHtml(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const BLOCOS = new Set(["P", "DIV", "LI", "H1", "H2", "H3", "BLOCKQUOTE", "TD", "TH"]);

/** Reduz a imagem (largura máx. 1100 px) para caber no plano sem pesar. */
async function comprimirImagem(arquivo: File): Promise<string> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("imagem"));
      img.src = url;
    });
    const larguraMax = 1100;
    const escala = Math.min(1, larguraMax / (img.naturalWidth || larguraMax));
    const w = Math.max(1, Math.round(img.naturalWidth * escala));
    const h = Math.max(1, Math.round(img.naturalHeight * escala));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    // PNG pequeno (logos, desenhos) continua PNG; fotos viram JPEG leve.
    const manterPng = arquivo.type === "image/png" && arquivo.size < 350_000;
    if (!manterPng) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    if (manterPng) return canvas.toDataURL("image/png");
    let qualidade = 0.82;
    let dados = canvas.toDataURL("image/jpeg", qualidade);
    while (dados.length > 900_000 && qualidade > 0.45) {
      qualidade -= 0.1;
      dados = canvas.toDataURL("image/jpeg", qualidade);
    }
    return dados;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Os botões não podem tirar o foco/seleção da área de escrita. */
const manterSelecao = (e: MouseEventReact) => e.preventDefault();

function B({
  titulo,
  onClick,
  children,
  ativo,
  className = "",
}: {
  titulo: string;
  onClick: () => void;
  children: ReactNode;
  ativo?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onMouseDown={manterSelecao}
      onClick={onClick}
      className={`${botao} ${ativo ? botaoAtivo : ""} ${className}`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 h-6 w-px bg-primary-200" aria-hidden="true" />;
}

export default function EditorLivre({ id, name, valorInicial, referencias = [], sugestoes = [], onSincronizar, alturaMinima }: EditorLivreProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);
  const rangeSalvo = useRef<Range | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tamanhoPendente = useRef<number | null>(null);
  const idFonte = useId();
  const idTamanho = useId();
  const idEspaco = useId();
  const idEstilo = useId();

  const [htmlInicial] = useState(() => valorGravadoParaHtml(valorInicial, false));
  // O mesmo objeto em toda renderização: se for um objeto novo, o React reescreve o conteúdo da área e apaga o que foi digitado.
  const htmlProp = useMemo(() => ({ __html: htmlInicial }), [htmlInicial]);
  const [painel, setPainel] = useState<null | "cor" | "destaque" | "sombra" | "simbolos" | "formas" | "figuras" | "tabela" | "sugestoes">(null);
  const [aba, setAba] = useState(0);
  const [naTabela, setNaTabela] = useState(false);
  const [imagem, setImagem] = useState<HTMLImageElement | null>(null);
  const [linhasTabela, setLinhasTabela] = useState(3);
  const [colunasTabela, setColunasTabela] = useState(3);
  const [aviso, setAviso] = useState<string | null>(null);
  const [tamanhoAtual, setTamanhoAtual] = useState(0);
  const caixaRef = useRef<HTMLDivElement>(null);
  const [retImg, setRetImg] = useState<{ l: number; t: number; w: number; h: number } | null>(null);

  /** Posição da imagem escolhida, para desenhar a moldura e a alça de arrastar. */
  const medirImagem = useCallback(() => {
    const caixa = caixaRef.current;
    if (!imagem || !caixa || !imagem.isConnected) {
      setRetImg(null);
      return;
    }
    const c = caixa.getBoundingClientRect();
    const r = imagem.getBoundingClientRect();
    setRetImg({ l: r.left - c.left, t: r.top - c.top, w: r.width, h: r.height });
  }, [imagem]);

  useEffect(() => {
    medirImagem();
    const area = areaRef.current;
    area?.addEventListener("scroll", medirImagem);
    window.addEventListener("resize", medirImagem);
    return () => {
      area?.removeEventListener("scroll", medirImagem);
      window.removeEventListener("resize", medirImagem);
    };
  }, [medirImagem, tamanhoAtual]);

  /** Grava no campo escondido o HTML higienizado do que está na área. */
  const aoSincronizar = useRef(onSincronizar);
  aoSincronizar.current = onSincronizar;

  const sincronizar = useCallback(() => {
    const area = areaRef.current;
    const campo = campoRef.current;
    if (!area || !campo) return;
    if (tamanhoPendente.current) {
      area.querySelectorAll<HTMLElement>('span[style*="xxx-large"]').forEach((s) => {
        s.style.fontSize = `${tamanhoPendente.current}pt`;
      });
    }
    const visual = (area.textContent ?? "").trim().length > 0 || area.querySelector("li,img,table") !== null;
    if (!visual) {
      campo.value = "";
      setTamanhoAtual(0);
      if (area.innerHTML !== "") area.innerHTML = "";
      aoSincronizar.current?.("");
      return;
    }
    const valor = MARCADOR_HTML + sanitizarHtml(area.innerHTML);
    campo.value = valor;
    setTamanhoAtual(valor.length);
    aoSincronizar.current?.(valor);
  }, []);

  const agendarSincronizacao = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(sincronizar, 350);
  }, [sincronizar]);

  // Valor inicial no campo + sincroniza ao enviar o formulário (mesmo que o professor não tenha clicado fora).
  useEffect(() => {
    const campo = campoRef.current;
    if (campo) {
      campo.value = htmlInicial ? MARCADOR_HTML + htmlInicial : "";
      setTamanhoAtual(campo.value.length);
    }
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      /* navegador sem suporte: segue com o padrão */
    }
    const form = campo?.closest("form");
    const aoEnviar = () => {
      if (temporizador.current) clearTimeout(temporizador.current);
      sincronizar();
    };
    form?.addEventListener("submit", aoEnviar, true);
    // O formulário avisa antes de trocar de passo, para nada do que foi digitado ficar para trás.
    form?.addEventListener("plano:sincronizar", aoEnviar);
    return () => {
      form?.removeEventListener("submit", aoEnviar, true);
      form?.removeEventListener("plano:sincronizar", aoEnviar);
    };
  }, [htmlInicial, sincronizar]);

  // Guarda a seleção para os botões/menus funcionarem mesmo depois de o foco sair da área.
  useEffect(() => {
    function aoMudarSelecao() {
      const area = areaRef.current;
      const sel = window.getSelection();
      if (!area || !sel || sel.rangeCount === 0) return;
      const r = sel.getRangeAt(0);
      if (!area.contains(r.commonAncestorContainer)) return;
      rangeSalvo.current = r.cloneRange();
      const no = r.startContainer.nodeType === 1 ? (r.startContainer as Element) : r.startContainer.parentElement;
      setNaTabela(!!no?.closest("td,th") && area.contains(no));
    }
    document.addEventListener("selectionchange", aoMudarSelecao);
    return () => document.removeEventListener("selectionchange", aoMudarSelecao);
  }, []);

  function restaurar() {
    const area = areaRef.current;
    if (!area) return false;
    area.focus();
    const sel = window.getSelection();
    if (sel && rangeSalvo.current && area.contains(rangeSalvo.current.commonAncestorContainer)) {
      sel.removeAllRanges();
      sel.addRange(rangeSalvo.current);
    }
    return true;
  }

  function comando(nome: string, valor?: string) {
    if (!restaurar()) return;
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(nome, false, valor);
    sincronizar();
  }

  function aplicarTamanho(pt: number) {
    if (!restaurar()) return;
    const area = areaRef.current!;
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("fontSize", false, "7");
    let achou = false;
    area.querySelectorAll<HTMLElement>('span[style*="xxx-large"]').forEach((s) => {
      s.style.fontSize = `${pt}pt`;
      achou = true;
    });
    tamanhoPendente.current = achou ? null : pt;
    sincronizar();
  }

  /** Aumenta/diminui o tamanho da seleção em 1 degrau da lista. */
  function degrau(direcao: 1 | -1) {
    const sel = window.getSelection();
    const no = rangeSalvo.current?.startContainer ?? sel?.anchorNode ?? null;
    const el = no && (no.nodeType === 1 ? (no as Element) : no.parentElement);
    const atualPx = el ? parseFloat(getComputedStyle(el).fontSize) : 14;
    const atualPt = Math.round(atualPx * 0.75 * 2) / 2;
    const i = TAMANHOS_PT.findIndex((t) => t >= atualPt);
    const base = i < 0 ? TAMANHOS_PT.length - 1 : TAMANHOS_PT[i] === atualPt ? i : direcao === 1 ? i - 1 : i;
    const novo = TAMANHOS_PT[Math.min(TAMANHOS_PT.length - 1, Math.max(0, base + direcao))];
    aplicarTamanho(novo);
  }

  /** Blocos (parágrafo, item de lista, célula...) tocados pela seleção. */
  function blocosDaSelecao(): HTMLElement[] {
    const area = areaRef.current;
    if (!area || !restaurar()) return [];
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return [];
    const range = sel.getRangeAt(0);

    const blocoDe = (n: Node | null): HTMLElement | null => {
      let e: Node | null = n;
      while (e && e !== area) {
        if (e.nodeType === 1 && BLOCOS.has((e as Element).tagName)) return e as HTMLElement;
        e = e.parentNode;
      }
      return null;
    };

    let inicio = blocoDe(range.startContainer);
    if (!inicio) {
      // Texto solto dentro da área: transforma em parágrafo antes.
      document.execCommand("formatBlock", false, "p");
      const sel2 = window.getSelection();
      inicio = blocoDe(sel2?.anchorNode ?? null);
    }
    const achados = new Set<HTMLElement>();
    if (inicio) achados.add(inicio);
    if (!range.collapsed) {
      const andador = document.createTreeWalker(area, NodeFilter.SHOW_TEXT);
      while (andador.nextNode()) {
        const no = andador.currentNode;
        if (range.intersectsNode(no) && (no.textContent ?? "").trim() !== "") {
          const b = blocoDe(no);
          if (b) achados.add(b);
        }
      }
      // Seleção que pega só imagens/tabelas sem texto: usa os blocos de início e fim.
      const fim = blocoDe(range.endContainer);
      if (fim) achados.add(fim);
    }
    return Array.from(achados);
  }

  function estilizarBlocos(fn: (b: HTMLElement) => void) {
    const blocos = blocosDaSelecao();
    if (blocos.length === 0) return;
    blocos.forEach(fn);
    sincronizar();
  }

  function espacamento(valor: string) {
    estilizarBlocos((b) => {
      b.style.lineHeight = valor;
    });
  }

  function recuoPrimeiraLinha() {
    estilizarBlocos((b) => {
      b.style.textIndent = b.style.textIndent ? "" : "47px";
    });
  }

  function sombrearParagrafo(cor: string) {
    estilizarBlocos((b) => {
      b.style.backgroundColor = cor === "#ffffff" || cor === "" ? "" : cor;
    });
  }

  function bordaParagrafo(tipo: "caixa" | "baixo" | "nenhuma") {
    estilizarBlocos((b) => {
      b.style.border = "";
      if (tipo === "caixa") {
        b.style.border = "1px solid #000000";
        b.style.padding = "4px";
      } else if (tipo === "baixo") {
        b.style.borderBottom = "1px solid #000000";
        b.style.padding = "";
      } else {
        b.style.padding = "";
      }
    });
  }

  function maiusculasMinusculas(modo: "maiusculas" | "minusculas") {
    const area = areaRef.current;
    if (!restaurar() || !area) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const andador = document.createTreeWalker(area, NodeFilter.SHOW_TEXT);
    const nos: Text[] = [];
    while (andador.nextNode()) {
      const no = andador.currentNode as Text;
      if (range.intersectsNode(no)) nos.push(no);
    }
    const conv = (s: string) => (modo === "maiusculas" ? s.toUpperCase() : s.toLowerCase());
    const { startContainer, startOffset, endContainer, endOffset } = range;
    for (const no of nos) {
      const ini = no === startContainer ? startOffset : 0;
      const fim = no === endContainer ? endOffset : no.data.length;
      no.data = no.data.slice(0, ini) + conv(no.data.slice(ini, fim)) + no.data.slice(fim);
    }
    sincronizar();
  }

  function sombraNoTexto() {
    const area = areaRef.current;
    if (!restaurar() || !area) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setAviso("Selecione o texto que receberá a sombra.");
      return;
    }
    const range = sel.getRangeAt(0);
    const pai = range.commonAncestorContainer.nodeType === 1 ? (range.commonAncestorContainer as Element) : range.commonAncestorContainer.parentElement;
    if (!pai || BLOCOS.has(pai.tagName) === false && pai === area) {
      setAviso("Para a sombra, selecione texto dentro de um único parágrafo.");
      return;
    }
    const div = document.createElement("div");
    div.appendChild(range.cloneContents());
    if (div.querySelector("p,div,li,table,ul,ol,h1,h2,h3")) {
      setAviso("Para a sombra, selecione texto dentro de um único parágrafo.");
      return;
    }
    document.execCommand(
      "insertHTML",
      false,
      `<span style="text-shadow: 1px 1px 2px #64748b">${div.innerHTML}</span>`
    );
    sincronizar();
  }

  function inserirTexto(t: string) {
    if (!restaurar()) return;
    document.execCommand("insertText", false, t);
    sincronizar();
  }

  function inserirHtml(html: string) {
    if (!restaurar()) return;
    document.execCommand("insertHTML", false, sanitizarHtml(html));
    sincronizar();
  }

  function inserirTabela() {
    const l = Math.min(30, Math.max(1, linhasTabela));
    const c = Math.min(10, Math.max(1, colunasTabela));
    const larg = Math.floor((100 / c) * 100) / 100;
    const celula = `<td style="border: 1px solid #000000; padding: 4px; width: ${larg}%; vertical-align: top"><br></td>`;
    const linha = `<tr>${celula.repeat(c)}</tr>`;
    const html = `<table style="border-collapse: collapse; width: 100%; table-layout: fixed"><tbody>${linha.repeat(l)}</tbody></table><p><br></p>`;
    inserirHtml(html);
    setPainel(null);
  }

  function celulaAtual(): HTMLTableCellElement | null {
    const area = areaRef.current;
    const r = rangeSalvo.current;
    if (!area || !r) return null;
    const no = r.startContainer.nodeType === 1 ? (r.startContainer as Element) : r.startContainer.parentElement;
    const td = no?.closest("td,th") as HTMLTableCellElement | null;
    return td && area.contains(td) ? td : null;
  }

  function reequilibrarColunas(tabela: HTMLTableElement) {
    const n = tabela.rows[0]?.cells.length ?? 0;
    if (n === 0) return;
    const larg = Math.floor((100 / n) * 100) / 100;
    Array.from(tabela.rows).forEach((tr) =>
      Array.from(tr.cells).forEach((td) => {
        td.style.width = `${larg}%`;
      })
    );
  }

  function novaCelulaComo(modelo: HTMLTableCellElement): HTMLTableCellElement {
    const td = document.createElement("td");
    td.setAttribute("style", modelo.getAttribute("style") ?? "");
    td.style.backgroundColor = "";
    td.innerHTML = "<br>";
    return td;
  }

  function tabelaAcao(acao: "linhaAcima" | "linhaAbaixo" | "colEsq" | "colDir" | "delLinha" | "delCol" | "delTabela") {
    const td = celulaAtual();
    const tr = td?.parentElement as HTMLTableRowElement | null;
    const tabela = td?.closest("table") as HTMLTableElement | null;
    if (!td || !tr || !tabela) return;
    const col = td.cellIndex;

    if (acao === "linhaAcima" || acao === "linhaAbaixo") {
      const nova = document.createElement("tr");
      Array.from(tr.cells).forEach((c) => nova.appendChild(novaCelulaComo(c)));
      tr.parentElement!.insertBefore(nova, acao === "linhaAcima" ? tr : tr.nextSibling);
    } else if (acao === "colEsq" || acao === "colDir") {
      Array.from(tabela.rows).forEach((linha) => {
        const ref = linha.cells[Math.min(col, linha.cells.length - 1)];
        if (!ref) return;
        const nova = novaCelulaComo(ref);
        linha.insertBefore(nova, acao === "colEsq" ? ref : ref.nextSibling);
      });
      reequilibrarColunas(tabela);
    } else if (acao === "delLinha") {
      if (tabela.rows.length <= 1) tabela.remove();
      else tr.remove();
    } else if (acao === "delCol") {
      if ((tabela.rows[0]?.cells.length ?? 0) <= 1) tabela.remove();
      else {
        Array.from(tabela.rows).forEach((linha) => linha.cells[col]?.remove());
        reequilibrarColunas(tabela);
      }
    } else if (acao === "delTabela") {
      tabela.remove();
    }
    sincronizar();
  }

  function sombrearCelula(cor: string) {
    const td = celulaAtual();
    if (!td) return;
    td.style.backgroundColor = cor === "#ffffff" ? "" : cor;
    sincronizar();
  }

  function bordasTabela(com: boolean) {
    const td = celulaAtual();
    const tabela = td?.closest("table");
    if (!tabela) return;
    tabela.querySelectorAll<HTMLElement>("td,th").forEach((c) => {
      c.style.border = com ? "1px solid #000000" : "none";
    });
    sincronizar();
  }

  function alinharCelula(v: "top" | "middle" | "bottom") {
    const td = celulaAtual();
    if (!td) return;
    td.style.verticalAlign = v;
    sincronizar();
  }

  async function inserirImagem(arquivo: File) {
    if (!arquivo.type.startsWith("image/")) {
      setAviso("Esse arquivo não é uma imagem.");
      return;
    }
    try {
      setAviso("Preparando a imagem...");
      const dados = await comprimirImagem(arquivo);
      if (!restaurar()) return;
      document.execCommand("insertHTML", false, `<img src="${dados}" style="max-width: 100%">`);
      sincronizar();
      setAviso(null);
    } catch {
      setAviso("Não foi possível inserir essa imagem. Tente outra (JPG ou PNG).");
    }
  }

  function larguraImagem(pct: number | "auto") {
    if (!imagem) return;
    if (pct === "auto") {
      imagem.style.width = "";
      imagem.style.maxWidth = "100%";
    } else {
      imagem.style.width = `${pct}%`;
    }
    imagem.style.height = "";
    sincronizar();
  }

  function removerImagem() {
    imagem?.remove();
    setImagem(null);
    sincronizar();
  }

  /** Largura útil da área de escrita (sem as margens internas). */
  function larguraUtilArea(): number {
    const area = areaRef.current;
    if (!area) return 600;
    const cs = getComputedStyle(area);
    return area.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
  }

  function aumentarImagem(fator: number) {
    if (!imagem) return;
    const w = Math.max(24, Math.min(larguraUtilArea(), imagem.getBoundingClientRect().width * fator));
    imagem.style.width = `${Math.round(w)}px`;
    imagem.style.height = "";
    imagem.style.maxWidth = "100%";
    sincronizar();
    medirImagem();
  }

  /** Arrastar a alça no canto da imagem muda o tamanho (mantendo a proporção). */
  function arrastarAlcaImagem(e: PointerEventReact) {
    const img = imagem;
    if (!img) return;
    e.preventDefault();
    e.stopPropagation();
    const x0 = e.clientX;
    const w0 = img.getBoundingClientRect().width;
    const max = larguraUtilArea();
    const mover = (ev: PointerEvent) => {
      const w = Math.max(24, Math.min(max, w0 + (ev.clientX - x0)));
      img.style.width = `${Math.round(w)}px`;
      img.style.height = "";
      img.style.maxWidth = "100%";
      medirImagem();
    };
    const soltar = () => {
      document.removeEventListener("pointermove", mover);
      document.removeEventListener("pointerup", soltar);
      sincronizar();
      medirImagem();
    };
    document.addEventListener("pointermove", mover);
    document.addEventListener("pointerup", soltar);
  }

  // ── Tabelas: arrastar as bordas e ajustar todas as linhas de uma vez ──
  type BordaTabela = { tipo: "col" | "lin"; td: HTMLTableCellElement };

  function bordaPerto(e: { clientX: number; clientY: number; target: EventTarget }): BordaTabela | null {
    const area = areaRef.current;
    const alvo = e.target as HTMLElement;
    const td = alvo.closest?.("td,th") as HTMLTableCellElement | null;
    if (!td || !area || !area.contains(td)) return null;
    const r = td.getBoundingClientRect();
    const T = 6;
    if (Math.abs(e.clientX - r.right) <= T) return { tipo: "col", td };
    if (Math.abs(e.clientX - r.left) <= T && td.previousElementSibling) {
      return { tipo: "col", td: td.previousElementSibling as HTMLTableCellElement };
    }
    if (Math.abs(e.clientY - r.bottom) <= T) return { tipo: "lin", td };
    const tr = td.parentElement as HTMLTableRowElement | null;
    if (Math.abs(e.clientY - r.top) <= T && tr?.previousElementSibling) {
      return { tipo: "lin", td: (tr.previousElementSibling as HTMLTableRowElement).cells[0] };
    }
    return null;
  }

  /** Congela as larguras atuais das colunas em porcentagem (para poder arrastar com precisão). */
  function fixarLarguras(tabela: HTMLTableElement) {
    const tw = tabela.getBoundingClientRect().width || 1;
    Array.from(tabela.rows).forEach((tr) =>
      Array.from(tr.cells).forEach((c) => {
        c.style.width = `${Math.round((c.getBoundingClientRect().width / tw) * 1000) / 10}%`;
      })
    );
  }

  function aplicarAlturaLinha(tr: HTMLTableRowElement, h: number) {
    const v = `${Math.round(Math.max(18, h))}px`;
    tr.style.height = v;
    Array.from(tr.cells).forEach((c) => {
      c.style.height = v;
    });
  }

  function arrastarBordaTabela(e: PointerEventReact, b: BordaTabela) {
    const tabela = b.td.closest("table") as HTMLTableElement | null;
    if (!tabela) return;
    e.preventDefault();
    const x0 = e.clientX;
    const y0 = e.clientY;

    if (b.tipo === "lin") {
      const tr = b.td.parentElement as HTMLTableRowElement;
      const h0 = tr.getBoundingClientRect().height;
      const mover = (ev: PointerEvent) => aplicarAlturaLinha(tr, h0 + (ev.clientY - y0));
      const soltar = () => {
        document.removeEventListener("pointermove", mover);
        document.removeEventListener("pointerup", soltar);
        sincronizar();
      };
      document.addEventListener("pointermove", mover);
      document.addEventListener("pointerup", soltar);
      return;
    }

    const tw0 = tabela.getBoundingClientRect().width || 1;
    const idx = b.td.cellIndex;
    const ultima = idx >= (tabela.rows[0]?.cells.length ?? 1) - 1;
    fixarLarguras(tabela);
    const esq0 = parseFloat(b.td.style.width) || 20;
    const dir0 = ultima ? 0 : parseFloat((b.td.nextElementSibling as HTMLElement | null)?.style.width ?? "") || 20;
    const util = larguraUtilArea();
    const mover = (ev: PointerEvent) => {
      const dx = ev.clientX - x0;
      if (ultima) {
        const novo = Math.max(80, Math.min(util, tw0 + dx));
        tabela.style.width = `${Math.round((novo / util) * 1000) / 10}%`;
        return;
      }
      const d = (dx / tw0) * 100;
      const dd = Math.max(-(esq0 - 4), Math.min(dir0 - 4, d));
      Array.from(tabela.rows).forEach((tr) => {
        const a = tr.cells[idx];
        const c = tr.cells[idx + 1];
        if (a) a.style.width = `${Math.round((esq0 + dd) * 10) / 10}%`;
        if (c) c.style.width = `${Math.round((dir0 - dd) * 10) / 10}%`;
      });
    };
    const soltar = () => {
      document.removeEventListener("pointermove", mover);
      document.removeEventListener("pointerup", soltar);
      sincronizar();
    };
    document.addEventListener("pointermove", mover);
    document.addEventListener("pointerup", soltar);
  }

  function alturaTodasLinhas(delta: number) {
    const tabela = celulaAtual()?.closest("table") as HTMLTableElement | null;
    if (!tabela) return;
    Array.from(tabela.rows).forEach((tr) => aplicarAlturaLinha(tr, tr.getBoundingClientRect().height + delta));
    sincronizar();
  }

  function larguraTabela(deltaPct: number) {
    const tabela = celulaAtual()?.closest("table") as HTMLTableElement | null;
    if (!tabela) return;
    const atual = (tabela.getBoundingClientRect().width / larguraUtilArea()) * 100;
    tabela.style.width = `${Math.round(Math.max(20, Math.min(100, atual + deltaPct)))}%`;
    sincronizar();
  }

  function colunasIguais() {
    const tabela = celulaAtual()?.closest("table") as HTMLTableElement | null;
    if (!tabela) return;
    reequilibrarColunas(tabela);
    sincronizar();
  }

  function inserirReferencias() {
    if (referencias.length === 0) return;
    const titulo = `<p style="text-align: left"><b><u>Referências bibliográficas</u></b></p>`;
    const html = titulo + referencias.map((r) => `<p style="text-align: justify">${escaparHtml(r)}</p>`).join("");
    inserirHtml(html);
  }

  function inserirSugestoes(itens: string[]) {
    if (itens.length === 0) return;
    inserirHtml(itens.map((t) => `<p style="text-align: justify">${escaparHtml(t)}</p>`).join(""));
  }

  const abrir = (p: typeof painel) => setPainel((atual) => (atual === p ? null : p));

  const selectCls = "h-8 rounded-md border border-primary-200 bg-white px-1.5 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

  const grade = (itens: string[], aoClicar: (s: string) => void, titulo: string) => (
    <div className="flex flex-wrap gap-1" role="group" aria-label={titulo}>
      {itens.map((s, i) => (
        <button
          key={`${s}-${i}`}
          type="button"
          onMouseDown={manterSelecao}
          onClick={() => aoClicar(s)}
          className="flex h-9 min-w-9 items-center justify-center rounded-md border border-primary-100 bg-white px-1.5 text-lg hover:border-primary-400 hover:bg-primary-50"
        >
          {s}
        </button>
      ))}
    </div>
  );

  const paleta = (cores: string[], aoClicar: (c: string) => void, titulo: string, extra?: ReactNode) => (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={titulo}>
      {cores.map((c) => (
        <button
          key={c}
          type="button"
          title={c}
          aria-label={`${titulo}: ${c}`}
          onMouseDown={manterSelecao}
          onClick={() => aoClicar(c)}
          className="h-7 w-7 rounded border border-slate-300 hover:scale-110"
          style={{ backgroundColor: c }}
        />
      ))}
      <label className="ml-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        Outra cor:
        <input
          type="color"
          onChange={(e) => aoClicar(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border border-slate-300 bg-white"
          aria-label={`${titulo}: escolher outra cor`}
        />
      </label>
      {extra}
    </div>
  );

  const excedeu = tamanhoAtual > MAX_CARACTERES;

  return (
    <div ref={caixaRef} className="relative rounded-xl border border-primary-300 bg-white shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/25">
      <div role="toolbar" aria-label="Formatação do texto" className="space-y-1 rounded-t-xl border-b border-primary-200 bg-slate-50 px-2 py-2">
        {/* ── Fonte ── */}
        <div className="flex flex-wrap items-center gap-1">
          <B titulo="Desfazer (Ctrl+Z)" onClick={() => comando("undo")}>↶</B>
          <B titulo="Refazer (Ctrl+Y)" onClick={() => comando("redo")}>↷</B>
          <Sep />
          <label className="sr-only" htmlFor={idEstilo}>Estilo do parágrafo</label>
          <select
            id={idEstilo}
            defaultValue=""
            title="Estilo do parágrafo"
            className={selectCls}
            onChange={(e) => {
              if (e.target.value) comando("formatBlock", e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">Estilo</option>
            <option value="p">Normal</option>
            <option value="h1">Título 1</option>
            <option value="h2">Título 2</option>
            <option value="h3">Título 3</option>
          </select>
          <label className="sr-only" htmlFor={idFonte}>Fonte</label>
          <select
            id={idFonte}
            defaultValue=""
            title="Tipo de letra (fonte)"
            className={`${selectCls} w-36`}
            onChange={(e) => {
              if (e.target.value) comando("fontName", e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">Fonte</option>
            {FONTES.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor={idTamanho}>Tamanho da letra</label>
          <select
            id={idTamanho}
            defaultValue=""
            title="Tamanho da letra (em pontos)"
            className={`${selectCls} w-20`}
            onChange={(e) => {
              if (e.target.value) aplicarTamanho(Number(e.target.value));
              e.target.value = "";
            }}
          >
            <option value="">Tam.</option>
            {TAMANHOS_PT.map((t) => (
              <option key={t} value={t}>
                {String(t).replace(".", ",")}
              </option>
            ))}
          </select>
          <B titulo="Aumentar a letra" onClick={() => degrau(1)}>A▲</B>
          <B titulo="Diminuir a letra" onClick={() => degrau(-1)}>A▼</B>
          <Sep />
          <B titulo="Negrito (Ctrl+B)" onClick={() => comando("bold")} className="font-bold">N</B>
          <B titulo="Itálico (Ctrl+I)" onClick={() => comando("italic")} className="italic">I</B>
          <B titulo="Sublinhado (Ctrl+U)" onClick={() => comando("underline")} className="underline">S</B>
          <B titulo="Tachado" onClick={() => comando("strikeThrough")} className="line-through">ab</B>
          <B titulo="Subscrito (ex.: H₂O)" onClick={() => comando("subscript")}>x₂</B>
          <B titulo="Sobrescrito (ex.: m²)" onClick={() => comando("superscript")}>x²</B>
          <Sep />
          <B titulo="Transformar a seleção em MAIÚSCULAS" onClick={() => maiusculasMinusculas("maiusculas")}>AA</B>
          <B titulo="Transformar a seleção em minúsculas" onClick={() => maiusculasMinusculas("minusculas")}>aa</B>
          <B titulo="Efeito de texto: sombra" onClick={sombraNoTexto}>
            <span style={{ textShadow: "1px 1px 2px #64748b" }}>Efeito</span>
          </B>
          <B titulo="Cor da letra" onClick={() => abrir("cor")} ativo={painel === "cor"}>
            <span className="flex flex-col items-center leading-none">
              <span className="font-bold">A</span>
              <span className="mt-0.5 h-1 w-4 rounded bg-red-600" />
            </span>
          </B>
          <B titulo="Cor de destaque (marca-texto)" onClick={() => abrir("destaque")} ativo={painel === "destaque"}>
            <span className="flex flex-col items-center leading-none">
              <span>✎</span>
              <span className="mt-0.5 h-1 w-4 rounded bg-yellow-300" />
            </span>
          </B>
          <B titulo="Limpar toda a formatação da seleção" onClick={() => comando("removeFormat")}>Limpar</B>
        </div>

        {/* ── Parágrafo ── */}
        <div className="flex flex-wrap items-center gap-1">
          <B titulo="Lista com marcadores" onClick={() => comando("insertUnorderedList")}>• Lista</B>
          <B titulo="Lista numerada" onClick={() => comando("insertOrderedList")}>1. Lista</B>
          <B titulo="Diminuir recuo" onClick={() => comando("outdent")}>⇤</B>
          <B titulo="Aumentar recuo" onClick={() => comando("indent")}>⇥</B>
          <B titulo="Recuo da primeira linha" onClick={recuoPrimeiraLinha}>↦ 1ª linha</B>
          <Sep />
          <B titulo="Alinhar à esquerda" onClick={() => comando("justifyLeft")}>⯇≡</B>
          <B titulo="Centralizar" onClick={() => comando("justifyCenter")}>≡</B>
          <B titulo="Alinhar à direita" onClick={() => comando("justifyRight")}>≡⯈</B>
          <B titulo="Justificar" onClick={() => comando("justifyFull")}>☰</B>
          <label className="sr-only" htmlFor={idEspaco}>Espaçamento entre linhas</label>
          <select
            id={idEspaco}
            defaultValue=""
            title="Espaçamento entre linhas"
            className={`${selectCls} w-28`}
            onChange={(e) => {
              if (e.target.value) espacamento(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">Entrelinhas</option>
            {ESPACAMENTOS.map((e) => (
              <option key={e} value={e}>
                {e.replace(".", ",")}
              </option>
            ))}
          </select>
          <Sep />
          <B titulo="Sombreamento do parágrafo (cor de fundo)" onClick={() => abrir("sombra")} ativo={painel === "sombra"}>
            Sombreado
          </B>
          <B titulo="Borda em volta do parágrafo" onClick={() => bordaParagrafo("caixa")}>▢ Borda</B>
          <B titulo="Linha embaixo do parágrafo" onClick={() => bordaParagrafo("baixo")}>▁ Linha</B>
          <B titulo="Tirar a borda do parágrafo" onClick={() => bordaParagrafo("nenhuma")}>Sem borda</B>
        </div>

        {/* ── Inserir ── */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="px-1 text-xs font-bold uppercase tracking-wide text-primary-700">Inserir:</span>
          <B titulo="Tabela" onClick={() => abrir("tabela")} ativo={painel === "tabela"}>▦ Tabela</B>
          <B titulo="Imagem do seu computador" onClick={() => arquivoRef.current?.click()}>🖼 Imagem</B>
          <B titulo="Símbolos (matemática, química, setas...)" onClick={() => abrir("simbolos")} ativo={painel === "simbolos"}>Ω Símbolos</B>
          <B titulo="Formas geométricas" onClick={() => abrir("formas")} ativo={painel === "formas"}>◆ Formas</B>
          <B titulo="Figuras (ícones e emojis)" onClick={() => abrir("figuras")} ativo={painel === "figuras"}>☺ Figuras</B>
          {sugestoes.length > 0 && (
            <B titulo="Frases prontas de avaliação e metodologia, montadas com o que você marcou" onClick={() => abrir("sugestoes")} ativo={painel === "sugestoes"}>
              <span className="inline-flex items-center gap-1"><Icone nome="lampada" className="h-4 w-4" /> Sugestões</span>
            </B>
          )}
          {referencias.length > 0 && (
            <B titulo="Inserir o título “Referências bibliográficas” e as referências oficiais (BNCC, Currículo Base, portarias...) no ponto do cursor" onClick={inserirReferencias}>
              <span className="inline-flex items-center gap-1"><Icone nome="livro" className="h-4 w-4" /> Referências bibliográficas</span>
            </B>
          )}
          <input
            ref={arquivoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void inserirImagem(f);
              e.target.value = "";
            }}
          />
        </div>

        {/* ── Painéis ── */}
        {painel === "cor" && (
          <div className="rounded-lg border border-primary-200 bg-white p-2">
            {paleta(PALETA, (c) => { comando("foreColor", c); }, "Cor da letra")}
          </div>
        )}
        {painel === "destaque" && (
          <div className="rounded-lg border border-primary-200 bg-white p-2">
            {paleta(
              PALETA_CLARA,
              (c) => { comando("hiliteColor", c); },
              "Destaque",
              <button type="button" onMouseDown={manterSelecao} onClick={() => comando("hiliteColor", "transparent")} className="btn-azul-suave !px-3 !py-1 !text-xs">
                Sem destaque
              </button>
            )}
          </div>
        )}
        {painel === "sombra" && (
          <div className="rounded-lg border border-primary-200 bg-white p-2">
            {paleta(
              PALETA_CLARA,
              sombrearParagrafo,
              "Sombreamento",
              <button type="button" onMouseDown={manterSelecao} onClick={() => sombrearParagrafo("")} className="btn-azul-suave !px-3 !py-1 !text-xs">
                Sem sombreamento
              </button>
            )}
          </div>
        )}
        {painel === "simbolos" && (
          <div className="space-y-2 rounded-lg border border-primary-200 bg-white p-2">
            <div className="flex flex-wrap gap-1">
              {SIMBOLOS.map((g, i) => (
                <button
                  key={g.nome}
                  type="button"
                  onClick={() => setAba(i)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    aba === i ? "border-primary-600 bg-primary-600 text-white" : "border-primary-200 text-primary-700 hover:bg-primary-50"
                  }`}
                >
                  {g.nome}
                </button>
              ))}
            </div>
            {grade(SIMBOLOS[Math.min(aba, SIMBOLOS.length - 1)].itens, inserirTexto, "Símbolos")}
          </div>
        )}
        {painel === "formas" && (
          <div className="space-y-1 rounded-lg border border-primary-200 bg-white p-2">
            <p className="text-xs text-slate-500">
              As formas são letras: mude a cor com &quot;Cor da letra&quot; e o tamanho com &quot;Tam.&quot; para fazer formas grandes e coloridas.
            </p>
            {grade(FORMAS, inserirTexto, "Formas geométricas")}
          </div>
        )}
        {painel === "figuras" && (
          <div className="rounded-lg border border-primary-200 bg-white p-2">{grade(FIGURAS, inserirTexto, "Figuras")}</div>
        )}
        {painel === "sugestoes" && (
          <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-primary-200 bg-white p-3">
            <p className="text-xs text-slate-500">
              São frases prontas, montadas com o que você marcou no plano. Clique numa frase para inserir no ponto do cursor e depois edite
              como quiser.
            </p>
            {sugestoes.map((g) => (
              <div key={g.titulo}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-primary-800">{g.titulo}</h4>
                  <button type="button" onMouseDown={manterSelecao} onClick={() => inserirSugestoes(g.itens)} className="btn-azul-suave !border-2 !border-primary-500 !px-3 !py-1 !text-xs">
                    Inserir todas
                  </button>
                </div>
                <ul className="mt-1 space-y-1">
                  {g.itens.map((t) => (
                    <li key={t}>
                      <button
                        type="button"
                        onMouseDown={manterSelecao}
                        onClick={() => inserirSugestoes([t])}
                        className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-left text-sm text-slate-700 hover:border-primary-400 hover:bg-primary-50"
                      >
                        <span aria-hidden="true" className="mr-1.5 font-bold text-primary-600">+</span>
                        {t}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {painel === "tabela" && (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-primary-200 bg-white p-2">
            <label className="text-xs font-semibold text-slate-600">
              Linhas
              <input type="number" min={1} max={30} value={linhasTabela} onChange={(e) => setLinhasTabela(Number(e.target.value))} className="input-field !mt-0.5 !w-20" />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Colunas
              <input type="number" min={1} max={10} value={colunasTabela} onChange={(e) => setColunasTabela(Number(e.target.value))} className="input-field !mt-0.5 !w-20" />
            </label>
            <button type="button" onMouseDown={manterSelecao} onClick={inserirTabela} className="btn-azul !py-2">
              Inserir tabela
            </button>
          </div>
        )}

        {/* ── Ferramentas contextuais ── */}
        {naTabela && (
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-primary-300 bg-primary-50 px-2 py-1.5">
            <span className="px-1 text-xs font-bold uppercase tracking-wide text-primary-700">Tabela:</span>
            <B titulo="Inserir linha acima" onClick={() => tabelaAcao("linhaAcima")}>+ Linha ↑</B>
            <B titulo="Inserir linha abaixo" onClick={() => tabelaAcao("linhaAbaixo")}>+ Linha ↓</B>
            <B titulo="Inserir coluna à esquerda" onClick={() => tabelaAcao("colEsq")}>+ Col. ←</B>
            <B titulo="Inserir coluna à direita" onClick={() => tabelaAcao("colDir")}>+ Col. →</B>
            <B titulo="Excluir esta linha" onClick={() => tabelaAcao("delLinha")}>✕ Linha</B>
            <B titulo="Excluir esta coluna" onClick={() => tabelaAcao("delCol")}>✕ Coluna</B>
            <B titulo="Excluir a tabela inteira" onClick={() => tabelaAcao("delTabela")}>✕ Tabela</B>
            <Sep />
            <B titulo="Aumentar a altura de todas as linhas" onClick={() => alturaTodasLinhas(12)}>↕ Linhas mais altas</B>
            <B titulo="Diminuir a altura de todas as linhas" onClick={() => alturaTodasLinhas(-12)}>↕ Linhas mais baixas</B>
            <B titulo="Deixar a tabela mais larga" onClick={() => larguraTabela(10)}>↔ Tabela mais larga</B>
            <B titulo="Deixar a tabela mais estreita" onClick={() => larguraTabela(-10)}>↔ Tabela mais estreita</B>
            <B titulo="Colunas com a mesma largura" onClick={colunasIguais}>▥ Colunas iguais</B>
            <Sep />
            <B titulo="Com bordas" onClick={() => bordasTabela(true)}>▦ Bordas</B>
            <B titulo="Sem bordas" onClick={() => bordasTabela(false)}>▢ Sem bordas</B>
            <B titulo="Alinhar o texto da célula no alto" onClick={() => alinharCelula("top")}>⤒</B>
            <B titulo="Alinhar o texto da célula no meio" onClick={() => alinharCelula("middle")}>↕</B>
            <B titulo="Alinhar o texto da célula embaixo" onClick={() => alinharCelula("bottom")}>⤓</B>
            <span className="ml-1 text-xs font-semibold text-slate-600">Cor da célula:</span>
            {["#ffffff", "#dbeafe", "#e2e8f0", "#fef08a", "#bbf7d0", "#fecaca", "#e9d5ff"].map((c) => (
              <button
                key={c}
                type="button"
                title={`Cor da célula ${c}`}
                aria-label={`Cor da célula ${c}`}
                onMouseDown={manterSelecao}
                onClick={() => sombrearCelula(c)}
                className="h-6 w-6 rounded border border-slate-400"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
        {imagem && (
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-primary-300 bg-primary-50 px-2 py-1.5">
            <span className="px-1 text-xs font-bold uppercase tracking-wide text-primary-700">Imagem:</span>
            {[25, 50, 75, 100].map((p) => (
              <B key={p} titulo={`Largura ${p}% da página`} onClick={() => larguraImagem(p)}>
                {p}%
              </B>
            ))}
            <B titulo="Aumentar a imagem" onClick={() => aumentarImagem(1.15)}>＋ Maior</B>
            <B titulo="Diminuir a imagem" onClick={() => aumentarImagem(1 / 1.15)}>－ Menor</B>
            <B titulo="Tamanho original" onClick={() => larguraImagem("auto")}>Original</B>
            <Sep />
            <B titulo="Imagem à esquerda" onClick={() => comando("justifyLeft")}>⯇≡</B>
            <B titulo="Imagem centralizada" onClick={() => comando("justifyCenter")}>≡</B>
            <B titulo="Imagem à direita" onClick={() => comando("justifyRight")}>≡⯈</B>
            <B titulo="Excluir a imagem" onClick={removerImagem}>✕ Excluir</B>
          </div>
        )}
        {aviso && (
          <p role="status" className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
            {aviso}
          </p>
        )}
      </div>

      {imagem && retImg && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-10 rounded-sm border-2 border-primary-600"
            style={{ left: retImg.l, top: retImg.t, width: retImg.w, height: retImg.h }}
          />
          <div
            role="slider"
            aria-label="Arraste para aumentar ou diminuir a imagem"
            title="Arraste para aumentar ou diminuir a imagem"
            onMouseDown={(e) => e.preventDefault()}
            onPointerDown={arrastarAlcaImagem}
            className="absolute z-20 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-white bg-primary-600 shadow-md"
            style={{ left: retImg.l + retImg.w - 8, top: retImg.t + retImg.h - 8, touchAction: "none" }}
          />
        </>
      )}

      <div
        id={id}
        ref={areaRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Texto livre do plano"
        data-placeholder="Escreva aqui o restante do plano (relação com outras áreas, avaliação, metodologias, bibliografia...)."
        onInput={agendarSincronizacao}
        onBlur={() => {
          setImagem(null);
          tamanhoPendente.current = null;
          sincronizar();
        }}
        onClick={(e) => {
          const alvo = e.target as HTMLElement;
          setImagem(alvo.tagName === "IMG" ? (alvo as HTMLImageElement) : null);
        }}
        onKeyUp={() => setAviso(null)}
        onPointerDown={(e) => {
          const b = bordaPerto(e);
          if (b) arrastarBordaTabela(e, b);
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 0) return;
          const b = bordaPerto(e);
          e.currentTarget.style.cursor = b ? (b.tipo === "col" ? "col-resize" : "row-resize") : "";
        }}
        onPaste={(e) => {
          const arquivo = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
          if (arquivo) {
            e.preventDefault();
            void inserirImagem(arquivo);
            return;
          }
          e.preventDefault();
          const html = e.clipboardData.getData("text/html");
          if (html) {
            const dentro = /<!--StartFragment-->([\s\S]*?)<!--EndFragment-->/i.exec(html);
            document.execCommand("insertHTML", false, sanitizarHtml(dentro ? dentro[1] : html));
          } else {
            document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
          }
          agendarSincronizacao();
        }}
        onDrop={(e) => {
          const arquivo = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
          if (arquivo) {
            e.preventDefault();
            void inserirImagem(arquivo);
          }
        }}
        className="texto-rico editor-rico editor-livre max-h-[70vh] max-w-none overflow-y-auto rounded-b-xl px-5 py-4 text-slate-900 focus:outline-none"
        style={{ fontFamily: FAMILIA_FONTE, fontSize: "14px", lineHeight: "20px", textAlign: "justify", resize: "vertical", minHeight: alturaMinima ?? 416 }}
        dangerouslySetInnerHTML={htmlProp}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-primary-100 px-3 py-1.5 text-xs text-slate-500">
        <span>
          Dica: arraste a bordinha das linhas e colunas da tabela para mudar o tamanho; clique numa imagem e arraste a alça azul do canto (ou arraste a própria imagem para mudar de lugar). Tudo sai igual no PDF.
        </span>
        <span className={excedeu ? "font-bold text-red-600" : ""}>
          {excedeu
            ? "Conteúdo grande demais — reduza ou remova imagens para conseguir salvar."
            : `${(tamanhoAtual / 1_000_000).toFixed(2).replace(".", ",")} MB de 3,3 MB`}
        </span>
      </div>

      <input type="hidden" name={name} ref={campoRef} defaultValue="" />
    </div>
  );
}
