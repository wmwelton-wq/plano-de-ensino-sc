"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Icone } from "@/components/icones";
import { ROTULO_TIPO, rotuloPeriodo, type TipoEvento } from "@/lib/feriados";
import { salvarEventosEmLote, type CotaCalendarioIA } from "./actions";

interface EventoLido {
  titulo: string;
  tipo: TipoEvento;
  sem_aula: boolean;
  data_inicio: string;
  data_fim: string;
}

const LIMITE_BYTES = 4_000_000;

function dataBr(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "";
}

interface Props {
  escolas: { id: string; nome: string }[];
  /** Escola que está aberta no calendário (já vem marcada). */
  escolaPadrao: string;
  cota: CotaCalendarioIA | null;
  /** Depois de salvar, o calendário passa a mostrar a escola escolhida aqui. */
  aoSalvar: (escolaId: string) => void;
}

/** Envia o calendário em PDF, a IA lê, e o professor confere cada data antes de salvar. Cada PDF é de UMA escola. */
export default function ImportarCalendarioPdf({ escolas, escolaPadrao, cota, aoSalvar }: Props) {
  const [escolaId, setEscolaId] = useState(escolaPadrao || escolas[0]?.id || "");
  useEffect(() => {
    if (escolaPadrao) setEscolaId(escolaPadrao);
  }, [escolaPadrao]);
  const [restantes, setRestantes] = useState<number | null>(cota?.restantes ?? null);
  const esgotado = Boolean(cota && !cota.ilimitado && restantes !== null && restantes <= 0);
  const entrada = useRef<HTMLInputElement>(null);
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [lidos, setLidos] = useState<EventoLido[] | null>(null);
  const [marcados, setMarcados] = useState<Set<number>>(new Set());
  const [salvando, iniciar] = useTransition();
  const [feito, setFeito] = useState<string | null>(null);

  async function enviar(arquivo: File) {
    setErro(null);
    setFeito(null);
    if (arquivo.type !== "application/pdf" && !arquivo.name.toLowerCase().endsWith(".pdf")) {
      setErro("Escolha um arquivo em PDF.");
      return;
    }
    if (arquivo.size > LIMITE_BYTES) {
      setErro("O PDF é grande demais (máximo de 4 MB).");
      return;
    }
    if (!escolaId) {
      setErro("Escolha antes para qual escola é este calendário.");
      return;
    }
    setLendo(true);
    try {
      const corpo = new FormData();
      corpo.set("arquivo", arquivo);
      const resp = await fetch("/api/ia/calendario-pdf", { method: "POST", body: corpo });
      const dados = (await resp.json().catch(() => null)) as { ok?: boolean; erro?: string; eventos?: EventoLido[] } | null;
      if (!resp.ok || !dados?.ok) {
        setErro(dados?.erro ?? "Não foi possível ler o calendário agora.");
        return;
      }
      if (restantes !== null && !cota?.ilimitado) setRestantes(Math.max(0, restantes - 1));
      const eventos = dados.eventos ?? [];
      if (eventos.length === 0) setErro("Não encontrei datas nesse PDF. Você pode adicionar manualmente em “Adicionar data”.");
      if (eventos.length > 0) {
        setLidos(eventos);
        setMarcados(new Set(eventos.map((_, i) => i)));
      }
    } catch {
      setErro("Sem conexão. Verifique a internet e tente de novo.");
    } finally {
      setLendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  function salvar() {
    if (!lidos) return;
    const escolhidos = lidos.filter((_, i) => marcados.has(i));
    iniciar(async () => {
      const r = await salvarEventosEmLote(escolhidos, escolaId);
      if (r.erro) {
        setErro(r.erro);
        return;
      }
      const nome = escolas.find((e) => e.id === escolaId)?.nome ?? "a escola";
      setFeito(`${escolhidos.length} data(s) adicionada(s) ao calendário de ${nome}.`);
      setLidos(null);
      aoSalvar(escolaId);
    });
  }

  return (
    <section aria-labelledby="pdf-cal" className="painel-cartao p-4 sm:p-5">
      <h2 id="pdf-cal" className="flex items-center gap-2 text-base font-extrabold text-slate-900">
        <Icone nome="sparkle" className="h-5 w-5 text-violet-600" />
        Tem o calendário da escola em PDF?
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Envie o PDF de <strong>uma escola</strong> e a IA monta as datas para você conferir (até <strong>4 páginas</strong>). Nada é salvo sem a sua confirmação. Prefere não usar a IA? Adicione as datas à mão em “Adicionar data”, quantas quiser.
      </p>
      <p className="mt-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-900">
        {cota?.ilimitado
          ? "Seu acesso não tem limite de envios com IA."
          : !cota
          ? "Não consegui conferir quantos envios com IA você ainda tem agora."
          : cota.periodo === "primeiro_mes"
          ? `No seu primeiro mês de uso você pode enviar até ${cota.limite} calendários com IA (um por escola). Restam ${restantes ?? cota.restantes}.`
          : `Depois do primeiro mês, são 1 calendário com IA por mês. ${esgotado ? "Neste mês você já usou o seu" : "Neste mês você ainda tem 1 envio"}${esgotado && cota.liberacao ? `; novo envio liberado em ${dataBr(cota.liberacao)}` : ""}.`}
        {esgotado ? " Enquanto isso, cadastre as datas manualmente." : ""}
      </p>

      {escolas.length === 0 ? (
        <p className="mt-3 text-sm text-slate-700">
          Para enviar um calendário, cadastre antes a escola dele.{" "}
          <Link href="/dashboard/escolas/nova" className="font-bold text-primary-700 underline">
            Cadastrar escola
          </Link>
        </p>
      ) : (
        !lidos && (
          <div className="mt-3 space-y-3">
            <div className="max-w-md">
              <label htmlFor="pdf-escola" className="field-label">
                Este calendário é de qual escola?
              </label>
              <select id="pdf-escola" value={escolaId} onChange={(ev) => setEscolaId(ev.target.value)} className="input-field">
                {escolas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
            <input ref={entrada} id="pdf-calendario" type="file" accept="application/pdf,.pdf" className="sr-only" disabled={esgotado} onChange={(e) => e.target.files?.[0] && enviar(e.target.files[0])} />
            <label htmlFor="pdf-calendario" className={`btn-azul cursor-pointer ${lendo || esgotado ? "pointer-events-none opacity-60" : ""}`}>
              {lendo ? "Lendo o calendário…" : "Escolher PDF do calendário"}
            </label>
          </div>
        )
      )}

      {erro && (
        <p role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {erro}
        </p>
      )}
      {feito && (
        <p role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {feito}
        </p>
      )}

      {lidos && lidos.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">Confira as datas que encontrei (serão salvas no calendário de {escolas.find((e) => e.id === escolaId)?.nome ?? "da escola"}) e desmarque o que não quiser:</p>
          <ul className="max-h-80 space-y-1.5 overflow-y-auto rounded-2xl border border-slate-200 p-2">
            {lidos.map((e, i) => (
              <li key={`${e.titulo}-${e.data_inicio}-${i}`}>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={marcados.has(i)}
                    onChange={() =>
                      setMarcados((atual) => {
                        const novo = new Set(atual);
                        if (novo.has(i)) novo.delete(i);
                        else novo.add(i);
                        return novo;
                      })
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600"
                  />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-bold text-slate-900">{e.titulo}</span>
                    <span className="block text-xs text-slate-500">
                      {rotuloPeriodo(e.data_inicio, e.data_fim)} · {ROTULO_TIPO[e.tipo]}
                      {e.sem_aula ? " · sem aula" : ""}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={salvar} disabled={salvando || marcados.size === 0} className="btn-azul">
              {salvando ? "Salvando…" : `Adicionar ${marcados.size} data(s)`}
            </button>
            <button type="button" onClick={() => setLidos(null)} className="btn-azul-suave">
              Descartar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
