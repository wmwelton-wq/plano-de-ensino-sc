"use client";

import { useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Escola } from "@/lib/database.types";
import type { EstadoFormulario } from "../planos/actions";
import SecaoPlano from "../planos/secao-plano";
import PassosPlano from "../planos/passos-plano";
import BarraSalvar from "../planos/barra-salvar";
import TurmaSelector, { separarTurma } from "../planos/turma-selector";
import { createClient } from "@/lib/supabase/client";
import { COMPETENCIAS_GERAIS_BNCC } from "@/lib/competencias-gerais";
import {
  carregarDadosComponente,
  DADOS_VAZIOS,
  type DadosComponente,
  type DisciplinaBasica,
  type OpcaoLista,
} from "@/lib/dados-anuais";
import {
  ETAPAS_ANUAIS,
  TEXTO_LIVRE_INICIAL,
  normalizarComponentes,
  normalizarDados,
  numeroDaSerie,
  referenciasSugeridas,
  type EtapaAnual,
  type ItemLista,
  type PlanoAnual,
} from "@/lib/plano-anual";
import { ordenarComponentes } from "@/lib/secoes-componentes";
import SeletorItens from "./seletor-itens";
import {
  BlocoEmenta,
  BlocoEspecificas,
  BlocoTrimestres,
  listasVazias,
  montarInfo,
  type Atualizar,
  type InfoComp,
  type ListasComp,
} from "./blocos-componente";
import { CRITERIOS_AVALIACAO, INSTRUMENTOS_AVALIACAO } from "../planos/sugestoes-avaliacao";
import EditorLivre from "./editor-livre";

export interface PlanoAnualFormProps {
  escolas: Escola[];
  disciplinas: DisciplinaBasica[];
  nomeProfessor: string;
  plano?: PlanoAnual;
  action: (anterior: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  textoBotao: string;
}

const PASSOS = [
  { id: "passo-1", rotulo: "Identificação" },
  { id: "passo-2", rotulo: "Ementa" },
  { id: "passo-3", rotulo: "Competências gerais" },
  { id: "passo-4", rotulo: "Competências específicas" },
  { id: "passo-5", rotulo: "Componente curricular" },
  { id: "passo-6", rotulo: "Item 6 em diante" },
];

const OUTRO = "__outro__";
/** Chave das listas quando o plano tem um componente só (Ensino Médio, Anos Finais). */
const UNICO = "__unico__";
const ANOS_INICIAIS: EtapaAnual = "fundamental_anos_iniciais";
const LISTAS_VAZIAS: ListasComp = listasVazias();
const LIMITE_ENVIO = 3_800_000;

const GERAIS_OPCOES: OpcaoLista[] = COMPETENCIAS_GERAIS_BNCC.map((c) => ({
  id: `cg:${c.numero}`,
  codigo: String(c.numero),
  texto: `${c.nome}: ${c.texto}`,
  anos: [],
}));

function geraisParaItens(numeros: number[], manuais: string[]): ItemLista[] {
  const oficiais = numeros.map((n) => {
    const o = GERAIS_OPCOES.find((g) => g.id === `cg:${n}`);
    return { id: `cg:${n}`, codigo: String(n), texto: o?.texto ?? "" };
  });
  const digitadas = manuais.map((t, i) => ({ id: `manual:cg-${i}`, texto: t, manual: true, fonte: "manual" }));
  return [...oficiais, ...digitadas];
}

function itensParaGerais(itens: ItemLista[]): { numeros: number[]; manuais: string[] } {
  const numeros: number[] = [];
  const manuais: string[] = [];
  for (const i of itens) {
    const m = /^cg:(\d+)$/.exec(i.id);
    if (m) numeros.push(Number(m[1]));
    else manuais.push(i.texto);
  }
  return { numeros: numeros.sort((a, b) => a - b), manuais };
}

export default function PlanoAnualForm({ escolas, disciplinas, nomeProfessor, plano, action, textoBotao }: PlanoAnualFormProps) {
  const [estado, formAction, pendente] = useActionState(action, {});
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const ignorarPendencias = useRef(false);
  const [conferencia, setConferencia] = useState<string[] | null>(null);
  const [pedindoConfirmacao, setPedindoConfirmacao] = useState(false);

  const inicial = useMemo(
    () =>
      normalizarDados({
        ementa: plano?.ementa,
        competencias_gerais: plano?.competencias_gerais,
        competencias_especificas: plano?.competencias_especificas,
        trimestres: plano?.trimestres,
      }),
    [plano]
  );
  const componentesSalvos = useMemo(() => normalizarComponentes(plano?.componentes), [plano]);
  // Plano antigo dos Anos Iniciais com "outro componente" digitado (sem disciplina do sistema): segue no formato de um componente só.
  const formatoUnico = !!plano && plano.etapa === ANOS_INICIAIS && componentesSalvos.length === 0 && !plano.disciplina_id;

  // ── Identificação ──
  const [etapa, setEtapa] = useState<EtapaAnual>(plano?.etapa ?? "ensino_medio");
  const [disciplinaSel, setDisciplinaSel] = useState<string>(
    plano ? (plano.disciplina_id ?? (plano.componente ? OUTRO : "")) : ""
  );
  const [componenteLivre, setComponenteLivre] = useState(plano && !plano.disciplina_id ? plano.componente ?? "" : "");
  const [area, setArea] = useState(plano?.area ?? "");
  const [anoDaTurma, setAnoDaTurma] = useState<number | null>(
    numeroDaSerie(separarTurma(plano?.etapa ?? "ensino_medio", plano?.turma).serie)
  );

  const disciplinasDaEtapa = useMemo(() => {
    const alvo = ETAPAS_ANUAIS.find((e) => e.valor === etapa)?.disciplinaEtapa;
    return disciplinas.filter((d) => d.etapa === alvo);
  }, [disciplinas, etapa]);

  // Anos Iniciais: o mesmo professor dá várias disciplinas, então o plano pode ter vários componentes, cada um com o seu bloco.
  const multi = etapa === ANOS_INICIAIS && !formatoUnico;
  const [componentesSel, setComponentesSel] = useState<string[]>(() =>
    componentesSalvos.length > 0
      ? componentesSalvos.map((c) => c.disciplina_id)
      : plano?.etapa === ANOS_INICIAIS && plano.disciplina_id
      ? [plano.disciplina_id]
      : []
  );
  // Na ordem do plano: Português, Matemática, Ciências, História, Geografia...
  const componentes = useMemo(
    () => ordenarComponentes<DisciplinaBasica>(disciplinasDaEtapa.filter((d) => componentesSel.includes(d.id))),
    [disciplinasDaEtapa, componentesSel]
  );

  const disciplina = disciplinas.find((d) => d.id === disciplinaSel) ?? null;
  const nomeComponente = multi ? componentes.map((d) => d.nome).join(", ") : disciplinaSel === OUTRO ? componenteLivre : disciplina?.nome ?? "";

  // ── Listas escolhidas ──
  const [gerais, setGerais] = useState<ItemLista[]>(
    geraisParaItens(inicial.competenciasGerais.numeros, inicial.competenciasGerais.manuais)
  );
  // Ementa, competências específicas e trimestres de cada componente (chave: id da disciplina; UNICO = plano de um componente só).
  const [listas, setListas] = useState<Record<string, ListasComp>>(() => {
    const doPlano: ListasComp = {
      ementa: inicial.ementa,
      compBncc: inicial.competenciasEspecificas.bncc,
      compCurr: inicial.competenciasEspecificas.curriculo,
      compManuais: inicial.competenciasEspecificas.manuais,
      trimestres: inicial.trimestres,
    };
    if (componentesSalvos.length > 0) {
      return Object.fromEntries(
        componentesSalvos.map((c) => [
          c.disciplina_id,
          {
            ementa: c.ementa,
            compBncc: c.competenciasEspecificas.bncc,
            compCurr: c.competenciasEspecificas.curriculo,
            compManuais: c.competenciasEspecificas.manuais,
            trimestres: c.trimestres,
          },
        ])
      );
    }
    if (plano?.etapa === ANOS_INICIAIS && plano.disciplina_id) return { [plano.disciplina_id]: doPlano };
    return { [UNICO]: doPlano };
  });
  const atualizarDe =
    (chave: string): Atualizar =>
    (fn) =>
      setListas((todas) => {
        const atual = todas[chave] ?? listasVazias();
        return { ...todas, [chave]: { ...atual, ...fn(atual) } };
      });
  const listasDe = (chave: string): ListasComp => listas[chave] ?? LISTAS_VAZIAS;

  // ── Dados oficiais dos componentes escolhidos (carregados no navegador, uma vez por componente) ──
  const [carregados, setCarregados] = useState<Record<string, { dados: DadosComponente; carregando: boolean; erro: string | null }>>({});
  const jaPedidos = useRef(new Set<string>());
  const idsAtivos = multi ? componentes.map((d) => d.id) : disciplina ? [disciplina.id] : [];
  const chaveIds = idsAtivos.join(",");

  useEffect(() => {
    for (const id of chaveIds ? chaveIds.split(",") : []) {
      if (jaPedidos.current.has(id)) continue;
      const alvo = disciplinas.find((d) => d.id === id);
      if (!alvo) continue;
      jaPedidos.current.add(id);
      setCarregados((a) => ({ ...a, [id]: { dados: DADOS_VAZIOS, carregando: true, erro: null } }));
      carregarDadosComponente(createClient(), alvo)
        .then((d) => setCarregados((a) => ({ ...a, [id]: { dados: d, carregando: false, erro: null } })))
        .catch(() => {
          jaPedidos.current.delete(id); // permite tentar de novo se o professor desmarcar e marcar outra vez
          setCarregados((a) => ({
            ...a,
            [id]: {
              dados: DADOS_VAZIOS,
              carregando: false,
              erro: `Não foi possível carregar as listas de ${alvo.nome}. Recarregue a página ou digite os itens à mão.`,
            },
          }));
        });
    }
  }, [chaveIds, disciplinas]);

  const infos = useMemo(() => {
    const mapa: Record<string, InfoComp> = {};
    for (const [id, c] of Object.entries(carregados)) mapa[id] = montarInfo(c.dados, c.carregando, c.erro);
    return mapa;
  }, [carregados]);
  const infoVazia = useMemo(() => montarInfo(DADOS_VAZIOS, false, null), []);
  const infoDe = (id: string | null | undefined): InfoComp => (id ? infos[id] : undefined) ?? infoVazia;
  const erroDados = idsAtivos.map((id) => carregados[id]?.erro).find((e): e is string => !!e) ?? null;

  const vazioDe = (id: string | null | undefined) =>
    !id
      ? "Escolha o componente curricular no passo 1 para ver as opções do currículo — ou digite à mão no quadro abaixo."
      : !infos[id] || infos[id].carregando
      ? "Carregando as opções do currículo..."
      : "Não há itens cadastrados para este componente. Digite à mão no quadro abaixo.";

  /** Tudo o que os blocos de um componente precisam. `chave` guarda as listas; `idDados` é a disciplina cujos dados do currículo aparecem. */
  const propsDe = (chave: string, idDados: string | null | undefined) => ({
    info: infoDe(idDados),
    valor: listasDe(chave),
    atualizar: atualizarDe(chave),
    anoDaTurma,
    vazioPadrao: vazioDe(idDados),
  });

  /** Repete o bloco para cada componente marcado, com o nome em destaque vermelho. */
  function porComponente(renderizar: (d: DisciplinaBasica) => ReactNode) {
    if (componentes.length === 0) {
      return (
        <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
          Marque ao menos um componente curricular no passo 1.
        </p>
      );
    }
    return componentes.map((d) => (
      <div key={d.id} className="space-y-3 rounded-xl border border-red-100 bg-red-50/30 p-3">
        <span className="etiqueta-disciplina">{d.nome}</span>
        {renderizar(d)}
      </div>
    ));
  }

  function alternarComponente(id: string) {
    setComponentesSel((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  const dadosJson = useMemo(() => {
    const competenciasGerais = itensParaGerais(gerais);
    if (multi) {
      return JSON.stringify({
        competencias_gerais: competenciasGerais,
        componentes: componentes.map((d) => {
          const l = listas[d.id] ?? LISTAS_VAZIAS;
          return {
            disciplina_id: d.id,
            nome: d.nome,
            ementa: l.ementa,
            competencias_especificas: { bncc: l.compBncc, curriculo: l.compCurr, manuais: l.compManuais },
            trimestres: l.trimestres,
          };
        }),
      });
    }
    const l = listas[UNICO] ?? LISTAS_VAZIAS;
    return JSON.stringify({
      ementa: l.ementa,
      competencias_gerais: competenciasGerais,
      competencias_especificas: { bncc: l.compBncc, curriculo: l.compCurr, manuais: l.compManuais },
      trimestres: l.trimestres,
    });
  }, [gerais, listas, multi, componentes]);

  const textoLivreInicial = plano?.texto_livre ?? TEXTO_LIVRE_INICIAL;

  /** Frases prontas para o texto livre: avaliação e metodologia, montadas com os objetos marcados. */
  const sugestoesTexto = useMemo(() => {
    const trimestresAtivos = multi
      ? componentes.flatMap((d) => (listas[d.id] ?? LISTAS_VAZIAS).trimestres)
      : (listas[UNICO] ?? LISTAS_VAZIAS).trimestres;
    const objetos = Array.from(new Set(trimestresAtivos.flatMap((t) => t.objetos.map((o) => o.texto.trim())).filter(Boolean))).slice(0, 8);
    const modelos = [
      (o: string) => `Aula expositiva dialogada e problematização inicial sobre ${o}.`,
      (o: string) => `Atividades práticas, em duplas ou grupos, para explorar ${o}.`,
      (o: string) => `Pesquisa orientada e socialização dos resultados sobre ${o}.`,
      (o: string) => `Resolução de situações-problema envolvendo ${o}.`,
      (o: string) => `Uso de recursos digitais e audiovisuais para aprofundar ${o}.`,
    ];
    const metodologia = objetos.map((o, i) => modelos[i % modelos.length](o));
    metodologia.push(
      "Leitura e interpretação de textos, imagens, gráficos e esquemas relacionados aos conteúdos estudados.",
      "Retomada dos conteúdos e recuperação paralela ao longo do trimestre, conforme as necessidades dos estudantes."
    );
    return [
      { titulo: "Metodologia (montada com os objetos de conhecimento que você marcou)", itens: metodologia },
      { titulo: "Critérios de avaliação", itens: CRITERIOS_AVALIACAO },
      { titulo: "Instrumentos de avaliação", itens: INSTRUMENTOS_AVALIACAO },
    ];
  }, [listas, multi, componentes]);

  /** Lista do que ainda falta (só avisa — nunca muda o formato do plano). */
  function conferir(form: HTMLFormElement): string[] {
    const fd = new FormData(form);
    const campo = (nome: string) => String(fd.get(nome) ?? "").trim();
    const p: string[] = [];
    if (!campo("escola_id")) p.push("Escola não escolhida (o plano ficará em “Sem escola definida”).");
    if (!nomeComponente.trim()) p.push(multi ? "Nenhum componente curricular marcado." : "Componente curricular não informado.");
    if (!campo("turma")) p.push("Turma não informada.");
    if (!campo("docente")) p.push("Nome do docente não informado.");
    if (gerais.length === 0) p.push("Nenhuma competência geral marcada.");
    const conferirListas = (l: ListasComp, prefixo: string) => {
      if (l.ementa.length === 0) p.push(`${prefixo}Ementa vazia.`);
      if (l.compBncc.length + l.compCurr.length + l.compManuais.length === 0) p.push(`${prefixo}Nenhuma competência específica marcada.`);
      l.trimestres.forEach((t, i) => {
        const n = `${prefixo}${i + 1}º trimestre`;
        if (t.unidades.length === 0) p.push(`${n}: nenhuma unidade temática.`);
        if (t.habilidades.length === 0) p.push(`${n}: nenhuma habilidade.`);
        if (t.objetos.length === 0) p.push(`${n}: nenhum objeto de conhecimento.`);
      });
    };
    if (multi) componentes.forEach((d) => conferirListas(listasDe(d.id), `${d.nome} — `));
    else conferirListas(listasDe(UNICO), "");
    const livre = campo("texto_livre");
    if (!livre.includes("<img") && livre.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "") {
      p.push("O texto livre (item 6 em diante) está vazio.");
    }
    return p;
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6"
      onSubmit={(e) => {
        if (multi && componentes.length === 0) {
          e.preventDefault();
          setErroLocal("Marque pelo menos um componente curricular no passo 1.");
          return;
        }
        const finalizando = (e.currentTarget.elements.namedItem("status") as HTMLSelectElement | null)?.value === "finalizado";
        if (finalizando && !ignorarPendencias.current) {
          const faltas = conferir(e.currentTarget);
          if (faltas.length > 0) {
            e.preventDefault();
            setConferencia(faltas);
            setPedindoConfirmacao(true);
            return;
          }
        }
        ignorarPendencias.current = false;
        setPedindoConfirmacao(false);
        const campo = e.currentTarget.elements.namedItem("texto_livre") as HTMLInputElement | null;
        const total = dadosJson.length + (campo?.value.length ?? 0);
        if (total > LIMITE_ENVIO) {
          e.preventDefault();
          setErroLocal("O plano ficou grande demais para salvar (provavelmente por causa das imagens). Reduza ou remova algumas imagens do texto livre.");
        } else {
          setErroLocal(null);
        }
      }}
    >
      <input type="hidden" name="etapa" value={etapa} />
      <input type="hidden" name="disciplina_id" value={multi ? componentes[0]?.id ?? "" : disciplina?.id ?? ""} />
      <input type="hidden" name="componente" value={nomeComponente} />
      <input type="hidden" name="dados" value={dadosJson} />

      <PassosPlano passos={PASSOS} />

      {/* ───────── 1. Identificação ───────── */}
      <SecaoPlano id="passo-1" numero={1} titulo="Identificação" descricao="Escola, componente, turma e docente — vai para o cabeçalho do plano.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="escola_id" className="field-label">
              Escola
            </label>
            <select id="escola_id" name="escola_id" defaultValue={plano?.escola_id ?? ""} className="input-field">
              <option value="">Nenhuma / preencher depois</option>
              {escolas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome} — {e.municipio}
                </option>
              ))}
            </select>
            <p className="field-hint">
              A mesma escola serve para os planos mensais e anuais.{" "}
              <Link href="/dashboard/escolas/nova" className="text-primary-600 hover:underline">
                Cadastrar nova escola
              </Link>
            </p>
          </div>

          <div>
            <label htmlFor="etapa_sel" className="field-label">
              Etapa de ensino
            </label>
            <select
              id="etapa_sel"
              value={etapa}
              onChange={(e) => {
                setEtapa(e.target.value as EtapaAnual);
                setDisciplinaSel("");
                setComponentesSel([]);
                setArea("");
                setAnoDaTurma(null);
              }}
              className="input-field"
            >
              {ETAPAS_ANUAIS.map((e) => (
                <option key={e.valor} value={e.valor}>
                  {e.rotulo}
                </option>
              ))}
            </select>
          </div>

          {multi ? (
            <fieldset className="sm:col-span-2">
              <legend className="field-label">Componentes curriculares</legend>
              <p className="field-hint">
                Marque todos os componentes que você leciona nesta turma. Cada um ganha o seu bloco (ementa, competências e os três
                trimestres), tudo separado por componente, com o nome em destaque.
              </p>
              {disciplinasDaEtapa.length === 0 ? (
                <p className="mt-2 rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
                  Nenhum componente curricular cadastrado para os Anos Iniciais.
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ordenarComponentes<DisciplinaBasica>(disciplinasDaEtapa).map((d) => {
                    const marcado = componentesSel.includes(d.id);
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
            </fieldset>
          ) : (
            <>
          <div>
            <label htmlFor="disciplina_sel" className="field-label">
              Disciplina / componente curricular
            </label>
            <select
              id="disciplina_sel"
              required
              value={disciplinaSel}
              onChange={(e) => {
                const v = e.target.value;
                setDisciplinaSel(v);
                const d = disciplinas.find((x) => x.id === v);
                if (d) setArea(d.area ?? d.nome);
              }}
              className="input-field"
            >
              <option value="">Selecione...</option>
              {disciplinasDaEtapa.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
              <option value={OUTRO}>Outro componente (digitar)</option>
            </select>
          </div>

          {disciplinaSel === OUTRO && (
            <div className="sm:col-span-2">
              <label htmlFor="componente_livre" className="field-label">
                Nome do componente
              </label>
              <input
                id="componente_livre"
                type="text"
                value={componenteLivre}
                onChange={(e) => setComponenteLivre(e.target.value)}
                placeholder="Ex.: Projeto de Vida"
                className="input-field"
              />
              <p className="field-hint">Para componentes sem lista oficial no sistema, você digita os itens à mão nos passos seguintes.</p>
            </div>
          )}
            </>
          )}

          <div>
            <label htmlFor="area" className="field-label">
              Área do conhecimento
            </label>
            <input id="area" name="area" type="text" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ex.: Ciências da Natureza" className="input-field" />
          </div>

          <div>
            <label htmlFor="ano_letivo" className="field-label">
              Ano letivo
            </label>
            <input id="ano_letivo" name="ano_letivo" type="number" required defaultValue={plano?.ano_letivo ?? new Date().getFullYear()} className="input-field" />
          </div>

          <TurmaSelector
            key={etapa}
            etapa={etapa}
            valorInicial={etapa === plano?.etapa ? plano?.turma : ""}
            rotuloSerie={etapa === "ensino_medio" ? "Série" : "Ano"}
            onSerieChange={(serie) => setAnoDaTurma(numeroDaSerie(serie))}
          />

          <div>
            <label htmlFor="turno" className="field-label">
              Turno
            </label>
            <select id="turno" name="turno" defaultValue={plano?.turno ?? ""} className="input-field">
              <option value="">Selecione...</option>
              <option value="Matutino">Matutino</option>
              <option value="Vespertino">Vespertino</option>
              <option value="Noturno">Noturno</option>
              <option value="Integral">Integral</option>
            </select>
          </div>

          <div>
            <label htmlFor="docente" className="field-label">
              Docente
            </label>
            <input id="docente" name="docente" type="text" defaultValue={plano?.docente ?? nomeProfessor} className="input-field" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="formacao" className="field-label">
              Formação
            </label>
            <input
              id="formacao"
              name="formacao"
              type="text"
              defaultValue={plano?.formacao ?? ""}
              placeholder="Ex.: Licenciatura em Química"
              className="input-field"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="titulo" className="field-label">
              Nome do plano na sua lista <span className="text-slate-400">(opcional)</span>
            </label>
            <input id="titulo" name="titulo" type="text" defaultValue={plano?.titulo ?? ""} placeholder="Se deixar em branco, o sistema cria um nome" className="input-field" />
          </div>

          <fieldset className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
            <legend className="px-1 text-sm font-bold text-slate-800">Brasões do cabeçalho</legend>
            <label className="mt-1 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="incluir_logo_estado" defaultChecked={plano?.incluir_logo_estado ?? true} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              Brasão do Estado de Santa Catarina
            </label>
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="incluir_logo_escola" defaultChecked={plano?.incluir_logo_escola ?? true} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              Logo da escola
            </label>
          </fieldset>

          <div>
            <label htmlFor="status" className="field-label">
              Situação
            </label>
            <select id="status" name="status" defaultValue={plano?.status ?? "rascunho"} className="input-field">
              <option value="rascunho">Rascunho</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
        </div>
        {erroDados && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {erroDados}
          </p>
        )}
      </SecaoPlano>

      {/* ───────── 2. Ementa ───────── */}
      <SecaoPlano
        id="passo-2"
        numero={2}
        titulo="Ementa"
        descricao={multi ? "Marque os temas da ementa de cada componente — e acrescente os seus." : "Marque os temas que farão parte da ementa — e acrescente os seus."}
      >
        {multi ? (
          porComponente((d) => <BlocoEmenta {...propsDe(d.id, d.id)} />)
        ) : (
          <BlocoEmenta {...propsDe(UNICO, disciplina?.id)} />
        )}
      </SecaoPlano>

      {/* ───────── 3. Competências gerais ───────── */}
      <SecaoPlano id="passo-3" numero={3} titulo="Competências gerais da BNCC" descricao="São as mesmas para qualquer plano: marque as que quiser e acrescente outras.">
        <SeletorItens
          opcoes={GERAIS_OPCOES}
          valor={gerais}
          onChange={setGerais}
          vazio=""
          alturaRem={26}
          rotuloManual="Acrescentar uma competência geral"
          placeholderManual="Digite a competência"
        />
      </SecaoPlano>

      {/* ───────── 4. Competências específicas ───────── */}
      <SecaoPlano
        id="passo-4"
        numero={4}
        titulo="Competências específicas"
        descricao={
          multi
            ? "Da BNCC e do Currículo Catarinense, em listas separadas, para cada componente — marque as que quiser."
            : "Da BNCC e do Currículo Catarinense, em listas separadas — marque as que quiser."
        }
      >
        {multi ? (
          porComponente((d) => (
            <div className="space-y-4">
              <BlocoEspecificas {...propsDe(d.id, d.id)} />
            </div>
          ))
        ) : (
          <BlocoEspecificas {...propsDe(UNICO, disciplina?.id)} />
        )}
      </SecaoPlano>

      {/* ───────── 5. Componente curricular ───────── */}
      <SecaoPlano
        id="passo-5"
        numero={5}
        titulo="Componente curricular"
        descricao={
          multi
            ? "Preencha os trimestres de cada componente: o botão azul diz o que está sendo preenchido, a etiqueta vermelha com o nome diz de qual componente e a outra, de qual trimestre."
            : "Preencha cada trimestre: o botão azul diz o que está sendo preenchido e a etiqueta vermelha, em qual trimestre."
        }
      >
        {multi ? (
          porComponente((d) => (
            <div className="space-y-4">
              <BlocoTrimestres {...propsDe(d.id, d.id)} nomeComponente={d.nome} />
            </div>
          ))
        ) : (
          <BlocoTrimestres {...propsDe(UNICO, disciplina?.id)} />
        )}
      </SecaoPlano>

      {/* ───────── 6. Texto livre ───────── */}
      <SecaoPlano
        id="passo-6"
        numero={6}
        titulo="Do item 6 em diante: texto livre"
        descricao="Aqui o plano continua do jeito que você escrever — títulos, avaliação, metodologias, bibliografia, o que quiser."
      >
        <EditorLivre id="texto_livre_editor" name="texto_livre" valorInicial={textoLivreInicial} referencias={referenciasSugeridas(etapa)} sugestoes={sugestoesTexto} />
      </SecaoPlano>

      {/* ───────── Conferência ───────── */}
      <section aria-labelledby="conferencia" className="rounded-2xl border-2 border-primary-300 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="conferencia" className="text-base font-bold text-slate-900">
            Conferir antes de finalizar
          </h2>
          <button
            type="button"
            className="btn-azul-suave !border-2 !border-primary-500 !px-4 !py-2 !text-sm"
            onClick={() => formRef.current && setConferencia(conferir(formRef.current))}
          >
            Conferir agora
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">A conferência só avisa o que está faltando. Ela não altera nada no plano.</p>
        {conferencia !== null &&
          (conferencia.length === 0 ? (
            <p role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              Tudo preenchido. Pode finalizar.
            </p>
          ) : (
            <div role="status" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Ainda falta preencher ({conferencia.length}):</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {conferencia.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              {pedindoConfirmacao && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-azul !px-4 !py-2 !text-sm"
                    onClick={() => {
                      ignorarPendencias.current = true;
                      formRef.current?.requestSubmit();
                    }}
                  >
                    Finalizar mesmo assim
                  </button>
                  <button type="button" className="btn-azul-suave !border-2 !border-amber-400 !px-4 !py-2 !text-sm" onClick={() => setPedindoConfirmacao(false)}>
                    Voltar e completar
                  </button>
                </div>
              )}
            </div>
          ))}
      </section>

      <BarraSalvar pendente={pendente} textoBotao={textoBotao} erro={erroLocal ?? estado.erro} />
    </form>
  );
}
