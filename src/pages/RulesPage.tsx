import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRulesData } from "@/hooks/useSiteData";

function parseRuleContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={i} className="h-2" />);
      return;
    }
    if (/^[a-z]\)\s/.test(trimmed) || /^[a-z]\.\s/.test(trimmed)) {
      elements.push(
        <div key={i} className="ml-6 md:ml-8 pl-2 border-l-2 border-primary/30 text-sm text-foreground/85 font-body leading-relaxed py-0.5">
          {trimmed}
        </div>
      );
      return;
    }
    if (trimmed.endsWith(":") && trimmed.length < 80) {
      elements.push(
        <h4 key={i} className="font-heading font-semibold text-primary text-sm mt-4 mb-1 first:mt-0">
          {trimmed}
        </h4>
      );
      return;
    }
    elements.push(
      <p key={i} className="text-sm text-foreground/90 font-body leading-relaxed">
        {trimmed}
      </p>
    );
  });

  return elements;
}

function getSectionNumber(title: string): string {
  const match = title.match(/^(\d+)\s*[-–—]/);
  return match ? match[1] : "";
}

function getSectionTitle(title: string): string {
  const match = title.match(/^\d+\s*[-–—]\s*(.+)$/);
  return match ? match[1].trim() : title;
}

export default function RulesPage() {
  const { t } = useTranslation();
  const rules = useRulesData();

  const displayRules = rules.filter((r) => r.title || r.category);

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

            <div className="space-y-10">
              {displayRules.map((section, si) => {
                const sectionTitle = section.title ?? section.category ?? "";
                const sectionNum = getSectionNumber(sectionTitle);
                const sectionLabel = getSectionTitle(sectionTitle);

                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: si * 0.08 }}
                    className="rounded-lg overflow-hidden border border-primary/15 bg-surface-elevated"
                    style={{ boxShadow: "0 0 0 1px rgba(197,160,89,0.08), 0 4px 24px rgba(0,0,0,0.12)" }}
                  >
                    <div className="px-6 py-5 border-b border-primary/15 bg-surface/50">
                      <div className="flex items-baseline gap-3">
                        {sectionNum && (
                          <span className="font-heading text-2xl font-bold text-primary tabular-nums">
                            {sectionNum}
                          </span>
                        )}
                        <h3 className="font-heading text-lg font-bold text-foreground">
                          {sectionLabel || sectionTitle}
                        </h3>
                      </div>
                    </div>
                    <div className="px-6 py-5 space-y-2">
                      {section.content ? (
                        parseRuleContent(section.content)
                      ) : (
                        <div className="space-y-3">
                          {(section.items ?? []).map((item) => (
                            <div
                              key={item.id}
                              className="protocol-row flex items-baseline gap-2"
                            >
                              <span className="font-heading text-sm text-primary font-bold tabular-nums w-8 shrink-0">
                                {item.item_id}
                              </span>
                              <p className="text-sm text-foreground/85 font-body leading-relaxed flex-1 min-w-0">
                                {item.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-16 p-6 bg-surface-elevated rounded-lg border border-primary/10"
              style={{ boxShadow: "0 0 0 1px rgba(197,160,89,0.08)" }}
            >
              <p className="text-sm text-muted-foreground font-body">
                <span className="text-primary font-heading font-semibold">
                  {t("rules.noteLabel")}
                </span>{" "}
                {t("rules.note")}
              </p>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
