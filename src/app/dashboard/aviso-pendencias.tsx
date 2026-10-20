import Link from "next/link";
import { Icone } from "@/components/icones";
import { enderecoDoPasso, type Pendencia } from "@/lib/pendencias-plano";

/**
 * Aviso no fim do plano: lista o que o professor ainda não preencheu, cada item com um botão que abre o plano
 * direto no passo certo. Fica fora da área do plano (#plano-conteudo) e não aparece na impressão, no PDF nem no Word.
 */
export default function AvisoPendencias({
  tipo,
  planoId,
  etapa,
  pendencias,
  larguraMaxima,
}: {
  tipo: "mensal" | "anual";
  planoId: string;
  etapa?: string | null;
  pendencias: Pendencia[];
  larguraMaxima: string;
}) {
  return (
    <section id="o-que-falta" aria-labelledby="o-que-falta-titulo" className={`mx-auto mt-4 ${larguraMaxima} px-4 print:hidden`}>
      {pendencias.length === 0 ? (
        <p role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <Icone nome="check" className="h-4 w-4 shrink-0" espessura={3} />
          <span id="o-que-falta-titulo">Plano completo: não falta preencher nada.</span>
        </p>
      ) : (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
          <h2 id="o-que-falta-titulo" className="flex items-center gap-2 text-sm font-extrabold text-amber-900">
            <Icone nome="alerta" className="h-4 w-4 shrink-0" />
            Faltou preencher {pendencias.length === 1 ? "1 item" : `${pendencias.length} itens`} neste plano
          </h2>
          <p className="mt-1 text-xs text-amber-900/80">
            É só um aviso: o plano pode ser baixado e finalizado assim mesmo. Toque em “Ir para lá” para completar o que ficou em branco.
          </p>
          <ul className="mt-3 max-h-80 space-y-1.5 overflow-y-auto">
            {pendencias.map((c, k) => (
              <li key={`${c.passo}-${k}`} className="flex items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2">
                <span className="min-w-0 text-sm font-medium text-slate-800">{c.texto}</span>
                <Link
                  href={enderecoDoPasso(tipo, planoId, etapa, c.passo)}
                  className="shrink-0 rounded-md border border-amber-400 bg-white px-2.5 py-1 text-xs font-bold text-amber-900 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  Ir para lá
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
