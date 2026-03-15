import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteData";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Menu, X, Shield, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navKeys = [
  { key: "home", path: "/" },
  { key: "about", path: "/about" },
  { key: "rules", path: "/rules" },
  { key: "documents", path: "/documents" },
  { key: "gallery", path: "/gallery" },
  { key: "faq", path: "/faq" },
  { key: "apply", path: "/apply" },
] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { general } = useSiteSettings();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "bg-background/70 backdrop-blur-xl border-primary/15 shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
          : "bg-background/80 backdrop-blur-lg border-primary/10"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link
          to="/"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold text-foreground tracking-tight-heading text-lg">
            {general?.siteName ?? t("nav.brand")}
          </span>
        </Link>

        {/* Desktop: nav + lang + theme */}
        <div className="hidden md:flex items-center gap-1">
          {navKeys.map((item) => (
            <Link key={item.path} to={item.path} className="px-4 py-2 text-sm font-heading font-medium tracking-wide transition-colors rounded-sm hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background">
              <span className={pathname === item.path ? "text-primary" : "text-muted-foreground hover:text-foreground"}>
                {t(`nav.${item.key}`)}
              </span>
            </Link>
          ))}
          {/* Tema Toggle */}
          {mounted && (
            <motion.button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="ml-2 p-2 rounded-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-foreground p-2"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface border-b border-primary/10 overflow-hidden"
          >
            <div className="flex flex-col px-4 py-4 gap-1">
              {navKeys.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 text-sm font-heading font-medium rounded-sm transition-colors ${
                    pathname === item.path ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              ))}
              <div className="flex items-center gap-2 px-4 py-3 mt-2 border-t border-primary/10">
                {mounted && (
                  <button
                    type="button"
                    onClick={() => {
                      setTheme(theme === "dark" ? "light" : "dark");
                      setOpen(false);
                    }}
                    className="p-2 rounded-sm text-muted-foreground"
                  >
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
