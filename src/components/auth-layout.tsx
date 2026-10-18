import type { ReactNode } from "react";
import AuthTopo from "@/components/auth-topo";
import { Icone } from "@/components/icones";
import { Ilustracao, type NomeIlustracao, type TomIlustracao } from "@/components/ilustracoes";

/**
 * Moldura das telas de entrada (login, cadastro, senha): painel ilustrado ao lado do formulário
 * em telas grandes e uma ilustração menor acima do formulário no celular. Não tem lógica própria.
 */
export default function AuthLayout({
  children,
  voltarHref,
  voltarRotulo,
  ilustracao,
  tom = "azul",
  titulo,
  texto,
  topicos,
}: {
  children: ReactNode;
  voltarHref: string;
  voltarRotulo: string;
  ilustracao: NomeIlustracao;
  tom?: TomIlustracao;
  titulo: string;
  texto: string;
  topicos: string[];
}) {
  return (
    <main className="relative min-h-screen overflow-hidden fundo-auth px-4 py-8 sm:px-6 sm:py-12">
      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-6">
        <aside data-tom={tom} className="hero-painel painel-entra hidden flex-col justify-between p-8 lg:flex lg:min-h-[560px]">
          <div className="relative">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900">{titulo}</h2>
            <p className="mt-3 max-w-sm text-base leading-relaxed text-slate-600">{texto}</p>
          </div>
          <div className="relative mx-auto my-4 h-56 w-full max-w-sm">
            <Ilustracao nome={ilustracao} tom={tom} />
          </div>
          <ul className="relative space-y-2.5">
            {topicos.map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white" aria-hidden="true">
                  <Icone nome="check" className="h-3.5 w-3.5" espessura={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </aside>

        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <AuthTopo voltarHref={voltarHref} voltarRotulo={voltarRotulo} />
          <div data-tom={tom} className="mx-auto -mt-2 mb-4 h-24 w-40 lg:hidden" aria-hidden="true">
            <Ilustracao nome={ilustracao} tom={tom} />
          </div>
          <div className="mx-auto w-full lg:max-w-md">{children}</div>
        </div>
      </div>
    </main>
  );
}
