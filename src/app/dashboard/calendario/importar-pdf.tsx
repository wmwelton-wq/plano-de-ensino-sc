"use client";

import { useRef, useState, useTransition } from "react";
import { Icone } from "@/components/icones";
import { ROTULO_TIPO, rotuloPeriodo, type TipoEvento } from "@/lib/feriados";
import { salvarEventosEmLote } from "./actions";

interface EventoLido {
  titulo: string;
  tipo: TipoEvento;
  sem_aula: boolean;
  data_inicio: string;
  data_fim: string;
}

const LIMITE_BYTES = 4_000_000;

/** Envia o calendário em PDF, a IA lê, e o professor confere cada data antes de salvar. */
export default function ImportarCalendarioPdf() {
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
      const r = await salvarEventosEmLote(escolhidos);
      if (r.erro) {
        setErro(r.erro);
        return;
      }
      setFeito(`${escolhidos.length} data(s) adicionada(s) ao seu calendário.`);
      setLidos(null);
    });
  }

  return (
    <section aria-labelledby="pdf-cal" className="painel-cartao p-4 sm:p-5">
      <h2 id="pdf-cal" className="flex items-center gap-2 text-base font-extrabold text-slate-900">
        <Icone nome="sparkle" className="h-5 w-5 text-violet-600" />
        Tem o calendário da escola em PDF?
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Envie o PDF e a IA monta as datas para você conferir. Até <strong>4 páginas</strong> e <strong>um envio a cada 3 meses</strong>. Nada é salvo sem a sua confirmação.
      </p>

      {!lidos && (
        <div className="mt-3">
          <input ref={entrada} id="pdf-calendario" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && enviar(e.target.files[0])} />
          <label htmlFor="pdf-calendario" className={`btn-azul cursor-pointer ${lendo ? "pointer-events-none opacity-60" : ""}`}>
            {lendo ? "Lendo o calendário…" : "Escolher PDF do calendário"}
          </label>
        </div>
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
          <p className="text-sm font-semibold text-slate-700">Confira as datas que encontrei e desmarque o que não quiser:</p>
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
