import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import VoltarLink from "../../../planos/voltar-link";
import MensalForm from "./mensal-form";
import { gerarMensaisDoAnual } from "../../actions";
import { normalizarDados } from "@/lib/plano-anual";

export default async function MensalDoAnualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("planos_anuais").select("*").eq("id", id).single();
  if (!data) notFound();
  const plano = data as { titulo: string; ano_letivo: number } & Record<string, unknown>;
  const dados = normalizarDados(data as Parameters<typeof normalizarDados>[0]);

  return (
    <div>
      <VoltarLink href={`/dashboard/anual/${id}`} rotulo="Voltar ao plano" />
      <div className="mt-2">
        <CabecalhoPagina
          tom="verde"
          icone="calendario"
          titulo="Gerar planos mensais a partir deste plano anual"
          subtitulo={
            <>
              Plano anual: <strong>{plano.titulo}</strong>
            </>
          }
        />
      </div>
      <div className="mt-6">
        <MensalForm
          ano={plano.ano_letivo}
          resumo={dados.trimestres.map((t) => ({ habilidades: t.habilidades.length, objetos: t.objetos.length }))}
          action={gerarMensaisDoAnual.bind(null, id)}
        />
      </div>
    </div>
  );
}
