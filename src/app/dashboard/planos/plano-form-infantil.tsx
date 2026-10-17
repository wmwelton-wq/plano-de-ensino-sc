"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import type { Disciplina, Escola, HabilidadeCurricular, PlanoDeEnsino } from "@/lib/database.types";
import type { EstadoFormulario } from "./actions";
import HabilidadePicker from "./habilidade-picker";
import SecaoPlano from "./secao-plano";
import PassosPlano from "./passos-plano";
import MetodologiaIA from "./metodologia-ia";
import BarraSalvar from "./barra-salvar";
import OpcoesLogo from "./opcoes-logo";
import ReferenciasCampo from "./referencias-campo";
import { referenciasOficiais } from "@/lib/referencias-oficiais";
import EditorTextoRico, { type EditorTextoRicoHandle } from "./editor-texto-rico";
import SugestoesPanel from "./sugestoes-panel";
import { CRITERIOS_INFANTIL, INSTRUMENTOS_INFANTIL } from "./sugestoes-avaliacao";
import TurmaSelector, { GRUPO_ETARIO_POR_SERIE } from "./turma-selector";

interface PlanoFormInfantilProps {
  camposExperiencia: Disciplina[];
  escolas: Escola[];
  objetivosAprendizagem: HabilidadeCurricular[];
  objetivosSelecionadosIds?: string[];
  plano?: PlanoDeEnsino;
  action: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  textoBotao: string;
}

const GRUPOS_ETARIOS = ["Bebês", "Crianças bem pequenas", "Crianças pequenas"];

const PASSOS = [
  { id: "passo-1", rotulo: "Identificação" },
  { id: "passo-2", rotulo: "Objetivos" },
  { id: "passo-3", rotulo: "Experiências" },
  { id: "passo-4", rotulo: "Metodologia" },
  { id: "passo-5", rotulo: "Avaliação" },
  { id: "passo-6", rotulo: "Referências e salvar" },
];

export default function PlanoFormInfantil({
  camposExperiencia,
  escolas,
  objetivosAprendizagem,
  objetivosSelecionadosIds = [],
  plano,
  action,
  textoBotao,
}: PlanoFormInfantilProps) {
  const [estado, formAction, pendente] = useActionState(action, {});
  const [campoPrincipal, setCampoPrincipal] = useState(plano?.disciplina_id ?? "");
  const refAvaliacao = useRef<EditorTextoRicoHandle>(null);
  const refInstrumentos = useRef<EditorTextoRicoHandle>(null);
  const [grupoEtario, setGrupoEtario] = useState(plano?.grupo_etario ?? "");

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="etapa" value="educacao_infantil" />
      <input type="hidden" name="vinculo_tipo" value="disciplina" />

      <PassosPlano passos={PASSOS} />

      {/* ───────── 1. Identificação ───────── */}
      <SecaoPlano
        id="passo-1"
        numero={1}
        titulo="Identificação do plano"
        descricao="Campo de experiência, grupo etário, turma e período."
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
              placeholder="Ex.: Plano — Berçário II — Corpo, gestos e movimentos"
              className="input-field"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="vinculo_id" className="field-label">
              Campo de experiência principal
            </label>
            <select
              id="vinculo_id"
              name="vinculo_id"
              required
              value={campoPrincipal}
              onChange={(e) => setCampoPrincipal(e.target.value)}
              className="input-field"
            >
              <option value="">Selecione...</option>
              {camposExperiencia.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <p className="field-hint">
              O planejamento pode integrar vários campos — no passo 2 você seleciona os objetivos de
              todos eles. Este é só o campo de foco principal, para organizar seus planos.
            </p>
          </div>

          <div>
            <label htmlFor="grupo_etario" className="field-label">
              Grupo etário
            </label>
            <select
              id="grupo_etario"
              name="grupo_etario"
              value={grupoEtario}
              onChange={(e) => setGrupoEtario(e.target.value)}
              className="input-field"
            >
              <option value="">Selecione...</option>
              {GRUPOS_ETARIOS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <TurmaSelector
            etapa="educacao_infantil"
            valorInicial={plano?.turma}
            rotuloSerie="Turma / grupo"
            rotuloTurma="Identificação"
            onSerieChange={(serie) => {
              const sugestao = GRUPO_ETARIO_POR_SERIE[serie];
              if (sugestao) setGrupoEtario(sugestao);
            }}
          />

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

          <div className="hidden sm:block" aria-hidden="true" />

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

          <OpcoesLogo plano={plano} />
        </div>
      </SecaoPlano>

      {/* ───────── 2. Objetivos ───────── */}
      <SecaoPlano
        id="passo-2"
        numero={2}
        titulo="Objetivos de aprendizagem e desenvolvimento"
        descricao="Da BNCC / Currículo Base SC — de todos os campos de experiência, para um planejamento integrado."
      >
        <HabilidadePicker
          rotuloBotao="Clique para adicionar objetivos de aprendizagem"
          habilidades={objetivosAprendizagem}
          selecionadasIniciais={objetivosSelecionadosIds}
          vazio="Ainda não há objetivos de aprendizagem e desenvolvimento cadastrados para a Educação Infantil no banco de dados."
        />
      </SecaoPlano>

      {/* ───────── 3. Experiências ───────── */}
      <SecaoPlano
        id="passo-3"
        numero={3}
        titulo="Experiências e interações propostas"
        descricao="O que as crianças vão vivenciar: brincadeiras, explorações, rodas de conversa etc."
      >
        <div>
          <label htmlFor="conteudos_programaticos" className="field-label">
            Experiências e interações
          </label>
          <EditorTextoRico
            id="conteudos_programaticos"
            name="conteudos_programaticos"
            valorInicial={plano?.conteudos_programaticos}
            linhas={5}
          />
        </div>
      </SecaoPlano>

      {/* ───────── 4. Metodologia ───────── */}
      <SecaoPlano
        id="passo-4"
        numero={4}
        titulo="Metodologia / rotina"
        descricao="Como as experiências se organizam no dia a dia (por semana, por momento da rotina)."
      >
        <MetodologiaIA>
          <div>
            <label htmlFor="metodologia" className="field-label">
              Metodologia / rotina
            </label>
            <EditorTextoRico
              id="metodologia"
              name="metodologia"
              valorInicial={plano?.metodologia}
              linhas={6}
            />
          </div>
        </MetodologiaIA>
      </SecaoPlano>

      {/* ───────── 5. Avaliação ───────── */}
      <SecaoPlano
        id="passo-5"
        numero={5}
        titulo="Avaliação — observação, escuta e registro"
        descricao="Critérios e instrumentos de registro — use as sugestões ou escreva livremente."
      >
        <div>
          <label htmlFor="avaliacao" className="field-label">
            Critérios de observação
          </label>
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
            itens={CRITERIOS_INFANTIL}
            editorRef={refAvaliacao}
          />
        </div>

        <div>
          <label htmlFor="instrumentos_avaliacao" className="field-label">
            Instrumentos de registro
          </label>
          <p className="text-xs text-slate-500">
            Ex.: portfólio, registros fotográficos, relatórios de observação.
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
            itens={INSTRUMENTOS_INFANTIL}
            editorRef={refInstrumentos}
          />
        </div>
      </SecaoPlano>

      {/* ───────── 6. Referências e finalização ───────── */}
      <SecaoPlano
        id="passo-6"
        numero={6}
        titulo="Referências e finalização"
        descricao="Última etapa: referências extras e situação do plano."
      >
        <div>
          <label htmlFor="referencias" className="field-label">
            Referências complementares <span className="text-slate-400">(opcional)</span>
          </label>
          <p className="text-xs text-slate-500">
            As fontes oficiais (BNCC e Currículo Base SC) já entram automaticamente nas Referências
            do plano gerado. Para ver e editar essas fontes aqui, clique em “Adicionar referências sugeridas”; use o quadro também para referências adicionais, uma por linha.
          </p>
          <ReferenciasCampo valorInicial={plano?.referencias} rows={4} sugeridas={referenciasOficiais("educacao_infantil", false)} />
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
