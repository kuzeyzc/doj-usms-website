import { useState, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Download, Image as ImageIcon, Shield, Upload, X, Loader2, Globe } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useQueryClient } from "@tanstack/react-query";
import { isAdminAuthenticated } from "@/lib/admin";
import { uploadDocumentFile, insertDocument, isSupabaseEnabled } from "@/lib/supabase";
import { toast } from "sonner";
import type { DocumentCategory } from "@/types/document";

const DEPARTMENTS: { id: string; name: string; logo: string | null }[] = [
  { id: "DOJ", name: "Department Of Justice", logo: "/logo-doj.png" },
  { id: "USMS", name: "United States Marshal Service", logo: "logo-usms.png" },
  { id: "MRPD", name: "Mission Row Police Department", logo: "logo-mrpd.png" },
  { id: "VPD", name: "Vinewood Police Department", logo: "logo-vinewood.png" },
  { id: "SAHP", name: "San Andreas Highway Patrol", logo: "logo-sahp.png" },
  { id: "DSD", name: "Davis Sheriff Department", logo: "logo-dsd.png" },
  { id: "BCSO", name: "Blaine County Sheriff Office", logo: "logo-bcso.png" },
  { id: "PBSO", name: "Paleto Bay Sheriff Office", logo: "logo-pbso.png" },
  { id: "PR", name: "Park Ranger", logo: "logo-pr.png" },
  { id: "EMS", name: "Emergency Medical Services", logo: "logo-ems.png" },
];

function generateFileNumber(deptId: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${deptId}-${year}-${random}`;
}

const PUBLISH_CATEGORIES: { value: DocumentCategory; labelKey: string }[] = [
  { value: "case", labelKey: "documentGenerator.categoryCase" },
  { value: "announcement", labelKey: "documentGenerator.categoryAnnouncement" },
  { value: "protocol", labelKey: "documentGenerator.categoryProtocol" },
];

export default function DocumentGeneratorPage() {
  const { t } = useTranslation();
  const docRef = useRef<HTMLDivElement>(null);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [signatureTitle, setSignatureTitle] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [publishCategory, setPublishCategory] = useState<DocumentCategory | "">("");
  const [publishLoading, setPublishLoading] = useState(false);
  const isAdmin = isAdminAuthenticated();
  const queryClient = useQueryClient();

  const today = format(new Date(), "d MMMM yyyy", { locale: tr });
  const fileNumber = useMemo(() => generateFileNumber(department.id), [department.id]);

  const displayLogo = customLogoUrl ?? department.logo;
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (customLogoUrl) URL.revokeObjectURL(customLogoUrl);
      setCustomLogoUrl(URL.createObjectURL(file));
    }
    e.target.value = "";
  };
  const clearCustomLogo = () => {
    if (customLogoUrl) URL.revokeObjectURL(customLogoUrl);
    setCustomLogoUrl(null);
  };

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
      ],
    }),
    []
  );

  const exportPdf = useCallback(async () => {
    if (!docRef.current) return;

    try {
      const canvas = await html2canvas(docRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgWidth = 210;
      const imgHeight = (canvas.height * 210) / canvas.width;
      const pageHeight = 297;
      let heightLeft = imgHeight;
      let position = 0;
      let page = 0;
      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      while (heightLeft > 0) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
        page++;
      }

      const safeSubject = (subject || "Belge").replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "").slice(0, 40).replace(/\s+/g, "_");
      pdf.save(`${fileNumber}_${safeSubject}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
    }
  }, [fileNumber, subject]);

  const exportPng = useCallback(async () => {
    if (!docRef.current) return;

    try {
      const canvas = await html2canvas(docRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const safeSubject = (subject || "Belge").replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "").slice(0, 40).replace(/\s+/g, "_");
      const baseName = `${fileNumber}_${safeSubject}`;

      const A4_RATIO = 297 / 210;
      const pageHeightPx = canvas.width * A4_RATIO;
      const numPages = Math.ceil(canvas.height / pageHeightPx);

      if (numPages <= 1) {
        const link = document.createElement("a");
        link.download = `${baseName}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } else {
        for (let page = 0; page < numPages; page++) {
          const sy = page * pageHeightPx;
          const sh = Math.min(pageHeightPx, canvas.height - sy);
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = sh;
          const ctx = pageCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);
            const link = document.createElement("a");
            link.download = `${baseName}_${page + 1}.png`;
            link.href = pageCanvas.toDataURL("image/png");
            link.click();
          }
        }
      }
    } catch (err) {
      console.error("PNG export error:", err);
    }
  }, [fileNumber, subject]);

  const publishToSite = useCallback(async () => {
    if (!docRef.current || !publishCategory || publishLoading || !isSupabaseEnabled) return;

    setPublishLoading(true);
    try {
      const canvas = await html2canvas(docRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const A4_RATIO = 297 / 210;
      const pageHeightPx = canvas.width * A4_RATIO;
      const useCanvas = canvas.height <= pageHeightPx ? canvas : (() => {
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageHeightPx;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(canvas, 0, 0, canvas.width, pageHeightPx, 0, 0, canvas.width, pageHeightPx);
        }
        return pageCanvas;
      })();

      const blob = await new Promise<Blob | null>((resolve) => {
        useCanvas.toBlob((b) => resolve(b), "image/png", 1.0);
      });
      if (!blob) throw new Error("PNG oluşturulamadı");

      const safeSubject = (subject || "Belge").replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "").slice(0, 40).replace(/\s+/g, "_");
      const file = new File([blob], `${fileNumber}_${safeSubject}.png`, { type: "image/png" });

      const uploadResult = await uploadDocumentFile(file);
      if ("error" in uploadResult) {
        toast.error(uploadResult.error);
        return;
      }

      const docTitle = subject?.trim() || "Belge";
      const docDate = format(new Date(), "yyyy-MM-dd");
      const id = await insertDocument({
        title: docTitle,
        category: publishCategory as DocumentCategory,
        date: docDate,
        file_url: uploadResult.url,
        file_type: "png",
      });

      if (id) {
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        toast.success(t("documentGenerator.publishSuccess"));
      } else {
        toast.error("Belge kaydedilemedi.");
      }
    } catch (err) {
      console.error("Publish error:", err);
      toast.error("Yayınlama sırasında bir hata oluştu.");
    } finally {
      setPublishLoading(false);
    }
  }, [fileNumber, subject, publishCategory, t, queryClient]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-[1800px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <h2 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-2">
                {t("documentGenerator.label")}
              </h2>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground tracking-hero mb-2">
                {t("documentGenerator.title")}
              </h1>
              <p className="text-muted-foreground font-body leading-relaxed max-w-2xl">
                {t("documentGenerator.intro")}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,280px)_auto_minmax(680px,680px)] gap-8 items-start">
              {/* Form Panel - Sol */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-6 order-2 lg:order-1"
              >
                <div>
                  <Label className="text-xs uppercase tracking-section text-muted-foreground font-semibold">
                    {t("documentGenerator.department")}
                  </Label>
                  <select
                    value={department.id}
                    onChange={(e) => {
                      const d = DEPARTMENTS.find((x) => x.id === e.target.value);
                      if (d) setDepartment(d);
                    }}
                    className="mt-2 w-full bg-surface-elevated border border-primary/20 text-foreground rounded-sm px-4 py-3 font-body text-sm input-glow"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-section text-muted-foreground font-semibold">
                    {t("documentGenerator.sender")}
                  </Label>
                  <Input
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder="Gönderen birim/kişi"
                    className="mt-2 bg-surface-elevated border-primary/20"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-section text-muted-foreground font-semibold">
                    {t("documentGenerator.recipient")}
                  </Label>
                  <Input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Alıcı"
                    className="mt-2 bg-surface-elevated border-primary/20"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-section text-muted-foreground font-semibold">
                    {t("documentGenerator.subject")}
                  </Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Konu"
                    className="mt-2 bg-surface-elevated border-primary/20"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-section text-muted-foreground font-semibold">
                    {t("documentGenerator.signatureTitle")}
                  </Label>
                  <Input
                    value={signatureTitle}
                    onChange={(e) => setSignatureTitle(e.target.value)}
                    placeholder="Başsavcı, Chief Marshal, vb."
                    className="mt-2 bg-surface-elevated border-primary/20"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-section text-muted-foreground font-semibold">
                    {t("documentGenerator.signatureName")}
                  </Label>
                  <Input
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="İmza sahibi adı"
                    className="mt-2 bg-surface-elevated border-primary/20"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-section text-muted-foreground font-semibold">
                    {t("documentGenerator.customLogo")}
                  </Label>
                  <div className="mt-2 flex gap-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      className="gap-2 flex-1"
                    >
                      <Upload className="w-4 h-4" />
                      {t("documentGenerator.uploadLogo")}
                    </Button>
                    {customLogoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearCustomLogo}
                        title={t("documentGenerator.removeLogo")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                <Button
                  onClick={exportPng}
                  className="w-full gap-2"
                  size="lg"
                >
                  <ImageIcon className="w-4 h-4" />
                  {t("documentGenerator.exportPng")}
                </Button>
                <Button
                  onClick={exportPdf}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Download className="w-4 h-4" />
                  {t("documentGenerator.exportPdf")}
                </Button>

                {isAdmin && (
                  <div
                    className="mt-4 pt-4 border-t border-amber-500/25 rounded-lg p-4 space-y-3"
                    style={{
                      background: "linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(15,15,20,0.4) 100%)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <Label className="text-xs uppercase tracking-section text-amber-500/90 font-semibold">
                      {t("documentGenerator.publishCategory")}
                    </Label>
                    <Select
                      value={publishCategory || undefined}
                      onValueChange={(v) => setPublishCategory((v || "") as DocumentCategory | "")}
                    >
                      <SelectTrigger
                        className="w-full bg-surface-elevated/80 border-amber-500/30 text-foreground rounded-md hover:border-amber-500/50 focus:ring-amber-500/30"
                        placeholder={t("documentGenerator.publishSelectCategory")}
                      >
                        <SelectValue placeholder={t("documentGenerator.publishSelectCategory")} />
                      </SelectTrigger>
                      <SelectContent
                        className="border-amber-500/20 bg-surface-elevated/95 backdrop-blur-xl"
                        style={{ boxShadow: "0 0 24px rgba(212,175,55,0.15)" }}
                      >
                        {PUBLISH_CATEGORIES.map((c) => (
                          <SelectItem
                            key={c.value}
                            value={c.value}
                            className="focus:bg-amber-500/15 focus:text-primary"
                          >
                            {t(c.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={publishToSite}
                      disabled={!publishCategory || publishLoading}
                      className="w-full gap-2 bg-gradient-to-r from-amber-500/90 via-primary to-amber-600/90 text-primary-foreground border border-amber-400/30 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50"
                      size="lg"
                    >
                      {publishLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("documentGenerator.publishLoading")}
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4" />
                          {t("documentGenerator.publishToSite")}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              </motion.div>

              {/* Document Preview - Ortada */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="order-1 lg:order-2 flex justify-center"
              >
                <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-primary/20 w-[210mm]">
                  <div
                    ref={docRef}
                    className="p-10 text-black"
                    style={{ minHeight: "297mm", width: "210mm", margin: "0 auto" }}
                  >
                    {/* Logo - Departman veya özel yüklenen */}
                    <div className="flex justify-center mb-6">
                      {displayLogo ? (
                        <img
                          src={displayLogo}
                          alt={department.name}
                          className="h-28 w-auto object-contain"
                        />
                      ) : (
                        <div className="w-28 h-28 flex items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30">
                          <Shield className="w-14 h-14 text-primary" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>

                    {/* Department Name */}
                    <h2 className="text-center text-xl font-heading font-bold uppercase tracking-widest text-gray-800 mb-8">
                      {department.name}
                    </h2>

                    {/* Header Block */}
                    <div className="border-t border-b border-gray-300 py-4 mb-6 space-y-2 text-sm">
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="font-semibold text-gray-600">{t("documentGenerator.sender")}:</span>
                        <span>{sender || "—"}</span>
                      </div>
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="font-semibold text-gray-600">{t("documentGenerator.recipient")}:</span>
                        <span>{recipient || "—"}</span>
                      </div>
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="font-semibold text-gray-600">{t("documentGenerator.subject")}:</span>
                        <span>{subject || "—"}</span>
                      </div>
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="font-semibold text-gray-600">{t("documentGenerator.date")}:</span>
                        <span>{today}</span>
                      </div>
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="font-semibold text-gray-600">{t("documentGenerator.fileNo")}:</span>
                        <span className="font-mono text-primary">{fileNumber}</span>
                      </div>
                    </div>

                    {/* Rich Text Content */}
                    <div
                      className="prose prose-sm max-w-none text-gray-800 mb-10 document-content font-body [&_p]:my-0.5 [&_li]:my-0.5 [&_p:empty]:!my-0 [&_p:empty]:!hidden"
                      style={{ minHeight: "120px", fontFamily: "'Lato', 'Segoe UI', Arial, sans-serif" }}
                      dangerouslySetInnerHTML={{ __html: content || "<p><br></p>" }}
                    />

                    {/* Signature Section */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                      {signatureTitle && (
                        <p
                          className="text-sm font-semibold text-gray-600 mb-1"
                          style={{ fontFamily: "'Lato', 'Segoe UI', Arial, sans-serif" }}
                        >
                          {signatureTitle}
                        </p>
                      )}
                      {signatureName && (
                        <p
                          className="text-2xl text-gray-800"
                          style={{ fontFamily: "'Dancing Script', 'Lato', 'Segoe UI', cursive" }}
                        >
                          {signatureName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Belge İçeriği Editörü - Sağ */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4 order-3 w-full lg:min-w-[680px] lg:w-[680px]"
              >
                <Label className="text-xs uppercase tracking-section text-muted-foreground font-semibold block">
                  {t("documentGenerator.content")}
                </Label>
                <div className="document-editor w-full lg:w-[680px] lg:h-[680px] aspect-square lg:aspect-auto max-w-full flex flex-col bg-white rounded-lg border border-primary/20 overflow-hidden [&_.quill]:flex-1 [&_.quill]:flex [&_.quill]:flex-col [&_.quill]:min-h-0 [&_.quill]:overflow-hidden [&_.ql-toolbar]:bg-gray-50 [&_.ql-toolbar]:flex-shrink-0 [&_.ql-container]:flex-1 [&_.ql-container]:min-h-0 [&_.ql-container]:overflow-hidden [&_.ql-editor]:overflow-y-auto [&_.ql-editor]:!min-h-0">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={quillModules}
                    placeholder="Belge içeriğini buraya yazın. Madde işaretleri ve kalın yazı kullanabilirsiniz."
                    className="!border-0"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
