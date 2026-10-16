"use client";

import type { DadosComponente, OpcaoLista } from "@/lib/dados-anuais";
import { trimestreVazio, type ItemLista, type TrimestreAnual } from "@/lib/plano-anual";
import { useAvisoTemporario } from "../planos/linhas-do-editor";
import { COMPETENCIAS_GERAIS_BNCC } from "@/lib/competencias-gerais";
import SeletorItens from "./seletor-itens";

// Os blocos que se repetem para cada componente curricular do plano anual: ementa, competências gerais,
// competências específicas e os três trimestres (estes em `passo-trimestre.tsx`). No plano de um componente
// só aparecem uma vez; nos Anos Iniciais com várias disciplinas, uma vez para cada disciplina.

/** Tudo o que o professor marca/digita para UM componente. */
export interface ListasComp {
  ementa: ItemLista[];
  gerais: ItemLista[];
  compBncc: ItemLista[];
  compCurr: ItemLista[];
  compManuais: ItemLista[];
  trimestres: TrimestreAnual[];
}

export function listasVazias(): ListasComp {
  return {
    ementa: [],
    gerais: [],
    compBncc: [],
    compCurr: [],
    compManuais: [],
    trimestres: [0, 1, 2].map(() => trimestreVazio()),
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

/** "Você marcou estas habilidades; estes objetos de conhecimento estão ligados a elas no currículo." Tudo por caixinha. */
export function SugestaoObjetos({
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
    <div className="rounded-lg border border-cyan-300 bg-cyan-50 p-3">
      <p className="text-sm font-bold text-cyan-900">
        Sugestão: {sugeridos.length} objeto(s) de conhecimento ligado(s) às habilidades que você marcou
      </p>
      <p className="text-xs text-cyan-800">Marque a caixinha para colocar no plano (desmarque para tirar). Os marcados aparecem também na lista abaixo.</p>
      <ul className="mt-2 max-h-52 space-y-0.5 overflow-y-auto rounded-lg bg-white/70 p-1.5">
        {sugeridos.map((o) => {
          const marcado = marcados.has(o.id);
          return (
            <li key={o.id}>
              <label className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-sm text-cyan-950 hover:bg-cyan-100">
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
        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-cyan-900">
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

export const GERAIS_OPCOES: OpcaoLista[] = COMPETENCIAS_GERAIS_BNCC.map((c) => ({
  id: `cg:${c.numero}`,
  codigo: String(c.numero),
  texto: `${c.nome}: ${c.texto}`,
  anos: [],
}));

export function geraisParaItens(numeros: number[], manuais: string[]): ItemLista[] {
  const oficiais = numeros.map((n) => {
    const o = GERAIS_OPCOES.find((g) => g.id === `cg:${n}`);
    return { id: `cg:${n}`, codigo: String(n), texto: o?.texto ?? "" };
  });
  const digitadas = manuais.map((t, i) => ({ id: `manual:cg-${i}`, texto: t, manual: true, fonte: "manual" }));
  return [...oficiais, ...digitadas];
}

export function itensParaGerais(itens: ItemLista[]): { numeros: number[]; manuais: string[] } {
  const numeros: number[] = [];
  const manuais: string[] = [];
  for (const i of itens) {
    const m = /^cg:(\d+)$/.exec(i.id);
    if (m) numeros.push(Number(m[1]));
    else manuais.push(i.texto);
  }
  return { numeros: numeros.sort((a, b) => a - b), manuais };
}

/** Passo "Competências gerais da BNCC" de um componente. */
export function BlocoGerais({ valor, atualizar }: Pick<BlocoProps, "valor" | "atualizar">) {
  return (
    <SeletorItens
      opcoes={GERAIS_OPCOES}
      valor={valor.gerais}
      onChange={(v) => atualizar(() => ({ gerais: v }))}
      vazio=""
      alturaRem={26}
      rotuloManual="Acrescentar uma competência geral"
      placeholderManual="Digite a competência"
    />
  );
}
