import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useGalleryData } from "@/hooks/useSiteData";
import type { GalleryItem } from "@/lib/supabase-cms";

const springTransition = { type: "spring", stiffness: 300, damping: 30 };
const backdropBlur = "backdrop-blur-[8px]";

function GalleryCard({
  item,
  index,
  onClick,
}: {
  item: GalleryItem;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, ...springTransition }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative aspect-video w-full rounded-xl overflow-hidden shadow-lg shadow-black/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(197,160,89,0.08)" }}
    >
      <img
        src={item.image_url}
        alt={item.description ?? ""}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />
      {/* Premium overlay - DOJ themed */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div className="rounded-full bg-primary/90 p-3 text-primary-foreground shadow-xl scale-0 group-hover:scale-100 transition-transform duration-300 origin-center">
          <ZoomIn className="w-6 h-6" strokeWidth={2} />
        </div>
      </div>
      {item.description && (
        <p className="absolute bottom-0 left-0 right-0 p-3 text-xs text-white/90 font-medium truncate bg-gradient-to-t from-black/60 to-transparent">
          {item.description}
        </p>
      )}
    </motion.button>
  );
}

function PlaceholderCard({ index }: { index: number }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, ...springTransition }}
      className="aspect-video rounded-xl bg-surface-elevated flex items-center justify-center border border-border/50"
    >
      <p className="text-sm text-muted-foreground font-heading uppercase tracking-section">
        {t("gallery.placeholder")}
      </p>
    </motion.div>
  );
}

function GalleryLightbox({
  items,
  selectedIndex,
  onClose,
  onNavigate,
}: {
  items: GalleryItem[];
  selectedIndex: number;
  onClose: () => void;
  onNavigate: (dir: 1 | -1) => void;
}) {
  const { t } = useTranslation();
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.3, 1, 0.3]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 80;
      const velocity = info.velocity.x;
      const offset = info.offset.x;

      if (offset > threshold || velocity > 400) {
        onNavigate(-1);
      } else if (offset < -threshold || velocity < -400) {
        onNavigate(1);
      }
      x.set(0);
    },
    [onNavigate, x]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate(-1);
      if (e.key === "ArrowRight") onNavigate(1);
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onNavigate]);

  const current = items[selectedIndex];
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex < items.length - 1;

  // Reset drag position when image changes
  useEffect(() => {
    x.set(0);
  }, [selectedIndex, x]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 ${backdropBlur}`}
      onClick={onClose}
    >
      {/* Close button */}
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, ...springTransition }}
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={t("gallery.close")}
      >
        <X className="w-6 h-6" />
      </motion.button>

      {/* Image counter */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium"
      >
        {selectedIndex + 1} / {items.length}
      </motion.span>

      {/* Navigation arrows */}
      {hasPrev && (
        <motion.button
          type="button"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, ...springTransition }}
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(-1);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={t("gallery.prev")}
        >
          <ChevronLeft className="w-8 h-8" />
        </motion.button>
      )}
      {hasNext && (
        <motion.button
          type="button"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, ...springTransition }}
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(1);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={t("gallery.next")}
        >
          <ChevronRight className="w-8 h-8" />
        </motion.button>
      )}

      {/* Image container - click stops propagation so we don't close when clicking image */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x, opacity }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-[90vw] max-h-[85vh] touch-pan-y"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedIndex}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={springTransition}
            className="relative"
          >
            <img
              src={current.image_url}
              alt={current.description ?? ""}
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
              draggable={false}
              style={{ touchAction: "pan-y" }}
            />
            {current.description && (
              <p className="mt-3 text-center text-white/90 text-sm font-medium">
                {current.description}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default function GalleryPage() {
  const { t } = useTranslation();
  const galleryItems = useGalleryData();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = useCallback((index: number) => setSelectedIndex(index), []);
  const closeLightbox = useCallback(() => setSelectedIndex(null), []);

  const navigate = useCallback(
    (dir: 1 | -1) => {
      if (selectedIndex === null) return;
      const next = selectedIndex + dir;
      if (next >= 0 && next < galleryItems.length) {
        setSelectedIndex(next);
      }
    },
    [selectedIndex, galleryItems.length]
  );

  const items = galleryItems.length > 0 ? galleryItems : [];
  const displayItems = items.length > 0 ? items : Array.from({ length: 6 });

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.length > 0 ? (
                items.map((item, i) => (
                  <GalleryCard
                    key={item.id}
                    item={item}
                    index={i}
                    onClick={() => openLightbox(i)}
                  />
                ))
              ) : (
                displayItems.map((_, i) => <PlaceholderCard key={i} index={i} />)
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <AnimatePresence mode="wait">
        {selectedIndex !== null && items.length > 0 && (
          <GalleryLightbox
            key="gallery-lightbox"
            items={items}
            selectedIndex={selectedIndex}
            onClose={closeLightbox}
            onNavigate={navigate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
