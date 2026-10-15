"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { normalizarLinha, type EditorTextoRicoHandle } from "./editor-texto-rico";

/**
 * Acompanha as linhas do campo de texto do plano para as caixinhas saberem o que já está lá.
 * Devolve o conjunto de linhas (normalizadas) e funções para marcar/desmarcar itens.
 */
export function useLinhasDoEditor(editorRef: RefObject<EditorTextoRicoHandle | null>) {
  const [linhas, setLinhas] = useState<Set<string>>(() => new Set());
  const ultima = useRef("");

  useEffect(() => {
    let cancelar: (() => void) | undefined;
    let tentativas = 0;
    let espera: number | undefined;
    function ligar() {
      const editor = editorRef.current;
      if (!editor) {
        // O campo de texto pode aparecer um instante depois (ex.: abas); tenta de novo algumas vezes.
        if (tentativas++ < 20) espera = window.setTimeout(ligar, 150);
        return;
      }
      cancelar = editor.observar((lista) => {
        const chave = lista.join("\n");
        if (chave === ultima.current) return; // nada mudou para as caixinhas
        ultima.current = chave;
        setLinhas(new Set(lista));
      });
    }
    ligar();
    return () => {
      window.clearTimeout(espera);
      cancelar?.();
    };
  }, [editorRef]);

  return {
    linhas,
    tem: (item: string) => linhas.has(normalizarLinha(item)),
    marcar: (itens: string[], formato: "lista" | "paragrafos") => editorRef.current?.anexar(itens, formato),
    desmarcar: (itens: string[]) => editorRef.current?.remover(itens),
  };
}

/** Mensagem curta que aparece e some sozinha (ex.: "Adicionado ao plano, no campo logo abaixo"). */
export function useAvisoTemporario(duracaoMs = 2600) {
  const [aviso, setAviso] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  function mostrar(texto: string) {
    setAviso(texto);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAviso(null), duracaoMs);
  }
  return { aviso, mostrar };
}

/** Um item de caixinha: `chave` identifica a caixinha; `linha` é o texto que ela escreve no campo. */
export interface ItemCaixinha {
  chave: string;
  linha: string;
  /** Chave da caixinha "mãe" (ex.: o objeto de um conteúdo). Usada só ao reconhecer um plano já salvo. */
  pai?: string;
}

/**
 * Caixinhas independentes entre si: cada uma guarda a SUA marcação, mesmo que duas caixinhas escrevam
 * a mesma linha no campo (ex.: um conteúdo repetido em dois objetos). Ao desmarcar, a linha só sai do
 * campo se nenhuma outra caixinha marcada ainda precisar dela. Se o professor apagar a linha à mão,
 * a caixinha desmarca sozinha.
 */
export function useCaixinhasIndependentes(editorRef: RefObject<EditorTextoRicoHandle | null>) {
  const texto = useLinhasDoEditor(editorRef);
  const selecao = useRef(new Map<string, string>());
  const [, atualizar] = useState(0);
  const decidido = useRef(false);

  function marcado(chave: string): boolean {
    const linha = selecao.current.get(chave);
    return linha !== undefined && texto.linhas.has(normalizarLinha(linha));
  }

  /** Marcações que ainda têm a sua linha no campo (leitura ao vivo do campo). */
  function vivas(): Map<string, string> {
    const noCampo = new Set(editorRef.current?.linhas() ?? []);
    const novo = new Map<string, string>();
    selecao.current.forEach((linha, chave) => {
      if (noCampo.has(normalizarLinha(linha))) novo.set(chave, linha);
    });
    return novo;
  }

  function marcar(itens: ItemCaixinha[]) {
    decidido.current = true;
    const base = vivas();
    for (const i of itens) base.set(i.chave, i.linha);
    selecao.current = base;
    editorRef.current?.anexar(
      itens.map((i) => i.linha),
      "paragrafos"
    );
    // Depois do aviso do campo (que também é por microtarefa), para a tela atualizar uma vez só, já certa.
    queueMicrotask(() => atualizar((n) => n + 1));
  }

  function desmarcar(itens: ItemCaixinha[]) {
    decidido.current = true;
    const base = vivas();
    for (const i of itens) base.delete(i.chave);
    const emUso = new Set<string>();
    base.forEach((linha) => emUso.add(normalizarLinha(linha)));
    selecao.current = base;
    editorRef.current?.remover(itens.map((i) => i.linha).filter((l) => !emUso.has(normalizarLinha(l))));
    queueMicrotask(() => atualizar((n) => n + 1));
  }

  /**
   * Plano já salvo: na primeira vez que o campo tem texto, marca as caixinhas cujas linhas já estão lá.
   * Objetos só são reconhecidos se a linha identifica UMA caixinha (se duas pedem a mesma linha, nenhuma é marcada); conteúdos, se o objeto deles foi reconhecido.
   */
  function semear(itens: ItemCaixinha[]) {
    if (decidido.current || texto.linhas.size === 0 || itens.length === 0) return;
    decidido.current = true;
    const contagem = new Map<string, number>();
    for (const i of itens) {
      if (i.pai) continue;
      const n = normalizarLinha(i.linha);
      contagem.set(n, (contagem.get(n) ?? 0) + 1);
    }
    for (const i of itens) {
      if (i.pai) continue;
      const n = normalizarLinha(i.linha);
      if (contagem.get(n) === 1 && texto.linhas.has(n)) selecao.current.set(i.chave, i.linha);
    }
    // Conteúdos: marcados quando o objeto deles foi reconhecido e a linha está no campo.
    for (const i of itens) {
      if (i.pai && selecao.current.has(i.pai) && texto.linhas.has(normalizarLinha(i.linha))) {
        selecao.current.set(i.chave, i.linha);
      }
    }
    atualizar((n) => n + 1);
  }

  return { marcado, marcar, desmarcar, semear, textoPronto: texto.linhas.size > 0, jaDecidiu: () => decidido.current };
}
