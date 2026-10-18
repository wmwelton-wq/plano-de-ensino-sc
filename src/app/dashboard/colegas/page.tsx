import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoTopo from "@/components/navegacao-topo";
import { envioDeEmailAtivo } from "@/lib/email/resend";
import { listarColegas } from "./actions";
import ColegasView from "./colegas-view";

export default async function ColegasPage() {
  const colegas = await listarColegas();
  return (
    <div>
      <NavegacaoTopo
        voltarHref="/dashboard"
        voltarRotulo="Voltar ao início"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Colegas" }]}
      />
      <CabecalhoPagina
        tom="azul"
        ilustracao="anual"
        compacto
        titulo="Colegas"
        subtitulo="Cadastre o e-mail dos professores com quem você divide planos. Na hora de compartilhar, é só escolher o nome e o plano chega por e-mail."
      />
      <div className="mt-6">
        <ColegasView colegas={colegas} emailAtivo={envioDeEmailAtivo()} />
      </div>
    </div>
  );
}
