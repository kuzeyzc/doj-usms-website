import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useGalleryData } from "@/hooks/useSiteData";

export default function GalleryPage() {
  const { t } = useTranslation();
  const galleryItems = useGalleryData();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: [0.2, 0.8, 0.2, 1] }}
              className="mb-16"
            >
              <h2 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-4">
                {t("gallery.label")}
              </h2>
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground tracking-hero text-balance mb-6">
                {t("gallery.title")}
              </h1>
              <p className="text-muted-foreground font-body leading-relaxed max-w-2xl">
                {t("gallery.intro")}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryItems.length > 0 ? (
                galleryItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    className="aspect-video bg-surface-elevated rounded-lg overflow-hidden scanline-overlay"
                    style={{ boxShadow: "0 0 0 1px rgba(197,160,89,0.1)" }}
                  >
                    <img src={item.image_url} alt={item.description ?? ""} className="w-full h-full object-cover" />
                    {item.description && (
                      <p className="p-2 text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </motion.div>
                ))
              ) : (
                Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    className="aspect-video bg-surface-elevated rounded-lg overflow-hidden scanline-overlay"
                    style={{ boxShadow: "0 0 0 1px rgba(197,160,89,0.1)" }}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-xs text-muted-foreground font-heading uppercase tracking-section">
                        {t("gallery.placeholder")}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
