import { useTranslation } from "react-i18next";
import { useSiteSettings } from "@/hooks/useSiteData";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import marshalBadge from "@/assets/marshal-badge.png";
import ChainOfCommand from "@/components/ChainOfCommand";
import SectionDivider from "@/components/SectionDivider";

export default function AboutPage() {
  const { t } = useTranslation();
  const { general, values: dbValues } = useSiteSettings();
  const values = [
    { key: "justice", title: dbValues?.justice?.title ?? t("about.justice.title"), text: dbValues?.justice?.text ?? t("about.justice.text") },
    { key: "integrity", title: dbValues?.integrity?.title ?? t("about.integrity.title"), text: dbValues?.integrity?.text ?? t("about.integrity.text") },
    { key: "service", title: dbValues?.service?.title ?? t("about.service.title"), text: dbValues?.service?.text ?? t("about.service.text") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <section className="py-24 border-b border-primary/10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ease: [0.2, 0.8, 0.2, 1] }}
              >
                <h2 className="font-heading text-xs uppercase tracking-section text-primary font-bold mb-4">
                  {t("about.label")}
                </h2>
                <h1 className="font-heading text-3xl md:text-5xl font-bold text-primary tracking-hero text-balance mb-6">
                  {general?.aboutTitle ?? t("about.title")}
                </h1>
                <div className="space-y-4 text-muted-foreground font-body leading-relaxed text-pretty">
                  <p>{general?.aboutP1 ?? t("about.p1")}</p>
                  <p>{general?.aboutP2 ?? t("about.p2")}</p>
                  <p>{general?.aboutP3 ?? t("about.p3")}</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                className="flex justify-center"
              >
                <img src={marshalBadge} alt={t("about.badgeAlt")} className="w-64 h-64 md:w-72 md:h-72 object-contain drop-shadow-2xl" />
              </motion.div>
            </div>
          </div>
        </section>

        <SectionDivider />

        <section className="py-24">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-xs uppercase tracking-section text-primary font-bold mb-4 text-center">
              {t("about.values")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {values.map((v, i) => (
                <motion.div
                  key={v.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-surface-elevated rounded-lg p-8 text-center"
                  style={{ boxShadow: "0 0 0 1px rgba(197,160,89,0.1)" }}
                >
                  <h3 className="font-heading font-bold text-primary text-lg mb-3">{v.title}</h3>
                  <p className="text-muted-foreground font-body leading-relaxed">{v.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <ChainOfCommand />
      </main>
      <Footer />
    </div>
  );
}
