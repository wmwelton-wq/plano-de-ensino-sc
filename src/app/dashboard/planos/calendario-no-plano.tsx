"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { Icone } from "@/components/icones";
import { contarAulas, datasOficiais, resumirPeriodo, rotuloPeriodo, type EventoCalendario } from "@/lib/feriados";
import { useHorarioAulas } from "@/lib/use-horario-aulas";
import { eventosDoPeriodo } from "../calendario/actions";
import type { EditorTextoRicoHandle } from "./editor-texto-rico";

interface Props {
  /** Elemento dentro do formulário do plano (para ler as datas de início e fim). */
  raiz: RefObject<HTMLElement | null>;
  editorRef?: RefObject<EditorTextoRicoHandle | null>;
}

type EventoSimples = Pick<EventoCalendario, "id" | "titulo" | "tipo" | "sem_aula" | "data_inicio" | "data_fim">;

interface Item {
  chave: string;
  titulo: string;
  inicio: string;
  fim: string;
  semAula: boolean;
  oficial: boolean;
}

function dm(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/**
 * Ajuda opcional no plano: mostra quantas aulas cabem no período e deixa o professor escolher quais datas do calendário
 * acrescentar ao caminho metodológico. Só aparece se ele ligou o calendário e preencheu as datas do plano.
 */
export default function CalendarioNoPlano({ raiz, editorRef }: Props) {
  const [periodo, setPeriodo] = useState<{ inicio: string; fim: string } | null>(null);
  const [eventos, setEventos] = useState<EventoSimples[] | null>(null);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [aviso, setAviso] = useState<string | null>(null);
  const [horario] = useHorarioAulas();
  const tempo = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Acompanha as datas do plano (campos data_inicio e data_fim do formulário).
  useEffect(() => {
    const form = raiz.current?.closest("form");
    if (!form) return;
    const ler = () => {
      const i = (form.elements.namedItem("data_inicio") as HTMLInputElement | null)?.value ?? "";
      const f = (form.elements.namedItem("data_fim") as HTMLInputElement | null)?.value ?? "";
      setPeriodo(i && f && f >= i ? { inicio: i, fim: f } : null);
    };
    const aoMudar = (e: Event) => {
      const nome = (e.target as HTMLInputElement | null)?.name;
      if (nome !== "data_inicio" && nome !== "data_fim") return;
      if (tempo.current) clearTimeout(tempo.current);
      tempo.current = setTimeout(ler, 300);
    };
    ler();
    form.addEventListener("change", aoMudar);
    form.addEventListener("input", aoMudar);
    return () => {
      form.removeEventListener("change", aoMudar);
      form.removeEventListener("input", aoMudar);
      if (tempo.current) clearTimeout(tempo.current);
    };
  }, [raiz]);

  useEffect(() => {
    let cancelado = false;
    setAviso(null);
    if (!periodo) {
      setEventos(null);
      return;
    }
    eventosDoPeriodo(periodo.inicio, periodo.fim)
      .then((r) => {
        if (cancelado) return;
        setEventos(r.ativo ? r.eventos : null);
        setMarcados(new Set());
      })
      .catch(() => !cancelado && setEventos(null));
    return () => {
      cancelado = true;
    };
  }, [periodo]);

  const { itens, resumo, aulas } = useMemo(() => {
    if (!periodo || !eventos) return { itens: [] as Item[], resumo: null, aulas: 0 };
    const lista: Item[] = [];
    for (const o of datasOficiais(Number(periodo.inicio.slice(0, 4))).concat(periodo.fim.slice(0, 4) !== periodo.inicio.slice(0, 4) ? datasOficiais(Number(periodo.fim.slice(0, 4))) : [])) {
      if (o.data >= periodo.inicio && o.data <= periodo.fim && (o.natureza === "feriado" || o.semAula)) {
        lista.push({ chave: `o-${o.data}-${o.titulo}`, titulo: o.titulo, inicio: o.data, fim: o.data, semAula: o.semAula, oficial: true });
      }
    }
    for (const e of eventos) {
      lista.push({
        chave: `e-${e.id}`,
        titulo: e.titulo,
        inicio: e.data_inicio < periodo.inicio ? periodo.inicio : e.data_inicio,
        fim: e.data_fim > periodo.fim ? periodo.fim : e.data_fim,
        semAula: e.sem_aula,
        oficial: false,
      });
    }
    lista.sort((a, b) => a.inicio.localeCompare(b.inicio));
    const evs = eventos as EventoCalendario[];
    return { itens: lista, resumo: resumirPeriodo(periodo.inicio, periodo.fim, evs), aulas: contarAulas(periodo.inicio, periodo.fim, evs, horario) };
  }, [periodo, eventos, horario]);

  if (!periodo || !eventos || !resumo) return null;

  function alternar(chave: string) {
    setMarcados((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });
  }

  function acrescentar() {
    const linhas = itens
      .filter((i) => marcados.has(i.chave))
      .map((i) => {
        const quando = i.inicio === i.fim ? dm(i.inicio) : `${dm(i.inicio)} a ${dm(i.fim)}`;
        return i.semAula ? `Sem aula (${quando}): ${i.titulo}.` : `Na escola (${quando}): ${i.titulo}.`;
      });
    if (linhas.length === 0) {
      setAviso("Marque ao menos uma data.");
      return;
    }
    if (!editorRef?.current) {
      setAviso("Não foi possível acrescentar agora.");
      return;
    }
    editorRef.current.anexar(linhas, "paragrafos");
    setMarcados(new Set());
    setAviso(`${linhas.length} item(ns) acrescentado(s) ao final do caminho metodológico. Edite como quiser.`);
  }

  return (
    <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4" aria-label="Calendário do período do plano">
      <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-blue-900">
        <Icone nome="calendarioMes" className="h-4 w-4" />
        Seu calendário neste período ({rotuloPeriodo(periodo.inicio, periodo.fim)})
      </p>
      <p className="text-sm text-slate-700">
        <strong>{resumo.diasLetivos}</strong> dias letivos · <strong>{aulas}</strong> {aulas === 1 ? "aula" : "aulas"} com os seus dias de aula.{" "}
        <Link href="/dashboard/calendario" className="font-semibold text-primary-700 underline" target="_blank">
          Ajustar no calendário
        </Link>
      </p>
      {itens.length > 0 ? (
        <>
          <p className="text-xs text-slate-600">Quer citar alguma data no plano? Marque e acrescente ao caminho metodológico (é opcional).</p>
          <ul className="space-y-1">
            {itens.map((i) => (
              <li key={i.chave}>
                <label className="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1 text-sm hover:bg-white/70">
                  <input type="checkbox" checked={marcados.has(i.chave)} onChange={() => alternar(i.chave)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600" />
                  <span>
                    <span className="font-semibold text-slate-900">{i.titulo}</span>{" "}
                    <span className="text-xs text-slate-500">
                      {rotuloPeriodo(i.inicio, i.fim)}
                      {i.semAula ? " · sem aula" : ""}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <button type="button" onClick={acrescentar} className="btn-azul-suave">
            Acrescentar ao caminho metodológico
          </button>
        </>
      ) : (
        <p className="text-xs text-slate-600">Nenhuma data especial neste período.</p>
      )}
      {aviso && (
        <p role="status" className="text-sm font-semibold text-blue-900">
          {aviso}
        </p>
      )}
    </div>
  );
}
