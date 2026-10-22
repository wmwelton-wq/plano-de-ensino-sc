import { Fragment } from "react";
import { ehHtml, sanitizarHtml } from "@/lib/texto-rico";
import { lerSecoes, ordenarComponentes } from "@/lib/secoes-componentes";

/**
 * Plano dos Anos Iniciais no modelo em PDF enviado pelo Estado: um cabeçalho e UMA tabela em que cada
 * componente curricular tem a sua seção (título, competência específica, cinco colunas e, se houver,
 * recomposição das aprendizagens); as referências ficam na última linha da tabela.
 */

export interface DadosPlanoAnosIniciais {
  turma: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  segundoProfessor: string | null;
  professorNome: string;
  escola: { nome: string; municipio: string; logo_url: string | null; imagem_esquerda_url: string | null } | null;
  mostrarBrasaoEstado: boolean;
  mostrarLogoEscola: boolean;
  /** Componentes escolhidos no plano (qualquer ordem). */
  componentes: { id: string; nome: string }[];
  secoes: unknown;
  habilidades: { id: string; codigo: string | null; descricao: string; disciplina_id: string | null }[];
  habilidadesDigitais: { id: string; codigo: string | null; descricao: string }[];
  competencias: { id: string; numero: number; titulo: string | null; descricao: string; disciplina_id: string | null }[];
  referencias: string[];
}

function formatarData(data: string | null): string {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

function formatarCurta(data: string | null): string {
  const [, mes, dia] = (data ?? "").split("-");
  return dia && mes ? `${dia}/${mes}` : "";
}

function linhas(texto: string | null | undefined): string[] {
  return (texto ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/** Texto formatado do editor (HTML higienizado) ou, em texto simples, um parágrafo por linha. */
function Texto({ valor }: { valor: string | null | undefined }) {
  if (!valor) return null;
  if (ehHtml(valor)) {
    return <div className="texto-rico" dangerouslySetInnerHTML={{ __html: sanitizarHtml(valor) }} />;
  }
  return (
    <div>
      {linhas(valor).map((l, i) => (
        <p key={i}>{l}</p>
      ))}
    </div>
  );
}

const CABECALHOS = [
  "Habilidades que estão sendo trabalhadas",
  "Conteúdos/objetos de conhecimento que estão sendo trabalhados com a turma",
  "Possível caminho metodológico para desenvolvimento da habilidade (Passo a passo)",
  "Critérios de avaliação",
  "Instrumentos de avaliação",
];

/** Larguras das colunas, iguais às do modelo (somam 100%). */
const LARGURAS = ["21%", "21%", "25%", "19%", "14%"];

export default function PlanoAnosIniciais({ dados }: { dados: DadosPlanoAnosIniciais }) {
  const secoes = new Map(lerSecoes(dados.secoes).map((s) => [s.disciplina_id, s]));
  const componentes = ordenarComponentes(dados.componentes);
  const periodo =
    dados.dataInicio && dados.dataFim
      ? `${formatarCurta(dados.dataInicio)} a ${formatarData(dados.dataFim)}`
      : formatarData(dados.dataInicio || dados.dataFim);
  const escola = dados.escola;
  const linhaEscola = escola ? `${escola.nome} – ${escola.municipio} – SC` : "_______________";
  const temLogoEscola = dados.mostrarLogoEscola && Boolean(escola?.logo_url);
  const temImagemEsquerda = dados.mostrarBrasaoEstado && Boolean(escola?.imagem_esquerda_url);
  const colunasCabecalho = 1 + (temImagemEsquerda ? 1 : 0) + (temLogoEscola ? 1 : 0);

  return (
    <>
      {/* Cabeçalho: imagem da esquerda (se personalizado), identificação da escola e imagem da direita (se personalizado). */}
      <table className="w-full border-collapse border border-black" style={{ tableLayout: "fixed" }}>
        <tbody>
          <tr className="break-inside-avoid">
            {temImagemEsquerda && (
              <td className="w-[22%] border border-black p-2 text-center align-middle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={escola?.imagem_esquerda_url ?? ""}
                  alt="Imagem do cabeçalho (lado esquerdo)"
                  className="mx-auto max-h-20 max-w-full object-contain"
                />
              </td>
            )}
            <td className="border border-black p-2 text-center align-middle leading-snug">
              <p className="font-bold">ESTADO DE SANTA CATARINA</p>
              <p className="font-bold">SECRETARIA DE ESTADO DA EDUCAÇÃO</p>
              <p className="font-bold">{linhaEscola.toUpperCase()}</p>
            </td>
            {temLogoEscola && escola?.logo_url && (
              <td className="w-[22%] border border-black p-2 text-center align-middle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={escola.logo_url} alt={`Logo de ${escola.nome}`} className="mx-auto max-h-20 max-w-full object-contain" />
              </td>
            )}
          </tr>
          <tr className="break-inside-avoid">
            <td colSpan={colunasCabecalho} className="border border-black bg-slate-100 p-2 text-center text-base font-bold print:bg-white">
              PLANO DE AULA – Anos iniciais do Ensino Fundamental
            </td>
          </tr>
        </tbody>
      </table>

      <table className="mb-4 w-full border-collapse border border-black border-t-0" style={{ tableLayout: "fixed" }}>
        <tbody>
          <tr className="break-inside-avoid">
            <td className="w-1/2 border border-black p-2 align-top">
              <strong>Turma:</strong> {dados.turma ?? ""}
            </td>
            <td className="w-1/2 border border-black p-2 align-top">
              <strong>Período do plano:</strong> {periodo}
            </td>
          </tr>
          <tr className="break-inside-avoid">
            <td className="border border-black p-2 align-top">
              <strong>Professor(a):</strong> {dados.professorNome}
            </td>
            <td className="border border-black p-2 align-top">
              <strong>Segundo(a) Professor(a):</strong> {dados.segundoProfessor ?? ""}
            </td>
          </tr>
          <tr className="break-inside-avoid">
            <td colSpan={2} className="border border-black p-2 align-top">
              <strong>Componente(s) Curricular(es):</strong> {componentes.map((c) => c.nome).join(", ")}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-black" style={{ tableLayout: "fixed" }}>
        <colgroup>
          {LARGURAS.map((l, i) => (
            <col key={i} style={{ width: l }} />
          ))}
        </colgroup>
        <tbody>
          {componentes.map((comp) => {
            const secao = secoes.get(comp.id);
            const habilidades = dados.habilidades.filter((h) => h.disciplina_id === comp.id);
            const competencias = dados.competencias
              .filter((c) => c.disciplina_id === comp.id)
              .sort((a, b) => a.numero - b.numero);
            const temRecomposicao = Boolean(secao?.recomposicao_objetos || secao?.recomposicao_habilidades);
            return (
              <Fragment key={comp.id}>
                {/* data-reservar: o título só começa na página se couber junto com a competência, os cabeçalhos e o início do conteúdo. */}
                <tr className="break-inside-avoid" data-reservar="300">
                  <td colSpan={5} className="border border-black bg-slate-100 px-2 py-1.5 text-base font-bold print:bg-white">
                    Componente Curricular: {comp.nome}
                  </td>
                </tr>
                {competencias.length > 0 && (
                  <tr className="break-inside-avoid">
                    <td colSpan={5} className="border border-black px-2 py-1.5 text-justify">
                      <p className="font-bold">
                        {competencias.length > 1
                          ? "Competências específicas do Componente Curricular:"
                          : "Competência específica do Componente Curricular:"}
                      </p>
                      {competencias.map((c) => (
                        <p key={c.id} className="mt-1">
                          {competencias.length > 1 && <strong>({c.numero}) </strong>}
                          {c.descricao}
                        </p>
                      ))}
                    </td>
                  </tr>
                )}
                {temRecomposicao && (
                  <tr>
                    <td colSpan={5} className="border border-black px-2 py-1.5 align-top">
                      <p className="font-bold">Recomposição das aprendizagens</p>
                      {secao?.recomposicao_habilidades && (
                        <div className="mt-1">
                          <p className="font-bold">Habilidades:</p>
                          <Texto valor={secao.recomposicao_habilidades} />
                        </div>
                      )}
                      {secao?.recomposicao_objetos && (
                        <div className="mt-2">
                          <p className="font-bold">Conteúdos/objetos de conhecimento:</p>
                          <Texto valor={secao.recomposicao_objetos} />
                        </div>
                      )}
                    </td>
                  </tr>
                )}
                <tr className="break-inside-avoid">
                  {CABECALHOS.map((c) => (
                    <td key={c} className="border border-black px-2 py-1 align-top text-xs font-bold">
                      {c}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 align-top">
                    {habilidades.map((h) => (
                      <p key={h.id} className="mb-1">
                        {h.codigo && <strong>({h.codigo}) </strong>}
                        {h.descricao}
                      </p>
                    ))}
                  </td>
                  <td className="border border-black px-2 py-1 align-top">
                    <Texto valor={secao?.conteudos} />
                  </td>
                  <td className="border border-black px-2 py-1 align-top">
                    <Texto valor={secao?.metodologia} />
                  </td>
                  <td className="border border-black px-2 py-1 align-top">
                    <Texto valor={secao?.criterios} />
                  </td>
                  <td className="border border-black px-2 py-1 align-top">
                    <Texto valor={secao?.instrumentos} />
                  </td>
                </tr>
              </Fragment>
            );
          })}

          {dados.habilidadesDigitais.length > 0 && (
            <tr>
              <td colSpan={5} className="border border-black px-2 py-1.5 align-top">
                <p className="font-bold">Habilidades do Currículo de Educação Digital:</p>
                {dados.habilidadesDigitais.map((h) => (
                  <p key={h.id} className="mt-1">
                    {h.codigo && <strong>({h.codigo}) </strong>}
                    {h.descricao}
                  </p>
                ))}
              </td>
            </tr>
          )}

          <tr>
            <td colSpan={5} className="border border-black px-2 py-1.5 align-top">
              <p>
                <strong>Referências bibliográficas:</strong> {dados.referencias[0] ?? ""}
              </p>
              {dados.referencias.slice(1).map((r, i) => (
                <p key={i}>{r}</p>
              ))}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
