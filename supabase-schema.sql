-- Real Império FC
-- Esqueleto para a futura migração do protótipo local para Supabase.
-- NÃO executar em produção sem revisar as políticas e definir os administradores no Auth.

create extension if not exists pgcrypto;

create type public.player_status as enum ('pending', 'approved', 'rejected');
create type public.event_type as enum ('game', 'training');
create type public.app_role as enum ('player', 'admin', 'superadmin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'player',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  whatsapp text,
  position text,
  shirt_number text,
  goals integer not null default 0 check (goals >= 0),
  lineup_slot text unique check (
    lineup_slot is null or lineup_slot in (
      'lw','st','rw','lcm','cm','rcm','lb','lcb','rcb','rb','gk'
    )
  ),
  bio text,
  photo_url text,
  status public.player_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_info (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Real Império FC',
  neighborhood text default 'Indianópolis',
  city text default 'Caruaru-PE',
  training_place text,
  founded text,
  general_admin_email text,
  description text,
  lineup_formation text not null default '4-3-3',
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  type public.event_type not null,
  title text not null,
  event_date date not null,
  event_time time,
  place text,
  opponent text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  published_on date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.team_info enable row level security;
alter table public.events enable row level security;
alter table public.news enable row level security;
alter table public.gallery enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'superadmin')
  );
$$;

-- Conteúdo público
create policy "public read approved players" on public.players for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy "public read team info" on public.team_info for select using (true);
create policy "public read events" on public.events for select using (true);
create policy "public read news" on public.news for select using (true);
create policy "public read gallery" on public.gallery for select using (true);

-- Cadastro do jogador.
-- Na implementação final, goals, lineup_slot e status devem ser alterados somente pela administração.
create policy "player insert own application" on public.players for insert with check (user_id = auth.uid());
create policy "player update own application" on public.players for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Administração
create policy "admin manage players" on public.players for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage team" on public.team_info for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage events" on public.events for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage news" on public.news for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage gallery" on public.gallery for all using (public.is_admin()) with check (public.is_admin());

-- Profiles: cada usuário lê o próprio; admins podem ler todos.
create policy "profile self read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profile self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Storage sugerido para próxima etapa:
-- bucket público: team-gallery
-- bucket público: player-photos
