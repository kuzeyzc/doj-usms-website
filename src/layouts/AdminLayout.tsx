import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import {
  isAdminAuthenticated,
  setAdminAuthenticated,
  getAdminPassword,
} from "@/lib/admin";
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
import { Shield, Settings, Users, FileText, Gavel, HelpCircle, Image, ClipboardList, LayoutDashboard, FileEdit, Scale, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/settings", icon: Settings, label: "Genel Ayarlar" },
  { to: "/admin/hierarchy", icon: Users, label: "Komuta Zinciri" },
  { to: "/admin/documents", icon: FileText, label: "Belgeler" },
  { to: "/admin/rules", icon: Gavel, label: "Kurallar" },
  { to: "/admin/faq", icon: HelpCircle, label: "SSS" },
  { to: "/admin/gallery", icon: Image, label: "Galeri" },
  { to: "/admin/applications", icon: ClipboardList, label: "Başvurular" },
  { to: "/admin/warrants", icon: Scale, label: "Adli Talepler" },
  { to: "/admin/form-editor", icon: FileEdit, label: "Form Editörü" },
  { to: "/admin/blog", icon: Newspaper, label: "Blog" },
];

export default function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setAuth(isAdminAuthenticated());
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === getAdminPassword()) {
      setAdminAuthenticated(true);
      setAuth(true);
      setErr("");
    } else {
      setErr("Geçersiz şifre.");
    }
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setAuth(false);
    navigate("/admin");
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm p-8 bg-surface-elevated rounded-lg border border-primary/20">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full mb-6 py-2.5 px-4 text-sm font-heading font-semibold tracking-wide rounded-md
              bg-gradient-to-r from-amber-500/90 via-primary to-amber-600/90 text-primary-foreground
              hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300 border border-amber-400/30"
          >
            ← {t("admin.backToHome")}
          </Link>
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="font-heading text-xl font-bold">Personel Girişi</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Şifre"
              className="input-glow"
            />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" className="w-full">Giriş Yap</Button>
          </form>
        </div>
      </div>
    );
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
                    <SidebarMenuButton asChild isActive={location.pathname === item.to || (item.to !== "/admin" && location.pathname.startsWith(item.to))}>
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
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            Çıkış
          </Button>
        </div>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b border-primary/10 px-6">
          <NavLink to="/" className="text-sm text-muted-foreground hover:text-foreground">
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
