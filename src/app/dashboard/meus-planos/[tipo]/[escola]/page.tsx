import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoTopo from "@/components/navegacao-topo";
import {
  CartaoPasta,
  CartaoPlano,
  TIPOS,
  agruparPorEscola,
  agruparPorTurma,
  carregarPlanos,
  tipoValido,
  type TipoPlano,
} from "../../dados";
import BaixarVarios from "../../baixar-varios";

const PLANOS_POR_PAGINA = 30;

export default async function TurmasDaEscolaPage({
  params,
  searchParams,
}: {
  params: Promise<{ tipo: string; escola: string }>;
  searchParams: Promise<{ turma?: string; pagina?: string }>;
}) {
  const { tipo: tipoBruto, escola } = await params;
  const { turma, pagina: paginaBruta } = await searchParams;
  if (!tipoValido(tipoBruto)) notFound();
  const tipo = tipoBruto as TipoPlano;

  const supabase = await createClient();
  const planos = await carregarPlanos(supabase, tipo);
  const grupo = agruparPorEscola(planos).find((g) => g.chave === escola);
  if (!grupo) notFound();

  const info = TIPOS[tipo];
  const turmas = agruparPorTurma(grupo.planos);
  const urlEscola = `/dashboard/meus-planos/${tipo}/${escola}`;
  const migalhasBase = [
    { rotulo: "Início", href: "/dashboard" },
    { rotulo: "Meus planos", href: "/dashboard/meus-planos" },
    { rotulo: info.titulo, href: `/dashboard/meus-planos/${tipo}` },
  ];

  // Terceiro nível: os planos da turma escolhida.
  if (turma !== undefined) {
    const t = turmas.find((x) => x.chave === turma);
    if (!t) notFound();
    const totalPaginas = Math.max(1, Math.ceil(t.planos.length / PLANOS_POR_PAGINA));
    const pedida = Number.parseInt(paginaBruta ?? "1", 10);
    const pagina = Number.isFinite(pedida) ? Math.min(Math.max(pedida, 1), totalPaginas) : 1;
    const planosDaPagina = t.planos.slice((pagina - 1) * PLANOS_POR_PAGINA, pagina * PLANOS_POR_PAGINA);
    const hrefPagina = (n: number) => `${urlEscola}?turma=${encodeURIComponent(t.chave)}&pagina=${n}`;
    return (
      <div>
        <NavegacaoTopo
          voltarHref={urlEscola}
          voltarRotulo={`Voltar às turmas de ${grupo.nome}`}
          migalhas={[...migalhasBase, { rotulo: grupo.nome, href: urlEscola }, { rotulo: t.nome }]}
        />
        <CabecalhoPagina tom="violeta" icone="usuarios" titulo={t.nome} subtitulo={`${info.titulo} · ${grupo.nome}`} />
        <div className="mt-4">
          <BaixarVarios
            planos={t.planos.map((p) => ({ id: p.id, titulo: p.titulo, tipo }))}
            nomeArquivo={`${info.titulo} - ${grupo.nome} - ${t.nome}`}
            rotulo="Baixar todos desta turma em um PDF"
          />
        </div>
        <ul className="mt-6 space-y-3">
          {planosDaPagina.map((p) => (
            <CartaoPlano key={p.id} plano={p} base={info.base} tipo={tipo} />
          ))}
        </ul>
        {totalPaginas > 1 && (
          <nav aria-label="Páginas de planos" className="mt-6 flex items-center justify-between gap-3 text-sm">
            {pagina > 1 ? (
              <Link href={hrefPagina(pagina - 1)} className="btn-azul-suave" aria-label="Página anterior">
                ← Anterior
              </Link>
            ) : (
              <span />
            )}
            <span className="text-slate-600" aria-live="polite">
              Página {pagina} de {totalPaginas} · {t.planos.length} planos
            </span>
            {pagina < totalPaginas ? (
              <Link href={hrefPagina(pagina + 1)} className="btn-azul-suave" aria-label="Próxima página">
                Próxima →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    );
  }

  // Segundo nível: as turmas da escola.
  return (
    <div>
      <NavegacaoTopo
        voltarHref={`/dashboard/meus-planos/${tipo}`}
        voltarRotulo={`Voltar aos ${info.titulo.toLowerCase()}`}
        migalhas={[...migalhasBase, { rotulo: grupo.nome }]}
      />
      <CabecalhoPagina
        tom={escola === "sem-escola" ? "ardosia" : "ambar"}
        icone={escola === "sem-escola" ? "pasta" : "escola"}
        titulo={grupo.nome}
        subtitulo={`${info.titulo} · escolha a turma para ver os planos.`}
      />
      <div className="mt-4">
        <BaixarVarios
          planos={grupo.planos.map((p) => ({ id: p.id, titulo: p.titulo, tipo }))}
          nomeArquivo={`${info.titulo} - ${grupo.nome}`}
          rotulo="Baixar todos desta escola em um PDF"
        />
      </div>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {turmas.map((t) => (
          <li key={t.chave}>
            <CartaoPasta
              href={`${urlEscola}?turma=${encodeURIComponent(t.chave)}`}
              icone={t.chave === "sem-turma" ? "pasta" : "usuarios"}
              tom={t.chave === "sem-turma" ? "ardosia" : "violeta"}
              titulo={t.nome}
              contagem={t.planos.length}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
