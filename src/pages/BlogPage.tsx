import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function BlogPage() {
  const { t } = useTranslation();

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
              className="text-center"
            >
              <h2 className="font-heading text-xs uppercase tracking-section text-primary font-bold mb-4">
                {t("nav.blog")}
              </h2>
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground tracking-hero text-balance mb-6">
                Yakında
              </h1>
              <p className="text-muted-foreground font-body leading-relaxed max-w-xl mx-auto">
                Blog içerikleri yakında eklenecektir.
              </p>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
