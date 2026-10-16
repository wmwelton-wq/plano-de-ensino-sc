"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icone, type NomeIcone } from "@/components/icones";

export const CHAVE_TUTORIAL = "plano-docente:tutorial-visto";

const PASSOS = [
  { icone: "sparkle" as NomeIcone, tom: "azul", titulo: "Bem-vindo(a)!", texto: "Em 4 passos rápidos você vê como montar seus planos. Leva menos de um minuto.", href: null as string | null, link: "" },
  { icone: "escola" as NomeIcone, tom: "ambar", titulo: "1. Cadastre sua escola", texto: "O nome, o município e a logo aparecem no cabeçalho dos planos.", href: "/dashboard/escolas/nova", link: "Cadastrar escola" },
  { icone: "calendario" as NomeIcone, tom: "azul", titulo: "2. Faça o plano anual", texto: "Uma vez por ano: marque habilidades e objetos de conhecimento de cada trimestre.", href: "/dashboard/anual/novo", link: "Cadastrar plano anual" },
  { icone: "livro" as NomeIcone, tom: "verde", titulo: "3. Gere os mensais e baixe", texto: "No plano anual, “Gerar planos mensais” faz o trabalho pesado. Depois é só baixar em PDF ou Word.", href: null, link: "" },
];

/** Passo a passo de primeiro acesso: aparece uma vez; depois pode ser revisto em Ajuda. */
export default function TutorialInicial() {
  const [aberto, setAberto] = useState(false);
  const [passo, setPasso] = useState(0);
  const botao = useRef<HTMLButtonElement>(null);
  const forcar = useSearchParams().get("tutorial") === "1";

  useEffect(() => {
    let visto = false;
    try {
      visto = window.localStorage.getItem(CHAVE_TUTORIAL) === "1";
    } catch {
      visto = true; // sem armazenamento: não insistimos a cada visita
    }
    if (forcar || !visto) setAberto(true);
  }, [forcar]);

  useEffect(() => {
    if (aberto) botao.current?.focus();
  }, [aberto, passo]);

  function fechar() {
    try {
      window.localStorage.setItem(CHAVE_TUTORIAL, "1");
    } catch {
      /* ignora */
    }
    setAberto(false);
    setPasso(0);
  }

  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aberto]);

  if (!aberto) return null;
  const p = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center print:hidden" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="tutorial-titulo" className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden="true">
            {PASSOS.map((_, i) => (
              <span key={i} className={`h-2 w-6 rounded-full ${i <= passo ? "bg-primary-600" : "bg-slate-200"}`} />
            ))}
          </div>
          <button type="button" onClick={fechar} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
            Pular
          </button>
        </div>
        <div className="mt-5 text-center">
          <div data-tom={p.tom} className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl [background:var(--tom-claro)] [color:var(--tom)]" aria-hidden="true">
            <Icone nome={p.icone} className="h-8 w-8" />
          </div>
          <h2 id="tutorial-titulo" className="mt-3 text-xl font-bold text-slate-900">
            {p.titulo}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{p.texto}</p>
          {p.href && (
            <Link href={p.href} onClick={fechar} className="link-primary mt-3 inline-block text-sm font-semibold">
              {p.link} →
            </Link>
          )}
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" disabled={passo === 0} onClick={() => setPasso((n) => n - 1)} className="btn-azul-suave disabled:invisible">
            Voltar
          </button>
          <button ref={botao} type="button" onClick={() => (ultimo ? fechar() : setPasso((n) => n + 1))} className="btn-azul">
            {ultimo ? "Começar" : "Próximo"}
          </button>
        </div>
      </div>
    </div>
  );
}
