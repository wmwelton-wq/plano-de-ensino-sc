"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icone, type NomeIcone } from "@/components/icones";
import { CHAVE_BAIXOU, CHAVE_PASSOS_OCULTOS } from "@/lib/primeiros-passos";

interface Props {
  temEscola: boolean;
  temAnual: boolean;
  temMensal: boolean;
  temFinalizado: boolean;
}

/**
 * Lista curta de primeiros passos no painel: vai marcando sozinha o que já foi feito e some quando tudo estiver
 * pronto (ou se o professor preferir ocultar). "Baixar o PDF" é marcado no próprio navegador quando um arquivo é baixado.
 */
export default function PrimeirosPassos({ temEscola, temAnual, temMensal, temFinalizado }: Props) {
  const [pronto, setPronto] = useState(false);
  const [baixou, setBaixou] = useState(false);
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    try {
      setBaixou(window.localStorage.getItem(CHAVE_BAIXOU) === "1");
      setOculto(window.localStorage.getItem(CHAVE_PASSOS_OCULTOS) === "1");
    } catch {
      /* sem armazenamento: mostra a lista normalmente */
    }
    setPronto(true);
  }, []);

  const itens: { chave: string; icone: NomeIcone; titulo: string; texto: string; href: string; link: string; feito: boolean }[] = [
    { chave: "escola", icone: "escola", titulo: "Cadastre sua escola", texto: "Nome, município e logo aparecem no cabeçalho dos planos.", href: "/dashboard/escolas/nova?voltar=%2Fdashboard", link: "Cadastrar escola", feito: temEscola },
    { chave: "anual", icone: "calendario", titulo: "Faça o plano anual", texto: "Marque as habilidades e os objetos de conhecimento de cada trimestre.", href: "/dashboard/anual/novo", link: "Criar plano anual", feito: temAnual },
    { chave: "mensal", icone: "livro", titulo: "Crie o primeiro plano mensal", texto: "Do zero ou gerado a partir do plano anual.", href: "/dashboard/planos/novo", link: "Criar plano mensal", feito: temMensal },
    { chave: "final", icone: "check", titulo: "Finalize um plano", texto: "Marque como finalizado quando estiver pronto.", href: "/dashboard/meus-planos", link: "Ver meus planos", feito: temFinalizado },
    { chave: "pdf", icone: "baixar", titulo: "Baixe o PDF", texto: "Abra um plano e use “Baixar PDF” ou “Baixar Word”.", href: "/dashboard/meus-planos", link: "Escolher um plano", feito: baixou },
  ];
  const feitos = itens.filter((i) => i.feito).length;

  if (!pronto || oculto || feitos === itens.length) return null;

  const proximo = itens.find((i) => !i.feito);

  function ocultar() {
    try {
      window.localStorage.setItem(CHAVE_PASSOS_OCULTOS, "1");
    } catch {
      /* ignora */
    }
    setOculto(true);
  }

  return (
    <section aria-labelledby="primeiros-passos" className="painel-cartao p-5 sm:p-6 print:hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="primeiros-passos" className="text-lg font-extrabold text-slate-900">
            Primeiros passos
          </h2>
          <p className="text-sm text-slate-600">
            {feitos} de {itens.length} feitos. Sem pressa: dá para fazer aos poucos.
          </p>
        </div>
        <button type="button" onClick={ocultar} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
          Ocultar
        </button>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={itens.length} aria-valuenow={feitos} aria-label="Primeiros passos concluídos">
        <span className="block h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500 transition-all" style={{ width: `${(feitos / itens.length) * 100}%` }} />
      </div>

      <ol className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        {itens.map((i) => (
          <li
            key={i.chave}
            className={`flex flex-col rounded-2xl border p-3.5 ${
              i.feito ? "border-emerald-200 bg-emerald-50/60" : i === proximo ? "border-primary-300 bg-primary-50/60 ring-1 ring-primary-200" : "border-slate-200 bg-white"
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${i.feito ? "bg-emerald-500" : "bg-gradient-to-br from-blue-500 to-indigo-500"}`}
              aria-hidden="true"
            >
              <Icone nome={i.feito ? "check" : i.icone} className="h-5 w-5" />
            </span>
            <p className="mt-2.5 text-sm font-extrabold text-slate-900">{i.titulo}</p>
            <p className="mt-0.5 flex-1 text-xs leading-relaxed text-slate-600">{i.texto}</p>
            {i.feito ? (
              <span className="mt-2 text-xs font-bold text-emerald-700">Feito</span>
            ) : (
              <Link href={i.href} className="link-primary mt-2 inline-flex items-center gap-1 text-xs font-bold">
                {i.link}
                <Icone nome="setaDireita" className="h-3.5 w-3.5" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
