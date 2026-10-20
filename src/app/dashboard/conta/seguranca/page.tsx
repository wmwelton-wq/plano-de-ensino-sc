import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { chaveSecretaConfigurada } from "@/lib/supabase/admin";
import { envioDeEmailAtivo } from "@/lib/email/resend";
import { resumoSegundaEtapa } from "@/lib/segundo-fator";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoTopo from "@/components/navegacao-topo";
import SegurancaForm from "./seguranca-form";

export const metadata = { title: "Plano Docente — Verificação em duas etapas", robots: { index: false } };

export default async function SegurancaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Só a conta de administração usa a verificação em duas etapas (eh_admin já exige a segunda etapa quando ativada).
  const { data: ehAdmin } = await supabase.rpc("eh_admin");
  if (ehAdmin !== true) redirect("/dashboard/conta");

  const servidorPronto = chaveSecretaConfigurada();
  const resumo = servidorPronto ? await resumoSegundaEtapa() : null;
  const chaves = resumo && resumo.ok ? resumo.chaves : [];
  const emailAtivo = resumo && resumo.ok ? resumo.emailAtivo : false;

  return (
    <div>
      <NavegacaoTopo
        voltarHref="/dashboard/conta"
        voltarRotulo="Voltar às configurações"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Configurações da conta", href: "/dashboard/conta" }, { rotulo: "Verificação em duas etapas" }]}
      />
      <CabecalhoPagina tom="violeta" ilustracao="conta" titulo="Verificação em duas etapas" subtitulo="Proteja a conta de administração com app autenticador, código por e-mail ou chave de segurança." />
      <SegurancaForm servidorPronto={servidorPronto} emailEnvioPronto={envioDeEmailAtivo()} emailDaConta={user.email ?? ""} chavesIniciais={chaves} emailAtivoInicial={emailAtivo} />
    </div>
  );
}
