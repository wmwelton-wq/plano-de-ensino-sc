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
  ementaEmTexto,
  normalizarDados,
  ordenarHabilidades,
  type ItemLista,
  type PlanoAnual,
} from "@/lib/plano-anual";

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
function Titulo({ numero, children }: { numero: number; children: React.ReactNode }) {
  return (
    <p className="mb-1 mt-4">
      {numero}. <b>
        <u>{children}</u>
      </b>
    </p>
  );
}

/** Seção solta (sem borda): título + conteúdo na mesma tabela; o título nunca fica sozinho no fim da página. */
function Secao({ numero, titulo, reservar = 140, children }: { numero: number; titulo: React.ReactNode; reservar?: number; children: React.ReactNode }) {
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

  const paisagem = true;
  const mostrarBrasaoEstado = plano.incluir_logo_estado !== false;
  const mostrarLogoEscola = plano.incluir_logo_escola !== false;
  const medio = plano.etapa === "ensino_medio";

  const gerais = dados.competenciasGerais.numeros
    .map((n) => COMPETENCIAS_GERAIS_BNCC.find((c) => c.numero === n))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const geraisManuais = dados.competenciasGerais.manuais;

  const { bncc, curriculo, manuais } = dados.competenciasEspecificas;
  const gruposEspecificas = [bncc.length > 0, curriculo.length > 0, manuais.length > 0].filter(Boolean).length;
  const rotular = gruposEspecificas > 1;
  const temEspecificas = gruposEspecificas > 0;

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
                <td className="w-24 border border-black p-1 text-center align-middle">
                  {mostrarBrasaoEstado && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/brasao-santa-catarina.jpg"
                      alt="Brasão do Estado de Santa Catarina"
                      className="mx-auto max-h-20 max-w-full object-contain"
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
                <td className="w-24 border border-black p-1 text-center align-middle">
                  {mostrarLogoEscola && escola?.logo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={escola.logo_url} alt={`Logo de ${escola.nome}`} className="mx-auto max-h-20 max-w-full object-contain" />
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <h1 className="my-5 text-center text-sm font-bold underline">PLANO DE ENSINO {plano.ano_letivo}</h1>

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
              <tr className="break-inside-avoid">
                <td className="p-0 align-top">
                  Disciplina: <b>{MAIUSCULO(plano.componente)}</b>
                </td>
                <td className="p-0 align-top">
                  Área: <b>{MAIUSCULO(plano.area)}</b>
                </td>
              </tr>
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

          {/* 2. Ementa */}
          <Secao numero={2} titulo="Ementa:">
            {dados.ementa.length > 0 ? (
              <p style={{ ...JUSTIFICADO, textIndent: "1.25cm" }}>{ementaEmTexto(dados.ementa)}</p>
            ) : (
              <p>&nbsp;</p>
            )}
          </Secao>

          {/* 3. Competências gerais */}
          <Secao numero={3} titulo="Competências gerais da BNCC:">
            {gerais.length + geraisManuais.length > 0 ? (
              <>
                {gerais.map((c) => (
                  <p key={c.numero} style={JUSTIFICADO} className="mb-1">
                    {c.numero}. {c.texto}
                  </p>
                ))}
                {geraisManuais.map((t, i) => (
                  <p key={`m-${i}`} style={JUSTIFICADO} className="mb-1">
                    {t}
                  </p>
                ))}
              </>
            ) : (
              <p>&nbsp;</p>
            )}
          </Secao>

          {/* 4. Competências específicas */}
          <Secao numero={4} titulo={tituloEspecificas}>
            {temEspecificas ? (
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
            ) : (
              <p>&nbsp;</p>
            )}
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

          {dados.trimestres.map((t, i) => {
            const habilidades = ordenarHabilidades(t.habilidades);
            return (
              <table key={i} className="mt-3 w-full table-fixed border-collapse border border-black">
                <colgroup>
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "48%" }} />
                  <col style={{ width: "30%" }} />
                </colgroup>
                <tbody>
                  <tr data-reservar={260} className="break-inside-avoid">
                    <td colSpan={3} className="border border-black p-2 font-bold">
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
                      {t.objetos.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {t.objetos.map((o, k) => (
                            <li key={`${o.id}-${k}`}>{o.texto}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>&nbsp;</p>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            );
          })}

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
