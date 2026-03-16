-- Edge Function olmadan personel ekleme: Dashboard'dan oluşturulan kullanıcıya profil atama
-- Admin: Supabase Dashboard > Auth > Users > Add user ile kullanıcı oluştur, sonra bu RPC ile profil ekle

create or replace function public.create_profile_for_user(p_user_id uuid, p_rank_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  -- Çağıran kişi admin mi kontrol et
  select exists (
    select 1 from public.profiles p
    join public.ranks r on r.id = p.rank_id
    where p.id = auth.uid() and r.is_admin = true
  ) into v_is_admin;

  if not v_is_admin then
    return jsonb_build_object('success', false, 'error', 'Yetkisiz erişim');
  end if;

  -- Kullanıcı auth.users'da var mı?
  if not exists (select 1 from auth.users where id = p_user_id) then
    return jsonb_build_object('success', false, 'error', 'Kullanıcı bulunamadı');
  end if;

  -- Profil zaten var mı?
  if exists (select 1 from public.profiles where id = p_user_id) then
    return jsonb_build_object('success', false, 'error', 'Bu kullanıcının profili zaten mevcut');
  end if;

  -- Rütbe geçerli mi?
  if not exists (select 1 from public.ranks where id = p_rank_id) then
    return jsonb_build_object('success', false, 'error', 'Geçersiz rütbe');
  end if;

  insert into public.profiles (id, rank_id, is_registered)
  values (p_user_id, p_rank_id, false);

  return jsonb_build_object('success', true);
exception when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.create_profile_for_user(uuid, uuid) to authenticated;
