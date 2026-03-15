import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchApplications, fetchFormScenarioQuestions, updateApplicationStatus } from "@/lib/supabase-cms";
import { sendApplicationApprovalToDiscord } from "@/lib/discord-webhook";
import { isSupabaseEnabled } from "@/lib/supabase";
import { useState } from "react";
import { FileText, X, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import type { Application, FormScenarioQuestion } from "@/lib/supabase-cms";

function StatusBadge({ status }: { status?: string }) {
  const { t } = useTranslation();
  const s = status || "pending";
  const labels: Record<string, { labelKey: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { labelKey: "admin.applications.statusPending", variant: "secondary" },
    approved: { labelKey: "admin.applications.statusApproved", variant: "default" },
    rejected: { labelKey: "admin.applications.statusRejected", variant: "destructive" },
  };
  const { labelKey, variant } = labels[s] ?? labels.pending;
  return <Badge variant={variant}>{t(labelKey)}</Badge>;
}

function ApplicationFileView({
  app,
  questions,
  onClose,
  onStatusChange,
}: {
  app: Application;
  questions: FormScenarioQuestion[];
  onClose: () => void;
  onStatusChange: () => void;
}) {
  const { t } = useTranslation();
  const answers = app.scenario_answers ?? {};
  const hasLegacyScenario = app.scenario && !Object.keys(answers).length;

  const handleStatusChange = async (newStatus: "pending" | "approved" | "rejected") => {
    const ok = await updateApplicationStatus(app.id, newStatus);
    if (ok) {
      onStatusChange();
      toast.success(t("admin.applications.statusUpdated"));
      if (newStatus === "approved") {
        const sent = await sendApplicationApprovalToDiscord({ name: app.name, discord: app.discord });
        if (!sent) toast.error(t("admin.applications.discordNotifyFailed"));
      }
    } else toast.error(t("admin.applications.updateFailed"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden border-primary/20 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-primary/10 bg-surface/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{t("admin.applications.fileTitle")} — {app.name}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          <div className="flex items-center justify-between">
            <StatusBadge status={app.status} />
            <Select
              value={app.status || "pending"}
              onValueChange={(v) => handleStatusChange(v as "pending" | "approved" | "rejected")}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t("admin.applications.statusPending")}</SelectItem>
                <SelectItem value="approved">{t("admin.applications.statusApproved")}</SelectItem>
                <SelectItem value="rejected">{t("admin.applications.statusRejected")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <h4 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-2">
              {t("admin.applications.personalInfo")}
            </h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">{t("admin.applications.nameIcOoc")}</dt>
              <dd>{app.name}</dd>
              <dt className="text-muted-foreground">{t("admin.applications.discordName")}</dt>
              <dd>{app.discord}</dd>
              <dt className="text-muted-foreground">{t("admin.applications.discordId")}</dt>
              <dd>{app.fivem_id}</dd>
              <dt className="text-muted-foreground">{t("admin.applications.age")}</dt>
              <dd>{app.age}</dd>
              <dt className="text-muted-foreground">{t("admin.applications.experience")}</dt>
              <dd>{app.experience || "—"}</dd>
            </dl>
          </div>

          <div>
            <h4 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-2">
              {t("admin.applications.motivation")}
            </h4>
            <p className="text-sm whitespace-pre-wrap">{app.reason}</p>
          </div>

          <div>
            <h4 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-2">
              {t("admin.applications.scenarioAnswers")}
            </h4>
            {hasLegacyScenario ? (
              <p className="text-sm whitespace-pre-wrap">{app.scenario}</p>
            ) : Object.keys(answers).length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(answers).map(([qId, ans]) => {
                  const q = questions.find((x) => x.id === qId);
                  return (
                    <div key={qId} className="p-3 bg-surface/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        {q ? q.question_text : t("admin.applications.questionArchived")}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{ans}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {t("admin.applications.applicationDate")}: {new Date(app.created_at).toLocaleString("tr-TR")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminApplications() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
    enabled: isSupabaseEnabled,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["formScenarioQuestions"],
    queryFn: fetchFormScenarioQuestions,
    enabled: isSupabaseEnabled && !!selectedApp,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["applications"] });

  if (!isSupabaseEnabled) {
    return <div className="p-4 bg-muted/30 rounded-lg">{t("admin.supabaseRequired")}</div>;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">{t("admin.applications.title")}</h1>
      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle>{t("admin.applications.listTitle")} ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-muted-foreground">{t("admin.applications.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.applications.name")}</TableHead>
                  <TableHead>{t("admin.applications.discord")}</TableHead>
                  <TableHead>{t("admin.applications.fivemId")}</TableHead>
                  <TableHead>{t("admin.applications.age")}</TableHead>
                  <TableHead>{t("admin.applications.status")}</TableHead>
                  <TableHead>{t("admin.applications.date")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer hover:bg-surface/50"
                    onClick={() => setSelectedApp(a)}
                  >
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.discord}</TableCell>
                    <TableCell>{a.fivem_id}</TableCell>
                    <TableCell>{a.age}</TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                    <TableCell>{new Date(a.created_at).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedApp(a); }}>
                        {t("admin.applications.openFile")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedApp && (
        <ApplicationFileView
          app={selectedApp}
          questions={questions}
          onClose={() => setSelectedApp(null)}
          onStatusChange={invalidate}
        />
      )}
    </div>
  );
}
