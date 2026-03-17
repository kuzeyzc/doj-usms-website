import React, { useState, useEffect, useRef } from "react";
import { useSiteSettings } from "@/hooks/useSiteData";
import { Link, useLocation } from "react-router-dom";
import { isAdminAuthenticated, setAdminAuthenticated } from "@/lib/admin";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Menu, X, Shield, Sun, Moon, ChevronDown, Key, LayoutDashboard, LogOut, BookOpen, PenSquare, HelpCircle, Scale, FileEdit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* Kurumsal: Kurallar, Blog, SSS */
const corporateItems = [
  { key: "rules", path: "/rules", icon: BookOpen },
  { key: "blog", path: "/blog", icon: PenSquare },
  { key: "faq", path: "/faq", icon: HelpCircle },
] as const;

/* Hizmetler: Adli Talep, Belge Oluşturucu */
const servicesItems = [
  { key: "warrant", path: "/warrant", icon: Scale },
  { key: "documentGenerator", path: "/document-generator", icon: FileEdit },
] as const;

const fixedLinks = [
  { key: "home", path: "/" },
  { key: "about", path: "/about" },
  { key: "documents", path: "/documents" },
  { key: "gallery", path: "/gallery" },
] as const;

function NavLink({
  to,
  label,
  isActive,
  onClick,
}: {
  to: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="group relative px-4 py-2 text-sm font-heading font-medium tracking-wide transition-all duration-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-transparent"
    >
      <span
        className={`transition-colors duration-300 ${
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        }`}
      >
        {label}
      </span>
      {/* Hover: merkeze doğru genişleyen çizgi */}
      <span
        className="absolute bottom-0 left-1/2 block h-px w-3/4 -translate-x-1/2 origin-center scale-x-0 bg-gradient-to-r from-transparent via-primary to-transparent 
          transition-transform duration-500 group-hover:scale-x-100"
        style={{ transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}
      />
    </Link>
  );
}

function DropdownTrigger({
  label,
  isOpen,
  onClick,
  isActive,
}: {
  label: string;
  isOpen: boolean;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center gap-1 px-4 py-2 text-sm font-heading font-medium tracking-wide transition-all duration-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-transparent ${
        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
      }`}
    >
      {label}
      <ChevronDown
        className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
      />
      <span
        className="absolute bottom-0 left-1/2 block h-px w-3/4 -translate-x-1/2 origin-center scale-x-0 bg-gradient-to-r from-transparent via-primary to-transparent 
          transition-transform duration-500 group-hover:scale-x-100"
        style={{ transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}
      />
    </button>
  );
}

function DropdownMenu({
  items,
  isOpen,
  onClose,
  t,
  pathname,
  onHoverEnter,
  onHoverLeave,
}: {
  items: readonly { key: string; path: string }[];
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  isOpen: boolean;
  onClose: () => void;
  t: (k: string) => string;
  pathname: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          onMouseEnter={onHoverEnter}
          onMouseLeave={onHoverLeave}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute top-full left-0 pt-2 min-w-[260px] rounded-xl overflow-hidden border border-amber-500/25 shadow-[0_0_32px_rgba(212,175,55,0.2),0_8px_32px_rgba(0,0,0,0.5)]"
          style={{
            background: "linear-gradient(180deg, rgba(15,15,20,0.95) 0%, rgba(10,10,15,0.98) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="py-2 px-1">
            {items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-5 py-3.5 text-base font-heading font-medium transition-all duration-200 rounded-lg hover:bg-amber-500/15 hover:text-primary hover:shadow-[0_0_12px_rgba(212,175,55,0.15)] ${
                  pathname === item.path ? "text-primary bg-amber-500/10" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {(() => {
                  const Icon = "icon" in item ? item.icon : null;
                  return (
                    <>
                      {Icon && <Icon className="w-5 h-5 shrink-0 text-primary/80" />}
                      <span>{t(`nav.${item.key}`)}</span>
                    </>
                  );
                })()}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [corporateOpen, setCorporateOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileCorporateOpen, setMobileCorporateOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { general } = useSiteSettings();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const isAdmin = isAdminAuthenticated();

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      setAdminAuthenticated(false);
      window.location.href = "/";
    }, 300);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isCorporateActive = corporateItems.some((i) => pathname === i.path);
  const isServicesActive = servicesItems.some((i) => pathname === i.path);
  const corporateCloseRef = useRef(null);
  const servicesCloseRef = useRef(null);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/60 backdrop-blur-[12px] border-b border-primary/20 shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
          : "bg-background/40 backdrop-blur-[12px] border-b border-primary/15"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}
    >
      <div
        className={`container mx-auto flex items-center justify-between px-4 transition-all duration-500 ${
          scrolled ? "h-14" : "h-16"
        }`}
      >
        <Link
          to="/"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold text-foreground tracking-tight-heading text-lg">
            {general?.siteName ?? t("nav.brand")}
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0">
          {fixedLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              label={t(`nav.${item.key}`)}
              isActive={pathname === item.path}
            />
          ))}

          {/* Kurumsal dropdown - hover */}
          <div
            className="relative"
            onMouseEnter={() => {
              if (servicesCloseRef.current) {
                clearTimeout(servicesCloseRef.current);
                servicesCloseRef.current = null;
              }
              setCorporateOpen(true);
              setServicesOpen(false);
            }}
            onMouseLeave={() => {
              corporateCloseRef.current = setTimeout(() => setCorporateOpen(false), 120);
            }}
          >
            <DropdownTrigger
              label={t("nav.corporate")}
              isOpen={corporateOpen}
              onClick={() => {
                setCorporateOpen((o) => !o);
                setServicesOpen(false);
              }}
              isActive={isCorporateActive}
            />
            <DropdownMenu
              items={corporateItems}
              isOpen={corporateOpen}
              onClose={() => setCorporateOpen(false)}
              onHoverEnter={() => {
                if (corporateCloseRef.current) {
                  clearTimeout(corporateCloseRef.current);
                  corporateCloseRef.current = null;
                }
              }}
              onHoverLeave={() => {
                corporateCloseRef.current = setTimeout(() => setCorporateOpen(false), 150);
              }}
              t={t}
              pathname={pathname}
            />
          </div>

          {/* Hizmetler dropdown - hover */}
          <div
            className="relative"
            onMouseEnter={() => {
              if (corporateCloseRef.current) {
                clearTimeout(corporateCloseRef.current);
                corporateCloseRef.current = null;
              }
              setServicesOpen(true);
              setCorporateOpen(false);
            }}
            onMouseLeave={() => {
              servicesCloseRef.current = setTimeout(() => setServicesOpen(false), 120);
            }}
          >
            <DropdownTrigger
              label={t("nav.services")}
              isOpen={servicesOpen}
              onClick={() => {
                setServicesOpen((o) => !o);
                setCorporateOpen(false);
              }}
              isActive={isServicesActive}
            />
            <DropdownMenu
              items={servicesItems}
              isOpen={servicesOpen}
              onClose={() => setServicesOpen(false)}
              onHoverEnter={() => {
                if (servicesCloseRef.current) {
                  clearTimeout(servicesCloseRef.current);
                  servicesCloseRef.current = null;
                }
              }}
              onHoverLeave={() => {
                servicesCloseRef.current = setTimeout(() => setServicesOpen(false), 150);
              }}
              t={t}
              pathname={pathname}
            />
          </div>

          {/* Başvur - Aksiyon butonu */}
          <Link
            to="/apply"
            className="ml-2 px-5 py-2 text-sm font-heading font-semibold tracking-wide rounded-md transition-all duration-500
              bg-gradient-to-r from-amber-500/90 via-primary to-amber-600/90 text-primary-foreground
              hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-[1.02]
              border border-amber-400/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"
            style={{ boxShadow: "0 0 16px rgba(212, 175, 55, 0.2)" }}
          >
            {t("nav.apply")}
          </Link>

          {/* Admin / Personel Girişi */}
          {isAdmin ? (
            <div className={`ml-2 flex flex-row items-center gap-3 transition-opacity duration-300 ${loggingOut ? "opacity-0" : "opacity-100"}`}>
              <span className="text-sm font-heading font-medium text-primary whitespace-nowrap">{t("nav.welcomeAdmin")}</span>
              <Link
                to="/admin"
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-heading font-medium text-muted-foreground 
                  hover:text-foreground transition-all duration-300 rounded-md hover:bg-primary/5 border border-primary/20 whitespace-nowrap"
              >
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                {t("nav.adminPanel")}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title={t("admin.logoutTooltip")}
                className="p-2 rounded-md text-red-500 hover:text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all duration-300 shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/admin"
              className="ml-2 flex items-center gap-2 px-3 py-2 text-sm font-heading font-medium text-muted-foreground 
                hover:text-foreground transition-all duration-300 rounded-md hover:bg-primary/5 border border-transparent hover:border-primary/20"
            >
              <Key className="w-4 h-4" />
              <span className="hidden xl:inline">{t("nav.staffLogin")}</span>
            </Link>
          )}

          {/* Tema Toggle */}
          {mounted && (
            <motion.button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="ml-2 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex lg:hidden items-center gap-2">
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md text-muted-foreground"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="text-foreground p-2 rounded-md hover:bg-primary/5 transition-colors"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu - slide-in accordion */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="lg:hidden overflow-hidden border-t border-primary/10"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }}
          >
            <div className="flex flex-col px-4 py-4 gap-0">
              {fixedLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 text-sm font-heading font-medium rounded-md transition-colors ${
                    pathname === item.path ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                  }`}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              ))}

              {/* Kurumsal accordion */}
              <div className="border-t border-primary/10 mt-1">
                <button
                  type="button"
                  onClick={() => setMobileCorporateOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-heading font-medium text-muted-foreground hover:text-foreground rounded-md"
                >
                  {t("nav.corporate")}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${mobileCorporateOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {mobileCorporateOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      {corporateItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setOpen(false)}
                          className={`block pl-8 pr-4 py-2.5 text-sm font-heading ${
                            pathname === item.path ? "text-primary" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t(`nav.${item.key}`)}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Hizmetler accordion */}
              <div className="border-t border-primary/10">
                <button
                  type="button"
                  onClick={() => setMobileServicesOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-heading font-medium text-muted-foreground hover:text-foreground rounded-md"
                >
                  {t("nav.services")}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${mobileServicesOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {mobileServicesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      {servicesItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setOpen(false)}
                          className={`block pl-8 pr-4 py-2.5 text-sm font-heading ${
                            pathname === item.path ? "text-primary" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t(`nav.${item.key}`)}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Başvur - mobile */}
              <div className="border-t border-primary/10 mt-1 pt-2">
                <Link
                  to="/apply"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center w-full py-3 text-sm font-heading font-semibold rounded-md
                    bg-gradient-to-r from-amber-500/90 via-primary to-amber-600/90 text-primary-foreground"
                >
                  {t("nav.apply")}
                </Link>
              </div>

              {/* Admin / Personel Girişi - mobile */}
              {isAdmin ? (
                <div className={`border-t border-primary/10 mt-1 pt-2 flex flex-row items-center gap-3 px-4 py-3 transition-opacity duration-300 ${loggingOut ? "opacity-0" : "opacity-100"}`}>
                  <span className="text-sm font-heading font-medium text-primary flex-1">{t("nav.welcomeAdmin")}</span>
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-heading font-medium text-muted-foreground hover:text-foreground rounded-md bg-primary/5 border border-primary/20"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    {t("nav.adminPanel")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }}
                    title={t("admin.logoutTooltip")}
                    className="p-2 rounded-md text-red-500 hover:text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all duration-300 shrink-0"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-heading font-medium text-muted-foreground hover:text-foreground rounded-md mt-1"
                >
                  <Key className="w-4 h-4" />
                  {t("nav.staffLogin")}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
