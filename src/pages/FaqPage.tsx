import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useFaqData } from "@/hooks/useSiteData";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
              <p className="text-muted-foreground font-body leading-relaxed max-w-2xl">
                {t("faq.intro")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
              className="rounded-lg overflow-hidden border border-primary/15 bg-surface-elevated"
              style={{ boxShadow: "0 0 0 1px rgba(197,160,89,0.08), 0 4px 24px rgba(0,0,0,0.12)" }}
            >
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item) => (
                  <AccordionItem
                    key={item.id}
                    value={item.id}
                    className="border-b border-primary/10 last:border-b-0 px-6"
                  >
                    <AccordionTrigger className="py-5 hover:no-underline hover:text-primary [&[data-state=open]]:text-primary">
                      <span className="font-heading text-sm font-bold text-left pr-4">
                        {item.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5">
                      <p className="text-sm text-foreground/90 font-body leading-relaxed">
                        {item.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
