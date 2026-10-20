"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icone } from "@/components/icones";
import ConfirmarExclusao from "@/components/confirmar-exclusao";
import { gerarPdfDoElemento } from "@/lib/gerar-pdf";
import { gerarWordDoElemento } from "@/lib/gerar-word";
import { baixarArquivo } from "@/lib/baixar-arquivo";
import { definirStatusPlano } from "../../actions";
import CompartilharLink from "./compartilhar-link";

interface Props {
  planoId: string;
  titulo: string;
  paisagem: boolean;
  statusInicial: string;
  /** Caminho do formulário de novo plano da mesma etapa (ex.: /dashboard/planos/novo/medio-tecnico). */
  novoPlanoHref: string;
  excluirAction: () => Promise<void>;
  /** Quantos itens do plano ficaram em branco (o aviso detalhado aparece no fim da página). */
  faltam?: number;
}

/**
 * Tela de conclusão: aparece por cima do plano logo depois de "Concluir plano". Reúne tudo o que o professor costuma
 * querer fazer a seguir (marcar como finalizado, baixar, imprimir, copiar para outras turmas, encaminhar a outro
 * professor, começar um novo plano mensal) sem precisar procurar em outras páginas.
 */
export default function ConclusaoPlano({ planoId, titulo, paisagem, statusInicial, novoPlanoHref, excluirAction, faltam = 0 }: Props) {
  const [aberto, setAberto] = useState(true);
  const [status, setStatus] = useState(statusInicial === "finalizado" ? "finalizado" : "rascunho");
  const [ocupado, setOcupado] = useState<"status" | "pdf" | "word" | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [encaminhar, setEncaminhar] = useState(false);
  const orientacao = paisagem ? "paisagem" : "retrato";

  useEffect(() => {
    if (!aberto) return;
    const tecla = (ev: KeyboardEvent) => ev.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aberto]);

  async function mudarStatus(novo: "rascunho" | "finalizado") {
    setOcupado("status");
    const r = await definirStatusPlano(planoId, novo);
    setOcupado(null);
    if (r.erro) setMensagem(r.erro);
    else {
      setStatus(novo);
      setMensagem(novo === "finalizado" ? "Plano marcado como finalizado." : "Plano voltou para rascunho.");
    }
  }

  async function baixar(tipo: "pdf" | "word") {
    setOcupado(tipo);
    setMensagem(tipo === "pdf" ? "Gerando PDF..." : "Gerando documento Word...");
    try {
      const arquivo = tipo === "pdf" ? await gerarPdfDoElemento("plano-conteudo", titulo, orientacao) : await gerarWordDoElemento("plano-conteudo", titulo, orientacao);
      baixarArquivo(arquivo);
      setMensagem(tipo === "pdf" ? "PDF baixado." : "Documento Word baixado.");
    } catch (erro) {
      console.error(erro);
      setMensagem("Não foi possível gerar o arquivo. Tente novamente.");
    } finally {
      setOcupado(null);
    }
  }

  if (!aberto) {
    return (
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-end px-4 print:hidden">
        <button type="button" onClick={() => setAberto(true)} className="btn-azul">
          <Icone nome="check" className="h-4 w-4" />
          Opções do plano
        </button>
      </div>
    );
  }

  const finalizado = status === "finalizado";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-slate-900/55 p-3 backdrop-blur-sm sm:items-center print:hidden" role="presentation" onClick={() => setAberto(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="conclusao-titulo"
        onClick={(ev) => ev.stopPropagation()}
        className="my-auto w-full max-w-2xl space-y-4 rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm" aria-hidden="true">
            <Icone nome="check" className="h-6 w-6" espessura={2.6} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="conclusao-titulo" className="text-xl font-extrabold text-slate-900">
              Plano salvo!
            </h2>
            <p className="truncate text-sm text-slate-600">{titulo}</p>
          </div>
          <button type="button" onClick={() => setAberto(false)} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800">
            Fechar
          </button>
        </div>

        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${finalizado ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <p className="text-sm">
            Situação do plano: <strong className={finalizado ? "text-emerald-800" : "text-amber-800"}>{finalizado ? "Finalizado" : "Rascunho"}</strong>
          </p>
          {finalizado ? (
            <button type="button" onClick={() => mudarStatus("rascunho")} disabled={ocupado === "status"} className="btn-azul-suave !px-3 !py-1.5 !text-xs">
              Voltar para rascunho
            </button>
          ) : (
            <button type="button" onClick={() => mudarStatus("finalizado")} disabled={ocupado === "status"} className="btn-azul">
              <Icone nome="check" className="h-4 w-4" />
              {ocupado === "status" ? "Salvando..." : "Salvar como finalizado"}
            </button>
          )}
        </div>

        {faltam > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <Icone nome="alerta" className="h-4 w-4 shrink-0" />
              Faltou preencher {faltam === 1 ? "1 item" : `${faltam} itens`} neste plano.
            </p>
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                window.setTimeout(() => document.getElementById("o-que-falta")?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
              }}
              className="btn-azul-suave !px-3 !py-1.5 !text-xs"
            >
              Ver o que falta
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => setAberto(false)} className="btn-azul-suave justify-start">
            <Icone nome="olho" className="h-4 w-4" />
            Visualizar plano
          </button>
          <button type="button" onClick={() => baixar("pdf")} disabled={ocupado !== null} className="btn-azul justify-start">
            <Icone nome="baixar" className="h-4 w-4" />
            {ocupado === "pdf" ? "Gerando PDF..." : "Baixar PDF"}
          </button>
          <button type="button" onClick={() => baixar("word")} disabled={ocupado !== null} className="btn-azul-suave justify-start">
            <Icone nome="documento" className="h-4 w-4" />
            {ocupado === "word" ? "Gerando Word..." : "Baixar Word"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAberto(false);
              window.setTimeout(() => window.print(), 150);
            }}
            className="btn-azul-suave justify-start"
          >
            <Icone nome="imprimir" className="h-4 w-4" />
            Imprimir
          </button>
          <Link href={`/dashboard/planos/${planoId}/replicar`} className="btn-secondary justify-start !py-2">
            <Icone nome="copiar" className="h-4 w-4" />
            Copiar para outras turmas
          </Link>
          <button type="button" onClick={() => setEncaminhar((v) => !v)} aria-expanded={encaminhar} className="btn-azul-suave justify-start">
            <Icone nome="envelope" className="h-4 w-4" />
            Encaminhar para outro professor
          </button>
        </div>

        {encaminhar && <CompartilharLink tipo="mensal" planoId={planoId} titulo={titulo} paisagem={paisagem} semBotao />}

        <div className="rounded-2xl border border-primary-200 bg-primary-50/70 p-4">
          <p className="text-sm font-bold text-primary-900">Tem outras turmas?</p>
          <p className="mt-0.5 text-xs text-slate-600">Cadastre agora outro plano mensal, sem voltar ao início.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={novoPlanoHref} className="btn-azul">
              <Icone nome="mais" className="h-4 w-4" />
              Cadastrar novo plano mensal
            </Link>
            <Link href={`/dashboard/planos/${planoId}`} className="btn-azul-suave">
              <Icone nome="lapis" className="h-4 w-4" />
              Continuar editando
            </Link>
            <Link href="/dashboard/meus-planos/mensais" className="btn-azul-suave">
              Ver meus planos
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <ConfirmarExclusao excluirAction={excluirAction} rotulo="Excluir plano" oQue="este plano de ensino" />
          {mensagem && (
            <p role="status" className="text-xs font-semibold text-primary-700">
              {mensagem}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
