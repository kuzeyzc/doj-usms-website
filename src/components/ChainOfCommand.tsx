import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Shield, Star, Award, User } from "lucide-react";
import { useChainOfCommandData } from "@/hooks/useSiteData";

const ICONS = [Shield, Star, Award, User];

export default function ChainOfCommand() {
  const { t } = useTranslation();
  const items = useChainOfCommandData();

  return (
    <section className="py-24 bg-surface">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-4">
            {t("chainOfCommand.label")}
          </h2>
          <p className="font-heading text-2xl md:text-3xl font-bold text-foreground tracking-tight-heading">
            {t("chainOfCommand.title")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((r, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                whileHover={{ y: -4 }}
                className="gold-border-top bg-surface-elevated rounded-lg p-6 transition-all hover:shadow-[var(--shadow-premium)]"
                style={{ boxShadow: "0 0 0 1px rgba(197,160,89,0.1)" }}
              >
                <div className="w-16 h-16 rounded-md bg-primary/10 flex items-center justify-center mb-4 scanline-overlay overflow-hidden">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-foreground text-sm uppercase tracking-wide mb-1">
                  {r.rank}
                </h3>
                <p className="text-xs text-primary mb-3 font-heading">{r.name}</p>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  {r.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
