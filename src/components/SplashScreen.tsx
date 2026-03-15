import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const SPLASH_DURATION_MS = 2500;

interface SplashScreenProps {
  onExitStart?: () => void;
}

const WORDS = ["DOJ", "-", "U.S.", "MARSHALS"];

export default function SplashScreen({ onExitStart }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      onExitStart?.();
      setIsVisible(false);
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onExitStart]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.08,
            transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ willChange: "transform" }}
        >
          {/* Background: hero image, very subtle, blurred */}
          <div className="absolute inset-0 bg-[#000000]" />
          <div
            className="absolute inset-0 bg-cover bg-center grayscale"
            style={{
              backgroundImage: `url(${heroBg})`,
              opacity: 0.15,
              filter: "blur(10px)",
            }}
          />
          <div className="absolute inset-0 bg-black/40" />

          {/* Shield - spring animation, metallic sheen on surface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 80,
                damping: 14,
                mass: 0.8,
              },
            }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Shield with same-color glow animation */}
            <motion.div
              className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center"
              animate={{
                filter: [
                  "drop-shadow(0 0 8px rgba(212,175,55,0.4))",
                  "drop-shadow(0 0 20px rgba(212,175,55,0.7))",
                  "drop-shadow(0 0 8px rgba(212,175,55,0.4))",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Shield
                className="w-24 h-24 md:w-32 md:h-32 text-[#D4AF37]"
                strokeWidth={1.5}
                fill="currentColor"
                style={{ fillOpacity: 0.25 }}
              />
            </motion.div>

            {/* Text - word-by-word fade-in, 0.5s after shield */}
            <div className="mt-8 flex flex-wrap justify-center gap-x-2 gap-y-0">
              {WORDS.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: {
                      duration: 0.5,
                      delay: 0.5 + i * 0.12,
                      ease: [0.2, 0.8, 0.2, 1],
                    },
                  }}
                  className="text-2xl md:text-3xl font-semibold tracking-[0.2em] text-white/95"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {word}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
