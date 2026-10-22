"use client";

import { useRef, useState } from "react";
import { lerReferenciasGravadas } from "@/lib/referencias-oficiais";

interface ReferenciasCampoProps {
  id?: string;
  name?: string;
  valorInicial?: string | null;
  rows?: number;
  /**
   * Fontes oficiais que o plano traz sozinhas (BNCC, Currículo Catarinense, etc.).
   * Elas entram SEMPRE no plano gerado e não podem ser apagadas, então são removidas
   * do quadro editável: aqui o professor só vê e edita as próprias referências.
   */
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
 * Caixa de referências complementares. As fontes oficiais usadas no plano são adicionadas
 * automaticamente ao documento (citadas a partir dos documentos oficiais) e não podem ser
 * removidas; este quadro é só para as referências que o professor acrescentar. Também tem
 * modelos ABNT para facilitar.
 */
export default function ReferenciasCampo({
  id = "referencias",
  name = "referencias",
  valorInicial,
  rows = 5,
  sugeridas = [],
}: ReferenciasCampoProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Mostra apenas as referências do professor: tira do quadro as fontes oficiais (inclusive de
  // planos antigos que as tinham gravado) — elas voltam sozinhas no plano gerado.
  const sugeridasChave = new Set(sugeridas.map(chave));
  const textoInicial = lerReferenciasGravadas(valorInicial)
    .texto.split("\n")
    .filter((l) => !sugeridasChave.has(chave(l)))
    .join("\n")
    .replace(/^\n+/, "");
  const [texto, setTexto] = useState(textoInicial);

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
      {/* O quadro guarda só o que o professor digita; as fontes oficiais entram sozinhas no plano. */}
      <input type="hidden" name={name} value={texto} />

      <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
        As fontes oficiais usadas neste plano (BNCC, Currículo Catarinense e outros documentos
        curriculares públicos) são adicionadas automaticamente, citadas a partir dos documentos
        oficiais. Acrescente aqui as demais referências que você utilizou — a lista de referências
        do plano é de sua responsabilidade.
      </p>

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
