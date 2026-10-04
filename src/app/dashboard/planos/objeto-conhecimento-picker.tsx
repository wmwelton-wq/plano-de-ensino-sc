"use client";

import { useId, useMemo, useState } from "react";
import type { HabilidadeCurricular } from "@/lib/database.types";

interface ObjetoConhecimentoPickerProps {
  titulo: string;
  descricaoAjuda?: string;
  /** Habilidades (de todas as fontes) da disciplina escolhida, exceto as de educação digital. */
  habilidades: HabilidadeCurricular[];
  selecionadasIniciais: string[];
  /** Chamado ao clicar em "Adicionar ao plano": recebe as linhas a acrescentar no campo de conteúdos. */
  onAdicionarConteudos: (linhas: string[]) => void;
  vazio: string;
}

const FONTE_CATARINENSE = "curriculo_catarinense";

/** "6º ano" -> [6]; "6º e 7º anos" -> [6, 7]; "6º ao 9º ano" -> [6, 7, 8, 9]. */
function anosDoRotulo(rotulo: string | null): number[] {
  if (!rotulo) return [];
  const numeros = Array.from(rotulo.matchAll(/(\d+)\s*º/g)).map((m) => Number(m[1]));
  if (numeros.length === 0) return [];
  if (numeros.length >= 2 && /\bao\b/i.test(rotulo)) {
    const anos: number[] = [];
    for (let a = numeros[0]; a <= numeros[numeros.length - 1]; a++) anos.push(a);
    return anos;
  }
  return numeros;
}

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

export default function ObjetoConhecimentoPicker({
  titulo,
  descricaoAjuda,
  habilidades,
  selecionadasIniciais,
  onAdicionarConteudos,
  vazio,
}: ObjetoConhecimentoPickerProps) {
  const idFonte = useId();
  const idAno = useId();
  const idBusca = useId();

  const [fonte, setFonte] = useState(FONTE_CATARINENSE);

  const porId = useMemo(() => new Map(habilidades.map((h) => [h.id, h])), [habilidades]);

  // Mantém só as seleções que pertencem a esta lista (assim não duplicamos as
  // habilidades de educação digital, que têm o seu próprio seletor).
  const [selecionadas, setSelecionadas] = useState<Set<string>>(
    () => new Set(selecionadasIniciais.filter((id) => porId.has(id)))
  );

  const linhasCatarinense = useMemo(
    () => habilidades.filter((h) => h.fonte === FONTE_CATARINENSE && h.objeto_conhecimento),
    [habilidades]
  );

  const anosDisponiveis = useMemo(() => {
    const conjunto = new Set<number>();
    for (const h of linhasCatarinense) {
      for (const a of anosDoRotulo(h.ano_serie)) conjunto.add(a);
    }
    return Array.from(conjunto).sort((a, b) => a - b);
  }, [linhasCatarinense]);

  const [ano, setAno] = useState<number | null>(() => {
    for (const id of selecionadasIniciais) {
      const h = porId.get(id);
      const anos = h ? anosDoRotulo(h.ano_serie) : [];
      if (anos.length > 0) return anos[0];
    }
    return anosDisponiveis[0] ?? null;
  });

  const [objetoAtivo, setObjetoAtivo] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  // Habilidades do ano escolhido, agrupadas por objeto de conhecimento.
  const objetos = useMemo(() => {
    if (ano === null) return [];
    const mapa = new Map<string, HabilidadeCurricular[]>();
    for (const h of linhasCatarinense) {
      if (!anosDoRotulo(h.ano_serie).includes(ano)) continue;
      const chave = h.objeto_conhecimento as string;
      const lista = mapa.get(chave) ?? [];
      lista.push(h);
      mapa.set(chave, lista);
    }
    return Array.from(mapa.entries())
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }))
      .map(([objeto, itens]) => ({ objeto, itens }));
  }, [linhasCatarinense, ano]);

  const objetosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return objetos;
    return objetos.filter(({ objeto }) => objeto.toLowerCase().includes(termo));
  }, [objetos, busca]);

  function alternar(id: string) {
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  if (habilidades.length === 0) {
    return (
      <div>
        <p className="field-label">{titulo}</p>
        <p className="mt-2 rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-400">
          {vazio}
        </p>
      </div>
    );
  }

  const selecionadasLista = Array.from(selecionadas)
    .map((id) => porId.get(id))
    .filter((h): h is HabilidadeCurricular => Boolean(h));

  return (
    <div>
      {/* As habilidades marcadas seguem para o formulário por estes campos ocultos. */}
      {Array.from(selecionadas).map((id) => (
        <input key={id} type="hidden" name="habilidade_ids" value={id} />
      ))}

      <p className="field-label">{titulo}</p>
      {descricaoAjuda && <p className="text-xs text-slate-400">{descricaoAjuda}</p>}

      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={idFonte} className="field-label">
            Currículo de referência
          </label>
          <select
            id={idFonte}
            value={fonte}
            onChange={(e) => setFonte(e.target.value)}
            className="input-field"
          >
            <option value={FONTE_CATARINENSE}>Currículo Catarinense</option>
            <option value="bncc" disabled>
              BNCC (em breve)
            </option>
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
              setObjetoAtivo(null);
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

      {objetos.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-400">
          Ainda não há objetos de conhecimento cadastrados para esta disciplina neste ano.
        </p>
      ) : (
        <div className="mt-3 rounded-md border border-slate-300">
          <div className="border-b border-slate-200 px-3 py-2">
            <p className="text-sm font-bold text-slate-800">
              Objetos de conhecimento <span className="font-normal text-slate-400">(ordem alfabética)</span>
            </p>
            <p className="text-xs text-slate-400">
              Clique em um objeto para ver as habilidades e os conteúdos sugeridos.
            </p>
            <label htmlFor={idBusca} className="sr-only">
              Buscar objeto de conhecimento
            </label>
            <input
              id={idBusca}
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar objeto de conhecimento..."
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
            />
          </div>

          <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
            {objetosFiltrados.length === 0 && (
              <li className="px-3 py-3 text-sm text-slate-400">
                Nenhum objeto encontrado para essa busca.
              </li>
            )}
            {objetosFiltrados.map(({ objeto, itens }) => {
              const aberto = objetoAtivo === objeto;
              const marcadas = itens.filter((h) => selecionadas.has(h.id)).length;
              const conteudos = semDuplicatas(itens.flatMap((h) => itensDeConteudo(h.conteudos)));
              return (
                <li key={objeto}>
                  <button
                    type="button"
                    aria-expanded={aberto}
                    onClick={() => setObjetoAtivo(aberto ? null : objeto)}
                    className={`flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                      aberto ? "bg-primary-50/60" : ""
                    }`}
                  >
                    <span className="text-slate-800">{objeto}</span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {marcadas > 0 ? `${marcadas} marcada(s) · ` : ""}
                      {itens.length} habilidade(s) {aberto ? "▲" : "▼"}
                    </span>
                  </button>

                  {aberto && (
                    <div className="space-y-3 bg-slate-50/60 px-3 pb-3 pt-1">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Habilidades
                        </p>
                        {itens.map((h) => (
                          <label
                            key={h.id}
                            className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-white"
                          >
                            <input
                              type="checkbox"
                              checked={selecionadas.has(h.id)}
                              onChange={() => alternar(h.id)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-slate-600">{h.descricao}</span>
                          </label>
                        ))}
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Conteúdos sugeridos
                        </p>
                        {conteudos.length > 0 ? (
                          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-600">
                            {conteudos.map((c) => (
                              <li key={c}>{c}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1 text-sm text-slate-400">
                            Este objeto não traz conteúdos sugeridos no currículo.
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => onAdicionarConteudos([nomeDoObjeto(objeto), ...conteudos])}
                          className="btn-secondary mt-2 !px-3 !py-1.5 !text-xs"
                        >
                          {conteudos.length > 0
                            ? "Adicionar objeto e conteúdos ao plano"
                            : "Adicionar objeto ao plano"}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-3 rounded-md border border-slate-200 bg-white">
        <p className="border-b border-slate-100 px-3 py-1.5 text-sm font-bold text-slate-800">
          Habilidades selecionadas no plano ({selecionadasLista.length})
        </p>
        {selecionadasLista.length === 0 ? (
          <p className="px-3 py-2 text-sm text-slate-400">
            Nenhuma habilidade selecionada ainda. Abra um objeto de conhecimento acima e marque as
            habilidades.
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
    </div>
  );
}
