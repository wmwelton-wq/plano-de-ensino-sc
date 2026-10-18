"use client";

import { useCallback, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { MouseEvent as MouseEventReact, Ref } from "react";
import { MARCADOR_HTML, sanitizarHtml, valorGravadoParaHtml } from "@/lib/texto-rico";

export interface EditorTextoRicoHandle {
  /** Acrescenta itens ao final: como lista com marcadores ("lista") ou como parágrafos ("paragrafos"). */
  anexar: (itens: string[], formato: "lista" | "paragrafos") => void;
  /** Tira do texto as linhas (parágrafos ou itens de lista) que forem exatamente iguais aos itens. */
  remover: (itens: string[]) => void;
  /** Linhas atuais do texto, já normalizadas (minúsculas, sem marcadores) — para marcar caixinhas. */
  linhas: () => string[];
  /** Avisa sempre que o texto mudar. Devolve a função que cancela o aviso. */
  observar: (aoMudar: (linhas: string[]) => void) => () => void;
}

/** Forma comparável de uma linha: sem marcadores, sem espaços extras, minúscula. */
export function normalizarLinha(t: string): string {
  return t
    .replace(/^[\s•\-–*]+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

interface EditorTextoRicoProps {
  id: string;
  /** Nome do campo enviado no formulário. */
  name: string;
  /** Valor gravado no banco (HTML do editor ou texto simples antigo). */
  valorInicial?: string | null;
  /** Se o texto simples antigo deve virar lista com marcadores ao abrir. */
  textoAntigoComoLista?: boolean;
  placeholder?: string;
  /** Altura mínima da área de escrita, em linhas aproximadas. */
  linhas?: number;
  editorRef?: Ref<EditorTextoRicoHandle>;
}

const CORES_TEXTO: { nome: string; valor: string }[] = [
  { nome: "Preto", valor: "#0f172a" },
  { nome: "Vermelho", valor: "#dc2626" },
  { nome: "Laranja", valor: "#ea580c" },
  { nome: "Verde", valor: "#16a34a" },
  { nome: "Azul", valor: "#2563eb" },
  { nome: "Roxo", valor: "#7c3aed" },
  { nome: "Cinza", valor: "#64748b" },
];

const CORES_DESTAQUE: { nome: string; valor: string }[] = [
  { nome: "Amarelo", valor: "#fef08a" },
  { nome: "Verde claro", valor: "#bbf7d0" },
  { nome: "Azul claro", valor: "#bfdbfe" },
  { nome: "Rosa", valor: "#fbcfe8" },
  { nome: "Laranja claro", valor: "#fed7aa" },
  { nome: "Cinza claro", valor: "#e2e8f0" },
];

const TAMANHOS: { rotulo: string; valor: string }[] = [
  { rotulo: "Pequeno", valor: "2" },
  { rotulo: "Normal", valor: "3" },
  { rotulo: "Médio", valor: "4" },
  { rotulo: "Grande", valor: "5" },
  { rotulo: "Muito grande", valor: "6" },
];

const SIMBOLOS = [
  "•", "◦", "▪", "✓", "✔", "✗", "★", "☆", "→", "←", "↑", "↓", "↔",
  "±", "×", "÷", "≤", "≥", "≠", "≈", "°", "²", "³", "½", "¼", "¾", "§", "¶", "©", "®", "™", "€", "R$",
];

function escaparHtml(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const botaoBase =
  "inline-flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm text-slate-700 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

export default function EditorTextoRico({
  id,
  name,
  valorInicial,
  textoAntigoComoLista = false,
  placeholder,
  linhas = 5,
  editorRef,
}: EditorTextoRicoProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const idSimbolos = useId();

  // O conteúdo inicial é fixado uma única vez; depois disso o navegador cuida
  // da edição (a área de escrita não é controlada pelo React).
  const [htmlInicial] = useState(() => valorGravadoParaHtml(valorInicial, textoAntigoComoLista));
  const [valorCampo, setValorCampo] = useState(() => (htmlInicial ? MARCADOR_HTML + htmlInicial : ""));
  // Mesmo objeto em toda renderização: assim o React nunca reescreve o conteúdo que o professor (ou as
  // caixinhas) colocou na área de escrita.
  const conteudoInicial = useMemo(() => ({ __html: htmlInicial }), [htmlInicial]);

  const ouvintes = useRef(new Set<(linhas: string[]) => void>());

  const linhasAtuais = useCallback((): string[] => {
    const area = areaRef.current;
    if (!area) return [];
    // Campo escondido (ex.: passo de outra etapa do plano): o navegador não separa os parágrafos em
    // innerText; então lemos bloco a bloco para as linhas continuarem certas.
    let bruto = area.innerText || "";
    if (!bruto.includes("\n") && area.children.length > 1) {
      const partes: string[] = [];
      Array.from(area.children).forEach((el) => {
        if (el.tagName === "UL" || el.tagName === "OL") el.querySelectorAll("li").forEach((li) => partes.push(li.textContent ?? ""));
        else partes.push(el.textContent ?? "");
      });
      bruto = partes.join("\n");
    }
    return (bruto || area.textContent || "")
      .split("\n")
      .map(normalizarLinha)
      .filter((l) => l.length > 0);
  }, []);

  const avisar = useCallback(() => {
    if (ouvintes.current.size === 0) return;
    const linhas = linhasAtuais();
    ouvintes.current.forEach((f) => f(linhas));
  }, [linhasAtuais]);

  const sincronizar = useCallback(() => {
    const area = areaRef.current;
    if (!area) return;
    // Depois de atualizar o valor do campo, quem observa o texto (as caixinhas) é avisado.
    queueMicrotask(avisar);
    const temTexto = (area.textContent ?? "").trim().length > 0 || area.querySelector("li") !== null;
    if (!temTexto) {
      setValorCampo("");
      // O navegador deixa um <br> sobrando depois de apagar tudo; limpamos para o placeholder aparecer.
      if (area.innerHTML !== "") area.innerHTML = "";
      return;
    }
    setValorCampo(MARCADOR_HTML + sanitizarHtml(area.innerHTML));
  }, []);

  function comando(nome: string, valor?: string) {
    const area = areaRef.current;
    if (!area) return;
    area.focus();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(nome, false, valor);
    sincronizar();
  }

  /** Percorre os nós de texto tocados pela seleção e aplica a transformação. */
  function transformarCaixa(modo: "maiusculas" | "minusculas") {
    const area = areaRef.current;
    const sel = window.getSelection();
    if (!area || !sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!area.contains(range.commonAncestorContainer)) return;

    const walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT);
    const nos: Text[] = [];
    while (walker.nextNode()) {
      const no = walker.currentNode as Text;
      if (range.intersectsNode(no)) nos.push(no);
    }
    const converter = (s: string) => (modo === "maiusculas" ? s.toUpperCase() : s.toLowerCase());
    const { startContainer, startOffset, endContainer, endOffset } = range;
    for (const no of nos) {
      const ini = no === startContainer ? startOffset : 0;
      const fim = no === endContainer ? endOffset : no.data.length;
      no.data = no.data.slice(0, ini) + converter(no.data.slice(ini, fim)) + no.data.slice(fim);
    }
    sincronizar();
  }

  useImperativeHandle(
    editorRef,
    () => ({
      anexar(itens, formato) {
        const area = areaRef.current;
        if (!area || itens.length === 0) return;
        // Evita repetir linhas que já estão no texto.
        const existentes = new Set(linhasAtuais());
        const novos = itens.filter((i) => !existentes.has(normalizarLinha(i)));
        if (novos.length === 0) return;

        if (formato === "lista") {
          const ultimo = area.lastElementChild;
          const lista = ultimo && ultimo.tagName === "UL" ? ultimo : document.createElement("ul");
          for (const item of novos) {
            const li = document.createElement("li");
            li.textContent = item;
            lista.appendChild(li);
          }
          if (!lista.parentElement) area.appendChild(lista);
        } else {
          area.insertAdjacentHTML(
            "beforeend",
            novos.map((i) => `<p>${escaparHtml(i)}</p>`).join("")
          );
        }
        sincronizar();
      },
      remover(itens) {
        const area = areaRef.current;
        if (!area || itens.length === 0) return;
        const alvo = new Set(itens.map(normalizarLinha));
        let mudou = false;
        area.querySelectorAll("p, li, div").forEach((el) => {
          if (el.querySelector("p, li, div")) return; // só blocos "folha"
          if (!alvo.has(normalizarLinha(el.textContent ?? ""))) return;
          const pai = el.parentElement;
          el.remove();
          mudou = true;
          if (pai && pai !== area && pai.tagName === "UL" && pai.children.length === 0) pai.remove();
        });
        if (mudou) sincronizar();
      },
      linhas: linhasAtuais,
      observar(aoMudar) {
        ouvintes.current.add(aoMudar);
        aoMudar(linhasAtuais());
        return () => {
          ouvintes.current.delete(aoMudar);
        };
      },
    }),
    [sincronizar, linhasAtuais]
  );

  // Os botões não podem tirar o foco/seleção da área de escrita.
  const manterSelecao = (e: MouseEventReact) => e.preventDefault();

  return (
    <div className="mt-1 rounded-xl border border-slate-300 bg-white shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/25">
      <div
        role="toolbar"
        aria-label="Formatação do texto"
        className="flex flex-wrap items-center gap-1 rounded-t-lg border-b border-slate-200 bg-slate-50 px-2 py-1.5"
      >
        <button type="button" title="Negrito (Ctrl+B)" aria-label="Negrito" onMouseDown={manterSelecao} onClick={() => comando("bold")} className={`${botaoBase} font-bold`}>
          B
        </button>
        <button type="button" title="Itálico (Ctrl+I)" aria-label="Itálico" onMouseDown={manterSelecao} onClick={() => comando("italic")} className={`${botaoBase} italic`}>
          I
        </button>
        <button type="button" title="Sublinhado (Ctrl+U)" aria-label="Sublinhado" onMouseDown={manterSelecao} onClick={() => comando("underline")} className={`${botaoBase} underline`}>
          U
        </button>

        <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden="true" />

        <label className="sr-only" htmlFor={`${id}-tamanho`}>
          Tamanho da letra
        </label>
        <select
          id={`${id}-tamanho`}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) comando("fontSize", e.target.value);
            e.target.value = "";
          }}
          className="h-8 rounded border border-slate-300 bg-white px-1 text-sm text-slate-700"
          title="Tamanho da letra"
        >
          <option value="">Tamanho</option>
          {TAMANHOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </select>

        <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden="true" />

        <button type="button" title="Lista com marcadores" aria-label="Lista com marcadores" onMouseDown={manterSelecao} onClick={() => comando("insertUnorderedList")} className={botaoBase}>
          • Lista
        </button>
        <button type="button" title="Lista numerada" aria-label="Lista numerada" onMouseDown={manterSelecao} onClick={() => comando("insertOrderedList")} className={botaoBase}>
          1. Lista
        </button>

        <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden="true" />

        <button type="button" title="Transformar a seleção em MAIÚSCULAS" aria-label="Maiúsculas" onMouseDown={manterSelecao} onClick={() => transformarCaixa("maiusculas")} className={botaoBase}>
          AA
        </button>
        <button type="button" title="Transformar a seleção em minúsculas" aria-label="Minúsculas" onMouseDown={manterSelecao} onClick={() => transformarCaixa("minusculas")} className={botaoBase}>
          aa
        </button>

        <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden="true" />

        <label className="sr-only" htmlFor={idSimbolos}>
          Inserir símbolo
        </label>
        <select
          id={idSimbolos}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) comando("insertText", e.target.value);
            e.target.value = "";
          }}
          className="h-8 rounded border border-slate-300 bg-white px-1 text-sm text-slate-700"
          title="Inserir símbolo"
        >
          <option value="">Símbolos</option>
          {SIMBOLOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden="true" />

        <span className="text-xs text-slate-500">Cor da letra:</span>
        {CORES_TEXTO.map((c) => (
          <button
            key={c.valor}
            type="button"
            title={`Cor da letra: ${c.nome}`}
            aria-label={`Cor da letra: ${c.nome}`}
            onMouseDown={manterSelecao}
            onClick={() => comando("foreColor", c.valor)}
            className="h-5 w-5 rounded-full border border-slate-300"
            style={{ backgroundColor: c.valor }}
          />
        ))}

        <span className="ml-1 text-xs text-slate-500">Destaque:</span>
        {CORES_DESTAQUE.map((c) => (
          <button
            key={c.valor}
            type="button"
            title={`Destacar com ${c.nome}`}
            aria-label={`Destacar com ${c.nome}`}
            onMouseDown={manterSelecao}
            onClick={() => comando("hiliteColor", c.valor)}
            className="h-5 w-5 rounded border border-slate-300"
            style={{ backgroundColor: c.valor }}
          />
        ))}
        <button
          type="button"
          title="Remover destaque"
          aria-label="Remover destaque"
          onMouseDown={manterSelecao}
          onClick={() => comando("hiliteColor", "transparent")}
          className={`${botaoBase} !h-5 !min-w-5 !px-1 text-xs`}
        >
          ✕
        </button>

        <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden="true" />

        <button type="button" title="Limpar formatação da seleção" aria-label="Limpar formatação" onMouseDown={manterSelecao} onClick={() => comando("removeFormat")} className={botaoBase}>
          Limpar
        </button>
      </div>

      <div
        id={id}
        ref={areaRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={sincronizar}
        onBlur={sincronizar}
        onPaste={(e) => {
          // Cola sempre como texto simples, para não trazer fontes/cores de outros sites.
          e.preventDefault();
          const texto = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, texto);
        }}
        className="texto-rico editor-rico max-w-none overflow-y-auto rounded-b-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
        style={{ minHeight: `${linhas * 1.5}rem`, resize: "vertical" }}
        dangerouslySetInnerHTML={conteudoInicial}
      />

      <input type="hidden" name={name} value={valorCampo} />
    </div>
  );
}
