"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { anoCombina, chaveTexto, ROTULO_FONTE, type ItemLista } from "@/lib/plano-anual";
import { opcaoParaItem, type OpcaoLista } from "@/lib/dados-anuais";

interface SeletorItensProps {
  /** Opções oficiais (com caixinha de marcar). */
  opcoes: OpcaoLista[];
  /** O que já está marcado/digitado. */
  valor: ItemLista[];
  onChange: (novo: ItemLista[]) => void;
  /** Anos/séries existentes nos dados (para os filtros por ano). */
  anos?: string[];
  /** Número do ano da turma (ex.: 7), para o filtro "do ano da turma". */
  anoDaTurma?: number | null;
  /** Mostra filtro pela origem (BNCC / Currículo Catarinense / Educação Digital). */
  filtrarPorFonte?: boolean;
  /** Mostra filtro por grupo (ex.: "Objeto de conhecimento" / "Conteúdo"). */
  filtrarPorGrupo?: boolean;
  /** Texto de apoio acima da lista. */
  ajuda?: string;
  /** Mensagem quando não há opções oficiais. */
  vazio: string;
  rotuloManual: string;
  placeholderManual: string;
  /** Permite digitar o código junto (habilidades). */
  manualComCodigo?: boolean;
  /** Altura máxima da lista, em rem. */
  alturaRem?: number;
  /** Esconde o quadro de digitação manual (quando outro quadro cuida disso). */
  semManual?: boolean;
}

const chip = (ativo: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-semibold transition ${
    ativo
      ? "border-primary-600 bg-primary-600 text-white shadow-sm"
      : "border-primary-200 bg-white text-primary-700 hover:bg-primary-50"
  }`;

/**
 * Lista com caixinhas de marcar + busca + filtros + um quadro para o professor
 * acrescentar itens à mão. Usado na ementa, nas competências, nas habilidades,
 * nos objetos de conhecimento e nas unidades temáticas do plano anual.
 */
export default function SeletorItens({
  opcoes,
  valor,
  onChange,
  anos = [],
  anoDaTurma = null,
  filtrarPorFonte = false,
  filtrarPorGrupo = false,
  ajuda,
  vazio,
  rotuloManual,
  placeholderManual,
  manualComCodigo = false,
  alturaRem = 18,
  semManual = false,
}: SeletorItensProps) {
  const idBusca = useId();
  const idManual = useId();
  const idCodigo = useId();
  const [busca, setBusca] = useState("");
  const [fonte, setFonte] = useState("todas");
  const [grupo, setGrupo] = useState("todos");
  const [ano, setAno] = useState(anoDaTurma ? "turma" : "todos");
  // Quando o professor escolhe/troca a série da turma, o filtro acompanha.
  useEffect(() => {
    setAno(anoDaTurma ? "turma" : "todos");
  }, [anoDaTurma]);
  const [soMarcadas, setSoMarcadas] = useState(false);
  const [textoManual, setTextoManual] = useState("");
  const [codigoManual, setCodigoManual] = useState("");

  const marcadas = useMemo(() => new Set(valor.map((v) => v.id)), [valor]);
  const idsOpcoes = useMemo(() => new Set(opcoes.map((o) => o.id)), [opcoes]);

  const fontes = useMemo(() => Array.from(new Set(opcoes.map((o) => o.fonte).filter((f): f is string => !!f))), [opcoes]);
  const grupos = useMemo(() => Array.from(new Set(opcoes.map((o) => o.grupo).filter((g): g is string => !!g))), [opcoes]);

  const visiveis = useMemo(() => {
    const termo = chaveTexto(busca);
    return opcoes.filter((o) => {
      if (soMarcadas && !marcadas.has(o.id)) return false;
      if (filtrarPorFonte && fonte !== "todas" && o.fonte !== fonte) return false;
      if (filtrarPorGrupo && grupo !== "todos" && o.grupo !== grupo) return false;
      if (anos.length > 0 && ano !== "todos" && o.anos.length > 0) {
        if (ano === "turma") {
          if (anoDaTurma != null && !o.anos.some((a) => anoCombina(a, anoDaTurma))) return false;
        } else if (!o.anos.includes(ano)) {
          return false;
        }
      }
      if (termo && !chaveTexto(`${o.codigo ?? ""} ${o.texto}`).includes(termo)) return false;
      return true;
    });
  }, [opcoes, busca, fonte, grupo, ano, anos.length, anoDaTurma, soMarcadas, marcadas, filtrarPorFonte, filtrarPorGrupo]);

  const foraDaLista = useMemo(() => valor.filter((v) => !idsOpcoes.has(v.id)), [valor, idsOpcoes]);

  function alternar(o: OpcaoLista) {
    if (marcadas.has(o.id)) onChange(valor.filter((v) => v.id !== o.id));
    else onChange([...valor, opcaoParaItem(o)]);
  }

  function marcarVisiveis() {
    const novos = visiveis.filter((o) => !marcadas.has(o.id)).map(opcaoParaItem);
    if (novos.length > 0) onChange([...valor, ...novos]);
  }

  function desmarcarVisiveis() {
    const ids = new Set(visiveis.map((o) => o.id));
    onChange(valor.filter((v) => !ids.has(v.id)));
  }

  function adicionarManual() {
    const linhas = textoManual
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (linhas.length === 0) return;
    const base = Date.now();
    const codigo = codigoManual.trim();
    const novos: ItemLista[] = linhas.map((texto, i) => ({
      id: `manual:${base}-${i}`,
      texto,
      manual: true,
      fonte: "manual",
      ...(codigo && linhas.length === 1 ? { codigo } : {}),
    }));
    onChange([...valor, ...novos]);
    setTextoManual("");
    setCodigoManual("");
  }

  function remover(id: string) {
    onChange(valor.filter((v) => v.id !== id));
  }

  const temFiltros =
    (filtrarPorFonte && fontes.length > 1) || (filtrarPorGrupo && grupos.length > 1) || (anos.length > 0 && opcoes.some((o) => o.anos.length > 0));

  return (
    <div className="space-y-3">
      {ajuda && <p className="text-xs text-slate-500">{ajuda}</p>}

      {opcoes.length === 0 ? (
        vazio ? (
          <p className="rounded-xl border border-dashed border-primary-200 bg-white px-3 py-4 text-sm text-slate-500">{vazio}</p>
        ) : null
      ) : (
        <div className="overflow-hidden rounded-xl border border-primary-200 bg-white shadow-sm">
          <div className="space-y-2 border-b border-primary-100 bg-primary-50/40 p-2.5">
            <label htmlFor={idBusca} className="sr-only">
              Buscar por palavra-chave
            </label>
            <input
              id={idBusca}
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por palavra-chave ou código..."
              className="w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />

            {temFiltros && (
              <div className="space-y-1.5">
                {filtrarPorFonte && fontes.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por origem">
                    <span className="text-xs font-semibold text-slate-500">Origem:</span>
                    <button type="button" className={chip(fonte === "todas")} onClick={() => setFonte("todas")}>
                      Todas
                    </button>
                    {fontes.map((f) => (
                      <button key={f} type="button" className={chip(fonte === f)} onClick={() => setFonte(f)}>
                        {ROTULO_FONTE[f] ?? f}
                      </button>
                    ))}
                  </div>
                )}
                {filtrarPorGrupo && grupos.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por tipo">
                    <span className="text-xs font-semibold text-slate-500">Tipo:</span>
                    <button type="button" className={chip(grupo === "todos")} onClick={() => setGrupo("todos")}>
                      Todos
                    </button>
                    {grupos.map((g) => (
                      <button key={g} type="button" className={chip(grupo === g)} onClick={() => setGrupo(g)}>
                        {g}
                      </button>
                    ))}
                  </div>
                )}
                {anos.length > 0 && opcoes.some((o) => o.anos.length > 0) && (
                  <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por ano">
                    <span className="text-xs font-semibold text-slate-500">Ano/série:</span>
                    {anoDaTurma != null && (
                      <button type="button" className={chip(ano === "turma")} onClick={() => setAno("turma")}>
                        Da minha turma ({anoDaTurma}º)
                      </button>
                    )}
                    <button type="button" className={chip(ano === "todos")} onClick={() => setAno("todos")}>
                      Todos os anos
                    </button>
                    {anos.map((a) => (
                      <button key={a} type="button" className={chip(ano === a)} onClick={() => setAno(a)}>
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={marcarVisiveis} className="btn-azul-suave !px-3 !py-1.5 !text-xs">
                Marcar todas as listadas ({visiveis.length})
              </button>
              <button type="button" onClick={desmarcarVisiveis} className="btn-azul-suave !px-3 !py-1.5 !text-xs">
                Desmarcar as listadas
              </button>
              <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={soMarcadas}
                  onChange={(e) => setSoMarcadas(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                Mostrar só as marcadas
              </label>
            </div>
          </div>

          <div className="overflow-y-auto p-2" style={{ maxHeight: `${alturaRem}rem` }}>
            {visiveis.length === 0 && (
              <p className="px-2 py-3 text-sm text-slate-400">Nada encontrado com esses filtros. Use &quot;Todos os anos&quot; ou limpe a busca.</p>
            )}
            {visiveis.map((o) => (
              <label
                key={o.id}
                className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-primary-50/60"
              >
                <input
                  type="checkbox"
                  checked={marcadas.has(o.id)}
                  onChange={() => alternar(o)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="min-w-0">
                  {o.codigo && <span className="font-semibold text-slate-900">({o.codigo}) </span>}
                  <span className="text-slate-700">{o.texto}</span>
                  {(o.grupo || o.anos.length > 0 || (filtrarPorFonte && o.fonte)) && (
                    <span className="ml-1 text-[11px] text-slate-400">
                      {[filtrarPorFonte ? ROTULO_FONTE[o.fonte ?? ""] : null, o.grupo, o.anos.length > 0 && o.anos.length <= 3 ? o.anos.join(", ") : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {foraDaLista.length > 0 && (
        <div className="rounded-xl border border-primary-200 bg-white p-2.5 shadow-sm">
          <p className="mb-1.5 text-xs font-semibold text-primary-800">Adicionados por você ({foraDaLista.length})</p>
          <ul className="space-y-1">
            {foraDaLista.map((v) => (
              <li key={v.id} className="flex items-start gap-2 rounded-lg bg-primary-50/50 px-2 py-1.5 text-sm">
                <span className="min-w-0 flex-1 text-slate-800">
                  {v.codigo && <span className="font-semibold">({v.codigo}) </span>}
                  {v.texto}
                </span>
                <button
                  type="button"
                  onClick={() => remover(v.id)}
                  aria-label={`Remover: ${v.texto.slice(0, 40)}`}
                  className="shrink-0 rounded px-1.5 text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!semManual && (
      <div className="rounded-xl border border-dashed border-primary-300 bg-white p-3">
        <label htmlFor={idManual} className="text-sm font-semibold text-slate-800">
          {rotuloManual}
        </label>
        <p className="text-xs text-slate-500">Digite à vontade — um item por linha.</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
          {manualComCodigo && (
            <div className="sm:w-40">
              <label htmlFor={idCodigo} className="sr-only">
                Código (opcional)
              </label>
              <input
                id={idCodigo}
                type="text"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                placeholder="Código (opcional)"
                className="input-field !mt-0"
              />
            </div>
          )}
          <textarea
            id={idManual}
            value={textoManual}
            onChange={(e) => setTextoManual(e.target.value)}
            rows={2}
            placeholder={placeholderManual}
            className="input-field !mt-0 flex-1"
          />
          <button type="button" onClick={adicionarManual} disabled={!textoManual.trim()} className="btn-azul !py-2.5">
            + Adicionar
          </button>
        </div>
      </div>
      )}

      <p className="text-xs font-semibold text-primary-700">{valor.length} item(ns) no plano</p>
    </div>
  );
}
