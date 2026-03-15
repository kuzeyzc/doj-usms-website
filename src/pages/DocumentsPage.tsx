import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Eye,
  Search,
  Gavel,
  Megaphone,
  FileSpreadsheet,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useDocuments } from "@/hooks/useDocuments";
import DocumentPreviewModal from "@/components/DocumentPreviewModal";
import type { DocumentRecord } from "@/types/document";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { formatTime } from "@/lib/utils";

const CATEGORIES: { key: "all" | DocumentRecord["category"]; labelKey: string; icon: typeof FileText }[] = [
  { key: "all", labelKey: "documents.filterAll", icon: FileText },
  { key: "case", labelKey: "documents.filterCase", icon: Gavel },
  { key: "announcement", labelKey: "documents.filterAnnouncement", icon: Megaphone },
  { key: "protocol", labelKey: "documents.filterProtocol", icon: FileSpreadsheet },
];

function getCategoryIcon(category: DocumentRecord["category"]) {
  const c = CATEGORIES.find((x) => x.key === category);
  return c?.icon ?? FileText;
}

function getCategoryLabelKey(category: DocumentRecord["category"]): string {
  const map: Record<string, string> = {
    sop: "documents.filterSop",
    training: "documents.filterTraining",
    case: "documents.filterCase",
    form: "documents.filterForm",
    announcement: "documents.filterAnnouncement",
    protocol: "documents.filterProtocol",
  };
  return map[category] ?? category;
}

export default function DocumentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | DocumentRecord["category"]>("all");
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

  const { data: docs = [], isLoading } = useDocuments();

  const filtered = useMemo(() => {
    let list = docs;
    if (filter !== "all") {
      list = list.filter((d) => d.category === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.description ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [docs, filter, search]);

  const dateLocale = tr;

  /** created_at'e göre gün bazında gruplandırma (en yeni gün en üstte, aynı gün içinde en yeni en üstte) */
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, { dateLabel: string; docs: DocumentRecord[] }>();
    const sorted = [...filtered].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : new Date(a.date).getTime();
      const tb = b.created_at ? new Date(b.created_at).getTime() : new Date(b.date).getTime();
      return tb - ta;
    });
    for (const doc of sorted) {
      const d = doc.created_at ? new Date(doc.created_at) : new Date(doc.date);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dateLabel = format(d, "d MMMM yyyy", { locale: dateLocale });
      if (!groups.has(dateKey)) {
        groups.set(dateKey, { dateLabel, docs: [] });
      }
      groups.get(dateKey)!.docs.push(doc);
    }
    return Array.from(groups.entries()).map(([dateKey, { dateLabel, docs }]) => ({
      dateKey,
      dateLabel,
      docs,
    }));
  }, [filtered, dateLocale]);

  const resolveUrl = (url: string) => {
    if (url.startsWith("http")) return url;
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    return `${window.location.origin}${base}${url.startsWith("/") ? url : "/" + url}`;
  };

  const isImageUrl = (url: string, fileType: string) => {
    if (fileType === "png") return true;
    const ext = url.split(".").pop()?.toLowerCase();
    return ["png", "jpg", "jpeg", "svg", "webp", "gif"].includes(ext ?? "");
  };

  const getDocUrls = (doc: DocumentRecord): string[] => {
    if (doc.file_urls && doc.file_urls.length > 0) return doc.file_urls;
    return [doc.file_url];
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-5xl">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: [0.2, 0.8, 0.2, 1] }}
              className="mb-12"
            >
              <div>
                <h2 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-4">
                  {t("documents.label")}
                </h2>
                <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground tracking-hero text-balance mb-2">
                  {t("documents.title")}
                </h1>
                <p className="text-muted-foreground font-body leading-relaxed max-w-2xl">
                  {t("documents.intro")}
                </p>
              </div>
            </motion.div>

            {/* Search & Filter */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-10 space-y-4"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("documents.search")}
                  className="w-full pl-11 pr-4 py-3 bg-surface-elevated border border-primary/20 rounded-lg input-glow"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setFilter(c.key as typeof filter)}
                    className={`px-4 py-2 text-sm font-heading rounded-sm transition-colors flex items-center gap-2 ${
                      filter === c.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-elevated text-muted-foreground hover:text-foreground border border-primary/15"
                    }`}
                  >
                    <c.icon className="w-3.5 h-3.5" />
                    {t(c.labelKey)}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Document list */}
            {isLoading ? (
              <p className="text-muted-foreground py-12 text-center">{t("admin.loading")}</p>
            ) : filtered.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted-foreground py-12 text-center bg-surface-elevated rounded-lg"
              >
                {t("documents.noResults")}
              </motion.p>
            ) : (
              <div className="space-y-8">
                {groupedByDate.map((group, groupIdx) => (
                  <div key={group.dateKey} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-heading font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded shrink-0">
                        {group.dateLabel}
                      </span>
                      <div className="flex-1 h-px bg-primary/20" />
                    </div>
                    <div className="space-y-4">
                      {group.docs.map((doc, i) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (groupIdx * 10 + i) * 0.03 }}
                          className="gold-border-top flex flex-col sm:flex-row sm:items-center gap-4 bg-surface-elevated rounded-lg p-5 border border-primary/10 hover:border-primary/25 transition-colors"
                        >
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="w-20 h-24 rounded-lg overflow-hidden bg-primary/5 flex-shrink-0 border border-primary/10 flex items-center justify-center relative cursor-pointer hover:border-primary/30 hover:ring-2 hover:ring-primary/20 transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              {isImageUrl(getDocUrls(doc)[0], doc.file_type) ? (
                                <>
                                  <img
                                    src={resolveUrl(getDocUrls(doc)[0])}
                                    alt=""
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    onError={(e) => {
                                      const el = e.target as HTMLImageElement;
                                      el.style.display = "none";
                                      el.nextElementSibling?.classList.remove("hidden");
                                    }}
                                  />
                                  <div className="hidden absolute inset-0 flex items-center justify-center bg-primary/5">
                                    <FileText className="w-8 h-8 text-primary" />
                                  </div>
                                </>
                              ) : (
                                <FileText className="w-8 h-8 text-primary" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="font-heading font-semibold text-foreground">
                                  {doc.title}
                                </h4>
                                <span className="text-[10px] uppercase tracking-section font-heading text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                                  {t(getCategoryLabelKey(doc.category))}
                                </span>
                              </div>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground font-body line-clamp-1">
                                  {doc.description}
                                </p>
                              )}
                              <div className="mt-1 text-xs">
                                <p>{format(new Date(doc.date), "d MMMM yyyy", { locale: dateLocale })}</p>
                                {doc.created_at && (
                                  <p className="text-muted-foreground text-[11px] mt-0.5">
                                    {formatTime(doc.created_at)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 sm:flex-shrink-0">
                            <motion.button
                              onClick={() => setPreviewDoc(doc)}
                              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-heading text-sm font-semibold rounded-sm hover:bg-primary/20 transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Eye className="w-4 h-4" />
                              {t("documents.view")}
                            </motion.button>
                            <motion.a
                              href={resolveUrl(getDocUrls(doc)[0])}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="flex items-center gap-2 px-4 py-2 border border-primary/30 text-foreground font-heading text-sm font-semibold rounded-sm hover:bg-primary/5 transition-colors"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Download className="w-4 h-4" />
                              {t("documents.download")}
                            </motion.a>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {/* Preview modal - tek veya çoklu sayfa */}
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
