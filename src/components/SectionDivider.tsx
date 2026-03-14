import { motion } from "framer-motion";
import MarshalBadge from "./MarshalBadge";

/** Bölümler arası premium ayraç - US Marshal estetiği */
export default function SectionDivider() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="flex items-center justify-center gap-4 py-12"
    >
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <MarshalBadge size={28} className="opacity-70" />
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-primary/40 to-transparent" />
    </motion.div>
  );
}
