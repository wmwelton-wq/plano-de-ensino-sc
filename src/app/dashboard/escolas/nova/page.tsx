import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoTopo from "@/components/navegacao-topo";
import EscolaForm from "../escola-form";
import { criarEscola } from "../actions";
import { rotuloVoltar, voltarSeguro } from "@/lib/voltar";

export default async function NovaEscolaPage({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const { voltar: voltarParam } = await searchParams;
  const voltar = voltarSeguro(voltarParam);
  return (
    <div>
      <NavegacaoTopo
        voltarHref={voltar ?? "/dashboard/escolas"}
        voltarRotulo={voltar ? rotuloVoltar(voltar) : "Voltar às minhas escolas"}
        migalhas={[
          { rotulo: "Início", href: "/dashboard" },
          { rotulo: "Escolas", href: "/dashboard/escolas" },
          { rotulo: "Nova escola" },
        ]}
      />
      <CabecalhoPagina tom="ambar" ilustracao="escola" titulo="Nova escola" subtitulo="Informe o nome, o município e, se quiser, a logo." />
      <div className="card mt-6 max-w-lg p-6">
        <EscolaForm action={criarEscola} textoBotao="Salvar escola" voltar={voltar ?? undefined} />
      </div>
    </div>
  );
}
