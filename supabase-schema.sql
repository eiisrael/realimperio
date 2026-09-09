-- Real Império FC — backend Supabase de produção
-- Execute este arquivo UMA VEZ no SQL Editor do projeto Real Império FC.
-- Depois, crie os dois administradores com as chamadas app_seed_admin descritas no fim do arquivo.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.app_content (
  id smallint primary key default 1 check (id = 1),
  team jsonb not null default '{}'::jsonb,
  coach jsonb not null default '{}'::jsonb,
  events jsonb not null default '[]'::jsonb,
  news jsonb not null default '[]'::jsonb,
  lineup jsonb not null default '{}'::jsonb,
  audit jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id text primary key,
  name text not null,
  email text not null unique,
  whatsapp text not null default '',
  position text not null default '',
  number text not null default '',
  goals integer not null default 0 check (goals >= 0),
  bio text not null default '',
  photo text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('player','admin','superadmin')),
  player_id text unique references public.players(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_sessions (
  token_hash bytea primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists app_sessions_user_id_idx on public.app_sessions(user_id);
create index if not exists app_sessions_expires_at_idx on public.app_sessions(expires_at);
create index if not exists players_status_idx on public.players(status);
create unique index if not exists players_email_lower_idx on public.players(lower(email));
create unique index if not exists app_users_email_lower_idx on public.app_users(lower(email));

insert into public.app_content(id,team,coach,events,news,lineup,audit)
values (
  1,
  jsonb_build_object(
    'name','Real Império FC',
    'neighborhood','Indianópolis',
    'city','Caruaru-PE',
    'generalAdmin','italorodrigo550@gmail.com',
    'founded','',
    'trainingPlace','Indianópolis, Caruaru-PE',
    'description','O Real Império FC representa a paixão pelo futebol em Indianópolis, Caruaru-PE. Este espaço reúne a agenda do time, notícias, elenco e registros dos momentos vividos dentro e fora de campo.'
  ),
  jsonb_build_object('name','','photo','','whatsapp','','bio','','role','Técnico'),
  '[
    {"id":"evt_1","type":"training","title":"Treino do elenco","date":"2026-09-10","time":"19:30","place":"Indianópolis, Caruaru-PE","opponent":"","notes":"Chegar com antecedência para organização."},
    {"id":"evt_2","type":"game","title":"Próximo jogo","date":"2026-09-13","time":"09:00","place":"A confirmar","opponent":"Adversário a confirmar","notes":"Detalhes podem ser atualizados pelo administrador."},
    {"id":"evt_3","type":"training","title":"Treino técnico","date":"2026-09-17","time":"19:30","place":"Indianópolis, Caruaru-PE","opponent":"","notes":""}
  ]'::jsonb,
  '[{"id":"news_1","title":"Aplicativo do Real Império FC","body":"O novo espaço do Real Império FC já está em construção para reunir agenda, notícias e elenco do time em um só lugar.","date":"2026-09-08","image":""}]'::jsonb,
  '{
    "formation":"4-3-3",
    "baseFormation":"4-3-3",
    "customized":false,
    "slots":{"p1":null,"p2":null,"p3":null,"p4":null,"p5":null,"p6":null,"p7":null,"p8":null,"p9":null,"p10":null,"gk":null},
    "coordinates":{}
  }'::jsonb,
  '[]'::jsonb
)
on conflict (id) do nothing;

alter table public.app_content enable row level security;
alter table public.players enable row level security;
alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;

create or replace function public._app_player_json(p public.players)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'id',p.id,
    'name',p.name,
    'email',p.email,
    'whatsapp',p.whatsapp,
    'position',p.position,
    'number',p.number,
    'goals',p.goals,
    'bio',p.bio,
    'photo',p.photo,
    'status',p.status,
    'createdAt',p.created_at
  );
$$;

create or replace function public._app_session(p_token text)
returns public.app_users
language sql
stable
security definer
set search_path = public, extensions
as $$
  select u.*
  from public.app_sessions s
  join public.app_users u on u.id = s.user_id
  where s.token_hash = digest(coalesce(p_token,''),'sha256')
    and s.expires_at > now()
  order by s.expires_at desc
  limit 1;
$$;

create or replace function public._app_remove_player_from_lineup(p_player_id text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_slots jsonb;
begin
  select coalesce(
    (
      select jsonb_object_agg(
        e.key,
        case when e.value = to_jsonb(p_player_id) then 'null'::jsonb else e.value end
      )
      from jsonb_each(coalesce(lineup->'slots','{}'::jsonb)) e
    ),
    '{}'::jsonb
  )
  into v_slots
  from public.app_content
  where id=1;

  update public.app_content
  set lineup=jsonb_set(coalesce(lineup,'{}'::jsonb),'{slots}',coalesce(v_slots,'{}'::jsonb),true),
      updated_at=now()
  where id=1;
end;
$$;

create or replace function public.app_session_info(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user public.app_users;
  v_name text;
begin
  select * into v_user from public._app_session(p_token);
  if v_user.id is null then
    return null;
  end if;

  if v_user.role='player' then
    select name into v_name from public.players where id=v_user.player_id;
  else
    v_name:=v_user.display_name;
  end if;

  return jsonb_build_object(
    'role',v_user.role,
    'playerId',v_user.player_id,
    'name',coalesce(nullif(v_name,''),v_user.display_name,'Usuário')
  );
end;
$$;

create or replace function public.app_get_state(p_token text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user public.app_users;
  v_players jsonb;
  v_content public.app_content;
  v_is_admin boolean:=false;
begin
  if coalesce(p_token,'')<>'' then
    select * into v_user from public._app_session(p_token);
    v_is_admin:=coalesce(v_user.role in ('admin','superadmin'),false);
  end if;

  select * into v_content from public.app_content where id=1;

  select coalesce(jsonb_agg(public._app_player_json(p) order by p.name),'[]'::jsonb)
  into v_players
  from public.players p
  where
    v_is_admin
    or p.status='approved'
    or (v_user.role='player' and p.id=v_user.player_id);

  return jsonb_build_object(
    'team',coalesce(v_content.team,'{}'::jsonb),
    'coach',coalesce(v_content.coach,'{}'::jsonb),
    'events',coalesce(v_content.events,'[]'::jsonb),
    'news',coalesce(v_content.news,'[]'::jsonb),
    'players',coalesce(v_players,'[]'::jsonb),
    'lineup',coalesce(v_content.lineup,'{}'::jsonb),
    'gallery','[]'::jsonb,
    'audit',case when v_is_admin then coalesce(v_content.audit,'[]'::jsonb) else '[]'::jsonb end
  );
end;
$$;

create or replace function public.app_register_player(
  p_name text,
  p_email text,
  p_password text,
  p_position text default '',
  p_whatsapp text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_email text:=lower(trim(coalesce(p_email,'')));
  v_name text:=trim(coalesce(p_name,''));
  v_player_id text;
begin
  if length(v_name)<2 then raise exception 'Informe seu nome completo.'; end if;
  if position('@' in v_email)<2 then raise exception 'Informe um e-mail válido.'; end if;
  if length(coalesce(p_password,''))<6 then raise exception 'A senha precisa ter pelo menos 6 caracteres.'; end if;

  if v_email in ('italorodrigo550@gmail.com','erickigaudencio@gmail.com') then
    raise exception 'Este e-mail é reservado para a administração.';
  end if;

  if exists(select 1 from public.app_users where lower(email)=v_email)
     or exists(select 1 from public.players where lower(email)=v_email) then
    raise exception 'Este e-mail já possui cadastro.';
  end if;

  v_player_id:='player_'||replace(gen_random_uuid()::text,'-','');

  insert into public.players(id,name,email,whatsapp,position,status)
  values(v_player_id,v_name,v_email,trim(coalesce(p_whatsapp,'')),trim(coalesce(p_position,'')),'pending');

  insert into public.app_users(email,password_hash,role,player_id,display_name)
  values(v_email,crypt(p_password,gen_salt('bf',10)),'player',v_player_id,v_name);

  return jsonb_build_object('ok',true,'playerId',v_player_id,'status','pending');
end;
$$;

create or replace function public.app_login(p_email text,p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_email text:=lower(trim(coalesce(p_email,'')));
  v_user public.app_users;
  v_player public.players;
  v_token text;
  v_name text;
begin
  select * into v_user from public.app_users where lower(email)=v_email limit 1;

  if v_user.id is null or v_user.password_hash<>crypt(coalesce(p_password,''),v_user.password_hash) then
    raise exception 'E-mail ou senha inválidos.';
  end if;

  if v_user.role='player' then
    select * into v_player from public.players where id=v_user.player_id;
    if v_player.id is null then raise exception 'Cadastro de jogador não encontrado.'; end if;
    if v_player.status='pending' then
      raise exception 'Sua conta está em análise técnica. Aguarde a aprovação do administrador.';
    end if;
    if v_player.status='rejected' then
      raise exception 'Seu cadastro não está autorizado para acesso. Entre em contato com a administração.';
    end if;
    v_name:=v_player.name;
  else
    v_name:=v_user.display_name;
  end if;

  delete from public.app_sessions where expires_at<=now();
  v_token:=encode(gen_random_bytes(32),'hex');

  insert into public.app_sessions(token_hash,user_id,expires_at)
  values(digest(v_token,'sha256'),v_user.id,now()+interval '30 days');

  return jsonb_build_object(
    'remoteToken',v_token,
    'role',v_user.role,
    'playerId',v_user.player_id,
    'name',coalesce(nullif(v_name,''),'Usuário')
  );
end;
$$;

create or replace function public.app_logout(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public.app_sessions where token_hash=digest(coalesce(p_token,''),'sha256');
  return true;
end;
$$;

create or replace function public.app_player_update_profile(
  p_token text,
  p_name text,
  p_email text,
  p_number text default '',
  p_position text default '',
  p_whatsapp text default '',
  p_bio text default '',
  p_photo text default '',
  p_new_password text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user public.app_users;
  v_player public.players;
  v_email text:=lower(trim(coalesce(p_email,'')));
  v_name text:=trim(coalesce(p_name,''));
begin
  select * into v_user from public._app_session(p_token);
  if v_user.id is null or v_user.role<>'player' then raise exception 'Sessão de jogador inválida.'; end if;

  select * into v_player from public.players where id=v_user.player_id;
  if v_player.id is null then raise exception 'Cadastro de jogador não encontrado.'; end if;
  if v_player.status<>'approved' then raise exception 'Sua conta não está liberada para alterações.'; end if;

  if length(v_name)<2 then raise exception 'Informe seu nome.'; end if;
  if position('@' in v_email)<2 then raise exception 'Informe um e-mail válido.'; end if;
  if exists(select 1 from public.app_users where lower(email)=v_email and id<>v_user.id) then
    raise exception 'Este e-mail já está em uso.';
  end if;
  if coalesce(p_new_password,'')<>'' and length(p_new_password)<6 then
    raise exception 'A nova senha precisa ter pelo menos 6 caracteres.';
  end if;

  update public.players
  set name=v_name,
      email=v_email,
      number=trim(coalesce(p_number,'')),
      position=trim(coalesce(p_position,'')),
      whatsapp=trim(coalesce(p_whatsapp,'')),
      bio=trim(coalesce(p_bio,'')),
      photo=coalesce(p_photo,''),
      updated_at=now()
  where id=v_user.player_id
  returning * into v_player;

  update public.app_users
  set email=v_email,
      display_name=v_name,
      password_hash=case when coalesce(p_new_password,'')<>'' then crypt(p_new_password,gen_salt('bf',10)) else password_hash end,
      updated_at=now()
  where id=v_user.id;

  return public._app_player_json(v_player);
end;
$$;

create or replace function public.app_admin_save_content(p_token text,p_content jsonb)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user public.app_users;
begin
  select * into v_user from public._app_session(p_token);
  if v_user.id is null or v_user.role not in ('admin','superadmin') then raise exception 'Acesso administrativo inválido.'; end if;

  update public.app_content
  set team=coalesce(p_content->'team',team),
      coach=coalesce(p_content->'coach',coach),
      events=coalesce(p_content->'events',events),
      news=coalesce(p_content->'news',news),
      lineup=coalesce(p_content->'lineup',lineup),
      audit=coalesce(p_content->'audit',audit),
      updated_at=now()
  where id=1;

  return true;
end;
$$;

create or replace function public.app_admin_upsert_player(
  p_token text,
  p_player jsonb,
  p_password text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_admin public.app_users;
  v_user public.app_users;
  v_player public.players;
  v_id text:=trim(coalesce(p_player->>'id',''));
  v_name text:=trim(coalesce(p_player->>'name',''));
  v_email text:=lower(trim(coalesce(p_player->>'email','')));
  v_status text:=coalesce(nullif(trim(p_player->>'status'),''),'pending');
  v_goals integer:=greatest(0,coalesce(nullif(p_player->>'goals','')::integer,0));
  v_is_new boolean:=false;
begin
  select * into v_admin from public._app_session(p_token);
  if v_admin.id is null or v_admin.role not in ('admin','superadmin') then raise exception 'Acesso administrativo inválido.'; end if;

  if length(v_name)<2 then raise exception 'Informe o nome do jogador.'; end if;
  if position('@' in v_email)<2 then raise exception 'Informe um e-mail válido.'; end if;
  if v_email in ('italorodrigo550@gmail.com','erickigaudencio@gmail.com') then raise exception 'Este e-mail é reservado para a administração.'; end if;
  if v_status not in ('pending','approved','rejected') then raise exception 'Status de jogador inválido.'; end if;

  if v_id='' then
    v_id:='player_'||replace(gen_random_uuid()::text,'-','');
    v_is_new:=true;
  else
    select * into v_player from public.players where id=v_id;
    v_is_new:=v_player.id is null;
  end if;

  if exists(select 1 from public.players where lower(email)=v_email and id<>v_id) then
    raise exception 'E-mail já cadastrado.';
  end if;

  if v_is_new then
    insert into public.players(id,name,email,whatsapp,position,number,goals,bio,photo,status)
    values(
      v_id,v_name,v_email,
      trim(coalesce(p_player->>'whatsapp','')),
      trim(coalesce(p_player->>'position','')),
      trim(coalesce(p_player->>'number','')),
      v_goals,
      trim(coalesce(p_player->>'bio','')),
      coalesce(p_player->>'photo',''),
      v_status
    )
    returning * into v_player;
  else
    update public.players
    set name=v_name,
        email=v_email,
        whatsapp=trim(coalesce(p_player->>'whatsapp','')),
        position=trim(coalesce(p_player->>'position','')),
        number=trim(coalesce(p_player->>'number','')),
        goals=v_goals,
        bio=trim(coalesce(p_player->>'bio','')),
        photo=coalesce(p_player->>'photo',''),
        status=v_status,
        updated_at=now()
    where id=v_id
    returning * into v_player;
  end if;

  select * into v_user from public.app_users where player_id=v_id limit 1;

  if v_user.id is null then
    if length(coalesce(p_password,''))<6 then
      if v_is_new then raise exception 'Defina uma senha de pelo menos 6 caracteres para o novo jogador.'; end if;
    else
      if exists(select 1 from public.app_users where lower(email)=v_email) then
        raise exception 'Este e-mail já possui uma conta de acesso.';
      end if;
      insert into public.app_users(email,password_hash,role,player_id,display_name)
      values(v_email,crypt(p_password,gen_salt('bf',10)),'player',v_id,v_name);
    end if;
  else
    if exists(select 1 from public.app_users where lower(email)=v_email and id<>v_user.id) then
      raise exception 'Este e-mail já possui uma conta de acesso.';
    end if;
    update public.app_users
    set email=v_email,
        display_name=v_name,
        password_hash=case when coalesce(p_password,'')<>'' then crypt(p_password,gen_salt('bf',10)) else password_hash end,
        updated_at=now()
    where id=v_user.id;
  end if;

  return public._app_player_json(v_player);
end;
$$;

create or replace function public.app_admin_set_player_status(p_token text,p_player_id text,p_status text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_admin public.app_users;
begin
  select * into v_admin from public._app_session(p_token);
  if v_admin.id is null or v_admin.role not in ('admin','superadmin') then raise exception 'Acesso administrativo inválido.'; end if;
  if p_status not in ('pending','approved','rejected') then raise exception 'Status inválido.'; end if;

  update public.players set status=p_status,updated_at=now() where id=p_player_id;
  if not found then raise exception 'Jogador não encontrado.'; end if;

  if p_status='rejected' then
    perform public._app_remove_player_from_lineup(p_player_id);
  end if;
  return true;
end;
$$;

create or replace function public.app_admin_delete_player(p_token text,p_player_id text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_admin public.app_users;
begin
  select * into v_admin from public._app_session(p_token);
  if v_admin.id is null or v_admin.role not in ('admin','superadmin') then raise exception 'Acesso administrativo inválido.'; end if;

  perform public._app_remove_player_from_lineup(p_player_id);
  delete from public.players where id=p_player_id;
  if not found then raise exception 'Jogador não encontrado.'; end if;
  return true;
end;
$$;

-- Somente o dono do projeto deve executar esta função pelo SQL Editor.
-- Ela NÃO recebe permissão para anon/authenticated.
create or replace function public.app_seed_admin(
  p_email text,
  p_password text,
  p_role text,
  p_name text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_email text:=lower(trim(coalesce(p_email,'')));
begin
  if v_email='italorodrigo550@gmail.com' and p_role<>'admin' then
    raise exception 'Função administrativa incorreta para este e-mail.';
  end if;
  if v_email='erickigaudencio@gmail.com' and p_role<>'superadmin' then
    raise exception 'Função administrativa incorreta para este e-mail.';
  end if;
  if v_email not in ('italorodrigo550@gmail.com','erickigaudencio@gmail.com') then
    raise exception 'E-mail não autorizado para bootstrap administrativo.';
  end if;
  if length(coalesce(p_password,''))<6 then raise exception 'A senha precisa ter pelo menos 6 caracteres.'; end if;

  insert into public.app_users(email,password_hash,role,player_id,display_name)
  values(v_email,crypt(p_password,gen_salt('bf',10)),p_role,null,trim(coalesce(p_name,'')))
  on conflict (email) do update
    set password_hash=excluded.password_hash,
        role=excluded.role,
        player_id=null,
        display_name=excluded.display_name,
        updated_at=now();

  return true;
end;
$$;

-- Segurança: nenhuma tabela fica exposta diretamente ao cliente.
revoke all on public.app_content from anon, authenticated;
revoke all on public.players from anon, authenticated;
revoke all on public.app_users from anon, authenticated;
revoke all on public.app_sessions from anon, authenticated;

revoke all on function public._app_player_json(public.players) from public, anon, authenticated;
revoke all on function public._app_session(text) from public, anon, authenticated;
revoke all on function public._app_remove_player_from_lineup(text) from public, anon, authenticated;
revoke all on function public.app_seed_admin(text,text,text,text) from public, anon, authenticated;

grant execute on function public.app_session_info(text) to anon, authenticated;
grant execute on function public.app_get_state(text) to anon, authenticated;
grant execute on function public.app_register_player(text,text,text,text,text) to anon, authenticated;
grant execute on function public.app_login(text,text) to anon, authenticated;
grant execute on function public.app_logout(text) to anon, authenticated;
grant execute on function public.app_player_update_profile(text,text,text,text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.app_admin_save_content(text,jsonb) to anon, authenticated;
grant execute on function public.app_admin_upsert_player(text,jsonb,text) to anon, authenticated;
grant execute on function public.app_admin_set_player_status(text,text,text) to anon, authenticated;
grant execute on function public.app_admin_delete_player(text,text) to anon, authenticated;

-- Após executar este arquivo, ainda no SQL Editor, execute:
-- select public.app_seed_admin('italorodrigo550@gmail.com','SUA_SENHA','admin','Técnico');
-- select public.app_seed_admin('erickigaudencio@gmail.com','SUA_SENHA','superadmin','Administração Total');
