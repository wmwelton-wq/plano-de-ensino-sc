import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BarraAcoesPlano from "./barra-acoes-plano";
import AutoAcao from "./auto-acao";
import ImpressaoPaginada from "./impressao-paginada";
import { ESTILO_TEXTO_PLANO } from "@/lib/estilo-plano";
import { ehHtml, sanitizarHtml } from "@/lib/texto-rico";
import type { HabilidadeManual } from "@/lib/database.types";

function linhas(texto: string | null): string[] {
  if (!texto) return [];
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function referenciasOficiais(etapa: string, usarCurriculoDigital: boolean): string[] {
  const ehFundamentalOuInfantil =
    etapa === "educacao_infantil" ||
    etapa === "fundamental_anos_iniciais" ||
    etapa === "fundamental_anos_finais";

  const refs = [
    "BRASIL. Ministério da Educação. Base Nacional Comum Curricular (BNCC). Brasília: MEC, 2018.",
    ehFundamentalOuInfantil
      ? "SANTA CATARINA. Secretaria de Estado da Educação. Currículo Base da Educação Infantil e do Ensino Fundamental do Território Catarinense. Florianópolis: SED/SC, 2019."
      : "SANTA CATARINA. Secretaria de Estado da Educação. Currículo Catarinense. Florianópolis: SED/SC, 2019.",
  ];
  if (usarCurriculoDigital) {
    refs.push(
      "SANTA CATARINA. Secretaria de Estado da Educação. Currículo de Educação Digital de Santa Catarina. Florianópolis: SED/SC."
    );
  }
  return refs;
}

function formatarData(data: string | null): string {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

export default async function VisualizarPlanoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  const { id } = await params;
  const { auto } = await searchParams;
  const supabase = await createClient();

  const { data: plano } = await supabase.from("planos_de_ensino").select("*").eq("id", id).single();

  if (!plano) {
    notFound();
  }

  const ehAnosIniciais = plano.etapa === "fundamental_anos_iniciais";
  // Modelo oficial dos Anos Iniciais é em paisagem; as demais etapas saem em retrato.
  const paisagem = ehAnosIniciais;

  const [
    { data: professor },
    { data: disciplina },
    { data: curso },
    { data: escola },
    { data: vinculos },
    { data: vinculosCompetencias },
    { data: planoDisciplinas },
  ] = await Promise.all([
    supabase.from("professores").select("nome").eq("id", plano.professor_id).single(),
    plano.disciplina_id
      ? supabase.from("disciplinas").select("*").eq("id", plano.disciplina_id).single()
      : Promise.resolve({ data: null }),
    plano.curso_tecnico_id
      ? supabase.from("cursos_tecnicos").select("*").eq("id", plano.curso_tecnico_id).single()
      : Promise.resolve({ data: null }),
    plano.escola_id
      ? supabase.from("escolas").select("*").eq("id", plano.escola_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("planos_habilidades").select("habilidade_id").eq("plano_id", id),
    supabase.from("planos_competencias").select("competencia_id").eq("plano_id", id),
    ehAnosIniciais
      ? supabase.from("planos_disciplinas").select("disciplina_id, disciplinas(nome)").eq("plano_id", id)
      : Promise.resolve({ data: null }),
  ]);

  const habilidadeIds = (vinculos ?? []).map((v) => v.habilidade_id);
  const { data: habilidadesTodas } =
    habilidadeIds.length > 0
      ? await supabase.from("habilidades_curriculares").select("*").in("id", habilidadeIds)
      : { data: [] as { id: string; codigo: string | null; descricao: string; fonte: string }[] };

  const habilidadesCurriculo = (habilidadesTodas ?? []).filter(
    (h) => h.fonte !== "curriculo_educacao_digital"
  );
  // Habilidades digitais da lista + as que o professor escreveu à mão (fora da lista).
  const habilidadesDigitais: { id: string; codigo: string | null; descricao: string }[] =
    plano.usar_curriculo_digital
      ? [
          ...(habilidadesTodas ?? []).filter((h) => h.fonte === "curriculo_educacao_digital"),
          ...((plano.habilidades_manuais as HabilidadeManual[] | null) ?? []).map((m: HabilidadeManual, i: number) => ({
            id: `manual-${i}`,
            codigo: m.codigo,
            descricao: m.descricao,
          })),
        ]
      : [];

  const competenciaIds = (vinculosCompetencias ?? []).map((v) => v.competencia_id);
  const { data: competenciasSelecionadas } =
    competenciaIds.length > 0
      ? await supabase
          .from("competencias_curriculares")
          .select("*")
          .in("id", competenciaIds)
          .order("numero")
      : { data: [] as { id: string; numero: number; titulo: string | null; descricao: string }[] };

  const areaConhecimento = disciplina?.area ?? curso?.eixo_tecnologico ?? "";
  const nomesComponentes = (planoDisciplinas ?? [])
    .map((p) => (p as unknown as { disciplinas: { nome: string } | null }).disciplinas?.nome)
    .filter((nome): nome is string => Boolean(nome));
  const componenteCurricular = ehAnosIniciais
    ? nomesComponentes.join(", ") || disciplina?.nome || ""
    : disciplina?.nome ?? curso?.nome ?? "";
  const ehInfantil = plano.etapa === "educacao_infantil";
  // Brasões do cabeçalho: o do Estado fica à esquerda e o da escola à direita; cada um pode ser retirado.
  // Se ao menos um estiver ligado, os dois lados ficam reservados (a escola sem logo deixa o espaço em
  // branco para o professor colar o brasão depois).
  const mostrarBrasaoEstado = plano.incluir_logo_estado !== false;
  const mostrarLogoEscola = plano.incluir_logo_escola !== false;
  const temLogos = mostrarBrasaoEstado || mostrarLogoEscola;
  const rotuloTurma =
    plano.etapa === "ensino_medio" ? "Série/ano:" : ehInfantil ? "Turma/grupo:" : "Ano/turma:";

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className={`mx-auto mb-4 flex ${paisagem ? "max-w-[297mm]" : "max-w-[210mm]"} items-center justify-between px-4 print:hidden`}>
        <Link
          href={`/dashboard/planos/${id}`}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <span aria-hidden="true">← </span>Voltar para edição
        </Link>
        <BarraAcoesPlano titulo={plano.titulo} paisagem={paisagem} />
      </div>

      <style>{`@page { size: A4 ${paisagem ? "landscape" : "portrait"}; margin: 0; }`}</style>

      {/* Precisa vir antes do AutoAcao: registra o preparo da impressão antes de o auto-imprimir disparar. */}
      <ImpressaoPaginada paisagem={paisagem} />
      <AutoAcao acao={auto} titulo={plano.titulo} paisagem={paisagem} />

      {/*
        A moldura (borda/sombra) abaixo é só o "cartão" da pré-visualização em tela.
        Na impressão ela some (print:hidden) e quem imprime são as páginas montadas
        por ImpressaoPaginada a partir de #plano-conteudo; o PDF e o Word também
        leem #plano-conteudo (ver src/lib/gerar-pdf.ts e gerar-word.ts).
      */}
      <div className={`mx-auto ${paisagem ? "max-w-[297mm]" : "max-w-[210mm]"} rounded-xl border border-slate-300 bg-white shadow-lg shadow-slate-900/10 print:hidden`}>
        <div id="plano-conteudo" style={ESTILO_TEXTO_PLANO} className="px-4 py-6 sm:px-[2cm] sm:py-[1.5cm]">
          {/* Cabeçalho */}
        {ehAnosIniciais ? (
          <div className="mb-4 flex items-start gap-3">
            {temLogos && (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center">
                {mostrarBrasaoEstado && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/brasao-santa-catarina.jpg"
                    alt="Brasão do Estado de Santa Catarina"
                    className="max-h-20 max-w-full object-contain"
                  />
                )}
              </div>
            )}
            <div className="flex-1 text-sm leading-tight">
              <p>ESTADO DE SANTA CATARINA</p>
              <p>SECRETARIA DE ESTADO DA EDUCAÇÃO</p>
              <p>DIRETORIA DE EDUCAÇÃO BÁSICA E PROFISSIONAL</p>
              <p>GERÊNCIA DO ENSINO FUNDAMENTAL</p>
            </div>
            {temLogos && (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center">
                {mostrarLogoEscola && escola?.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={escola.logo_url} alt={`Logo de ${escola.nome}`} className="max-h-20 max-w-full object-contain" />
                )}
              </div>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse border border-black">
            <tbody>
              <tr className="break-inside-avoid">
                {temLogos && (
                  <td className="w-32 border border-black p-2 align-middle text-center">
                    {mostrarBrasaoEstado && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/brasao-santa-catarina.jpg"
                        alt="Brasão do Estado de Santa Catarina"
                        className="mx-auto max-h-20 max-w-full object-contain"
                      />
                    )}
                  </td>
                )}
                <td className="border border-black p-2 text-center font-bold">
                  <p>ESTADO DE SANTA CATARINA</p>
                  <p>SECRETARIA DE ESTADO DA EDUCAÇÃO</p>
                  <p>NOME DA ESCOLA: {escola?.nome ? escola.nome.toUpperCase() : "_______________"}</p>
                  <p>MUNICÍPIO: {escola?.municipio ? escola.municipio.toUpperCase() : "_______________"}</p>
                  <p>PROFESSOR (A): {(professor?.nome ?? "").toUpperCase()}</p>
                </td>
                {temLogos && (
                  <td className="w-32 border border-black p-2 align-middle text-center">
                    {mostrarLogoEscola && escola?.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={escola.logo_url}
                        alt={`Logo de ${escola.nome}`}
                        className="mx-auto max-h-20 max-w-full object-contain"
                      />
                    )}
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        )}

        <h1 className="my-4 text-center text-lg font-bold">
          {ehAnosIniciais ? "PLANO DE AULA DOS ANOS INICIAIS DO ENSINO FUNDAMENTAL" : `PLANO DE AULA – ${plano.ano_letivo}`}
        </h1>

        {/* Corpo */}
        {ehAnosIniciais ? (
          <>
            <table className="w-full border-collapse border border-black">
              <tbody>
                <tr className="break-inside-avoid">
                  <td className="w-2/3 border border-black p-2 align-top">
                    <strong>Unidade Escolar:</strong> {escola?.nome ?? ""}
                  </td>
                  <td className="border border-black p-2 align-top">
                    <strong>Ano/Turma:</strong> {plano.turma}
                  </td>
                </tr>
                <tr className="break-inside-avoid">
                  <td colSpan={2} className="border border-black p-2 align-top">
                    <strong>Professor(a):</strong> {professor?.nome}
                  </td>
                </tr>
                {plano.segundo_professor_nome && (
                  <tr className="break-inside-avoid">
                    <td colSpan={2} className="border border-black p-2 align-top">
                      <strong>Segundo(a) Professor(a):</strong> {plano.segundo_professor_nome}
                    </td>
                  </tr>
                )}
                <tr className="break-inside-avoid">
                  <td colSpan={2} className="border border-black p-2 align-top">
                    <strong>Período do plano:</strong> {formatarData(plano.data_inicio)}
                    {plano.data_inicio && plano.data_fim ? " a " : ""}
                    {formatarData(plano.data_fim)}
                  </td>
                </tr>
                <tr className="break-inside-avoid">
                  <td colSpan={2} className="border border-black p-2 align-top">
                    <strong>Componente(s) Curricular(es):</strong> {componenteCurricular}
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="mt-4 w-full border-collapse border border-black">
              <tbody>
                <tr className="break-inside-avoid">
                  <td className="w-[28%] border border-black p-2 text-center align-top font-bold">
                    Objeto(s) de Conhecimento: conteúdos, conceitos e princípios
                  </td>
                  <td className="w-[28%] border border-black p-2 text-center align-top font-bold">
                    Habilidade(s)
                  </td>
                  <td className="border border-black p-2 text-center align-top font-bold">
                    Caminho metodológico para desenvolvimento da habilidade (descrever passo a passo)
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-2 align-top">
                    <TextoOuParagrafos texto={plano.conteudos_programaticos} />
                  </td>
                  <td className="border border-black p-2 align-top">
                    {habilidadesCurriculo.length > 0 ? (
                      <div className="space-y-2">
                        {habilidadesCurriculo.map((h) => (
                          <p key={h.id}>
                            {h.codigo && <strong>({h.codigo}) </strong>}
                            {h.descricao}
                          </p>
                        ))}
                      </div>
                    ) : null}
                    {habilidadesDigitais.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <p className="font-bold">Currículo de Educação Digital:</p>
                        {habilidadesDigitais.map((h) => (
                          <p key={h.id}>
                            {h.codigo && <strong>({h.codigo}) </strong>}
                            {h.descricao}
                          </p>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="border border-black p-2 align-top">
                    <TextoOuParagrafos texto={plano.metodologia} />
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="mt-4 w-full border-collapse border border-black">
              <tbody>
                <Linha rotulo="Instrumentos de Avaliação:">
                  <TextoOuParagrafos texto={plano.instrumentos_avaliacao} />
                </Linha>
                <Linha rotulo="Critérios de Avaliação:">
                  <CriteriosOuLista texto={plano.avaliacao} />
                </Linha>
                <Linha rotulo="Referências:">
                  <div className="space-y-2">
                    {referenciasOficiais(plano.etapa, plano.usar_curriculo_digital).map((r, i) => (
                      <p key={`oficial-${i}`}>{r}</p>
                    ))}
                    {linhas(plano.referencias).map((r, i) => (
                      <p key={`complementar-${i}`}>{r}</p>
                    ))}
                  </div>
                </Linha>
              </tbody>
            </table>
          </>
        ) : (
          <table className="w-full border-collapse border border-black">
            <tbody>
              {!ehInfantil && (
                <Linha rotulo="Área(s) de Conhecimento(s)" curta>{areaConhecimento}</Linha>
              )}
              <Linha curta rotulo={ehInfantil ? "Campo(s) de experiência:" : "Componentes curriculares envolvidos:"}>
                {componenteCurricular}
              </Linha>
              {!ehInfantil && (
                <Linha rotulo="Número de aulas" curta>
                  {plano.quantidade_aulas ? `${plano.quantidade_aulas} aulas` : ""}
                </Linha>
              )}
              <Linha rotulo="Data de início" curta>{formatarData(plano.data_inicio)}</Linha>
              <Linha rotulo="Data de fim" curta>{formatarData(plano.data_fim)}</Linha>
              <Linha rotulo={rotuloTurma} curta>{plano.turma}</Linha>
              {ehInfantil && <Linha rotulo="Grupo etário:" curta>{plano.grupo_etario}</Linha>}
              <Linha rotulo="Professor(a):" curta>{professor?.nome}</Linha>
              {!ehInfantil && (
                <Linha rotulo="Competência específica do Componente Curricular:">
                  {(competenciasSelecionadas ?? []).length > 0 ? (
                    <div className="space-y-2">
                      {(competenciasSelecionadas ?? []).map((c) => (
                        <p key={c.id}>
                          <strong>
                            ({c.numero}){c.titulo ? ` ${c.titulo} - ` : " "}
                          </strong>
                          {c.descricao}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </Linha>
              )}
              <Linha
                rotulo={
                  ehInfantil ? "Objetivos de aprendizagem e desenvolvimento" : "Habilidade(s) selecionada(s)"
                }
              >
                {habilidadesCurriculo.length > 0 ? (
                  <div className="space-y-2">
                    {habilidadesCurriculo.map((h) => (
                      <p key={h.id}>
                        {h.codigo && <strong>({h.codigo}) </strong>}
                        {h.descricao}
                      </p>
                    ))}
                  </div>
                ) : null}
              </Linha>
              {habilidadesDigitais.length > 0 && (
                <Linha rotulo="Habilidades do currículo de educação digital">
                  <div className="space-y-2">
                    {habilidadesDigitais.map((h) => (
                      <p key={h.id}>
                        {h.codigo && <strong>({h.codigo}) </strong>}
                        {h.descricao}
                      </p>
                    ))}
                  </div>
                </Linha>
              )}
              <Linha
                rotulo={
                  ehInfantil ? "Avaliação — observação, escuta e registro" : "Critério(s) de avaliação"
                }
              >
                <CriteriosOuLista texto={plano.avaliacao} />
              </Linha>
              <Linha
                rotulo={
                  ehInfantil
                    ? "Experiências e interações propostas"
                    : "Objeto(s) de conhecimento em estudo/conteúdos"
                }
              >
                <TextoOuParagrafos texto={plano.conteudos_programaticos} />
              </Linha>
              <Linha
                rotulo={
                  ehInfantil
                    ? "Metodologia / rotina"
                    : "Possível caminho metodológico para desenvolvimento da habilidade"
                }
              >
                <TextoOuParagrafos texto={plano.metodologia} />
              </Linha>
              <Linha rotulo={ehInfantil ? "Instrumentos de registro" : "Instrumentos de avaliação"}>
                <TextoOuParagrafos texto={plano.instrumentos_avaliacao} />
              </Linha>
              <Linha rotulo="Referências">
                <div className="space-y-2">
                  {referenciasOficiais(plano.etapa, plano.usar_curriculo_digital).map((r, i) => (
                    <p key={`oficial-${i}`}>{r}</p>
                  ))}
                  {linhas(plano.referencias).map((r, i) => (
                    <p key={`complementar-${i}`}>{r}</p>
                  ))}
                </div>
              </Linha>
            </tbody>
          </table>
        )}
        </div>
      </div>
    </div>
  );
}

function Linha({
  rotulo,
  children,
  curta = false,
}: {
  rotulo: string;
  children: React.ReactNode;
  /** Linhas curtas nunca se dividem entre páginas; as longas podem, para não deixar espaço vazio. */
  curta?: boolean;
}) {
  return (
    <tr className={curta ? "break-inside-avoid" : undefined}>
      <td className="w-[28%] border border-black bg-slate-50 p-2 align-top font-bold print:bg-white">
        {rotulo}
      </td>
      <td className="border border-black p-2 align-top">{children}</td>
    </tr>
  );
}

function ParagrafosOuVazio({ itens }: { itens: string[] }) {
  if (itens.length === 0) return null;
  return (
    <div className="space-y-2">
      {itens.map((l, i) => (
        <p key={i}>{l}</p>
      ))}
    </div>
  );
}

/** Texto formatado (HTML do editor, já higienizado) ou, em planos antigos, um parágrafo por linha. */
function TextoOuParagrafos({ texto }: { texto: string | null }) {
  if (ehHtml(texto)) {
    return (
      <div
        className="texto-rico"
        dangerouslySetInnerHTML={{ __html: sanitizarHtml(texto as string) }}
      />
    );
  }
  return <ParagrafosOuVazio itens={linhas(texto)} />;
}

/** Critérios: HTML do editor ou, em planos antigos, uma linha = um marcador. */
function CriteriosOuLista({ texto }: { texto: string | null }) {
  if (ehHtml(texto)) return <TextoOuParagrafos texto={texto} />;
  const itens = linhas(texto);
  if (itens.length === 0) return null;
  return (
    <ul className="list-disc space-y-1 pl-5">
      {itens.map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ul>
  );
}
