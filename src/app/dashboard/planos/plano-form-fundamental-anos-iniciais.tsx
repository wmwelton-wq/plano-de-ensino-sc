"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import type { Disciplina, Escola, HabilidadeCurricular, PlanoDeEnsino } from "@/lib/database.types";
import type { EstadoFormulario } from "./actions";
import HabilidadePicker from "./habilidade-picker";
import ReferenciasCampo from "./referencias-campo";
import TurmaSelector from "./turma-selector";

interface PlanoFormFundamentalAnosIniciaisProps {
  disciplinas: Disciplina[];
  escolas: Escola[];
  habilidades: HabilidadeCurricular[];
  habilidadesSelecionadasIds?: string[];
  disciplinasSelecionadasIds?: string[];
  plano?: PlanoDeEnsino;
  action: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  textoBotao: string;
}

/**
 * Formulário dos Anos Iniciais do Ensino Fundamental (1º ao 5º ano),
 * reproduzindo os campos do modelo oficial "PLANO DE AULA DOS ANOS
 * INICIAIS DO ENSINO FUNDAMENTAL" enviado pelo usuário: Unidade Escolar,
 * Ano/Turma, Professor(a) [automático, é quem está logado], Segundo(a)
 * Professor(a), Período do plano (máx. 30 dias), Componente(s)
 * Curricular(es) (multidisciplinar), Objeto(s) de Conhecimento,
 * Habilidade(s) do CBTC, Caminho metodológico passo a passo, Instrumentos
 * de Avaliação, Critérios de Avaliação e Referências.
 */
export default function PlanoFormFundamentalAnosIniciais({
  disciplinas,
  escolas,
  habilidades,
  habilidadesSelecionadasIds = [],
  disciplinasSelecionadasIds = [],
  plano,
  action,
  textoBotao,
}: PlanoFormFundamentalAnosIniciaisProps) {
  const [estado, formAction, pendente] = useActionState(action, {});

  const [componentesSelecionados, setComponentesSelecionados] = useState<Set<string>>(
    new Set(disciplinasSelecionadasIds.length > 0 ? disciplinasSelecionadasIds : plano?.disciplina_id ? [plano.disciplina_id] : [])
  );
  const [usarCurriculoDigital, setUsarCurriculoDigital] = useState(
    plano?.usar_curriculo_digital ?? true
  );

  function alternarComponente(id: string) {
    setComponentesSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) {
        novo.delete(id);
      } else {
        novo.add(id);
      }
      return novo;
    });
  }

  // O primeiro componente marcado vira o "componente principal" do plano
  // (usado em consultas e no cabeçalho); a lista completa (para planos
  // interdisciplinares) vai nos checkboxes "disciplina_ids" abaixo.
  const componentePrincipalId = useMemo(() => {
    const ordemOriginal = disciplinas.map((d) => d.id);
    const selecionadosNaOrdem = ordemOriginal.filter((id) => componentesSelecionados.has(id));
    return selecionadosNaOrdem[0] ?? "";
  }, [componentesSelecionados, disciplinas]);

  const habilidadesCurriculo = useMemo(
    () => habilidades.filter((h) => h.disciplina_id && componentesSelecionados.has(h.disciplina_id)),
    [habilidades, componentesSelecionados]
  );

  const habilidadesDigitais = useMemo(
    () => habilidades.filter((h) => h.fonte === "curriculo_educacao_digital"),
    [habilidades]
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="etapa" value="fundamental_anos_iniciais" />
      <input type="hidden" name="vinculo_tipo" value="disciplina" />
      <input type="hidden" name="vinculo_id" value={componentePrincipalId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="titulo" className="field-label">
            Título do plano
          </label>
          <input
            id="titulo"
            name="titulo"
            type="text"
            required
            defaultValue={plano?.titulo}
            placeholder="Ex.: Plano de Aula — 3º ano — Sistema de numeração decimal"
            className="input-field"
          />
          <p className="mt-1 text-xs text-slate-400">
            Usado apenas para você identificar o plano na sua lista — o PDF usa sempre o título
            padrão &quot;PLANO DE AULA&quot;, como no modelo oficial.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="escola_id" className="field-label">
            Unidade Escolar <span className="text-slate-400">(opcional)</span>
          </label>
          <select
            id="escola_id"
            name="escola_id"
            defaultValue={plano?.escola_id ?? ""}
            className="input-field"
          >
            <option value="">Nenhuma / preencher depois</option>
            {escolas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome} — {e.municipio}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Usada para preencher o campo &quot;Unidade Escolar&quot; do plano.{" "}
            <Link href="/dashboard/escolas/nova" className="text-primary-600 hover:underline">
              Cadastrar nova escola
            </Link>
          </p>
        </div>

        <TurmaSelector etapa="fundamental_anos_iniciais" valorInicial={plano?.turma} rotuloSerie="Ano" />

        <div>
          <label htmlFor="segundo_professor_nome" className="field-label">
            Segundo(a) Professor(a) <span className="text-slate-400">(caso haja)</span>
          </label>
          <input
            id="segundo_professor_nome"
            name="segundo_professor_nome"
            type="text"
            defaultValue={plano?.segundo_professor_nome ?? ""}
            placeholder="Nome completo"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="data_inicio" className="field-label">
            Período do plano — início
          </label>
          <input
            id="data_inicio"
            name="data_inicio"
            type="date"
            defaultValue={plano?.data_inicio ?? ""}
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="data_fim" className="field-label">
            Período do plano — fim
          </label>
          <input
            id="data_fim"
            name="data_fim"
            type="date"
            defaultValue={plano?.data_fim ?? ""}
            className="input-field"
          />
          <p className="mt-1 text-xs text-slate-400">Máximo de 30 dias, conforme o modelo oficial.</p>
        </div>

        <div>
          <label htmlFor="ano_letivo" className="field-label">
            Ano letivo
          </label>
          <input
            id="ano_letivo"
            name="ano_letivo"
            type="number"
            required
            defaultValue={plano?.ano_letivo ?? new Date().getFullYear()}
            className="input-field"
          />
        </div>

      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <input
            id="usar_curriculo_digital"
            name="usar_curriculo_digital"
            type="checkbox"
            checked={usarCurriculoDigital}
            onChange={(e) => setUsarCurriculoDigital(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="usar_curriculo_digital" className="text-sm font-medium text-slate-700">
            Utilizar o currículo de educação digital neste plano
          </label>
        </div>
        <p className="mt-1 pl-6 text-xs text-slate-400">
          Nem todo professor trabalha com o currículo de educação digital. Desmarque esta opção
          (&quot;não utilizar&quot;) para que essa seção some do plano — ela deixa de aparecer
          tanto aqui no formulário quanto no PDF gerado.
        </p>
      </div>

      <div>
        <label className="field-label">Componente(s) Curricular(es)</label>
        <p className="text-xs text-slate-400">
          Selecione um componente, ou mais de um se o plano for interdisciplinar — liste todos os
          componentes envolvidos.
        </p>
        {disciplinas.length === 0 ? (
          <p className="mt-2 rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-400">
            Nenhum componente curricular cadastrado para os Anos Iniciais.
          </p>
        ) : (
          <div className="mt-1 grid grid-cols-1 gap-2 rounded-md border border-slate-300 p-3 sm:grid-cols-2">
            {disciplinas.map((d) => (
              <label key={d.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="disciplina_ids"
                  value={d.id}
                  checked={componentesSelecionados.has(d.id)}
                  onChange={() => alternarComponente(d.id)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                {d.nome}
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="conteudos_programaticos" className="field-label">
          Objeto(s) de Conhecimento
        </label>
        <p className="text-xs text-slate-400">
          Conteúdos, conceitos e princípios a serem trabalhados, de acordo com o Currículo Base do
          Território Catarinense (CBTC). Um item por linha.
        </p>
        <textarea
          id="conteudos_programaticos"
          name="conteudos_programaticos"
          rows={4}
          defaultValue={plano?.conteudos_programaticos ?? ""}
          className="input-field"
        />
      </div>

      <HabilidadePicker
        titulo="Habilidade(s)"
        descricaoAjuda="Do Currículo Base do Território Catarinense (CBTC) / BNCC, filtradas pelo(s) componente(s) selecionado(s) acima."
        habilidades={habilidadesCurriculo}
        selecionadasIniciais={habilidadesSelecionadasIds}
        vazio={
          componentesSelecionados.size > 0
            ? "Ainda não há habilidades cadastradas para o(s) componente(s) selecionado(s)."
            : "Selecione ao menos um componente curricular acima para ver as habilidades disponíveis."
        }
      />

      {usarCurriculoDigital && (
        <HabilidadePicker
          titulo="Habilidades do currículo de educação digital"
          descricaoAjuda="Transversais aos componentes curriculares, específicas do ano/turma selecionado (códigos EF0xCO...)."
          habilidades={habilidadesDigitais}
          selecionadasIniciais={habilidadesSelecionadasIds}
          vazio="Ainda não há habilidades de educação digital cadastradas para os Anos Iniciais."
        />
      )}

      <div>
        <label htmlFor="metodologia" className="field-label">
          Caminho metodológico para desenvolvimento da habilidade
        </label>
        <p className="text-xs text-slate-400">
          Descreva passo a passo: que ações e operações (atividades) são necessárias, por dia/aula,
          para desenvolver as habilidades selecionadas. A Sequência Didática é a metodologia
          recomendada de organização do planejamento; descreva também os recursos usados em cada
          aula. Se envolver mais de um componente curricular, descreva a sequência didática de
          forma interdisciplinar.
        </p>
        <textarea
          id="metodologia"
          name="metodologia"
          rows={6}
          defaultValue={plano?.metodologia ?? ""}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="instrumentos_avaliacao" className="field-label">
          Instrumentos de Avaliação
        </label>
        <p className="text-xs text-slate-400">
          Ex.: prova, lista de exercícios, portfólio, trabalho, seminário, produções orais. Um item
          por linha.
        </p>
        <textarea
          id="instrumentos_avaliacao"
          name="instrumentos_avaliacao"
          rows={3}
          defaultValue={plano?.instrumentos_avaliacao ?? ""}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="avaliacao" className="field-label">
          Critérios de Avaliação
        </label>
        <p className="text-xs text-slate-400">
          De acordo com as habilidades desenvolvidas. Um critério por linha — vira lista com
          marcadores no PDF.
        </p>
        <textarea
          id="avaliacao"
          name="avaliacao"
          rows={4}
          defaultValue={plano?.avaliacao ?? ""}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="referencias" className="field-label">
          Referências <span className="text-slate-400">(opcional)</span>
        </label>
        <p className="text-xs text-slate-400">
          A referência oficial (Currículo Base do Território Catarinense / BNCC
          {usarCurriculoDigital ? " e Currículo de Educação Digital" : ""}) já entra
          automaticamente nas Referências do plano gerado — você não precisa digitá-la. Use este
          campo para as demais referências utilizadas no plano de aula, uma por linha.
        </p>
        <ReferenciasCampo valorInicial={plano?.referencias} rows={4} />
      </div>

      <div>
        <label htmlFor="status" className="field-label">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={plano?.status ?? "rascunho"}
          className="input-field max-w-xs"
        >
          <option value="rascunho">Rascunho</option>
          <option value="finalizado">Finalizado</option>
        </select>
      </div>

      {estado.erro && (
        <p role="alert" className="text-sm text-red-600">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="btn-primary"
      >
        {pendente ? "Salvando..." : textoBotao}
      </button>
    </form>
  );
}
