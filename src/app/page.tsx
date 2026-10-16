import Link from "next/link";
import { Icone, type NomeIcone } from "@/components/icones";

const recursos = [
  {
    icone: "livro" as NomeIcone,
    tom: "azul",
    titulo: "Alinhado à BNCC e ao Currículo Catarinense",
    descricao:
      "Escolha habilidades e competências já cadastradas por disciplina, etapa e curso técnico — sem digitar código por código.",
  },
  {
    icone: "graduacao" as NomeIcone,
    tom: "violeta",
    titulo: "Um formulário certo para cada etapa",
    descricao:
      "Educação Infantil, Fundamental (Anos Iniciais e Finais) e Médio/Técnico têm os quadros exigidos para cada realidade.",
  },
  {
    icone: "imprimir" as NomeIcone,
    tom: "verde",
    titulo: "PDF pronto para imprimir ou compartilhar",
    descricao:
      "Gere o plano no formato da SED/SC, com a logo da sua escola e do Estado, em poucos cliques.",
  },
  {
    icone: "cadeado" as NomeIcone,
    tom: "ardosia",
    titulo: "Seus planos, só seus",
    descricao:
      "Cada professor só acessa os próprios planos e escolas — isolamento de dados de ponta a ponta, do banco à tela.",
  },
];

const passos = [
  {
    numero: "1",
    tom: "ambar",
    titulo: "Cadastre escola e disciplina",
    descricao: "Uma vez só — reaproveite nome, município e logo em todos os planos seguintes.",
  },
  {
    numero: "2",
    tom: "azul",
    titulo: "Monte o plano em minutos",
    descricao: "Selecione habilidades e competências da BNCC já cadastradas, por etapa e componente.",
  },
  {
    numero: "3",
    tom: "verde",
    titulo: "Exporte o PDF oficial",
    descricao: "Baixe, imprima ou compartilhe — pronto no formato exigido pela Secretaria de Educação.",
  },
];

const perguntas = [
  {
    pergunta: "É gratuito?",
    resposta: "Sim. Crie sua conta e monte seus planos de ensino sem custo.",
  },
  {
    pergunta: "Meus dados e meus planos estão seguros?",
    resposta:
      "Sim. Cada professor só vê e edita os próprios planos e escolas — isso é garantido no próprio banco de dados, não só na tela. A conexão é criptografada de ponta a ponta.",
  },
  {
    pergunta: "Preciso instalar algo?",
    resposta: "Não. É um site — funciona no navegador do computador ou do celular, sem instalação.",
  },
  {
    pergunta: "Serve para qualquer etapa de ensino?",
    resposta:
      "Sim: Educação Infantil, Ensino Fundamental (Anos Iniciais e Finais) e Ensino Médio/Cursos Técnicos, cada um com o formulário certo para a etapa.",
  },
];

export default function HomePage() {
  return (
    <main className="bg-[var(--background)]">
      {/* TOPO */}
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <span className="flex items-center gap-2.5 font-bold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-800 text-white">
              <Icone nome="livro" className="h-5 w-5" />
            </span>
            Planos de Ensino SC
          </span>
          <nav className="flex items-center gap-2">
            <Link href="/login" className="btn-secondary !py-2">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn-primary !py-2">
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-slate-300 bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-800">
              <Icone nome="escola" className="h-4 w-4" />
              Para professores da rede estadual de Santa Catarina
            </p>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Pare de perder horas formatando plano de ensino
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Monte planos anuais e mensais alinhados à BNCC e ao Currículo Catarinense, com a logo da sua escola, prontos para imprimir — em minutos, não em noites de fim de semana.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/cadastro" className="btn-primary px-7 py-3 text-base">
                Criar minha conta gratuita
              </Link>
              <Link href="/login" className="btn-secondary px-7 py-3 text-base">
                Já tenho conta
              </Link>
            </div>
          </div>

          {/* Etapas do plano, cada uma na sua cor (as mesmas do sistema) */}
          <div className="rounded-xl border border-slate-300 bg-[var(--background)] p-5" aria-hidden="true">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Plano anual, etapa por etapa</p>
            <ol className="mt-3 space-y-2">
              {[
                ["ardosia", "pessoa", "Identificação"],
                ["azul", "livro", "Ementa"],
                ["ciano", "globo", "Competências gerais"],
                ["violeta", "bussola", "Competências específicas"],
                ["verde", "unidade", "1º trimestre"],
                ["ambar", "criterios", "2º trimestre"],
                ["rosa", "lapis", "3º trimestre"],
              ].map(([tom, icone, rotulo]) => (
                <li key={rotulo} data-tom={tom} className="flex items-center gap-3 rounded-lg border border-slate-300 border-l-4 bg-white px-3 py-2 [border-left-color:var(--tom)]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md [background:var(--tom-claro)] [color:var(--tom)]">
                    <Icone nome={icone as NomeIcone} className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{rotulo}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-6 pb-12 sm:grid-cols-4">
          {[
            ["azul", "BNCC", "Habilidades e competências já cadastradas"],
            ["verde", "4", "Etapas de ensino cobertas"],
            ["ambar", "0", "Instalação necessária"],
            ["violeta", "Grátis", "Para começar"],
          ].map(([tom, valor, rotulo]) => (
            <div key={rotulo} data-tom={tom} className="rounded-lg border border-slate-300 border-t-4 bg-white p-4 [border-top-color:var(--tom)]">
              <dt className="text-2xl font-extrabold [color:var(--tom)]">{valor}</dt>
              <dd className="mt-1 text-sm text-slate-600">{rotulo}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* RECURSOS */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Tudo o que você precisa para planejar com tranquilidade</h2>
            <p className="mt-3 text-slate-600">Menos tempo formatando documento, mais tempo planejando aula.</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {recursos.map((recurso) => (
              <div key={recurso.titulo} data-tom={recurso.tom} className="card border-l-4 p-6 [border-left-color:var(--tom)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg [background:var(--tom-claro)] [color:var(--tom)]">
                  <Icone nome={recurso.icone} className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">{recurso.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{recurso.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="border-y border-slate-300 bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Do zero ao PDF em 3 passos</h2>
          <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {passos.map((passo) => (
              <li key={passo.numero} data-tom={passo.tom} className="rounded-lg border border-slate-300 border-t-4 bg-[var(--background)] p-5 [border-top-color:var(--tom)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white [background:var(--tom)]">{passo.numero}</span>
                <h3 className="mt-4 font-bold text-slate-900">{passo.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{passo.descricao}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SEGURANÇA / CONFIANÇA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl rounded-xl border border-slate-300 border-l-4 bg-white p-8 [border-left-color:var(--tom-ardosia)] sm:p-10">
          <div className="grid grid-cols-1 items-center gap-10 sm:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-md bg-[var(--tom-ardosia-claro)] px-3 py-1 text-xs font-bold text-[var(--tom-ardosia)]">
                <Icone nome="cadeado" className="h-4 w-4" />
                Privacidade por padrão
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Seus planos são só seus</h2>
              <p className="mt-3 text-slate-600">
                Nenhum professor acessa os planos ou escolas de outro professor — essa separação é garantida diretamente no banco de dados, não apenas escondida na tela. A conexão com o site é sempre criptografada.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-slate-700">
              {[
                "Isolamento de dados por usuário, de ponta a ponta",
                "Conexão sempre criptografada (HTTPS)",
                "Senhas protegidas com criptografia forte",
                "Verificação anti-robô na criação de conta e login",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md bg-[var(--tom-verde-claro)] text-[var(--tom-verde)]">
                    <Icone nome="check" className="h-3.5 w-3.5" espessura={2.5} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-300 bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Perguntas frequentes</h2>
          <div className="mt-8 space-y-3">
            {perguntas.map((item) => (
              <div key={item.pergunta} data-tom="ciano" className="card border-l-4 p-5 [border-left-color:var(--tom)]">
                <p className="font-bold text-slate-900">{item.pergunta}</p>
                <p className="mt-1.5 text-sm text-slate-600">{item.resposta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-primary-900 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Seu próximo plano de ensino pode estar pronto em minutos</h2>
          <p className="mt-4 text-primary-100">Crie sua conta gratuita agora e monte o primeiro plano ainda hoje.</p>
          <div className="mt-8">
            <Link href="/cadastro" className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-semibold text-primary-900 transition hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900">
              Criar minha conta gratuita
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-300 bg-white px-6 py-6 text-center text-sm text-slate-500">
        Planos de Ensino SC — uso pessoal de professores da rede estadual de Santa Catarina.
        <span className="mx-2" aria-hidden="true">·</span>
        <Link href="/termos-de-uso" className="link-primary text-sm">Termos de Uso</Link>
        <span className="mx-2" aria-hidden="true">·</span>
        <Link href="/privacidade" className="link-primary text-sm">Aviso de Privacidade</Link>
      </footer>
    </main>
  );
}
