import { useTranslation } from "react-i18next";
import { useFaqData } from "@/hooks/useSiteData";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const faqKeys = ["exp", "process", "training", "activity", "transfer", "promotion"] as const;

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-primary/10 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 px-1 text-left group"
      >
        <span className="font-heading text-sm font-bold text-foreground group-hover:text-primary transition-colors pr-4">
          {q}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted-foreground font-body leading-relaxed pb-5 px-1">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqPage() {
  const { t } = useTranslation();
  const faqItems = useFaqData();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: [0.2, 0.8, 0.2, 1] }}
              className="mb-16"
            >
              <h2 className="font-heading text-xs uppercase tracking-section text-primary font-bold mb-4">
                {t("faq.label")}
              </h2>
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-primary tracking-hero text-balance mb-6">
                {t("faq.title")}
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
              className="bg-surface-elevated rounded-lg p-6 md:p-8"
              style={{ boxShadow: "0 0 0 1px rgba(197,160,89,0.1)" }}
            >
              {faqItems.map((item) => (
                <FaqItem
                  key={item.id}
                  q={item.question}
                  a={item.answer}
                />
              ))}
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
