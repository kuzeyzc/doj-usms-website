import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { isSupabaseEnabled } from "@/lib/supabase";
import { useState } from "react";
import { FileText, X, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import type { Application, FormScenarioQuestion } from "@/lib/supabase-cms";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Beklemede", variant: "secondary" },
  approved: { label: "Onaylandı", variant: "default" },
  rejected: { label: "Reddedildi", variant: "destructive" },
};

function StatusBadge({ status }: { status?: string }) {
  const s = status || "pending";
  const { label, variant } = STATUS_LABELS[s] ?? STATUS_LABELS.pending;
  return <Badge variant={variant}>{label}</Badge>;
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
  const answers = app.scenario_answers ?? {};
  const hasLegacyScenario = app.scenario && !Object.keys(answers).length;

  const handleStatusChange = async (newStatus: "pending" | "approved" | "rejected") => {
    const ok = await updateApplicationStatus(app.id, newStatus);
    if (ok) {
      onStatusChange();
      toast.success("Durum güncellendi.");
    } else toast.error("Güncelleme başarısız.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden border-primary/20 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-primary/10 bg-surface/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Başvuru Dosyası — {app.name}</CardTitle>
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
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="approved">Onaylandı</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <h4 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-2">
              Kişisel Bilgiler
            </h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">İsim</dt>
              <dd>{app.name}</dd>
              <dt className="text-muted-foreground">Discord</dt>
              <dd>{app.discord}</dd>
              <dt className="text-muted-foreground">FiveM / Hex ID</dt>
              <dd>{app.fivem_id}</dd>
              <dt className="text-muted-foreground">Yaş</dt>
              <dd>{app.age}</dd>
              <dt className="text-muted-foreground">Deneyim</dt>
              <dd>{app.experience || "—"}</dd>
            </dl>
          </div>

          <div>
            <h4 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-2">
              Motivasyon
            </h4>
            <p className="text-sm whitespace-pre-wrap">{app.reason}</p>
          </div>

          <div>
            <h4 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-2">
              Senaryo Cevapları
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
                        {q ? q.question_text : `Soru (arşiv)`}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{ans}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Başvuru tarihi: {new Date(app.created_at).toLocaleString("tr-TR")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminApplications() {
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
    return <div className="p-4 bg-muted/30 rounded-lg">Supabase yapılandırılmamış.</div>;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Gelen Başvurular</h1>
      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle>Başvuru Listesi ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-muted-foreground">Henüz başvuru yok.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İsim</TableHead>
                  <TableHead>Discord</TableHead>
                  <TableHead>FiveM ID</TableHead>
                  <TableHead>Yaş</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
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
                        Dosyayı Aç
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
