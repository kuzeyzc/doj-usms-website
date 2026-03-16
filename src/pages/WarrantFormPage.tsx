import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Upload, X, Copy, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionDivider from "@/components/SectionDivider";
import { toast } from "sonner";
import { uploadWarrantEvidence } from "@/lib/supabase";
import { insertWarrant } from "@/lib/supabase-cms";
import { sendWarrantToDiscord } from "@/lib/discord-webhook";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { WarrantRequestType } from "@/lib/supabase-cms";

const inputGlowClass =
  "w-full bg-surface-elevated border border-primary/20 text-foreground font-body text-sm rounded-sm px-4 py-3 outline-none transition-all duration-300 placeholder:text-muted-foreground/50 input-glow focus:border-primary";
const labelClass =
  "block font-heading text-xs uppercase tracking-section text-muted-foreground font-semibold mb-2";

const DEPARTMENTS = [
  "MRPD",
  "BCSO",
  "Vinewood PD",
  "SAHP",
  "DSD",
  "EMS",
  "Diğer",
];

function CaseIdCopyBlock({ caseId }: { caseId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(caseId);
      setCopied(true);
      toast.success("Dosya No kopyalandı!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopyalama başarısız.");
    }
  };
  return (
    <div className="inline-flex items-center gap-3 px-5 py-3 bg-surface-elevated rounded-lg border border-primary/20">
      <span className="font-heading text-xs uppercase tracking-section text-muted-foreground">Dosya No</span>
      <code className="font-mono text-sm font-semibold text-primary">{caseId}</code>
      <button
        type="button"
        onClick={copy}
        className="p-2 rounded-sm hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
        title="Kopyala"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

const REQUEST_TYPES: { value: WarrantRequestType; label: string }[] = [
  { value: "Raid", label: "Baskın (Raid)" },
  { value: "Search", label: "Arama (Search)" },
  { value: "Surveillance", label: "Gözetleme (Surveillance)" },
  { value: "Other", label: "Diğer" },
];

export default function WarrantFormPage() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    applicant_name: "",
    department: "",
    rank: "",
    target: "",
    request_type: "" as WarrantRequestType | "",
    request_type_other: "",
    reason: "",
  });
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    e.target.value = "";
    const valid = files.filter((f) => f.type.startsWith("image/"));
    if (valid.length < files.length) {
      toast.error("Sadece görsel dosyaları (PNG, JPG, WEBP) yükleyebilirsiniz.");
    }
    setEvidenceFiles((prev) => [...prev, ...valid]);
    valid.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () =>
        setEvidencePreviews((p) => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeEvidence = (index: number) => {
    setEvidenceFiles((f) => f.filter((_, i) => i !== index));
    setEvidencePreviews((p) => p.filter((_, i) => i !== index));
  };

  const canSubmit = () =>
    form.applicant_name?.trim() &&
    form.department &&
    form.rank?.trim() &&
    form.target?.trim() &&
    form.request_type &&
    (form.request_type !== "Other" || form.request_type_other?.trim()) &&
    form.reason?.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) {
      toast.error("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    if (!isSupabaseEnabled) {
      toast.error("Sistem şu an kullanılamıyor.");
      return;
    }

    setSubmitting(true);
    try {
      let evidenceUrls: string[] = [];
      if (evidenceFiles.length > 0) {
        const { urls, failed } = await uploadWarrantEvidence(evidenceFiles);
        evidenceUrls = urls;
        if (failed.length > 0) {
          toast.error(`${failed.length} dosya yüklenemedi.`);
        }
      }

      const id = await insertWarrant({
        applicant_name: form.applicant_name.trim(),
        department: form.department,
        rank: form.rank.trim(),
        target: form.target.trim(),
        request_type: form.request_type as WarrantRequestType,
        request_type_other: form.request_type === "Other" ? form.request_type_other.trim() : undefined,
        evidence_urls: evidenceUrls,
        reason: form.reason.trim(),
        status: "Pending",
      });

      if (id) {
        const caseId = `WR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${id.slice(0, 8).toUpperCase()}`;
        setSubmittedCaseId(caseId);
        await sendWarrantToDiscord({
          caseId,
          applicantName: form.applicant_name.trim(),
          department: form.department,
          rank: form.rank.trim(),
          target: form.target.trim(),
          requestType: form.request_type as WarrantRequestType,
          requestTypeOther: form.request_type === "Other" ? form.request_type_other.trim() : undefined,
          reason: form.reason.trim(),
          evidenceUrls,
          createdAt: new Date().toISOString(),
        });
        setSubmitted(true);
        toast.success("Talebiniz USMS Başyargıçlığına iletilmiştir.");
      } else {
        toast.error("Talep gönderilemedi. Lütfen tekrar deneyin.");
      }
    } catch (err) {
      console.error("Warrant submit error:", err);
      toast.error("Bir hata oluştu. Tarayıcı konsolunu (F12) kontrol edin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-[720px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: [0.2, 0.8, 0.2, 1] }}
              className="mb-12"
            >
              <h2 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-4">
                {t("warrant.label")}
              </h2>
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground tracking-hero text-balance mb-6">
                {t("warrant.title")}
              </h1>
              <p className="text-muted-foreground font-body leading-relaxed">
                {t("warrant.intro")}
              </p>
            </motion.div>

            <SectionDivider />

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-primary/30">
                  <span className="text-primary text-3xl">✓</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                  Talebiniz USMS Başyargıçlığına iletilmiştir
                </h3>
                <p className="text-muted-foreground font-body max-w-md mx-auto mb-6">
                  Adli talebiniz incelenmek üzere kaydedilmiştir. Karar sonucu
                  ilgili birimlere bildirilecektir.
                </p>
                {submittedCaseId && (
                  <CaseIdCopyBlock caseId={submittedCaseId} />
                )}
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onSubmit={handleSubmit}
                className="space-y-6 p-6 md:p-8 bg-surface-elevated rounded-lg border border-primary/15 shadow-[0_0_0_1px_rgba(212,175,55,0.08)]"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>
                      {t("warrant.applicantName")} *
                    </label>
                    <input
                      name="applicant_name"
                      value={form.applicant_name}
                      onChange={handleChange}
                      placeholder="Ad Soyad / Rütbe İsmi"
                      className={inputGlowClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      {t("warrant.department")} *
                    </label>
                    <select
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      className={inputGlowClass}
                      required
                    >
                      <option value="">Birim seçin</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>
                      {t("warrant.rank")} *
                    </label>
                    <input
                      name="rank"
                      value={form.rank}
                      onChange={handleChange}
                      placeholder="Örn: Sergeant, Deputy"
                      className={inputGlowClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      {t("warrant.requestType")} *
                    </label>
                    <select
                      name="request_type"
                      value={form.request_type}
                      onChange={handleChange}
                      className={inputGlowClass}
                      required
                    >
                      <option value="">Talep türü seçin</option>
                      {REQUEST_TYPES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {form.request_type === "Other" && (
                  <div>
                    <label className={labelClass}>
                      Talep Türü Açıklaması *
                    </label>
                    <textarea
                      name="request_type_other"
                      value={form.request_type_other}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Talebinizi detaylı yazın..."
                      className={inputGlowClass}
                      required={form.request_type === "Other"}
                    />
                  </div>
                )}

                <div>
                  <label className={labelClass}>
                    {t("warrant.target")} *
                  </label>
                  <input
                    name="target"
                    value={form.target}
                    onChange={handleChange}
                    placeholder="Hedef kişi, adres veya konum"
                    className={inputGlowClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    {t("warrant.reason")} *
                  </label>
                  <textarea
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Talep gerekçesini detaylı açıklayın..."
                    className={inputGlowClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    {t("warrant.evidence")}
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Delil fotoğraflarını toplu yükleyebilirsiniz (PNG, JPG, WEBP)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-primary/30 rounded-sm flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="font-heading text-sm">
                      Delil Görselleri Ekle ({evidenceFiles.length} seçili)
                    </span>
                  </button>
                  {evidencePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      {evidencePreviews.map((src, i) => (
                        <div
                          key={i}
                          className="relative w-20 h-20 rounded border border-primary/20 overflow-hidden bg-surface group"
                        >
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeEvidence(i)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <X className="w-6 h-6 text-white" />
                          </button>
                          <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-white text-center py-0.5">
                            {i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <motion.button
                    type="submit"
                    disabled={submitting || !canSubmit()}
                    className="w-full py-4 bg-primary text-primary-foreground font-heading font-bold text-sm rounded-sm transition-all hover:shadow-[var(--gold-glow)] hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: submitting ? 1 : 1.01 }}
                    whileTap={{ scale: submitting ? 1 : 0.99 }}
                  >
                    {submitting
                      ? "Talep İletiliyor..."
                      : t("warrant.submit")}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
