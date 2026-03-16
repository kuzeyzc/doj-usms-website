import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import marshalBadge from "@/assets/marshal-badge.png";
import {
  getProfile,
  activateProfile,
  getValidBadgePrefixes,
  isBadgeAvailable,
  type Profile,
  type Rank,
} from "@/lib/auth";

interface PersonnelActivationViewProps {
  userId: string;
  onSuccess: () => void;
}

export default function PersonnelActivationView({
  userId,
  onSuccess,
}: PersonnelActivationViewProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [icName, setIcName] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [validBadges, setValidBadges] = useState<string[]>([]);

  useEffect(() => {
    getProfile(userId).then((p) => {
      if (!p) return;
      setProfile(p);
      const rank = p.rank as Rank | undefined;
      if (rank) {
        setValidBadges(getValidBadgePrefixes(rank.badge_prefix));
      }
    });
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const name = icName.trim();
    if (!name) {
      setErr("IC Ad-Soyad zorunludur.");
      return;
    }
    if (!badgeNumber || badgeNumber.length !== 3) {
      setErr("Geçerli bir rozet numarası seçin.");
      return;
    }
    if (validBadges.length && !validBadges.includes(badgeNumber)) {
      setErr("Bu rozet numarası rütbeniz için geçerli değil.");
      return;
    }

    setLoading(true);
    const available = await isBadgeAvailable(badgeNumber);
    if (!available) {
      setErr("Bu rozet numarası kullanımda.");
      setLoading(false);
      return;
    }

    const result = await activateProfile(userId, name, badgeNumber);
    setLoading(false);
    if (result.success) {
      onSuccess();
      navigate("/personnel", { replace: true });
    } else {
      setErr(result.error ?? "Kayıt tamamlanamadı.");
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Yükleniyor...</div>
      </div>
    );
  }

  const rank = profile.rank as Rank | undefined;
  const prefix = rank?.badge_prefix ?? 5;

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
                Personel Kaydı
              </h2>
              <p className="text-primary/90 text-sm font-heading tracking-section uppercase">
                {rank?.rank_name ?? "Rütbe"} • Rozet {prefix}xx
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
              Personel Kaydı Oluştur
            </h1>
            <p className="text-muted-foreground text-sm font-heading text-center mb-8">
              IC adınızı ve rozet numaranızı girin. Bu işlem yalnızca bir kez yapılabilir.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="ic-name"
                  className="block text-sm font-heading font-medium text-muted-foreground mb-2"
                >
                  IC Ad-Soyad *
                </label>
                <input
                  id="ic-name"
                  type="text"
                  value={icName}
                  onChange={(e) => setIcName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full h-11 px-4 rounded-md bg-transparent border border-primary/30 text-foreground font-heading
                    placeholder:text-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60
                    focus:shadow-[0_0_12px_rgba(212,175,55,0.2)] transition-all duration-300"
                />
              </div>

              <div>
                <label
                  htmlFor="badge"
                  className="block text-sm font-heading font-medium text-muted-foreground mb-2"
                >
                  Rozet Numarası * ({prefix}00 - {prefix}99)
                </label>
                <select
                  id="badge"
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  required
                  className="w-full h-11 px-4 rounded-md bg-transparent border border-primary/30 text-foreground font-heading
                    focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60
                    focus:shadow-[0_0_12px_rgba(212,175,55,0.2)] transition-all duration-300"
                >
                  <option value="">Seçin</option>
                  {validBadges.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
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
                {loading ? "Kaydediliyor..." : "Kaydı Tamamla"}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
