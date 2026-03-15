import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { fetchSiteSettings, updateSiteSetting } from "@/lib/supabase-cms";
import { isSupabaseEnabled } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: fetchSiteSettings,
    enabled: isSupabaseEnabled,
  });

  const [general, setGeneral] = useState<Record<string, string>>({});
  const [mission, setMission] = useState<Record<string, string>>({});
  const [quickLinks, setQuickLinks] = useState({ title: "", subtitle: "" });
  const [footer, setFooter] = useState({
    contactTitle: "",
    discordLabel: "",
    discordText: "",
    discordUrl: "",
  });
  const [heroStats, setHeroStats] = useState({
    agents_count: 42,
    operations_count: 1847,
    founded_year: 1789,
  });

  useEffect(() => {
    const s = settings as {
      general?: Record<string, string>;
      mission?: Record<string, string>;
      quickLinks?: { title: string; subtitle: string };
      footer?: Record<string, string>;
      heroStats?: { agents_count: number; operations_count: number; founded_year: number };
    };
    setGeneral(s.general ?? {});
    setMission(s.mission ?? {});
    setQuickLinks(s.quickLinks ?? { title: "", subtitle: "" });
    setFooter(s.footer ?? { contactTitle: "", discordLabel: "", discordText: "", discordUrl: "" });
    setHeroStats(s.heroStats ?? { agents_count: 42, operations_count: 1847, founded_year: 1789 });
  }, [settings]);

  const saveGeneral = async () => {
    const ok = await updateSiteSetting("general", general);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      toast.success("Genel ayarlar kaydedildi.");
    } else toast.error("Kaydetme başarısız.");
  };

  const saveMission = async () => {
    const ok = await updateSiteSetting("mission", mission);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      toast.success("Misyon ayarları kaydedildi.");
    } else toast.error("Kaydetme başarısız.");
  };

  const saveQuickLinks = async () => {
    const ok = await updateSiteSetting("quickLinks", quickLinks);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      toast.success("Hızlı Erişim ayarları kaydedildi.");
    } else toast.error("Kaydetme başarısız.");
  };

  const saveFooter = async () => {
    const ok = await updateSiteSetting("footer", footer);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      toast.success("Footer ayarları kaydedildi.");
    } else toast.error("Kaydetme başarısız.");
  };

  const saveHeroStats = async () => {
    const ok = await updateSiteSetting("heroStats", heroStats);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      toast.success("Anasayfa istatistikleri kaydedildi.");
    } else toast.error("Kaydetme başarısız.");
  };

  if (!isSupabaseEnabled) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg">
        Supabase yapılandırılmamış. Genel ayarları düzenlemek için Supabase kurulumu yapın.
      </div>
    );
  }

  const Field = ({
    preview,
    label,
    value,
    onChange,
    textarea = false,
  }: {
    preview: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    textarea?: boolean;
  }) => (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Label>{label}</Label>
        <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
          {preview}
        </Badge>
      </div>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} className="input-glow" rows={2} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="input-glow" />
      )}
    </div>
  );

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Genel Ayarlar</h1>

      {/* Hero & Genel */}
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle>Hero Başlık & Slogan</CardTitle>
          <p className="text-sm text-muted-foreground">Ana sayfa hero bölümü ve genel site metinleri.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            preview="Hero Badge"
            label="Hero Badge"
            value={general.heroBadge ?? ""}
            onChange={(v) => setGeneral((g) => ({ ...g, heroBadge: v }))}
          />
          <Field
            preview="Hero Slogan"
            label="Hero Slogan (örn: Justice. Integrity. Service.)"
            value={general.slogan ?? ""}
            onChange={(v) => setGeneral((g) => ({ ...g, slogan: v }))}
          />
          <Field
            preview="Hero Alt Yazı"
            label="Hero Alt Yazı"
            value={general.heroSubtitle ?? ""}
            onChange={(v) => setGeneral((g) => ({ ...g, heroSubtitle: v }))}
            textarea
          />
          <Field preview="Site Adı" label="Site Adı" value={general.siteName ?? ""} onChange={(v) => setGeneral((g) => ({ ...g, siteName: v }))} />
          <Field preview="Hakkımızda Başlık" label="Hakkımızda Başlık" value={general.aboutTitle ?? ""} onChange={(v) => setGeneral((g) => ({ ...g, aboutTitle: v }))} />
          <Field preview="Hakkımızda P1" label="Hakkımızda Paragraf 1" value={general.aboutP1 ?? ""} onChange={(v) => setGeneral((g) => ({ ...g, aboutP1: v }))} textarea />
          <Field preview="Hakkımızda P2" label="Hakkımızda Paragraf 2" value={general.aboutP2 ?? ""} onChange={(v) => setGeneral((g) => ({ ...g, aboutP2: v }))} textarea />
          <Field preview="Hakkımızda P3" label="Hakkımızda Paragraf 3" value={general.aboutP3 ?? ""} onChange={(v) => setGeneral((g) => ({ ...g, aboutP3: v }))} textarea />
          <Field preview="Footer Açıklama" label="Footer Açıklama" value={general.footerDesc ?? ""} onChange={(v) => setGeneral((g) => ({ ...g, footerDesc: v }))} textarea />
          <Field preview="Footer Copyright" label="Footer Copyright" value={general.footerCopyright ?? ""} onChange={(v) => setGeneral((g) => ({ ...g, footerCopyright: v }))} />
          <Button onClick={saveGeneral} disabled={isLoading}>
            Kaydet
          </Button>
        </CardContent>
      </Card>

      {/* Misyon */}
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle>Misyonumuz — Federal Hukuk Uygulama</CardTitle>
          <p className="text-sm text-muted-foreground">Ana sayfadaki misyon bölümü metinleri.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            preview="Misyon Etiketi"
            label="Misyon Etiketi"
            value={mission.label ?? ""}
            onChange={(v) => setMission((m) => ({ ...m, label: v }))}
          />
          <Field
            preview="Misyon Başlık"
            label="Misyon Başlık"
            value={mission.title ?? ""}
            onChange={(v) => setMission((m) => ({ ...m, title: v }))}
          />
          <Field preview="Misyon P1" label="Paragraf 1" value={mission.p1 ?? ""} onChange={(v) => setMission((m) => ({ ...m, p1: v }))} textarea />
          <Field preview="Misyon P2" label="Paragraf 2" value={mission.p2 ?? ""} onChange={(v) => setMission((m) => ({ ...m, p2: v }))} textarea />
          <Field preview="Misyon P3" label="Paragraf 3" value={mission.p3 ?? ""} onChange={(v) => setMission((m) => ({ ...m, p3: v }))} textarea />
          <Button onClick={saveMission} disabled={isLoading}>
            Kaydet
          </Button>
        </CardContent>
      </Card>

      {/* Anasayfa İstatistikleri */}
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle>Anasayfa İstatistikleri</CardTitle>
          <p className="text-sm text-muted-foreground">Hero bölümündeki sayısal değerler (Aktif Ajanlar, Operasyonlar, Kuruluş yılı).</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Agents (Aktif Ajanlar)</Label>
            <Input
              type="number"
              min={0}
              value={heroStats.agents_count}
              onChange={(e) => setHeroStats((h) => ({ ...h, agents_count: parseInt(e.target.value) || 0 }))}
              className="input-glow"
            />
          </div>
          <div>
            <Label>Operations (Başarılı Operasyon)</Label>
            <Input
              type="number"
              min={0}
              value={heroStats.operations_count}
              onChange={(e) => setHeroStats((h) => ({ ...h, operations_count: parseInt(e.target.value) || 0 }))}
              className="input-glow"
            />
          </div>
          <div>
            <Label>Founded (Kuruluş Yılı)</Label>
            <Input
              type="number"
              min={1700}
              max={2100}
              value={heroStats.founded_year}
              onChange={(e) => setHeroStats((h) => ({ ...h, founded_year: parseInt(e.target.value) || 1789 }))}
              className="input-glow"
            />
          </div>
          <Button onClick={saveHeroStats} disabled={isLoading}>
            Kaydet
          </Button>
        </CardContent>
      </Card>

      {/* Hızlı Erişim */}
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle>Hızlı Erişim Bölümü</CardTitle>
          <p className="text-sm text-muted-foreground">Ana sayfadaki &quot;Hızlı Erişim: İhtiyacınız Olan Her Şey&quot; başlığı ve açıklaması.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            preview="Hızlı Erişim Başlık"
            label="Başlık"
            value={quickLinks.title}
            onChange={(v) => setQuickLinks((q) => ({ ...q, title: v }))}
          />
          <Field
            preview="Hızlı Erişim Alt Yazı"
            label="Alt Yazı"
            value={quickLinks.subtitle}
            onChange={(v) => setQuickLinks((q) => ({ ...q, subtitle: v }))}
          />
          <Button onClick={saveQuickLinks} disabled={isLoading}>
            Kaydet
          </Button>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle>Footer (Alt Bilgi)</CardTitle>
          <p className="text-sm text-muted-foreground">
            İletişim başlığı, Discord metni ve linki. <strong>Discord linkini güncellediğinizde hem ekrandaki yazı hem de tıklanınca gidilen URL değişir.</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            preview="Footer İletişim"
            label="İletişim Başlığı"
            value={footer.contactTitle}
            onChange={(v) => setFooter((f) => ({ ...f, contactTitle: v }))}
          />
          <Field
            preview="Discord Etiketi"
            label="Discord Etiketi (örn: Discord Sunucusu)"
            value={footer.discordLabel}
            onChange={(v) => setFooter((f) => ({ ...f, discordLabel: v }))}
          />
          <Field
            preview="Discord Link Metni"
            label="Discord Link Metni — Ekranda görünen yazı (örn: discord.gg/usmarshals)"
            value={footer.discordText}
            onChange={(v) => setFooter((f) => ({ ...f, discordText: v }))}
          />
          <Field
            preview="Discord Link URL"
            label="Discord Link URL — Tıklanınca gidilen adres (örn: https://discord.gg/usmarshals)"
            value={footer.discordUrl}
            onChange={(v) => setFooter((f) => ({ ...f, discordUrl: v }))}
          />
          <Button onClick={saveFooter} disabled={isLoading}>
            Kaydet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
