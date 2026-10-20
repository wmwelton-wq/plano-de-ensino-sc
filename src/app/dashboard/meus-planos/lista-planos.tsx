"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Icone } from "@/components/icones";
import { Ilustracao, type NomeIlustracao } from "@/components/ilustracoes";
import { gerarPdfDeVarios } from "@/lib/gerar-pdf-varios";
import { criarLinkDeLeitura, enderecoDoLink } from "@/lib/compartilhar-plano";
import EstrelaFavorito from "./estrela-favorito";
import { excluirPlanosEmLote, pararDeCompartilharVarios } from "./actions";

export type TipoDaLista = "mensais" | "anuais";

/** Plano pronto para a tela (só texto e números simples, vindo do servidor). */
export interface ItemPlano {
  id: string;
  titulo: string;
  etapaRotulo: string;
  ano: number;
  situacao: "finalizado" | "rascunho";
  situacaoRotulo: string;
  arte: NomeIlustracao;
  /** Data do plano: período (mensal) ou última atualização (anual). */
  data: string;
  favorito: boolean;
  /** Validade do link de leitura (ISO) quando o plano está compartilhado. */
  compartilhadoAte: string | null;
}

interface Props {
  tipo: TipoDaLista;
  base: string;
  itens: ItemPlano[];
  /** Ids de todos os planos da turma (a lista pode estar dividida em páginas). */
  todosIds: string[];
}

const dataCurta = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};

/** Janela de confirmação simples (aviso antes de ações que não dá para desfazer ou que mudam o acesso de outras pessoas). */
function Aviso({ titulo, perigo = false, children, rodape, aoFechar }: { titulo: string; perigo?: boolean; children: React.ReactNode; rodape: React.ReactNode; aoFechar: () => void }) {
  const cancelar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    document.addEventListener("keydown", tecla);
    cancelar.current?.focus();
    return () => document.removeEventListener("keydown", tecla);
  }, [aoFechar]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center" role="presentation" onClick={aoFechar}>
      <div
        ref={cancelar}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md overflow-hidden rounded-3xl border bg-white shadow-2xl focus:outline-none ${perigo ? "border-red-200" : "border-slate-200"}`}
      >
        <div className={`flex items-center gap-3 px-5 py-4 text-white ${perigo ? "bg-gradient-to-r from-red-600 to-rose-600" : "bg-gradient-to-r from-primary-700 to-primary-600"}`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20" aria-hidden="true">
            <Icone nome="alerta" className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-extrabold leading-tight">{titulo}</h2>
        </div>
        <div className="space-y-3 p-5 text-sm text-slate-700">{children}</div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3.5">{rodape}</div>
      </div>
    </div>
  );
}

type Pedido =
  | { tipo: "excluir"; ids: string[]; nomes: string[] }
  | { tipo: "descompartilhar"; ids: string[]; nomes: string[] };

interface LinkCriado {
  id: string;
  titulo: string;
  url: string;
}

export default function ListaPlanos({ tipo, base, itens, todosIds }: Props) {
  const roteador = useRouter();
  const [, iniciar] = useTransition();
  const [selecionando, setSelecionando] = useState(false);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; erro?: boolean } | null>(null);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [links, setLinks] = useState<LinkCriado[] | null>(null);
  const [entendi, setEntendi] = useState(false);
  const tipoLink = tipo === "anuais" ? "anual" : "mensal";
  const porId = useMemo(() => new Map(itens.map((i) => [i.id, i])), [itens]);

  // Se a lista mudou (plano excluído), tira da seleção quem não existe mais.
  useEffect(() => {
    setMarcados((atual) => {
      const vivos = new Set(atual);
      for (const id of atual) if (!todosIds.includes(id)) vivos.delete(id);
      return vivos.size === atual.size ? atual : vivos;
    });
  }, [todosIds]);

  function alternar(id: string) {
    setMarcados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }
  const todosMarcados = todosIds.length > 0 && todosIds.every((id) => marcados.has(id));
  function sairDaSelecao() {
    setSelecionando(false);
    setMarcados(new Set());
  }
  function atualizar() {
    iniciar(() => roteador.refresh());
  }

  function nomesDe(ids: string[]): string[] {
    return ids.map((id) => porId.get(id)?.titulo ?? "Plano");
  }

  function fecharPedido() {
    if (ocupado) return;
    setPedido(null);
    setEntendi(false);
  }

  async function confirmar() {
    if (!pedido) return;
    setOcupado(true);
    setMensagem(null);
    try {
      if (pedido.tipo === "excluir") {
        const r = await excluirPlanosEmLote(tipo, pedido.ids);
        if (r.erro) setMensagem({ texto: r.erro, erro: true });
        else {
          setMensagem({ texto: r.excluidos === 1 ? "1 plano excluído." : `${r.excluidos} planos excluídos.` });
          setMarcados(new Set());
        }
      } else {
        const r = await pararDeCompartilharVarios(tipo, pedido.ids);
        if (!r.ok) setMensagem({ texto: r.erro ?? "Não foi possível encerrar agora.", erro: true });
        else setMensagem({ texto: pedido.ids.length === 1 ? "Compartilhamento encerrado: o link deixou de funcionar." : "Compartilhamento encerrado nos planos escolhidos." });
      }
    } catch {
      setMensagem({ texto: "Sem conexão. Verifique a internet e tente de novo.", erro: true });
    } finally {
      setOcupado(false);
      setPedido(null);
      setEntendi(false);
      atualizar();
    }
  }

  /** Cria um link de leitura para cada plano escolhido (o PDF de cada um é gerado e guardado, como no botão Compartilhar do plano). */
  async function compartilharMarcados() {
    const ids = todosIds.filter((id) => marcados.has(id));
    if (ids.length === 0) return;
    setOcupado(true);
    setMensagem(null);
    setLinks(null);
    const criados: LinkCriado[] = [];
    const falhas: string[] = [];
    try {
      for (let n = 0; n < ids.length; n++) {
        const id = ids[n];
        const item = porId.get(id);
        const titulo = item?.titulo ?? "Plano";
        setProgresso(`Preparando ${n + 1} de ${ids.length}: ${titulo}`);
        try {
          const item1 =
            tipo === "anuais"
              ? { url: `/dashboard/anual/${id}/visualizar`, titulo, orientacao: "paisagem" as const }
              : { url: `/dashboard/planos/${id}/visualizar`, titulo, orientacao: "retrato" as const };
          const { arquivo } = await gerarPdfDeVarios([item1], titulo);
          if (!arquivo) throw new Error("Não foi possível gerar o PDF.");
          const link = await criarLinkDeLeitura(arquivo, tipoLink, id, titulo);
          criados.push({ id, titulo, url: enderecoDoLink(link.token) });
        } catch (e) {
          falhas.push(`${titulo}${e instanceof Error && e.message ? ` (${e.message})` : ""}`);
          // Limite de links ativos: não adianta tentar os próximos.
          if (e instanceof Error && /links ativos/i.test(e.message)) break;
        }
      }
    } finally {
      setProgresso(null);
      setOcupado(false);
    }
    setLinks(criados);
    if (falhas.length > 0) setMensagem({ texto: `Não foi possível compartilhar: ${falhas.join("; ")}.`, erro: true });
    else setMensagem({ texto: criados.length === 1 ? "1 link criado." : `${criados.length} links criados.` });
    if (criados.length > 0) atualizar();
  }

  async function copiarTodos() {
    if (!links) return;
    const texto = links.map((l) => `${l.titulo}: ${l.url}`).join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      setMensagem({ texto: "Links copiados." });
    } catch {
      setMensagem({ texto: "Não foi possível copiar sozinho. Selecione o texto da lista e copie.", erro: true });
    }
  }

  const qtd = marcados.size;
  const marcadosLista = todosIds.filter((id) => marcados.has(id));
  const algumCompartilhado = marcadosLista.some((id) => porId.get(id)?.compartilhadoAte);

  return (
    <div>
      {/* Barra de seleção */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {!selecionando ? (
          <button type="button" onClick={() => setSelecionando(true)} className="btn-azul-suave" disabled={itens.length === 0}>
            <Icone nome="check" className="h-4 w-4" />
            Selecionar planos
          </button>
        ) : (
          <div className="sticky top-[4.25rem] z-[6] flex w-full flex-wrap items-center gap-2 rounded-2xl border border-primary-200 bg-primary-50/95 px-3 py-2.5 shadow-sm backdrop-blur">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-200">
              <input
                type="checkbox"
                checked={todosMarcados}
                onChange={() => setMarcados(todosMarcados ? new Set() : new Set(todosIds))}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Selecionar todos ({todosIds.length})
            </label>
            <span className="text-sm font-semibold text-primary-900" aria-live="polite">
              {qtd === 0 ? "Nenhum escolhido" : qtd === 1 ? "1 escolhido" : `${qtd} escolhidos`}
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button type="button" onClick={compartilharMarcados} disabled={qtd === 0 || ocupado} className="btn-azul !px-3 !py-1.5 !text-sm">
                <Icone nome="envelope" className="h-4 w-4" />
                Compartilhar
              </button>
              {algumCompartilhado && (
                <button
                  type="button"
                  onClick={() => {
                    const ids = marcadosLista.filter((id) => porId.get(id)?.compartilhadoAte);
                    setPedido({ tipo: "descompartilhar", ids, nomes: nomesDe(ids) });
                  }}
                  disabled={ocupado}
                  className="btn-azul-suave !px-3 !py-1.5 !text-sm"
                >
                  Parar de compartilhar
                </button>
              )}
              <button type="button" onClick={() => setPedido({ tipo: "excluir", ids: marcadosLista, nomes: nomesDe(marcadosLista) })} disabled={qtd === 0 || ocupado} className="btn-perigo-suave !px-3 !py-1.5 !text-sm">
                Excluir
              </button>
              <button type="button" onClick={sairDaSelecao} disabled={ocupado} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-white">
                Concluir seleção
              </button>
            </div>
          </div>
        )}
      </div>

      {progresso && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          {progresso}
        </p>
      )}
      {mensagem && (
        <p
          role={mensagem.erro ? "alert" : "status"}
          className={`mt-3 rounded-xl border px-4 py-2 text-sm ${mensagem.erro ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
        >
          {mensagem.texto}
        </p>
      )}

      {links && links.length > 0 && (
        <div className="mt-3 space-y-2 rounded-2xl border border-primary-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900">Links de leitura criados (valem por 60 dias)</h3>
          <p className="text-xs text-slate-600">Quem recebe só lê e baixa o PDF. Para parar, use o selo “Compartilhado” em cada plano.</p>
          <ul className="max-h-56 space-y-1.5 overflow-auto text-xs">
            {links.map((l) => (
              <li key={l.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="font-semibold text-slate-800">{l.titulo}</p>
                <input readOnly value={l.url} onFocus={(e) => e.currentTarget.select()} className="input-field mt-1 !py-1 !text-xs" aria-label={`Link de ${l.titulo}`} />
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copiarTodos} className="btn-azul !px-4 !py-2">
              <Icone nome="copiar" className="h-4 w-4" />
              Copiar todos
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(links.map((l) => `${l.titulo} — ${l.url}`).join("\n"))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-verde-suave"
            >
              WhatsApp
            </a>
            <button type="button" onClick={() => setLinks(null)} className="btn-azul-suave">
              Fechar
            </button>
          </div>
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {itens.map((p) => (
          <CartaoPlanoAcoes
            key={p.id}
            plano={p}
            base={base}
            tipo={tipo}
            selecionando={selecionando}
            marcado={marcados.has(p.id)}
            aoMarcar={() => alternar(p.id)}
            aoExcluir={() => setPedido({ tipo: "excluir", ids: [p.id], nomes: [p.titulo] })}
            aoDescompartilhar={() => setPedido({ tipo: "descompartilhar", ids: [p.id], nomes: [p.titulo] })}
          />
        ))}
      </ul>

      {pedido?.tipo === "excluir" && (
        <Aviso
          titulo="Atenção: exclusão definitiva"
          perigo
          aoFechar={fecharPedido}
          rodape={
            <>
              <button type="button" onClick={fecharPedido} disabled={ocupado} className="btn-azul-suave">
                Cancelar, manter
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={!entendi || ocupado}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ocupado ? "Excluindo…" : pedido.ids.length === 1 ? "Excluir para sempre" : `Excluir ${pedido.ids.length} planos`}
              </button>
            </>
          }
        >
          {pedido.ids.length === 1 ? (
            <p>
              Você vai excluir o plano <strong>{pedido.nomes[0]}</strong>.
            </p>
          ) : (
            <>
              <p>
                Você vai excluir <strong>{pedido.ids.length} planos</strong>:
              </p>
              <ul className="max-h-32 list-disc overflow-auto pl-5 text-slate-600">
                {pedido.nomes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </>
          )}
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 font-semibold text-red-800">Depois de excluir, não será mais possível recuperar. Não existe lixeira nem como desfazer.</p>
          <p className="text-slate-600">Se o plano estiver compartilhado, o link dele também deixa de funcionar.</p>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold text-slate-800">
            <input type="checkbox" checked={entendi} onChange={(e) => setEntendi(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
            Entendi que não poderei recuperar.
          </label>
        </Aviso>
      )}

      {pedido?.tipo === "descompartilhar" && (
        <Aviso
          titulo="Parar de compartilhar?"
          aoFechar={fecharPedido}
          rodape={
            <>
              <button type="button" onClick={fecharPedido} disabled={ocupado} className="btn-azul-suave">
                Manter compartilhado
              </button>
              <button type="button" onClick={confirmar} disabled={ocupado} className="btn-azul">
                {ocupado ? "Encerrando…" : "Parar de compartilhar"}
              </button>
            </>
          }
        >
          {pedido.ids.length === 1 ? (
            <p>
              O plano <strong>{pedido.nomes[0]}</strong> está compartilhado por link. Se você parar, quem recebeu o link não consegue mais abrir o plano.
            </p>
          ) : (
            <p>
              <strong>{pedido.ids.length} planos</strong> estão compartilhados por link. Se você parar, quem recebeu os links não consegue mais abrir esses planos.
            </p>
          )}
          <p className="text-slate-600">O plano continua no seu painel, sem nenhuma alteração. Você pode compartilhar de novo quando quiser.</p>
        </Aviso>
      )}
    </div>
  );
}

function CartaoPlanoAcoes({
  plano,
  base,
  tipo,
  selecionando,
  marcado,
  aoMarcar,
  aoExcluir,
  aoDescompartilhar,
}: {
  plano: ItemPlano;
  base: string;
  tipo: TipoDaLista;
  selecionando: boolean;
  marcado: boolean;
  aoMarcar: () => void;
  aoExcluir: () => void;
  aoDescompartilhar: () => void;
}) {
  const finalizado = plano.situacao === "finalizado";
  const tom = tipo === "anuais" ? "azul" : "verde";
  return (
    <li className="flex items-stretch gap-2">
      {selecionando && (
        <label className="flex shrink-0 cursor-pointer items-center rounded-xl border border-slate-300 bg-white px-3 has-[:checked]:border-primary-400 has-[:checked]:bg-primary-50">
          <input type="checkbox" checked={marcado} onChange={aoMarcar} className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
          <span className="sr-only">Escolher {plano.titulo}</span>
        </label>
      )}
      <EstrelaFavorito tipo={tipo} planoId={plano.id} favorito={plano.favorito} />
      <div data-tom={tom} className={`card card-interactive flex min-w-0 flex-1 flex-col ${marcado ? "ring-2 ring-primary-400" : ""}`}>
        <Link
          href={`${base}/${plano.id}`}
          className="flex min-w-0 items-center justify-between gap-4 rounded-t-2xl px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <div className="hidden h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-xl sm:block atalho-arte" aria-hidden="true">
            <Ilustracao nome={plano.arte} tom={tom} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">{plano.titulo}</p>
            <p className="mt-0.5 text-sm text-slate-500">
              {plano.etapaRotulo} · {plano.ano}
            </p>
            {plano.data && <p className="mt-0.5 text-xs font-medium text-slate-600">{plano.data}</p>}
          </div>
          <span className={`badge shrink-0 ${finalizado ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${finalizado ? "bg-green-600" : "bg-amber-600"}`} />
            {plano.situacaoRotulo}
          </span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2">
          <div className="min-w-0">
            {plano.compartilhadoAte ? (
              <button
                type="button"
                onClick={aoDescompartilhar}
                title="Este plano está compartilhado por link. Clique para parar de compartilhar."
                className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <Icone nome="envelope" className="h-3.5 w-3.5" />
                Compartilhado{dataCurta(plano.compartilhadoAte) ? ` até ${dataCurta(plano.compartilhadoAte)}` : ""} · parar
              </button>
            ) : (
              <span className="text-xs text-slate-400">Não compartilhado</span>
            )}
          </div>
          <button
            type="button"
            onClick={aoExcluir}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Excluir plano
          </button>
        </div>
      </div>
    </li>
  );
}
