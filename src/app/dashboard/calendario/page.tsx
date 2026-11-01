import { createClient } from "@/lib/supabase/server";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoTopo from "@/components/navegacao-topo";
import type { EventoCalendario } from "@/lib/feriados";
import CalendarioView from "./calendario-view";
import { cotaCalendarioIA } from "./actions";
import { anoCompetenciaOuAtual } from "@/lib/ano-competencia-servidor";

export default async function CalendarioPage({ searchParams }: { searchParams: Promise<{ mes?: string; escola?: string }> }) {
  const { mes, escola } = await searchParams;
  const supabase = await createClient();
  const anoComp = await anoCompetenciaOuAtual();

  const [{ data: perfil }, { data: eventos }, { data: escolas }, cota] = await Promise.all([
    supabase.from("professores").select("calendario_ativo").single(),
    supabase.from("calendario_eventos").select("id, titulo, tipo, sem_aula, data_inicio, data_fim, observacao, escola_id, origem").lte("data_inicio", `${anoComp}-12-31`).gte("data_fim", `${anoComp}-01-01`).order("data_inicio", { ascending: true }),
    supabase.from("escolas").select("id, nome").order("nome"),
    cotaCalendarioIA(),
  ]);

  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); // AAAA-MM-DD
  // O calendário mostra só o ano de competência: abre no mês de hoje (se for o ano escolhido) ou em janeiro.
  const mesPedido = /^\d{4}-(0[1-9]|1[0-2])$/.test(mes ?? "") && (mes as string).startsWith(`${anoComp}-`) ? (mes as string) : null;
  const inicial = mesPedido ?? (hoje.startsWith(`${anoComp}-`) ? hoje.slice(0, 7) : `${anoComp}-01`);
  const ativo = (perfil as { calendario_ativo: boolean | null } | null)?.calendario_ativo ?? null;

  return (
    <div>
      <NavegacaoTopo
        voltarHref="/dashboard"
        voltarRotulo="Voltar ao início"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Calendário escolar" }]}
      />
      <CabecalhoPagina
        tom="azul"
        ilustracao="anual"
        compacto
        titulo="Calendário escolar"
        subtitulo="Feriados do Brasil e de Santa Catarina já vêm prontos. Cada escola tem o seu calendário: acrescente recessos, festas, projetos e o que mais acontecer em cada uma."
      />
      <div className="mt-6">
        <CalendarioView
          hoje={hoje}
          mesInicial={inicial}
          anoCompetencia={anoComp}
          ativo={ativo}
          eventos={(eventos ?? []) as unknown as EventoCalendario[]}
          escolas={(escolas ?? []) as { id: string; nome: string }[]}
          escolaInicial={escola ?? null}
          cota={cota}
        />
      </div>
    </div>
  );
}
