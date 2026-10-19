import Link from "next/link";
import { Icone } from "@/components/icones";
import Revelar from "./revelar";
import { PLANOS } from "./config-landing";

export default function Precos() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-stretch gap-5 lg:grid-cols-3">
      {PLANOS.map((p, i) => {
        const destaque = p.destaque === "Mais escolhido";
        return (
          <Revelar key={p.id} atraso={i * 90} className="h-full">
            <article className={`ld-preco ${destaque ? "ld-preco-destaque" : ""}`}>
              {p.destaque && <span className="ld-preco-selo">{p.destaque}</span>}
              <h3 className="text-xl font-extrabold text-slate-900">{p.nome}</h3>
              <p className="mt-1 min-h-10 text-sm text-slate-600">{p.resumo}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-base font-extrabold text-slate-700">{p.preco}</span>
                {p.periodo && <span className="text-sm font-semibold text-slate-500">{p.periodo}</span>}
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-700">
                {p.itens.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Icone nome="check" className="h-3.5 w-3.5" espessura={2.8} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className={`${destaque ? "btn-azul" : "btn-secondary"} mt-7 w-full !rounded-xl !py-3`}>
                {p.botao}
              </Link>
            </article>
          </Revelar>
        );
      })}
    </div>
  );
}
