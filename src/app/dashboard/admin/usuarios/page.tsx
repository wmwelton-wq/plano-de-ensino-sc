import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { chaveSecretaConfigurada } from "@/lib/supabase/admin";
import VoltarLink from "../../planos/voltar-link";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoAdmin from "../navegacao-admin";
import ListaUsuarios, { type Usuario } from "./lista-usuarios";
import CadastrosSwitch from "./cadastros-switch";

export const metadata = { title: "Plano Docente — Usuários", robots: { index: false } };

const POR_PAGINA = 20;

interface Origem {
  por_regiao: { regiao: string | null; pais: string | null; total: number }[];
  por_cidade: { cidade: string; regiao: string | null; total: number }[];
  sem_localizacao: number;
  cadastros_abertos: boolean;
}

const ACOES: Record<string, string> = {
  bloquear: "Bloqueou",
  desbloquear: "Liberou",
  excluir: "Excluiu",
  enviar_recuperacao: "Enviou recuperação de senha a",
  abrir_cadastros: "Abriu os cadastros",
  fechar_cadastros: "Fechou os cadastros",
};

export default async function UsuariosAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; pagina?: string }> }) {
  const { q, pagina } = await searchParams;
  const busca = (q ?? "").trim().slice(0, 80);
  const numero = Math.max(1, Math.min(1000, parseInt(pagina ?? "1", 10) || 1));

  const supabase = await createClient();
  const { data: ehAdmin } = await supabase.rpc("eh_admin");
  if (ehAdmin !== true) notFound();

  const [lista, origem, acoes] = await Promise.all([
    supabase.rpc("admin_listar_usuarios", { p_busca: busca || null, p_limite: POR_PAGINA, p_deslocamento: (numero - 1) * POR_PAGINA }),
    supabase.rpc("admin_origem_usuarios"),
    supabase.rpc("admin_acoes_recentes"),
  ]);

  if (lista.error || origem.error) {
    return (
      <div>
        <VoltarLink href="/dashboard/admin" rotulo="Voltar ao painel" />
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Não foi possível carregar os usuários agora.
        </p>
      </div>
    );
  }

  const dados = lista.data as { total: number; itens: Usuario[] };
  const o = origem.data as Origem;
  const recentes = (acoes.data ?? []) as { acao: string; alvo: string | null; em: string }[];
  const paginas = Math.max(1, Math.ceil(dados.total / POR_PAGINA));
  const link = (n: number) => `/dashboard/admin/usuarios?${new URLSearchParams({ ...(busca ? { q: busca } : {}), pagina: String(n) }).toString()}`;

  return (
    <div>
      <VoltarLink href="/dashboard" rotulo="Voltar ao início" />
      <CabecalhoPagina tom="ardosia" ilustracao="admin" titulo="Usuários" subtitulo="Quem se cadastrou, de onde acessa e ações de suporte. Dados pessoais: use só para operar o serviço." />
      <NavegacaoAdmin atual="usuarios" />

      <div className="mt-5">
        <CadastrosSwitch abertos={o.cadastros_abertos === true} />
      </div>

      <form method="get" className="mt-5 flex flex-wrap gap-2" role="search">
        <label htmlFor="busca-usuario" className="sr-only">
          Buscar por nome ou e-mail
        </label>
        <input id="busca-usuario" name="q" defaultValue={busca} placeholder="Buscar por nome ou e-mail" maxLength={80} className="input-field max-w-sm" />
        <button type="submit" className="btn-secondary">
          Buscar
        </button>
        {busca && (
          <Link href="/dashboard/admin/usuarios" className="link-primary self-center text-sm">
            Limpar
          </Link>
        )}
      </form>

      <p className="mt-3 text-sm text-slate-500">
        {dados.total} {dados.total === 1 ? "usuário" : "usuários"}
        {busca ? ` encontrado(s) para “${busca}”` : ""}
      </p>

      <ListaUsuarios usuarios={dados.itens} chaveServidor={chaveSecretaConfigurada()} />

      {paginas > 1 && (
        <nav aria-label="Páginas" className="mt-4 flex items-center justify-between text-sm">
          {numero > 1 ? (
            <Link href={link(numero - 1)} className="link-primary">
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-slate-500">
            Página {numero} de {paginas}
          </span>
          {numero < paginas ? (
            <Link href={link(numero + 1)} className="link-primary">
              Próxima →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}

      <h2 className="mt-8 text-lg font-bold text-slate-900">De onde vêm os cadastros</h2>
      <p className="mt-1 text-sm text-slate-500">Local aproximado (cidade/estado/país) do primeiro acesso, pelo provedor de internet. O endereço IP não é guardado.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <h3 className="text-sm font-bold text-slate-800">Por estado/país</h3>
          {o.por_regiao.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Ainda sem dados. Eles aparecem conforme as pessoas acessam o painel.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {o.por_regiao.map((r, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span>{[r.regiao, r.pais].filter(Boolean).join(" · ")}</span>
                  <span className="font-semibold">{r.total}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-bold text-slate-800">Por cidade</h3>
          {o.por_cidade.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Sem cidades registradas. A cidade só aparece se a Cloudflare enviar essa informação (veja o aviso nas instruções).</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {o.por_cidade.map((c, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span>{[c.cidade, c.regiao].filter(Boolean).join(" - ")}</span>
                  <span className="font-semibold">{c.total}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {o.sem_localizacao > 0 && <p className="mt-2 text-xs text-slate-500">{o.sem_localizacao} conta(s) ainda sem localização registrada.</p>}

      <h2 className="mt-8 text-lg font-bold text-slate-900">Últimas ações de administração</h2>
      {recentes.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nenhuma ação registrada ainda.</p>
      ) : (
        <ul className="card mt-3 divide-y divide-slate-100 text-sm">
          {recentes.map((a, i) => (
            <li key={i} className="flex flex-wrap justify-between gap-2 px-4 py-2">
              <span>
                {ACOES[a.acao] ?? a.acao}
                {a.alvo ? ` ${a.alvo}` : ""}
              </span>
              <span className="text-slate-500">{new Date(a.em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
