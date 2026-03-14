import { useTranslation } from "react-i18next";
import { useSiteSettings } from "@/hooks/useSiteData";
import { motion } from "framer-motion";
import marshalBadge from "@/assets/marshal-badge.png";
import SectionDivider from "./SectionDivider";

export default function MissionSection() {
  const { t } = useTranslation();
  const { mission } = useSiteSettings();

  return (
    <>
      <SectionDivider />
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ ease: [0.2, 0.8, 0.2, 1] }}
            >
              <h2 className="font-heading text-xs uppercase tracking-section text-primary font-bold mb-4">
                {mission.label ?? t("mission.label")}
              </h2>
              <h3 className="font-heading text-2xl md:text-3xl font-bold text-primary tracking-tight-heading mb-6">
                {mission.title ?? t("mission.title")}
              </h3>
              <div className="space-y-4 text-muted-foreground font-body leading-relaxed text-pretty">
                <p>{mission.p1 ?? t("mission.p1")}</p>
                <p>{mission.p2 ?? t("mission.p2")}</p>
                <p>{mission.p3 ?? t("mission.p3")}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ ease: [0.2, 0.8, 0.2, 1] }}
              className="flex justify-center"
            >
              <div className="relative w-64 h-64 md:w-80 md:h-80">
                <div className="absolute inset-0 bg-primary/5 rounded-lg" />
                <img src={marshalBadge} alt={t("mission.badgeAlt")} className="relative w-full h-full object-contain p-8 drop-shadow-2xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
