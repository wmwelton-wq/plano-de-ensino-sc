"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
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
  opcaoParaItem,
  type DisciplinaBasica,
  type OpcaoLista,
} from "@/lib/dados-anuais";
import {
  ETAPAS_ANUAIS,
  TEXTO_LIVRE_INICIAL,
  TRIMESTRES_ROTULOS,
  normalizarDados,
  numeroDaSerie,
  referenciasSugeridas,
  type EtapaAnual,
  type ItemLista,
  type PlanoAnual,
  type TrimestreAnual,
} from "@/lib/plano-anual";
import { useAvisoTemporario } from "../planos/linhas-do-editor";
import SeletorItens from "./seletor-itens";
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

/** Título de cada bloco do trimestre: botão azul com o nome do que se preenche + etiqueta vermelha do trimestre. */
function TituloTrimestre({ nome, trimestre }: { nome: string; trimestre: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center rounded-xl bg-gradient-to-r from-primary-700 to-sky-500 px-4 py-2 text-sm font-extrabold text-white shadow-md">
        {nome}
      </span>
      <span className="inline-flex items-center rounded-xl bg-red-600 px-3 py-2 text-sm font-extrabold text-white shadow-md">
        {trimestre + 1}º trimestre
      </span>
    </div>
  );
}

/** "Você marcou estas habilidades; estes objetos de conhecimento estão ligados a elas no currículo." Tudo por caixinha. */
function SugestaoObjetos({
  sugeridos,
  marcados,
  onAlternar,
  onTodos,
}: {
  sugeridos: OpcaoLista[];
  marcados: Set<string>;
  onAlternar: (o: OpcaoLista, marcar: boolean) => void;
  onTodos: (lista: OpcaoLista[], marcar: boolean) => void;
}) {
  const { aviso, mostrar } = useAvisoTemporario();
  if (sugeridos.length === 0) return null;
  const qtdMarcados = sugeridos.filter((o) => marcados.has(o.id)).length;
  return (
    <div className="rounded-xl border-2 border-sky-300 bg-sky-50 p-3">
      <p className="text-sm font-bold text-sky-900">
        Sugestão: {sugeridos.length} objeto(s) de conhecimento ligado(s) às habilidades que você marcou
      </p>
      <p className="text-xs text-sky-800">Marque a caixinha para colocar no plano (desmarque para tirar). Os marcados aparecem também na lista abaixo.</p>
      <ul className="mt-2 max-h-52 space-y-0.5 overflow-y-auto rounded-lg bg-white/70 p-1.5">
        {sugeridos.map((o) => {
          const marcado = marcados.has(o.id);
          return (
            <li key={o.id}>
              <label className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-sm text-sky-950 hover:bg-sky-100">
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => {
                    onAlternar(o, !marcado);
                    mostrar(marcado ? "Objeto retirado do plano." : "Objeto adicionado ao plano — veja na lista logo abaixo.");
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span>{o.texto}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-sky-900">
          <input
            type="checkbox"
            checked={qtdMarcados === sugeridos.length}
            ref={(el) => {
              if (el) el.indeterminate = qtdMarcados > 0 && qtdMarcados < sugeridos.length;
            }}
            onChange={() => {
              const marcar = qtdMarcados !== sugeridos.length;
              onTodos(sugeridos, marcar);
              mostrar(marcar ? "Todos os objetos sugeridos foram adicionados — veja na lista logo abaixo." : "Objetos sugeridos retirados do plano.");
            }}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          Marcar todos ({qtdMarcados}/{sugeridos.length})
        </label>
        <p
          role="status"
          aria-live="polite"
          className={`rounded-md px-2 py-0.5 text-xs font-semibold transition ${aviso ? "bg-emerald-100 text-emerald-800" : "hidden"}`}
        >
          {aviso ? `✓ ${aviso}` : ""}
        </p>
      </div>
    </div>
  );
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

  const disciplina = disciplinas.find((d) => d.id === disciplinaSel) ?? null;
  const nomeComponente = disciplinaSel === OUTRO ? componenteLivre : disciplina?.nome ?? "";

  // ── Listas escolhidas ──
  const [ementa, setEmenta] = useState<ItemLista[]>(inicial.ementa);
  const [gerais, setGerais] = useState<ItemLista[]>(
    geraisParaItens(inicial.competenciasGerais.numeros, inicial.competenciasGerais.manuais)
  );
  const [compBncc, setCompBncc] = useState<ItemLista[]>(inicial.competenciasEspecificas.bncc);
  const [compCurr, setCompCurr] = useState<ItemLista[]>(inicial.competenciasEspecificas.curriculo);
  const [compManuais, setCompManuais] = useState<ItemLista[]>(inicial.competenciasEspecificas.manuais);
  const [trimestres, setTrimestres] = useState<TrimestreAnual[]>(inicial.trimestres);

  function atualizarTrimestre(i: number, parcial: Partial<TrimestreAnual>) {
    setTrimestres((atual) => atual.map((t, k) => (k === i ? { ...t, ...parcial } : t)));
  }

  // ── Dados oficiais do componente escolhido (carregados no navegador) ──
  const [dados, setDados] = useState<DadosComponente>(DADOS_VAZIOS);
  // O "objeto de conhecimento" do plano é o que o Currículo chama de "Conteúdo".
  // (Se o componente não tiver "Conteúdo", mostra todos para não ficar vazio.)
  const opcoesObjetos = useMemo(() => {
    const conteudos = dados.objetos.filter((o) => o.grupo === "Conteúdo");
    const base = conteudos.length > 0 ? conteudos : dados.objetos;
    return base.map((o) => (o.grupo === "Conteúdo" ? { ...o, grupo: "Objeto de conhecimento" } : o));
  }, [dados.objetos]);
  /** Objetos de conhecimento ligados às habilidades marcadas no trimestre (marcados ou não). */
  function objetosSugeridos(t: TrimestreAnual): OpcaoLista[] {
    const ids = new Set<string>();
    for (const h of t.habilidades) {
      const op = dados.habilidades.find((o) => o.id === h.id);
      for (const r of op?.relacionados ?? []) ids.add(r);
    }
    if (ids.size === 0) return [];
    return opcoesObjetos.filter((o) => ids.has(o.id));
  }

  const [carregando, setCarregando] = useState(false);
  const [erroDados, setErroDados] = useState<string | null>(null);

  useEffect(() => {
    if (!disciplina) {
      setDados(DADOS_VAZIOS);
      setErroDados(null);
      return;
    }
    let cancelado = false;
    setCarregando(true);
    setErroDados(null);
    carregarDadosComponente(createClient(), disciplina)
      .then((d) => {
        if (!cancelado) setDados(d);
      })
      .catch(() => {
        if (!cancelado) setErroDados("Não foi possível carregar as listas deste componente. Recarregue a página ou digite os itens à mão.");
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [disciplina]);

  const competenciasBncc = useMemo(() => dados.competencias.filter((c) => c.fonte === "bncc"), [dados]);
  const competenciasCurriculo = useMemo(() => dados.competencias.filter((c) => c.fonte === "curriculo_catarinense"), [dados]);
  const ementaOpcoes = opcoesObjetos;

  const semComponenteOficial = !disciplina;
  const vazioPadrao = semComponenteOficial
    ? "Escolha o componente curricular no passo 1 para ver as opções do currículo — ou digite à mão no quadro abaixo."
    : carregando
    ? "Carregando as opções do currículo..."
    : "Não há itens cadastrados para este componente. Digite à mão no quadro abaixo.";

  const dadosJson = useMemo(
    () =>
      JSON.stringify({
        ementa,
        competencias_gerais: itensParaGerais(gerais),
        competencias_especificas: { bncc: compBncc, curriculo: compCurr, manuais: compManuais },
        trimestres,
      }),
    [ementa, gerais, compBncc, compCurr, compManuais, trimestres]
  );

  const textoLivreInicial = plano?.texto_livre ?? TEXTO_LIVRE_INICIAL;

  /** Frases prontas para o texto livre: avaliação e metodologia, montadas com os objetos marcados. */
  const sugestoesTexto = useMemo(() => {
    const objetos = Array.from(new Set(trimestres.flatMap((t) => t.objetos.map((o) => o.texto.trim())).filter(Boolean))).slice(0, 8);
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
  }, [trimestres]);

  /** Lista do que ainda falta (só avisa — nunca muda o formato do plano). */
  function conferir(form: HTMLFormElement): string[] {
    const fd = new FormData(form);
    const campo = (nome: string) => String(fd.get(nome) ?? "").trim();
    const p: string[] = [];
    if (!campo("escola_id")) p.push("Escola não escolhida (o plano ficará em “Sem escola definida”).");
    if (!nomeComponente.trim()) p.push("Componente curricular não informado.");
    if (!campo("turma")) p.push("Turma não informada.");
    if (!campo("docente")) p.push("Nome do docente não informado.");
    if (ementa.length === 0) p.push("Ementa vazia.");
    if (gerais.length === 0) p.push("Nenhuma competência geral marcada.");
    if (compBncc.length + compCurr.length + compManuais.length === 0) p.push("Nenhuma competência específica marcada.");
    trimestres.forEach((t, i) => {
      const n = `${i + 1}º trimestre`;
      if (t.unidades.length === 0) p.push(`${n}: nenhuma unidade temática.`);
      if (t.habilidades.length === 0) p.push(`${n}: nenhuma habilidade.`);
      if (t.objetos.length === 0) p.push(`${n}: nenhum objeto de conhecimento.`);
    });
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
      <input type="hidden" name="disciplina_id" value={disciplina?.id ?? ""} />
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
      <SecaoPlano id="passo-2" numero={2} titulo="Ementa" descricao="Marque os temas que farão parte da ementa — e acrescente os seus.">
        <SeletorItens
          opcoes={ementaOpcoes}
          valor={ementa}
          onChange={setEmenta}
          anos={dados.anos}
          anoDaTurma={anoDaTurma}
          ajuda="Sugestões tiradas dos objetos de conhecimento do currículo deste componente."
          vazio={vazioPadrao}
          rotuloManual="Acrescentar temas à ementa"
          placeholderManual="Ex.: Introdução à Química (História da Química)"
          alturaRem={20}
        />
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
        descricao="Da BNCC e do Currículo Catarinense, em listas separadas — marque as que quiser."
      >
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-primary-800">BNCC</h3>
          <SeletorItens
            opcoes={competenciasBncc}
            valor={compBncc}
            onChange={setCompBncc}
            filtrarPorGrupo
            vazio={vazioPadrao}
            rotuloManual="Acrescentar competência da BNCC"
            placeholderManual="Digite a competência"
            semManual
            alturaRem={20}
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-primary-800">Currículo Catarinense</h3>
          <SeletorItens
            opcoes={competenciasCurriculo}
            valor={compCurr}
            onChange={setCompCurr}
            filtrarPorGrupo
            vazio="O Currículo Base do Território Catarinense adota as competências específicas da BNCC (listadas acima); aqui ficam as que forem cadastradas como próprias do Currículo Catarinense. Se quiser incluir alguma, digite no quadro de competências adicionais abaixo."
            rotuloManual="Acrescentar competência do Currículo Catarinense"
            placeholderManual="Digite a competência"
            semManual
            alturaRem={20}
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-primary-800">Competências adicionais (digitadas por você)</h3>
          <SeletorItens
            opcoes={[]}
            valor={compManuais}
            onChange={setCompManuais}
            vazio=""
            rotuloManual="Acrescentar competência"
            placeholderManual="Digite a competência (um item por linha)"
            manualComCodigo
          />
        </div>
      </SecaoPlano>

      {/* ───────── 5. Componente curricular ───────── */}
      <SecaoPlano
        id="passo-5"
        numero={5}
        titulo="Componente curricular"
        descricao="Preencha cada trimestre: o botão azul diz o que está sendo preenchido e a etiqueta vermelha, em qual trimestre."
      >
        {trimestres.map((t, i) => (
          <details key={i} open={i === 0} className="rounded-2xl border-2 border-red-300 bg-white shadow-sm">
            <summary className="cursor-pointer select-none rounded-2xl border-l-8 border-red-600 bg-red-50 px-4 py-3 text-base font-extrabold text-red-700">
              {TRIMESTRES_ROTULOS[i]}{" "}
              <span className="text-sm font-semibold text-red-900/70">
                ({t.habilidades.length} habilidade(s) · {t.objetos.length} objeto(s) · {t.unidades.length} unidade(s))
              </span>
            </summary>
            <div className="space-y-7 p-4">
              <div className="space-y-2">
                <TituloTrimestre nome="Unidades temáticas" trimestre={i} />
                <p className="text-xs text-slate-500">Unidade do livro e/ou de outras fontes.</p>
                <SeletorItens
                  opcoes={dados.unidades}
                  valor={t.unidades}
                  onChange={(v) => atualizarTrimestre(i, { unidades: v })}
                  anos={dados.anos}
                  anoDaTurma={anoDaTurma}
                  filtrarPorGrupo
                  vazio={vazioPadrao}
                  rotuloManual="Acrescentar unidade temática / unidade do livro"
                  placeholderManual="Ex.: Constituição e propriedades dos materiais"
                  alturaRem={12}
                />
              </div>
              <div className="space-y-2">
                <TituloTrimestre nome="Habilidades" trimestre={i} />
                <SeletorItens
                  opcoes={dados.habilidades}
                  valor={t.habilidades}
                  onChange={(v) => atualizarTrimestre(i, { habilidades: v })}
                  anos={dados.anos}
                  anoDaTurma={anoDaTurma}
                  filtrarPorFonte
                  vazio={vazioPadrao}
                  rotuloManual="Acrescentar habilidade"
                  placeholderManual="Descrição da habilidade"
                  manualComCodigo
                  alturaRem={22}
                />
              </div>
              <div className="space-y-2">
                <TituloTrimestre nome="Objetos de conhecimento" trimestre={i} />
                <SugestaoObjetos
                  sugeridos={objetosSugeridos(t)}
                  marcados={new Set(t.objetos.map((o) => o.id))}
                  onAlternar={(o, marcar) =>
                    atualizarTrimestre(i, { objetos: marcar ? [...t.objetos, opcaoParaItem(o)] : t.objetos.filter((x) => x.id !== o.id) })
                  }
                  onTodos={(lista, marcar) => {
                    const ids = new Set(lista.map((o) => o.id));
                    const jaTem = new Set(t.objetos.map((o) => o.id));
                    atualizarTrimestre(i, {
                      objetos: marcar
                        ? [...t.objetos, ...lista.filter((o) => !jaTem.has(o.id)).map(opcaoParaItem)]
                        : t.objetos.filter((x) => !ids.has(x.id)),
                    });
                  }}
                />
                <SeletorItens
                  opcoes={opcoesObjetos}
                  valor={t.objetos}
                  onChange={(v) => atualizarTrimestre(i, { objetos: v })}
                  anos={dados.anos}
                  anoDaTurma={anoDaTurma}
                  vazio={vazioPadrao}
                  rotuloManual="Acrescentar objeto do conhecimento"
                  placeholderManual="Ex.: Ligações químicas"
                  alturaRem={18}
                />
              </div>
            </div>
          </details>
        ))}
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
