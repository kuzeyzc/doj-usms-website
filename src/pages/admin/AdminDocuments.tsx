import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, FileText, Image } from "lucide-react";
import { isSupabaseEnabled } from "@/lib/supabase";
import {
  fetchDocuments,
  insertDocument,
  updateDocument,
  deleteDocument,
  uploadDocumentFile,
} from "@/lib/supabase";
import { useDocuments } from "@/hooks/useDocuments";
import type { DocumentRecord } from "@/types/document";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  { key: "case", labelKey: "admin.category.case" },
  { key: "announcement", labelKey: "admin.category.announcement" },
  { key: "protocol", labelKey: "admin.category.protocol" },
] as const;

const defaultDoc: Omit<DocumentRecord, "id" | "created_at"> = {
  title: "",
  category: "case",
  date: format(new Date(), "yyyy-MM-dd"),
  file_url: "",
  file_type: "pdf",
  description: "",
};

export default function AdminDocuments() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultDoc);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: docs = [], isLoading } = useDocuments();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.file_url) {
      toast.error(t("admin.fillRequired"));
      return;
    }
    if (editingId) {
      setSaving(true);
      const ok = await updateDocument(editingId, form);
      setSaving(false);
      if (ok) {
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        toast.success(t("admin.updated"));
        resetForm();
      } else {
        toast.error(t("admin.error"));
      }
      return;
    }
    if (isSupabaseEnabled && file) {
      setSaving(true);
      const result = await uploadDocumentFile(file);
      if ("error" in result) {
        setSaving(false);
        toast.error(result.error);
        return;
      }
      const id = await insertDocument({ ...form, file_url: result.url });
      setSaving(false);
      if (id) {
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        toast.success(t("admin.added"));
        resetForm();
      } else {
        toast.error(t("admin.error"));
      }
    } else {
      if (!form.file_url) {
        toast.error(t("admin.needFileUrl"));
        return;
      }
      setSaving(true);
      const id = await insertDocument(form);
      setSaving(false);
      if (id) {
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        toast.success(t("admin.added"));
        resetForm();
      } else {
        toast.error(t("admin.supabaseRequired"));
      }
    }
  };

  const resetForm = () => {
    setForm(defaultDoc);
    setEditingId(null);
    setFile(null);
  };

  const handleEdit = (d: DocumentRecord) => {
    setForm({
      title: d.title,
      category: d.category,
      date: d.date,
      file_url: d.file_url,
      file_type: d.file_type,
      description: d.description ?? "",
    });
    setEditingId(d.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.confirmDelete"))) return;
    const ok = await deleteDocument(id);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success(t("admin.deleted"));
    } else {
      toast.error(t("admin.error"));
    }
  };

  if (!isSupabaseEnabled) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg">
        Supabase yapılandırılmamış. Belgeleri yönetmek için Supabase kurulumu yapın.
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Belge Merkezi</h1>
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle>{editingId ? t("admin.editDoc") : t("admin.addDoc")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t("admin.title")} *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-glow" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t("admin.categoryLabel")}</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as DocumentRecord["category"] })}
                  className="w-full px-4 py-2 bg-background border border-primary/20 rounded-sm input-glow"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{t(c.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>{t("admin.date")}</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-glow" />
              </div>
            </div>
            <div>
              <Label>{t("admin.fileUpload")}</Label>
              {!editingId ? (
                <Input
                  type="file"
                  accept=".pdf,.png"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      setForm({ ...form, file_type: f.name.endsWith(".png") ? "png" : "pdf", file_url: f.name });
                    }
                  }}
                />
              ) : (
                <Input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." className="input-glow" />
              )}
            </div>
            <div>
              <Label>{t("admin.description")}</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-glow" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? t("admin.saving") : editingId ? t("admin.update") : t("admin.add")}</Button>
              {editingId && <Button type="button" variant="outline" onClick={resetForm}>{t("admin.cancel")}</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle>{t("admin.docList")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">{t("admin.loading")}</p>
          ) : docs.length === 0 ? (
            <p className="text-muted-foreground">{t("admin.noDocs")}</p>
          ) : (
            <div className="space-y-2">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-4 p-4 bg-surface-elevated rounded-lg border border-primary/10">
                  {d.file_type === "pdf" ? <FileText className="w-8 h-8 text-primary flex-shrink-0" /> : <Image className="w-8 h-8 text-primary flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold truncate">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{t(`admin.category.${d.category}`)} • {format(new Date(d.date), "d MMM yyyy", { locale: tr })}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(d)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(d.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
