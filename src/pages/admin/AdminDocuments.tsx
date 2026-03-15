import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, FileText, Image, Upload, Eye } from "lucide-react";
import { isSupabaseEnabled } from "@/lib/supabase";
import {
  insertDocument,
  updateDocument,
  deleteDocument,
  uploadDocumentFilesBatch,
} from "@/lib/supabase";
import { sendDocumentToDiscord } from "@/lib/discord-webhook";
import { useDocuments } from "@/hooks/useDocuments";
import type { DocumentRecord } from "@/types/document";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import DocumentPreviewModal from "@/components/DocumentPreviewModal";

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

function getFileTypeFromExt(ext: string): "pdf" | "png" {
  return ext === "pdf" ? "pdf" : "png";
}

function fileNameToTitle(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminDocuments() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(defaultDoc);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [batchCategory, setBatchCategory] = useState<DocumentRecord["category"]>("case");
  const [batchDate, setBatchDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [previewFiles, setPreviewFiles] = useState<File[] | null>(null);
  const [previewFileIndex, setPreviewFileIndex] = useState(0);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

  const { data: docs = [], isLoading } = useDocuments();

  const resolveUrl = (url: string) => {
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    return `${window.location.origin}${base}${url.startsWith("/") ? url : "/" + url}`;
  };

  const getDocUrls = (d: DocumentRecord): string[] => {
    if (d.file_urls && d.file_urls.length > 0) return d.file_urls;
    return [d.file_url];
  };

  const isImageUrl = (url: string, fileType: string) => {
    if (fileType === "png") return true;
    const ext = url.split(".").pop()?.toLowerCase();
    return ["png", "jpg", "jpeg", "svg", "webp", "gif"].includes(ext ?? "");
  };

  const [previewObjectUrls, setPreviewObjectUrls] = useState<string[]>([]);
  useEffect(() => {
    if (!previewFiles || previewFiles.length === 0) {
      setPreviewObjectUrls([]);
      return;
    }
    const urls = previewFiles.map((f) => URL.createObjectURL(f));
    setPreviewObjectUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [previewFiles]);

  const [fileThumbUrls, setFileThumbUrls] = useState<string[]>([]);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setFileThumbUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
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
    if (isSupabaseEnabled && files.length > 0) {
      setSaving(true);
      const result = await uploadDocumentFilesBatch(files);
      if (result.failed.length > 0) {
        toast.error(`Yüklenemedi: ${result.failed.map((x) => x.file.name).join(", ")}`);
      }
      if (result.success.length > 0) {
        const urls = result.success.map((x) => x.url);
        const first = result.success[0];
        const payload = {
          ...form,
          file_url: urls[0],
          file_urls: urls.length > 1 ? urls : undefined,
          file_type: first.fileType,
        };
        const id = await insertDocument(payload);
        if (id) {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          toast.success(t("admin.added"));
          const discordOk = await sendDocumentToDiscord({
            title: payload.title,
            category: t(`admin.category.${payload.category}`),
            date: payload.date,
            description: payload.description,
            file_url: payload.file_url,
            file_urls: payload.file_urls,
            file_type: payload.file_type,
          });
          if (discordOk) toast.success("Belge başarıyla Discord'a iletildi");
          resetForm();
        } else {
          toast.error(t("admin.error"));
        }
      }
      setSaving(false);
    } else if (form.file_url) {
      setSaving(true);
      const id = await insertDocument(form);
      setSaving(false);
      if (id) {
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        toast.success(t("admin.added"));
        const discordOk = await sendDocumentToDiscord({
          title: form.title,
          category: t(`admin.category.${form.category}`),
          date: form.date,
          description: form.description,
          file_url: form.file_url,
          file_urls: form.file_urls,
          file_type: form.file_type,
        });
        if (discordOk) toast.success("Belge başarıyla Discord'a iletildi");
        resetForm();
      } else {
        toast.error(t("admin.supabaseRequired"));
      }
    } else {
      toast.error(t("admin.needFileUrl"));
    }
  };

  const resetForm = () => {
    setForm(defaultDoc);
    setEditingId(null);
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    e.target.value = "";

    setBatchUploading(true);

    const result = await uploadDocumentFilesBatch(files);
    setBatchProgress({ current: 0, total: result.success.length });

    let inserted = 0;
    let discordSent = 0;
    for (const { file: f, url, fileType } of result.success) {
      const title = fileNameToTitle(f.name);
      const id = await insertDocument({
        title,
        category: batchCategory,
        date: batchDate,
        file_url: url,
        file_type: fileType,
        description: "",
      });
      if (id) {
        inserted++;
        const discordOk = await sendDocumentToDiscord({
          title,
          category: t(`admin.category.${batchCategory}`),
          date: batchDate,
          file_url: url,
          file_type: fileType,
        });
        if (discordOk) discordSent++;
      }
      setBatchProgress((p) => ({ ...p, current: p.current + 1 }));
    }

    setBatchUploading(false);
    setBatchProgress({ current: 0, total: 0 });
    queryClient.invalidateQueries({ queryKey: ["documents"] });

    if (result.failed.length > 0) {
      const names = result.failed.map((x) => x.file.name).join(", ");
      toast.error(`Yüklenemedi: ${names}`);
    }
    if (inserted > 0) {
      toast.success(`${inserted} belge eklendi.`);
    }
    if (discordSent > 0) {
      toast.success("Belge başarıyla Discord'a iletildi");
    }
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
    setFiles([]);
  };

  const removeFile = (index: number) => {
    setFiles((f) => f.filter((_, i) => i !== index));
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

      {/* Çoklu Yükleme */}
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Toplu Belge Yükleme
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Birden fazla dosya seçerek aynı anda yükleyebilirsiniz. Her dosya ayrı belge olarak kaydedilir.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Kategori (tüm dosyalar için)</Label>
              <select
                value={batchCategory}
                onChange={(e) => setBatchCategory(e.target.value as DocumentRecord["category"])}
                className="w-full px-4 py-2 bg-background border border-primary/20 rounded-sm input-glow"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{t(c.labelKey)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Tarih (tüm dosyalar için)</Label>
              <Input type="date" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} className="input-glow" />
            </div>
          </div>
          <div>
            <input
              ref={batchInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.svg,.webp"
              onChange={handleBatchUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => batchInputRef.current?.click()}
              disabled={batchUploading}
              className="w-full sm:w-auto"
            >
              {batchUploading ? "Yükleniyor..." : "Dosya Seç (Çoklu)"}
            </Button>
          </div>
          {batchUploading && batchProgress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{batchProgress.current} / {batchProgress.total}</span>
              </div>
              <Progress value={(batchProgress.current / batchProgress.total) * 100} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tek Belge Ekleme */}
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
              <p className="text-xs text-muted-foreground mb-2">
                Tek belge için birden fazla sayfa/görsel seçebilirsiniz (örn: 3 sayfalık rapor).
              </p>
              {!editingId ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.svg,.webp"
                    onChange={(e) => {
                      const selected = Array.from(e.target.files ?? []);
                      if (selected.length > 0) {
                        setFiles((prev) => [...prev, ...selected]);
                        const ext = selected[0].name.split(".").pop()?.toLowerCase();
                        setForm((f) => ({
                          ...f,
                          file_type: getFileTypeFromExt(ext ?? "pdf"),
                          file_url: selected.map((x) => x.name).join(", "),
                        }));
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-2"
                  >
                    Dosya Seç (Çoklu)
                  </Button>
                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {files.map((f, i) => (
                        <div
                          key={`${f.name}-${i}`}
                          className="relative w-16 h-20 rounded border border-primary/20 overflow-hidden bg-surface-elevated group cursor-pointer"
                          onClick={() => {
                            setPreviewFiles(files);
                            setPreviewFileIndex(i);
                            setPreviewDoc(null);
                          }}
                        >
                          {f.type.startsWith("image/") && fileThumbUrls[i] ? (
                            <img
                              src={fileThumbUrls[i]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : f.type.startsWith("image/") ? (
                            <div className="w-full h-full bg-muted animate-pulse" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-6 h-6 text-primary" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                            <Eye className="w-4 h-4 text-white" />
                            <span className="text-[10px] text-white">Önizle</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(i);
                            }}
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive"
                          >
                            ×
                          </button>
                          <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-white truncate px-1">
                            {f.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
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
                  <div
                    className="w-16 h-20 rounded border border-primary/20 overflow-hidden bg-primary/5 flex-shrink-0 cursor-pointer flex items-center justify-center hover:ring-2 hover:ring-primary/40 transition-shadow"
                    onClick={() => {
                      setPreviewDoc(d);
                      setPreviewFiles(null);
                    }}
                  >
                    {isImageUrl(getDocUrls(d)[0], d.file_type) ? (
                      <img
                        src={resolveUrl(getDocUrls(d)[0])}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          el.style.display = "none";
                          el.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${isImageUrl(getDocUrls(d)[0], d.file_type) ? "hidden" : ""}`}>
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold truncate">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{t(`admin.category.${d.category}`)} • {format(new Date(d.date), "d MMM yyyy", { locale: tr })}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => { setPreviewDoc(d); setPreviewFiles(null); }} title="Önizle">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(d)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(d.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Önizleme: formda seçilen dosyalar */}
      {previewFiles && previewFiles.length > 0 && (
        <DocumentPreviewModal
          open={!!previewFiles}
          onOpenChange={(open) => !open && setPreviewFiles(null)}
          urls={previewObjectUrls}
          title={previewFiles[previewFileIndex]?.name ?? "Önizleme"}
          resolveUrl={(url) => url}
          initialPage={previewFileIndex}
        />
      )}

      {/* Önizleme: belge listesinden */}
      {previewDoc && (
        <DocumentPreviewModal
          open={!!previewDoc}
          onOpenChange={(open) => !open && setPreviewDoc(null)}
          urls={getDocUrls(previewDoc)}
          title={previewDoc.title}
          resolveUrl={resolveUrl}
        />
      )}
    </div>
  );
}
