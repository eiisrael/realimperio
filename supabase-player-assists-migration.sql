-- Real Império FC — adiciona assistências aos jogadores
-- Migração idempotente para o backend Supabase de produção.

alter table public.players
  add column if not exists assists integer not null default 0;

update public.players
set assists=greatest(0,coalesce(assists,0));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname='players_assists_nonnegative'
      and conrelid='public.players'::regclass
  ) then
    alter table public.players
      add constraint players_assists_nonnegative check (assists >= 0);
  end if;
end
$$;

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
    'assists',p.assists,
    'bio',p.bio,
    'photo',p.photo,
    'status',p.status,
    'createdAt',p.created_at
  );
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
  v_assists integer:=greatest(0,coalesce(nullif(p_player->>'assists','')::integer,0));
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
    insert into public.players(id,name,email,whatsapp,position,number,goals,assists,bio,photo,status)
    values(
      v_id,v_name,v_email,
      trim(coalesce(p_player->>'whatsapp','')),
      trim(coalesce(p_player->>'position','')),
      trim(coalesce(p_player->>'number','')),
      v_goals,
      v_assists,
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
        assists=v_assists,
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
