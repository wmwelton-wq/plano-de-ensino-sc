"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Icone } from "@/components/icones";
import { definirCalendario } from "./calendario/actions";

/** Convite (sem obrigação) para usar o calendário escolar. Só aparece enquanto o professor ainda não escolheu. */
export default function ConviteCalendario() {
  const [pendente, iniciar] = useTransition();
  return (
    <section aria-labelledby="convite-cal" className="painel-cartao flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm">
          <Icone nome="calendarioMes" className="h-6 w-6" />
        </span>
        <div>
          <h2 id="convite-cal" className="text-base font-extrabold text-slate-900">
            Quer uma agenda escolar aqui no painel?
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Feriados do Brasil e de Santa Catarina já vêm prontos. Você marca festas, projetos e jogos da escola, e vê quantas aulas cabem em cada mês. É opcional.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button type="button" disabled={pendente} onClick={() => iniciar(() => definirCalendario(true))} className="btn-azul">
          Sim, quero
        </button>
        <Link href="/dashboard/calendario" className="btn-azul-suave">
          Conhecer
        </Link>
        <button type="button" disabled={pendente} onClick={() => iniciar(() => definirCalendario(false))} className="btn-azul-suave">
          Agora não
        </button>
      </div>
    </section>
  );
}
