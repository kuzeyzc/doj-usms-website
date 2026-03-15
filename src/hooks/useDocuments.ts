import { useQuery } from "@tanstack/react-query";
import type { DocumentRecord } from "@/types/document";
import { fetchDocuments, isSupabaseEnabled } from "@/lib/supabase";

/** created_at'e göre büyükten küçüğe sıralar (en son eklenen en üstte) */
function sortByCreatedAtDesc(docs: DocumentRecord[]): DocumentRecord[] {
  return [...docs].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });
}

/** Belgeleri Supabase veya static JSON'dan çeker */
async function loadDocuments(): Promise<DocumentRecord[]> {
  let docs: DocumentRecord[];
  if (isSupabaseEnabled) {
    docs = await fetchDocuments();
  } else {
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/documents.json`);
      if (!res.ok) return [];
      docs = await res.json();
    } catch {
      return [];
    }
  }
  return sortByCreatedAtDesc(docs);
}

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: loadDocuments,
  });
}
