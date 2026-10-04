"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type {
  Disciplina,
  CursoTecnico,
  Escola,
  HabilidadeCurricular,
  CompetenciaCurricular,
  PlanoDeEnsino,
  EtapaPlano,
} from "@/lib/database.types";
import type { EstadoFormulario } from "./actions";
import HabilidadePicker from "./habilidade-picker";
import ReferenciasCampo from "./referencias-campo";
import TurmaSelector, { separarTurma } from "./turma-selector";
import ObjetoConhecimentoPicker from "./objeto-conhecimento-picker";
import CompetenciaPicker from "./competencia-picker";
import EditorTextoRico, { type EditorTextoRicoHandle } from "./editor-texto-rico";
import SugestoesPanel from "./sugestoes-panel";
import { CRITERIOS_AVALIACAO, INSTRUMENTOS_AVALIACAO } from "./sugestoes-avaliacao";

interface PlanoFormProps {
  etapa: EtapaPlano;
  disciplinas: Disciplina[];
  cursos: CursoTecnico[];
  escolas: Escola[];
  habilidades: HabilidadeCurricular[];
  habilidadesSelecionadasIds?: string[];
  competencias: CompetenciaCurricular[];
  competenciasSelecionadasIds?: string[];
  plano?: PlanoDeEnsino;
  action: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  textoBotao: string;
  /** "Série/ano (turma)": rótulo e exemplo mudam conforme a etapa. */
  rotuloTurma?: string;
  placeholderTurma?: string;
  /** Rótulo do agrupamento de componentes no seletor (ex.: "Formação Geral Básica" no Médio). */
  rotuloGrupoDisciplinas?: string;
}

const camposTexto: {
  campo: keyof PlanoDeEnsino;
  rotulo: string;
  dica?: string;
}[] = [
  {
    campo: "objetivos",
    rotulo: "Objetivos de aprendizagem",
    dica: "Uso interno para seu planejamento — este campo não aparece no PDF do plano, que segue o formato oficial.",
  },
];

export default function PlanoForm({
  etapa,
  disciplinas,
  cursos,
  escolas,
  habilidades,
  habilidadesSelecionadasIds = [],
  competencias,
  competenciasSelecionadasIds = [],
  plano,
  action,
  textoBotao,
  rotuloTurma = "Série/ano (turma)",
  placeholderTurma = "Ex.: 1ª série",
  rotuloGrupoDisciplinas = "Formação Geral Básica",
}: PlanoFormProps) {
  const [estado, formAction, pendente] = useActionState(action, {});

  const vinculoInicial = plano?.disciplina_id
    ? `disciplina:${plano.disciplina_id}`
    : plano?.curso_tecnico_id
    ? `curso:${plano.curso_tecnico_id}`
    : "";

  const [vinculo, setVinculo] = useState(vinculoInicial);
  const [vinculoTipo, vinculoId] = vinculo.split(":");
  const [usarCurriculoDigital, setUsarCurriculoDigital] = useState(
    plano?.usar_curriculo_digital ?? true
  );
  // Editores formatados: o seletor de objetos (Anos Finais) e as listas de
  // sugestões acrescentam itens a eles por estes "handles".
  const conteudosRef = useRef<EditorTextoRicoHandle>(null);
  const anoDaSerie = (serie: string | null | undefined) => {
    const m = /(\d+)\s*º/.exec(serie ?? "");
    return m ? Number(m[1]) : null;
  };
  const [anoSugerido, setAnoSugerido] = useState<number | null>(
    anoDaSerie(separarTurma(etapa, plano?.turma).serie)
  );
  const avaliacaoRef = useRef<EditorTextoRicoHandle>(null);
  const instrumentosRef = useRef<EditorTextoRicoHandle>(null);

  function adicionarConteudos(novasLinhas: string[]) {
    conteudosRef.current?.anexar(novasLinhas, "paragrafos");
  }

  const disciplinaSelecionada = useMemo(
    () => disciplinas.find((d) => d.id === vinculoId),
    [disciplinas, vinculoId]
  );

  const habilidadesCurriculo = useMemo(() => {
    if (vinculoTipo === "curso") {
      return habilidades.filter(
        (h) => h.fonte !== "curriculo_educacao_digital" && h.curso_tecnico_id === vinculoId
      );
    }
    if (vinculoTipo === "disciplina" && vinculoId) {
      return habilidades.filter(
        (h) =>
          h.fonte !== "curriculo_educacao_digital" &&
          (h.disciplina_id === vinculoId ||
            (!h.disciplina_id && disciplinaSelecionada?.area && h.area === disciplinaSelecionada.area))
      );
    }
    return [];
  }, [habilidades, vinculoTipo, vinculoId, disciplinaSelecionada]);

  // As habilidades do currículo de educação digital são específicas de cada
  // etapa/ano (códigos EF0xCO... para o Fundamental, EM13CO... para o
  // Médio); filtramos por etapa aqui (e não na consulta ao banco, já que
  // esta tela também é usada para o Médio, cuja consulta não filtra por
  // etapa por causa de uma inconsistência histórica de grafia do campo
  // "etapa" nas habilidades BNCC vinculadas a disciplina) para não misturar
  // habilidades digitais de outras etapas nesta lista.
  const etapaDisciplina = etapa === "ensino_medio" ? "Ensino Médio" : "Ensino Fundamental - Anos Finais";
  const habilidadesDigitais = useMemo(
    () =>
      habilidades.filter(
        (h) => h.fonte === "curriculo_educacao_digital" && h.etapa === etapaDisciplina
      ),
    [habilidades, etapaDisciplina]
  );

  const competenciasArea = useMemo(() => {
    if (vinculoTipo !== "disciplina" || !vinculoId) {
      return [];
    }
    return competencias.filter(
      (c) =>
        c.disciplina_id === vinculoId ||
        (!c.disciplina_id && disciplinaSelecionada?.area && c.area === disciplinaSelecionada.area)
    );
  }, [competencias, vinculoTipo, vinculoId, disciplinaSelecionada]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="etapa" value={etapa} />
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
            placeholder="Ex.: Plano de Ensino — Biologia — 2º ano"
            className="input-field"
          />
          <p className="field-hint">
            Usado apenas para você identificar o plano na sua lista — o PDF usa sempre o título
            padrão &quot;PLANO DE AULA&quot;.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="vinculo" className="field-label">
            Disciplina ou curso técnico
          </label>
          <select
            id="vinculo"
            required
            value={vinculo}
            onChange={(e) => setVinculo(e.target.value)}
            className="input-field"
          >
            <option value="">Selecione...</option>
            <optgroup label={rotuloGrupoDisciplinas}>
              {disciplinas.map((d) => (
                <option key={d.id} value={`disciplina:${d.id}`}>
                  {d.nome}
                </option>
              ))}
            </optgroup>
            {cursos.length > 0 && (
              <optgroup label="Cursos técnicos">
                {cursos.map((c) => (
                  <option key={c.id} value={`curso:${c.id}`}>
                    {c.nome}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <input type="hidden" name="vinculo_tipo" value={vinculoTipo ?? ""} />
          <input type="hidden" name="vinculo_id" value={vinculoId ?? ""} />
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

        <TurmaSelector
          etapa={etapa}
          valorInicial={plano?.turma}
          rotuloSerie={rotuloTurma === "Ano/turma" ? "Ano" : "Série/ano"}
          onSerieChange={(serie) => setAnoSugerido(anoDaSerie(serie))}
        />

        <div>
          <label htmlFor="quantidade_aulas" className="field-label">
            Número de aulas
          </label>
          <input
            id="quantidade_aulas"
            name="quantidade_aulas"
            type="number"
            min={1}
            defaultValue={plano?.quantidade_aulas ?? ""}
            placeholder="Ex.: 8"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="data_inicio" className="field-label">
            Data de início
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
            Data de fim
          </label>
          <input
            id="data_fim"
            name="data_fim"
            type="date"
            defaultValue={plano?.data_fim ?? ""}
            className="input-field"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="escola_id" className="field-label">
            Escola <span className="text-slate-400">(opcional)</span>
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
            Usada para preencher o cabeçalho (nome da escola, município e logo).{" "}
            <Link href="/dashboard/escolas/nova" className="text-primary-600 hover:underline">
              Cadastrar nova escola
            </Link>
          </p>
        </div>

        <div className="sm:col-span-2 flex items-center gap-2">
          <input
            id="incluir_logo_estado"
            name="incluir_logo_estado"
            type="checkbox"
            defaultChecked={plano?.incluir_logo_estado ?? true}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="incluir_logo_estado" className="text-sm text-slate-700">
            Incluir a logo do Estado de Santa Catarina no cabeçalho do plano
          </label>
        </div>

        <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
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
            Nem todo professor trabalha com o currículo de educação digital. Desmarque esta
            opção (&quot;não utilizar&quot;) para que essa seção some do plano — ela deixa de
            aparecer tanto aqui no formulário quanto no PDF gerado.
          </p>
        </div>
      </div>

      <CompetenciaPicker
        titulo="Competência específica do Componente Curricular"
        descricaoAjuda="Da BNCC / currículo catarinense, filtradas pela disciplina escolhida acima."
        competencias={competenciasArea}
        selecionadasIniciais={competenciasSelecionadasIds}
        vazio={
          vinculoTipo === "disciplina" && vinculoId
            ? "Ainda não há competências específicas cadastradas para a área desta disciplina."
            : "Selecione uma disciplina acima para ver as competências específicas disponíveis."
        }
      />

      {etapa === "fundamental_anos_finais" ? (
        <ObjetoConhecimentoPicker
          key={vinculoId ?? "sem-disciplina"}
          titulo="Objeto de conhecimento e habilidades do currículo"
          descricaoAjuda="Escolha o currículo e o ano, abra um objeto de conhecimento e marque as habilidades. Só é possível selecionar a partir da lista."
          habilidades={habilidadesCurriculo}
          selecionadasIniciais={habilidadesSelecionadasIds}
          onAdicionarConteudos={adicionarConteudos}
          anoSugerido={anoSugerido}
          vazio={
            vinculo
              ? "Ainda não há habilidades cadastradas para esta disciplina no banco de dados."
              : "Selecione um componente curricular acima para ver os objetos de conhecimento disponíveis."
          }
        />
      ) : (
        <HabilidadePicker
          titulo="Habilidade(s) selecionada(s)"
          descricaoAjuda="Da BNCC / currículo catarinense, filtradas pela disciplina ou curso técnico escolhido acima."
          habilidades={habilidadesCurriculo}
          selecionadasIniciais={habilidadesSelecionadasIds}
          vazio={
            vinculo
              ? "Ainda não há habilidades cadastradas para esta disciplina/curso no banco de dados."
              : "Selecione uma disciplina ou curso técnico acima para ver as habilidades disponíveis."
          }
        />
      )}

      {usarCurriculoDigital && (
        <HabilidadePicker
          titulo="Habilidades do currículo de educação digital"
          descricaoAjuda="Transversais a todas as disciplinas (códigos EM13CO...)."
          habilidades={habilidadesDigitais}
          selecionadasIniciais={habilidadesSelecionadasIds}
          vazio="Ainda não há habilidades de educação digital cadastradas."
        />
      )}

      {camposTexto.map(({ campo, rotulo, dica }) => (
        <div key={campo}>
          <label htmlFor={campo} className="field-label">
            {rotulo}
          </label>
          {dica && <p className="text-xs text-slate-400">{dica}</p>}
          <textarea
            id={campo}
            name={campo}
            rows={3}
            defaultValue={(plano?.[campo] as string) ?? ""}
            className="input-field"
          />
        </div>
      ))}

      <div>
        <label htmlFor="conteudos_programaticos" className="field-label">
          Objeto(s) de conhecimento em estudo/conteúdos
        </label>
        <p className="text-xs text-slate-400">
          Escreva livremente ou use o botão &quot;Adicionar objeto e conteúdos ao plano&quot; do seletor acima.
        </p>
        <EditorTextoRico
          id="conteudos_programaticos"
          name="conteudos_programaticos"
          valorInicial={plano?.conteudos_programaticos}
          editorRef={conteudosRef}
          linhas={6}
        />
      </div>

      <div>
        <label htmlFor="metodologia" className="field-label">
          Possível caminho metodológico para desenvolvimento da habilidade
        </label>
        <p className="text-xs text-slate-400">
          Ex.: um parágrafo por semana (&quot;PRIMEIRA SEMANA: ...&quot;).
        </p>
        <EditorTextoRico
          id="metodologia"
          name="metodologia"
          valorInicial={plano?.metodologia}
          linhas={6}
        />
      </div>

      <div>
        <label htmlFor="avaliacao" className="field-label">
          Critério(s) de avaliação
        </label>
        <EditorTextoRico
          id="avaliacao"
          name="avaliacao"
          valorInicial={plano?.avaliacao}
          textoAntigoComoLista
          editorRef={avaliacaoRef}
          linhas={5}
        />
        <SugestoesPanel
          rotulo="critérios"
          itens={CRITERIOS_AVALIACAO}
          onAdicionar={(item) => avaliacaoRef.current?.anexar([item], "lista")}
        />
      </div>

      <div>
        <label htmlFor="instrumentos_avaliacao" className="field-label">
          Instrumentos de avaliação
        </label>
        <EditorTextoRico
          id="instrumentos_avaliacao"
          name="instrumentos_avaliacao"
          valorInicial={plano?.instrumentos_avaliacao}
          textoAntigoComoLista
          editorRef={instrumentosRef}
          linhas={4}
        />
        <SugestoesPanel
          rotulo="instrumentos"
          itens={INSTRUMENTOS_AVALIACAO}
          onAdicionar={(item) => instrumentosRef.current?.anexar([item], "lista")}
        />
      </div>

      <div>
        <label htmlFor="referencias" className="field-label">
          Referências complementares <span className="text-slate-400">(opcional)</span>
        </label>
        <p className="text-xs text-slate-400">
          As fontes oficiais (BNCC, Currículo Catarinense{usarCurriculoDigital ? " e Currículo de Educação Digital" : ""}) já entram
          automaticamente nas Referências do plano gerado — você não precisa digitá-las. Use este
          campo apenas para referências adicionais (livros, artigos etc.), uma por linha.
        </p>
        <ReferenciasCampo valorInicial={plano?.referencias} rows={5} />
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
