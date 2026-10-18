"use client";

import { useState } from "react";
import { gerarPdfDoElemento } from "@/lib/gerar-pdf";
import { gerarWordDoElemento } from "@/lib/gerar-word";
import { baixarArquivo } from "@/lib/baixar-arquivo";
import CompartilharLink from "./compartilhar-link";

interface BarraAcoesPlanoProps {
  titulo: string;
  /** Anos Iniciais saem em paisagem (modelo oficial); as demais etapas, em retrato. */
  paisagem: boolean;
  /** Quando informado, mostra o botão "Compartilhar link" (somente leitura). */
  compartilhar?: { tipo: "mensal" | "anual"; planoId: string };
}

/**
 * Botões azuis da visualização: imprimir, baixar em PDF e baixar em Word.
 * Os dois downloads geram o arquivo no próprio navegador a partir do
 * conteúdo exibido (#plano-conteudo).
 */
export default function BarraAcoesPlano({ titulo, paisagem, compartilhar }: BarraAcoesPlanoProps) {
  const orientacao = paisagem ? "paisagem" : "retrato";
  const [ocupado, setOcupado] = useState<"pdf" | "word" | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function baixar(tipo: "pdf" | "word") {
    setOcupado(tipo);
    setMensagem(tipo === "pdf" ? "Gerando PDF..." : "Gerando documento Word...");
    try {
      const arquivo =
        tipo === "pdf"
          ? await gerarPdfDoElemento("plano-conteudo", titulo, orientacao)
          : await gerarWordDoElemento("plano-conteudo", titulo, orientacao);
      baixarArquivo(arquivo);
      setMensagem(tipo === "pdf" ? "PDF baixado." : "Documento Word baixado.");
    } catch (erro) {
      console.error(erro);
      setMensagem("Não foi possível gerar o arquivo. Tente novamente.");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2 print:hidden">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          aria-label="Abrir a caixa de impressão do navegador para imprimir este plano"
          className="btn-azul-suave"
        >
          Imprimir
        </button>
        <button
          type="button"
          onClick={() => baixar("pdf")}
          disabled={ocupado !== null}
          aria-label="Baixar este plano como arquivo PDF"
          className="btn-azul"
        >
          {ocupado === "pdf" ? "Gerando PDF..." : "Baixar PDF"}
        </button>
        <button
          type="button"
          onClick={() => baixar("word")}
          disabled={ocupado !== null}
          aria-label="Baixar este plano como documento do Word, para editar"
          className="btn-azul"
        >
          {ocupado === "word" ? "Gerando Word..." : "Baixar Word"}
        </button>
      </div>
      {mensagem && (
        <p role="status" className="text-xs text-primary-700">
          {mensagem}
        </p>
      )}
      {compartilhar && <CompartilharLink tipo={compartilhar.tipo} planoId={compartilhar.planoId} titulo={titulo} paisagem={paisagem} />}
    </div>
  );
}
