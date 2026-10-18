"use client";

import { useEffect, useState } from "react";
import { gerarPdfDoElemento } from "@/lib/gerar-pdf";
import { criarLinkDeLeitura, enderecoDoLink, linkAtual, pararDeCompartilhar, type LinkCompartilhado } from "@/lib/compartilhar-plano";
import { enviarPlanoPorEmail, envioPorEmailAtivo, listarColegas, type Colega } from "@/app/dashboard/colegas/actions";
import FormColega from "@/app/dashboard/colegas/form-colega";
import AvatarColega from "@/components/avatar-colega";
import { Icone } from "@/components/icones";

interface Props {
  tipo: "mensal" | "anual";
  planoId: string;
  titulo: string;
  paisagem: boolean;
}

/** Botão "Compartilhar link": gera o PDF e cria um endereço de leitura para mandar à coordenação ou a um colega. */
export default function CompartilharLink({ tipo, planoId, titulo, paisagem }: Props) {
  const [aberto, setAberto] = useState(false);
  const [link, setLink] = useState<LinkCompartilhado | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [colegas, setColegas] = useState<Colega[] | null>(null);
  const [emailAtivo, setEmailAtivo] = useState(true);
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [recado, setRecado] = useState("");
  const [novoColega, setNovoColega] = useState(false);
  const [relatorio, setRelatorio] = useState<{ ok: string[]; falhas: { nome: string; motivo: string }[]; erro?: string } | null>(null);

  useEffect(() => {
    if (!aberto || link) return;
    linkAtual(tipo, planoId).then(setLink).catch(() => undefined);
  }, [aberto, link, tipo, planoId]);

  useEffect(() => {
    if (!aberto || colegas) return;
    Promise.all([listarColegas(), envioPorEmailAtivo()])
      .then(([lista, ativo]) => {
        setColegas(lista);
        setEmailAtivo(ativo);
      })
      .catch(() => setColegas([]));
  }, [aberto, colegas]);

  function alternar(id: string) {
    setEscolhidos((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  async function enviarPorEmail() {
    if (escolhidos.length === 0) {
      setMensagem("Escolha pelo menos um colega.");
      return;
    }
    setOcupado(true);
    setRelatorio(null);
    try {
      let atual = link;
      if (!atual) {
        setMensagem("Preparando o PDF...");
        const pdf = await gerarPdfDoElemento("plano-conteudo", titulo, paisagem ? "paisagem" : "retrato");
        atual = await criarLinkDeLeitura(pdf, tipo, planoId, titulo);
        setLink(atual);
      }
      setMensagem("Enviando...");
      const r = await enviarPlanoPorEmail({ token: atual.token, colegaIds: escolhidos, mensagem: recado });
      setRelatorio({ ok: r.enviados, falhas: r.falhas, erro: r.erro });
      setMensagem(null);
      if (r.enviados.length > 0) setEscolhidos([]);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Não foi possível enviar agora.");
    } finally {
      setOcupado(false);
    }
  }

  async function criar() {
    setOcupado(true);
    setMensagem("Preparando o link...");
    try {
      const pdf = await gerarPdfDoElemento("plano-conteudo", titulo, paisagem ? "paisagem" : "retrato");
      setLink(await criarLinkDeLeitura(pdf, tipo, planoId, titulo));
      setMensagem("Link criado. Ele mostra o plano como está agora; para atualizar, crie o link de novo.");
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Não foi possível criar o link.");
    } finally {
      setOcupado(false);
    }
  }

  async function copiar() {
    if (!link) return;
    const url = enderecoDoLink(link.token);
    try {
      await navigator.clipboard.writeText(url);
      setMensagem("Link copiado.");
    } catch {
      setMensagem("Copie o link manualmente: toque no campo e copie.");
    }
  }

  async function parar() {
    setOcupado(true);
    try {
      await pararDeCompartilhar(tipo, planoId);
      setLink(null);
      setMensagem("Compartilhamento encerrado. O link deixou de funcionar.");
    } catch {
      setMensagem("Não foi possível encerrar agora. Tente novamente.");
    } finally {
      setOcupado(false);
    }
  }

  const url = link && typeof window !== "undefined" ? enderecoDoLink(link.token) : "";
  const validade = link ? new Date(link.expira_em).toLocaleDateString("pt-BR") : "";

  return (
    <div className="w-full print:hidden">
      <div className="flex justify-end">
        <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} className="btn-azul-suave">
          <Icone nome="envelope" className="h-4 w-4" />
          Compartilhar
        </button>
      </div>
      {aberto && (
        <div className="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-lg shadow-slate-900/5">
          <div className="border-b border-slate-100 bg-gradient-to-r from-primary-50 via-violet-50 to-emerald-50 px-5 py-4">
            <h2 className="text-base font-extrabold text-slate-900">Compartilhar este plano</h2>
            <p className="text-xs text-slate-600">Quem recebe só lê e baixa o PDF: ninguém edita o seu plano. O link vale por 60 dias e você encerra quando quiser.</p>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-2">
            <section className="space-y-3 rounded-2xl border border-slate-200 p-4" aria-label="Link de leitura">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                  <Icone nome="globo" className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">Link de leitura</h3>
              </div>
              {link ? (
                <>
                  <label className="field-label" htmlFor="link-leitura">
                    Vale até {validade}
                  </label>
                  <input id="link-leitura" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="input-field !text-xs" />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={copiar} className="btn-azul !px-4 !py-2">
                      <Icone nome="copiar" className="h-4 w-4" />
                      Copiar link
                    </button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(`${titulo} — ${url}`)}`} target="_blank" rel="noopener noreferrer" className="btn-verde-suave">
                      WhatsApp
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <button type="button" onClick={criar} disabled={ocupado} className="btn-azul-suave !px-3 !py-1.5 !text-xs">
                      Atualizar com a versão atual
                    </button>
                    <button type="button" onClick={parar} disabled={ocupado} className="btn-perigo-suave !px-3 !py-1.5 !text-xs">
                      Parar de compartilhar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600">Crie um endereço para mandar à coordenação ou a um colega.</p>
                  <button type="button" onClick={criar} disabled={ocupado} className="btn-azul">
                    {ocupado ? "Preparando..." : "Criar link de leitura"}
                  </button>
                </>
              )}
            </section>

            <section className="space-y-3 rounded-2xl border border-primary-200 bg-gradient-to-b from-primary-50 to-white p-4" aria-label="Enviar por e-mail">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                  <Icone nome="envelope" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold leading-tight text-slate-900">Enviar por e-mail</h3>
                  <p className="text-[11px] text-slate-500">Escolha o nome: o e-mail vai direto para o colega.</p>
                </div>
              </div>

              {!emailAtivo && (
                <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <Icone nome="alerta" className="mt-0.5 h-3.5 w-3.5 shrink-0" />O envio por e-mail ainda não foi ativado. Cadastre seus colegas e use “Copiar link” ou o WhatsApp por enquanto.
                </p>
              )}

              {colegas === null ? (
                <p className="text-xs text-slate-500">Carregando seus colegas...</p>
              ) : colegas.length === 0 && !novoColega ? (
                <p className="rounded-xl bg-white px-3 py-3 text-center text-xs text-slate-600 ring-1 ring-slate-200">Você ainda não cadastrou colegas.</p>
              ) : (
                <ul className="max-h-56 space-y-1.5 overflow-auto pr-0.5">
                  {colegas.map((c) => {
                    const marcado = escolhidos.includes(c.id);
                    return (
                      <li key={c.id}>
                        <label
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition focus-within:ring-2 focus-within:ring-primary-500 ${
                            marcado ? "border-primary-400 bg-primary-50 shadow-sm ring-1 ring-primary-300" : "border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50"
                          }`}
                        >
                          <input type="checkbox" checked={marcado} onChange={() => alternar(c.id)} className="sr-only" />
                          <AvatarColega nome={c.nome} tamanho="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-slate-900">{c.nome}</span>
                            <span className="block truncate text-xs text-slate-500">{c.email}</span>
                          </span>
                          <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-white transition ${marcado ? "border-primary-600 bg-primary-600" : "border-slate-300 bg-white"}`}>
                            {marcado && <Icone nome="check" className="h-3 w-3" espessura={3} />}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}

              {novoColega ? (
                <div className="rounded-2xl border border-dashed border-primary-300 bg-white p-3">
                  <FormColega
                    rotuloBotao="Cadastrar e escolher"
                    onSalvo={(c) => {
                      setColegas((l) => [...(l ?? []), c].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
                      setEscolhidos((e) => [...e, c.id]);
                      setNovoColega(false);
                    }}
                    onCancelar={() => setNovoColega(false)}
                  />
                </div>
              ) : (
                <button type="button" onClick={() => setNovoColega(true)} className="btn-azul-suave !px-3 !py-1.5 !text-xs">
                  <Icone nome="mais" className="h-3.5 w-3.5" />
                  Cadastrar outro colega
                </button>
              )}

              {colegas && colegas.length > 0 && (
                <>
                  <div>
                    <label className="field-label" htmlFor="recado-email">
                      Recado (opcional)
                    </label>
                    <textarea id="recado-email" value={recado} onChange={(e) => setRecado(e.target.value.slice(0, 500))} rows={2} className="input-field" placeholder="Ex.: Olá! Segue meu plano do mês para você ver." />
                  </div>
                  <button type="button" onClick={enviarPorEmail} disabled={ocupado || !emailAtivo || escolhidos.length === 0} className="btn-azul w-full">
                    <Icone nome="envelope" className="h-4 w-4" />
                    {ocupado ? "Enviando..." : escolhidos.length > 0 ? `Enviar para ${escolhidos.length} ${escolhidos.length === 1 ? "colega" : "colegas"}` : "Escolha quem vai receber"}
                  </button>
                </>
              )}

              {relatorio && (
                <div role="status" className="space-y-1.5 text-xs">
                  {relatorio.erro && (
                    <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 font-semibold text-red-700">
                      <Icone nome="alerta" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {relatorio.erro}
                    </p>
                  )}
                  {relatorio.ok.length > 0 && (
                    <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2 font-semibold text-emerald-800">
                      <Icone nome="check" className="mt-0.5 h-3.5 w-3.5 shrink-0" espessura={3} />
                      Enviado para: {relatorio.ok.join(", ")}.
                    </p>
                  )}
                  {relatorio.falhas.map((f) => (
                    <p key={f.nome} className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 font-semibold text-red-700">
                      <Icone nome="alerta" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Não enviado para {f.nome}: {f.motivo}
                    </p>
                  ))}
                </div>
              )}
              <p className="text-[11px] leading-relaxed text-slate-500">
                O e-mail leva o link de leitura atual (se você mudou o plano, clique antes em “Atualizar com a versão atual”). As respostas chegam no seu e-mail.
              </p>
            </section>
          </div>

          {mensagem && (
            <p role="status" className="border-t border-slate-100 bg-slate-50 px-5 py-2.5 text-xs font-semibold text-primary-700">
              {mensagem}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
