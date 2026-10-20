import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { chaveSecretaConfigurada } from "@/lib/supabase/admin";
import { envioDeEmailAtivo } from "@/lib/email/resend";
import AuthLayout from "@/components/auth-layout";
import VerificarForm from "./verificar-form";

export const metadata: Metadata = { title: "Plano Docente — Verificação em duas etapas", robots: { index: false } };

export default async function Verificar2faPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.rpc("segundo_fator_estado");
  const estado = data as { exigido?: boolean; ok?: boolean; metodos?: { totp?: boolean; chave?: boolean; email?: boolean } } | null;
  if (!estado || !estado.exigido || estado.ok) redirect("/dashboard");

  const servidorPronto = chaveSecretaConfigurada();
  return (
    <AuthLayout
      voltarHref="/"
      voltarRotulo="Voltar ao site"
      ilustracao="login"
      titulo="Mais uma etapa de segurança"
      texto="Sua conta tem a verificação em duas etapas ativada. Confirme que é você para continuar."
      topicos={["Protege seu acesso mesmo se alguém descobrir sua senha", "Use o app autenticador, o código por e-mail ou a chave de segurança"]}
    >
      <VerificarForm
        totp={estado.metodos?.totp === true}
        chave={estado.metodos?.chave === true && servidorPronto}
        email={estado.metodos?.email === true && servidorPronto && envioDeEmailAtivo()}
        emailConfiguradoMasIndisponivel={estado.metodos?.email === true && !(servidorPronto && envioDeEmailAtivo())}
      />
    </AuthLayout>
  );
}
