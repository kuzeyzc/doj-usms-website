import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import marshalBadge from "@/assets/marshal-badge.png";
import { supabase, isSupabaseEnabled } from "@/lib/supabase";

interface AdminLoginViewProps {
  onSuccess: () => void;
}

export default function AdminLoginView({ onSuccess }: AdminLoginViewProps) {
  const { t } = useTranslation();
  const { setTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    if (!isSupabaseEnabled || !supabase) {
      setErr("Supabase yapılandırılmamış. Personel sistemi için .env ayarlarını kontrol edin.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pass,
    });

    setLoading(false);
    if (error) {
      if (error.message === "Invalid login credentials") {
        setErr("Geçersiz e-posta veya şifre.");
      } else if (error.message?.toLowerCase().includes("email logins are disabled")) {
        setErr("E-posta girişi devre dışı. Supabase Dashboard → Authentication → Providers → Email → 'Enable email signups' açık olmalı.");
      } else {
        setErr(error.message);
      }
      return;
    }
    onSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 dark">
      <div className="fixed inset-0 bg-[#0a0a0b]" />
      <div
        className="fixed inset-0 bg-cover bg-center grayscale"
        style={{
          backgroundImage: `url(${heroBg})`,
          opacity: 0.2,
          filter: "blur(12px)",
        }}
      />
      <div className="fixed inset-0 bg-black/50" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative z-10 w-full max-w-4xl overflow-hidden rounded-xl"
        style={{
          background: "rgba(10, 10, 11, 0.35)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(212, 175, 55, 0.25)",
          boxShadow: "0 0 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,175,55,0.08)",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] min-h-[480px]">
          <div className="relative min-h-[280px] md:min-h-0 flex flex-col justify-end p-8 md:p-10">
            <div className="absolute inset-0">
              <img
                src={marshalBadge}
                alt="US Marshal"
                className="w-full h-full object-cover opacity-90"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)",
                }}
              />
            </div>
            <div className="relative z-10">
              <h2
                className="font-heading text-xl md:text-2xl font-bold text-white tracking-wide mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t("admin.federalPortal")}
              </h2>
              <p className="text-primary/90 text-sm font-heading tracking-section uppercase">
                {t("admin.federalPortalSubtitle")}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center p-8 md:p-10">
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{
                  filter: [
                    "drop-shadow(0 0 8px rgba(212,175,55,0.4))",
                    "drop-shadow(0 0 16px rgba(212,175,55,0.5))",
                    "drop-shadow(0 0 8px rgba(212,175,55,0.4))",
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <img
                  src="/logo-doj.png"
                  alt="DOJ"
                  className="w-16 h-16 object-contain"
                />
              </motion.div>
            </div>

            <h1 className="font-heading text-2xl font-bold text-primary text-center mb-1 tracking-wide">
              {t("admin.portalTitle")}
            </h1>
            <p className="text-muted-foreground text-sm font-heading text-center mb-8">
              {t("admin.portalSubtitle")}
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-heading font-medium text-muted-foreground mb-2"
                >
                  E-posta
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="personel@doj.gov"
                  required
                  className="w-full h-11 px-4 rounded-md bg-transparent border border-primary/30 text-foreground font-heading
                    placeholder:text-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60
                    focus:shadow-[0_0_12px_rgba(212,175,55,0.2)] transition-all duration-300"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-heading font-medium text-muted-foreground mb-2"
                >
                  {t("admin.password")}
                </label>
                <input
                  id="password"
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder={t("admin.passwordPlaceholder")}
                  required
                  className="w-full h-11 px-4 rounded-md bg-transparent border border-primary/30 text-foreground font-heading
                    placeholder:text-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60
                    focus:shadow-[0_0_12px_rgba(212,175,55,0.2)] transition-all duration-300"
                />
              </div>

              {err && (
                <p className="text-sm text-destructive font-heading">{err}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 font-heading font-semibold text-primary-foreground rounded-md
                  bg-gradient-to-r from-amber-500/95 via-primary to-amber-600/95
                  hover:shadow-[0_0_24px_rgba(212,175,55,0.5)] hover:scale-[1.01]
                  transition-all duration-500 border border-amber-400/30 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  boxShadow: "0 0 16px rgba(212, 175, 55, 0.25)",
                }}
              >
                {loading ? "Giriş yapılıyor..." : t("admin.login")}
              </button>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-primary/40 bg-transparent text-primary focus:ring-primary/50 accent-primary"
                  />
                  <span className="font-heading text-primary/80 group-hover:text-primary transition-colors">
                    {t("admin.rememberMe")}
                  </span>
                </label>
              </div>

              <Link
                to="/"
                className="block text-center mt-6 text-sm font-heading text-primary/60 hover:text-primary transition-colors"
              >
                ← Ana Sayfaya Dön
              </Link>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
