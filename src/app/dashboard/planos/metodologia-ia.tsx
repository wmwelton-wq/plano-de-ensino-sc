"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";
import type { EditorTextoRicoHandle } from "./editor-texto-rico";
import { gerarMetodologia } from "./ia-actions";
import CalendarioNoPlano from "./calendario-no-plano";
import { MAX_AULAS, MAX_SEMANAS, type Divisao } from "@/lib/ia/metodologia";

interface MetodologiaIAProps {
  /** Campo de texto formatado do caminho metodológico (aparece logo abaixo do botão). */
  children: ReactNode;
  /**
   * Gancho para a IA (ainda não ligado): recebe tudo o que o professor
   * escolheu no plano e devolve o texto do caminho metodológico.
   */
  onGerar?: (contexto: ContextoIA) => Promise<string | null>;
  /** Editor do caminho metodológico: o texto criado pela IA é acrescentado nele como rascunho. */
  editorRef?: RefObject<EditorTextoRicoHandle | null>;
}

export interface ContextoIA {
  titulo: string;
  turma: string;
  quantidadeAulas: string;
  dataInicio: string;
  dataFim: string;
  vinculo: string;
  habilidadeIds: string[];
  competenciaIds: string[];
  habilidadesManuais: { codigo: string; descricao: string }[];
  conteudos: string;
  /** Instruções extras digitadas pelo professor (opcional). */
  instrucoes: string;
  /** Dividir o texto por semana (até 5) ou por aula (até 16). */
  divisao: Divisao;
  /** Quantas semanas/aulas escrever; 0 = automático (pelo período ou pela quantidade de aulas do plano). */
  quantidade: number;
}

function texto(dados: FormData, nome: string): string {
  const v = dados.get(nome);
  return typeof v === "string" ? v : "";
}

/** Reúne tudo o que o professor já marcou no formulário, para a IA se basear. */
function montarContexto(form: HTMLFormElement, instrucoes: string, divisao: Divisao, quantidade: number): ContextoIA {
  const dados = new FormData(form);
  const codigos = dados.getAll("habilidade_manual_codigo").map(String);
  const descricoes = dados.getAll("habilidade_manual_descricao").map(String);
  return {
    titulo: texto(dados, "titulo"),
    turma: texto(dados, "turma"),
    quantidadeAulas: texto(dados, "quantidade_aulas"),
    dataInicio: texto(dados, "data_inicio"),
    dataFim: texto(dados, "data_fim"),
    vinculo: texto(dados, "vinculo_id"),
    habilidadeIds: dados.getAll("habilidade_ids").map(String),
    competenciaIds: dados.getAll("competencia_ids").map(String),
    habilidadesManuais: descricoes.map((descricao, i) => ({ codigo: codigos[i] ?? "", descricao })),
    // Anos Iniciais: cada componente tem o seu campo (sec_conteudos__<id>); os demais planos têm um só.
    conteudos: [
      texto(dados, "conteudos_programaticos"),
      ...Array.from(dados.entries())
        .filter(([nome]) => nome.startsWith("sec_conteudos__"))
        .map(([, valor]) => String(valor)),
    ]
      .filter((t) => t.length > 0)
      .join("\n"),
    instrucoes,
    divisao,
    quantidade,
  };
}

export default function MetodologiaIA({ children, onGerar, editorRef }: MetodologiaIAProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const [instrucoes, setInstrucoes] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [divisao, setDivisao] = useState<Divisao>("semana");
  const [quantidadeTexto, setQuantidadeTexto] = useState("");
  const maximo = divisao === "aula" ? MAX_AULAS : MAX_SEMANAS;
  const nomePlural = divisao === "aula" ? "aulas" : "semanas";

  function mudarQuantidade(v: string) {
    const digitos = v.replace(/\D/g, "").slice(0, 2);
    if (digitos === "") return setQuantidadeTexto("");
    setQuantidadeTexto(String(Math.min(Math.max(Number(digitos), 1), maximo)));
  }

  function mudarDivisao(nova: Divisao) {
    setDivisao(nova);
    const limite = nova === "aula" ? MAX_AULAS : MAX_SEMANAS;
    if (quantidadeTexto && Number(quantidadeTexto) > limite) setQuantidadeTexto(String(limite));
  }

  async function gerar() {
    const form = raiz.current?.closest("form");
    if (!form) return;
    if (!onGerar && !editorRef) {
      setAviso("A criação com IA será liberada em breve. O botão e o campo de instruções já estão prontos.");
      return;
    }
    setGerando(true);
    setAviso(null);
    try {
      const contexto = montarContexto(form, instrucoes.trim(), divisao, quantidadeTexto ? Number(quantidadeTexto) : 0);
      if (onGerar) {
        await onGerar(contexto);
        return;
      }
      const r = await gerarMetodologia(contexto);
      if (!r.ok) {
        setAviso(r.erro);
        return;
      }
      editorRef?.current?.anexar(r.paragrafos, "paragrafos");
      setAviso(r.aviso ?? "Pronto! Colocamos um rascunho no campo abaixo. Leia, ajuste do seu jeito e salve — a IA pode errar.");
    } catch {
      setAviso("Não foi possível criar o caminho metodológico agora. Tente novamente.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div ref={raiz} className="space-y-4">
      <div className="space-y-3 rounded-xl border border-primary-200 bg-white p-4 shadow-sm">
        <button type="button" onClick={gerar} disabled={gerando} className="btn-verde w-full sm:w-auto">
          <span aria-hidden="true">✦</span>
          {gerando ? "Criando..." : "Criar caminho metodológico com IA"}
        </button>
        <p className="text-xs text-slate-500">
          A IA vai se basear em tudo o que você marcou neste plano: disciplina, turma, objetos,
          habilidades e conteúdos.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span id="divisao_ia_rotulo" className="field-label">
              Dividir o texto por
            </span>
            <div role="radiogroup" aria-labelledby="divisao_ia_rotulo" className="grid grid-cols-2 gap-1 rounded-xl border border-primary-200 bg-primary-50/60 p-1">
              {(["semana", "aula"] as const).map((op) => (
                <button
                  key={op}
                  type="button"
                  role="radio"
                  aria-checked={divisao === op}
                  onClick={() => mudarDivisao(op)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    divisao === op ? "bg-primary-600 text-white shadow-sm" : "text-primary-700 hover:bg-white"
                  }`}
                >
                  {op === "semana" ? "Semana" : "Aula"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="quantidade_ia" className="field-label">
              Quantas {nomePlural}?{" "}
              <span className="font-normal text-slate-400">(máximo {maximo})</span>
            </label>
            <input
              id="quantidade_ia"
              type="text"
              inputMode="numeric"
              value={quantidadeTexto}
              onChange={(e) => mudarQuantidade(e.target.value)}
              onKeyDown={(e) => {
                // Enter aqui não pode enviar o formulário do plano.
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="Automático"
              className="input-field"
            />
            <p className="field-hint">
              {divisao === "aula"
                ? "Em branco: usa a quantidade de aulas do plano (ou 4)."
                : "Em branco: calcula pelas datas do plano (ou 4)."}
            </p>
          </div>
        </div>
        <div>
          <label htmlFor="instrucoes_ia" className="field-label">
            Adicionar instruções para a IA{" "}
            <span className="font-normal text-slate-400">(opcional — não é obrigatório)</span>
          </label>
          <textarea
            id="instrucoes_ia"
            rows={2}
            value={instrucoes}
            onChange={(e) => setInstrucoes(e.target.value)}
            placeholder="Ex.: usar atividades em grupo, aulas de 50 minutos, turma com dificuldade em leitura..."
            className="input-field"
          />
        </div>
        {aviso && (
          <p role="status" className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700">
            {aviso}
          </p>
        )}
      </div>
      <CalendarioNoPlano raiz={raiz} editorRef={editorRef} />
      {children}
    </div>
  );
}
