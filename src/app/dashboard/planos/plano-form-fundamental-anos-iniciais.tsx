"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import Link from "next/link";
import OpcoesLogo from "./opcoes-logo";
import type { Disciplina, Escola, HabilidadeCurricular, PlanoDeEnsino } from "@/lib/database.types";
import type { EstadoFormulario } from "./actions";
import SecaoPlano from "./secao-plano";
import PassosPlano from "./passos-plano";
import CurriculoDigitalCampo from "./curriculo-digital-campo";
import MetodologiaIA from "./metodologia-ia";
import BarraSalvar from "./barra-salvar";
import ReferenciasCampo from "./referencias-campo";
import TurmaSelector, { separarTurma } from "./turma-selector";
import EditorTextoRico, { type EditorTextoRicoHandle } from "./editor-texto-rico";
import SugestoesPanel from "./sugestoes-panel";
import ObjetosEHabilidades from "./objeto-conhecimento-picker";
import { CRITERIOS_AVALIACAO, INSTRUMENTOS_AVALIACAO } from "./sugestoes-avaliacao";

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
const PASSOS = [
  { id: "passo-1", rotulo: "Identificação" },
  { id: "passo-2", rotulo: "Componentes" },
  { id: "passo-3", rotulo: "Objetos e conteúdos" },
  { id: "passo-4", rotulo: "Habilidades" },
  { id: "passo-5", rotulo: "Educação digital" },
  { id: "passo-6", rotulo: "Caminho metodológico" },
  { id: "passo-7", rotulo: "Avaliação" },
  { id: "passo-8", rotulo: "Referências e salvar" },
];

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

  // Editores formatados e ano sugerido pela turma escolhida (ex.: "3º Ano" -> 3).
  const refConteudos = useRef<EditorTextoRicoHandle>(null);
  const refAvaliacao = useRef<EditorTextoRicoHandle>(null);
  const refInstrumentos = useRef<EditorTextoRicoHandle>(null);
  const anoDaSerie = (serie: string | null | undefined) => {
    const m = /(\d+)\s*º/.exec(serie ?? "");
    return m ? Number(m[1]) : null;
  };
  const [anoSugerido, setAnoSugerido] = useState<number | null>(
    anoDaSerie(separarTurma("fundamental_anos_iniciais", plano?.turma).serie)
  );
  const nomesDisciplinas = useMemo(
    () => Object.fromEntries(disciplinas.map((d) => [d.id, d.nome])),
    [disciplinas]
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

  const campoConteudos = (
    <div>
      <label htmlFor="conteudos_programaticos" className="field-label">
        Objeto(s) de Conhecimento
      </label>
      <p className="text-xs text-slate-500">
        Conteúdos, conceitos e princípios do Currículo Base do Território Catarinense (CBTC). O que
        você adicionar pelo botão azul aparece aqui; você também pode escrever livremente.
      </p>
      <EditorTextoRico
        id="conteudos_programaticos"
        name="conteudos_programaticos"
        valorInicial={plano?.conteudos_programaticos}
        editorRef={refConteudos}
        linhas={5}
      />
    </div>
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="etapa" value="fundamental_anos_iniciais" />
      <input type="hidden" name="vinculo_tipo" value="disciplina" />
      <input type="hidden" name="vinculo_id" value={componentePrincipalId} />

      <PassosPlano passos={PASSOS} />

      {/* ───────── 1. Identificação ───────── */}
      <SecaoPlano
        id="passo-1"
        numero={1}
        titulo="Identificação do plano"
        descricao="Unidade escolar, ano/turma e período."
      >
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
            <p className="field-hint">
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
            <p className="field-hint">
              Usada para preencher o campo &quot;Unidade Escolar&quot; do plano.{" "}
              <Link href="/dashboard/escolas/nova" className="text-primary-600 hover:underline">
                Cadastrar nova escola
              </Link>
            </p>
          </div>

          <OpcoesLogo plano={plano} />

          <TurmaSelector
            etapa="fundamental_anos_iniciais"
            valorInicial={plano?.turma}
            rotuloSerie="Ano"
            onSerieChange={(serie) => setAnoSugerido(anoDaSerie(serie))}
          />

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
            <p className="field-hint">Máximo de 30 dias, conforme o modelo oficial.</p>
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
      </SecaoPlano>

      {/* ───────── 2. Componentes curriculares ───────── */}
      <SecaoPlano
        id="passo-2"
        numero={2}
        titulo="Componente(s) curricular(es)"
        descricao="Escolha um componente — ou mais de um, se o plano for interdisciplinar."
      >
        {disciplinas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
            Nenhum componente curricular cadastrado para os Anos Iniciais.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {disciplinas.map((d) => {
              const marcado = componentesSelecionados.has(d.id);
              return (
                <label
                  key={d.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                    marcado
                      ? "border-primary-500 bg-primary-50 font-medium text-primary-800"
                      : "border-slate-200 bg-white text-slate-700 hover:border-primary-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="disciplina_ids"
                    value={d.id}
                    checked={marcado}
                    onChange={() => alternarComponente(d.id)}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  {d.nome}
                </label>
              );
            })}
          </div>
        )}
      </SecaoPlano>

      {/* ───────── 3 e 4. Objetos, conteúdos e habilidades ───────── */}
      <ObjetosEHabilidades
        habilidades={habilidadesCurriculo}
        selecionadasIniciais={habilidadesSelecionadasIds}
        onAdicionarConteudos={(linhas) => refConteudos.current?.anexar(linhas, "paragrafos")}
        nomesDisciplinas={nomesDisciplinas}
        anoSugerido={anoSugerido}
        editorConteudos={campoConteudos}
        numeroObjetos={3}
        numeroHabilidades={4}
        idObjetos="passo-3"
        idHabilidades="passo-4"
        vazio={
          componentesSelecionados.size > 0
            ? "Ainda não há habilidades cadastradas para o(s) componente(s) selecionado(s)."
            : "Selecione ao menos um componente curricular no passo 2 para ver os objetos de conhecimento disponíveis."
        }
      />

      {/* ───────── 5. Currículo de educação digital ───────── */}
      <SecaoPlano
        id="passo-5"
        numero={5}
        titulo="Currículo de educação digital"
        descricao="Opcional: decida se vai usar e escolha as habilidades aqui mesmo."
      >
        <CurriculoDigitalCampo
          usar={usarCurriculoDigital}
          onUsarChange={setUsarCurriculoDigital}
          habilidades={habilidadesDigitais}
          selecionadasIniciais={habilidadesSelecionadasIds}
          manuaisIniciais={plano?.habilidades_manuais ?? []}
          descricaoAjuda="Transversais aos componentes curriculares, específicas do ano/turma (códigos EF0xCO...)."
          vazio="Ainda não há habilidades de educação digital cadastradas para os Anos Iniciais."
        />
      </SecaoPlano>

      {/* ───────── 6. Caminho metodológico ───────── */}
      <SecaoPlano
        id="passo-6"
        numero={6}
        titulo="Caminho metodológico"
        descricao="Passo a passo, por dia/aula, para desenvolver as habilidades selecionadas."
      >
        <MetodologiaIA>
          <div>
            <label htmlFor="metodologia" className="field-label">
              Caminho metodológico para desenvolvimento da habilidade
            </label>
            <p className="text-xs text-slate-500">
              A Sequência Didática é a metodologia recomendada; descreva também os recursos usados
              em cada aula. Se envolver mais de um componente, descreva de forma interdisciplinar.
            </p>
            <EditorTextoRico
              id="metodologia"
              name="metodologia"
              valorInicial={plano?.metodologia}
              linhas={6}
            />
          </div>
        </MetodologiaIA>
      </SecaoPlano>

      {/* ───────── 7. Avaliação ───────── */}
      <SecaoPlano
        id="passo-7"
        numero={7}
        titulo="Avaliação"
        descricao="Instrumentos e critérios — use as sugestões ou escreva livremente."
      >
        <div>
          <label htmlFor="instrumentos_avaliacao" className="field-label">
            Instrumentos de Avaliação
          </label>
          <p className="text-xs text-slate-500">
            Ex.: prova, lista de exercícios, portfólio, trabalho, seminário, produções orais.
          </p>
          <EditorTextoRico
            id="instrumentos_avaliacao"
            name="instrumentos_avaliacao"
            valorInicial={plano?.instrumentos_avaliacao}
            textoAntigoComoLista
            editorRef={refInstrumentos}
            linhas={4}
          />
          <SugestoesPanel
            rotulo="instrumentos"
            itens={INSTRUMENTOS_AVALIACAO}
            onAdicionar={(item) => refInstrumentos.current?.anexar([item], "lista")}
          />
        </div>

        <div>
          <label htmlFor="avaliacao" className="field-label">
            Critérios de Avaliação
          </label>
          <p className="text-xs text-slate-500">
            De acordo com as habilidades desenvolvidas — vira lista com marcadores no PDF.
          </p>
          <EditorTextoRico
            id="avaliacao"
            name="avaliacao"
            valorInicial={plano?.avaliacao}
            textoAntigoComoLista
            editorRef={refAvaliacao}
            linhas={5}
          />
          <SugestoesPanel
            rotulo="critérios"
            itens={CRITERIOS_AVALIACAO}
            onAdicionar={(item) => refAvaliacao.current?.anexar([item], "lista")}
          />
        </div>
      </SecaoPlano>

      {/* ───────── 8. Referências e finalização ───────── */}
      <SecaoPlano
        id="passo-8"
        numero={8}
        titulo="Referências e finalização"
        descricao="Última etapa: referências extras e situação do plano."
      >
        <div>
          <label htmlFor="referencias" className="field-label">
            Referências <span className="text-slate-400">(opcional)</span>
          </label>
          <p className="text-xs text-slate-500">
            A referência oficial (Currículo Base do Território Catarinense / BNCC
            {usarCurriculoDigital ? " e Currículo de Educação Digital" : ""}) já entra
            automaticamente — use este campo para as demais referências, uma por linha.
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
      </SecaoPlano>

      <BarraSalvar pendente={pendente} textoBotao={textoBotao} erro={estado.erro} />
    </form>
  );
}
