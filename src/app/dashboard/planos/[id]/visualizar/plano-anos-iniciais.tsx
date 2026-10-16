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
  escola: { nome: string; municipio: string; logo_url: string | null } | null;
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
  const temLogos = dados.mostrarBrasaoEstado || dados.mostrarLogoEscola;

  return (
    <>
      <h1 className="mb-3 text-center text-base font-bold">Plano de aula</h1>

      <div className="mb-4 flex items-start gap-4">
        {temLogos && (
          <div className="flex h-24 w-40 shrink-0 items-center justify-center">
            {dados.mostrarBrasaoEstado && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/logo-governo-sc.png"
                alt="Governo de Santa Catarina — Secretaria de Estado da Educação"
                className="max-h-24 max-w-full object-contain"
              />
            )}
          </div>
        )}
        <div className="flex-1 text-sm leading-snug">
          <p className="font-bold">{linhaEscola.toUpperCase()}</p>
          <p>
            <strong>Turma:</strong> {dados.turma ?? ""}
          </p>
          <p>
            <strong>Professor(a):</strong> {dados.professorNome}
          </p>
          {dados.segundoProfessor && (
            <p>
              <strong>Segundo(a) Professor(a):</strong> {dados.segundoProfessor}
            </p>
          )}
          <p>
            <strong>Plano de aula:</strong> Período de {periodo}
          </p>
          <p className="font-bold">Anos iniciais</p>
        </div>
        {temLogos && (
          <div className="flex h-24 w-40 shrink-0 items-center justify-center">
            {dados.mostrarLogoEscola && escola?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={escola.logo_url} alt={`Logo de ${escola.nome}`} className="max-h-24 max-w-full object-contain" />
            )}
          </div>
        )}
      </div>

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
                  <td colSpan={5} className="border border-black px-2 py-1.5 text-base font-bold">
                    Componente Curricular: {comp.nome}
                  </td>
                </tr>
                {competencias.length > 0 && (
                  <tr className="break-inside-avoid">
                    <td colSpan={5} className="border border-black px-2 py-1.5 text-justify">
                      {competencias.map((c, i) => (
                        <p key={c.id}>
                          {i === 0 && (
                            <strong>
                              {competencias.length > 1
                                ? "Competências específicas do Componente Curricular: "
                                : "Competência específica do Componente Curricular: "}
                            </strong>
                          )}
                          {competencias.length > 1 && <strong>({c.numero}) </strong>}
                          {c.descricao}
                        </p>
                      ))}
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
                {temRecomposicao && (
                  <tr>
                    <td colSpan={5} className="border border-black px-2 py-1.5 align-top">
                      {secao?.recomposicao_objetos && (
                        <div>
                          <p className="font-bold">Recomposição das aprendizagens:</p>
                          <Texto valor={secao.recomposicao_objetos} />
                        </div>
                      )}
                      {secao?.recomposicao_habilidades && (
                        <div className={secao.recomposicao_objetos ? "mt-3" : ""}>
                          <p className="font-bold">Habilidades trabalhadas:</p>
                          <Texto valor={secao.recomposicao_habilidades} />
                        </div>
                      )}
                    </td>
                  </tr>
                )}
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
