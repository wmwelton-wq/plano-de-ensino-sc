"use client";

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { anoCombina, chaveTexto, ROTULO_FONTE, type ItemLista } from "@/lib/plano-anual";
import { opcaoParaItem, type OpcaoLista } from "@/lib/dados-anuais";
import { Icone } from "@/components/icones";

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
  /**
   * Itens que já estão marcados em OUTRO trimestre: chave = texto normalizado (chaveTexto), valor = onde ("2º trimestre").
   * Só avisa — nunca bloqueia.
   */
  repetidos?: Record<string, string[]>;
}

const chip = (ativo: boolean) =>
  `rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
    ativo
      ? "border-primary-700 bg-primary-700 text-white"
      : "border-slate-300 bg-white text-slate-700 hover:border-primary-400 hover:bg-primary-50"
  }`;

/** Quantas opções aparecem de cada vez (o resto abre em "Mostrar mais"): deixa cliques e digitação rápidos. */
const LOTE_VISIVEL = 60;

interface LinhaOpcaoProps {
  o: OpcaoLista;
  marcada: boolean;
  mostrarFonte: boolean;
  /** Onde mais este item já está (outros trimestres). */
  tambemEm?: string;
  onAlternar: (o: OpcaoLista) => void;
}

/** Uma opção da lista. Só é redesenhada quando ela mesma muda (marcar uma não refaz as outras). */
const LinhaOpcao = memo(function LinhaOpcao({ o, marcada, mostrarFonte, tambemEm, onAlternar }: LinhaOpcaoProps) {
  return (
    <label className={`flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 ${marcada ? "bg-primary-50/70" : ""}`}>
      <input
        type="checkbox"
        checked={marcada}
        onChange={() => onAlternar(o)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
      />
      <span className="min-w-0">
        {o.codigo && <span className="font-semibold text-slate-900">({o.codigo}) </span>}
        <span className="text-slate-700">{o.texto}</span>
        {tambemEm && (
          <span className="ml-1.5 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
            já está no {tambemEm}
          </span>
        )}
        {(o.grupo || o.anos.length > 0 || (mostrarFonte && o.fonte)) && (
          <span className="ml-1 text-[11px] text-slate-400">
            {[mostrarFonte ? ROTULO_FONTE[o.fonte ?? ""] : null, o.grupo, o.anos.length > 0 && o.anos.length <= 3 ? o.anos.join(", ") : null]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}
      </span>
    </label>
  );
});

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
  repetidos,
}: SeletorItensProps) {
  const idBusca = useId();
  const idManual = useId();
  const idCodigo = useId();
  const [busca, setBusca] = useState("");
  // null = sem filtro (mostra tudo). Clicar de novo no botão marcado tira o filtro.
  const [fonte, setFonte] = useState<string | null>(null);
  const [grupo, setGrupo] = useState<string | null>(null);
  // O botão de ano/série que corresponde à turma já começa marcado.
  const anoPadrao = useMemo(() => {
    if (anoDaTurma == null) return null;
    const candidatos = anos.filter((a) => anoCombina(a, anoDaTurma));
    return candidatos.find((a) => (a.match(/\d{1,2}/g) ?? []).length === 1) ?? null;
  }, [anos, anoDaTurma]);
  const [ano, setAno] = useState<string | null>(anoPadrao);
  // Quando o professor escolhe/troca a série da turma, o filtro acompanha.
  useEffect(() => {
    setAno(anoPadrao);
  }, [anoPadrao]);
  const [soMarcadas, setSoMarcadas] = useState(false);
  const [limite, setLimite] = useState(LOTE_VISIVEL);
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
      if (filtrarPorFonte && fonte !== null && o.fonte !== fonte) return false;
      if (filtrarPorGrupo && grupo !== null && o.grupo !== grupo) return false;
      if (anos.length > 0 && ano !== null && o.anos.length > 0) {
        const n = Number((ano.match(/\d{1,2}/) ?? [])[0]);
        const combina = Number.isFinite(n) ? o.anos.some((a) => anoCombina(a, n)) : o.anos.includes(ano);
        if (!combina) return false;
      }
      if (termo && !chaveTexto(`${o.codigo ?? ""} ${o.texto}`).includes(termo)) return false;
      return true;
    });
  }, [opcoes, busca, fonte, grupo, ano, anos.length, soMarcadas, marcadas, filtrarPorFonte, filtrarPorGrupo]);

  useEffect(() => {
    setLimite(LOTE_VISIVEL);
  }, [busca, fonte, grupo, ano, soMarcadas, opcoes.length]);

  const foraDaLista = useMemo(() => valor.filter((v) => !idsOpcoes.has(v.id)), [valor, idsOpcoes]);

  const [alerta, setAlerta] = useState<string | null>(null);
  const tempoAlerta = useRef<ReturnType<typeof setTimeout> | null>(null);
  function avisarRepeticao(texto: string, onde: string[]) {
    setAlerta(`“${texto.length > 90 ? `${texto.slice(0, 90)}…` : texto}” já foi adicionado no ${onde.join(" e no ")}. Pode manter assim — é só um aviso.`);
    if (tempoAlerta.current) clearTimeout(tempoAlerta.current);
    tempoAlerta.current = setTimeout(() => setAlerta(null), 9000);
  }
  useEffect(() => () => {
    if (tempoAlerta.current) clearTimeout(tempoAlerta.current);
  }, []);

  function alternar(o: OpcaoLista) {
    if (marcadas.has(o.id)) {
      onChange(valor.filter((v) => v.id !== o.id));
      return;
    }
    const onde = repetidos?.[chaveTexto(o.texto)];
    if (onde && onde.length > 0) avisarRepeticao(o.texto, onde);
    onChange([...valor, opcaoParaItem(o)]);
  }
  // Versão estável (sempre chama a mais recente), para as linhas não serem redesenhadas à toa.
  const alternarAtual = useRef(alternar);
  alternarAtual.current = alternar;
  const alternarEstavel = useCallback((o: OpcaoLista) => alternarAtual.current(o), []);

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
    const repetida = linhas.find((l) => (repetidos?.[chaveTexto(l)] ?? []).length > 0);
    if (repetida) avisarRepeticao(repetida, repetidos?.[chaveTexto(repetida)] ?? []);
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

  /** Itens marcados neste trimestre que também estão em outro (só para avisar). */
  const marcadosRepetidos = useMemo(
    () => (repetidos ? valor.filter((v) => (repetidos[chaveTexto(v.texto)] ?? []).length > 0) : []),
    [valor, repetidos]
  );

  const temFiltros =
    (filtrarPorFonte && fontes.length > 1) || (filtrarPorGrupo && grupos.length > 1) || (anos.length > 0 && opcoes.some((o) => o.anos.length > 0));

  return (
    <div className="space-y-3">
      {ajuda && <p className="text-xs text-slate-500">{ajuda}</p>}

      {alerta && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <Icone nome="alerta" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p className="min-w-0 flex-1">{alerta}</p>
          <button type="button" onClick={() => setAlerta(null)} aria-label="Fechar aviso" className="shrink-0 rounded p-0.5 text-amber-700 hover:bg-amber-100">
            <Icone nome="fechar" className="h-4 w-4" />
          </button>
        </div>
      )}

      {opcoes.length === 0 ? (
        vazio ? (
          <p className="rounded-xl border border-dashed border-primary-200 bg-white px-3 py-4 text-sm text-slate-500">{vazio}</p>
        ) : null
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
          <div className="space-y-2 border-b border-slate-200 bg-slate-50 p-2.5">
            <label htmlFor={idBusca} className="sr-only">
              Buscar por palavra-chave
            </label>
            <input
              id={idBusca}
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por palavra-chave ou código..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />

            {temFiltros && (
              <div className="space-y-2.5">
                {filtrarPorFonte && fontes.length > 1 && (
                  <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por origem">
                    <span className="text-sm font-bold text-slate-700">Origem:</span>
                    {fontes.map((f) => (
                      <button key={f} type="button" className={chip(fonte === f)} onClick={() => setFonte(fonte === f ? null : f)}>
                        {ROTULO_FONTE[f] ?? f}
                      </button>
                    ))}
                  </div>
                )}
                {filtrarPorGrupo && grupos.length > 1 && (
                  <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por tipo">
                    <span className="text-sm font-bold text-slate-700">Tipo:</span>
                    {grupos.map((g) => (
                      <button key={g} type="button" className={chip(grupo === g)} onClick={() => setGrupo(grupo === g ? null : g)}>
                        {g}
                      </button>
                    ))}
                  </div>
                )}
                {anos.length > 0 && opcoes.some((o) => o.anos.length > 0) && (
                  <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por ano">
                    <span className="text-sm font-bold text-slate-700">Ano/série:</span>
                    {anos.map((a) => (
                      <button key={a} type="button" className={chip(ano === a)} onClick={() => setAno(ano === a ? null : a)}>
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={marcarVisiveis} className="btn-azul-suave !px-3 !py-1.5 !text-sm">
                Marcar as listadas ({visiveis.length})
              </button>
              <button type="button" onClick={desmarcarVisiveis} className="btn-azul-suave !px-3 !py-1.5 !text-sm">
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
              <p className="px-2 py-3 text-sm text-slate-400">Nada encontrado com esses filtros. Clique de novo num botão marcado para tirar o filtro, ou limpe a busca.</p>
            )}
            {visiveis.slice(0, limite).map((o) => (
              <LinhaOpcao
                key={o.id}
                o={o}
                marcada={marcadas.has(o.id)}
                mostrarFonte={filtrarPorFonte}
                tambemEm={repetidos?.[chaveTexto(o.texto)]?.join(" e no ")}
                onAlternar={alternarEstavel}
              />
            ))}
            {visiveis.length > limite && (
              <button
                type="button"
                onClick={() => setLimite((n) => n + LOTE_VISIVEL * 2)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Mostrar mais ({visiveis.length - limite} restantes) — ou use a busca acima
              </button>
            )}
          </div>
        </div>
      )}

      {foraDaLista.length > 0 && (
        <div className="rounded-xl border border-slate-300 bg-white p-2.5">
          <p className="mb-1.5 text-xs font-semibold text-slate-700">Adicionados por você ({foraDaLista.length})</p>
          <ul className="space-y-1">
            {foraDaLista.map((v) => (
              <li key={v.id} className="flex items-start gap-2 rounded-lg bg-slate-50 px-2 py-1.5 text-sm">
                <span className="min-w-0 flex-1 text-slate-800">
                  {v.codigo && <span className="font-semibold">({v.codigo}) </span>}
                  {v.texto}
                </span>
                <button
                  type="button"
                  onClick={() => remover(v.id)}
                  aria-label={`Remover: ${v.texto.slice(0, 40)}`}
                  className="shrink-0 rounded p-1 text-red-600 hover:bg-red-50"
                >
                  <Icone nome="fechar" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!semManual && (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3">
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
          <button type="button" onClick={adicionarManual} disabled={!textoManual.trim()} className="btn-verde !py-2.5">
            + Adicionar
          </button>
        </div>
      </div>
      )}

      <p className="text-xs font-semibold text-slate-600">{valor.length} item(ns) no plano</p>
      {marcadosRepetidos.length > 0 && (
        <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
          <Icone nome="alerta" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
          <span>
            {marcadosRepetidos.length === 1 ? "1 item deste trimestre também está" : `${marcadosRepetidos.length} itens deste trimestre também estão`} em outro trimestre
            (aviso apenas): {marcadosRepetidos.slice(0, 3).map((v) => `“${v.texto.length > 50 ? `${v.texto.slice(0, 50)}…` : v.texto}”`).join(", ")}
            {marcadosRepetidos.length > 3 ? " e outros" : ""}.
          </span>
        </p>
      )}
    </div>
  );
}
