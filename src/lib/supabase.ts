import { createClient } from "@supabase/supabase-js";
import type { DocumentRecord } from "@/types/document";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

// Placeholder değerleri geçersiz say (your-project.supabase.co vb.)
const isPlaceholder =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes("your-project") ||
  supabaseAnonKey.includes("your-anon-key");

export const supabase =
  !isPlaceholder && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseEnabled = !!supabase;

const BUCKET = "documents";

/** Belgeler tablosundan tüm kayıtları çeker */
export async function fetchDocuments(): Promise<DocumentRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("date", { ascending: false });
  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }
  return (data ?? []) as DocumentRecord[];
}

/** Belge ekle */
export async function insertDocument(doc: Omit<DocumentRecord, "id" | "created_at">): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("documents")
    .insert({ ...doc })
    .select("id")
    .single();
  if (error) {
    console.error("Supabase insert error:", error);
    return null;
  }
  return data?.id ?? null;
}

/** Belge güncelle */
export async function updateDocument(id: string, doc: Partial<DocumentRecord>): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("documents")
    .update(doc)
    .eq("id", id);
  if (error) {
    console.error("Supabase update error:", error);
    return false;
  }
  return true;
}

/** Belge sil */
export async function deleteDocument(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("Supabase delete error:", error);
    return false;
  }
  return true;
}

const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

/** Storage'a dosya yükle, public URL döner. Hata durumunda { error: string } döner */
export async function uploadDocumentFile(
  file: File
): Promise<{ url: string } | { error: string }> {
  if (!supabase) return { error: "Supabase yapılandırılmamış" };
  const ext = (file.name.split(".").pop()?.toLowerCase() || "pdf").replace(/[^a-z0-9]/g, "");
  const safeExt = ["pdf", "png", "jpg", "jpeg"].includes(ext) ? ext : "pdf";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
  const contentType = file.type || MIME_MAP[safeExt] || "application/octet-stream";

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType,
  });
  if (error) {
    const msg = (error as { error?: string; message?: string }).error || error.message;
    console.error("Storage upload error:", msg, error);
    return { error: msg || error.message };
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
