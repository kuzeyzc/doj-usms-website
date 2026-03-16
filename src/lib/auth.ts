import { supabase, isSupabaseEnabled } from "./supabase";
import type { User } from "@supabase/supabase-js";

export interface Rank {
  id: string;
  rank_name: string;
  badge_prefix: number;
  is_admin: boolean;
  sort_order: number;
}

export interface Profile {
  id: string;
  ic_name: string | null;
  badge_number: string | null;
  rank_id: string;
  is_registered: boolean;
  rank?: Rank;
}

/** Mevcut oturumdaki kullanıcıyı döner (async) */
export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** Profil + rütbe bilgisini getir */
export async function getProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*, rank:ranks(*)")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as Profile;
}

/** Profil admin mi kontrol et */
export async function isProfileAdmin(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  if (!profile?.rank) return false;
  return (profile.rank as Rank).is_admin === true;
}

/** Tüm rütbeleri getir */
export async function fetchRanks(): Promise<Rank[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ranks")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("fetchRanks error:", error);
    return [];
  }
  return (data ?? []) as Rank[];
}

/** Admin rütbeleri (kullanıcı oluşturabilenler) */
export async function fetchAdminRanks(): Promise<Rank[]> {
  const ranks = await fetchRanks();
  return ranks.filter((r) => r.is_admin);
}

/** Rozet numarası müsait mi kontrol et */
export async function isBadgeAvailable(badgeNumber: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("is_badge_available", {
    p_badge: badgeNumber,
  });
  if (error) {
    console.error("isBadgeAvailable error:", error);
    return false;
  }
  return data === true;
}

/** Rütbe prefix'ine göre geçerli rozet listesi (örn: 5 -> 500-599) */
export function getValidBadgePrefixes(prefix: number): string[] {
  const badges: string[] = [];
  for (let i = 0; i <= 99; i++) {
    badges.push(String(prefix * 100 + i).padStart(3, "0"));
  }
  return badges;
}

/** Profil aktivasyonu (ic_name, badge_number, is_registered) */
export async function activateProfile(
  userId: string,
  icName: string,
  badgeNumber: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: "Supabase yapılandırılmamış" };
  const { error } = await supabase
    .from("profiles")
    .update({
      ic_name: icName.trim(),
      badge_number: badgeNumber,
      is_registered: true,
    })
    .eq("id", userId)
    .eq("is_registered", false);
  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Bu rozet numarası kullanımda" };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Rütbe ekle - doğrudan tablo insert (RLS admin kontrolü yapar) */
export async function insertRank(
  rankName: string,
  badgePrefix: number,
  isAdmin: boolean
): Promise<{ id: string | null; error?: string }> {
  if (!supabase) return { id: null, error: "Supabase yapılandırılmamış" };
  const name = rankName.trim();
  const prefix = Math.min(9, Math.max(1, badgePrefix));
  const { data, error } = await supabase
    .from("ranks")
    .insert({ rank_name: name, badge_prefix: prefix, is_admin: isAdmin })
    .select("id")
    .single();
  if (error) return { id: null, error: error.message };
  return { id: data?.id ?? null };
}

/** Rütbe güncelle */
export async function updateRank(
  id: string,
  updates: { rank_name?: string; badge_prefix?: number; is_admin?: boolean }
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: "Supabase yapılandırılmamış" };
  const { error } = await supabase.from("ranks").update(updates).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Rütbe sil */
export async function deleteRank(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: "Supabase yapılandırılmamış" };
  const { error } = await supabase.from("ranks").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Tüm profilleri getir (admin) */
export async function fetchProfiles(): Promise<(Profile & { email?: string })[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*, rank:ranks(*)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchProfiles error:", error);
    return [];
  }
  return (data ?? []) as (Profile & { email?: string })[];
}

/** Admin: Yeni personel oluştur (Edge Function çağrısı) */
export async function createPersonnel(
  email: string,
  password: string,
  rankId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: "Supabase yapılandırılmamış" };
  const { data, error } = await supabase.functions.invoke("create-personnel", {
    body: { email, password, rank_id: rankId },
  });
  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true };
}

/** Admin: Dashboard'dan oluşturulan kullanıcıya profil ata (Edge Function olmadan) */
export async function createProfileForUser(
  userId: string,
  rankId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: "Supabase yapılandırılmamış" };
  const { data, error } = await supabase.rpc("create_profile_for_user", {
    p_user_id: userId,
    p_rank_id: rankId,
  });
  if (error) return { success: false, error: error.message };
  const result = data as { success?: boolean; error?: string } | null;
  if (!result?.success) return { success: false, error: result?.error ?? "Profil oluşturulamadı" };
  return { success: true };
}

export { isSupabaseEnabled };
