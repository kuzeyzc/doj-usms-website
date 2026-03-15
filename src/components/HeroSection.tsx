import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { useSiteSettings } from "@/hooks/useSiteData";
import { isSupabaseEnabled } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

function formatStatValue(val: number, key: string): string {
  if (key === "founded") return String(val);
  return val.toLocaleString();
}

const DISCORD_URL = "https://discord.gg/doj-marshal";

function DiscordLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292 14.37 14.37 0 0 0 4.085-3.42.074.074 0 0 0-.041-.106 13.302 13.302 0 0 1-2.248-1.095.074.074 0 0 1-.008-.128 13.2 13.2 0 0 0 3.41-2.69.074.074 0 0 1 .041-.086 13.272 13.272 0 0 1 2.243-1.074.075.075 0 0 1 .078.037 13.2 13.2 0 0 0 3.41 2.691.074.074 0 0 1-.007.127 13.298 13.298 0 0 1-2.248 1.095.075.075 0 0 1-.041.107 14.365 14.365 0 0 0 4.085 3.42.074.074 0 0 1 .372.292.077.077 0 0 1-.006.128 13.1 13.1 0 0 1-1.872.893.074.074 0 0 0-.041.106 14.04 14.04 0 0 0 1.226 1.994.074.074 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

export default function HeroSection() {
  const { t } = useTranslation();
  const { general, heroStats, footer, settingsLoading } = useSiteSettings();
  const discordUrl = footer?.discordUrl || DISCORD_URL;

  const savci_count = 1;
  const usms_count = 17;

  return (
    <section className="relative min-h-screen flex items-center justify-start overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="US Marshal araçları" className="w-full h-full object-cover opacity-40 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-center">
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
            transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="w-full lg:w-auto lg:min-w-[280px]"
          >
            <Card className="bg-black/40 backdrop-blur-md border-primary/20 overflow-hidden">
              <CardContent className="p-6">
                <DiscordLogo className="w-10 h-10 text-[#5865F2] mb-4" />
                <h3 className="font-heading font-semibold text-foreground text-lg mb-2">
                  {t("hero.discordCard.title")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {heroStats.agents_count} {t("hero.discordCard.members")}
                </p>
                <a
                  href={discordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full py-3 px-4 font-heading font-bold text-sm text-white rounded-sm transition-all hover:opacity-90 hover:shadow-[0_0_28px_rgba(88,101,242,0.6)] cursor-pointer"
                  style={{
                    backgroundColor: "#5865F2",
                    boxShadow: "0 0 20px rgba(88, 101, 242, 0.5)",
                  }}
                >
                  {t("hero.discordCard.joinBtn")}
                </a>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-20 space-y-6"
        >
          <div className="flex flex-wrap gap-12">
            {[
              { key: "agents", labelKey: "hero.stats.agents", value: heroStats.agents_count },
              { key: "operations", labelKey: "hero.stats.operations", value: heroStats.operations_count },
              { key: "founded", labelKey: "hero.stats.founded", value: heroStats.founded_year },
            ].map((stat) => (
              <div key={stat.key}>
                {settingsLoading && isSupabaseEnabled ? (
                  <>
                    <Skeleton className="h-9 w-16 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </>
                ) : (
                  <>
                    <p className="font-heading text-3xl font-bold text-foreground tabular-nums">
                      {formatStatValue(stat.value, stat.key)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-section font-heading mt-1">
                      {t(stat.labelKey)}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>

          {(
            <div className="flex flex-wrap gap-6 sm:gap-10 items-center">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    savci_count > 0 ? "bg-green-500 animate-pulse" : "bg-muted-foreground/50"
                  }`}
                  aria-hidden
                />
                <span className="text-sm font-heading text-muted-foreground">
                  {t("hero.discordActivity.basSavci")}:{" "}
                  <span className="font-semibold text-foreground tabular-nums">{savci_count}</span>{" "}
                  {savci_count > 0 ? t("hero.discordActivity.basSavciSuffix") : t("hero.discordActivity.inactive")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    usms_count > 0 ? "bg-green-500 animate-pulse" : "bg-muted-foreground/50"
                  }`}
                  aria-hidden
                />
                <span className="text-sm font-heading text-muted-foreground">
                  {t("hero.discordActivity.usms")}:{" "}
                  <span className="font-semibold text-foreground tabular-nums">{usms_count}</span>{" "}
                  {usms_count > 0 ? t("hero.discordActivity.usmsSuffix") : t("hero.discordActivity.inactive")}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
