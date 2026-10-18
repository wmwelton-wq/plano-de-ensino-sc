import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import VoltarLink from "../../../planos/voltar-link";
import DuplicarForm from "./duplicar-form";
import { duplicarPlanoAnual } from "../../actions";

export default async function DuplicarPlanoAnualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: plano }, { data: escolas }] = await Promise.all([
    supabase.from("planos_anuais").select("id, titulo, turma, escola_id, ano_letivo, componente").eq("id", id).single(),
    supabase.from("escolas").select("id, nome, municipio").order("nome"),
  ]);
  if (!plano) notFound();
  const p = plano as { titulo: string; turma: string | null; escola_id: string | null; ano_letivo: number };

  return (
    <div>
      <VoltarLink href={`/dashboard/anual/${id}`} rotulo="Voltar ao plano" />
      <div className="mt-2">
        <CabecalhoPagina
          tom="azul"
          ilustracao="anual" compacto
          titulo="Duplicar plano anual para outra turma"
          subtitulo={
            <>
              Plano de origem: <strong>{p.titulo}</strong>
            </>
          }
        />
      </div>
      <div className="mt-6">
        <DuplicarForm
          escolas={(escolas ?? []) as { id: string; nome: string; municipio: string }[]}
          escolaInicial={p.escola_id}
          anoInicial={p.ano_letivo}
          turmaOrigem={p.turma}
          action={duplicarPlanoAnual.bind(null, id)}
        />
      </div>
    </div>
  );
}
