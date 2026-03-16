-- Rütbe ekleme/düzenleme/silme için RPC (RLS sorunlarını aşmak için)
-- Admin kontrolü yapıldıktan sonra SECURITY DEFINER ile işlem yapılır

create or replace function public.insert_rank_rpc(
  p_rank_name text,
  p_badge_prefix smallint,
  p_is_admin boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_id uuid;
begin
  -- Çağıran kişi admin mi?
  select exists (
    select 1 from public.profiles p
    join public.ranks r on r.id = p.rank_id
    where p.id = auth.uid() and r.is_admin = true
  ) into v_is_admin;

  if not v_is_admin then
    return jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  end if;

  if p_rank_name is null or trim(p_rank_name) = '' then
    return jsonb_build_object('success', false, 'error', 'Rütbe adı zorunludur');
  end if;

  if p_badge_prefix < 1 or p_badge_prefix > 9 then
    return jsonb_build_object('success', false, 'error', 'Rozet prefix 1-9 arası olmalı');
  end if;

  insert into public.ranks (rank_name, badge_prefix, is_admin)
  values (trim(p_rank_name), p_badge_prefix, coalesce(p_is_admin, false))
  returning id into v_id;

  return jsonb_build_object('success', true, 'id', v_id);
exception when unique_violation then
  return jsonb_build_object('success', false, 'error', 'Bu rütbe adı zaten mevcut');
when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

create or replace function public.update_rank_rpc(
  p_id uuid,
  p_rank_name text,
  p_badge_prefix smallint,
  p_is_admin boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  select exists (
    select 1 from public.profiles p
    join public.ranks r on r.id = p.rank_id
    where p.id = auth.uid() and r.is_admin = true
  ) into v_is_admin;

  if not v_is_admin then
    return jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  end if;

  update public.ranks set
    rank_name = coalesce(trim(nullif(p_rank_name, '')), rank_name),
    badge_prefix = coalesce(p_badge_prefix, badge_prefix),
    is_admin = coalesce(p_is_admin, is_admin)
  where id = p_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Rütbe bulunamadı');
  end if;

  return jsonb_build_object('success', true);
exception when unique_violation then
  return jsonb_build_object('success', false, 'error', 'Bu rütbe adı zaten mevcut');
when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

create or replace function public.delete_rank_rpc(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  select exists (
    select 1 from public.profiles p
    join public.ranks r on r.id = p.rank_id
    where p.id = auth.uid() and r.is_admin = true
  ) into v_is_admin;

  if not v_is_admin then
    return jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  end if;

  delete from public.ranks where id = p_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Rütbe bulunamadı');
  end if;

  return jsonb_build_object('success', true);
exception when foreign_key_violation then
  return jsonb_build_object('success', false, 'error', 'Bu rütbeyi kullanan personel var, önce onları başka rütbeye taşıyın');
when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.insert_rank_rpc(text, smallint, boolean) to authenticated;
grant execute on function public.update_rank_rpc(uuid, text, smallint, boolean) to authenticated;
grant execute on function public.delete_rank_rpc(uuid) to authenticated;
