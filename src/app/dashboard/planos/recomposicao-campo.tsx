"use client";

import { useRef, useState } from "react";
import EditorTextoRico, { type EditorTextoRicoHandle } from "./editor-texto-rico";
import { useLinhasDoEditor } from "./linhas-do-editor";
import { carregarRecomposicao } from "./recomposicao-actions";
import {
  NIVEIS,
  habilidadesDoAno,
  infoNivel,
  linhaDaHabilidade,
  objetosDoAno,
  type ComponenteRecomposicao,
  type DadosRecomposicao,
  type NivelRecomposicao,
} from "@/lib/recomposicao";

interface RecomposicaoCampoProps {
  /** Id do componente (usado nos ids dos campos). */
  idBase: string;
  /** "Língua Portuguesa" ou "Matemática". */
  nomeComponente: string;
  componente: ComponenteRecomposicao;
  /** Nomes dos campos enviados no formulário. */
  nomeCampoHabilidades: string;
  nomeCampoObjetos: string;
  /** Textos já salvos no plano (HTML do editor). */
  valorHabilidades?: string | null;
  valorObjetos?: string | null;
}

/**
 * Recomposição das aprendizagens de Língua Portuguesa ou Matemática: o professor diz se quer recompor (sim/não); se
 * sim, escolhe o nível (Anos Iniciais, Anos Finais ou Ensino Médio), o ano/série e marca as habilidades e os
 * conteúdos que quer retomar. O que ele marca vai para dois campos de texto logo abaixo, que ele também pode editar.
 */
export default function RecomposicaoCampo({
  idBase,
  nomeComponente,
  componente,
  nomeCampoHabilidades,
  nomeCampoObjetos,
  valorHabilidades,
  valorObjetos,
}: RecomposicaoCampoProps) {
  const [sim, setSim] = useState(Boolean(valorHabilidades || valorObjetos));
  const [nivel, setNivel] = useState<NivelRecomposicao | null>(null);
  const [ano, setAno] = useState<number | null>(null);
  const [dados, setDados] = useState<Partial<Record<NivelRecomposicao, DadosRecomposicao>>>({});
  const [carregando, setCarregando] = useState(false);
  const [buscaHab, setBuscaHab] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);

  const refHab = useRef<EditorTextoRicoHandle>(null);
  const refObj = useRef<EditorTextoRicoHandle>(null);
  const textoHab = useLinhasDoEditor(refHab);
  const textoObj = useLinhasDoEditor(refObj);

  async function escolherNivel(n: NivelRecomposicao) {
    setNivel(n);
    setAno(null);
    setAberto(null);
    setBuscaHab("");
    if (dados[n]) return;
    setCarregando(true);
    try {
      const resposta = await carregarRecomposicao(n, componente);
      setDados((atual) => ({ ...atual, [n]: resposta }));
    } catch {
      setDados((atual) => ({
        ...atual,
        [n]: { habilidades: [], objetosMedio: [], erro: "Não foi possível carregar a lista agora. Tente novamente." },
      }));
    } finally {
      setCarregando(false);
    }
  }

  const info = nivel ? infoNivel(nivel) : null;
  const dadosNivel = nivel ? dados[nivel] : undefined;
  const habilidades = nivel && ano !== null && dadosNivel ? habilidadesDoAno(nivel, ano, dadosNivel) : [];
  const objetos = nivel && ano !== null && dadosNivel ? objetosDoAno(nivel, ano, dadosNivel) : [];
  const termo = buscaHab.trim().toLowerCase();
  const habilidadesFiltradas = termo
    ? habilidades.filter((h) => `${h.codigo ?? ""} ${h.descricao}`.toLowerCase().includes(termo))
    : habilidades;
  const rotuloAno = info && ano !== null ? info.rotuloAno(ano) : "";

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3">
        <input
          type="checkbox"
          checked={sim}
          onChange={(e) => setSim(e.target.checked)}
          className="mt-0.5 h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
        />
        <span>
          <span className="block text-sm font-bold text-slate-900">
            Sim, quero fazer recomposição das aprendizagens em {nomeComponente}
          </span>
          <span className="block text-xs text-slate-500">
            Marque para retomar habilidades e conteúdos de anos anteriores. Desmarcado, a recomposição não aparece no plano.
          </span>
        </span>
      </label>

      {/* Desabilitado e escondido: os campos não vão para o plano enquanto estiver em "não", mas o texto fica guardado. */}
      <fieldset disabled={!sim} hidden={!sim} className="min-w-0 space-y-4 border-0 p-0">
        <div className="space-y-2">
          <p className="field-label">1. Escolha de onde vêm as habilidades e os conteúdos</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-label="Nível">
            {NIVEIS.map((n) => {
              const ativo = nivel === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => escolherNivel(n.id)}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    ativo
                      ? "border-primary-600 bg-primary-50 font-semibold text-primary-900"
                      : "border-slate-300 bg-white text-slate-700 hover:border-primary-400"
                  }`}
                >
                  <span className="block">{n.rotulo}</span>
                  <span className="block text-xs font-normal text-slate-500">{n.resumo}</span>
                </button>
              );
            })}
          </div>
        </div>

        {info && (
          <div className="space-y-2">
            <p className="field-label">2. Escolha o {nivel === "medio" ? "ano da série" : "ano"}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Ano ou série">
              {info.anos.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={ano === a}
                  onClick={() => {
                    setAno(a);
                    setAberto(null);
                    setBuscaHab("");
                  }}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    ano === a
                      ? "border-primary-600 bg-primary-700 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-primary-400"
                  }`}
                >
                  {info.rotuloAno(a)}
                </button>
              ))}
            </div>
          </div>
        )}

        {nivel && carregando && <p className="text-sm text-slate-500">Carregando a lista do currículo...</p>}
        {dadosNivel?.erro && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {dadosNivel.erro}
          </p>
        )}

        {nivel && ano !== null && dadosNivel && !dadosNivel.erro && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Habilidades */}
            <div className="overflow-hidden rounded-xl border border-primary-200 bg-white">
              <div className="border-b border-primary-100 bg-primary-50/60 px-3 py-2">
                <p className="text-sm font-bold text-slate-800">
                  Habilidades — {rotuloAno} <span className="font-normal text-slate-500">({habilidades.length})</span>
                </p>
                {nivel === "medio" && (
                  <p className="text-xs text-slate-500">No Ensino Médio as habilidades não são separadas por série.</p>
                )}
                <label htmlFor={`${idBase}-busca-hab`} className="sr-only">
                  Buscar habilidade
                </label>
                <input
                  id={`${idBase}-busca-hab`}
                  type="text"
                  value={buscaHab}
                  onChange={(e) => setBuscaHab(e.target.value)}
                  placeholder="Buscar por código ou texto..."
                  className="mt-2 w-full rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                />
              </div>
              <ul className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto">
                {habilidadesFiltradas.length === 0 && (
                  <li className="px-3 py-3 text-sm text-slate-500">
                    {habilidades.length === 0
                      ? "Não há habilidades cadastradas para este ano."
                      : "Nenhuma habilidade encontrada para essa busca."}
                  </li>
                )}
                {habilidadesFiltradas.map((h) => {
                  const linha = linhaDaHabilidade(h);
                  const marcado = textoHab.tem(linha);
                  return (
                    <li key={h.id}>
                      <label className="flex cursor-pointer items-start gap-2 px-3 py-2 text-sm hover:bg-primary-50/50">
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => (marcado ? textoHab.desmarcar([linha]) : textoHab.marcar([linha], "paragrafos"))}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-slate-600">
                          {h.codigo && <span className="font-medium text-slate-900">({h.codigo}) </span>}
                          {h.descricao}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Objetos de conhecimento e conteúdos */}
            <div className="overflow-hidden rounded-xl border border-primary-200 bg-white">
              <div className="border-b border-primary-100 bg-primary-50/60 px-3 py-2">
                <p className="text-sm font-bold text-slate-800">
                  Conteúdos — {rotuloAno} <span className="font-normal text-slate-500">({objetos.length} objetos)</span>
                </p>
                <p className="text-xs text-slate-500">
                  Marque o objeto para levar todos os conteúdos dele, ou abra e marque só alguns.
                </p>
              </div>
              <ul className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto">
                {objetos.length === 0 && (
                  <li className="px-3 py-3 text-sm text-slate-500">Não há objetos de conhecimento cadastrados para este ano.</li>
                )}
                {objetos.map((o) => {
                  const linhaObjeto = `${o.objeto} (${rotuloAno})`;
                  const todas = [linhaObjeto, ...o.conteudos];
                  const objetoMarcado = textoObj.tem(linhaObjeto);
                  const conteudosMarcados = o.conteudos.filter((c) => textoObj.tem(c)).length;
                  const parcial = !objetoMarcado ? conteudosMarcados > 0 : conteudosMarcados > 0 && conteudosMarcados < o.conteudos.length;
                  const chave = `${nivel}-${ano}-${o.objeto}`;
                  const expandido = aberto === chave;
                  return (
                    <li key={chave}>
                      <div className={`flex items-start gap-2 px-3 py-2 text-sm ${expandido ? "bg-primary-50/70" : ""}`}>
                        <input
                          id={`${idBase}-obj-${chave}`}
                          type="checkbox"
                          checked={objetoMarcado}
                          ref={(el) => {
                            if (el) el.indeterminate = parcial && !objetoMarcado;
                          }}
                          onChange={() => {
                            if (objetoMarcado || conteudosMarcados > 0) {
                              textoObj.desmarcar(todas);
                              return;
                            }
                            textoObj.marcar([linhaObjeto], "paragrafos");
                            if (o.conteudos.length > 0) textoObj.marcar(o.conteudos, "lista");
                          }}
                          aria-label={`Colocar no plano: ${o.objeto}`}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor={`${idBase}-obj-${chave}`} className="min-w-0 flex-1 cursor-pointer text-slate-800">
                          {o.objeto}
                        </label>
                        {o.conteudos.length > 0 && (
                          <button
                            type="button"
                            aria-expanded={expandido}
                            onClick={() => setAberto(expandido ? null : chave)}
                            className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                          >
                            {conteudosMarcados > 0 ? `${conteudosMarcados}/${o.conteudos.length} · ` : ""}
                            Conteúdos ({o.conteudos.length}) {expandido ? "▲" : "▼"}
                          </button>
                        )}
                      </div>
                      {expandido && (
                        <div className="space-y-0.5 bg-primary-50/40 px-3 pb-3 pt-1 pl-9">
                          {o.conteudos.map((c) => {
                            const marcado = textoObj.tem(c);
                            return (
                              <label key={c} className="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1 text-sm text-slate-700 hover:bg-white">
                                <input
                                  type="checkbox"
                                  checked={marcado}
                                  onChange={() => {
                                    if (marcado) {
                                      textoObj.desmarcar([c]);
                                    } else {
                                      if (!objetoMarcado) textoObj.marcar([linhaObjeto], "paragrafos");
                                      textoObj.marcar([c], "lista");
                                    }
                                  }}
                                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span>{c}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor={`${idBase}-recomp-hab`} className="field-label">
              Habilidades que serão recompostas
            </label>
            <p className="text-xs text-slate-500">O que você marcar aparece aqui; você também pode escrever ou ajustar o texto.</p>
            <EditorTextoRico
              id={`${idBase}-recomp-hab`}
              name={nomeCampoHabilidades}
              valorInicial={valorHabilidades}
              textoAntigoComoLista
              editorRef={refHab}
              linhas={4}
            />
          </div>
          <div>
            <label htmlFor={`${idBase}-recomp-obj`} className="field-label">
              Conteúdos que serão recompostos
            </label>
            <EditorTextoRico
              id={`${idBase}-recomp-obj`}
              name={nomeCampoObjetos}
              valorInicial={valorObjetos}
              textoAntigoComoLista
              editorRef={refObj}
              linhas={4}
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
}
