import { carregarHabilidades } from "@/lib/habilidades";
import { createClient } from "@/lib/supabase/server";
import PlanoFormInfantil from "../../plano-form-infantil";
import { criarPlano } from "../../actions";
import VoltarLink from "../../voltar-link";
import CabecalhoPagina from "@/components/cabecalho-pagina";

export default async function NovoPlanoInfantilPage() {
  const supabase = await createClient();

  const [{ data: camposExperiencia }, { data: escolas }, { data: objetivos }] = await Promise.all([
    supabase.from("disciplinas").select("*").eq("etapa", "Educação Infantil").order("nome"),
    supabase.from("escolas").select("*").order("nome"),
    carregarHabilidades(supabase, "Educação Infantil"),
  ]);

  return (
    <div>
      <VoltarLink href="/dashboard/planos/novo" rotulo="Voltar à escolha da etapa" />
      <div className="mt-2">
        <CabecalhoPagina tom="rosa" icone="coracao" titulo="Novo plano — Educação Infantil" subtitulo="Campos de experiência, por grupo etário. Preencha por etapas; o plano pode ser salvo como rascunho." />
      </div>
      <div className="mt-6">
        <PlanoFormInfantil
          camposExperiencia={camposExperiencia ?? []}
          escolas={escolas ?? []}
          objetivosAprendizagem={objetivos ?? []}
          action={criarPlano}
          textoBotao="Salvar plano"
        />
      </div>
    </div>
  );
}
