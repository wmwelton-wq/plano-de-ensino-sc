-- =====================================================================================================
-- Plano Docente — aba "Usuários", cadastros fechados, localização aproximada e verificação em 2 etapas
-- REGISTRO do que já foi aplicado no banco (Supabase) em out/2026. Não é necessário rodar de novo.
-- Em um banco novo, rode na ordem: tabelas -> funções -> permissões (revoke/grant) -> trigger.
-- =====================================================================================================

-- ---------- Tabelas (todas com RLS ligado e SEM políticas: só o service_role e funções SECURITY DEFINER acessam) ----------
create table if not exists public.cadastro_controle (id integer primary key default 1 check (id = 1), abertos boolean not null default false, atualizado_em timestamptz not null default now());
insert into public.cadastro_controle (id, abertos) values (1, false) on conflict (id) do nothing;
create table if not exists public.cadastros_liberados (email text primary key, criado_em timestamptz not null default now()); -- e-mails (minúsculos) que podem se cadastrar mesmo com cadastros fechados
create table if not exists public.acessos_usuarios (
  professor_id uuid primary key references auth.users(id) on delete cascade,
  primeiro_em timestamptz not null default now(), primeiro_cidade text, primeiro_regiao text, primeiro_pais text,
  ultimo_em timestamptz not null default now(), ultimo_cidade text, ultimo_regiao text, ultimo_pais text
);
create table if not exists public.admin_acoes_log (
  id bigint generated always as identity primary key, admin_id uuid not null, acao text not null,
  alvo_id uuid, alvo_email_mascarado text, em timestamptz not null default now()
);
create table if not exists public.sf_chaves (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique, chave_publica jsonb not null, alg integer not null, rp_id text not null,
  contador bigint not null default 0, nome text not null default 'Chave de segurança',
  criado_em timestamptz not null default now(), ultimo_uso timestamptz
);
create table if not exists public.sf_desafios (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null, valor text not null, sal text, tentativas integer not null default 0, usado boolean not null default false,
  criado_em timestamptz not null default now(), expira_em timestamptz not null
);
create table if not exists public.sf_config (user_id uuid primary key references auth.users(id) on delete cascade, email_ativo boolean not null default false, atualizado_em timestamptz not null default now());
create table if not exists public.sf_sessoes (
  session_id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  metodo text not null, criado_em timestamptz not null default now(), expira_em timestamptz not null
);
alter table public.cadastro_controle enable row level security;
alter table public.cadastros_liberados enable row level security;
alter table public.acessos_usuarios enable row level security;
alter table public.admin_acoes_log enable row level security;
alter table public.sf_chaves enable row level security;
alter table public.sf_desafios enable row level security;
alter table public.sf_config enable row level security;
alter table public.sf_sessoes enable row level security;

-- ---------- Funções ----------
CREATE OR REPLACE FUNCTION public.bloquear_novos_cadastros() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
begin
  if coalesce((select abertos from public.cadastro_controle where id = 1), false) then return new; end if;
  if exists (select 1 from public.cadastros_liberados l where l.email = lower(btrim(coalesce(new.email, '')))) then return new; end if;
  raise exception 'Cadastros fechados no momento (fase de testes).' using errcode = 'P0001';
end; $f$;

CREATE OR REPLACE FUNCTION public.cadastros_abertos() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $f$
  select coalesce((select abertos from public.cadastro_controle where id = 1), false); $f$;

CREATE OR REPLACE FUNCTION public.mascarar_email(p_email text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $f$
  select case when p_email is null then null else left(split_part(p_email, '@', 1), 2) || '***@' || split_part(p_email, '@', 2) end; $f$;

CREATE OR REPLACE FUNCTION public.sf_sessao_atual() RETURNS uuid LANGUAGE sql STABLE SET search_path TO 'public' AS $f$
  select nullif(auth.jwt()->>'session_id', '')::uuid; $f$;

CREATE OR REPLACE FUNCTION public.sf_metodos(p_uid uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $f$
  select jsonb_build_object(
    'totp',  exists (select 1 from auth.mfa_factors f where f.user_id = p_uid and f.status = 'verified' and f.factor_type = 'totp'),
    'chave', exists (select 1 from public.sf_chaves k where k.user_id = p_uid),
    'email', coalesce((select c.email_ativo from public.sf_config c where c.user_id = p_uid), false)); $f$;

-- Verdadeiro quando o usuário não ativou nenhuma segunda etapa, OU o token é aal2 (app autenticador), OU há marca válida em sf_sessoes (e-mail/chave).
CREATE OR REPLACE FUNCTION public.segundo_fator_ok() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $f$
  select case
    when (select auth.uid()) is null then false
    when not (
      exists (select 1 from auth.mfa_factors f where f.user_id = (select auth.uid()) and f.status = 'verified' and f.factor_type = 'totp')
      or exists (select 1 from public.sf_chaves k where k.user_id = (select auth.uid()))
      or coalesce((select c.email_ativo from public.sf_config c where c.user_id = (select auth.uid())), false)
    ) then true
    when coalesce(auth.jwt()->>'aal', '') = 'aal2' then true
    else exists (select 1 from public.sf_sessoes s where s.session_id = public.sf_sessao_atual() and s.user_id = (select auth.uid()) and s.expira_em > now())
  end; $f$;

CREATE OR REPLACE FUNCTION public.segundo_fator_estado() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $f$
declare uid uuid := (select auth.uid()); m jsonb;
begin
  if uid is null then return jsonb_build_object('exigido', false, 'ok', false, 'metodos', jsonb_build_object('totp', false, 'chave', false, 'email', false)); end if;
  m := public.sf_metodos(uid);
  return jsonb_build_object('exigido', (m->>'totp')::boolean or (m->>'chave')::boolean or (m->>'email')::boolean, 'ok', public.segundo_fator_ok(), 'metodos', m);
end; $f$;

CREATE OR REPLACE FUNCTION public.eh_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $f$
  select exists (
    select 1 from public.administradores a join auth.users u on u.id = a.professor_id
    where a.professor_id = (select auth.uid()) and a.email is not null and lower(u.email) = lower(a.email) and u.email_confirmed_at is not null
  ) and public.segundo_fator_ok(); $f$;

CREATE OR REPLACE FUNCTION public.registrar_acesso(p_cidade text, p_regiao text, p_pais text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
declare uid uuid := (select auth.uid()); c text; r text; p text;
begin
  if uid is null then return; end if;
  c := nullif(left(btrim(coalesce(p_cidade, '')), 80), '');
  r := nullif(left(btrim(coalesce(p_regiao, '')), 40), '');
  p := nullif(upper(left(btrim(coalesce(p_pais, '')), 3)), '');
  insert into public.acessos_usuarios as a (professor_id, primeiro_cidade, primeiro_regiao, primeiro_pais, ultimo_cidade, ultimo_regiao, ultimo_pais)
  values (uid, c, r, p, c, r, p)
  on conflict (professor_id) do update
    set ultimo_em = now(),
        ultimo_cidade = coalesce(excluded.ultimo_cidade, a.ultimo_cidade), ultimo_regiao = coalesce(excluded.ultimo_regiao, a.ultimo_regiao), ultimo_pais = coalesce(excluded.ultimo_pais, a.ultimo_pais),
        primeiro_cidade = coalesce(a.primeiro_cidade, excluded.ultimo_cidade), primeiro_regiao = coalesce(a.primeiro_regiao, excluded.ultimo_regiao), primeiro_pais = coalesce(a.primeiro_pais, excluded.ultimo_pais);
end; $f$;

-- As funções admin_* (todas SECURITY DEFINER e começando com "if not public.eh_admin() then raise exception 'acesso negado'"):
--   admin_listar_usuarios(p_busca text, p_limite int, p_deslocamento int) -> jsonb {total, itens[]}   (nome, e-mail, datas, bloqueado, provedor, local, nº de planos/escolas)
--   admin_origem_usuarios() -> jsonb {por_regiao, por_cidade, sem_localizacao, cadastros_abertos}
--   admin_bloquear_usuario(p_id uuid, p_bloquear boolean)   -- banned_until = agora + 100 anos (ou null) e encerra as sessões; recusa a si mesmo e administradores; grava em admin_acoes_log
--   admin_acoes_recentes() -> jsonb (15 últimas ações, e-mail mascarado)
--   admin_definir_cadastros(p_abertos boolean)               -- abre/fecha novos cadastros; grava em admin_acoes_log
--   admin_validar_exclusao(p_id uuid, p_email_confirmacao text) -> text   -- confere admin, não-si-mesmo, não-administrador e e-mail digitado; a exclusão em si é feita no servidor com a chave de serviço
-- (O código completo está no banco: select pg_get_functiondef('public.<nome>'::regproc).)

-- ---------- Gatilho: fecha os cadastros de usuários novos (e-mail/senha e Google) ----------
create trigger bloquear_novos_cadastros before insert on auth.users for each row execute function public.bloquear_novos_cadastros();

-- ---------- Políticas de storage para o administrador apagar arquivos de um usuário excluído ----------
-- "admin le arquivos de usuarios" (select) e "admin apaga arquivos de usuarios" (delete) em storage.objects,
-- para os buckets 'compartilhados' e 'logos-escolas', com using (public.eh_admin()).

-- ---------- Para abrir os cadastros no lançamento (ou use o botão na aba Usuários) ----------
-- update public.cadastro_controle set abertos = true, atualizado_em = now() where id = 1;
-- ---------- Recuperação de emergência (perdeu todos os métodos de 2 etapas) — rode no SQL Editor do Supabase ----------
-- delete from public.sf_chaves where user_id = '<id do admin>'; delete from public.sf_config where user_id = '<id>'; delete from auth.mfa_factors where user_id = '<id>';
