"use client";

import { useEffect, useId, useMemo, useState, type ReactNode, type RefObject } from "react";
import type { HabilidadeCurricular } from "@/lib/database.types";
import SecaoPlano from "./secao-plano";
import type { EditorTextoRicoHandle } from "./editor-texto-rico";
import { useAvisoTemporario, useCaixinhasIndependentes, type ItemCaixinha } from "./linhas-do-editor";

interface ObjetosEHabilidadesProps {
  /** Habilidades (de todas as fontes) da disciplina escolhida, exceto as de educação digital. */
  habilidades: HabilidadeCurricular[];
  selecionadasIniciais: string[];
  /** Campo de texto dos conteúdos: marcar uma caixinha escreve a linha nele e desmarcar a tira. */
  editorRef: RefObject<EditorTextoRicoHandle | null>;
  vazio: string;
  /** Nomes dos componentes (usado quando o plano reúne mais de um componente curricular). */
  nomesDisciplinas?: Record<string, string>;
  /** Ano sugerido (ex.: vindo do seletor de turma); o professor pode trocar. */
  anoSugerido?: number | null;
  /** Campo de texto "Objeto(s) de conhecimento em estudo/conteúdos", que fica logo abaixo do botão de sugestões. */
  editorConteudos: ReactNode;
  numeroObjetos: number;
  numeroHabilidades: number;
  idObjetos: string;
  idHabilidades: string;
}

const FONTE_CATARINENSE = "curriculo_catarinense";
const FONTE_BNCC = "bncc";
/** Na BNCC, uma linha pode reunir vários objetos de conhecimento, separados por " | ". */
const SEPARADOR_BNCC = " | ";
const GRUPO_BNCC = "Habilidades da BNCC (em ordem de código)";

/** "6º ano" -> [6]; "6º e 7º anos" -> [6, 7]; "6º ao 9º ano" -> [6, 7, 8, 9]. */
function anosDoRotulo(rotulo: string | null): number[] {
  if (!rotulo) return [];
  const numeros = Array.from(rotulo.matchAll(/(\d+)\s*º/g)).map((m) => Number(m[1]));
  if (numeros.length === 0) return [];
  if (numeros.length >= 2 && /\s(a|ao|até)\s/i.test(rotulo)) {
    const anos: number[] = [];
    for (let a = numeros[0]; a <= numeros[numeros.length - 1]; a++) anos.push(a);
    return anos;
  }
  return numeros;
}

const chaveObjeto = (chave: string) => `o:${chave}`;
const chaveConteudo = (chave: string, c: string) => `c:${chave}||${c}`;

/** "Unidade Temática: Objeto" -> "Objeto" (se não houver ": ", devolve o texto inteiro). */
function nomeDoObjeto(objeto: string): string {
  const i = objeto.indexOf(": ");
  return i >= 0 ? objeto.slice(i + 2).trim() : objeto.trim();
}

/** Quebra o texto de conteúdos em itens, tirando o marcador "• ". */
function itensDeConteudo(texto: string | null | undefined): string[] {
  if (!texto) return [];
  return texto
    .split("\n")
    .map((l) => l.replace(/^[\s•\-–*]+/, "").trim())
    .filter((l) => l.length > 0);
}

/** Texto sem acento/maiúscula e com cada palavra reduzida (singular, 6 letras) para comparar nomes quase iguais. */
function chaveDeParte(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.replace(/s$/, "").slice(0, 6))
    .join(" ");
}

/** "Artes Integradas: A / B / C" -> unidade "artes integradas" e partes [a, b, c] (já comparáveis). */
function partesDoObjeto(objeto: string): { unidade: string; partes: string[] } {
  const i = objeto.indexOf(": ");
  const unidade = i >= 0 ? objeto.slice(0, i) : "";
  const resto = i >= 0 ? objeto.slice(i + 2) : objeto;
  return {
    unidade: chaveDeParte(unidade),
    partes: resto.split(" / ").map(chaveDeParte).filter(Boolean),
  };
}

interface GrupoObjeto {
  chave: string;
  objeto: string;
  disciplina: string;
  itens: HabilidadeCurricular[];
}

/**
 * O currículo traz, para o mesmo componente e ano, um objeto "reunido" (ex.: "Artes Integradas: Processo de
 * criação / Matrizes estéticas e culturais / Patrimônio Cultural / Arte e tecnologia") e também cada parte
 * solta ("Artes Integradas: Arte e tecnologia"...), repetindo os mesmos conteúdos. Mostramos só o reunido,
 * com as habilidades e conteúdos de todos juntos: nada se perde, mas não há mais itens repetidos.
 */
function reunirObjetosRepetidos(grupos: GrupoObjeto[]): GrupoObjeto[] {
  const info = grupos.map((g) => ({ g, ...partesDoObjeto(g.objeto), disc: g.chave.slice(0, g.chave.indexOf("||")) }));
  const destino = new Map<number, number>();
  info.forEach((a, ia) => {
    if (a.partes.length === 0) return;
    let melhor = -1;
    info.forEach((b, ib) => {
      if (ia === ib || b.disc !== a.disc || b.unidade !== a.unidade) return;
      if (!a.partes.every((p) => b.partes.includes(p))) return;
      const maior = b.partes.length > a.partes.length;
      const igualMaisCanonico = b.partes.length === a.partes.length && b.g.objeto < a.g.objeto;
      if (!maior && !igualMaisCanonico) return;
      if (melhor === -1 || b.partes.length > info[melhor].partes.length) melhor = ib;
    });
    if (melhor !== -1) destino.set(ia, melhor);
  });
  if (destino.size === 0) return grupos;
  const extras = new Map<number, HabilidadeCurricular[]>();
  destino.forEach((ib, ia) => extras.set(ib, [...(extras.get(ib) ?? []), ...info[ia].g.itens]));
  return info
    .map((x, i) => ({ x, i }))
    .filter(({ i }) => !destino.has(i))
    .map(({ x, i }) => {
      const adicionais = extras.get(i);
      if (!adicionais) return x.g;
      const vistos = new Set(x.g.itens.map((h) => h.id));
      const itens = [...x.g.itens];
      for (const h of adicionais) {
        if (!vistos.has(h.id)) {
          vistos.add(h.id);
          itens.push(h);
        }
      }
      return { ...x.g, itens };
    });
}

function semDuplicatas(itens: string[]): string[] {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const item of itens) {
    const chave = item.toLowerCase();
    if (!vistos.has(chave)) {
      vistos.add(chave);
      saida.push(item);
    }
  }
  return saida;
}

/**
 * Duas etapas do plano que compartilham o mesmo currículo/ano:
 *  1) Objetos de conhecimento e conteúdos — lista com caixinhas: marcar coloca o objeto
 *     (e seus conteúdos) no campo de texto logo abaixo; desmarcar tira;
 *  2) Selecionar habilidades — lista por objeto de conhecimento, com as
 *     habilidades marcadas sempre visíveis.
 */
export default function ObjetosEHabilidades({
  habilidades,
  selecionadasIniciais,
  editorRef,
  vazio,
  nomesDisciplinas,
  anoSugerido = null,
  editorConteudos,
  numeroObjetos,
  numeroHabilidades,
  idObjetos,
  idHabilidades,
}: ObjetosEHabilidadesProps) {
  const idFonte = useId();
  const idAno = useId();
  const idBuscaObj = useId();
  const idBuscaHab = useId();
  const caixas = useCaixinhasIndependentes(editorRef);
  const { aviso, mostrar } = useAvisoTemporario();

  const porId = useMemo(() => new Map(habilidades.map((h) => [h.id, h])), [habilidades]);

  // Em planos já salvos só com habilidades da BNCC, abre direto na BNCC.
  const [fonte, setFonte] = useState(() => {
    const doPlano = selecionadasIniciais.map((id) => porId.get(id)).filter(Boolean);
    return doPlano.length > 0 && doPlano.every((h) => h?.fonte === FONTE_BNCC)
      ? FONTE_BNCC
      : FONTE_CATARINENSE;
  });

  // Mantém só as seleções que pertencem a esta lista (assim não duplicamos as
  // habilidades de educação digital, que têm o seu próprio seletor).
  const [selecionadas, setSelecionadas] = useState<Set<string>>(
    () => new Set(selecionadasIniciais.filter((id) => porId.has(id)))
  );

  const ehBncc = fonte === FONTE_BNCC;
  const linhasCurriculo = useMemo(
    () =>
      habilidades.filter((h) =>
        fonte === FONTE_BNCC ? h.fonte === FONTE_BNCC : h.fonte === FONTE_CATARINENSE && h.objeto_conhecimento
      ),
    [habilidades, fonte]
  );

  const anosDisponiveis = useMemo(() => {
    const conjunto = new Set<number>();
    for (const h of linhasCurriculo) {
      for (const a of anosDoRotulo(h.ano_serie)) conjunto.add(a);
    }
    return Array.from(conjunto).sort((a, b) => a - b);
  }, [linhasCurriculo]);

  const [anoManual, setAnoManual] = useState<number | null>(() => {
    for (const id of selecionadasIniciais) {
      const h = porId.get(id);
      const anos = h ? anosDoRotulo(h.ano_serie) : [];
      if (anos.length > 0) return anos[0];
    }
    return null;
  });
  // O ano escolhido à mão vale mais que a sugestão do seletor de turma.
  const [anoEscolhido, setAnoEscolhido] = useState(false);
  const anoPreferido = anoEscolhido ? anoManual : anoSugerido ?? anoManual;
  const ano =
    anoPreferido !== null && anosDisponiveis.includes(anoPreferido)
      ? anoPreferido
      : anosDisponiveis[0] ?? null;
  function setAno(a: number) {
    setAnoManual(a);
    setAnoEscolhido(true);
  }

  const [painelObjetos, setPainelObjetos] = useState(false);
  const [painelHabilidades, setPainelHabilidades] = useState(false);
  const [objetoAtivoObj, setObjetoAtivoObj] = useState<string | null>(null);
  const [objetoAtivoHab, setObjetoAtivoHab] = useState<string | null>(null);
  const [buscaObj, setBuscaObj] = useState("");
  const [buscaHab, setBuscaHab] = useState("");

  // Habilidades do ano escolhido, agrupadas por objeto de conhecimento.
  const objetos = useMemo(() => {
    if (ano === null) return [];
    const mapa = new Map<string, HabilidadeCurricular[]>();
    for (const h of linhasCurriculo) {
      if (!anosDoRotulo(h.ano_serie).includes(ano)) continue;
      // Catarinense: um objeto por linha. BNCC: a linha pode trazer vários objetos; a
      // habilidade aparece em cada um deles.
      const nomes = ehBncc
        ? (h.objeto_conhecimento ? h.objeto_conhecimento.split(SEPARADOR_BNCC) : [GRUPO_BNCC])
        : [h.objeto_conhecimento as string];
      for (const nome of nomes) {
        const chave = `${h.disciplina_id ?? ""}||${nome.trim()}`;
        const lista = mapa.get(chave) ?? [];
        lista.push(h);
        mapa.set(chave, lista);
      }
    }
    const nomeDisc = (id: string) => nomesDisciplinas?.[id] ?? "";
    const todos: GrupoObjeto[] = Array.from(mapa.entries()).map(([chave, itens]) => {
      const objeto = chave.slice(chave.indexOf("||") + 2);
      const disciplina = nomeDisc(chave.slice(0, chave.indexOf("||")));
      const ordenados = ehBncc
        ? [...itens].sort((a, b) => (a.codigo ?? "").localeCompare(b.codigo ?? ""))
        : itens;
      return { chave, objeto, disciplina, itens: ordenados };
    });
    return (ehBncc ? todos : reunirObjetosRepetidos(todos))
      .sort(
        (a, b) =>
          a.disciplina.localeCompare(b.disciplina, "pt-BR", { sensitivity: "base" }) ||
          a.objeto.localeCompare(b.objeto, "pt-BR", { sensitivity: "base" })
      );
  }, [linhasCurriculo, ano, nomesDisciplinas, ehBncc]);

  // Plano já salvo: marca as caixinhas dos objetos e conteúdos que já estão escritos no campo.
  const { textoPronto, jaDecidiu, semear } = caixas;
  useEffect(() => {
    if (ehBncc || objetos.length === 0 || !textoPronto || jaDecidiu()) return;
    const candidatos: ItemCaixinha[] = [];
    for (const o of objetos) {
      candidatos.push({ chave: chaveObjeto(o.chave), linha: nomeDoObjeto(o.objeto) });
      for (const c of semDuplicatas(o.itens.flatMap((h) => itensDeConteudo(h.conteudos)))) {
        candidatos.push({ chave: chaveConteudo(o.chave, c), linha: c, pai: chaveObjeto(o.chave) });
      }
    }
    semear(candidatos);
  }, [objetos, ehBncc, textoPronto]); // eslint-disable-line react-hooks/exhaustive-deps

  function filtrar(busca: string) {
    const termo = busca.trim().toLowerCase();
    if (!termo) return objetos;
    return objetos.filter(({ objeto, disciplina, itens }) => {
      const base = `${disciplina} ${objeto}`;
      // Na BNCC a busca também olha o código e o texto das habilidades.
      const texto = ehBncc ? `${base} ${itens.map((h) => `${h.codigo ?? ""} ${h.descricao}`).join(" ")}` : base;
      return texto.toLowerCase().includes(termo);
    });
  }
  const objetosFiltradosObj = useMemo(() => filtrar(buscaObj), [objetos, buscaObj, ehBncc]); // eslint-disable-line react-hooks/exhaustive-deps
  const objetosFiltradosHab = useMemo(() => filtrar(buscaHab), [objetos, buscaHab, ehBncc]); // eslint-disable-line react-hooks/exhaustive-deps

  function alternar(id: string) {
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function trocarFonte(valor: string) {
    setFonte(valor);
    setObjetoAtivoObj(null);
    setObjetoAtivoHab(null);
  }

  const selecionadasLista = Array.from(selecionadas)
    .map((id) => porId.get(id))
    .filter((h): h is HabilidadeCurricular => Boolean(h));

  const vazioLista = habilidades.length === 0;

  const filtros = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor={idFonte} className="field-label">
          Currículo de referência
        </label>
        <select id={idFonte} value={fonte} onChange={(e) => trocarFonte(e.target.value)} className="input-field">
          <option value={FONTE_CATARINENSE}>Currículo Catarinense</option>
          <option value={FONTE_BNCC}>BNCC</option>
        </select>
      </div>
      <div>
        <label htmlFor={idAno} className="field-label">
          Ano
        </label>
        <select
          id={idAno}
          value={ano ?? ""}
          onChange={(e) => {
            setAno(Number(e.target.value));
            setObjetoAtivoObj(null);
            setObjetoAtivoHab(null);
          }}
          className="input-field"
          disabled={anosDisponiveis.length === 0}
        >
          {anosDisponiveis.map((a) => (
            <option key={a} value={a}>
              {a}º ano
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const semObjetos = (
    <p className="rounded-xl border border-dashed border-primary-200 bg-white px-3 py-4 text-sm text-slate-500">
      {ehBncc
        ? "Ainda não há habilidades da BNCC cadastradas para esta disciplina neste ano."
        : "Ainda não há objetos de conhecimento cadastrados para esta disciplina neste ano."}
    </p>
  );

  return (
    <>
      {/* As habilidades marcadas seguem para o formulário por estes campos ocultos. */}
      {selecionadasLista.map((h) => (
        <input key={h.id} type="hidden" name="habilidade_ids" value={h.id} />
      ))}
      <input type="hidden" name="fonte_curriculo" value={fonte} />

      {/* ───────── Etapa: objetos de conhecimento e conteúdos ───────── */}
      <SecaoPlano
        id={idObjetos}
        numero={numeroObjetos}
        titulo="Objetos de conhecimento e conteúdos"
        descricao="Marque as caixinhas das sugestões do currículo ou escreva livremente no campo abaixo."
      >
        {vazioLista ? (
          <p className="rounded-xl border border-dashed border-primary-200 bg-white px-3 py-4 text-sm text-slate-500">
            {vazio}
          </p>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              aria-expanded={painelObjetos}
              onClick={() => setPainelObjetos((a) => !a)}
              className="btn-verde w-full sm:w-auto"
            >
              <span aria-hidden="true">{painelObjetos ? "▲" : "＋"}</span>
              {painelObjetos
                ? "Fechar sugestões de objetos e conteúdos"
                : "Clique aqui para escolher objetos e conteúdos sugeridos"}
            </button>

            {painelObjetos && (
              <div className="space-y-3 rounded-xl border border-primary-200 bg-white p-4 shadow-sm">
                {filtros}
                <p
                  role="status"
                  aria-live="polite"
                  className={`min-h-[2.25rem] rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    aviso ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "text-transparent"
                  }`}
                >
                  {aviso ? `✓ ${aviso}` : "."}
                </p>
                {objetos.length === 0 ? (
                  semObjetos
                ) : (
                  <div className="overflow-hidden rounded-xl border border-primary-200">
                    <div className="border-b border-primary-100 bg-primary-50/50 px-3 py-2">
                      <p className="text-sm font-bold text-slate-800">
                        Objetos de conhecimento <span className="font-normal text-slate-400">(ordem alfabética)</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {ehBncc
                          ? "Marque a caixinha do objeto para colocá-lo no plano (desmarque para tirar). A BNCC não traz lista de conteúdos: escreva-os no campo abaixo."
                          : "Marque a caixinha do objeto para colocá-lo no plano com todos os conteúdos sugeridos. Abra “Conteúdos” para marcar só alguns. Desmarcar tira do plano."}
                      </p>
                      <label htmlFor={idBuscaObj} className="sr-only">
                        Buscar objeto de conhecimento
                      </label>
                      <input
                        id={idBuscaObj}
                        type="text"
                        value={buscaObj}
                        onChange={(e) => setBuscaObj(e.target.value)}
                        placeholder={ehBncc ? "Buscar por código ou texto..." : "Buscar objeto de conhecimento..."}
                        className="mt-2 w-full rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                      />
                    </div>
                    <ul className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto">
                      {objetosFiltradosObj.length === 0 && (
                        <li className="px-3 py-3 text-sm text-slate-400">Nenhum objeto encontrado para essa busca.</li>
                      )}
                      {objetosFiltradosObj.map(({ chave, objeto, disciplina, itens }) => {
                        const aberto = objetoAtivoObj === chave;
                        const conteudos = ehBncc ? [] : semDuplicatas(itens.flatMap((h) => itensDeConteudo(h.conteudos)));
                        const linhaObjeto = ehBncc ? objeto : nomeDoObjeto(objeto);
                        const itemObjeto: ItemCaixinha = { chave: chaveObjeto(chave), linha: linhaObjeto };
                        const itensConteudo: ItemCaixinha[] = conteudos.map((c) => ({ chave: chaveConteudo(chave, c), linha: c }));
                        const objetoMarcado = caixas.marcado(itemObjeto.chave);
                        const conteudosMarcados = itensConteudo.filter((i) => caixas.marcado(i.chave)).length;
                        const parcial = conteudosMarcados > 0 && (!objetoMarcado || conteudosMarcados < conteudos.length);
                        const semCaixa = objeto === GRUPO_BNCC;

                        function alternarObjeto() {
                          if (objetoMarcado || conteudosMarcados > 0) {
                            caixas.desmarcar([itemObjeto, ...itensConteudo]);
                            mostrar("Retirado do plano.");
                          } else {
                            caixas.marcar([itemObjeto, ...itensConteudo]);
                            mostrar(
                              conteudos.length > 0
                                ? "Objeto e conteúdos adicionados ao plano, no campo logo abaixo."
                                : "Objeto adicionado ao plano, no campo logo abaixo."
                            );
                          }
                        }
                        function alternarConteudo(i: ItemCaixinha) {
                          if (caixas.marcado(i.chave)) {
                            caixas.desmarcar([i]);
                            mostrar("Conteúdo retirado do plano.");
                          } else {
                            caixas.marcar(objetoMarcado ? [i] : [itemObjeto, i]);
                            mostrar("Conteúdo adicionado ao plano, no campo logo abaixo.");
                          }
                        }

                        return (
                          <li key={chave}>
                            <div className={`flex items-start gap-2 px-3 py-2.5 text-sm ${aberto ? "bg-primary-50/70" : ""}`}>
                              {semCaixa ? (
                                <span className="w-4 shrink-0" aria-hidden="true" />
                              ) : (
                                <input
                                  id={`${idBuscaObj}-obj-${chave}`}
                                  type="checkbox"
                                  checked={objetoMarcado}
                                  ref={(el) => {
                                    if (el) el.indeterminate = parcial;
                                  }}
                                  onChange={alternarObjeto}
                                  aria-label={`Colocar no plano: ${linhaObjeto}`}
                                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                              )}
                              <label htmlFor={`${idBuscaObj}-obj-${chave}`} className="min-w-0 flex-1 cursor-pointer text-slate-800">
                                {disciplina && <strong>{disciplina} — </strong>}
                                {objeto}
                              </label>
                              {conteudos.length > 0 && (
                                <button
                                  type="button"
                                  aria-expanded={aberto}
                                  onClick={() => setObjetoAtivoObj(aberto ? null : chave)}
                                  className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                                >
                                  {conteudosMarcados > 0 ? `${conteudosMarcados}/${conteudos.length} · ` : ""}
                                  Conteúdos ({conteudos.length}) {aberto ? "▲" : "▼"}
                                </button>
                              )}
                            </div>
                            {aberto && conteudos.length > 0 && (
                              <div className="space-y-0.5 bg-primary-50/40 px-3 pb-3 pt-1 pl-9">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Conteúdos sugeridos</p>
                                {itensConteudo.map((ic) => (
                                  <label
                                    key={ic.chave}
                                    className="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1 text-sm text-slate-700 hover:bg-white"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={caixas.marcado(ic.chave)}
                                      onChange={() => alternarConteudo(ic)}
                                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span>{ic.linha}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            {aberto && conteudos.length === 0 && !ehBncc && (
                              <p className="bg-primary-50/40 px-3 pb-3 pl-9 text-sm text-slate-500">Este objeto não traz conteúdos sugeridos no currículo.</p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {editorConteudos}
      </SecaoPlano>

      {/* ───────── Etapa: selecionar habilidades ───────── */}
      <SecaoPlano
        id={idHabilidades}
        numero={numeroHabilidades}
        titulo="Selecionar habilidades"
        descricao="Escolha, a partir dos objetos de conhecimento, as habilidades que serão trabalhadas."
      >
        {vazioLista ? (
          <p className="rounded-xl border border-dashed border-primary-200 bg-white px-3 py-4 text-sm text-slate-500">
            {vazio}
          </p>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              aria-expanded={painelHabilidades}
              onClick={() => setPainelHabilidades((a) => !a)}
              className="btn-verde w-full sm:w-auto"
            >
              <span aria-hidden="true">{painelHabilidades ? "▲" : "＋"}</span>
              {painelHabilidades ? "Fechar lista de habilidades" : "Clique para adicionar habilidades"}
            </button>

            {painelHabilidades && (
              <div className="space-y-3 rounded-xl border border-primary-200 bg-white p-4 shadow-sm">
                {filtros}
                {objetos.length === 0 ? (
                  semObjetos
                ) : (
                  <div className="overflow-hidden rounded-xl border border-primary-200">
                    <div className="border-b border-primary-100 bg-primary-50/50 px-3 py-2">
                      <p className="text-xs text-slate-500">
                        Clique no botão de um objeto para ver e marcar as habilidades. Ele fica verde quando há habilidades marcadas.
                      </p>
                      <label htmlFor={idBuscaHab} className="sr-only">
                        Buscar objeto ou habilidade
                      </label>
                      <input
                        id={idBuscaHab}
                        type="text"
                        value={buscaHab}
                        onChange={(e) => setBuscaHab(e.target.value)}
                        placeholder={ehBncc ? "Buscar por código ou texto..." : "Buscar objeto de conhecimento..."}
                        className="mt-2 w-full rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                      />
                    </div>
                    <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
                      {objetosFiltradosHab.length === 0 && (
                        <li className="px-3 py-3 text-sm text-slate-400">Nenhum objeto encontrado para essa busca.</li>
                      )}
                      {objetosFiltradosHab.map(({ chave, objeto, disciplina, itens }) => {
                        const aberto = objetoAtivoHab === chave;
                        const marcadas = itens.filter((h) => selecionadas.has(h.id)).length;
                        return (
                          <li key={chave}>
                            <div
                              className={`flex flex-wrap items-start justify-between gap-3 px-3 py-2.5 text-sm ${
                                aberto ? "bg-primary-50/70" : ""
                              }`}
                            >
                              <span className="min-w-0 flex-1 text-slate-800">
                                {disciplina && <strong>{disciplina} — </strong>}
                                {objeto}
                              </span>
                              <button
                                type="button"
                                aria-expanded={aberto}
                                onClick={() => setObjetoAtivoHab(aberto ? null : chave)}
                                className={`${marcadas > 0 ? "btn-verde-suave" : "btn-azul-suave"} shrink-0 !px-3 !py-1.5 !text-xs`}
                              >
                                {marcadas > 0 ? `${marcadas} marcada(s) · ` : ""}
                                {aberto ? "Fechar" : "Clique para adicionar habilidades"} ({itens.length}){" "}
                                {aberto ? "▲" : "▼"}
                              </button>
                            </div>
                            {aberto && (
                              <div className="bg-primary-50/40 px-3 pb-3 pt-1">
                                {itens.map((h) => (
                                  <label
                                    key={h.id}
                                    className="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1.5 text-sm hover:bg-white"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selecionadas.has(h.id)}
                                      onChange={() => alternar(h.id)}
                                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-slate-600">
                                      {h.codigo && <span className="font-medium text-slate-900">({h.codigo}) </span>}
                                      {h.descricao}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-primary-100 bg-white">
          <p className="border-b border-primary-100 px-3 py-2 text-sm font-bold text-slate-800">
            Habilidades no plano <span className="font-normal text-slate-400">({selecionadasLista.length})</span>
          </p>
          {selecionadasLista.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-400">
              Nenhuma habilidade escolhida ainda. Use o botão verde acima.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {selecionadasLista.map((h) => (
                <li key={h.id} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                  <span className="text-slate-600">
                    {h.codigo && <span className="font-medium text-slate-900">({h.codigo}) </span>}
                    {h.descricao}
                  </span>
                  <button
                    type="button"
                    onClick={() => alternar(h.id)}
                    className="btn-text-danger shrink-0"
                    aria-label="Remover habilidade do plano"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SecaoPlano>
    </>
  );
}
