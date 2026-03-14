import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shield, Plus, Pencil, Trash2, FileText, Image, Lock } from "lucide-react";
import {
  isAdminAuthenticated,
  setAdminAuthenticated,
  getAdminPassword,
} from "@/lib/admin";
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

export default function AdminDocumentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [form, setForm] = useState(defaultDoc);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: docs = [], isLoading } = useDocuments();

  useEffect(() => {
    setAuth(isAdminAuthenticated());
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === getAdminPassword()) {
      setAdminAuthenticated(true);
      setAuth(true);
      setErr("");
    } else {
      setErr(t("admin.wrongPassword"));
    }
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setAuth(false);
  };

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

  if (!auth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm p-8 bg-surface-elevated rounded-lg border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-6 h-6 text-primary" />
            <h1 className="font-heading text-xl font-bold">{t("admin.loginTitle")}</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder={t("admin.password")}
              className="w-full px-4 py-3 bg-background border border-primary/20 rounded-sm input-glow"
            />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground font-heading font-bold rounded-sm"
            >
              {t("admin.login")}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!isSupabaseEnabled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-md p-8 bg-surface-elevated rounded-lg border border-primary/20 text-center"
        >
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-heading text-lg font-bold mb-2">{t("admin.supabaseRequired")}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t("admin.supabaseHint")}</p>
          <button
            onClick={handleLogout}
            className="text-sm text-primary hover:underline"
          >
            {t("admin.logout")}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary/10 py-4 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="font-heading font-bold">{t("admin.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/documents")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("admin.backToDocs")}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-destructive hover:underline"
            >
              {t("admin.logout")}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="mb-12 p-6 bg-surface-elevated rounded-lg border border-primary/15 space-y-4">
          <h2 className="font-heading font-semibold text-primary">
            {editingId ? t("admin.editDoc") : t("admin.addDoc")}
          </h2>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">{t("admin.title")} *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-primary/20 rounded-sm input-glow"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">{t("admin.categoryLabel")}</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as DocumentRecord["category"] })}
                className="w-full px-4 py-2 bg-background border border-primary/20 rounded-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{t(c.labelKey)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">{t("admin.date")}</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-primary/20 rounded-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">{t("admin.fileUpload")}</label>
            {!editingId ? (
              <input
                type="file"
                accept=".pdf,.png"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    setForm({
                      ...form,
                      file_type: f.name.endsWith(".png") ? "png" : "pdf",
                      file_url: f.name,
                    });
                  }
                }}
                className="w-full text-sm"
              />
            ) : (
              <input
                value={form.file_url}
                onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-background border border-primary/20 rounded-sm"
              />
            )}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">{t("admin.description")}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-background border border-primary/20 rounded-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-primary-foreground font-heading font-semibold rounded-sm disabled:opacity-60"
            >
              {saving ? t("admin.saving") : editingId ? t("admin.update") : t("admin.add")}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-primary/30 rounded-sm">
                {t("admin.cancel")}
              </button>
            )}
          </div>
        </form>

        <div>
          <h2 className="font-heading font-semibold text-primary mb-4">{t("admin.docList")}</h2>
          {isLoading ? (
            <p className="text-muted-foreground">{t("admin.loading")}</p>
          ) : docs.length === 0 ? (
            <p className="text-muted-foreground">{t("admin.noDocs")}</p>
          ) : (
            <div className="space-y-2">
              {docs.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-4 p-4 bg-surface-elevated rounded-lg border border-primary/10"
                >
                  {d.file_type === "pdf" ? (
                    <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                  ) : (
                    <Image className="w-8 h-8 text-primary flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold truncate">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`admin.category.${d.category}`)} • {format(new Date(d.date), "d MMM yyyy", { locale: tr })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(d)}
                      className="p-2 text-muted-foreground hover:text-primary"
                      title={t("admin.edit")}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-2 text-muted-foreground hover:text-destructive"
                      title={t("admin.delete")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
