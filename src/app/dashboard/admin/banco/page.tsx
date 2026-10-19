import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VoltarLink from "../../planos/voltar-link";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoAdmin from "../navegacao-admin";

interface Painel {
  gerado_em: string;
  banco: { tamanho_bytes: number; conexoes: number; conexoes_ativas: number; conexoes_max: number; cache_acerto_pct: number | null; versao: string; ligado_desde: string };
  armazenamento: { arquivos: number; bytes: number };
  tabelas: { tabela: string; linhas: number; bytes: number; rls: boolean }[];
  usuarios: { total: number; novos_7d: number; novos_24h: number; sem_confirmar_email: number; entraram_24h: number; entraram_7d: number; cadastros_por_dia: { dia: string; novos: number }[] };
  seguranca: {
    tabelas_sem_rls: string[];
    rls_sem_politica: string[];
    funcoes_abertas_ao_publico: { nome: string; protegida: boolean }[];
    administradores: { primeiro_nome: string }[];
    ia_bloqueios_7d: number;
    maior_uso_ia_24h: number;
  };
}

function tamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
  return `${(bytes / 1024 ** 3).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} GB`;
}

/** Funções abertas de propósito (o banco confere o acesso por dentro delas). */
const EXPLICACAO_FUNCAO: Record<string, string> = {
  compartilhamento_publico: "pública de propósito: é o link de plano compartilhado, só mostra o plano de quem criou o link",
  ia_registrar_detalhe: "só grava diagnóstico no uso do próprio usuário logado",
};

function Cartao({ rotulo, valor, detalhe, alerta }: { rotulo: string; valor: string; detalhe?: string; alerta?: boolean }) {
  return (
    <div className="card p-4">
      <p className={`text-2xl font-bold ${alerta ? "text-red-600" : "text-slate-900"}`}>{valor}</p>
      <p className="text-sm text-slate-500">{rotulo}</p>
      {detalhe && <p className="mt-0.5 text-xs text-slate-400">{detalhe}</p>}
    </div>
  );
}

function Barra({ pct, alerta }: { pct: number; alerta?: boolean }) {
  return (
    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${alerta ? "bg-red-500" : "bg-primary-500"}`} style={{ width: `${Math.min(100, Math.max(1, pct))}%` }} />
    </div>
  );
}

export default async function BancoAdminPage() {
  const supabase = await createClient();
  const { data: ehAdmin } = await supabase.rpc("eh_admin");
  if (ehAdmin !== true) notFound();
  const { data, error } = await supabase.rpc("admin_banco_painel");
  if (error || !data) {
    return (
      <div>
        <VoltarLink href="/dashboard/admin" rotulo="Voltar ao painel" />
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Não foi possível carregar o painel do banco agora.
        </p>
      </div>
    );
  }
  const r = data as Painel;
  const pctConexoes = (r.banco.conexoes / Math.max(1, r.banco.conexoes_max)) * 100;
  const maxCad = Math.max(1, ...r.usuarios.cadastros_por_dia.map((c) => c.novos));
  const maxTabela = Math.max(1, ...r.tabelas.map((t) => t.bytes));
  const s = r.seguranca;
  const abertasSemExplicacao = s.funcoes_abertas_ao_publico.filter((f) => !f.protegida && !EXPLICACAO_FUNCAO[f.nome]);

  const alertas: string[] = [];
  if (s.tabelas_sem_rls.length) alertas.push(`Tabelas SEM proteção de linha (RLS): ${s.tabelas_sem_rls.join(", ")}.`);
  if (abertasSemExplicacao.length) alertas.push(`Funções abertas ao público que merecem conferência: ${abertasSemExplicacao.map((f) => f.nome).join(", ")}.`);
  if (pctConexoes >= 80) alertas.push(`Conexões do banco em ${Math.round(pctConexoes)}% do máximo.`);
  if (r.banco.cache_acerto_pct !== null && r.banco.cache_acerto_pct < 95) alertas.push(`O banco está lendo muito do disco (cache em ${r.banco.cache_acerto_pct}%): pode faltar memória.`);
  if (s.administradores.length === 0) alertas.push("Nenhum administrador cadastrado.");

  return (
    <div>
      <VoltarLink href="/dashboard" rotulo="Voltar ao início" />
      <CabecalhoPagina tom="ardosia" ilustracao="admin" titulo="Banco de dados e segurança" subtitulo="Tamanho, conexões, usuários e a checagem de segurança do banco. Sem nenhum dado pessoal de professores." />
      <NavegacaoAdmin atual="banco" />

      {alertas.length > 0 ? (
        <ul role="alert" className="mt-5 space-y-1 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {alertas.map((a) => (
            <li key={a}>⚠ {a}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Tudo certo: nenhum alerta de segurança ou de capacidade.</p>
      )}

      <h2 className="mt-8 text-lg font-bold text-slate-900">Banco de dados</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cartao rotulo="Tamanho do banco" valor={tamanho(r.banco.tamanho_bytes)} />
        <Cartao rotulo="Arquivos enviados" valor={tamanho(r.armazenamento.bytes)} detalhe={`${r.armazenamento.arquivos} arquivo(s)`} />
        <Cartao rotulo="Conexões abertas" valor={`${r.banco.conexoes} de ${r.banco.conexoes_max}`} detalhe={`${r.banco.conexoes_ativas} em uso agora`} alerta={pctConexoes >= 80} />
        <Cartao rotulo="Leitura na memória (cache)" valor={r.banco.cache_acerto_pct === null ? "—" : `${r.banco.cache_acerto_pct}%`} detalhe="acima de 99% é ótimo" alerta={r.banco.cache_acerto_pct !== null && r.banco.cache_acerto_pct < 95} />
      </div>
      <div className="card mt-3 p-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold text-slate-800">Conexões</span>
          <span className="text-slate-600">{Math.round(pctConexoes)}% do máximo</span>
        </div>
        <Barra pct={pctConexoes} alerta={pctConexoes >= 80} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        PostgreSQL {r.banco.versao}, ligado desde {new Date(r.banco.ligado_desde).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}. A memória (RAM) e o processador do servidor não aparecem para o aplicativo: veja no painel do Supabase, em Reports → Database. O limite de espaço depende do seu plano no Supabase.
      </p>

      <h3 className="mt-6 text-base font-bold text-slate-900">Maiores tabelas</h3>
      <div className="card mt-3 overflow-x-auto p-5">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-1 pr-3 font-semibold">Tabela</th>
              <th className="py-1 pr-3 font-semibold">Linhas</th>
              <th className="py-1 pr-3 font-semibold">Espaço</th>
              <th className="py-1 font-semibold">Proteção (RLS)</th>
            </tr>
          </thead>
          <tbody>
            {r.tabelas.map((t) => (
              <tr key={t.tabela} className="border-t border-slate-100">
                <td className="py-1.5 pr-3 font-semibold text-slate-800">{t.tabela}</td>
                <td className="py-1.5 pr-3">{t.linhas.toLocaleString("pt-BR")}</td>
                <td className="py-1.5 pr-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-2 rounded-full bg-primary-500" style={{ width: `${Math.max(3, (t.bytes / maxTabela) * 90)}px` }} />
                    {tamanho(t.bytes)}
                  </span>
                </td>
                <td className="py-1.5">{t.rls ? <span className="text-emerald-700">ligada</span> : <span className="font-semibold text-red-700">DESLIGADA</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Usuários</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cartao rotulo="Contas" valor={String(r.usuarios.total)} />
        <Cartao rotulo="Novas nas últimas 24 h" valor={String(r.usuarios.novos_24h)} detalhe={`${r.usuarios.novos_7d} em 7 dias`} />
        <Cartao rotulo="Entraram nas últimas 24 h" valor={String(r.usuarios.entraram_24h)} detalhe={`${r.usuarios.entraram_7d} em 7 dias`} />
        <Cartao rotulo="E-mail sem confirmar" valor={String(r.usuarios.sem_confirmar_email)} />
      </div>
      <div className="card mt-3 p-5">
        <p className="text-sm font-semibold text-slate-800">Cadastros por dia (14 dias)</p>
        <ul className="mt-2 space-y-1.5">
          {r.usuarios.cadastros_por_dia.map((c) => (
            <li key={c.dia} className="flex items-center gap-3 text-xs">
              <span className="w-10 shrink-0 text-slate-500">{c.dia}</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span className="block h-full rounded-full bg-primary-500" style={{ width: `${(c.novos / maxCad) * 100}%` }} />
              </span>
              <span className="w-6 shrink-0 text-right text-slate-600">{c.novos}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-400">Um pico estranho de cadastros num só dia pode indicar robôs criando contas.</p>
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Relatório de segurança</h2>
      <ul className="card mt-3 space-y-3 p-5 text-sm text-slate-700">
        <li>
          <strong>Proteção de linhas (RLS):</strong>{" "}
          {s.tabelas_sem_rls.length === 0 ? <span className="text-emerald-700">todas as tabelas estão protegidas, cada professor só enxerga o que é dele.</span> : <span className="font-semibold text-red-700">sem proteção: {s.tabelas_sem_rls.join(", ")}</span>}
        </li>
        <li>
          <strong>Tabelas só do servidor:</strong>{" "}
          {s.rls_sem_politica.length === 0 ? "nenhuma." : <>{s.rls_sem_politica.join(", ")} — com proteção ligada e sem acesso direto (só o servidor lê). É o esperado para tabelas de controle.</>}
        </li>
        <li>
          <strong>Funções abertas ao público (sem login):</strong>
          <ul className="mt-1 space-y-0.5 pl-4">
            {s.funcoes_abertas_ao_publico.length === 0 && <li>nenhuma.</li>}
            {s.funcoes_abertas_ao_publico.map((f) => (
              <li key={f.nome} className="list-disc">
                <code className="text-xs">{f.nome}</code> —{" "}
                {f.protegida ? <span className="text-slate-500">exige ser administrador por dentro</span> : EXPLICACAO_FUNCAO[f.nome] ? <span className="text-slate-500">{EXPLICACAO_FUNCAO[f.nome]}</span> : <span className="font-semibold text-amber-700">conferir se precisa mesmo ser aberta</span>}
              </li>
            ))}
          </ul>
        </li>
        <li>
          <strong>Administradores:</strong> {s.administradores.map((a) => a.primeiro_nome).join(", ") || "nenhum"}
        </li>
        <li>
          <strong>IA:</strong> {s.ia_bloqueios_7d} bloqueio(s) por limite em 7 dias; maior uso de uma única conta nas últimas 24 h: {s.maior_uso_ia_24h} chamada(s).
        </li>
      </ul>

      <p className="mt-6 text-xs text-slate-400">Atualizado em {new Date(r.gerado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.</p>
    </div>
  );
}
