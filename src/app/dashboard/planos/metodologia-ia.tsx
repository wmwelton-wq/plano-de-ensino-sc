"use client";

import { useRef, useState, type ReactNode } from "react";

interface MetodologiaIAProps {
  /** Campo de texto formatado do caminho metodológico (aparece logo abaixo do botão). */
  children: ReactNode;
  /**
   * Gancho para a IA (ainda não ligado): recebe tudo o que o professor
   * escolheu no plano e devolve o texto do caminho metodológico.
   */
  onGerar?: (contexto: ContextoIA) => Promise<string | null>;
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
}

function texto(dados: FormData, nome: string): string {
  const v = dados.get(nome);
  return typeof v === "string" ? v : "";
}

/** Reúne tudo o que o professor já marcou no formulário, para a IA se basear. */
function montarContexto(form: HTMLFormElement, instrucoes: string): ContextoIA {
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
    conteudos: texto(dados, "conteudos_programaticos"),
    instrucoes,
  };
}

export default function MetodologiaIA({ children, onGerar }: MetodologiaIAProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const [instrucoes, setInstrucoes] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  async function gerar() {
    const form = raiz.current?.closest("form");
    if (!form) return;
    if (!onGerar) {
      setAviso("A criação com IA será liberada em breve. O botão e o campo de instruções já estão prontos.");
      return;
    }
    setGerando(true);
    setAviso(null);
    try {
      await onGerar(montarContexto(form, instrucoes.trim()));
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
      {children}
    </div>
  );
}
