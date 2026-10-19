import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import VoltarLink from "../../planos/voltar-link";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoAdmin from "../navegacao-admin";
import { listarProvedores } from "@/lib/ia/provedores";
import { ControleIA, TesteIAs } from "./controles-ia";

interface Painel {
  gerado_em: string;
  dias: number;
  config: { ia_habilitada: boolean; limite_global_mensal: number; gasto_global_mes_atual: number } | null;
  hoje: { chamadas: number; sucesso: number; falha: number; custo: number };
  mes: { chamadas: number; sucesso: number; falha: number; custo: number };
  periodo: { total: number; sucesso: number; falha: number; bloqueado: number; pendente: number; custo: number; tokens_entrada: number; tokens_saida: number; professores: number; duracao_media_ms: number | null };
  por_dia: { dia: string; sucesso: number; falha: number; custo: number }[];
  por_operacao: { operacao: string; sucesso: number; falha: number; custo: number }[];
  por_modelo: { modelo: string; sucesso: number; custo: number; tokens_entrada: number; tokens_saida: number; duracao_media_ms: number | null; ultimo: string }[];
  tentativas_com_erro: { provedor: string; erros: number; ultimo: string }[];
  falhas_recentes: { data: string; operacao: string; status: string; modelo: string; erro: string | null; primeiro_nome: string }[];
  top_professores: { primeiro_nome: string; chamadas: number; custo: number }[];
}

const NOME_OPERACAO: Record<string, string> = { metodologia: "Metodologia (texto dos planos)", calendario_pdf: "Calendário por PDF" };
const usd = (n: number) => `US$ ${Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
const num = (n: number) => Number(n).toLocaleString("pt-BR");

function Cartao({ rotulo, valor, detalhe, tom }: { rotulo: string; valor: string; detalhe?: string; tom?: "ok" | "alerta" }) {
  return (
    <div className="card p-4">
      <p className={`text-2xl font-bold ${tom === "alerta" ? "text-red-600" : "text-slate-900"}`}>{valor}</p>
      <p className="text-sm text-slate-500">{rotulo}</p>
      {detalhe && <p className="mt-0.5 text-xs text-slate-400">{detalhe}</p>}
    </div>
  );
}

export default async function IaAdminPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const { dias: diasParam } = await searchParams;
  const dias = [7, 14, 30, 60].includes(Number(diasParam)) ? Number(diasParam) : 14;
  const supabase = await createClient();
  const { data: ehAdmin } = await supabase.rpc("eh_admin");
  if (ehAdmin !== true) notFound();

  const { data, error } = await supabase.rpc("admin_ia_painel", { p_dias: dias });
  if (error || !data) {
    return (
      <div>
        <VoltarLink href="/dashboard/admin" rotulo="Voltar ao painel" />
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Não foi possível carregar o painel das IAs agora.
        </p>
      </div>
    );
  }
  const r = data as Painel;
  const cfg = r.config ?? { ia_habilitada: true, limite_global_mensal: 0, gasto_global_mes_atual: 0 };
  const pctLimite = cfg.limite_global_mensal > 0 ? Math.min(100, (cfg.gasto_global_mes_atual / cfg.limite_global_mensal) * 100) : 0;
  const finalizadas = r.periodo.sucesso + r.periodo.falha;
  const taxa = finalizadas > 0 ? Math.round((r.periodo.sucesso / finalizadas) * 100) : null;
  const maxDia = Math.max(1, ...r.por_dia.map((d) => d.sucesso + d.falha));
  const provedores = listarProvedores();
  const semProvedor = !provedores.some((p) => p.configurado);

  const alertas: string[] = [];
  if (!cfg.ia_habilitada) alertas.push("A IA está DESLIGADA para todos os professores.");
  if (semProvedor) alertas.push("Nenhuma chave de IA está configurada neste ambiente.");
  if (pctLimite >= 80) alertas.push(`O gasto do mês já usou ${Math.round(pctLimite)}% do limite.`);
  if (taxa !== null && taxa < 70 && finalizadas >= 5) alertas.push(`A taxa de sucesso no período está baixa (${taxa}%).`);
  if (r.periodo.pendente > 0) alertas.push(`${r.periodo.pendente} chamada(s) ficaram "pendentes" (a função pode ter caído no meio).`);

  return (
    <div>
      <VoltarLink href="/dashboard" rotulo="Voltar ao início" />
      <CabecalhoPagina tom="ardosia" ilustracao="admin" titulo="IAs e custos" subtitulo="Se as IAs estão funcionando, quanto estão custando e quem está usando. Nenhum texto de plano aparece aqui." />
      <NavegacaoAdmin atual="ia" />

      {alertas.length > 0 ? (
        <ul role="alert" className="mt-5 space-y-1 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {alertas.map((a) => (
            <li key={a}>⚠ {a}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Tudo certo: nenhum alerta no período.</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">Período:</span>
        {[7, 14, 30, 60].map((d) => (
          <Link key={d} href={`/dashboard/admin/ia?dias=${d}`} className={d === dias ? "rounded-lg bg-slate-900 px-3 py-1 font-bold text-white" : "rounded-lg border border-slate-200 bg-white px-3 py-1 text-slate-700"}>
            {d} dias
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cartao rotulo="Gasto no mês" valor={usd(cfg.gasto_global_mes_atual)} detalhe={`limite ${usd(cfg.limite_global_mensal)} (${Math.round(pctLimite)}%)`} tom={pctLimite >= 80 ? "alerta" : "ok"} />
        <Cartao rotulo="Gasto hoje" valor={usd(r.hoje.custo)} detalhe={`${r.hoje.chamadas} chamada(s)`} />
        <Cartao rotulo={`Chamadas em ${dias} dias`} valor={num(r.periodo.total)} detalhe={`${r.periodo.professores} professor(es)`} />
        <Cartao rotulo="Taxa de sucesso" valor={taxa === null ? "—" : `${taxa}%`} detalhe={`${r.periodo.falha} falha(s)`} tom={taxa !== null && taxa < 70 ? "alerta" : "ok"} />
        <Cartao rotulo={`Gasto em ${dias} dias`} valor={usd(r.periodo.custo)} />
        <Cartao rotulo="Tokens (entrada / saída)" valor={`${num(r.periodo.tokens_entrada)} / ${num(r.periodo.tokens_saida)}`} />
        <Cartao rotulo="Tempo médio de resposta" valor={r.periodo.duracao_media_ms ? `${(r.periodo.duracao_media_ms / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s` : "—"} detalhe="só das chamadas novas" />
        <Cartao rotulo="Bloqueadas por limite" valor={num(r.periodo.bloqueado)} />
      </div>

      <div className="card mt-4 p-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold text-slate-800">Limite mensal de gasto</span>
          <span className="text-slate-600">{usd(cfg.gasto_global_mes_atual)} de {usd(cfg.limite_global_mensal)}</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${pctLimite >= 80 ? "bg-red-500" : "bg-primary-500"}`} style={{ width: `${pctLimite}%` }} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ControleIA habilitada={cfg.ia_habilitada} limite={cfg.limite_global_mensal} />
        <TesteIAs configurados={provedores} />
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Uso por dia</h2>
      <div className="card mt-3 overflow-x-auto p-5">
        <ul className="min-w-[420px] space-y-1.5">
          {r.por_dia.map((d) => (
            <li key={d.dia} className="flex items-center gap-3 text-xs">
              <span className="w-10 shrink-0 text-slate-500">{d.dia}</span>
              <span className="flex h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span className="h-full bg-emerald-500" style={{ width: `${(d.sucesso / maxDia) * 100}%` }} />
                <span className="h-full bg-red-500" style={{ width: `${(d.falha / maxDia) * 100}%` }} />
              </span>
              <span className="w-40 shrink-0 text-right text-slate-600">
                {d.sucesso} ok{d.falha ? <span className="text-red-600"> · {d.falha} falha(s)</span> : null} · {usd(d.custo)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-400">Verde: deu certo. Vermelho: falhou.</p>
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Por IA (modelo que respondeu)</h2>
      <div className="card mt-3 overflow-x-auto p-5">
        {r.por_modelo.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma chamada bem-sucedida no período.</p>
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1 pr-3 font-semibold">Modelo</th>
                <th className="py-1 pr-3 font-semibold">Respostas</th>
                <th className="py-1 pr-3 font-semibold">Gasto</th>
                <th className="py-1 pr-3 font-semibold">Tokens</th>
                <th className="py-1 pr-3 font-semibold">Tempo médio</th>
                <th className="py-1 font-semibold">Última</th>
              </tr>
            </thead>
            <tbody>
              {r.por_modelo.map((m) => (
                <tr key={m.modelo} className="border-t border-slate-100">
                  <td className="py-1.5 pr-3 font-semibold text-slate-800">{m.modelo}</td>
                  <td className="py-1.5 pr-3">{m.sucesso}</td>
                  <td className="py-1.5 pr-3">{usd(m.custo)}</td>
                  <td className="py-1.5 pr-3 text-slate-600">{num(m.tokens_entrada)} / {num(m.tokens_saida)}</td>
                  <td className="py-1.5 pr-3 text-slate-600">{m.duracao_media_ms ? `${(m.duracao_media_ms / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s` : "—"}</td>
                  <td className="py-1.5 text-slate-600">{m.ultimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Provedores que falharam (mesmo quando outro assumiu)</h2>
      <p className="text-sm text-slate-500">Conta cada vez que um provedor deu erro. Se um nome aparece muito aqui, vale conferir a chave, o limite ou o modelo dele. (Só conta chamadas feitas depois desta atualização.)</p>
      <div className="card mt-3 p-5">
        {r.tentativas_com_erro.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum erro de provedor registrado no período.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {r.tentativas_com_erro.map((t) => (
              <li key={t.provedor}>
                <strong className="capitalize">{t.provedor}</strong>: {t.erros} erro(s), último em {t.ultimo}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Por recurso</h2>
          <ul className="card mt-3 space-y-2 p-5 text-sm">
            {r.por_operacao.length === 0 && <li className="text-slate-500">Sem uso no período.</li>}
            {r.por_operacao.map((o) => (
              <li key={o.operacao} className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-slate-800">{NOME_OPERACAO[o.operacao] ?? o.operacao}</span>
                <span className="text-slate-600">
                  {o.sucesso} ok{o.falha ? <span className="text-red-600"> · {o.falha} falha(s)</span> : null} · {usd(o.custo)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Quem mais usou (só o primeiro nome)</h2>
          <ul className="card mt-3 space-y-2 p-5 text-sm">
            {r.top_professores.length === 0 && <li className="text-slate-500">Sem uso no período.</li>}
            {r.top_professores.map((t, i) => (
              <li key={i} className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-slate-800">{t.primeiro_nome}</span>
                <span className="text-slate-600">{t.chamadas} chamada(s) · {usd(t.custo)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Últimas falhas</h2>
      <div className="card mt-3 overflow-x-auto p-5">
        {r.falhas_recentes.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma falha registrada. 🎉</p>
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1 pr-3 font-semibold">Quando</th>
                <th className="py-1 pr-3 font-semibold">Recurso</th>
                <th className="py-1 pr-3 font-semibold">Quem</th>
                <th className="py-1 font-semibold">Situação / motivo</th>
              </tr>
            </thead>
            <tbody>
              {r.falhas_recentes.map((f, i) => (
                <tr key={i} className="border-t border-slate-100 align-top">
                  <td className="py-1.5 pr-3 text-slate-600">{f.data}</td>
                  <td className="py-1.5 pr-3">{NOME_OPERACAO[f.operacao] ?? f.operacao}</td>
                  <td className="py-1.5 pr-3">{f.primeiro_nome}</td>
                  <td className="py-1.5 text-slate-700">
                    {f.status === "falha" ? <span className="font-semibold text-red-700">falhou</span> : <span className="font-semibold text-amber-700">recuperado</span>}
                    {f.erro ? <span className="block break-words text-xs text-slate-500">{f.erro}</span> : <span className="block text-xs text-slate-400">motivo não registrado (chamada antiga)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-400">Atualizado em {new Date(r.gerado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}. Valores em dólar, estimados pela tabela de preços de cada provedor; a cobrança real aparece no site de cada um.</p>
    </div>
  );
}
