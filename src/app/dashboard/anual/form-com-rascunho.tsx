"use client";

import { useEffect, useRef, useState } from "react";
import PlanoAnualForm, { type PlanoAnualFormProps } from "./plano-anual-form";
import type { PlanoAnual, EtapaAnual } from "@/lib/plano-anual";

interface Props extends PlanoAnualFormProps {
  /** Onde guardar o rascunho neste navegador (ex.: "anual:novo" ou "anual:<id>"). */
  chave: string;
  /** Chaves a apagar quando o plano acabou de ser salvo. */
  limparAoSalvar?: string[];
  salvo?: boolean;
}

interface Backup {
  em: number;
  campos: Record<string, string>;
}

const PREFIXO = "plano-docente:rascunho:";

function ler(chave: string): Backup | null {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    if (!bruto) return null;
    const b = JSON.parse(bruto) as Backup;
    return b && typeof b.em === "number" && b.campos ? b : null;
  } catch {
    return null;
  }
}

function gravar(chave: string, b: Backup) {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(b));
  } catch {
    // Pode estourar o limite do navegador (imagens grandes): tenta de novo sem o texto livre.
    try {
      const { texto_livre: _t, ...resto } = b.campos;
      void _t;
      localStorage.setItem(PREFIXO + chave, JSON.stringify({ ...b, campos: resto }));
    } catch {
      /* sem armazenamento disponível: segue sem rascunho */
    }
  }
}

function apagar(...chaves: string[]) {
  try {
    for (const c of chaves) localStorage.removeItem(PREFIXO + c);
  } catch {
    /* ignora */
  }
}

function lerCampos(form: HTMLFormElement): Record<string, string> {
  const saida: Record<string, string> = {};
  new FormData(form).forEach((v, k) => {
    if (typeof v === "string" && !k.startsWith("$ACTION")) saida[k] = v;
  });
  return saida;
}

function planoDoBackup(b: Backup, base?: PlanoAnual): PlanoAnual {
  const f = b.campos;
  let dados: Record<string, unknown> = {};
  try {
    dados = JSON.parse(f.dados || "{}");
  } catch {
    /* usa vazio */
  }
  const vazio: PlanoAnual = {
    id: "",
    professor_id: "",
    escola_id: null,
    disciplina_id: null,
    etapa: "ensino_medio",
    titulo: "",
    ano_letivo: new Date().getFullYear(),
    componente: null,
    area: null,
    turma: null,
    turno: null,
    docente: null,
    formacao: null,
    incluir_logo_estado: true,
    incluir_logo_escola: true,
    ementa: [],
    competencias_gerais: {},
    competencias_especificas: {},
    trimestres: [],
    texto_livre: null,
    status: "rascunho",
    created_at: "",
    updated_at: "",
  };
  return {
    ...(base ?? vazio),
    escola_id: f.escola_id || null,
    disciplina_id: f.disciplina_id || null,
    etapa: (f.etapa as EtapaAnual) || "ensino_medio",
    titulo: f.titulo ?? "",
    ano_letivo: Number(f.ano_letivo) || new Date().getFullYear(),
    componente: f.componente || null,
    area: f.area || null,
    turma: f.turma || null,
    turno: f.turno || null,
    docente: f.docente || null,
    formacao: f.formacao || null,
    incluir_logo_estado: f.incluir_logo_estado === "on",
    incluir_logo_escola: f.incluir_logo_escola === "on",
    ementa: dados.ementa ?? [],
    competencias_gerais: dados.competencias_gerais ?? {},
    competencias_especificas: dados.competencias_especificas ?? {},
    trimestres: dados.trimestres ?? [],
    texto_livre: f.texto_livre ?? base?.texto_livre ?? null,
    status: f.status === "finalizado" ? "finalizado" : "rascunho",
  };
}

/**
 * Guarda uma cópia do que o professor digita (neste navegador) a cada poucos
 * segundos. Se a internet cair ou a aba fechar antes de salvar, na próxima vez
 * o plano oferece restaurar o rascunho.
 */
export default function PlanoAnualComRascunho({ chave, limparAoSalvar = [], salvo, ...props }: Props) {
  const raiz = useRef<HTMLDivElement>(null);
  const base = useRef<string | null>(null);
  const [backup, setBackup] = useState<Backup | null>(null);
  const [restaurado, setRestaurado] = useState<PlanoAnual | undefined>(undefined);
  const [versao, setVersao] = useState(0);
  const [ultimoSalvo, setUltimoSalvo] = useState<number | null>(null);

  const atualizadoEm = props.plano?.updated_at ? Date.parse(props.plano.updated_at) : 0;

  useEffect(() => {
    if (salvo) {
      apagar(chave, ...limparAoSalvar);
      return;
    }
    const b = ler(chave);
    if (b && b.em > atualizadoEm) setBackup(b);
    else if (b) apagar(chave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (backup) return; // enquanto a pergunta está na tela, não sobrescreve o rascunho guardado
    const id = window.setInterval(() => {
      const form = raiz.current?.querySelector("form");
      if (!form) return;
      const campos = lerCampos(form);
      const json = JSON.stringify(campos);
      if (base.current === null) {
        base.current = json; // estado inicial: não é "alteração"
        return;
      }
      if (json === base.current) return;
      base.current = json;
      const agora = Date.now();
      gravar(chave, { em: agora, campos });
      setUltimoSalvo(agora);
    }, 4000);
    return () => window.clearInterval(id);
  }, [backup, chave]);

  function restaurar() {
    if (!backup) return;
    setRestaurado(planoDoBackup(backup, props.plano));
    setVersao((v) => v + 1);
    base.current = null;
    setBackup(null);
  }

  function descartar() {
    apagar(chave);
    setBackup(null);
  }

  return (
    <div ref={raiz}>
      {backup && (
        <div role="alert" className="mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">
            Encontramos alterações deste plano que não foram salvas (de {new Date(backup.em).toLocaleString("pt-BR")}).
          </p>
          <p className="mt-1">Quer continuar de onde parou?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={restaurar} className="btn-azul">
              Restaurar o que eu tinha digitado
            </button>
            <button type="button" onClick={descartar} className="btn-azul-suave !border-2 !border-amber-400">
              Descartar
            </button>
          </div>
        </div>
      )}
      {ultimoSalvo && (
        <p className="mb-2 text-right text-xs text-slate-500" aria-live="polite">
          Rascunho guardado neste computador às {new Date(ultimoSalvo).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. Para
          guardar no plano, clique em salvar.
        </p>
      )}
      <PlanoAnualForm key={versao} {...props} plano={restaurado ?? props.plano} />
    </div>
  );
}
