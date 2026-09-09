-- Real Império FC — limpeza do schema legado antes da instalação de produção
-- Use apenas no projeto Supabase dedicado ao Real Império FC.
-- Este script remove SOMENTE objetos públicos usados por versões anteriores deste projeto.

begin;

-- Funções que podem depender das tabelas antigas.
drop function if exists public.app_seed_admin(text,text,text,text) cascade;
drop function if exists public.app_admin_delete_player(text,text) cascade;
drop function if exists public.app_admin_set_player_status(text,text,text) cascade;
drop function if exists public.app_admin_upsert_player(text,jsonb,text) cascade;
drop function if exists public.app_admin_save_content(text,jsonb) cascade;
drop function if exists public.app_player_update_profile(text,text,text,text,text,text,text,text,text) cascade;
drop function if exists public.app_logout(text) cascade;
drop function if exists public.app_login(text,text) cascade;
drop function if exists public.app_register_player(text,text,text,text,text) cascade;
drop function if exists public.app_get_state(text) cascade;
drop function if exists public.app_session_info(text) cascade;
drop function if exists public._app_remove_player_from_lineup(text) cascade;
drop function if exists public._app_session(text) cascade;

-- Tabelas da implementação de produção / tentativas parciais.
drop table if exists public.app_sessions cascade;
drop table if exists public.app_users cascade;
drop table if exists public.app_content cascade;

-- Tabelas do schema legado inicial.
drop table if exists public.players cascade;
drop table if exists public.profiles cascade;
drop table if exists public.team_info cascade;
drop table if exists public.events cascade;
drop table if exists public.news cascade;

-- Tipos do schema legado inicial.
drop type if exists public.player_status cascade;
drop type if exists public.event_type cascade;
drop type if exists public.app_role cascade;

commit;

-- Depois deste reset, execute o arquivo supabase-schema.sql completo.
