import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { useSiteSettings } from "@/hooks/useSiteData";

export default function HeroSection() {
  const { t } = useTranslation();
  const { general } = useSiteSettings();

  return (
    <section className="relative min-h-screen flex items-center justify-start overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="US Marshal araçları" className="w-full h-full object-cover opacity-40 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="max-w-2xl"
        >
          <p className="font-heading text-xs uppercase tracking-section text-primary mb-6 font-semibold">
            {general.heroBadge ?? t("hero.badge")}
          </p>
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-hero text-balance leading-[1.05] mb-6">
            {general.slogan ? (
              general.slogan.split(/\s*\.\s*/).filter(Boolean).map((w, i) => (
                <span key={i}>{w.toUpperCase()}.<br /></span>
              ))
            ) : (
              <>{t("hero.title1")}<br />{t("hero.title2")}<br />{t("hero.title3")}</>
            )}
          </h1>
          <p className="text-muted-foreground text-lg font-body leading-relaxed text-pretty max-w-lg mb-10">
            {general.heroSubtitle ?? t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/rules"
                className="inline-flex items-center px-8 py-3 bg-primary text-primary-foreground font-heading font-bold text-sm rounded-sm transition-all hover:shadow-[var(--gold-glow)] hover:bg-primary-hover"
              >
                {t("hero.rulesBtn")}
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/apply"
                className="inline-flex items-center px-8 py-3 border border-primary/30 text-foreground font-heading font-bold text-sm rounded-sm transition-all hover:border-primary/60 hover:bg-primary/5"
              >
                {t("hero.applyBtn")}
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-20 flex flex-wrap gap-12"
        >
          {[
            { label: t("hero.stats.agents"), value: "42" },
            { label: t("hero.stats.operations"), value: "1,847" },
            { label: t("hero.stats.founded"), value: "1789" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-heading text-3xl font-bold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-section font-heading mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
