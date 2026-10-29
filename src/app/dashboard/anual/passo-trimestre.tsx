"use client";

import { useMemo, useState } from "react";
import { opcaoParaItem, type OpcaoLista } from "@/lib/dados-anuais";
import { chaveTexto, TRIMESTRES_ROTULOS, type ItemLista, type TrimestreAnual } from "@/lib/plano-anual";
import { metodologiaDosObjetos, OPCOES_CRITERIOS, OPCOES_METODOLOGIA_BASE } from "@/lib/sugestoes-anual";
import { Icone, type NomeIcone } from "@/components/icones";
import { SugestaoObjetos, type Atualizar, type InfoComp, type ListasComp } from "./blocos-componente";
import SeletorItens from "./seletor-itens";
import EditorLivre from "./editor-livre";
import { removerTags } from "@/lib/texto-rico";

// Um trimestre inteiro do plano anual, numa tela só mas dividido em abas:
// unidades temáticas, habilidades, objetos de conhecimento, critérios de avaliação, metodologia
// e as três partes opcionais (conteúdos a estudar, projeto e caixa livre).

export const TOM_TRIMESTRE = ["verde", "ambar", "rosa"] as const;

type Aba = "unidades" | "habilidades" | "objetos" | "criterios" | "metodologia" | "conteudos" | "projeto" | "livre";

interface Props {
  info: InfoComp;
  valor: ListasComp;
  atualizar: Atualizar;
  /** 0, 1 ou 2. */
  indice: number;
  anoDaTurma: number | null;
  vazioPadrao: string;
  /** Identifica o editor da caixa livre (único por componente e trimestre). */
  chaveEditor: string;
  /** Referências bibliográficas que o botão do editor insere (oficiais + livros da disciplina). */
  referencias: string[];
  /** Frases prontas de metodologia e avaliação do editor. */
  sugestoes: { titulo: string; itens: string[] }[];
}

/** Quais itens (unidades/objetos) já estão em OUTROS trimestres do mesmo componente. */
function repetidosEm(trimestres: TrimestreAnual[], indice: number, campo: "unidades" | "objetos"): Record<string, string[]> {
  const mapa: Record<string, string[]> = {};
  trimestres.forEach((t, k) => {
    if (k === indice) return;
    for (const item of t[campo]) {
      const chave = chaveTexto(item.texto);
      if (!chave) continue;
      const rotulo = `${k + 1}º trimestre`;
      if (!mapa[chave]) mapa[chave] = [];
      if (!mapa[chave].includes(rotulo)) mapa[chave].push(rotulo);
    }
  });
  return mapa;
}

/** O projeto tem algum texto (o editor guarda HTML, mesmo vazio)? */
function projetoPreenchido(v: string): boolean {
  const limpo = (v ?? "").replace(/<!--rt-->/g, "");
  return /<(img|table|li)[\s>]/i.test(limpo) || removerTags(limpo).replace(/&nbsp;/g, " ").trim() !== "";
}

export default function PassoTrimestre({ info, valor, atualizar, indice, anoDaTurma, vazioPadrao, chaveEditor, referencias, sugestoes }: Props) {
  const t = valor.trimestres[indice];
  const [aba, setAba] = useState<Aba>("unidades");

  function mudar(fn: (atual: TrimestreAnual) => Partial<TrimestreAnual>) {
    atualizar((atual) => ({ trimestres: atual.trimestres.map((x, k) => (k === indice ? { ...x, ...fn(x) } : x)) }));
  }

  const repetidosUnidades = useMemo(() => repetidosEm(valor.trimestres, indice, "unidades"), [valor.trimestres, indice]);
  const repetidosObjetos = useMemo(() => repetidosEm(valor.trimestres, indice, "objetos"), [valor.trimestres, indice]);

  /** Objetos de conhecimento ligados às habilidades marcadas no trimestre (marcados ou não). */
  const sugeridos = useMemo<OpcaoLista[]>(() => {
    const ids = new Set<string>();
    for (const h of t.habilidades) {
      const op = info.dados.habilidades.find((o) => o.id === h.id);
      for (const r of op?.relacionados ?? []) ids.add(r);
    }
    if (ids.size === 0) return [];
    return info.objetos.filter((o) => ids.has(o.id));
  }, [t.habilidades, info.dados.habilidades, info.objetos]);

  const opcoesMetodologia = useMemo(
    () => [...metodologiaDosObjetos(t.objetos.map((o) => o.texto)), ...OPCOES_METODOLOGIA_BASE],
    [t.objetos]
  );

  const abas: { id: Aba; rotulo: string; icone: NomeIcone; qtd: number | null; opcional?: boolean }[] = [
    { id: "unidades", rotulo: "Unidades temáticas", icone: "unidade", qtd: t.unidades.length },
    { id: "habilidades", rotulo: "Habilidades", icone: "listaCheck", qtd: t.habilidades.length },
    { id: "objetos", rotulo: "Objetos de conhecimento", icone: "livro", qtd: t.objetos.length },
    { id: "criterios", rotulo: "Critérios de avaliação", icone: "criterios", qtd: t.criterios.length },
    { id: "metodologia", rotulo: "Metodologia", icone: "bussola", qtd: t.metodologia.length },
    { id: "conteudos", rotulo: "Conteúdos a estudar", icone: "camadas", qtd: t.conteudosAtivo ? t.conteudos.length : null, opcional: true },
    { id: "projeto", rotulo: "Projeto", icone: "frasco", qtd: t.projetoAtivo ? (projetoPreenchido(t.projeto) ? 1 : 0) : null, opcional: true },
    { id: "livre", rotulo: "Caixa livre", icone: "lapis", qtd: null, opcional: true },
  ];
  const posicao = abas.findIndex((a) => a.id === aba);
  const proxima = abas[posicao + 1];

  const itemDe = (o: OpcaoLista): ItemLista => opcaoParaItem(o);

  return (
    <div data-tom={TOM_TRIMESTRE[indice]} className="space-y-4">
      <div role="tablist" aria-label={`Partes do ${TRIMESTRES_ROTULOS[indice].toLowerCase()}`} className="flex flex-wrap gap-1.5 rounded-lg p-1.5" style={{ background: "var(--tom-claro)" }}>
        {abas.map((a) => {
          const ativa = a.id === aba;
          const feita = a.qtd !== null && a.qtd > 0;
          return (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={ativa}
              onClick={() => setAba(a.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
                ativa ? "text-white shadow-sm" : "bg-white/70 text-slate-700 hover:bg-white"
              }`}
              style={ativa ? { background: "var(--tom)" } : undefined}
            >
              <Icone nome={a.icone} className="h-4 w-4" />
              {a.rotulo}
              {a.opcional && !ativa && <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">opcional</span>}
              {a.qtd !== null && (
                <span
                  className={`ml-0.5 min-w-[1.4rem] rounded-full px-1.5 text-center text-xs font-bold ${
                    ativa ? "bg-white/25 text-white" : feita ? "bg-white text-slate-800" : "bg-white/60 text-slate-500"
                  }`}
                >
                  {a.qtd}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="space-y-3">
        {aba === "unidades" && (
          <>
            <p className="text-sm text-slate-600">Unidade do livro e/ou de outras fontes. Se marcar a mesma de outro trimestre, você recebe um aviso (sem bloqueio).</p>
            <SeletorItens
              opcoes={info.dados.unidades}
              valor={t.unidades}
              onChange={(v) => mudar(() => ({ unidades: v }))}
              anos={info.dados.anos}
              anoDaTurma={anoDaTurma}
              filtrarPorGrupo
              vazio={vazioPadrao}
              rotuloManual="Acrescentar unidade temática / unidade do livro"
              placeholderManual="Ex.: Constituição e propriedades dos materiais"
              alturaRem={18}
              repetidos={repetidosUnidades}
            />
          </>
        )}

        {aba === "habilidades" && (
          <SeletorItens
            opcoes={info.dados.habilidades.filter((h) => h.fonte !== "curriculo_educacao_digital")}
            valor={t.habilidades}
            onChange={(v) => mudar(() => ({ habilidades: v }))}
            anos={info.dados.anos}
            anoDaTurma={anoDaTurma}
            filtrarPorFonte
            vazio={vazioPadrao}
            rotuloManual="Acrescentar habilidade"
            placeholderManual="Descrição da habilidade"
            manualComCodigo
            alturaRem={24}
          />
        )}

        {aba === "objetos" && (
          <>
            <SugestaoObjetos
              sugeridos={sugeridos}
              marcados={new Set(t.objetos.map((o) => o.id))}
              onAlternar={(o, marcar) =>
                mudar((atual) => ({
                  objetos: marcar ? [...atual.objetos, itemDe(o)] : atual.objetos.filter((x) => x.id !== o.id),
                }))
              }
              onTodos={(lista, marcar) => {
                const ids = new Set(lista.map((o) => o.id));
                mudar((atual) => {
                  const jaTem = new Set(atual.objetos.map((o) => o.id));
                  return {
                    objetos: marcar ? [...atual.objetos, ...lista.filter((o) => !jaTem.has(o.id)).map(itemDe)] : atual.objetos.filter((x) => !ids.has(x.id)),
                  };
                });
              }}
            />
            <SeletorItens
              opcoes={info.objetos}
              valor={t.objetos}
              onChange={(v) => mudar(() => ({ objetos: v }))}
              anos={info.dados.anos}
              anoDaTurma={anoDaTurma}
              vazio={vazioPadrao}
              rotuloManual="Acrescentar objeto do conhecimento"
              placeholderManual="Ex.: Ligações químicas"
              alturaRem={20}
              repetidos={repetidosObjetos}
            />
          </>
        )}

        {aba === "criterios" && (
          <>
            <p className="text-sm text-slate-600">Vão para a coluna “Critérios de avaliação” da tabela deste trimestre.</p>
            <SeletorItens
              opcoes={OPCOES_CRITERIOS}
              valor={t.criterios}
              onChange={(v) => mudar(() => ({ criterios: v }))}
              vazio=""
              rotuloManual="Acrescentar critério de avaliação"
              placeholderManual="Digite o critério (um por linha)"
              alturaRem={20}
            />
          </>
        )}

        {aba === "metodologia" && (
          <>
            <p className="text-sm text-slate-600">
              Vão para a coluna “Metodologia”, ao lado dos critérios de avaliação. As primeiras sugestões são montadas com os objetos de conhecimento que você marcou.
            </p>
            <SeletorItens
              opcoes={opcoesMetodologia}
              valor={t.metodologia}
              onChange={(v) => mudar(() => ({ metodologia: v }))}
              filtrarPorGrupo
              vazio=""
              rotuloManual="Acrescentar item de metodologia"
              placeholderManual="Digite a estratégia (uma por linha)"
              alturaRem={20}
            />
          </>
        )}

        {aba === "conteudos" && (
          <>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={t.conteudosAtivo}
                onChange={(e) => mudar(() => ({ conteudosAtivo: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-700 focus:ring-primary-600"
              />
              <span>
                Quero acrescentar “Conteúdos a serem estudados” neste trimestre
                <span className="block text-xs font-normal text-slate-600">Desmarcado, este campo não aparece no plano nem no PDF.</span>
              </span>
            </label>
            {t.conteudosAtivo && (
              <SeletorItens
                opcoes={info.dados.objetos}
                valor={t.conteudos}
                onChange={(v) => mudar(() => ({ conteudos: v }))}
                anos={info.dados.anos}
                anoDaTurma={anoDaTurma}
                filtrarPorGrupo
                ajuda="Sugestões tiradas dos conteúdos deste componente curricular."
                vazio={vazioPadrao}
                rotuloManual="Acrescentar conteúdo"
                placeholderManual="Digite o conteúdo (um por linha)"
                alturaRem={20}
              />
            )}
          </>
        )}

        {aba === "projeto" && (
          <>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={t.projetoAtivo}
                onChange={(e) => mudar(() => ({ projetoAtivo: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-700 focus:ring-primary-600"
              />
              <span>
                Quero adicionar um projeto para este trimestre
                <span className="block text-xs font-normal text-slate-600">Desmarcado, este campo não aparece no plano nem no PDF.</span>
              </span>
            </label>
            {t.projetoAtivo && (
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  Nome do projeto, objetivo, como será desenvolvido, produto final... Use a barra de ferramentas como em qualquer editor de texto.
                </p>
                <EditorLivre
                  id={`projeto-${chaveEditor}`}
                  name={`projeto_${chaveEditor}`}
                  valorInicial={t.projeto}
                  alturaMinima={220}
                  placeholder="Escreva aqui o projeto deste trimestre (nome, objetivo, desenvolvimento, produto final...)."
                  referencias={referencias}
                  sugestoes={sugestoes}
                  onSincronizar={(v) => mudar(() => ({ projeto: v }))}
                />
              </div>
            )}
          </>
        )}

        {aba === "livre" && (
          <>
            <p className="text-sm text-slate-600">
              Espaço livre abaixo do {TRIMESTRES_ROTULOS[indice].toLowerCase()}: escreva, insira colunas, tabelas, imagens... Só aparece no plano se você escrever algo.
            </p>
            <EditorLivre
              id={`complemento-${chaveEditor}`}
              name={`complemento_${chaveEditor}`}
              valorInicial={t.complemento}
              alturaMinima={220}
              referencias={referencias}
              sugestoes={sugestoes}
              onSincronizar={(v) => mudar(() => ({ complemento: v }))}
            />
          </>
        )}

        {proxima && (
          <div className="flex justify-end pt-1">
            <button type="button" onClick={() => setAba(proxima.id)} className="btn-azul-suave">
              Continuar: {proxima.rotulo}
              <Icone nome="setaDireita" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
