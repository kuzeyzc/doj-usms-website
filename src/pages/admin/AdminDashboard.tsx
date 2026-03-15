import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Image, ClipboardList } from "lucide-react";
import { fetchDocuments } from "@/lib/supabase";
import { fetchChainOfCommand, fetchGallery, fetchApplications } from "@/lib/supabase-cms";
import { isSupabaseEnabled } from "@/lib/supabase";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: docs = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
    enabled: isSupabaseEnabled,
  });
  const { data: chain = [] } = useQuery({
    queryKey: ["chainOfCommand"],
    queryFn: fetchChainOfCommand,
    enabled: isSupabaseEnabled,
  });
  const { data: gallery = [] } = useQuery({
    queryKey: ["gallery"],
    queryFn: fetchGallery,
    enabled: isSupabaseEnabled,
  });
  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
    enabled: isSupabaseEnabled,
  });

  const stats = [
    { labelKey: "admin.dashboard.documents", value: docs.length, icon: FileText },
    { labelKey: "admin.dashboard.chainOfCommand", value: chain.length, icon: Users },
    { labelKey: "admin.dashboard.gallery", value: gallery.length, icon: Image },
    { labelKey: "admin.dashboard.applications", value: applications.length, icon: ClipboardList },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">{t("admin.dashboard.title")}</h1>
      {!isSupabaseEnabled && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
          {t("admin.supabaseRequired")}. {t("admin.supabaseHint")}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.labelKey} className="border-primary/15">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t(s.labelKey)}</CardTitle>
              <s.icon className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {applications.length > 0 && (
        <Card className="mt-6 border-primary/15">
          <CardHeader>
            <CardTitle>{t("admin.dashboard.recentApplications")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {applications.slice(0, 5).map((a) => (
                <div key={a.id} className="flex justify-between text-sm py-2 border-b border-primary/10 last:border-0">
                  <span>{a.name}</span>
                  <span className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString("tr-TR")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
