import { Fragment } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BarraAcoesPlano from "@/app/dashboard/planos/[id]/visualizar/barra-acoes-plano";
import AutoAcao from "@/app/dashboard/planos/[id]/visualizar/auto-acao";
import ImpressaoPaginada from "@/app/dashboard/planos/[id]/visualizar/impressao-paginada";
import { ESTILO_TEXTO_PLANO } from "@/lib/estilo-plano";
import { ehHtml, sanitizarHtml } from "@/lib/texto-rico";
import { COMPETENCIAS_GERAIS_BNCC } from "@/lib/competencias-gerais";
import {
  TRIMESTRES_ROTULOS,
  complementoVisivel,
  conteudosVisiveis,
  projetoVisivel,
  ementaEmTexto,
  normalizarComponentes,
  normalizarDados,
  ordenarHabilidades,
  type CompetenciasEspecificasAnual,
  type CompetenciasGeraisAnual,
  type ItemLista,
  type PlanoAnual,
  type TrimestreAnual,
} from "@/lib/plano-anual";
import { ordenarComponentes } from "@/lib/secoes-componentes";

const MAIUSCULO = (t: string | null | undefined) => (t ?? "").toUpperCase();
const JUSTIFICADO = { textAlign: "justify" as const };

/** Número que aparece antes da competência: o código (se for número) ou a posição na lista. */
function numeroDe(item: ItemLista, posicao: number): string {
  return item.codigo && /^\d+$/.test(item.codigo) ? item.codigo : String(posicao + 1);
}

function ListaNumerada({ itens }: { itens: ItemLista[] }) {
  return (
    <>
      {itens.map((c, i) => (
        <p key={`${c.id}-${i}`} style={JUSTIFICADO} className="mb-1">
          {numeroDe(c, i)}. {c.texto}
        </p>
      ))}
    </>
  );
}

/** Título de seção: "3. Competências..." com o texto em negrito e sublinhado, como no modelo. */
function Titulo({ numero, children }: { numero: number | string; children: React.ReactNode }) {
  return (
    <p className="mb-1 mt-4">
      {numero}. <b>
        <u>{children}</u>
      </b>
    </p>
  );
}

/** Seção solta (sem borda): título + conteúdo na mesma tabela; o título nunca fica sozinho no fim da página. */
function Secao({ numero, titulo, reservar = 140, children }: { numero: number | string; titulo: React.ReactNode; reservar?: number; children: React.ReactNode }) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        <tr data-reservar={reservar} className="break-inside-avoid">
          <td className="p-0">
            <Titulo numero={numero}>{titulo}</Titulo>
          </td>
        </tr>
        <tr>
          <td className="p-0">{children}</td>
        </tr>
      </tbody>
    </table>
  );
}

/** Competências específicas: BNCC, Currículo Catarinense e as digitadas (rótulos só quando há mais de um grupo). */
function CompetenciasEspecificas({ competencias }: { competencias: CompetenciasEspecificasAnual }) {
  const { bncc, curriculo, manuais } = competencias;
  const rotular = [bncc.length > 0, curriculo.length > 0, manuais.length > 0].filter(Boolean).length > 1;
  if (bncc.length + curriculo.length + manuais.length === 0) return <p>&nbsp;</p>;
  return (
    <>
      {bncc.length > 0 && (
        <>
          {rotular && <p className="mb-1 font-bold">BNCC:</p>}
          <ListaNumerada itens={bncc} />
        </>
      )}
      {curriculo.length > 0 && (
        <>
          {rotular && <p className="mb-1 mt-2 font-bold">Currículo Catarinense:</p>}
          <ListaNumerada itens={curriculo} />
        </>
      )}
      {manuais.length > 0 && (
        <>
          {rotular && <p className="mb-1 mt-2 font-bold">Outras competências:</p>}
          <ListaNumerada itens={manuais} />
        </>
      )}
    </>
  );
}

/** Lista com marcadores (objetos, critérios, metodologia, conteúdos) ou um parágrafo vazio. */
function ListaMarcada({ itens }: { itens: ItemLista[] }) {
  if (itens.length === 0) return <p>&nbsp;</p>;
  return (
    <ul className="list-disc pl-5">
      {itens.map((o, k) => (
        <li key={`${o.id}-${k}`} className="mb-1" style={JUSTIFICADO}>
          {o.texto}
        </li>
      ))}
    </ul>
  );
}

/** As três tabelas de trimestre de um componente: unidades, habilidades, objetos, critérios e metodologia (+ o que for opcional). */
function TabelasTrimestres({ trimestres }: { trimestres: TrimestreAnual[] }) {
  return (
    <>
      {trimestres.map((t, i) => {
        const habilidades = ordenarHabilidades(t.habilidades);
        const conteudos = conteudosVisiveis(t);
        const projeto = projetoVisivel(t);
        const complemento = complementoVisivel(t);
        return (
          // Sem <div> em volta: a divisão em páginas só quebra tabelas que estão soltas no plano.
          <Fragment key={i}>
            <table className="mt-3 w-full table-fixed border-collapse border border-black">
              <colgroup>
                <col style={{ width: "14%" }} />
                <col style={{ width: "32%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "18%" }} />
              </colgroup>
              <tbody>
                <tr data-reservar={260} className="break-inside-avoid">
                  <td colSpan={5} className="border border-black p-2 font-bold">
                    {TRIMESTRES_ROTULOS[i]}
                  </td>
                </tr>
                <tr className="break-inside-avoid">
                  <td className="border border-black p-2 align-top font-bold">
                    UNIDADES TEMÁTICAS
                    <br />
                    (UNIDADE DO LIVRO E/OU OUTRAS FONTES)
                  </td>
                  <td className="border border-black p-2 align-top font-bold">HABILIDADES</td>
                  <td className="border border-black p-2 align-top font-bold">OBJETO DO CONHECIMENTO</td>
                  <td className="border border-black p-2 align-top font-bold">CRITÉRIOS DE AVALIAÇÃO</td>
                  <td className="border border-black p-2 align-top font-bold">METODOLOGIA</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 align-top">
                    {t.unidades.length > 0 ? (
                      t.unidades.map((u, k) => (
                        <p key={`${u.id}-${k}`} className="mb-2 font-bold" style={JUSTIFICADO}>
                          {MAIUSCULO(u.texto)}
                        </p>
                      ))
                    ) : (
                      <p>&nbsp;</p>
                    )}
                  </td>
                  <td className="border border-black p-2 align-top">
                    {habilidades.length > 0 ? (
                      habilidades.map((h, k) => (
                        <p key={`${h.id}-${k}`} className="mb-2" style={JUSTIFICADO}>
                          {h.codigo ? (
                            <>
                              <b>({h.codigo})</b> - {h.texto}
                            </>
                          ) : (
                            h.texto
                          )}
                        </p>
                      ))
                    ) : (
                      <p>&nbsp;</p>
                    )}
                  </td>
                  <td className="border border-black p-2 align-top">
                    <ListaMarcada itens={t.objetos} />
                  </td>
                  <td className="border border-black p-2 align-top">
                    <ListaMarcada itens={t.criterios} />
                  </td>
                  <td className="border border-black p-2 align-top">
                    <ListaMarcada itens={t.metodologia} />
                  </td>
                </tr>
                {conteudos.length > 0 && (
                  <tr>
                    <td colSpan={5} className="border border-black p-2 align-top">
                      <p className="mb-1 font-bold">CONTEÚDOS A SEREM ESTUDADOS</p>
                      <ListaMarcada itens={conteudos} />
                    </td>
                  </tr>
                )}
                {projeto && (
                  <tr>
                    <td colSpan={5} className="border border-black p-2 align-top">
                      <p className="mb-1 font-bold">PROJETO</p>
                      {projeto.split(/\n+/).map((par, k) => (
                        <p key={k} className="mb-1" style={JUSTIFICADO}>
                          {par}
                        </p>
                      ))}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {complemento && (
              <table className="mt-2 w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="p-0">
                      <div className="texto-rico" dangerouslySetInnerHTML={{ __html: sanitizarHtml(ehHtml(complemento) ? complemento : `<p>${complemento.replace(/\n/g, "<br>")}</p>`) }} />
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </Fragment>
        );
      })}
    </>
  );
}

/** Competências gerais da BNCC de um componente (ou do plano todo). */
function CompetenciasGerais({ competencias }: { competencias: CompetenciasGeraisAnual }) {
  const lista = competencias.numeros
    .map((n) => COMPETENCIAS_GERAIS_BNCC.find((c) => c.numero === n))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  if (lista.length + competencias.manuais.length === 0) return <p>&nbsp;</p>;
  return (
    <>
      {lista.map((c) => (
        <p key={c.numero} style={JUSTIFICADO} className="mb-1">
          {c.numero}. {c.texto}
        </p>
      ))}
      {competencias.manuais.map((t, i) => (
        <p key={`m-${i}`} style={JUSTIFICADO} className="mb-1">
          {t}
        </p>
      ))}
    </>
  );
}

/** Faixa que abre cada disciplina nos planos com várias (Anos Iniciais). */
function FaixaDisciplina({ numero, nome }: { numero: number; nome: string }) {
  return (
    <table className="mt-6 w-full border-collapse">
      <tbody>
        <tr data-reservar={220} className="break-inside-avoid">
          <td className="border-y-2 border-black px-1 py-1">
            <p className="font-bold">
              {numero}. COMPONENTE CURRICULAR: {MAIUSCULO(nome)}
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default async function VisualizarPlanoAnualPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  const { id } = await params;
  const { auto } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.from("planos_anuais").select("*").eq("id", id).single();
  if (!data) notFound();
  const plano = data as PlanoAnual;

  const { data: escola } = plano.escola_id
    ? await supabase.from("escolas").select("*").eq("id", plano.escola_id).single()
    : { data: null };

  const dados = normalizarDados({
    ementa: plano.ementa,
    competencias_gerais: plano.competencias_gerais,
    competencias_especificas: plano.competencias_especificas,
    trimestres: plano.trimestres,
  });

  // Anos Iniciais com várias disciplinas: ementa, competências e trimestres vêm separados por componente.
  const componentes =
    plano.etapa === "fundamental_anos_iniciais" ? ordenarComponentes(normalizarComponentes(plano.componentes, plano.competencias_gerais)) : [];
  const multi = componentes.length >= 2;

  const paisagem = true;
  const mostrarBrasaoEstado = plano.incluir_logo_estado !== false;
  const mostrarLogoEscola = plano.incluir_logo_escola !== false;
  const medio = plano.etapa === "ensino_medio";

  const { bncc, curriculo, manuais } = dados.competenciasEspecificas;
  const temEspecificas = bncc.length + curriculo.length + manuais.length > 0;

  const textoLivre = plano.texto_livre && plano.texto_livre.replace(/<!--rt-->/g, "").trim() !== "" ? plano.texto_livre : null;

  const tituloEspecificas = medio
    ? "Competências específicas por área do conhecimento do Currículo Base do Ensino Médio do Território Catarinense do Estado e a BNCC:"
    : "Competências específicas do componente curricular — BNCC e Currículo Base do Território Catarinense:";

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[297mm] items-center justify-between px-4 print:hidden">
        <Link
          href={`/dashboard/anual/${id}`}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <span aria-hidden="true">← </span>Voltar para edição
        </Link>
        <BarraAcoesPlano titulo={plano.titulo} paisagem={paisagem} />
      </div>

      <style>{`@page { size: A4 landscape; margin: 0; }`}</style>

      {/* Precisa vir antes do AutoAcao: registra o preparo da impressão antes de o auto-imprimir disparar. */}
      <ImpressaoPaginada paisagem={paisagem} />
      <AutoAcao acao={auto} titulo={plano.titulo} paisagem={paisagem} />

      <div className="mx-auto max-w-[297mm] rounded-xl border border-slate-300 bg-white shadow-lg shadow-slate-900/10 print:hidden">
        <div id="plano-conteudo" style={ESTILO_TEXTO_PLANO} className="px-4 py-6 sm:px-[2cm] sm:py-[1.5cm]">
          {/* Cabeçalho */}
          <table className="w-full border-collapse border border-black">
            <tbody>
              <tr className="break-inside-avoid">
                <td className="w-40 border border-black p-1 text-center align-middle">
                  {mostrarBrasaoEstado && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/logo-governo-sc.png"
                      alt="Governo de Santa Catarina — Secretaria de Estado da Educação"
                      className="mx-auto max-h-24 max-w-full object-contain"
                    />
                  )}
                </td>
                <td className="border border-black p-1 align-top font-bold">
                  <p>ESTADO DE SANTA CATARINA</p>
                  <p>SECRETARIA DE ESTADO DA EDUCAÇÃO</p>
                  <p>COORDENADORIA REGIONAL DA EDUCAÇÃO</p>
                  <p>{escola?.nome ? MAIUSCULO(escola.nome) : "_______________"}</p>
                  <p>{escola?.municipio ? `${MAIUSCULO(escola.municipio)} – SC` : "_______________ – SC"}</p>
                </td>
                <td className="w-40 border border-black p-1 text-center align-middle">
                  {mostrarLogoEscola && escola?.logo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={escola.logo_url} alt={`Logo de ${escola.nome}`} className="mx-auto max-h-20 max-w-full object-contain" />
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <h1 className="my-5 text-center text-sm font-bold underline">PLANO DE ENSINO ANUAL {plano.ano_letivo}</h1>

          {/* 1. Identificação */}
          <table className="w-full border-collapse">
            <tbody>
              <tr data-reservar={160} className="break-inside-avoid">
                <td colSpan={2} className="p-0">
                  <p className="mb-1">
                    1. <b>
                      <u>Identificação:</u>
                    </b>
                  </p>
                </td>
              </tr>
              <tr className="break-inside-avoid">
                <td className="w-[62%] p-0 align-top">
                  Escola: <b>{MAIUSCULO(escola?.nome)}</b>
                </td>
                <td className="p-0 align-top">
                  Município: <b>{MAIUSCULO(escola?.municipio)}</b>
                </td>
              </tr>
              {multi ? (
                <>
                  <tr className="break-inside-avoid">
                    <td colSpan={2} className="p-0 align-top">
                      Componentes curriculares: <b>{MAIUSCULO(componentes.map((c) => c.nome).join(", "))}</b>
                    </td>
                  </tr>
                  {plano.area && (
                    <tr className="break-inside-avoid">
                      <td colSpan={2} className="p-0 align-top">
                        Área: <b>{MAIUSCULO(plano.area)}</b>
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <tr className="break-inside-avoid">
                  <td className="p-0 align-top">
                    Disciplina: <b>{MAIUSCULO(plano.componente)}</b>
                  </td>
                  <td className="p-0 align-top">
                    Área: <b>{MAIUSCULO(plano.area)}</b>
                  </td>
                </tr>
              )}
              <tr className="break-inside-avoid">
                <td colSpan={2} className="p-0 align-top">
                  Ano: <b>{plano.ano_letivo}</b>
                  <span style={{ display: "inline-block", width: "3.5em" }} /> Turma: <b>{MAIUSCULO(plano.turma)}</b>
                  <span style={{ display: "inline-block", width: "3.5em" }} /> Turno: <b>{MAIUSCULO(plano.turno)}</b>
                </td>
              </tr>
              <tr className="break-inside-avoid">
                <td className="p-0 align-top">
                  Docente: <b>{MAIUSCULO(plano.docente)}</b>
                </td>
                <td className="p-0 align-top">
                  Formação: <b>{MAIUSCULO(plano.formacao)}</b>
                </td>
              </tr>
            </tbody>
          </table>

          {multi ? (
            // Uma disciplina de cada vez: ementa → competências gerais → competências específicas → os 3 trimestres.
            componentes.map((c, idx) => {
              const n = idx + 2;
              return (
                <Fragment key={c.disciplina_id}>
                  <FaixaDisciplina numero={n} nome={c.nome} />
                  <Secao numero={`${n}.1`} titulo="Ementa:">
                    {c.ementa.length > 0 ? <p style={{ ...JUSTIFICADO, textIndent: "1.25cm" }}>{ementaEmTexto(c.ementa)}</p> : <p>&nbsp;</p>}
                  </Secao>
                  <Secao numero={`${n}.2`} titulo="Competências gerais da BNCC:">
                    <CompetenciasGerais competencias={c.competenciasGerais} />
                  </Secao>
                  <Secao numero={`${n}.3`} titulo={tituloEspecificas}>
                    <CompetenciasEspecificas competencias={c.competenciasEspecificas} />
                  </Secao>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr data-reservar={320} className="break-inside-avoid">
                        <td className="p-0">
                          <Titulo numero={`${n}.4`}>Planejamento trimestral:</Titulo>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <TabelasTrimestres trimestres={c.trimestres} />
                </Fragment>
              );
            })
          ) : (
            <>
              {/* 2. Ementa */}
              <Secao numero={2} titulo="Ementa:">
                {dados.ementa.length > 0 ? <p style={{ ...JUSTIFICADO, textIndent: "1.25cm" }}>{ementaEmTexto(dados.ementa)}</p> : <p>&nbsp;</p>}
              </Secao>

              {/* 3. Competências gerais */}
              <Secao numero={3} titulo="Competências gerais da BNCC:">
                <CompetenciasGerais competencias={dados.competenciasGerais} />
              </Secao>

              {/* 4. Competências específicas */}
              <Secao numero={4} titulo={tituloEspecificas}>
                {temEspecificas ? <CompetenciasEspecificas competencias={dados.competenciasEspecificas} /> : <p>&nbsp;</p>}
              </Secao>

              {/* 5. Componente curricular */}
              <table className="w-full border-collapse">
                <tbody>
                  <tr data-reservar={320} className="break-inside-avoid">
                    <td className="p-0">
                      <Titulo numero={5}>Componente Curricular:</Titulo>
                    </td>
                  </tr>
                </tbody>
              </table>
              <TabelasTrimestres trimestres={dados.trimestres} />
            </>
          )}

          {/* Do item 6 em diante: texto livre do professor (sem títulos prontos) */}
          {textoLivre && (
            <table className="mt-4 w-full border-collapse">
              <tbody>
                <tr>
                  <td className="p-0">
                    <div
                      className="texto-rico"
                      dangerouslySetInnerHTML={{
                        __html: sanitizarHtml(ehHtml(textoLivre) ? textoLivre : `<p>${textoLivre.replace(/\n/g, "<br>")}</p>`),
                      }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
