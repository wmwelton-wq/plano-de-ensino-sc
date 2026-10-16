"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Escola } from "@/lib/database.types";
import type { EstadoFormulario } from "../planos/actions";
import SecaoPlano, { type TomSecao } from "../planos/secao-plano";
import TurmaSelector, { separarTurma } from "../planos/turma-selector";
import { createClient } from "@/lib/supabase/client";
import { Icone, type NomeIcone } from "@/components/icones";
import {
  carregarDadosComponente,
  DADOS_VAZIOS,
  type DadosComponente,
  type DisciplinaBasica,
} from "@/lib/dados-anuais";
import {
  ETAPAS_ANUAIS,
  TEXTO_LIVRE_INICIAL,
  TRIMESTRES_ROTULOS,
  complementoVisivel,
  normalizarComponentes,
  normalizarDados,
  numeroDaSerie,
  referenciasSugeridas,
  type EtapaAnual,
  type PlanoAnual,
} from "@/lib/plano-anual";
import { ordenarComponentes } from "@/lib/secoes-componentes";
import { metodologiaDosObjetos } from "@/lib/sugestoes-anual";
import {
  BlocoEmenta,
  BlocoEspecificas,
  BlocoGerais,
  geraisParaItens,
  itensParaGerais,
  listasVazias,
  montarInfo,
  type Atualizar,
  type InfoComp,
  type ListasComp,
} from "./blocos-componente";
import PassoTrimestre, { TOM_TRIMESTRE } from "./passo-trimestre";
import FluxoPassos, { type GrupoFluxo } from "./fluxo-passos";
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

const OUTRO = "__outro__";
/** Chave das listas quando o plano tem um componente só (Ensino Médio, Anos Finais). */
const UNICO = "__unico__";
const ANOS_INICIAIS: EtapaAnual = "fundamental_anos_iniciais";
const LISTAS_VAZIAS: ListasComp = listasVazias();
const LIMITE_ENVIO = 3_800_000;

type TipoPasso = "ident" | "ementa" | "gerais" | "esp" | "tri" | "livre" | "revisar";

interface Passo {
  chave: string;
  tipo: TipoPasso;
  /** Chave das listas do componente (id da disciplina ou UNICO). */
  comp?: string;
  /** Id da disciplina cujos dados do currículo aparecem. */
  idDados?: string | null;
  nomeComp?: string;
  tri?: number;
  rotulo: string;
}

const TOM_DO_TIPO: Record<TipoPasso, TomSecao> = {
  ident: "ardosia",
  ementa: "azul",
  gerais: "ciano",
  esp: "violeta",
  tri: "verde",
  livre: "azul",
  revisar: "ardosia",
};

const tomDe = (p: Passo): TomSecao => (p.tipo === "tri" ? TOM_TRIMESTRE[p.tri ?? 0] : TOM_DO_TIPO[p.tipo]);

const ICONE_DO_TIPO: Record<TipoPasso, NomeIcone> = {
  ident: "escola",
  ementa: "documento",
  gerais: "globo",
  esp: "alvo",
  tri: "calendario",
  livre: "lapis",
  revisar: "check",
};

/** Monta o JSON que vai para o servidor a partir das listas mais recentes. */
function montarDados(multi: boolean, componentes: DisciplinaBasica[], listas: Record<string, ListasComp>): string {
  if (multi) {
    const lista = componentes.map((d) => {
      const l = listas[d.id] ?? LISTAS_VAZIAS;
      return {
        disciplina_id: d.id,
        nome: d.nome,
        ementa: l.ementa,
        competencias_gerais: itensParaGerais(l.gerais),
        competencias_especificas: { bncc: l.compBncc, curriculo: l.compCurr, manuais: l.compManuais },
        trimestres: l.trimestres,
      };
    });
    const numeros = Array.from(new Set(lista.flatMap((c) => c.competencias_gerais.numeros))).sort((a, b) => a - b);
    const manuais = Array.from(new Set(lista.flatMap((c) => c.competencias_gerais.manuais)));
    return JSON.stringify({ competencias_gerais: { numeros, manuais }, componentes: lista });
  }
  const l = listas[UNICO] ?? LISTAS_VAZIAS;
  return JSON.stringify({
    ementa: l.ementa,
    competencias_gerais: itensParaGerais(l.gerais),
    competencias_especificas: { bncc: l.compBncc, curriculo: l.compCurr, manuais: l.compManuais },
    trimestres: l.trimestres,
  });
}

function feitoTrimestre(l: ListasComp, i: number): boolean {
  const t = l.trimestres[i];
  return t.unidades.length > 0 && t.habilidades.length > 0 && t.objetos.length > 0;
}

export default function PlanoAnualForm({ escolas, disciplinas, nomeProfessor, plano, action, textoBotao }: PlanoAnualFormProps) {
  const [estado, formAction, pendente] = useActionState(action, {});
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const topoRef = useRef<HTMLDivElement>(null);
  const dadosRef = useRef<HTMLInputElement>(null);
  const livreRef = useRef<HTMLInputElement>(null);
  const ignorarPendencias = useRef(false);
  const [conferencia, setConferencia] = useState<string[] | null>(null);
  const [pedindoConfirmacao, setPedindoConfirmacao] = useState(false);
  const [statusPlano, setStatusPlano] = useState<"rascunho" | "finalizado">(plano?.status ?? "rascunho");

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
  const componentesSalvos = useMemo(() => normalizarComponentes(plano?.componentes, plano?.competencias_gerais), [plano]);
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

  // Anos Iniciais: o mesmo professor dá várias disciplinas, então o plano pode ter vários componentes, cada um com o seu fluxo.
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
  // Ementa, competências e trimestres de cada componente (chave: id da disciplina; UNICO = plano de um componente só).
  const [listas, setListas] = useState<Record<string, ListasComp>>(() => {
    const doPlano: ListasComp = {
      ementa: inicial.ementa,
      gerais: geraisParaItens(inicial.competenciasGerais.numeros, inicial.competenciasGerais.manuais),
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
            gerais: geraisParaItens(c.competenciasGerais.numeros, c.competenciasGerais.manuais),
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
  // Espelho sempre atual das listas: o envio e a troca de passo leem daqui (nunca de um valor antigo).
  const listasRef = useRef(listas);
  const atualizarDe =
    (chave: string): Atualizar =>
    (fn) => {
      const atual = listasRef.current[chave] ?? listasVazias();
      listasRef.current = { ...listasRef.current, [chave]: { ...atual, ...fn(atual) } };
      setListas(listasRef.current);
    };
  const listasDe = (chave: string): ListasComp => listas[chave] ?? LISTAS_VAZIAS;

  // Texto livre (item 6 em diante): guardado aqui para não se perder ao trocar de passo.
  const textoLivreInicial = plano?.texto_livre ?? TEXTO_LIVRE_INICIAL;
  const [textoLivre, setTextoLivre] = useState<string>(textoLivreInicial ?? "");
  const textoLivreRef = useRef(textoLivre);
  const guardarTextoLivre = (v: string) => {
    textoLivreRef.current = v;
    setTextoLivre(v);
  };

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
      ? "Escolha o componente curricular no passo de identificação para ver as opções do currículo — ou digite à mão no quadro abaixo."
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

  function alternarComponente(id: string) {
    setComponentesSel((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  const dadosJson = useMemo(() => montarDados(multi, componentes, listas), [multi, componentes, listas]);

  // ── O fluxo: identificação → (para cada componente: ementa, gerais, específicas, 3 trimestres) → texto livre → revisão ──
  const passos = useMemo<Passo[]>(() => {
    const lista: Passo[] = [{ chave: "ident", tipo: "ident", rotulo: "Identificação" }];
    const unidades = multi
      ? componentes.map((d) => ({ chave: d.id, idDados: d.id as string | null, nome: d.nome }))
      : [{ chave: UNICO, idDados: (disciplina?.id ?? null) as string | null, nome: nomeComponente || "Componente curricular" }];
    for (const u of unidades) {
      const base = { comp: u.chave, idDados: u.idDados, nomeComp: u.nome };
      lista.push({ chave: `ementa|${u.chave}`, tipo: "ementa", rotulo: "Ementa", ...base });
      lista.push({ chave: `gerais|${u.chave}`, tipo: "gerais", rotulo: "Competências gerais", ...base });
      lista.push({ chave: `esp|${u.chave}`, tipo: "esp", rotulo: "Competências específicas", ...base });
      for (let i = 0; i < 3; i++) lista.push({ chave: `tri${i}|${u.chave}`, tipo: "tri", tri: i, rotulo: TRIMESTRES_ROTULOS[i].replace("TRIMESTRE", "trimestre"), ...base });
    }
    lista.push({ chave: "livre", tipo: "livre", rotulo: "Texto livre" });
    lista.push({ chave: "revisar", tipo: "revisar", rotulo: "Revisar e salvar" });
    return lista;
  }, [multi, componentes, disciplina, nomeComponente]);

  const [passoChave, setPassoChave] = useState("ident");
  const indice = Math.max(0, passos.findIndex((p) => p.chave === passoChave));
  const passo = passos[indice];
  const erroIdentificacao = (): string | null => {
    if (multi && componentes.length === 0) return "Marque pelo menos um componente curricular.";
    if (!multi && !disciplinaSel) return "Escolha o componente curricular (disciplina).";
    if (!multi && disciplinaSel === OUTRO && !componenteLivre.trim()) return "Digite o nome do componente.";
    return null;
  };

  function irPara(chave: string) {
    // Passa o que está no editor para as listas antes de trocar de tela.
    formRef.current?.dispatchEvent(new Event("plano:sincronizar"));
    if (chave !== "ident" && passoChave === "ident") {
      const erro = erroIdentificacao();
      if (erro) {
        setErroLocal(erro);
        return;
      }
    }
    setErroLocal(null);
    setPassoChave(chave);
    requestAnimationFrame(() => topoRef.current?.scrollIntoView({ block: "start" }));
  }
  const avancar = () => indice < passos.length - 1 && irPara(passos[indice + 1].chave);
  const voltar = () => indice > 0 && irPara(passos[indice - 1].chave);

  /** O passo já tem o essencial? (só para os marcadores do topo) */
  function passoFeito(p: Passo): boolean {
    if (p.tipo === "ident") return !erroIdentificacao() && !!p.chave;
    if (p.tipo === "livre") return textoLivre.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() !== "" || textoLivre.includes("<img");
    if (p.tipo === "revisar") return false;
    const l = listasDe(p.comp ?? UNICO);
    if (p.tipo === "ementa") return l.ementa.length > 0;
    if (p.tipo === "gerais") return l.gerais.length > 0;
    if (p.tipo === "esp") return l.compBncc.length + l.compCurr.length + l.compManuais.length > 0;
    return feitoTrimestre(l, p.tri ?? 0);
  }

  const grupos = useMemo<GrupoFluxo[]>(() => {
    const out: GrupoFluxo[] = [];
    const g = (id: string, rotulo: string, tom: TomSecao, icone: NomeIcone, doGrupo: Passo[]) =>
      out.push({ id, rotulo, tom, icone, passos: doGrupo.map((p) => ({ chave: p.chave, rotulo: p.rotulo, feito: passoFeito(p), tom: tomDe(p) })) });
    g("ident", "Identificação", "ardosia", "escola", passos.filter((p) => p.tipo === "ident"));
    const ordem: string[] = [];
    for (const p of passos) if (p.comp && !ordem.includes(p.comp)) ordem.push(p.comp);
    for (const c of ordem) {
      const doComp = passos.filter((p) => p.comp === c);
      g(`comp|${c}`, doComp[0].nomeComp ?? "Componente", "ardosia", "livro", doComp);
    }
    g("fim", "Fechamento", "azul", "check", passos.filter((p) => p.tipo === "livre" || p.tipo === "revisar"));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passos, listas, textoLivre, multi, componentes, disciplinaSel, componenteLivre]);

  /** Frases prontas para o texto livre: avaliação e metodologia, montadas com os objetos marcados. */
  const sugestoesTexto = useMemo(() => {
    const trimestresAtivos = multi
      ? componentes.flatMap((d) => (listas[d.id] ?? LISTAS_VAZIAS).trimestres)
      : (listas[UNICO] ?? LISTAS_VAZIAS).trimestres;
    const metodologia = metodologiaDosObjetos(trimestresAtivos.flatMap((t) => t.objetos.map((o) => o.texto))).map((o) => `${o.texto}.`);
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
    const conferirListas = (l: ListasComp, prefixo: string) => {
      if (l.ementa.length === 0) p.push(`${prefixo}Ementa vazia.`);
      if (l.gerais.length === 0) p.push(`${prefixo}Nenhuma competência geral marcada.`);
      if (l.compBncc.length + l.compCurr.length + l.compManuais.length === 0) p.push(`${prefixo}Nenhuma competência específica marcada.`);
      l.trimestres.forEach((t, i) => {
        const n = `${prefixo}${i + 1}º trimestre`;
        if (t.unidades.length === 0) p.push(`${n}: nenhuma unidade temática.`);
        if (t.habilidades.length === 0) p.push(`${n}: nenhuma habilidade.`);
        if (t.objetos.length === 0) p.push(`${n}: nenhum objeto de conhecimento.`);
        if (t.criterios.length === 0) p.push(`${n}: nenhum critério de avaliação.`);
        if (t.metodologia.length === 0) p.push(`${n}: nenhuma metodologia.`);
      });
    };
    if (multi) componentes.forEach((d) => conferirListas(listasRef.current[d.id] ?? LISTAS_VAZIAS, `${d.nome} — `));
    else conferirListas(listasRef.current[UNICO] ?? LISTAS_VAZIAS, "");
    const livre = textoLivreRef.current;
    if (!livre.includes("<img") && livre.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "") {
      p.push("O texto livre (item 6 em diante) está vazio.");
    }
    return p;
  }

  /** Copia as competências gerais do componente anterior (evita marcar as mesmas várias vezes). */
  function copiarGeraisDoAnterior(chave: string) {
    const ordem = componentes.map((d) => d.id);
    const pos = ordem.indexOf(chave);
    if (pos <= 0) return;
    const doAnterior = listasRef.current[ordem[pos - 1]]?.gerais ?? [];
    atualizarDe(chave)(() => ({ gerais: doAnterior }));
  }

  // ── O que cada passo mostra ──
  function conteudoDoPasso(p: Passo) {
    const chave = p.comp ?? UNICO;
    const pilula = multi ? (
      <div>
        <span className="etiqueta-disciplina">{p.nomeComp}</span>
      </div>
    ) : null;
    const idPasso = `passo-${indice}`;

    if (p.tipo === "ementa") {
      return (
        <SecaoPlano id={idPasso} numero={indice} titulo={multi ? `Ementa — ${p.nomeComp}` : "Ementa"} tom={tomDe(p)} icone={ICONE_DO_TIPO.ementa}
          descricao="Marque os temas que farão parte da ementa — e acrescente os seus.">
          {pilula}
          <BlocoEmenta {...propsDe(chave, p.idDados)} />
        </SecaoPlano>
      );
    }
    if (p.tipo === "gerais") {
      const posicao = componentes.findIndex((d) => d.id === chave);
      return (
        <SecaoPlano id={idPasso} numero={indice} titulo={multi ? `Competências gerais da BNCC — ${p.nomeComp}` : "Competências gerais da BNCC"} tom={tomDe(p)} icone={ICONE_DO_TIPO.gerais}
          descricao="São as mesmas para qualquer plano: marque as que quiser e acrescente outras.">
          {pilula}
          {multi && posicao > 0 && (
            <button type="button" onClick={() => copiarGeraisDoAnterior(chave)} className="btn-azul-suave">
              <Icone nome="copiar" className="h-4 w-4" />
              Usar as mesmas de {componentes[posicao - 1].nome}
            </button>
          )}
          <BlocoGerais valor={listasDe(chave)} atualizar={atualizarDe(chave)} />
        </SecaoPlano>
      );
    }
    if (p.tipo === "esp") {
      return (
        <SecaoPlano id={idPasso} numero={indice} titulo={multi ? `Competências específicas — ${p.nomeComp}` : "Competências específicas"} tom={tomDe(p)} icone={ICONE_DO_TIPO.esp}
          descricao="Da BNCC e do Currículo Catarinense, em listas separadas — marque as que quiser.">
          {pilula}
          <div className="space-y-4">
            <BlocoEspecificas {...propsDe(chave, p.idDados)} />
          </div>
        </SecaoPlano>
      );
    }
    if (p.tipo === "tri") {
      const i = p.tri ?? 0;
      return (
        <SecaoPlano id={idPasso} numero={indice} titulo={multi ? `${TRIMESTRES_ROTULOS[i]} — ${p.nomeComp}` : TRIMESTRES_ROTULOS[i]} tom={tomDe(p)} icone={ICONE_DO_TIPO.tri}
          descricao="Preencha por partes, nas abas: unidades, habilidades, objetos, critérios de avaliação e metodologia (e, se quiser, conteúdos, projeto e caixa livre).">
          {pilula}
          <PassoTrimestre key={p.chave} {...propsDe(chave, p.idDados)} indice={i} chaveEditor={`${chave}-${i}`} />
        </SecaoPlano>
      );
    }
    if (p.tipo === "livre") {
      return (
        <SecaoPlano id={idPasso} numero={indice} titulo="Do item 6 em diante: texto livre" tom={tomDe(p)} icone={ICONE_DO_TIPO.livre}
          descricao="Aqui o plano continua do jeito que você escrever — avaliação, metodologias, referências bibliográficas, o que quiser.">
          <EditorLivre
            id="texto_livre_editor"
            name="texto_livre_editor"
            valorInicial={textoLivre}
            referencias={referenciasSugeridas(etapa)}
            sugestoes={sugestoesTexto}
            onSincronizar={guardarTextoLivre}
          />
        </SecaoPlano>
      );
    }
    // revisar
    const unidades = multi ? componentes.map((d) => ({ chave: d.id, nome: d.nome })) : [{ chave: UNICO, nome: nomeComponente || "Componente curricular" }];
    return (
      <SecaoPlano id={idPasso} numero={indice} titulo="Revisar e salvar" tom={tomDe(p)} icone={ICONE_DO_TIPO.revisar}
        descricao="Veja o resumo, escolha a situação do plano e salve. Dá para editar depois.">
        <div className="overflow-x-auto rounded-lg border border-slate-300">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                <th className="px-3 py-2">{multi ? "Componente" : "Plano"}</th>
                <th className="px-3 py-2">Trimestre</th>
                <th className="px-3 py-2 text-center">Unid.</th>
                <th className="px-3 py-2 text-center">Hab.</th>
                <th className="px-3 py-2 text-center">Obj.</th>
                <th className="px-3 py-2 text-center">Crit.</th>
                <th className="px-3 py-2 text-center">Metod.</th>
                <th className="px-3 py-2 text-center">Extras</th>
              </tr>
            </thead>
            <tbody>
              {unidades.flatMap((u) =>
                listasDe(u.chave).trimestres.map((t, i) => {
                  const extras = [t.conteudosAtivo && t.conteudos.length > 0, t.projetoAtivo && t.projeto.trim() !== "", complementoVisivel(t) !== ""].filter(Boolean).length;
                  return (
                    <tr key={`${u.chave}-${i}`} className="border-t border-slate-200">
                      <td className="px-3 py-1.5 font-semibold text-slate-800">{i === 0 ? u.nome : ""}</td>
                      <td className="px-3 py-1.5">{i + 1}º</td>
                      <td className="px-3 py-1.5 text-center">{t.unidades.length}</td>
                      <td className="px-3 py-1.5 text-center">{t.habilidades.length}</td>
                      <td className="px-3 py-1.5 text-center">{t.objetos.length}</td>
                      <td className="px-3 py-1.5 text-center">{t.criterios.length}</td>
                      <td className="px-3 py-1.5 text-center">{t.metodologia.length}</td>
                      <td className="px-3 py-1.5 text-center">{extras}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="status_sel" className="field-label">
              Situação do plano
            </label>
            <select id="status_sel" value={statusPlano} onChange={(e) => setStatusPlano(e.target.value as "rascunho" | "finalizado")} className="input-field">
              <option value="rascunho">Rascunho (ainda estou preenchendo)</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
        </div>

        <section aria-labelledby="conferencia" className="rounded-lg border border-slate-300 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id="conferencia" className="text-sm font-bold text-slate-900">
              Conferir antes de finalizar
            </h3>
            <button type="button" className="btn-azul-suave" onClick={() => formRef.current && setConferencia(conferir(formRef.current))}>
              Conferir agora
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-600">A conferência só avisa o que está faltando. Ela não altera nada no plano.</p>
          {conferencia !== null &&
            (conferencia.length === 0 ? (
              <p role="status" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                Tudo preenchido. Pode finalizar.
              </p>
            ) : (
              <div role="status" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">Ainda falta preencher ({conferencia.length}):</p>
                <ul className="mt-1 max-h-60 list-disc space-y-0.5 overflow-y-auto pl-5">
                  {conferencia.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                {pedindoConfirmacao && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-azul"
                      onClick={() => {
                        ignorarPendencias.current = true;
                        formRef.current?.requestSubmit();
                      }}
                    >
                      Finalizar mesmo assim
                    </button>
                    <button type="button" className="btn-azul-suave" onClick={() => setPedindoConfirmacao(false)}>
                      Voltar e completar
                    </button>
                  </div>
                )}
              </div>
            ))}
        </section>
      </SecaoPlano>
    );
  }

  const ultimo = indice === passos.length - 1;
  const mensagemErro = erroLocal ?? estado.erro;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4"
      onSubmit={(e) => {
        const erro = erroIdentificacao();
        if (erro) {
          e.preventDefault();
          setPassoChave("ident");
          setErroLocal(erro);
          return;
        }
        // O envio usa sempre o que há de mais recente (inclusive o que estava sendo digitado nos editores).
        const dadosFinais = montarDados(multi, componentes, listasRef.current);
        if (dadosRef.current) dadosRef.current.value = dadosFinais;
        if (livreRef.current) livreRef.current.value = textoLivreRef.current;
        if (statusPlano === "finalizado" && !ignorarPendencias.current) {
          const faltas = conferir(e.currentTarget);
          if (faltas.length > 0) {
            e.preventDefault();
            setConferencia(faltas);
            setPedindoConfirmacao(true);
            setPassoChave("revisar");
            return;
          }
        }
        ignorarPendencias.current = false;
        setPedindoConfirmacao(false);
        if (dadosFinais.length + textoLivreRef.current.length > LIMITE_ENVIO) {
          e.preventDefault();
          setErroLocal("O plano ficou grande demais para salvar (provavelmente por causa das imagens). Reduza ou remova algumas imagens dos textos livres.");
        } else {
          setErroLocal(null);
        }
      }}
    >
      <input type="hidden" name="etapa" value={etapa} />
      <input type="hidden" name="disciplina_id" value={multi ? componentes[0]?.id ?? "" : disciplina?.id ?? ""} />
      <input type="hidden" name="componente" value={nomeComponente} />
      <input type="hidden" name="dados" value={dadosJson} ref={dadosRef} readOnly />
      <input type="hidden" name="texto_livre" value={textoLivre} ref={livreRef} readOnly />
      <input type="hidden" name="status" value={statusPlano} />

      <div ref={topoRef} className="scroll-mt-20" />
      <FluxoPassos grupos={grupos} atual={passo.chave} aoIr={irPara} />

      {/* A identificação fica sempre montada (só escondida) para os campos irem junto no envio. */}
      <div hidden={passo.tipo !== "ident"}>
      <SecaoPlano id="passo-ident" numero={1} titulo="Identificação" tom="ardosia" icone="escola" descricao="Escola, componente, turma e docente — vai para o cabeçalho do plano.">
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
                Marque todos os componentes que você leciona nesta turma. Depois desta tela, cada componente abre uma vez, um de cada vez:
                ementa, competências e os três trimestres, tudo separado por componente.
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
                            ? "border-primary-600 bg-primary-50 font-semibold text-primary-900"
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
            <input id="ano_letivo" name="ano_letivo" type="number" defaultValue={plano?.ano_letivo ?? new Date().getFullYear()} className="input-field" />
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

          <fieldset className="rounded-lg border border-slate-300 bg-white p-4">
            <legend className="px-1 text-sm font-bold text-slate-800">Logos do cabeçalho</legend>
            <label className="mt-1 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="incluir_logo_estado" defaultChecked={plano?.incluir_logo_estado ?? true} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              Logo do Governo de Santa Catarina (Secretaria de Estado da Educação)
            </label>
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="incluir_logo_escola" defaultChecked={plano?.incluir_logo_escola ?? true} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              Logo da escola
            </label>
          </fieldset>

        </div>
        {erroDados && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {erroDados}
          </p>
        )}
      </SecaoPlano>

      </div>

      {passo.tipo !== "ident" && conteudoDoPasso(passo)}

      {/* Barra de navegação do fluxo */}
      <div className="sticky bottom-3 z-[5] space-y-2">
        {mensagemErro && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 shadow-sm">
            <Icone nome="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
            {mensagemErro}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur">
          <button type="button" onClick={voltar} disabled={indice === 0} className="btn-azul-suave">
            <Icone nome="setaEsquerda" className="h-4 w-4" />
            Voltar
          </button>
          <p className="order-last w-full text-center text-xs text-slate-600 sm:order-none sm:w-auto">
            Passo {indice + 1} de {passos.length} · <span className="font-semibold text-slate-800">{multi && passo.nomeComp ? `${passo.nomeComp} · ` : ""}{passo.rotulo}</span>
          </p>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={pendente} className={ultimo ? "btn-azul" : "btn-azul-suave"}>
              {pendente ? "Salvando..." : ultimo ? textoBotao : "Salvar e continuar depois"}
            </button>
            {!ultimo && (
              <button type="button" onClick={avancar} className="btn-azul">
                Próximo
                <Icone nome="setaDireita" className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
