import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoTopo from "@/components/navegacao-topo";
import { Icone } from "@/components/icones";
import NomeForm from "./nome-form";
import SenhaForm from "./senha-form";
import ExcluirConta from "./excluir-conta";

export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: professor }, { data: ehAdmin }] = await Promise.all([supabase.from("professores").select("nome").eq("id", user.id).single(), supabase.rpc("eh_admin")]);
  const nome = professor?.nome ?? "";
  const desde = user.created_at
    ? new Date(user.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" })
    : null;

  return (
    <div>
      <NavegacaoTopo
        voltarHref="/dashboard"
        voltarRotulo="Voltar ao início"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Configurações da conta" }]}
      />
      <CabecalhoPagina
        tom="violeta"
        ilustracao="conta"
        titulo="Configurações da conta"
        subtitulo="Seus dados, sua senha e as informações de privacidade."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="dados-titulo">
          <div className="flex items-center gap-3">
            <span data-tom="violeta" className="flex h-11 w-11 items-center justify-center rounded-2xl [background:var(--tom-claro)] [color:var(--tom)]" aria-hidden="true">
              <Icone nome="pessoa" className="h-5 w-5" />
            </span>
            <h2 id="dados-titulo" className="text-lg font-extrabold tracking-tight text-slate-900">
              Seus dados
            </h2>
          </div>
          <NomeForm nomeInicial={nome} email={user.email ?? ""} />
          {desde && <p className="mt-4 text-xs text-slate-500">Conta criada em {desde}.</p>}
        </section>

        <section className="card p-6" aria-labelledby="senha-titulo">
          <div className="flex items-center gap-3">
            <span data-tom="azul" className="flex h-11 w-11 items-center justify-center rounded-2xl [background:var(--tom-claro)] [color:var(--tom)]" aria-hidden="true">
              <Icone nome="cadeado" className="h-5 w-5" />
            </span>
            <h2 id="senha-titulo" className="text-lg font-extrabold tracking-tight text-slate-900">
              Alterar senha
            </h2>
          </div>
          <SenhaForm />
        </section>

        {ehAdmin === true && (
          <section className="card p-6 lg:col-span-2" aria-labelledby="duas-etapas-titulo">
            <div className="flex items-center gap-3">
              <span data-tom="violeta" className="flex h-11 w-11 items-center justify-center rounded-2xl [background:var(--tom-claro)] [color:var(--tom)]" aria-hidden="true">
                <Icone nome="documento" className="h-5 w-5" />
              </span>
              <h2 id="duas-etapas-titulo" className="text-lg font-extrabold tracking-tight text-slate-900">
                Verificação em duas etapas
              </h2>
            </div>
            <p className="mt-3 text-sm text-slate-600">Proteja a conta de administração com app autenticador, código por e-mail ou chave de segurança USB.</p>
            <div className="mt-4">
              <Link href="/dashboard/conta/seguranca" className="btn-azul-suave">
                Configurar duas etapas
              </Link>
            </div>
          </section>
        )}

        <section className="card p-6 lg:col-span-2" aria-labelledby="privacidade-titulo">
          <div className="flex items-center gap-3">
            <span data-tom="verde" className="flex h-11 w-11 items-center justify-center rounded-2xl [background:var(--tom-claro)] [color:var(--tom)]" aria-hidden="true">
              <Icone nome="documento" className="h-5 w-5" />
            </span>
            <h2 id="privacidade-titulo" className="text-lg font-extrabold tracking-tight text-slate-900">
              Privacidade e ajuda
            </h2>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Para pedir uma cópia dos seus dados ou corrigir alguma informação, escreva para{" "}
            <a href="mailto:contato@planodocente.com.br" className="link-primary">
              contato@planodocente.com.br
            </a>
            . Para excluir sua conta, use a seção &ldquo;Excluir conta&rdquo; logo abaixo.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/termos-de-uso" className="btn-azul-suave">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="btn-azul-suave">
              Aviso de Privacidade
            </Link>
            <Link href="/dashboard/ajuda" className="btn-azul-suave">
              Central de ajuda
            </Link>
          </div>
        </section>
        {ehAdmin !== true && (
          <section className="card p-6 lg:col-span-2" aria-labelledby="excluir-titulo">
            <div className="flex items-center gap-3">
              <span data-tom="violeta" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600" aria-hidden="true">
                <Icone nome="documento" className="h-5 w-5" />
              </span>
              <h2 id="excluir-titulo" className="text-lg font-extrabold tracking-tight text-slate-900">
                Excluir conta
              </h2>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Se não quiser mais usar o Plano Docente, você pode excluir sua conta. Todos os seus dados serão apagados e pode não haver reembolso
              de valores pagos. Para confirmar, enviamos um código de segurança para o seu e-mail.
            </p>
            <ExcluirConta email={user.email ?? ""} />
          </section>
        )}
      </div>
    </div>
  );
}
