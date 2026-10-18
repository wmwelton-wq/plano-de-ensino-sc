import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EscolaForm from "../escola-form";
import { atualizarEscola, excluirEscola } from "../actions";
import ExcluirButton from "./excluir-button";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoTopo from "@/components/navegacao-topo";

export default async function EditarEscolaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: escola } = await supabase.from("escolas").select("*").eq("id", id).single();

  if (!escola) {
    notFound();
  }

  const atualizarComId = atualizarEscola.bind(null, id);
  const excluirComId = excluirEscola.bind(null, id);

  return (
    <div>
      <NavegacaoTopo
        voltarHref="/dashboard/escolas"
        voltarRotulo="Voltar às minhas escolas"
        migalhas={[
          { rotulo: "Início", href: "/dashboard" },
          { rotulo: "Escolas", href: "/dashboard/escolas" },
          { rotulo: escola.nome },
        ]}
      />
      <CabecalhoPagina
        tom="ambar"
        ilustracao="escola" compacto
        titulo="Editar escola"
        subtitulo={escola.nome}
        acoes={<ExcluirButton excluirAction={excluirComId} />}
      />
      <div className="card mt-6 max-w-lg p-6">
        <EscolaForm escola={escola} action={atualizarComId} textoBotao="Salvar alterações" />
      </div>
    </div>
  );
}
