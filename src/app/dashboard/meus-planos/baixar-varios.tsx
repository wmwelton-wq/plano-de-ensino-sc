"use client";

import { useState } from "react";
import { baixarArquivo } from "@/lib/baixar-arquivo";
import { gerarPdfDeVarios, type ItemPdf } from "@/lib/gerar-pdf-varios";

export interface PlanoParaBaixar {
  id: string;
  titulo: string;
  tipo: "mensais" | "anuais";
}

/** Botão "Baixar todos em um PDF": junta os planos da lista num único arquivo. */
export default function BaixarVarios({ planos, nomeArquivo, rotulo }: { planos: PlanoParaBaixar[]; nomeArquivo: string; rotulo: string }) {
  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function baixar() {
    setGerando(true);
    setAviso(null);
    const itens: ItemPdf[] = planos.map((p) =>
      p.tipo === "anuais"
        ? { url: `/dashboard/anual/${p.id}/visualizar`, titulo: p.titulo, orientacao: "paisagem" }
        : { url: `/dashboard/planos/${p.id}/visualizar`, titulo: p.titulo, orientacao: "retrato" }
    );
    try {
      const { arquivo, falhas } = await gerarPdfDeVarios(itens, nomeArquivo, (feitos, total, titulo) =>
        setProgresso(feitos < total ? `Preparando ${feitos + 1} de ${total}: ${titulo}` : null)
      );
      if (arquivo) baixarArquivo(arquivo);
      if (falhas.length > 0) {
        setAviso(`Não foi possível incluir: ${falhas.join("; ")}. Abra cada um e baixe separadamente.`);
      } else if (!arquivo) {
        setAviso("Não foi possível gerar o PDF.");
      }
    } catch {
      setAviso("Não foi possível gerar o PDF agora. Tente novamente.");
    } finally {
      setGerando(false);
      setProgresso(null);
    }
  }

  if (planos.length === 0) return null;

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" onClick={baixar} disabled={gerando} className="btn-azul">
        <span aria-hidden="true">⬇</span> {gerando ? "Gerando PDF..." : `${rotulo} (${planos.length})`}
      </button>
      {progresso && (
        <p role="status" className="text-sm text-slate-600">
          {progresso}
        </p>
      )}
      {aviso && (
        <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {aviso}
        </p>
      )}
    </div>
  );
}
