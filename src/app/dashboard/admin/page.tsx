import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VoltarLink from "../planos/voltar-link";
import CabecalhoPagina from "@/components/cabecalho-pagina";

interface Resumo {
  gerado_em: string;
  totais: Record<string, number>;
  funil: { etapa: string; valor: number }[];
  por_semana: { semana: string; novos_professores: number; planos_mensais: number; planos_anuais: number }[];
  satisfacao: { respostas: number; nota_media: number | null; facilidade_media: number | null; comentarios: { nota: number; comentario: string; data: string }[] };
}

function Numero({ rotulo, valor }: { rotulo: string; valor: number | string }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-bold text-slate-900">{valor}</p>
      <p className="text-sm text-slate-500">{rotulo}</p>
    </div>
  );
}

export default async function PainelDeUsoPage() {
  const supabase = await createClient();
  const { data: ehAdmin } = await supabase.rpc("eh_admin");
  if (ehAdmin !== true) notFound();

  const { data, error } = await supabase.rpc("admin_resumo_uso");
  if (error || !data) {
    return (
      <div>
        <VoltarLink href="/dashboard" rotulo="Voltar ao início" />
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Não foi possível carregar o painel agora.
        </p>
      </div>
    );
  }
  const r = data as Resumo;
  const maxFunil = Math.max(1, ...r.funil.map((f) => f.valor));
  const maxSemana = Math.max(1, ...r.por_semana.map((s) => s.planos_mensais + s.planos_anuais));

  return (
    <div>
      <VoltarLink href="/dashboard" rotulo="Voltar ao início" />
      <CabecalhoPagina
        tom="ardosia"
        ilustracao="admin"
        titulo="Painel de uso"
        subtitulo="Somente números agregados — nenhum dado pessoal ou conteúdo de plano aparece aqui."
      />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero rotulo="Professores" valor={r.totais.professores} />
        <Numero rotulo="Escolas" valor={r.totais.escolas} />
        <Numero rotulo="Planos anuais" valor={r.totais.planos_anuais} />
        <Numero rotulo="Planos mensais" valor={r.totais.planos_mensais} />
        <Numero rotulo="Finalizados" valor={r.totais.finalizados} />
        <Numero rotulo="Rascunhos" valor={r.totais.rascunhos} />
        <Numero rotulo="Rascunhos parados há +7 dias" valor={r.totais.rascunhos_parados_7d} />
        <Numero rotulo="Nota média (1–5)" valor={r.satisfacao.nota_media ?? "—"} />
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Onde as pessoas abandonam</h2>
      <p className="text-sm text-slate-500">Quantos professores chegaram em cada etapa. A queda entre uma barra e a seguinte mostra onde estão parando.</p>
      <ul className="card mt-3 space-y-3 p-5">
        {r.funil.map((f, i) => {
          const anterior = i > 0 ? r.funil[i - 1].valor : null;
          const perda = anterior && anterior > 0 ? Math.round(((anterior - f.valor) / anterior) * 100) : null;
          return (
            <li key={f.etapa}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold text-slate-800">{f.etapa}</span>
                <span className="text-slate-600">
                  {f.valor}
                  {perda !== null && perda > 0 ? <span className="ml-2 text-red-600">(−{perda}% em relação à etapa anterior)</span> : null}
                </span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${(f.valor / maxFunil) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Planos criados por semana</h2>
      <div className="card mt-3 overflow-x-auto p-5">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-1 pr-3 font-semibold">Semana de</th>
              <th className="py-1 pr-3 font-semibold">Novos professores</th>
              <th className="py-1 pr-3 font-semibold">Anuais</th>
              <th className="py-1 pr-3 font-semibold">Mensais</th>
              <th className="py-1 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {r.por_semana.map((s) => {
              const total = s.planos_anuais + s.planos_mensais;
              return (
                <tr key={s.semana} className="border-t border-slate-100">
                  <td className="py-1.5 pr-3 text-slate-700">{s.semana}</td>
                  <td className="py-1.5 pr-3">{s.novos_professores}</td>
                  <td className="py-1.5 pr-3">{s.planos_anuais}</td>
                  <td className="py-1.5 pr-3">{s.planos_mensais}</td>
                  <td className="py-1.5">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-2.5 rounded-full bg-primary-500" style={{ width: `${Math.max(2, (total / maxSemana) * 80)}px` }} />
                      {total}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Satisfação</h2>
      <p className="text-sm text-slate-500">
        {r.satisfacao.respostas} resposta(s) · nota geral {r.satisfacao.nota_media ?? "—"} · facilidade {r.satisfacao.facilidade_media ?? "—"}
      </p>
      {r.satisfacao.comentarios.length > 0 && (
        <ul className="mt-3 space-y-2">
          {r.satisfacao.comentarios.map((c, i) => (
            <li key={i} className="card p-4 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Nota {c.nota}</span> <span className="text-slate-400">· {c.data}</span>
              <p className="mt-1 whitespace-pre-wrap">{c.comentario}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-xs text-slate-400">Atualizado em {new Date(r.gerado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.</p>
    </div>
  );
}
