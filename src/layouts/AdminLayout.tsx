import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from "react-router-dom";
import { isSupabaseEnabled, supabase } from "@/lib/supabase";
import {
  getCurrentUser,
  getProfile,
  isProfileAdmin,
  type Profile,
  type Rank,
} from "@/lib/auth";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  Shield,
  Settings,
  Users,
  FileText,
  Gavel,
  HelpCircle,
  Image,
  ClipboardList,
  LayoutDashboard,
  FileEdit,
  Scale,
  UserPlus,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLoginView from "@/components/AdminLoginView";
import PersonnelActivationView from "@/components/PersonnelActivationView";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/personnel", icon: UserPlus, label: "Personel Oluştur" },
  { to: "/admin/ranks", icon: Award, label: "Rütbe Yönetimi" },
  { to: "/admin/settings", icon: Settings, label: "Genel Ayarlar" },
  { to: "/admin/hierarchy", icon: Users, label: "Komuta Zinciri" },
  { to: "/admin/documents", icon: FileText, label: "Belgeler" },
  { to: "/admin/rules", icon: Gavel, label: "Kurallar" },
  { to: "/admin/faq", icon: HelpCircle, label: "SSS" },
  { to: "/admin/gallery", icon: Image, label: "Galeri" },
  { to: "/admin/applications", icon: ClipboardList, label: "Başvurular" },
  { to: "/admin/warrants", icon: Scale, label: "Adli Talepler" },
  { to: "/admin/form-editor", icon: FileEdit, label: "Form Editörü" },
];

export default function AdminLayout() {
  const location = useLocation();
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

  const isAdmin = profile?.rank ? (profile.rank as Rank).is_admin : false;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-pulse text-primary">Yükleniyor...</div>
        <p className="text-sm text-muted-foreground">5 saniye içinde giriş sayfası açılır</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLoading(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          Şimdi giriş sayfasına git
        </Button>
      </div>
    );
  }

  if (!isSupabaseEnabled || !supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-destructive font-heading mb-4">
            Personel sistemi için Supabase yapılandırılmalıdır.
          </p>
          <p className="text-muted-foreground text-sm">
            .env dosyasında VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlayın.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminLoginView onSuccess={() => window.location.reload()} />;
  }

  if (profile && !profile.is_registered) {
    return (
      <PersonnelActivationView
        userId={user.id}
        onSuccess={() => window.location.reload()}
      />
    );
  }

  if (profile && !isAdmin) {
    return <Navigate to="/personnel" replace />;
  }

  return (
    <SidebarProvider>
      <Sidebar side="left" className="border-r border-primary/10 bg-surface">
        <SidebarHeader className="border-b border-primary/10 p-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold">DOJ Admin</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Yönetim</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        location.pathname === item.to ||
                        (item.to !== "/admin" &&
                          location.pathname.startsWith(item.to))
                      }
                    >
                      <NavLink to={item.to}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <div className="p-4 border-t border-primary/10">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            Çıkış
          </Button>
        </div>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b border-primary/10 px-6">
          <NavLink
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Siteye Dön
          </NavLink>
        </header>
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
