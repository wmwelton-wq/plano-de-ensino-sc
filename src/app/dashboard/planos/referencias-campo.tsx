"use client";

import { useRef } from "react";

interface ReferenciasCampoProps {
  id?: string;
  name?: string;
  valorInicial?: string | null;
  rows?: number;
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

/** Caixa de "Referências complementares" com botões que inserem modelos ABNT. */
export default function ReferenciasCampo({
  id = "referencias",
  name = "referencias",
  valorInicial,
  rows = 5,
}: ReferenciasCampoProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function inserir(texto: string) {
    const el = ref.current;
    if (!el) return;
    const base = el.value.trimEnd();
    el.value = base ? `${base}\n${texto}` : texto;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }

  return (
    <div>
      <textarea
        ref={ref}
        id={id}
        name={name}
        rows={rows}
        defaultValue={valorInicial ?? ""}
        className="input-field"
      />
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
