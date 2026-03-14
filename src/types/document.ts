/** Belge kategorileri */
export type DocumentCategory =
  | "case"      // Dava Dosyaları
  | "announcement"  // Duyuru
  | "protocol"  // Protokol
  | "sop"       // Standart Operasyon Prosedürleri
  | "training"  // Eğitim
  | "form";     // Form & Şablon

export interface DocumentRecord {
  id: string;
  title: string;
  category: DocumentCategory;
  date: string;  // YYYY-MM-DD
  file_url: string;
  file_type: "pdf" | "png";
  description?: string;
  created_at?: string;
}
