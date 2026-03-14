import { useQuery } from "@tanstack/react-query";
import type { DocumentRecord } from "@/types/document";
import { fetchDocuments, isSupabaseEnabled } from "@/lib/supabase";

/** Belgeleri Supabase veya static JSON'dan çeker */
async function loadDocuments(): Promise<DocumentRecord[]> {
  if (isSupabaseEnabled) {
    return fetchDocuments();
  }
  try {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const res = await fetch(`${base}/documents.json`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: loadDocuments,
  });
}
