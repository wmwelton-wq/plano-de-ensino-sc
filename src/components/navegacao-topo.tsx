import Link from "next/link";
import VoltarLink from "@/app/dashboard/planos/voltar-link";

export interface Migalha {
  rotulo: string;
  href?: string;
}

/**
 * Topo de página: botão "Voltar" (um nível acima) e, ao lado, o caminho em que o professor está.
 * No celular só aparece o botão, que é o que mais se usa.
 */
export default function NavegacaoTopo({
  voltarHref,
  voltarRotulo = "Voltar",
  migalhas,
}: {
  voltarHref: string;
  voltarRotulo?: string;
  migalhas?: Migalha[];
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <VoltarLink href={voltarHref} rotulo={voltarRotulo} className="" />
      {migalhas && migalhas.length > 0 && (
        <nav aria-label="Você está aqui" className="hidden min-w-0 flex-wrap items-center gap-1.5 text-sm sm:flex">
          {migalhas.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <span aria-hidden="true" className="text-slate-300">
                  /
                </span>
              )}
              {item.href ? (
                <Link href={item.href} className="font-medium text-slate-500 transition hover:text-primary-700 hover:underline">
                  {item.rotulo}
                </Link>
              ) : (
                <span aria-current="page" className="font-semibold text-slate-800">
                  {item.rotulo}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
    </div>
  );
}
