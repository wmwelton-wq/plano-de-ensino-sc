"use client";

import { useRef, useState } from "react";
import { lerReferenciasGravadas, referenciasParaGravar } from "@/lib/referencias-oficiais";
import { useAvisoTemporario } from "./linhas-do-editor";

interface ReferenciasCampoProps {
  id?: string;
  name?: string;
  valorInicial?: string | null;
  rows?: number;
  /** Referências oficiais que o plano gerado traz sozinhas; o botão as coloca no quadro para o professor ver e editar. */
  sugeridas?: string[];
}

/** Modelos no padrão ABNT; o professor substitui o que está entre colchetes. */
const MODELOS: { rotulo: string; texto: string }[] = [
  {
    rotulo: "Livro",
    texto: "SOBRENOME, Nome. Título da obra: subtítulo. Edição. Local: Editora, ano.",
  },
  {
    rotulo: "Artigo",
    texto:
      "SOBRENOME, Nome. Título do artigo. Nome da revista, local, v. 0, n. 0, p. 00-00, mês ano.",
  },
  {
    rotulo: "Site",
    texto: "SOBRENOME, Nome. Título da página. Nome do site, ano. Disponível em: <endereço>. Acesso em: dia mês ano.",
  },
  {
    rotulo: "Documento oficial",
    texto: "BRASIL. Órgão responsável. Título do documento. Local: Editora, ano.",
  },
];

function chave(l: string): string {
  return l.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Caixa de referências. O botão "Adicionar referências sugeridas" coloca no quadro as fontes
 * oficiais que o plano já traz; a partir daí o plano mostra exatamente o que está no quadro
 * (o professor pode editar ou apagar qualquer linha). Também tem modelos ABNT.
 */
export default function ReferenciasCampo({
  id = "referencias",
  name = "referencias",
  valorInicial,
  rows = 5,
  sugeridas = [],
}: ReferenciasCampoProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const inicial = lerReferenciasGravadas(valorInicial);
  const [texto, setTexto] = useState(inicial.texto);
  // "Completo": o quadro é a lista inteira das referências do plano (sem as oficiais automáticas).
  const [completo, setCompleto] = useState(inicial.completo);
  const { aviso, mostrar } = useAvisoTemporario(3200);

  function inserir(modelo: string) {
    const base = texto.trimEnd();
    setTexto(base ? `${base}\n${modelo}` : modelo);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  function adicionarSugeridas() {
    const existentes = new Set(texto.split("\n").map(chave));
    const novas = sugeridas.filter((r) => !existentes.has(chave(r)));
    setCompleto(true);
    if (novas.length === 0) {
      mostrar("As referências sugeridas já estão no quadro.");
      return;
    }
    const resto = texto.trim();
    setTexto([...novas, ...(resto ? [resto] : [])].join("\n"));
    mostrar("Referências sugeridas adicionadas no quadro acima. Você pode editar ou apagar o que quiser.");
  }

  function voltarAoAutomatico() {
    const sugeridasChave = new Set(sugeridas.map(chave));
    setTexto(
      texto
        .split("\n")
        .filter((l) => !sugeridasChave.has(chave(l)))
        .join("\n")
        .trim()
    );
    setCompleto(false);
    mostrar("Pronto: as fontes oficiais voltam a entrar sozinhas no plano.");
  }

  return (
    <div>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="input-field"
      />
      <input type="hidden" name={name} value={referenciasParaGravar(texto, completo)} />

      {sugeridas.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={adicionarSugeridas} className="btn-azul !px-4 !py-2 !text-sm">
            <span aria-hidden="true">＋</span> Adicionar referências sugeridas
          </button>
          {completo && (
            <button type="button" onClick={voltarAoAutomatico} className="btn-azul-suave !px-3 !py-2 !text-xs">
              Voltar ao automático
            </button>
          )}
        </div>
      )}
      <p
        role="status"
        aria-live="polite"
        className={`mt-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
          aviso ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "hidden"
        }`}
      >
        {aviso ? `✓ ${aviso}` : ""}
      </p>
      {completo && (
        <p className="mt-2 text-xs text-slate-500">
          O plano vai mostrar exatamente as referências que estão neste quadro, na ordem em que estão.
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Inserir modelo (ABNT):</span>
        {MODELOS.map((m) => (
          <button
            key={m.rotulo}
            type="button"
            onClick={() => inserir(m.texto)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            + {m.rotulo}
          </button>
        ))}
      </div>
    </div>
  );
}
