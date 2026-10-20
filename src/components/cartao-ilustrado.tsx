import Link from "next/link";
import type { ReactNode } from "react";
import { Icone } from "@/components/icones";
import { Ilustracao, type NomeIlustracao, type TomIlustracao } from "@/components/ilustracoes";

/**
 * Cartão de atalho com ilustração: o mesmo desenho usado nos cartões do painel inicial.
 * `selo` é um texto curto que aparece sobre a ilustração (ex.: "3 planos").
 */
export default function CartaoIlustrado({
  href,
  ilustracao,
  tom,
  titulo,
  texto,
  selo,
  mais = false,
  altura = "h-[124px]",
  logoUrl,
  nomeLogo,
}: {
  href: string;
  ilustracao: NomeIlustracao;
  tom: TomIlustracao;
  titulo: ReactNode;
  texto?: ReactNode;
  selo?: ReactNode;
  mais?: boolean;
  altura?: string;
  /** Logo enviada pelo professor: aparece no lugar da ilustração (ex.: logo da escola). */
  logoUrl?: string | null;
  nomeLogo?: string;
}) {
  return (
    <Link
      href={href}
      data-tom={tom}
      className="atalho-ilustrado group flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      <div className={`atalho-arte relative px-4 py-2.5 ${altura}`}>
        {logoUrl ? (
          <div className="flex h-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={nomeLogo ? `Logo de ${nomeLogo}` : "Logo da escola"} className="max-h-full max-w-[70%] rounded-xl bg-white object-contain p-2 shadow-sm" />
          </div>
        ) : (
          <Ilustracao nome={ilustracao} tom={tom} mais={mais} />
        )}
        {selo && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold shadow-sm [color:var(--tom)]">{selo}</span>
        )}
      </div>
      <div className="flex flex-1 items-start justify-between gap-3 p-4 pt-3">
        <div className="min-w-0">
          <p className="break-words text-base font-bold leading-snug text-slate-900">{titulo}</p>
          {texto && <p className="mt-0.5 text-sm leading-snug text-slate-600">{texto}</p>}
        </div>
        <span className="atalho-seta flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500" aria-hidden="true">
          <Icone nome="setaDireita" className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
