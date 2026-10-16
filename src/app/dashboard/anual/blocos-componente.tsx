"use client";

import { opcaoParaItem, type DadosComponente, type OpcaoLista } from "@/lib/dados-anuais";
import { TRIMESTRES_ROTULOS, type ItemLista, type TrimestreAnual } from "@/lib/plano-anual";
import { useAvisoTemporario } from "../planos/linhas-do-editor";
import SeletorItens from "./seletor-itens";

// Os três blocos que se repetem para cada componente curricular do plano anual:
// ementa, competências específicas e os três trimestres. No plano de um componente só aparecem uma vez;
// nos Anos Iniciais com várias disciplinas, uma vez para cada disciplina (com o nome em destaque).

/** Tudo o que o professor marca/digita para UM componente. */
export interface ListasComp {
  ementa: ItemLista[];
  compBncc: ItemLista[];
  compCurr: ItemLista[];
  compManuais: ItemLista[];
  trimestres: TrimestreAnual[];
}

export function listasVazias(): ListasComp {
  return {
    ementa: [],
    compBncc: [],
    compCurr: [],
    compManuais: [],
    trimestres: [0, 1, 2].map(() => ({ unidades: [], habilidades: [], objetos: [] })),
  };
}

/** As listas oficiais do currículo carregadas para um componente, já separadas como os blocos precisam. */
export interface InfoComp {
  dados: DadosComponente;
  /** Objetos de conhecimento (o que o Currículo chama de "Conteúdo"). */
  objetos: OpcaoLista[];
  competenciasBncc: OpcaoLista[];
  competenciasCurriculo: OpcaoLista[];
  carregando: boolean;
  erro: string | null;
}

/** Atualiza as listas do componente a partir do valor mais recente (nunca de um valor antigo). */
export type Atualizar = (fn: (atual: ListasComp) => Partial<ListasComp>) => void;

interface BlocoProps {
  info: InfoComp;
  valor: ListasComp;
  atualizar: Atualizar;
  anoDaTurma: number | null;
  /** Mensagem quando não há opções oficiais. */
  vazioPadrao: string;
}

/** Monta as listas de um componente a partir do que veio do banco. */
export function montarInfo(dados: DadosComponente, carregando: boolean, erro: string | null): InfoComp {
  // O "objeto de conhecimento" do plano é o que o Currículo chama de "Conteúdo".
  // (Se o componente não tiver "Conteúdo", mostra todos para não ficar vazio.)
  const conteudos = dados.objetos.filter((o) => o.grupo === "Conteúdo");
  const base = conteudos.length > 0 ? conteudos : dados.objetos;
  return {
    dados,
    objetos: base.map((o) => (o.grupo === "Conteúdo" ? { ...o, grupo: "Objeto de conhecimento" } : o)),
    competenciasBncc: dados.competencias.filter((c) => c.fonte === "bncc"),
    competenciasCurriculo: dados.competencias.filter((c) => c.fonte === "curriculo_catarinense"),
    carregando,
    erro,
  };
}

/** Título de cada bloco do trimestre: botão azul com o nome do que se preenche + (etiqueta do componente) + etiqueta vermelha do trimestre. */
function TituloTrimestre({ nome, trimestre, componente }: { nome: string; trimestre: number; componente?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center rounded-xl bg-gradient-to-r from-primary-700 to-sky-500 px-4 py-2 text-sm font-extrabold text-white shadow-md">
        {nome}
      </span>
      {componente && <span className="etiqueta-disciplina">{componente}</span>}
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

/** Passo "Ementa" de um componente. */
export function BlocoEmenta({ info, valor, atualizar, anoDaTurma, vazioPadrao }: BlocoProps) {
  return (
    <SeletorItens
      opcoes={info.objetos}
      valor={valor.ementa}
      onChange={(v) => atualizar(() => ({ ementa: v }))}
      anos={info.dados.anos}
      anoDaTurma={anoDaTurma}
      ajuda="Sugestões tiradas dos objetos de conhecimento do currículo deste componente."
      vazio={vazioPadrao}
      rotuloManual="Acrescentar temas à ementa"
      placeholderManual="Ex.: Introdução à Química (História da Química)"
      alturaRem={20}
    />
  );
}

/** Passo "Competências específicas" de um componente (BNCC, Currículo Catarinense e as digitadas). */
export function BlocoEspecificas({ info, valor, atualizar, vazioPadrao }: Omit<BlocoProps, "anoDaTurma"> & { anoDaTurma?: number | null }) {
  return (
    <>
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-primary-800">BNCC</h3>
        <SeletorItens
          opcoes={info.competenciasBncc}
          valor={valor.compBncc}
          onChange={(v) => atualizar(() => ({ compBncc: v }))}
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
          opcoes={info.competenciasCurriculo}
          valor={valor.compCurr}
          onChange={(v) => atualizar(() => ({ compCurr: v }))}
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
          valor={valor.compManuais}
          onChange={(v) => atualizar(() => ({ compManuais: v }))}
          vazio=""
          rotuloManual="Acrescentar competência"
          placeholderManual="Digite a competência (um item por linha)"
          manualComCodigo
        />
      </div>
    </>
  );
}

/** Passo "Componente curricular": os três trimestres (unidades, habilidades e objetos) de um componente. */
export function BlocoTrimestres({
  info,
  valor,
  atualizar,
  anoDaTurma,
  vazioPadrao,
  nomeComponente,
}: BlocoProps & {
  /** Preenchido só quando o plano tem vários componentes: o nome aparece nas etiquetas de cada trimestre. */
  nomeComponente?: string;
}) {
  function atualizarTrimestre(i: number, fn: (t: TrimestreAnual) => Partial<TrimestreAnual>) {
    atualizar((atual) => ({ trimestres: atual.trimestres.map((t, k) => (k === i ? { ...t, ...fn(t) } : t)) }));
  }

  /** Objetos de conhecimento ligados às habilidades marcadas no trimestre (marcados ou não). */
  function objetosSugeridos(t: TrimestreAnual): OpcaoLista[] {
    const ids = new Set<string>();
    for (const h of t.habilidades) {
      const op = info.dados.habilidades.find((o) => o.id === h.id);
      for (const r of op?.relacionados ?? []) ids.add(r);
    }
    if (ids.size === 0) return [];
    return info.objetos.filter((o) => ids.has(o.id));
  }

  return (
    <>
      {valor.trimestres.map((t, i) => (
        <details key={i} open={i === 0 && !nomeComponente} className="rounded-2xl border-2 border-red-300 bg-white shadow-sm">
          <summary className="cursor-pointer select-none rounded-2xl border-l-8 border-red-600 bg-red-50 px-4 py-3 text-base font-extrabold text-red-700">
            {TRIMESTRES_ROTULOS[i]}{" "}
            <span className="text-sm font-semibold text-red-900/70">
              ({t.habilidades.length} habilidade(s) · {t.objetos.length} objeto(s) · {t.unidades.length} unidade(s))
            </span>
          </summary>
          <div className="space-y-7 p-4">
            <div className="space-y-2">
              <TituloTrimestre nome="Unidades temáticas" trimestre={i} componente={nomeComponente} />
              <p className="text-xs text-slate-500">Unidade do livro e/ou de outras fontes.</p>
              <SeletorItens
                opcoes={info.dados.unidades}
                valor={t.unidades}
                onChange={(v) => atualizarTrimestre(i, () => ({ unidades: v }))}
                anos={info.dados.anos}
                anoDaTurma={anoDaTurma}
                filtrarPorGrupo
                vazio={vazioPadrao}
                rotuloManual="Acrescentar unidade temática / unidade do livro"
                placeholderManual="Ex.: Constituição e propriedades dos materiais"
                alturaRem={12}
              />
            </div>
            <div className="space-y-2">
              <TituloTrimestre nome="Habilidades" trimestre={i} componente={nomeComponente} />
              <SeletorItens
                opcoes={info.dados.habilidades}
                valor={t.habilidades}
                onChange={(v) => atualizarTrimestre(i, () => ({ habilidades: v }))}
                anos={info.dados.anos}
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
              <TituloTrimestre nome="Objetos de conhecimento" trimestre={i} componente={nomeComponente} />
              <SugestaoObjetos
                sugeridos={objetosSugeridos(t)}
                marcados={new Set(t.objetos.map((o) => o.id))}
                onAlternar={(o, marcar) =>
                  atualizarTrimestre(i, (atual) => ({
                    objetos: marcar ? [...atual.objetos, opcaoParaItem(o)] : atual.objetos.filter((x) => x.id !== o.id),
                  }))
                }
                onTodos={(lista, marcar) => {
                  const ids = new Set(lista.map((o) => o.id));
                  atualizarTrimestre(i, (atual) => {
                    const jaTem = new Set(atual.objetos.map((o) => o.id));
                    return {
                      objetos: marcar
                        ? [...atual.objetos, ...lista.filter((o) => !jaTem.has(o.id)).map(opcaoParaItem)]
                        : atual.objetos.filter((x) => !ids.has(x.id)),
                    };
                  });
                }}
              />
              <SeletorItens
                opcoes={info.objetos}
                valor={t.objetos}
                onChange={(v) => atualizarTrimestre(i, () => ({ objetos: v }))}
                anos={info.dados.anos}
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
    </>
  );
}
