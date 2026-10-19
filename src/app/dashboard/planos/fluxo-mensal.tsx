"use client";

import { startTransition, useActionState, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Icone, type NomeIcone } from "@/components/icones";
import FluxoPassos, { type GrupoFluxo } from "../anual/fluxo-passos";
import type { TomSecao } from "./secao-plano";
import { atualizarPlano, salvarRascunhoPlano, type EstadoFormulario, type ResultadoGravacao } from "./actions";

const SEGUNDOS_AUTOSSALVAR = 4;

function primeiroInvalidoVisivel(form: HTMLFormElement): HTMLInputElement | null {
  for (const el of Array.from(form.elements)) {
    const c = el as HTMLInputElement;
    if (typeof c.checkValidity === "function" && !c.checkValidity() && c.offsetParent !== null) return c;
  }
  return null;
}

/**
 * Tudo o que o professor faz no plano vai sendo guardado: a cada "Salvar e continuar", ao ficar alguns segundos
 * sem mexer e ao sair da tela. O primeiro salvamento cria o plano (rascunho) e os seguintes atualizam o mesmo.
 * O envio final também NÃO limpa os campos se der algum erro (o formulário não é reiniciado).
 */
export function useGravacaoPlano(
  action: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>,
  planoIdInicial?: string
) {
  const formRef = useRef<HTMLFormElement>(null);
  const idRef = useRef<string | null>(planoIdInicial ?? null);
  const sujo = useRef(false);
  const emVoo = useRef<Promise<ResultadoGravacao> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvoEm, setSalvoEm] = useState<Date | null>(null);
  const [avisoAuto, setAvisoAuto] = useState<string | null>(null);

  const acaoFinal = useCallback(
    async (anterior: EstadoFormulario, fd: FormData) => (idRef.current ? atualizarPlano(idRef.current, anterior, fd) : action(anterior, fd)),
    [action]
  );
  const [estado, formAction, pendente] = useActionState(acaoFinal, {});

  const gravar = useCallback(async (): Promise<ResultadoGravacao> => {
    const form = formRef.current;
    if (!form) return { erro: "Não foi possível salvar agora." };
    while (emVoo.current) await emVoo.current.catch(() => null);
    const dados = new FormData(form);
    const p = salvarRascunhoPlano(idRef.current, dados);
    emVoo.current = p;
    setSalvando(true);
    try {
      const r = await p;
      if (r.id) {
        if (!idRef.current) {
          idRef.current = r.id;
          try {
            window.history.replaceState(window.history.state, "", `/dashboard/planos/${r.id}`);
          } catch {
            /* sem problema: só muda o endereço mostrado */
          }
        }
        sujo.current = false;
        setSalvoEm(new Date());
        setAvisoAuto(null);
      }
      return r;
    } catch {
      return { erro: "Sem conexão. Verifique a internet e tente de novo." };
    } finally {
      emVoo.current = null;
      setSalvando(false);
    }
  }, []);

  const autosalvar = useCallback(async () => {
    if (!sujo.current || pendente) return;
    const r = await gravar();
    if (r.erro) setAvisoAuto(`Ainda não salvo: ${r.erro}`);
  }, [gravar, pendente]);

  const agendar = useCallback(() => {
    sujo.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void autosalvar(), SEGUNDOS_AUTOSSALVAR * 1000);
  }, [autosalvar]);

  useEffect(() => {
    const aoSair = () => {
      if (document.visibilityState === "hidden" && sujo.current) void autosalvar();
    };
    const aviso = (e: BeforeUnloadEvent) => {
      if (sujo.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", aoSair);
    window.addEventListener("beforeunload", aviso);
    return () => {
      document.removeEventListener("visibilitychange", aoSair);
      window.removeEventListener("beforeunload", aviso);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [autosalvar]);

  /** "Salvar e continuar": confere os campos deste passo, guarda tudo e devolve se deu certo. */
  async function salvarPasso(): Promise<{ ok: boolean; erro?: string }> {
    const form = formRef.current;
    if (form) {
      const invalido = primeiroInvalidoVisivel(form);
      if (invalido) {
        invalido.reportValidity();
        return { ok: false };
      }
    }
    if (timer.current) clearTimeout(timer.current);
    const r = await gravar();
    if (r.erro) return { ok: false, erro: r.erro };
    return { ok: true };
  }

  const formProps = {
    ref: formRef,
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      sujo.current = false;
      if (timer.current) clearTimeout(timer.current);
      const fd = new FormData(e.currentTarget);
      startTransition(() => formAction(fd));
    },
    onChange: agendar,
    onInput: agendar,
  };

  return { formProps, estado, pendente, salvando, salvoEm, avisoAuto, salvarPasso, autosalvarSeSujo: autosalvar };
}

/** Um passo do plano mensal: pertence a um grupo (a faixa de cima) e mostra uma seção de cada vez. */
export interface PassoMensal {
  chave: string;
  rotulo: string;
  grupo: string;
  grupoRotulo: string;
  grupoTom: TomSecao;
  grupoIcone: NomeIcone;
  tom: TomSecao;
  /** Passo que pode ficar em branco (aparece com a etiqueta "opcional"). */
  opcional?: boolean;
}

/**
 * Controle do plano mensal passo a passo: guarda o passo atual e quais já foram vistos. Os campos de TODOS os
 * passos continuam na página (os que não estão na vez ficam escondidos), por isso nada do que o professor
 * escreveu se perde ao trocar de passo e tudo é enviado ao salvar.
 */
export function useFluxoMensal(passos: PassoMensal[]) {
  const [bruto, setBruto] = useState(passos[0]?.chave ?? "");
  const [vistos, setVistos] = useState<Set<string>>(() => new Set());
  const atual = passos.some((p) => p.chave === bruto) ? bruto : passos[0]?.chave ?? "";
  const indice = Math.max(
    0,
    passos.findIndex((p) => p.chave === atual)
  );
  const topo = useRef<HTMLDivElement>(null);
  const primeira = useRef(true);

  function ir(chave: string) {
    setVistos((v) => (v.has(atual) ? v : new Set(v).add(atual)));
    setBruto(chave);
  }

  // Ao trocar de passo, volta ao início do formulário (menos na primeira exibição da tela).
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    topo.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [atual]);

  return {
    atual,
    indice,
    topo,
    vistos,
    ir,
    avancar: () => indice < passos.length - 1 && ir(passos[indice + 1].chave),
    voltar: () => indice > 0 && ir(passos[indice - 1].chave),
    ultimo: indice === passos.length - 1,
  };
}

/** Faixa de cima: grupos (Identificação, uma etiqueta por componente...) e, embaixo, os passos do grupo atual. */
export function FluxoTopo({
  passos,
  atual,
  vistos,
  aoIr,
  topo,
}: {
  passos: PassoMensal[];
  atual: string;
  vistos: Set<string>;
  aoIr: (chave: string) => void;
  topo: RefObject<HTMLDivElement | null>;
}) {
  const grupos = useMemo<GrupoFluxo[]>(() => {
    const out: GrupoFluxo[] = [];
    for (const p of passos) {
      let g = out.find((x) => x.id === p.grupo);
      if (!g) {
        g = { id: p.grupo, rotulo: p.grupoRotulo, tom: p.grupoTom, icone: p.grupoIcone, passos: [] };
        out.push(g);
      }
      g.passos.push({ chave: p.chave, rotulo: p.rotulo, feito: vistos.has(p.chave) && p.chave !== atual, tom: p.tom, opcional: p.opcional });
    }
    return out;
  }, [passos, vistos, atual]);

  return (
    <div ref={topo} className="scroll-mt-20">
      <FluxoPassos grupos={grupos} atual={atual} aoIr={aoIr} />
    </div>
  );
}

/** Barra de baixo: Voltar e um único botão "Salvar e continuar" (no último passo, "Concluir plano"). */
export function FluxoRodape({
  passos,
  indice,
  ultimo,
  voltar,
  salvarEContinuar,
  pendente,
  salvando,
  salvoEm,
  avisoAuto,
  erro,
}: {
  passos: PassoMensal[];
  indice: number;
  ultimo: boolean;
  voltar: () => void;
  salvarEContinuar: () => void;
  pendente: boolean;
  salvando: boolean;
  salvoEm: Date | null;
  avisoAuto: string | null;
  erro?: string;
}) {
  const passo = passos[indice];
  const ocupado = pendente || salvando;
  return (
    <div className="sticky bottom-3 z-[5] space-y-2">
      {erro && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 shadow-sm">
          <Icone nome="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
          {erro}
        </p>
      )}
      <div className="fluxo-barra space-y-2.5 px-3.5 py-3">
        <div className="fluxo-progresso" role="progressbar" aria-label="Progresso do plano" aria-valuemin={1} aria-valuemax={passos.length} aria-valuenow={indice + 1}>
          <span style={{ width: `${((indice + 1) / Math.max(1, passos.length)) * 100}%` }} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={voltar} disabled={indice === 0 || ocupado} className="btn-azul-suave">
            <Icone nome="setaEsquerda" className="h-4 w-4" />
            Voltar
          </button>
          <div className="order-last w-full text-center text-xs text-slate-500 sm:order-none sm:w-auto" aria-live="polite">
            <p>
              Passo {indice + 1} de {passos.length} · <span className="font-semibold text-slate-800">{passo?.grupoRotulo ? `${passo.grupoRotulo} · ` : ""}{passo?.rotulo}</span>
            </p>
            <p className={avisoAuto ? "text-amber-700" : "text-emerald-700"}>
              {salvando ? "Salvando…" : avisoAuto ?? (salvoEm ? `Tudo salvo às ${salvoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Seu plano é salvo a cada passo")}
            </p>
          </div>
          {ultimo ? (
            <button type="submit" disabled={ocupado} className="btn-azul">
              {pendente ? "Salvando..." : "Concluir plano"}
              <Icone nome="check" className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={salvarEContinuar} disabled={ocupado} className="btn-azul">
              {salvando ? "Salvando..." : "Salvar e continuar"}
              <Icone nome="setaDireita" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Se o navegador recusar o envio porque um campo obrigatório (título, ano letivo, disciplina) está vazio num passo
 * escondido, volta para o passo da identificação e mostra o aviso ali — senão o botão pareceria "não fazer nada".
 */
export function aoCampoInvalido(irParaIdentificacao: () => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    const alvo = e.target as HTMLInputElement | HTMLSelectElement;
    if (alvo.offsetParent !== null) return; // campo visível: o navegador já mostra o aviso
    e.preventDefault();
    irParaIdentificacao();
    window.setTimeout(() => alvo.reportValidity?.(), 80);
  };
}

/** Enter dentro de um campo de uma linha não deve salvar o plano sem querer (agora que o plano tem vários passos). */
export function semEnterQueEnvia(e: React.KeyboardEvent<HTMLFormElement>) {
  const alvo = e.target as HTMLElement;
  if (e.key === "Enter" && alvo.tagName === "INPUT" && (alvo as HTMLInputElement).type !== "submit") e.preventDefault();
}
