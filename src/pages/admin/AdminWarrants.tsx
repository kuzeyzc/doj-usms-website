import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  fetchWarrants,
  updateWarrantStatus,
  type Warrant,
  type WarrantStatus,
} from "@/lib/supabase-cms";
import { isSupabaseEnabled } from "@/lib/supabase";
import { FileText, X, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

function StatusBadge({ status }: { status: WarrantStatus }) {
  const config: Record<
    WarrantStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    Pending: { label: "Beklemede", variant: "secondary" },
    Approved: { label: "Onaylandı", variant: "default" },
    Denied: { label: "Reddedildi", variant: "destructive" },
  };
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function formatCaseId(id: string, createdAt: string): string {
  const d = new Date(createdAt);
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
  const short = id.slice(0, 8).toUpperCase();
  return `WR-${ymd}-${short}`;
}

function WarrantDetailModal({
  warrant,
  onClose,
  onDecision,
}: {
  warrant: Warrant;
  onClose: () => void;
  onDecision: () => void;
}) {
  const { t } = useTranslation();
  const [judgeNote, setJudgeNote] = useState(warrant.judge_note ?? "");
  const [action, setAction] = useState<"approve" | "deny" | null>(null);

  const handleApprove = async () => {
    setAction("approve");
    const ok = await updateWarrantStatus(warrant.id, "Approved", judgeNote);
    if (ok) {
      onDecision();
      toast.success("Talep onaylandı.");
      onClose();
    } else {
      toast.error("Güncelleme başarısız.");
    }
    setAction(null);
  };

  const handleDeny = async () => {
    setAction("deny");
    const ok = await updateWarrantStatus(warrant.id, "Denied", judgeNote);
    if (ok) {
      onDecision();
      toast.success("Talep reddedildi.");
      onClose();
    } else {
      toast.error("Güncelleme başarısız.");
    }
    setAction(null);
  };

  const isPending = warrant.status === "Pending";
  const caseId = formatCaseId(warrant.id, warrant.created_at);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card
        className={`w-full max-w-2xl max-h-[90vh] overflow-hidden border-primary/20 shadow-xl relative ${
          warrant.status === "Approved" ? "overflow-visible" : ""
        }`}
      >
        {/* APPROVED mührü overlay - sadece onaylı taleplerde */}
        {warrant.status === "Approved" && (
          <div
            className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
            aria-hidden
          >
            <div
              className="transform -rotate-[-15deg] opacity-90 select-none"
              style={{
                fontSize: "clamp(3rem, 8vw, 6rem)",
                fontWeight: 800,
                color: "rgba(0, 200, 0, 0.85)",
                textShadow:
                  "2px 2px 0 #000, -2px -2px 0 #000, 0 0 20px rgba(0,200,0,0.5)",
                letterSpacing: "0.15em",
                fontFamily: "Cinzel, serif",
              }}
            >
              APPROVED
            </div>
          </div>
        )}

        <CardHeader className="flex flex-row items-center justify-between border-b border-primary/10 bg-surface/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">
              Adli Talep — {caseId}
            </CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          <div className="flex items-center justify-between">
            <StatusBadge status={warrant.status} />
            {isPending && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleApprove}
                  disabled={!!action}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Onayla
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeny}
                  disabled={!!action}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reddet
                </Button>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-2">
              Başvuran Bilgileri
            </h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Başvuran</dt>
              <dd>{warrant.applicant_name}</dd>
              <dt className="text-muted-foreground">Birim</dt>
              <dd>{warrant.department}</dd>
              <dt className="text-muted-foreground">Rütbe</dt>
              <dd>{warrant.rank}</dd>
              <dt className="text-muted-foreground">Talep Türü</dt>
              <dd>
                {warrant.request_type === "Other" && warrant.request_type_other
                  ? `Diğer: ${warrant.request_type_other}`
                  : warrant.request_type}
              </dd>
              <dt className="text-muted-foreground">Hedef</dt>
              <dd>{warrant.target}</dd>
            </dl>
          </div>

          <div>
            <h4 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-2">
              Gerekçe
            </h4>
            <p className="text-sm whitespace-pre-wrap">{warrant.reason}</p>
          </div>

          {warrant.evidence_urls && warrant.evidence_urls.length > 0 && (
            <div>
              <h4 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-2">
                Delil Görselleri
              </h4>
              <div className="flex flex-wrap gap-3">
                {warrant.evidence_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-24 h-24 rounded border border-primary/20 overflow-hidden hover:ring-2 hover:ring-primary/40 transition-shadow"
                  >
                    <img
                      src={url}
                      alt={`Delil ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {isPending && (
            <div>
              <Label>Yargıç Notu (isteğe bağlı)</Label>
              <Textarea
                value={judgeNote}
                onChange={(e) => setJudgeNote(e.target.value)}
                placeholder="Onay/Red gerekçesi..."
                rows={3}
                className="input-glow mt-2"
              />
            </div>
          )}

          {warrant.judge_note && !isPending && (
            <div>
              <h4 className="font-heading text-xs uppercase tracking-section text-primary font-semibold mb-2">
                Yargıç Notu
              </h4>
              <p className="text-sm whitespace-pre-wrap">{warrant.judge_note}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Talep tarihi:{" "}
            {new Date(warrant.created_at).toLocaleString("tr-TR")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminWarrants() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Warrant | null>(null);

  const { data: warrants = [] } = useQuery({
    queryKey: ["warrants"],
    queryFn: fetchWarrants,
    enabled: isSupabaseEnabled,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["warrants"] });

  if (!isSupabaseEnabled) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg">
        {t("admin.supabaseRequired")}
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">
        Adli Talepler
      </h1>
      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle>Talep Listesi ({warrants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {warrants.length === 0 ? (
            <p className="text-muted-foreground">Henüz adli talep yok.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dosya No</TableHead>
                  <TableHead>Başvuran</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead>Hedef</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warrants.map((w) => (
                  <TableRow
                    key={w.id}
                    className="cursor-pointer hover:bg-surface/50"
                    onClick={() => setSelected(w)}
                  >
                    <TableCell className="font-mono text-xs">
                      {formatCaseId(w.id, w.created_at)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {w.applicant_name}
                    </TableCell>
                    <TableCell>{w.department}</TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      {w.target}
                    </TableCell>
                    <TableCell>
                      {w.request_type === "Other" && w.request_type_other
                        ? `Diğer: ${w.request_type_other.slice(0, 30)}${(w.request_type_other?.length ?? 0) > 30 ? "…" : ""}`
                        : w.request_type}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={w.status} />
                    </TableCell>
                    <TableCell>
                      {new Date(w.created_at).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(w);
                        }}
                      >
                        Detay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selected && (
        <WarrantDetailModal
          warrant={selected}
          onClose={() => setSelected(null)}
          onDecision={invalidate}
        />
      )}
    </div>
  );
}
