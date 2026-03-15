import { supabase } from "./supabase";

export async function uploadGalleryImage(file: File): Promise<{ url: string } | { error: string }> {
  if (!supabase) return { error: "Supabase yapılandırılmamış" };
  const ext = (file.name.split(".").pop()?.toLowerCase() || "png").replace(/[^a-z0-9]/g, "");
  const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("gallery").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "image/png",
  });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from("gallery").getPublicUrl(path);
  return { url: data.publicUrl };
}

export interface SiteSettings {
  general?: Record<string, string>;
  values?: Record<string, { title: string; text: string }>;
  mission?: Record<string, string>;
  quickLinks?: { title: string; subtitle: string };
  footer?: { contactTitle: string; discordLabel: string; discordText: string; discordUrl: string };
  heroStats?: { agents_count: number; operations_count: number; founded_year: number };
}

export interface ChainOfCommandItem {
  id: string;
  rank: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface RuleCategory {
  id: string;
  category: string;
  sort_order: number;
  items?: { id: string; item_id: string; content: string }[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface GalleryItem {
  id: string;
  image_url: string;
  description?: string;
  sort_order: number;
}

export interface Application {
  id: string;
  name: string;
  discord: string;
  fivem_id: string;
  age: string;
  experience?: string;
  reason: string;
  scenario?: string;
  scenario_answers?: Record<string, string>;
  status?: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface FormPersonalField {
  enabled: boolean;
  label: string;
  placeholder: string;
}

export interface FormConfig {
  personal?: Record<string, FormPersonalField>;
  experience?: {
    title: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    experienceLabel: string;
    experienceOptions: string[];
  };
}

export interface FormScenarioQuestion {
  id: string;
  question_text: string;
  min_chars: number;
  sort_order: number;
}

export interface ServerStats {
  savci_count: number;
  usms_count: number;
}

/** server_stats tablosundan savci_count ve usms_count çeker */
export async function fetchServerStats(): Promise<ServerStats> {
  if (!supabase) return { savci_count: 0, usms_count: 0 };
  const { data, error } = await supabase
    .from("server_stats")
    .select("savci_count, usms_count")
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("fetchServerStats error:", error);
    return { savci_count: 0, usms_count: 0 };
  }
  return {
    savci_count: data?.savci_count ?? 0,
    usms_count: data?.usms_count ?? 0,
  };
}

/** Site ayarlarını çek */
export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (!supabase) return {};
  const { data } = await supabase.from("site_settings").select("key, value");
  if (!data) return {};
  return Object.fromEntries(data.map((r) => [r.key, r.value as object])) as SiteSettings;
}

/** Site ayarı güncelle */
export async function updateSiteSetting(key: string, value: object): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  return !error;
}

/** Komuta zinciri */
export async function fetchChainOfCommand(): Promise<ChainOfCommandItem[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("chain_of_command").select("*").order("sort_order");
  return (data ?? []) as ChainOfCommandItem[];
}

export async function upsertChainItem(item: Partial<ChainOfCommandItem>): Promise<string | null> {
  if (!supabase) return null;
  if (item.id) {
    const { error } = await supabase.from("chain_of_command").update(item).eq("id", item.id);
    return error ? null : item.id;
  }
  const { data, error } = await supabase.from("chain_of_command").insert(item).select("id").single();
  return error ? null : data?.id;
}

export async function deleteChainItem(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("chain_of_command").delete().eq("id", id);
  return !error;
}

/** Kurallar */
export async function fetchRules(): Promise<RuleCategory[]> {
  if (!supabase) return [];
  const { data: rules } = await supabase.from("rules").select("*").order("sort_order");
  if (!rules?.length) return [];
  const { data: items } = await supabase.from("rule_items").select("*").order("sort_order");
  return (rules ?? []).map((r) => ({
    ...r,
    items: (items ?? []).filter((i) => i.rule_id === r.id),
  })) as RuleCategory[];
}

export async function upsertRule(rule: Partial<RuleCategory>, items?: { item_id: string; content: string }[]): Promise<string | null> {
  if (!supabase) return null;
  const { id, ...rest } = rule as RuleCategory & { items?: unknown };
  const { data: r, error: e1 } = await supabase.from("rules").upsert({ id, ...rest }).select("id").single();
  if (e1) return null;
  const rid = r?.id ?? id;
  if (items?.length && rid) {
    await supabase.from("rule_items").delete().eq("rule_id", rid);
    for (const it of items) {
      await supabase.from("rule_items").insert({ rule_id: rid, item_id: it.item_id, content: it.content });
    }
  }
  return rid;
}

export async function deleteRule(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("rules").delete().eq("id", id);
  return !error;
}

/** SSS */
export async function fetchFaq(): Promise<FaqItem[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("faq_items").select("*").order("sort_order");
  return (data ?? []) as FaqItem[];
}

export async function upsertFaqItem(item: Partial<FaqItem>): Promise<string | null> {
  if (!supabase) return null;
  if (item.id) {
    const { error } = await supabase.from("faq_items").update(item).eq("id", item.id);
    return error ? null : item.id;
  }
  const { data, error } = await supabase.from("faq_items").insert(item).select("id").single();
  return error ? null : data?.id;
}

export async function deleteFaqItem(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("faq_items").delete().eq("id", id);
  return !error;
}

/** Galeri */
export async function fetchGallery(): Promise<GalleryItem[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("gallery_items").select("*").order("sort_order");
  return (data ?? []) as GalleryItem[];
}

export async function insertGalleryItem(item: Omit<GalleryItem, "id">): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("gallery_items").insert(item).select("id").single();
  return error ? null : data?.id;
}

export async function deleteGalleryItem(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  return !error;
}

/** Başvurular */
export async function fetchApplications(): Promise<Application[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Application[];
}

export async function insertApplication(app: Record<string, unknown>): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("applications").insert(app).select("id").single();
  return error ? null : data?.id;
}

export async function updateApplicationStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("applications").update({ status }).eq("id", id);
  return !error;
}

/** Form konfigürasyonu */
export async function fetchFormConfig(): Promise<FormConfig> {
  if (!supabase) return {};
  const { data } = await supabase.from("form_config").select("key, value");
  if (!data) return {};
  return Object.fromEntries(data.map((r) => [r.key, r.value as object])) as FormConfig;
}

export async function updateFormConfig(key: string, value: object): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("form_config")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  return !error;
}

/** Senaryo soruları (soft delete - deleted_at ile) */
export async function fetchFormScenarioQuestions(): Promise<FormScenarioQuestion[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("form_scenario_questions")
    .select("id, question_text, min_chars, sort_order")
    .is("deleted_at", null)
    .order("sort_order");
  return (data ?? []) as FormScenarioQuestion[];
}

export async function insertFormScenarioQuestion(q: Omit<FormScenarioQuestion, "id">): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("form_scenario_questions").insert(q).select("id").single();
  return error ? null : data?.id;
}

export async function updateFormScenarioQuestion(id: string, q: Partial<FormScenarioQuestion>): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("form_scenario_questions").update(q).eq("id", id);
  return !error;
}

/** Soft delete - eski cevaplar scenario_answers jsonb'de kalır */
export async function softDeleteFormScenarioQuestion(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("form_scenario_questions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function reorderFormScenarioQuestions(ids: string[]): Promise<boolean> {
  if (!supabase) return false;
  for (let i = 0; i < ids.length; i++) {
    await supabase.from("form_scenario_questions").update({ sort_order: i }).eq("id", ids[i]);
  }
  return true;
}
