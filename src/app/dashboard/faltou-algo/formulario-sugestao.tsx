"use client";

import { useState } from "react";
import { enviarSugestao } from "./actions";

export const ROTULO_SUGESTAO: Record<string, string> = {
  competencia: "Competência",
  objeto_conhecimento: "Objeto de conhecimento",
  habilidade: "Habilidade",
  conteudo: "Conteúdo",
  avaliacao: "Avaliação (critério ou instrumento)",
  referencia: "Referência",
  outro: "Outra coisa do plano",
};

export interface ContextoSugestao {
  etapa?: string;
  disciplina?: string;
  serie?: string;
}

const ETAPAS = ["Educação Infantil", "Ensino Fundamental — Anos Iniciais", "Ensino Fundamental — Anos Finais", "Ensino Médio / Curso Técnico"];

/** Campos do aviso "Faltou algo?". Não é um <form>: pode ficar dentro do formulário do plano sem enviá-lo. */
export default function FormularioSugestao({
  tipoInicial = "objeto_conhecimento",
  contexto = {},
  aoEnviar,
}: {
  tipoInicial?: string;
  contexto?: ContextoSugestao;
  aoEnviar?: () => void;
}) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [etapa, setEtapa] = useState(contexto.etapa ?? "");
  const [disciplina, setDisciplina] = useState(contexto.disciplina ?? "");
  const [serie, setSerie] = useState(contexto.serie ?? "");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState(false);

  async function enviar() {
    setErro(null);
    setEnviando(true);
    try {
      const r = await enviarSugestao({ tipo, etapa, disciplina, serie, descricao });
      if (r.erro) setErro(r.erro);
      else {
        setFeito(true);
        aoEnviar?.();
      }
    } catch {
      setErro("Sem conexão. Verifique a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (feito) {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="text-base font-extrabold text-emerald-900">Recebemos o seu aviso. Obrigado!</p>
        <p className="mt-1 text-sm text-emerald-800">Vamos analisar e, se fizer sentido, acrescentar ao aplicativo para todos os professores.</p>
        <button
          type="button"
          onClick={() => {
            setFeito(false);
            setDescricao("");
          }}
          className="btn-azul-suave mt-3"
        >
          Avisar outra coisa
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="sug-tipo" className="field-label">
          O que faltou?
        </label>
        <select id="sug-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className="input-field">
          {Object.entries(ROTULO_SUGESTAO).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="sug-etapa" className="field-label">
            Etapa <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <select id="sug-etapa" value={etapa} onChange={(e) => setEtapa(e.target.value)} className="input-field">
            <option value="">—</option>
            {ETAPAS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sug-disc" className="field-label">
            Disciplina <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input id="sug-disc" value={disciplina} onChange={(e) => setDisciplina(e.target.value)} maxLength={120} placeholder="Ex.: Química" className="input-field" />
        </div>
        <div>
          <label htmlFor="sug-serie" className="field-label">
            Série/ano <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input id="sug-serie" value={serie} onChange={(e) => setSerie(e.target.value)} maxLength={40} placeholder="Ex.: 2ª série" className="input-field" />
        </div>
      </div>
      <div>
        <label htmlFor="sug-desc" className="field-label">
          Conte o que está faltando
        </label>
        <textarea
          id="sug-desc"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Ex.: Falta o objeto de conhecimento “Equilíbrio químico” na Química da 2ª série, com os itens: constante de equilíbrio, Le Chatelier..."
          className="input-field"
        />
        <p className="field-hint">Não escreva dados de alunos.</p>
      </div>
      {erro && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}
      <button type="button" onClick={enviar} disabled={enviando || descricao.trim().length < 3} className="btn-azul">
        {enviando ? "Enviando..." : "Enviar aviso"}
      </button>
    </div>
  );
}
