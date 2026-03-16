import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase, isSupabaseEnabled } from "@/lib/supabase";
import { getProfile, type Profile, type Rank } from "@/lib/auth";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PersonnelLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        const sessUser = data.session?.user;
        if (sessUser) {
          setUser(sessUser);
          try {
            const p = await getProfile(sessUser.id);
            if (cancelled) return;
            setProfile(p);
          } catch {
            if (!cancelled) setProfile(null);
          }
        }
      } catch {
        // Auth hatası
      } finally {
        if (!cancelled) {
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        try {
          const p = await getProfile(session.user.id);
          setProfile(p);
        } catch {
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    navigate("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-pulse text-primary">Yükleniyor...</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLoading(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          Giriş sayfasına git
        </Button>
      </div>
    );
  }

  if (!isSupabaseEnabled || !supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive font-heading">Supabase yapılandırılmamış.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/admin");
    return null;
  }

  if (profile && !profile.is_registered) {
    navigate("/admin");
    return null;
  }

  const rank = profile?.rank as Rank | undefined;

  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-50 border-b border-primary/10"
        style={{
          background: "rgba(10, 10, 11, 0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(212, 175, 55, 0.15)",
        }}
      >
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold">DOJ Personel</span>
            {profile && (
              <span className="text-sm text-muted-foreground ml-2">
                {profile.ic_name} #{profile.badge_number} • {rank?.rank_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Siteye Dön
            </a>
            {rank?.is_admin && (
              <a href="/admin" className="text-sm text-primary hover:underline">
                Admin Panel
              </a>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Çıkış
            </Button>
          </div>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
