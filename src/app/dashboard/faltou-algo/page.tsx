import VoltarLink from "../planos/voltar-link";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import { createClient } from "@/lib/supabase/server";
import FormularioSugestao, { ROTULO_SUGESTAO } from "./formulario-sugestao";

const ROTULO_STATUS: Record<string, string> = {
  nova: "Recebida",
  analisando: "Em análise",
  aprovada: "Aprovada",
  feita: "Já atualizado",
  descartada: "Não será incluída",
};

export default async function FaltouAlgoPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sugestoes_faltou")
    .select("id, tipo, disciplina_nome, serie, descricao, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  const minhas = (data ?? []) as { id: string; tipo: string; disciplina_nome: string | null; serie: string | null; descricao: string; status: string; created_at: string }[];

  return (
    <div className="mx-auto max-w-2xl">
      <VoltarLink href="/dashboard" rotulo="Voltar ao início" />
      <CabecalhoPagina
        tom="ciano"
        ilustracao="opiniao"
        titulo="Faltou algo?"
        subtitulo="Não achou uma competência, um objeto de conhecimento, uma habilidade ou outro item do plano? Conte aqui: nós analisamos e atualizamos o aplicativo."
      />
      <div className="card mt-6 p-5">
        <FormularioSugestao />
      </div>

      {minhas.length > 0 && (
        <section aria-labelledby="meus-avisos" className="mt-8">
          <h2 id="meus-avisos" className="text-base font-extrabold text-slate-900">
            Seus avisos
          </h2>
          <ul className="mt-3 space-y-2">
            {minhas.map((m) => (
              <li key={m.id} className="card p-4 text-sm">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-bold text-slate-900">{ROTULO_SUGESTAO[m.tipo] ?? m.tipo}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{ROTULO_STATUS[m.status] ?? m.status}</span>
                  <span className="text-xs text-slate-400">
                    {[m.disciplina_nome, m.serie].filter(Boolean).join(" · ")}
                    {m.disciplina_nome || m.serie ? " · " : ""}
                    {new Date(m.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </span>
                </p>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">{m.descricao}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
