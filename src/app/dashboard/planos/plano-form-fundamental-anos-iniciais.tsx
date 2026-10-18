"use client";

import { useActionState, useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import OpcoesLogo from "./opcoes-logo";
import type { CompetenciaCurricular, Disciplina, Escola, HabilidadeCurricular, PlanoDeEnsino } from "@/lib/database.types";
import type { EstadoFormulario } from "./actions";
import SecaoPlano, { type TomSecao } from "./secao-plano";
import CurriculoDigitalCampo from "./curriculo-digital-campo";
import MetodologiaIA from "./metodologia-ia";
import { FluxoRodape, FluxoTopo, aoCampoInvalido, semEnterQueEnvia, useFluxoMensal, type PassoMensal } from "./fluxo-mensal";
import RecomposicaoCampo from "./recomposicao-campo";
import { componenteDeRecomposicao } from "@/lib/recomposicao";
import ReferenciasCampo from "./referencias-campo";
import { referenciasOficiais } from "@/lib/referencias-oficiais";
import TurmaSelector, { separarTurma } from "./turma-selector";
import EditorTextoRico, { type EditorTextoRicoHandle } from "./editor-texto-rico";
import SugestoesPanel from "./sugestoes-panel";
import ObjetosEHabilidades from "./objeto-conhecimento-picker";
import CompetenciaPicker from "./competencia-picker";
import { CRITERIOS_AVALIACAO, INSTRUMENTOS_AVALIACAO } from "./sugestoes-avaliacao";
import { lerSecoes, nomeCampoSecao, ordenarComponentes, type CampoSecao } from "@/lib/secoes-componentes";
import type { NomeIcone } from "@/components/icones";

/** Um campo de texto (referência) por componente curricular; cria o da vez em que é pedido pela primeira vez. */
function useRefsPorComponente() {
  const mapa = useRef(new Map<string, { current: EditorTextoRicoHandle | null }>());
  return useCallback((id: string) => {
    let ref = mapa.current.get(id);
    if (!ref) {
      ref = { current: null };
      mapa.current.set(id, ref);
    }
    return ref;
  }, []);
}

interface PlanoFormFundamentalAnosIniciaisProps {
  disciplinas: Disciplina[];
  escolas: Escola[];
  habilidades: HabilidadeCurricular[];
  habilidadesSelecionadasIds?: string[];
  disciplinasSelecionadasIds?: string[];
  /** Competências específicas dos componentes (de todos os componentes dos Anos Iniciais). */
  competencias?: CompetenciaCurricular[];
  competenciasSelecionadasIds?: string[];
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
 *
 * O preenchimento é por fluxo: um passo de cada vez, com um grupo de passos para cada componente curricular
 * (competência, recomposição das aprendizagens — só Língua Portuguesa e Matemática —, objetos e conteúdos,
 * habilidades, caminho metodológico e avaliação). Todos os campos continuam na página (os que não estão na vez
 * ficam escondidos), então nada se perde ao trocar de passo e tudo é enviado ao salvar.
 */

/** Cores dos grupos de componentes (repetem se houver mais componentes que cores). */
const TONS_COMPONENTES: TomSecao[] = ["verde", "azul", "violeta", "ciano", "rosa", "ambar"];

export default function PlanoFormFundamentalAnosIniciais({
  disciplinas,
  escolas,
  habilidades,
  habilidadesSelecionadasIds = [],
  disciplinasSelecionadasIds = [],
  competencias = [],
  competenciasSelecionadasIds = [],
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

  // Um campo de texto por componente (objetos/conteúdos, instrumentos e critérios); marcar caixinhas escreve no do componente certo.
  const refConteudosDe = useRefsPorComponente();
  const refInstrumentosDe = useRefsPorComponente();
  const refMetodologiaDe = useRefsPorComponente();
  const refCriteriosDe = useRefsPorComponente();
  const anoDaSerie = (serie: string | null | undefined) => {
    const m = /(\d+)\s*º/.exec(serie ?? "");
    return m ? Number(m[1]) : null;
  };
  const [anoSugerido, setAnoSugerido] = useState<number | null>(
    anoDaSerie(separarTurma("fundamental_anos_iniciais", plano?.turma).serie)
  );

  // Componentes já marcados alguma vez: os campos deles continuam na página (escondidos se desmarcados),
  // assim o que o professor escreveu não se perde se ele desmarcar sem querer e marcar de novo.
  const [vistos, setVistos] = useState<Set<string>>(new Set(componentesSelecionados));

  function alternarComponente(id: string) {
    setVistos((atual) => (atual.has(id) ? atual : new Set(atual).add(id)));
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

  // Ordem do plano: Português, Matemática, Ciências, História, Geografia... (como no modelo).
  const componentesOrdenados = useMemo(
    () => ordenarComponentes(disciplinas.filter((d) => componentesSelecionados.has(d.id))),
    [disciplinas, componentesSelecionados]
  );
  const componentesVistos = useMemo(
    () => ordenarComponentes(disciplinas.filter((d) => vistos.has(d.id))),
    [disciplinas, vistos]
  );
  // O primeiro componente do plano vira o "componente principal" (consultas e lista de planos);
  // a lista completa vai nos checkboxes "disciplina_ids" do passo 2.
  const componentePrincipalId = componentesOrdenados[0]?.id ?? "";

  // ───────── Passos do fluxo ─────────
  const passos = useMemo<PassoMensal[]>(() => {
    const ident = { grupo: "ident", grupoRotulo: "Identificação", grupoTom: "ardosia", grupoIcone: "escola" } as const;
    const lista: PassoMensal[] = [
      { chave: "ident", rotulo: "Identificação", tom: "ardosia", ...ident },
      { chave: "componentes", rotulo: "Componentes", tom: "ardosia", ...ident },
    ];
    componentesOrdenados.forEach((d, i) => {
      const tom = TONS_COMPONENTES[i % TONS_COMPONENTES.length];
      const g = { grupo: `g-${d.id}`, grupoRotulo: d.nome, grupoTom: tom, grupoIcone: "livro" as NomeIcone };
      lista.push({ chave: `comp-${d.id}`, rotulo: "Competência", tom, ...g });
      if (componenteDeRecomposicao(d.nome)) {
        lista.push({ chave: `recomp-${d.id}`, rotulo: "Recomposição", tom: "ambar", opcional: true, ...g });
      }
      lista.push(
        { chave: `obj-${d.id}`, rotulo: "Objetos e conteúdos", tom, ...g },
        { chave: `hab-${d.id}`, rotulo: "Habilidades", tom, ...g },
        { chave: `metod-${d.id}`, rotulo: "Caminho metodológico", tom, ...g },
        { chave: `aval-${d.id}`, rotulo: "Avaliação", tom, ...g }
      );
    });
    lista.push(
      { chave: "digital", rotulo: "Educação digital", tom: "ambar", grupo: "digital", grupoRotulo: "Educação digital", grupoTom: "ambar", grupoIcone: "globo" as NomeIcone },
      { chave: "fim", rotulo: "Referências e salvar", tom: "azul", grupo: "fim", grupoRotulo: "Fechamento", grupoTom: "azul", grupoIcone: "check" }
    );
    return lista;
  }, [componentesOrdenados]);
  const fluxo = useFluxoMensal(passos);
  const { atual } = fluxo;
  const numeroDe = (chave: string) => passos.findIndex((p) => p.chave === chave) + 1;
  /** Um passo de componente só aparece se o componente continua marcado e se é a vez dele. */
  const foraDaVez = (chave: string, componenteId: string) => atual !== chave || !componentesSelecionados.has(componenteId);

  // Textos já salvos de cada componente. Plano antigo (campo único): o texto vai para o componente principal.
  const secoesSalvas = useMemo(() => {
    const mapa = new Map(lerSecoes(plano?.secoes_componentes).map((x) => [x.disciplina_id, x]));
    if (mapa.size === 0 && plano) {
      const principal = plano.disciplina_id ?? disciplinasSelecionadasIds[0];
      if (principal) {
        mapa.set(principal, {
          disciplina_id: principal,
          conteudos: plano.conteudos_programaticos,
          metodologia: plano.metodologia,
          criterios: plano.avaliacao,
          instrumentos: plano.instrumentos_avaliacao,
        });
      }
    }
    return mapa;
  }, [plano, disciplinasSelecionadasIds]);
  const textoSalvo = (id: string, campo: CampoSecao) => secoesSalvas.get(id)?.[campo] ?? null;

  const competenciasPorComponente = useMemo(() => {
    const mapa = new Map<string, CompetenciaCurricular[]>();
    for (const c of competencias) {
      if (!c.disciplina_id) continue;
      mapa.set(c.disciplina_id, [...(mapa.get(c.disciplina_id) ?? []), c]);
    }
    return mapa;
  }, [competencias]);

  const habilidadesDigitais = useMemo(
    () => habilidades.filter((h) => h.fonte === "curriculo_educacao_digital"),
    [habilidades]
  );

  const semComponente = (
    <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
      Selecione ao menos um componente curricular no passo &quot;Componentes&quot;.
    </p>
  );

  return (
    <form
      action={formAction}
      className="space-y-6"
      onKeyDown={semEnterQueEnvia}
      onInvalidCapture={aoCampoInvalido(() => fluxo.ir("ident"))}
    >
      <input type="hidden" name="etapa" value="fundamental_anos_iniciais" />
      <input type="hidden" name="vinculo_tipo" value="disciplina" />
      <input type="hidden" name="vinculo_id" value={componentePrincipalId} />
      <input type="hidden" name="tem_secoes" value="1" />

      <FluxoTopo passos={passos} atual={atual} vistos={fluxo.vistos} aoIr={fluxo.ir} topo={fluxo.topo} />

      {/* ───────── Identificação ───────── */}
      <SecaoPlano
        id="passo-ident"
        tom="ardosia"
        oculto={atual !== "ident"}
        numero={numeroDe("ident")}
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

      {/* ───────── Componentes curriculares ───────── */}
      <SecaoPlano
        id="passo-componentes"
        tom="ardosia"
        oculto={atual !== "componentes"}
        numero={numeroDe("componentes")}
        titulo="Componente(s) curricular(es)"
        descricao="Escolha um componente — ou mais de um, se o plano for interdisciplinar. Cada um ganha o seu conjunto de passos."
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

      {/* ───────── Passos de cada componente ───────── */}
      {componentesVistos.map((d) => {
        const ativo = componentesSelecionados.has(d.id);
        const comp = componentesOrdenados.findIndex((x) => x.id === d.id);
        const tom = TONS_COMPONENTES[(comp < 0 ? 0 : comp) % TONS_COMPONENTES.length];
        const tipoRecomposicao = componenteDeRecomposicao(d.nome);
        const cs = competenciasPorComponente.get(d.id) ?? [];
        const habsDoComponente = habilidades.filter((h) => h.disciplina_id === d.id && h.fonte !== "curriculo_educacao_digital");
        return (
          <div key={d.id} hidden={!ativo} className="space-y-6">
            {/* Competência específica */}
            <SecaoPlano
              id={`passo-comp-${d.id}`}
              tom={tom}
              oculto={foraDaVez(`comp-${d.id}`, d.id)}
              numero={numeroDe(`comp-${d.id}`)}
              titulo={`Competência específica — ${d.nome}`}
              descricao="Escolha a competência específica do componente; ela aparece no plano logo abaixo do nome do componente."
            >
              {ativo && (
                <CompetenciaPicker
                  competencias={cs}
                  selecionadasIniciais={cs.filter((c) => competenciasSelecionadasIds.includes(c.id)).map((c) => c.id)}
                  vazio={`Ainda não há competências específicas cadastradas para ${d.nome}.`}
                />
              )}
            </SecaoPlano>

            {/* Recomposição das aprendizagens (só Língua Portuguesa e Matemática) */}
            {tipoRecomposicao && (
              <SecaoPlano
                id={`passo-recomp-${d.id}`}
                tom="ambar"
                oculto={foraDaVez(`recomp-${d.id}`, d.id)}
                numero={numeroDe(`recomp-${d.id}`)}
                titulo={`Recomposição das aprendizagens (opcional) — ${d.nome}`}
                descricao="Para retomar habilidades e conteúdos de anos anteriores. Se não for usar, deixe como está e siga em frente."
              >
                <RecomposicaoCampo
                  idBase={`recomp-${d.id}`}
                  nomeComponente={d.nome}
                  componente={tipoRecomposicao}
                  nomeCampoHabilidades={nomeCampoSecao("recomposicao_habilidades", d.id)}
                  nomeCampoObjetos={nomeCampoSecao("recomposicao_objetos", d.id)}
                  valorHabilidades={textoSalvo(d.id, "recomposicao_habilidades")}
                  valorObjetos={textoSalvo(d.id, "recomposicao_objetos")}
                />
              </SecaoPlano>
            )}

            {/* Objetos de conhecimento, conteúdos e habilidades do componente */}
            <ObjetosEHabilidades
              habilidades={ativo ? habsDoComponente : []}
              selecionadasIniciais={habilidadesSelecionadasIds}
              editorRef={refConteudosDe(d.id)}
              anoSugerido={anoSugerido}
              rotuloComponente={d.nome}
              tom={tom}
              editorConteudos={
                <div>
                  <label htmlFor={`conteudos-${d.id}`} className="field-label">
                    Objetos e conteúdos de {d.nome}
                  </label>
                  <p className="text-xs text-slate-500">
                    O que você marcar nas caixinhas aparece aqui; você também pode escrever livremente.
                  </p>
                  <EditorTextoRico
                    id={`conteudos-${d.id}`}
                    name={nomeCampoSecao("conteudos", d.id)}
                    valorInicial={textoSalvo(d.id, "conteudos")}
                    editorRef={refConteudosDe(d.id)}
                    linhas={4}
                  />
                </div>
              }
              numeroObjetos={numeroDe(`obj-${d.id}`)}
              numeroHabilidades={numeroDe(`hab-${d.id}`)}
              idObjetos={`passo-obj-${d.id}`}
              idHabilidades={`passo-hab-${d.id}`}
              ocultarObjetos={foraDaVez(`obj-${d.id}`, d.id)}
              ocultarHabilidades={foraDaVez(`hab-${d.id}`, d.id)}
              vazio={`Ainda não há habilidades cadastradas para ${d.nome}.`}
            />

            {/* Caminho metodológico */}
            <SecaoPlano
              id={`passo-metod-${d.id}`}
              tom={tom}
              oculto={foraDaVez(`metod-${d.id}`, d.id)}
              numero={numeroDe(`metod-${d.id}`)}
              titulo={`Caminho metodológico — ${d.nome}`}
              descricao="Passo a passo para desenvolver as habilidades selecionadas."
            >
              <MetodologiaIA editorRef={refMetodologiaDe(d.id)}>
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    A Sequência Didática é a metodologia recomendada; descreva também os recursos usados em cada aula.
                  </p>
                  <div>
                    <label htmlFor={`metodologia-${d.id}`} className="field-label">
                      Caminho metodológico de {d.nome}
                    </label>
                    <EditorTextoRico
                      id={`metodologia-${d.id}`}
                      name={nomeCampoSecao("metodologia", d.id)}
                      valorInicial={textoSalvo(d.id, "metodologia")}
                      linhas={5}
                      editorRef={refMetodologiaDe(d.id)}
                    />
                  </div>
                </div>
              </MetodologiaIA>
            </SecaoPlano>

            {/* Avaliação */}
            <SecaoPlano
              id={`passo-aval-${d.id}`}
              tom={tom}
              oculto={foraDaVez(`aval-${d.id}`, d.id)}
              numero={numeroDe(`aval-${d.id}`)}
              titulo={`Avaliação — ${d.nome}`}
              descricao="Critérios e instrumentos — use as sugestões ou escreva livremente."
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor={`criterios-${d.id}`} className="field-label">
                    Critérios de Avaliação — {d.nome}
                  </label>
                  <p className="text-xs text-slate-500">
                    De acordo com as habilidades desenvolvidas — vira lista com marcadores no PDF.
                  </p>
                  <EditorTextoRico
                    id={`criterios-${d.id}`}
                    name={nomeCampoSecao("criterios", d.id)}
                    valorInicial={textoSalvo(d.id, "criterios")}
                    textoAntigoComoLista
                    editorRef={refCriteriosDe(d.id)}
                    linhas={4}
                  />
                  <SugestoesPanel rotulo={`critérios de ${d.nome}`} itens={CRITERIOS_AVALIACAO} editorRef={refCriteriosDe(d.id)} />
                </div>

                <div>
                  <label htmlFor={`instrumentos-${d.id}`} className="field-label">
                    Instrumentos de Avaliação — {d.nome}
                  </label>
                  <p className="text-xs text-slate-500">
                    Ex.: prova, lista de exercícios, portfólio, trabalho, seminário, produções orais.
                  </p>
                  <EditorTextoRico
                    id={`instrumentos-${d.id}`}
                    name={nomeCampoSecao("instrumentos", d.id)}
                    valorInicial={textoSalvo(d.id, "instrumentos")}
                    textoAntigoComoLista
                    editorRef={refInstrumentosDe(d.id)}
                    linhas={4}
                  />
                  <SugestoesPanel
                    rotulo={`instrumentos de ${d.nome}`}
                    itens={INSTRUMENTOS_AVALIACAO}
                    editorRef={refInstrumentosDe(d.id)}
                  />
                </div>
              </div>
            </SecaoPlano>
          </div>
        );
      })}

      {componentesSelecionados.size === 0 && atual !== "ident" && atual !== "componentes" && semComponente}

      {/* ───────── Currículo de educação digital ───────── */}
      <SecaoPlano
        id="passo-digital"
        tom="ambar"
        oculto={atual !== "digital"}
        numero={numeroDe("digital")}
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

      {/* ───────── Referências e finalização ───────── */}
      <SecaoPlano
        id="passo-fim"
        tom="azul"
        oculto={atual !== "fim"}
        numero={numeroDe("fim")}
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
            automaticamente. Para ver e editar essas fontes aqui, clique em “Adicionar referências sugeridas”; use o quadro também para as demais referências, uma por linha.
          </p>
          <ReferenciasCampo valorInicial={plano?.referencias} rows={4} sugeridas={referenciasOficiais("fundamental_anos_iniciais", usarCurriculoDigital)} />
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

      <FluxoRodape
        passos={passos}
        indice={fluxo.indice}
        ultimo={fluxo.ultimo}
        voltar={fluxo.voltar}
        avancar={fluxo.avancar}
        pendente={pendente}
        textoBotao={textoBotao}
        erro={estado.erro}
      />
    </form>
  );
}
