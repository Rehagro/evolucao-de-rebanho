-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  Evolução de Rebanho — Schema Supabase                               ║
-- ║                                                                       ║
-- ║  Tabelas: profiles, fazendas, dados_rebanho                          ║
-- ║  Cada "evolução" de fazenda = uma linha em `fazendas` (Caminho A).   ║
-- ║  Dados grandes (parâmetros, rebanho, cenários, logo) vivem em        ║
-- ║  `dados_rebanho` em colunas JSONB.                                   ║
-- ║                                                                       ║
-- ║  Como rodar: cole TUDO no SQL Editor do Supabase e execute.          ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ─── 1. PROFILES ──────────────────────────────────────────────────────────
-- Estende auth.users com nome e perfil (tecnico ou admin).
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text not null,
  email text not null,
  perfil text not null check (perfil in ('tecnico', 'admin')),
  criado_em timestamptz default now()
);

alter table public.profiles enable row level security;

-- Função helper SECURITY DEFINER pra checar se o user atual é admin
-- (evita recursão infinita nas policies que dependem desse check).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and perfil = 'admin');
$$;

-- Cada usuário vê apenas seu próprio perfil
drop policy if exists "Técnico vê seu perfil" on public.profiles;
create policy "Técnico vê seu perfil" on public.profiles
  for select using (auth.uid() = id);

-- Admin vê todos os perfis (usa função SECURITY DEFINER pra não recursão)
drop policy if exists "Admin vê todos os perfis" on public.profiles;
create policy "Admin vê todos os perfis" on public.profiles
  for select using (public.is_admin());

-- Usuário atualiza seu próprio perfil (nome). Não pode promover-se a admin
-- (perfil bloqueado por trigger abaixo).
drop policy if exists "Usuário atualiza seu perfil" on public.profiles;
create policy "Usuário atualiza seu perfil" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);


-- ─── 2. FAZENDAS ──────────────────────────────────────────────────────────
-- Cada linha = uma EVOLUÇÃO (Caminho A). Várias evoluções da mesma fazenda
-- viram várias linhas com nomes tipo "Bela Vista — Mai/26", "Bela Vista — Ago/26".
create table if not exists public.fazendas (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  proprietario text,
  municipio text,
  estado text,
  -- RESTRICT: bloqueia delete de técnico que tem fazendas (protege dados).
  tecnico_id uuid references public.profiles(id) on delete restrict not null,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create index if not exists fazendas_tecnico_idx on public.fazendas(tecnico_id);

alter table public.fazendas enable row level security;

-- Técnico vê apenas suas fazendas
drop policy if exists "Técnico vê suas fazendas" on public.fazendas;
create policy "Técnico vê suas fazendas" on public.fazendas
  for select using (tecnico_id = auth.uid());

-- Técnico cria/edita/deleta apenas suas fazendas.
-- WITH CHECK explícito garante que insert/update mantém tecnico_id = auth.uid().
drop policy if exists "Técnico gerencia suas fazendas" on public.fazendas;
create policy "Técnico gerencia suas fazendas" on public.fazendas
  for all using (tecnico_id = auth.uid())
  with check (tecnico_id = auth.uid());

-- Admin vê todas as fazendas (read-only V1)
drop policy if exists "Admin vê todas as fazendas" on public.fazendas;
create policy "Admin vê todas as fazendas" on public.fazendas
  for select using (public.is_admin());


-- ─── 3. DADOS DO REBANHO ──────────────────────────────────────────────────
-- 1 linha por fazenda. Tudo (parâmetros, estado, rebanho, cenários, logo)
-- em colunas JSONB. Simples e direto. Tamanho típico: 200KB-2MB por linha.
create table if not exists public.dados_rebanho (
  fazenda_id uuid primary key references public.fazendas(id) on delete cascade,
  parametros jsonb not null default '{}',
  estado_atual jsonb,
  rebanho_atual jsonb,         -- CSVs parseados (vacas em secagem, agenda, animais)
  cenario_a jsonb,
  cenario_b jsonb,
  previsto_realizado jsonb default '[]'::jsonb,
  logo_base64 text,
  data_ultimo_upload timestamptz,
  atualizado_em timestamptz default now()
);

alter table public.dados_rebanho enable row level security;

-- Técnico CRUD nos dados das suas fazendas
drop policy if exists "Técnico acessa dados de suas fazendas" on public.dados_rebanho;
create policy "Técnico acessa dados de suas fazendas" on public.dados_rebanho
  for all using (
    exists (
      select 1 from public.fazendas f
      where f.id = fazenda_id and f.tecnico_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.fazendas f
      where f.id = fazenda_id and f.tecnico_id = auth.uid()
    )
  );

-- Admin vê todos os dados
drop policy if exists "Admin vê todos os dados" on public.dados_rebanho;
create policy "Admin vê todos os dados" on public.dados_rebanho
  for select using (public.is_admin());


-- ─── 4. TRIGGER: criar profile automaticamente após signup ────────────────
-- Quando auth.users recebe nova linha, cria public.profiles correspondente.
-- raw_user_meta_data deve conter `nome` (opcional) e `perfil` (default 'tecnico').
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nome, email, perfil)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'perfil', 'tecnico')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── 5. TRIGGER: bloquear update do campo `perfil` ────────────────────────
-- Usuário não pode se promover a admin via UPDATE no profiles.
-- Só admin (via SQL direto ou painel Supabase) altera o perfil.
create or replace function public.bloquear_promocao_admin()
returns trigger language plpgsql security definer as $$
begin
  if new.perfil is distinct from old.perfil then
    -- Permite se quem está fazendo é admin OU se foi feito via trigger/SQL direto
    if not public.is_admin() and auth.uid() is not null then
      raise exception 'Apenas admin pode alterar o campo perfil';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists bloquear_promocao on public.profiles;
create trigger bloquear_promocao
  before update on public.profiles
  for each row execute function public.bloquear_promocao_admin();


-- ─── 6. TRIGGER: bump atualizado_em automaticamente ────────────────────────
create or replace function public.bump_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists fazendas_bump on public.fazendas;
create trigger fazendas_bump
  before update on public.fazendas
  for each row execute function public.bump_atualizado_em();

drop trigger if exists dados_rebanho_bump on public.dados_rebanho;
create trigger dados_rebanho_bump
  before update on public.dados_rebanho
  for each row execute function public.bump_atualizado_em();


-- ─── 7. GRANTS — direito básico pro role `authenticated` ─────────────────
-- Sem grants, mesmo com RLS, Supabase retorna 403 (permission denied).
-- RLS define QUE linhas o usuário vê; o grant dá o direito de acessar a tabela.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.fazendas to authenticated;
grant select, insert, update, delete on public.dados_rebanho to authenticated;
grant execute on function public.is_admin() to authenticated;


-- ─── PRONTO ───────────────────────────────────────────────────────────────
-- Próximo passo: criar o primeiro admin pelo painel Supabase Authentication.
-- Veja o guia em app/supabase/SETUP.md
