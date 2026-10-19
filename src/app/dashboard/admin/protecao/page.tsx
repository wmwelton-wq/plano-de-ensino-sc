import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VoltarLink from "../../planos/voltar-link";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoAdmin from "../navegacao-admin";
import { BotaoReligar, ControlesProtecao } from "./controles-protecao";

interface Painel {
  config: { ia_habilitada: boolean; gasto_hora: number; chamadas_hora: number; usuario_minuto: number; usuario_hora: number; disparado_em: string | null; motivo: string | null; auto: boolean; pico_chamadas: number; pico_gasto: number; efetivo_chamadas: number; efetivo_gasto: number };
  hora: { chamadas: number; custo: number };
  cadastros: { ultima_hora: number; ultimas_24h: number; total: number };
  eventos_por_tipo: Record<string, number>;
  eventos: { data: string; tipo: string; detalhe: string | null; primeiro_nome: string | null }[];
  mais_ativos_hora: { primeiro_nome: string; chamadas: number }[];
}

const TIPO: Record<string, string> = {
  disjuntor: "Disjuntor disparou (IA desligada)",
  limite_minuto: "Passou do limite por minuto",
  limite_hora: "Passou do limite por hora",
};
const usd = (n: number) => `US$ ${Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function Barra({ rotulo, atual, teto, texto }: { rotulo: string; atual: number; teto: number; texto: string }) {
  const pct = teto > 0 ? Math.min(100, (atual / teto) * 100) : 0;
  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-800">{rotulo}</span>
        <span className="text-slate-600">{texto}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function ProtecaoPage() {
  const supabase = await createClient();
  const { data: ehAdmin } = await supabase.rpc("eh_admin");
  if (ehAdmin !== true) notFound();

  const { data, error } = await supabase.rpc("admin_protecao_painel");
  if (error || !data) {
    return (
      <div>
        <VoltarLink href="/dashboard/admin" rotulo="Voltar ao painel" />
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Não foi possível carregar a proteção das IAs agora.
        </p>
      </div>
    );
  }
  const r = data as Painel;
  const c = r.config;
  const disparou = !c.ia_habilitada && !!c.disparado_em;
  const desligadaManual = !c.ia_habilitada && !c.disparado_em;
  const bloqueios7d = (r.eventos_por_tipo.limite_minuto ?? 0) + (r.eventos_por_tipo.limite_hora ?? 0);

  return (
    <div>
      <VoltarLink href="/dashboard" rotulo="Voltar ao início" />
      <CabecalhoPagina tom="ardosia" ilustracao="admin" titulo="Proteção das IAs" subtitulo="Barreira contra uso abusivo ou invasão: se alguém tentar gastar demais, a IA trava sozinha e você é avisado aqui." />
      <NavegacaoAdmin atual="protecao" />

      {disparou ? (
        <div role="alert" className="mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-bold">O disjuntor disparou e a IA está desligada para todos.</p>
          <p className="mt-1">
            {c.motivo} Desligou em {quando(c.disparado_em as string)}.
          </p>
          <p className="mt-1">Veja abaixo quem estava usando e os eventos. Se foi uso normal, aumente o teto e religue; se parece invasão, deixe desligada e troque as chaves de IA nos provedores.</p>
          <BotaoReligar />
        </div>
      ) : desligadaManual ? (
        <p role="alert" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          A IA está desligada manualmente (aba IAs e custos).
        </p>
      ) : (
        <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Disjuntor armado e IA funcionando normalmente.</p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Barra rotulo="Chamadas na última hora (todos)" atual={r.hora.chamadas} teto={c.efetivo_chamadas} texto={`${r.hora.chamadas} de ${c.efetivo_chamadas}`} />
        <Barra rotulo="Gasto na última hora" atual={r.hora.custo} teto={c.efetivo_gasto} texto={`${usd(r.hora.custo)} de ${usd(c.efetivo_gasto)}`} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4">
          <p className="text-2xl font-bold text-slate-900">{r.cadastros.ultima_hora}</p>
          <p className="text-sm text-slate-500">cadastros na última hora</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-slate-900">{r.cadastros.ultimas_24h}</p>
          <p className="text-sm text-slate-500">cadastros em 24 horas</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-slate-900">{r.cadastros.total}</p>
          <p className="text-sm text-slate-500">contas no total</p>
        </div>
        <div className="card p-4">
          <p className={`text-2xl font-bold ${bloqueios7d > 0 ? "text-amber-600" : "text-slate-900"}`}>{bloqueios7d}</p>
          <p className="text-sm text-slate-500">bloqueios por ritmo (7 dias)</p>
        </div>
      </div>

      <div className="mt-4">
        <ControlesProtecao gastoHora={c.gasto_hora} chamadasHora={c.chamadas_hora} usuarioMinuto={c.usuario_minuto} usuarioHora={c.usuario_hora} auto={c.auto} picoChamadas={c.pico_chamadas} />
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Quem mais usou na última hora</h2>
      <div className="card mt-3 p-5">
        {r.mais_ativos_hora.length === 0 ? (
          <p className="text-sm text-slate-500">Ninguém usou a IA na última hora.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {r.mais_ativos_hora.map((p, i) => (
              <li key={`${p.primeiro_nome}-${i}`} className="flex justify-between border-b border-slate-100 py-1 last:border-0">
                <span className="text-slate-800">{p.primeiro_nome}</span>
                <span className="text-slate-600">{p.chamadas} pedido(s)</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Eventos de segurança recentes</h2>
      <div className="card mt-3 overflow-x-auto p-5">
        {r.eventos.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum evento. Isso é bom: ninguém bateu nos limites.</p>
        ) : (
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1 pr-3 font-semibold">Quando</th>
                <th className="py-1 pr-3 font-semibold">O que houve</th>
                <th className="py-1 pr-3 font-semibold">Quem</th>
                <th className="py-1 font-semibold">Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {r.eventos.map((e, i) => (
                <tr key={`${e.data}-${i}`} className="border-t border-slate-100 align-top">
                  <td className="whitespace-nowrap py-1.5 pr-3 text-slate-600">{quando(e.data)}</td>
                  <td className="py-1.5 pr-3 font-semibold text-slate-800">{TIPO[e.tipo] ?? e.tipo}</td>
                  <td className="py-1.5 pr-3 text-slate-600">{e.primeiro_nome ?? "—"}</td>
                  <td className="py-1.5 text-slate-600">{e.detalhe ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Camadas de proteção</h2>
      <div className="card mt-3 p-5">
        <ul className="space-y-2 text-sm text-slate-700">
          <li>✅ <strong>Chaves de IA só no servidor</strong>: nunca vão para o navegador do professor.</li>
          <li>✅ <strong>Limite por professor</strong>: usos por dia e por mês, e agora também por minuto e por hora.</li>
          <li>✅ <strong>Limite de gasto do mês</strong>: a IA para sozinha ao chegar no teto.</li>
          <li>✅ <strong>Disjuntor por hora</strong>: se todos juntos passarem do teto de chamadas ou de gasto em 1 hora, a IA desliga sozinha e o evento aparece aqui.</li>
          <li>✅ <strong>Botão de emergência</strong>: aba IAs e custos, &ldquo;Desligar a IA agora&rdquo;.</li>
          <li>⬜ <strong>Teto de gasto dentro de cada provedor</strong> (Google, Groq…): é a barreira mais forte, porque vale mesmo se alguém invadir o aplicativo inteiro. Configure no painel de cada provedor.</li>
          <li>⬜ <strong>Chaves separadas</strong> para teste e para o site de verdade, e troca das chaves de tempos em tempos.</li>
          <li>⬜ <strong>Anti-robô no cadastro</strong> (Turnstile) e regras de limite no firewall da Vercel.</li>
        </ul>
        <p className="mt-3 text-xs text-slate-400">Os itens com ⬜ ficam fora do aplicativo e exigem uma conta sua em cada serviço.</p>
      </div>
    </div>
  );
}
