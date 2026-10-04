"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import type { Disciplina, Escola, HabilidadeCurricular, PlanoDeEnsino } from "@/lib/database.types";
import type { EstadoFormulario } from "./actions";
import HabilidadePicker from "./habilidade-picker";
import ReferenciasCampo from "./referencias-campo";
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

const camposTexto: {
  campo: keyof PlanoDeEnsino;
  rotulo: string;
  dica?: string;
  rows: number;
}[] = [
  {
    campo: "objetivos",
    rotulo: "Objetivos (uso interno)",
    dica: "Uso interno para seu planejamento — não aparece no PDF do plano.",
    rows: 3,
  },
  {
    campo: "conteudos_programaticos",
    rotulo: "Experiências e interações propostas",
    dica: "Um item por linha — o que as crianças vão vivenciar (brincadeiras, explorações, rodas de conversa etc.).",
    rows: 4,
  },
  {
    campo: "metodologia",
    rotulo: "Metodologia / rotina",
    dica: "Como as experiências vão se organizar no dia a dia (ex.: por semana, por momento da rotina).",
    rows: 5,
  },
  {
    campo: "avaliacao",
    rotulo: "Avaliação — observação, escuta e registro",
    dica: "Um critério por linha.",
    rows: 4,
  },
  {
    campo: "instrumentos_avaliacao",
    rotulo: "Instrumentos de registro",
    dica: "Um item por linha (ex.: portfólio, registros fotográficos, relatórios de observação).",
    rows: 3,
  },
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
          <p className="mt-1 text-xs text-slate-400">
            O planejamento pode integrar vários campos — abaixo você seleciona os objetivos de
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
          <p className="mt-1 text-xs text-slate-400">
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
      </div>

      <HabilidadePicker
        titulo="Objetivos de aprendizagem e desenvolvimento"
        descricaoAjuda="Da BNCC / Currículo Base SC — de todos os campos de experiência, para você montar um planejamento integrado."
        habilidades={objetivosAprendizagem}
        selecionadasIniciais={objetivosSelecionadosIds}
        vazio="Ainda não há objetivos de aprendizagem e desenvolvimento cadastrados para a Educação Infantil no banco de dados."
      />

      {camposTexto.map(({ campo, rotulo, dica, rows }) => {
        const formatado = campo !== "objetivos";
        const sugestoes =
          campo === "avaliacao"
            ? { itens: CRITERIOS_INFANTIL, rotulo: "critérios", ref: refAvaliacao }
            : campo === "instrumentos_avaliacao"
            ? { itens: INSTRUMENTOS_INFANTIL, rotulo: "instrumentos", ref: refInstrumentos }
            : null;
        return (
          <div key={campo}>
            <label htmlFor={campo} className="field-label">
              {rotulo}
            </label>
            {dica && <p className="text-xs text-slate-400">{dica}</p>}
            {formatado ? (
              <EditorTextoRico
                id={campo}
                name={campo}
                valorInicial={plano?.[campo] as string | null | undefined}
                textoAntigoComoLista={campo === "avaliacao" || campo === "instrumentos_avaliacao"}
                editorRef={sugestoes?.ref}
                linhas={rows + 1}
              />
            ) : (
              <textarea
                id={campo}
                name={campo}
                rows={rows}
                defaultValue={(plano?.[campo] as string) ?? ""}
                className="input-field"
              />
            )}
            {sugestoes && (
              <SugestoesPanel
                rotulo={sugestoes.rotulo}
                itens={sugestoes.itens}
                onAdicionar={(item) => sugestoes.ref.current?.anexar([item], "lista")}
              />
            )}
          </div>
        );
      })}

      <div>
        <label htmlFor="referencias" className="field-label">
          Referências complementares <span className="text-slate-400">(opcional)</span>
        </label>
        <p className="text-xs text-slate-400">
          As fontes oficiais (BNCC e Currículo Base SC) já entram automaticamente nas Referências
          do plano gerado. Use este campo só para referências adicionais, uma por linha.
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
