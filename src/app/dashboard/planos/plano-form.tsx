"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type {
  Disciplina,
  CursoTecnico,
  Escola,
  HabilidadeCurricular,
  ObjetoConhecimentoMedio,
  CompetenciaCurricular,
  PlanoDeEnsino,
  EtapaPlano,
} from "@/lib/database.types";
import type { EstadoFormulario } from "./actions";
import HabilidadePicker from "./habilidade-picker";
import SecaoPlano from "./secao-plano";
import CurriculoDigitalCampo from "./curriculo-digital-campo";
import MetodologiaIA from "./metodologia-ia";
import { FluxoRodape, FluxoTopo, aoCampoInvalido, semEnterQueEnvia, useFluxoMensal, useGravacaoPlano, type PassoMensal } from "./fluxo-mensal";
import CamposPeriodo from "./campos-periodo";
import FaltouAlgoBotao from "../faltou-algo/faltou-algo-botao";
import RecomposicaoCampo from "./recomposicao-campo";
import { componenteDeRecomposicao } from "@/lib/recomposicao";
import { lerSecoes } from "@/lib/secoes-componentes";
import OpcoesLogo from "./opcoes-logo";
import ReferenciasCampo from "./referencias-campo";
import { referenciasOficiais } from "@/lib/referencias-oficiais";
import TurmaSelector, { separarTurma } from "./turma-selector";
import ObjetosEHabilidades from "./objeto-conhecimento-picker";
import ObjetoMedioPicker from "./objeto-medio-picker";
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
  /** Objetos de conhecimento do Ensino Médio (por disciplina e série). */
  objetosMedio?: ObjetoConhecimentoMedio[];
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
  /** Passo em que o formulário abre (vem do aviso "o que falta preencher"). */
  passoInicial?: string;
}

const ROTULO_ETAPA_FALTOU: Record<EtapaPlano, string> = {
  educacao_infantil: "Educação Infantil",
  fundamental_anos_iniciais: "Ensino Fundamental — Anos Iniciais",
  fundamental_anos_finais: "Ensino Fundamental — Anos Finais",
  ensino_medio: "Ensino Médio / Curso Técnico",
};

/** Passos do plano (um de cada vez): a recomposição só existe para Língua Portuguesa e Matemática. */
function montarPassos(comRecomposicao: boolean): PassoMensal[] {
  const ident = { grupo: "ident", grupoRotulo: "Identificação", grupoTom: "ardosia", grupoIcone: "escola" } as const;
  const curr = { grupo: "curriculo", grupoRotulo: "Competências e habilidades", grupoTom: "verde", grupoIcone: "livro" } as const;
  const aula = { grupo: "aula", grupoRotulo: "Metodologia e avaliação", grupoTom: "violeta", grupoIcone: "lapis" } as const;
  const fim = { grupo: "fim", grupoRotulo: "Fechamento", grupoTom: "azul", grupoIcone: "check" } as const;
  const lista: PassoMensal[] = [
    { chave: "ident", rotulo: "Identificação", tom: "ardosia", ...ident },
    { chave: "comp", rotulo: "Competências", tom: "verde", ...curr },
  ];
  if (comRecomposicao) lista.push({ chave: "recomp", rotulo: "Recomposição", tom: "ambar", opcional: true, ...curr });
  lista.push(
    { chave: "obj", rotulo: "Objetos e conteúdos", tom: "verde", ...curr },
    { chave: "hab", rotulo: "Habilidades", tom: "verde", ...curr },
    { chave: "digital", rotulo: "Educação digital", tom: "ambar", opcional: true, ...curr },
    { chave: "metod", rotulo: "Caminho metodológico", tom: "violeta", ...aula },
    { chave: "aval", rotulo: "Avaliação", tom: "violeta", ...aula },
    { chave: "fim", rotulo: "Referências e salvar", tom: "azul", ...fim }
  );
  return lista;
}

export default function PlanoForm({
  etapa,
  disciplinas,
  cursos,
  escolas,
  habilidades,
  habilidadesSelecionadasIds = [],
  objetosMedio = [],
  competencias,
  competenciasSelecionadasIds = [],
  plano,
  action,
  rotuloTurma,
  rotuloGrupoDisciplinas = "Formação Geral Básica",
  passoInicial,
}: PlanoFormProps) {
  const grav = useGravacaoPlano(action, plano?.id);
  const [erroPasso, setErroPasso] = useState<string | undefined>();

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
  const metodologiaRef = useRef<EditorTextoRicoHandle>(null);
  const anoDaSerie = (serie: string | null | undefined) => {
    const m = /(\d+)\s*[ºª°]/.exec(serie ?? "");
    return m ? Number(m[1]) : null;
  };
  const [anoSugerido, setAnoSugerido] = useState<number | null>(
    anoDaSerie(separarTurma(etapa, plano?.turma).serie)
  );
  const avaliacaoRef = useRef<EditorTextoRicoHandle>(null);
  const instrumentosRef = useRef<EditorTextoRicoHandle>(null);

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

  const objetosDaDisciplina = useMemo(
    () =>
      vinculoTipo === "disciplina" && vinculoId
        ? objetosMedio.filter((o) => o.disciplina_id === vinculoId)
        : [],
    [objetosMedio, vinculoTipo, vinculoId]
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

  const recomposicaoDe = vinculoTipo === "disciplina" ? componenteDeRecomposicao(disciplinaSelecionada?.nome) : null;
  const passos = useMemo(() => montarPassos(Boolean(recomposicaoDe)), [recomposicaoDe]);
  const fluxo = useFluxoMensal(passos, passoInicial);
  const { atual } = fluxo;
  async function salvarEContinuar() {
    const r = await grav.salvarPasso();
    setErroPasso(r.erro);
    if (r.ok) fluxo.avancar();
  }
  const numeroDe = (chave: string) => passos.findIndex((p) => p.chave === chave) + 1;
  const secaoSalva = lerSecoes(plano?.secoes_componentes).find((x) => x.disciplina_id === vinculoId);

  const contextoFaltou = {
    etapa: ROTULO_ETAPA_FALTOU[etapa],
    disciplina: disciplinaSelecionada?.nome,
    serie: anoSugerido ? `${anoSugerido}${etapa === "ensino_medio" ? "ª série" : "º ano"}` : undefined,
  };

  const campoConteudos = (
    <div>
      <label htmlFor="conteudos_programaticos" className="field-label">
        Objeto(s) de conhecimento em estudo/conteúdos
      </label>
      <p className="text-xs text-slate-500">
        O que você marcar nas caixinhas das sugestões aparece aqui. Você também pode escrever livremente.
      </p>
      <EditorTextoRico
        id="conteudos_programaticos"
        name="conteudos_programaticos"
        valorInicial={plano?.conteudos_programaticos}
        editorRef={conteudosRef}
        linhas={6}
      />
      <p className="mt-2">
        <FaltouAlgoBotao tipo="objeto_conhecimento" contexto={contextoFaltou} rotulo="Não achou um objeto de conhecimento? Avise a gente" />
      </p>
    </div>
  );

  return (
    <form
      {...grav.formProps}
      className="space-y-6"
      onKeyDown={semEnterQueEnvia}
      onInvalidCapture={aoCampoInvalido(() => fluxo.ir("ident"))}
    >
      <input type="hidden" name="etapa" value={etapa} />
      <input type="hidden" name="vinculo_tipo" value={vinculoTipo ?? ""} />
      <input type="hidden" name="vinculo_id" value={vinculoId ?? ""} />
      {/* Avisa o servidor que este formulário cuida da recomposição (assim, trocar de disciplina limpa a anterior). */}
      <input type="hidden" name="tem_recomposicao" value="1" />

      <FluxoTopo passos={passos} atual={atual} vistos={fluxo.vistos} aoIr={(chave) => { void grav.autosalvarSeSujo(); fluxo.ir(chave); }} topo={fluxo.topo} />

      {/* ───────── 1. Identificação ───────── */}
      <SecaoPlano
        id="passo-1"
        tom="ardosia"
        oculto={atual !== "ident"}
        numero={1}
        titulo="Identificação do plano"
        descricao="Disciplina, turma, período e escola."
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

          <div className="hidden sm:block" aria-hidden="true" />

          <CamposPeriodo inicioInicial={plano?.data_inicio} fimInicial={plano?.data_fim} />

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

          <OpcoesLogo plano={plano} />
        </div>
      </SecaoPlano>

      {/* ───────── 2. Competências ───────── */}
      <SecaoPlano
        id="passo-2"
        tom="verde"
        oculto={atual !== "comp"}
        numero={numeroDe("comp")}
        titulo="Competência específica do componente curricular"
        descricao="Da BNCC / currículo catarinense, filtradas pela disciplina escolhida no passo 1."
      >
        <CompetenciaPicker
          competencias={competenciasArea}
          selecionadasIniciais={competenciasSelecionadasIds}
          vazio={
            vinculoTipo === "disciplina" && vinculoId
              ? "Ainda não há competências específicas cadastradas para a área desta disciplina."
              : "Selecione uma disciplina no passo 1 para ver as competências específicas disponíveis."
          }
        />
        <p className="mt-3">
          <FaltouAlgoBotao tipo="competencia" contexto={contextoFaltou} rotulo="Faltou uma competência? Avise a gente" />
        </p>
      </SecaoPlano>

      {/* ───────── Recomposição das aprendizagens (só Língua Portuguesa e Matemática) ───────── */}
      {recomposicaoDe && (
        <SecaoPlano
          id="passo-recomposicao"
          tom="ambar"
          oculto={atual !== "recomp"}
          numero={numeroDe("recomp")}
          titulo="Recomposição das aprendizagens (opcional)"
          descricao="Para retomar habilidades e conteúdos de anos anteriores em Língua Portuguesa e Matemática."
        >
          <RecomposicaoCampo
            key={vinculoId}
            idBase={`recomp-${vinculoId}`}
            nomeComponente={disciplinaSelecionada?.nome ?? ""}
            componente={recomposicaoDe}
            nomeCampoHabilidades="recomposicao_habilidades"
            nomeCampoObjetos="recomposicao_objetos"
            valorHabilidades={secaoSalva?.recomposicao_habilidades}
            valorObjetos={secaoSalva?.recomposicao_objetos}
          />
        </SecaoPlano>
      )}

      {/* ───────── 3 e 4. Objetos de conhecimento, conteúdos e habilidades ───────── */}
      {etapa === "fundamental_anos_finais" ? (
        <ObjetosEHabilidades
          key={vinculoId ?? "sem-disciplina"}
          habilidades={habilidadesCurriculo}
          selecionadasIniciais={habilidadesSelecionadasIds}
          editorRef={conteudosRef}
          anoSugerido={anoSugerido}
          editorConteudos={campoConteudos}
          numeroObjetos={numeroDe("obj")}
          numeroHabilidades={numeroDe("hab")}
          idObjetos="passo-3"
          idHabilidades="passo-4"
          ocultarObjetos={atual !== "obj"}
          ocultarHabilidades={atual !== "hab"}
          vazio={
            vinculo
              ? "Ainda não há habilidades cadastradas para esta disciplina no banco de dados."
              : "Selecione um componente curricular no passo 1 para ver os objetos de conhecimento disponíveis."
          }
        />
      ) : (
        <>
          <SecaoPlano
            id="passo-3"
            tom="verde"
            oculto={atual !== "obj"}
            numero={numeroDe("obj")}
            titulo="Objetos de conhecimento e conteúdos"
            descricao="Marque as caixinhas das sugestões do currículo ou escreva livremente no campo abaixo."
          >
            {etapa === "ensino_medio" && (
              <ObjetoMedioPicker
                key={vinculoId ?? "sem-disciplina"}
                objetos={objetosDaDisciplina}
                serieSugerida={anoSugerido}
                editorRef={conteudosRef}
                vazio={
                  vinculoTipo === "curso"
                    ? "Cursos técnicos não têm lista de objetos de conhecimento; escreva os conteúdos no campo abaixo."
                    : vinculo
                    ? "Ainda não há objetos de conhecimento cadastrados para esta disciplina."
                    : "Selecione uma disciplina no passo 1 para ver os objetos de conhecimento disponíveis."
                }
              />
            )}
            {campoConteudos}
          </SecaoPlano>

          <SecaoPlano
            id="passo-4"
            tom="verde"
            oculto={atual !== "hab"}
            numero={numeroDe("hab")}
            titulo="Selecionar habilidades"
            descricao="Da BNCC / currículo catarinense, filtradas pela disciplina ou curso técnico escolhido."
          >
            <HabilidadePicker
              key={vinculoId ?? "sem-disciplina-hab"}
              habilidades={habilidadesCurriculo}
              selecionadasIniciais={habilidadesSelecionadasIds}
              vazio={
                vinculo
                  ? "Ainda não há habilidades cadastradas para esta disciplina/curso no banco de dados."
                  : "Selecione uma disciplina ou curso técnico no passo 1 para ver as habilidades disponíveis."
              }
            />
            <p className="mt-3">
              <FaltouAlgoBotao tipo="habilidade" contexto={contextoFaltou} rotulo="Faltou uma habilidade? Avise a gente" />
            </p>
          </SecaoPlano>
        </>
      )}

      {/* ───────── 5. Currículo de educação digital ───────── */}
      <SecaoPlano
        id="passo-5"
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
          descricaoAjuda={`Transversais a todas as disciplinas (códigos ${
            etapa === "ensino_medio" ? "EM13CO..." : "EF0xCO..."
          }).`}
          vazio="Ainda não há habilidades de educação digital cadastradas."
        />
      </SecaoPlano>

      {/* ───────── 6. Caminho metodológico ───────── */}
      <SecaoPlano
        id="passo-6"
        tom="violeta"
        oculto={atual !== "metod"}
        numero={numeroDe("metod")}
        titulo="Possível caminho metodológico"
        descricao="Como as habilidades serão desenvolvidas — por exemplo, um parágrafo por semana."
      >
        <MetodologiaIA editorRef={metodologiaRef}>
          <div>
            <label htmlFor="metodologia" className="field-label">
              Caminho metodológico para desenvolvimento da habilidade
            </label>
            <p className="text-xs text-slate-500">
              Ex.: um parágrafo por semana (&quot;PRIMEIRA SEMANA: ...&quot;).
            </p>
            <EditorTextoRico
              id="metodologia"
              name="metodologia"
              valorInicial={plano?.metodologia}
              linhas={6}
              editorRef={metodologiaRef}
            />
          </div>
        </MetodologiaIA>
      </SecaoPlano>

      {/* ───────── 7. Avaliação ───────── */}
      <SecaoPlano
        id="passo-7"
        tom="violeta"
        oculto={atual !== "aval"}
        numero={numeroDe("aval")}
        titulo="Avaliação"
        descricao="Critérios e instrumentos — use as sugestões ou escreva livremente."
      >
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
            editorRef={avaliacaoRef}
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
            editorRef={instrumentosRef}
          />
        </div>
      </SecaoPlano>

      {/* ───────── 8. Referências e finalização ───────── */}
      <SecaoPlano
        id="passo-8"
        tom="azul"
        oculto={atual !== "fim"}
        numero={numeroDe("fim")}
        titulo="Referências e finalização"
        descricao="Última etapa: referências extras e situação do plano."
      >
        <div>
          <label htmlFor="referencias" className="field-label">
            Referências complementares <span className="text-slate-400">(opcional)</span>
          </label>
          <p className="text-xs text-slate-500">
            As fontes oficiais (BNCC, Currículo Catarinense{usarCurriculoDigital ? " e Currículo de Educação Digital" : ""}) já entram
            automaticamente nas Referências do plano gerado. Se quiser ver e editar essas fontes aqui, clique em
            “Adicionar referências sugeridas”. Use o quadro também para referências adicionais (livros, artigos etc.), uma por linha.
          </p>
          <ReferenciasCampo valorInicial={plano?.referencias} rows={5} sugeridas={referenciasOficiais(etapa, usarCurriculoDigital)} />
        </div>

        <p>
          <FaltouAlgoBotao tipo="outro" contexto={contextoFaltou} rotulo="Faltou alguma coisa no seu plano? Avise a gente" />
        </p>

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
        salvarEContinuar={salvarEContinuar}
        pendente={grav.pendente}
        salvando={grav.salvando}
        salvoEm={grav.salvoEm}
        avisoAuto={grav.avisoAuto}
        erro={grav.estado.erro ?? erroPasso}
      />
    </form>
  );
}
