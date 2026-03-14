import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, FileText, UserPlus, Bell } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteData";

const linkKeys = [
  { icon: BookOpen, key: "rules", path: "/rules" },
  { icon: FileText, key: "documents", path: "/documents" },
  { icon: UserPlus, key: "apply", path: "/apply" },
  { icon: Bell, key: "announcements", path: "/faq" },
] as const;

export default function QuickLinks() {
  const { t } = useTranslation();
  const { quickLinks } = useSiteSettings();

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
            {quickLinks.title || t("quickLinks.title")}
          </h2>
          <p className="font-heading text-2xl md:text-3xl font-bold text-foreground tracking-tight-heading">
            {quickLinks.subtitle || t("quickLinks.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {linkKeys.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
              whileHover={{ y: -4 }}
            >
              <Link
                to={item.path}
                className="gold-border-top block bg-surface-elevated rounded-lg p-6 transition-all hover:shadow-[var(--shadow-premium)]"
                style={{ boxShadow: "0 0 0 1px rgba(197,160,89,0.1)" }}
              >
                <item.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-heading font-semibold text-foreground mb-2">
                  {t(`quickLinks.${item.key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground font-body">
                  {t(`quickLinks.${item.key}.desc`)}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
