import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoTopo from "@/components/navegacao-topo";
import EscolaForm from "../escola-form";
import { criarEscola } from "../actions";

export default function NovaEscolaPage() {
  return (
    <div>
      <NavegacaoTopo
        voltarHref="/dashboard/escolas"
        voltarRotulo="Voltar às minhas escolas"
        migalhas={[
          { rotulo: "Início", href: "/dashboard" },
          { rotulo: "Escolas", href: "/dashboard/escolas" },
          { rotulo: "Nova escola" },
        ]}
      />
      <CabecalhoPagina tom="ambar" icone="escola" titulo="Nova escola" subtitulo="Informe o nome, o município e, se quiser, a logo." />
      <div className="card mt-6 max-w-lg p-6">
        <EscolaForm action={criarEscola} textoBotao="Salvar escola" />
      </div>
    </div>
  );
}
