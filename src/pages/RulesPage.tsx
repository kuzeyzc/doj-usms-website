import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRulesData } from "@/hooks/useSiteData";

export default function RulesPage() {
  const { t } = useTranslation();
  const rules = useRulesData();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: [0.2, 0.8, 0.2, 1] }}
              className="mb-16"
            >
              <h2 className="font-heading text-xs uppercase tracking-section text-primary font-bold mb-4">
                {t("rules.label")}
              </h2>
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-primary tracking-hero text-balance mb-6">
                {t("rules.title")}
              </h1>
              <p className="text-muted-foreground font-body leading-relaxed max-w-2xl">
                {t("rules.intro")}
              </p>
            </motion.div>

            <div className="space-y-12">
              {rules.map((section, si) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: si * 0.1 }}
                >
                  <h3 className="font-heading text-sm uppercase tracking-section text-primary font-bold mb-6 pb-2 border-b border-primary/15">
                    {section.category}
                  </h3>
                  <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 0 0 1px rgba(197,160,89,0.1)" }}>
                    {(section.items ?? []).map((item) => (
                      <div
                        key={item.id}
                        className="protocol-row flex items-start gap-4 px-6 py-4"
                      >
                        <span className="font-heading text-xs text-primary font-bold tabular-nums min-w-[2.5rem] shrink-0">
                          §{item.item_id}
                        </span>
                        <p className="text-sm text-foreground/80 font-body leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-16 p-6 bg-surface-elevated rounded-lg"
              style={{ boxShadow: "0 0 0 1px rgba(197,160,89,0.1)" }}
            >
              <p className="text-sm text-muted-foreground font-body">
                <span className="text-primary font-heading font-semibold">{t("rules.noteLabel")}</span> {t("rules.note")}
              </p>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
