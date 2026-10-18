import { createClient } from "@/lib/supabase/server";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import VoltarLink from "../../planos/voltar-link";
import PlanoAnualComRascunho from "../form-com-rascunho";
import { criarPlanoAnual } from "../actions";

export default async function NovoPlanoAnualPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: disciplinas }, { data: escolas }, { data: professor }] = await Promise.all([
    supabase.from("disciplinas").select("id, nome, area, etapa").order("nome"),
    supabase.from("escolas").select("*").order("nome"),
    user
      ? supabase.from("professores").select("nome").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div>
      <VoltarLink href="/dashboard/meus-planos/anuais" rotulo="Voltar aos planos anuais" />
      <div className="mt-2">
        <CabecalhoPagina
          tom="azul"
          ilustracao="novoPlano" compacto
          titulo="Novo plano de ensino anual"
          subtitulo="Feito uma vez por ano: identificação, ementa, competências e os três trimestres, passo a passo."
        />
      </div>
      <div className="mt-6">
        <PlanoAnualComRascunho
          chave="anual:novo"
          escolas={escolas ?? []}
          disciplinas={disciplinas ?? []}
          nomeProfessor={(professor as { nome?: string } | null)?.nome ?? ""}
          action={criarPlanoAnual}
          textoBotao="Salvar plano anual"
        />
      </div>
    </div>
  );
}
