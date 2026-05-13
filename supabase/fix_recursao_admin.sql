-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  PATCH — corrige recursão infinita na policy "Admin vê todos"        ║
-- ║                                                                       ║
-- ║  Rode no SQL Editor do Supabase. É idempotente (pode rodar várias    ║
-- ║  vezes sem dar erro).                                                ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- Função helper SECURITY DEFINER — checa admin sem disparar RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and perfil = 'admin');
$$;

-- Recriar as 3 policies que tinham subquery recursiva em profiles

-- Profiles: admin vê todos
drop policy if exists "Admin vê todos os perfis" on public.profiles;
create policy "Admin vê todos os perfis" on public.profiles
  for select using (public.is_admin());

-- Fazendas: admin vê todas
drop policy if exists "Admin vê todas as fazendas" on public.fazendas;
create policy "Admin vê todas as fazendas" on public.fazendas
  for select using (public.is_admin());

-- Dados rebanho: admin vê todos
drop policy if exists "Admin vê todos os dados" on public.dados_rebanho;
create policy "Admin vê todos os dados" on public.dados_rebanho
  for select using (public.is_admin());

-- ─── GRANTS — direito básico de acesso pro role `authenticated` ──────────
-- Sem isso, mesmo com RLS aberto, Supabase retorna 403 (permission denied).
-- As RLS policies cuidam de QUE linhas o usuário vê; o grant dá o direito
-- de tocar na tabela em si.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.fazendas to authenticated;
grant select, insert, update, delete on public.dados_rebanho to authenticated;
grant execute on function public.is_admin() to authenticated;
