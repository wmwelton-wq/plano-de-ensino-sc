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
