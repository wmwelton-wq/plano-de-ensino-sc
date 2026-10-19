import Link from "next/link";
import type { Metadata } from "next";
import Logo from "@/components/logo";
import { Icone } from "@/components/icones";
import Topo from "@/components/landing/topo";
import Revelar from "@/components/landing/revelar";
import SimulacaoPlano from "@/components/landing/simulacao-plano";
import PassosInterativos from "@/components/landing/passos-interativos";
import DemoIA from "@/components/landing/demo-ia";
import RecursosFiltro from "@/components/landing/recursos-filtro";
import ExemploDocumento from "@/components/landing/exemplo-documento";
import VideoDemo from "@/components/landing/video-demo";
import Precos from "@/components/landing/precos";
import "@/components/landing/landing.css";

export const metadata: Metadata = {
  title: "Plano Docente — planos de ensino para professores de Santa Catarina",
  description:
    "Monte planos de ensino anuais e mensais com BNCC e Currículo Catarinense, rascunho do caminho metodológico com IA, calendário escolar e PDF ou Word prontos. Feito para professores da rede estadual de SC.",
};

const CURRICULOS = ["BNCC", "Currículo Base do Território Catarinense", "Currículo de Educação Digital de SC", "Cursos técnicos"];

const DORES = [
  "Abrir a BNCC, o currículo catarinense e o de educação digital — em três abas",
  "Copiar código por código das habilidades, sem errar um número",
  "Formatar tudo no Word até o quadro ficar do jeito certo",
  "Refazer o mesmo plano para cada turma e cada mês",
];

const BENEFICIOS = [
  "Habilidades e competências já cadastradas: é só marcar",
  "Formulário certo para cada etapa, sem formatar nada",
  "Planos mensais gerados a partir do anual",
  "Rascunho do caminho metodológico em segundos",
  "PDF e Word prontos, com a logo da sua escola",
];

const PERGUNTAS = [
  {
    p: "A IA escreve o plano inteiro por mim?",
    r: "Não — e isso é de propósito. A IA ajuda apenas no caminho metodológico, e o texto sempre chega como rascunho no seu editor. Você lê, ajusta, apaga e salva do seu jeito. As decisões pedagógicas continuam sendo suas.",
  },
  {
    p: "O documento segue o formato que a rede estadual pede?",
    r: "Sim. Cada etapa de ensino tem os quadros e campos que o plano exige, e o PDF e o Word saem prontos para entregar, com a logo da sua escola. O Plano Docente é uma ferramenta independente, sem vínculo institucional com a SED/SC.",
  },
  {
    p: "Preciso entender de tecnologia para usar?",
    r: "Não. Cada tela mostra um passo de cada vez, com cores diferentes para cada etapa do plano. Se você sabe preencher um formulário, consegue montar o seu plano.",
  },
  {
    p: "Funciona no celular? Preciso instalar algo?",
    r: "Funciona direto no navegador do computador ou do celular, sem instalar nada. Se quiser, dá para colocar o Plano Docente na tela inicial do celular como um aplicativo.",
  },
  {
    p: "Meus planos e meus dados estão seguros?",
    r: "Cada professor só vê e edita os próprios planos e escolas — essa separação é garantida no banco de dados, não só na tela. A conexão é criptografada e o Aviso de Privacidade explica, em linguagem simples, o que fazemos com seus dados.",
  },
  {
    p: "Posso usar em mais de uma escola e para várias turmas?",
    r: "Pode. Numa mesma conta você cadastra quantas escolas, turmas e componentes precisar, e copia um plano para outras turmas com poucos cliques.",
  },
  {
    p: "Consigo editar no Word depois?",
    r: "Sim. Além do PDF, você baixa o plano em Word para ajustar o que quiser, e também pode imprimir direto do site.",
  },
  {
    p: "Quanto custa e como funciona a assinatura?",
    r: "Os planos Mensal, Semestral e Anual estão sendo finalizados, e os valores serão divulgados nesta página. Crie sua conta para conhecer o aplicativo e acompanhar a abertura das assinaturas.",
  },
];

function Titulo({ etiqueta, children, texto, claro = false }: { etiqueta: string; children: React.ReactNode; texto?: string; claro?: boolean }) {
  return (
    <Revelar className="mx-auto max-w-3xl text-center">
      <span className={claro ? "ld-etiqueta ld-etiqueta-clara" : "ld-etiqueta"}>{etiqueta}</span>
      <h2 className={`mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl ${claro ? "text-white" : "text-slate-900"}`}>{children}</h2>
      {texto && <p className={`mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg ${claro ? "text-blue-100" : "text-slate-600"}`}>{texto}</p>}
    </Revelar>
  );
}

export default function HomePage() {
  return (
    <main className="ld-pagina">
      <a href="#recursos" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:text-primary-800">
        Ir para o conteúdo
      </a>
      <Topo />

      {/* ============ ABERTURA ============ */}
      <section className="ld-hero">
        <div className="ld-blob ld-blob-1" aria-hidden="true" />
        <div className="ld-blob ld-blob-2" aria-hidden="true" />
        <div className="ld-grade" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-5 pb-28 pt-32 sm:pt-36 lg:grid-cols-[1.02fr_0.98fr] lg:pb-32">
          <div>
            <p className="ld-chip-hero">
              <Icone nome="escola" className="h-4 w-4" />
              Feito para professores da rede estadual de Santa Catarina
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
              Seu plano de ensino pronto <span className="ld-texto-brilho">em minutos</span>, não em noites de domingo.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-blue-100">
              Escolha a turma, marque as habilidades da BNCC e do Currículo Catarinense e deixe o Plano Docente montar o plano anual, os mensais e até um rascunho do caminho metodológico. Você revisa, ajusta do seu jeito e baixa em PDF ou Word.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/cadastro" className="ld-btn-cta">
                Criar minha conta
                <Icone nome="setaDireita" className="h-5 w-5" espessura={2.4} />
              </Link>
              <a href="#como-funciona" className="ld-btn-fantasma !px-7 !py-3.5 !text-base">
                Ver como funciona
              </a>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-blue-100/90">
              {["Sem instalar nada", "Funciona no celular", "Seus planos são só seus"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Icone nome="check" className="h-4 w-4 text-emerald-300" espessura={2.8} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:pl-4">
            <SimulacaoPlano />
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-2 px-5 py-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200/80">Baseado em</span>
            {CURRICULOS.map((c) => (
              <span key={c} className="ld-chip-curriculo">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ NÚMEROS QUE SÃO FATOS ============ */}
      <section className="relative z-10 -mt-10 px-5">
        <Revelar>
          <dl className="mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 shadow-xl shadow-blue-900/10 lg:grid-cols-4">
            {[
              ["azul", "4", "etapas de ensino, cada uma com o seu formulário"],
              ["verde", "3", "currículos oficiais já cadastrados"],
              ["violeta", "PDF + Word", "e impressão, no formato da rede"],
              ["ambar", "0", "instalação: abre direto no navegador"],
            ].map(([tom, valor, rotulo]) => (
              <div key={rotulo} data-tom={tom} className="bg-white p-5 text-center sm:p-6">
                <dt className="text-3xl font-extrabold tracking-tight [color:var(--tom)] sm:text-4xl">{valor}</dt>
                <dd className="mt-1.5 text-sm leading-snug text-slate-600">{rotulo}</dd>
              </div>
            ))}
          </dl>
        </Revelar>
      </section>

      {/* ============ O PROBLEMA ============ */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <Titulo etiqueta="Você já viveu isso" texto="Domingo à noite, três abas abertas, um modelo em branco e o relógio correndo. O difícil nunca foi pensar a aula — é tudo o que vem antes dela.">
            O plano de ensino não precisa tomar o seu fim de semana
          </Titulo>
          <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
            <Revelar>
              <div className="h-full rounded-3xl border border-rose-200 bg-rose-50/60 p-7 sm:p-8">
                <p className="text-sm font-extrabold uppercase tracking-wide text-rose-700">Do jeito antigo</p>
                <ul className="mt-5 space-y-4">
                  {DORES.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-slate-700">
                      <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-rose-100 text-rose-600">
                        <Icone nome="fechar" className="h-3.5 w-3.5" espessura={2.8} />
                      </span>
                      <span className="leading-relaxed">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Revelar>
            <Revelar atraso={120}>
              <div className="ld-cartao-bom h-full rounded-3xl p-7 sm:p-8">
                <p className="text-sm font-extrabold uppercase tracking-wide text-emerald-100">Com o Plano Docente</p>
                <ul className="mt-5 space-y-4">
                  {BENEFICIOS.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-white">
                      <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/20 text-white">
                        <Icone nome="check" className="h-3.5 w-3.5" espessura={3} />
                      </span>
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-white/25 pt-5 text-sm text-emerald-50">Menos tempo formatando. Mais tempo pensando na sua turma.</p>
              </div>
            </Revelar>
          </div>
        </div>
      </section>

      {/* ============ COMO FUNCIONA ============ */}
      <section id="como-funciona" className="scroll-mt-20 border-y border-slate-200 bg-white px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <Titulo etiqueta="Como funciona" texto="Quatro passos, na ordem em que você já pensa. Clique em cada um para ver como é por dentro.">
            Da turma ao documento pronto, sem se perder no caminho
          </Titulo>
          <Revelar className="mt-14">
            <PassosInterativos />
          </Revelar>
        </div>
      </section>

      {/* ============ IA ============ */}
      <section id="ia" className="ld-secao-escura scroll-mt-20 px-5 py-24">
        <div className="ld-blob ld-blob-3" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Revelar>
            <span className="ld-etiqueta ld-etiqueta-clara">
              <Icone nome="sparkle" className="h-3.5 w-3.5" /> Caminho metodológico com IA
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">A página em branco acaba aqui</h2>
            <p className="mt-4 text-lg leading-relaxed text-blue-100">
              Você diz como quer o texto — por semana ou por aula, e quantas — e recebe um rascunho escrito no tempo certo: o que <strong className="text-white">será feito</strong> em sala.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                ["Semana ou aula, do seu jeito", "Até 5 semanas ou até 16 aulas, na quantidade que você escolher."],
                ["Sempre no futuro", "“Será realizada…”, “Serão apresentados…” — nunca no infinitivo solto."],
                ["Conferido automaticamente", "Se faltar alguma parte, o sistema pede o que ficou de fora."],
                ["Você tem a palavra final", "É um rascunho no seu editor: leia, edite e salve."],
              ].map(([t, d]) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                    <Icone nome="check" className="h-3.5 w-3.5" espessura={3} />
                  </span>
                  <span className="text-blue-100">
                    <strong className="text-white">{t}.</strong> {d}
                  </span>
                </li>
              ))}
            </ul>
          </Revelar>
          <Revelar atraso={120}>
            <DemoIA />
          </Revelar>
        </div>
      </section>

      {/* ============ RECURSOS ============ */}
      <section id="recursos" className="scroll-mt-20 px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <Titulo etiqueta="Tudo em um só lugar" texto="Do currículo ao envio para a coordenação: o que você precisa para planejar com tranquilidade, no mesmo aplicativo.">
            Menos ferramentas soltas, mais tempo para ensinar
          </Titulo>
          <Revelar className="mt-12">
            <RecursosFiltro />
          </Revelar>
        </div>
      </section>

      {/* ============ EXEMPLO DO DOCUMENTO ============ */}
      <section id="exemplo" className="scroll-mt-20 border-y border-slate-200 bg-white px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <Titulo etiqueta="Veja como fica" texto="O mesmo tipo de quadro e de campos do plano exportado, com habilidades da BNCC na íntegra. Os exemplos usam escolas e dados fictícios.">
            O documento que sai do Plano Docente
          </Titulo>
          <Revelar className="mt-12">
            <ExemploDocumento />
          </Revelar>
        </div>
      </section>

      {/* ============ VÍDEO ============ */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-4xl">
          <Titulo etiqueta="Veja funcionando" texto="Um passeio rápido pelo aplicativo, do cadastro da escola até o PDF pronto.">
            Em poucos minutos você entende tudo
          </Titulo>
          <Revelar className="mt-10">
            <VideoDemo />
          </Revelar>
        </div>
      </section>

      {/* ============ PLANOS ============ */}
      <section id="planos" className="ld-secao-planos scroll-mt-20 px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <Titulo etiqueta="Planos" texto="Escolha o período que combina com a sua rotina. Os valores estão sendo finalizados e serão divulgados aqui.">
            Um investimento pequeno perto das horas que você ganha de volta
          </Titulo>
          <div className="mt-14">
            <Precos />
          </div>
          <Revelar className="mt-8">
            <p className="mx-auto flex max-w-2xl items-start justify-center gap-2 text-center text-sm text-slate-500">
              <Icone nome="cadeado" className="mt-0.5 h-4 w-4 flex-none" />
              Todos os planos incluem os mesmos currículos e as mesmas etapas de ensino. Seus dados ficam protegidos e só você acessa os seus planos.
            </p>
          </Revelar>
        </div>
      </section>

      {/* ============ PERGUNTAS ============ */}
      <section id="perguntas" className="scroll-mt-20 border-y border-slate-200 bg-white px-5 py-24">
        <div className="mx-auto max-w-3xl">
          <Titulo etiqueta="Perguntas frequentes">O que os professores perguntam antes de começar</Titulo>
          <div className="mt-12 space-y-3">
            {PERGUNTAS.map((item, i) => (
              <Revelar key={item.p} atraso={Math.min(i, 4) * 40}>
                <details className="ld-faq">
                  <summary>
                    {item.p}
                    <span className="ld-faq-seta" aria-hidden="true">
                      <Icone nome="mais" className="h-4 w-4" espessura={2.6} />
                    </span>
                  </summary>
                  <p>{item.r}</p>
                </details>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CHAMADA FINAL ============ */}
      <section className="ld-hero ld-final px-5 py-24">
        <div className="ld-blob ld-blob-1" aria-hidden="true" />
        <div className="ld-blob ld-blob-2" aria-hidden="true" />
        <Revelar className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">Seu próximo plano pode estar pronto antes do café esfriar.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-blue-100">Crie sua conta, cadastre sua escola e monte o primeiro plano ainda hoje. O domingo agradece.</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/cadastro" className="ld-btn-cta">
              Criar minha conta
              <Icone nome="setaDireita" className="h-5 w-5" espessura={2.4} />
            </Link>
            <Link href="/login" className="ld-btn-fantasma !px-7 !py-3.5 !text-base">
              Já tenho conta
            </Link>
          </div>
        </Revelar>
      </section>

      {/* ============ RODAPÉ ============ */}
      <footer className="bg-slate-950 px-5 py-12 text-slate-400">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <span className="ld-logo-topo"><Logo /></span>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">Planos de ensino para professores de Santa Catarina — do currículo ao PDF, sem perder o domingo.</p>
          </div>
          <nav aria-label="Rodapé" className="text-sm">
            <p className="font-bold text-slate-200">Navegue</p>
            <ul className="mt-3 space-y-2">
              {[["#recursos", "Recursos"], ["#como-funciona", "Como funciona"], ["#planos", "Planos"], ["#perguntas", "Perguntas"]].map(([h, t]) => (
                <li key={h}><a href={h} className="hover:text-white">{t}</a></li>
              ))}
            </ul>
          </nav>
          <div className="text-sm">
            <p className="font-bold text-slate-200">Fale com a gente</p>
            <ul className="mt-3 space-y-2">
              <li><a href="mailto:contato@planodocente.com.br" className="hover:text-white">contato@planodocente.com.br</a></li>
              <li><Link href="/termos-de-uso" className="hover:text-white">Termos de Uso</Link></li>
              <li><Link href="/privacidade" className="hover:text-white">Aviso de Privacidade</Link></li>
            </ul>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-xs leading-relaxed">
          © Plano Docente. Ferramenta independente, sem vínculo, parceria ou chancela institucional com a Secretaria de Estado da Educação de Santa Catarina (SED/SC).
        </p>
      </footer>
    </main>
  );
}
