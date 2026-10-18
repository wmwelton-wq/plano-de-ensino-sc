import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icone } from "@/components/icones";
import { datasOficiais, rotuloPeriodo, somarDias, type EventoCalendario } from "@/lib/feriados";
import ConviteCalendario from "./convite-calendario";

const FUSO = "America/Sao_Paulo";
const JANELA_DIAS = 21;

interface Linha {
  chave: string;
  inicio: string;
  fim: string;
  titulo: string;
  semAula: boolean;
  oficial: boolean;
}

function quando(inicio: string, fim: string, hoje: string): string {
  if (inicio <= hoje && fim >= hoje) return "Hoje";
  const dias = Math.round((Date.parse(inicio) - Date.parse(hoje)) / 86400000);
  if (dias === 1) return "Amanhã";
  return `Em ${dias} dias`;
}

/** Faixa "Agenda" do painel: o que vai acontecer nas próximas semanas. Só aparece se o professor ligou o calendário. */
export default async function AgendaPainel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: prof } = await supabase.from("professores").select("calendario_ativo").eq("id", user.id).single();
  const ativo = (prof as { calendario_ativo?: boolean | null } | null)?.calendario_ativo ?? null;
  if (ativo === false) return null;
  if (ativo === null) return <ConviteCalendario />;

  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: FUSO });
  const limite = somarDias(hoje, JANELA_DIAS);
  const { data } = await supabase
    .from("calendario_eventos")
    .select("id, titulo, sem_aula, data_inicio, data_fim")
    .lte("data_inicio", limite)
    .gte("data_fim", hoje)
    .order("data_inicio")
    .limit(30);

  const linhas: Linha[] = [];
  for (const e of (data ?? []) as Pick<EventoCalendario, "id" | "titulo" | "sem_aula" | "data_inicio" | "data_fim">[]) {
    linhas.push({ chave: `e-${e.id}`, inicio: e.data_inicio < hoje ? hoje : e.data_inicio, fim: e.data_fim, titulo: e.titulo, semAula: e.sem_aula, oficial: false });
  }
  const anos = new Set([Number(hoje.slice(0, 4)), Number(limite.slice(0, 4))]);
  for (const ano of anos) {
    for (const o of datasOficiais(ano)) {
      if (o.data >= hoje && o.data <= limite && (o.natureza === "feriado" || o.semAula)) {
        linhas.push({ chave: `o-${o.data}-${o.titulo}`, inicio: o.data, fim: o.data, titulo: o.titulo, semAula: o.semAula, oficial: true });
      }
    }
  }
  linhas.sort((a, b) => a.inicio.localeCompare(b.inicio));
  const proximas = linhas.slice(0, 5);

  return (
    <section aria-labelledby="agenda-painel" className="painel-cartao p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="agenda-painel" className="flex items-center gap-2 text-base font-extrabold text-slate-900">
          <Icone nome="calendarioMes" className="h-5 w-5 text-blue-600" />
          Agenda dos próximos dias
        </h2>
        <Link href="/dashboard/calendario" className="text-sm font-bold text-primary-700 hover:underline">
          Abrir calendário
        </Link>
      </div>
      {proximas.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">Nada marcado para as próximas três semanas. Que tal adicionar uma data da escola?</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {proximas.map((l) => (
            <li key={l.chave} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2">
              <span className={`w-20 shrink-0 text-xs font-extrabold uppercase tracking-wide ${l.inicio <= hoje ? "text-emerald-700" : "text-slate-500"}`}>{quando(l.inicio, l.fim, hoje)}</span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-slate-900">{l.titulo}</span>
              <span className="text-xs text-slate-500">
                {rotuloPeriodo(l.inicio, l.fim)}
                {l.semAula ? " · sem aula" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
