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

/** Belgeler tablosundan tüm kayıtları çeker (en son eklenen en üstte) */
export async function fetchDocuments(): Promise<DocumentRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
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
  svg: "image/svg+xml",
  webp: "image/webp",
};

const ALLOWED_EXT = ["pdf", "png", "jpg", "jpeg", "svg", "webp"] as const;

function getFileType(ext: string): "pdf" | "png" {
  if (ext === "pdf") return "pdf";
  return "png";
}

/** Storage path: YYYY/MM/filename (bucket: documents) */
function getStoragePath(file: File): string {
  const ext = (file.name.split(".").pop()?.toLowerCase() || "pdf").replace(/[^a-z0-9]/g, "");
  const safeExt = ALLOWED_EXT.includes(ext as (typeof ALLOWED_EXT)[number]) ? ext : "pdf";
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
  return `${y}/${m}/${safeName}`;
}

/** Storage'a tek dosya yükle, public URL döner. Hata durumunda { error: string } döner */
export async function uploadDocumentFile(
  file: File
): Promise<{ url: string; fileType: "pdf" | "png" } | { error: string }> {
  if (!supabase) return { error: "Supabase yapılandırılmamış" };
  const ext = (file.name.split(".").pop()?.toLowerCase() || "pdf").replace(/[^a-z0-9]/g, "");
  const safeExt = ALLOWED_EXT.includes(ext as (typeof ALLOWED_EXT)[number]) ? ext : "pdf";
  const path = getStoragePath(file);
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
  return { url: data.publicUrl, fileType: getFileType(safeExt) };
}

export interface BatchUploadResult {
  success: { file: File; url: string; fileType: "pdf" | "png" }[];
  failed: { file: File; error: string }[];
}

const WARRANTS_BUCKET = "warrants";
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif"] as const;

/** Delil fotoğraflarını warrants bucket'a yükler, URL listesi döner */
export async function uploadWarrantEvidence(
  files: File[]
): Promise<{ urls: string[]; failed: { file: File; error: string }[] }> {
  const result = { urls: [] as string[], failed: [] as { file: File; error: string }[] };
  if (!supabase) {
    result.failed = files.map((f) => ({ file: f, error: "Supabase yapılandırılmamış" }));
    return result;
  }
  for (const file of files) {
    const ext = (file.name.split(".").pop()?.toLowerCase() || "png").replace(/[^a-z0-9]/g, "");
    const safeExt = IMAGE_EXTENSIONS.includes(ext as (typeof IMAGE_EXTENSIONS)[number]) ? ext : "png";
    const path = `evidence/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
    const contentType = file.type || (safeExt === "png" ? "image/png" : "image/jpeg");
    const { error } = await supabase.storage.from(WARRANTS_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType,
    });
    if (error) {
      result.failed.push({ file, error: error.message });
    } else {
      const { data } = supabase.storage.from(WARRANTS_BUCKET).getPublicUrl(path);
      result.urls.push(data.publicUrl);
    }
  }
  return result;
}

/** Toplu dosya yükleme - documents/YYYY/MM/ path yapısı */
export async function uploadDocumentFilesBatch(
  files: File[]
): Promise<BatchUploadResult> {
  const result: BatchUploadResult = { success: [], failed: [] };
  if (!supabase) {
    result.failed = files.map((f) => ({ file: f, error: "Supabase yapılandırılmamış" }));
    return result;
  }

  for (const file of files) {
    const ext = (file.name.split(".").pop()?.toLowerCase() || "pdf").replace(/[^a-z0-9]/g, "");
    const safeExt = ALLOWED_EXT.includes(ext as (typeof ALLOWED_EXT)[number]) ? ext : "pdf";
    const path = getStoragePath(file);
    const contentType = file.type || MIME_MAP[safeExt] || "application/octet-stream";

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType,
    });

    if (error) {
      const msg = (error as { error?: string; message?: string }).error || error.message;
      result.failed.push({ file, error: msg || error.message });
    } else {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      result.success.push({ file, url: data.publicUrl, fileType: getFileType(safeExt) });
    }
  }
  return result;
}
