import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Award, Plus, Pencil, Trash2 } from "lucide-react";
import {
  fetchRanks,
  insertRank,
  updateRank,
  deleteRank,
  type Rank,
} from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function AdminRanksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Rank | null>(null);
  const [adding, setAdding] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPrefix, setFormPrefix] = useState(5);
  const [formAdmin, setFormAdmin] = useState(false);

  const { data: ranks = [] } = useQuery({
    queryKey: ["ranks"],
    queryFn: fetchRanks,
  });

  const addMutation = useMutation({
    mutationFn: () => insertRank(formName, formPrefix, formAdmin),
    onSuccess: (result) => {
      if (result.id) {
        toast({ title: "Rütbe eklendi" });
        setAdding(false);
        setEditing(null);
        resetForm();
        queryClient.invalidateQueries({ queryKey: ["ranks"] });
      } else {
        toast({ title: "Hata", description: result.error ?? "Rütbe eklenemedi", variant: "destructive" });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      editing ? updateRank(editing.id, { rank_name: formName, badge_prefix: formPrefix, is_admin: formAdmin }) : Promise.resolve({ success: false }),
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: "Rütbe güncellendi" });
        setEditing(null);
        resetForm();
        queryClient.invalidateQueries({ queryKey: ["ranks"] });
      } else if (result.error) {
        toast({ title: "Hata", description: result.error, variant: "destructive" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRank(id),
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: "Rütbe silindi" });
        queryClient.invalidateQueries({ queryKey: ["ranks"] });
      } else {
        toast({ title: "Hata", description: result.error, variant: "destructive" });
      }
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormPrefix(5);
    setFormAdmin(false);
  };

  const openEdit = (r: Rank) => {
    setEditing(r);
    setFormName(r.rank_name);
    setFormPrefix(r.badge_prefix);
    setFormAdmin(r.is_admin);
  };

  const openAdd = () => {
    setAdding(true);
    resetForm();
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Rütbe Yönetimi</h1>

      <Card className="border-primary/15">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Rütbeler
          </CardTitle>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Rütbe Ekle
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rütbe Adı</TableHead>
                <TableHead>Rozet Prefix</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead className="w-24">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranks.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.rank_name}</TableCell>
                  <TableCell>{r.badge_prefix}xx</TableCell>
                  <TableCell>{r.is_admin ? "Evet" : "Hayır"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`"${r.rank_name}" rütbesini silmek istediğinize emin misiniz?`)) {
                            deleteMutation.mutate(r.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={adding || !!editing} onOpenChange={(o) => !o && (setAdding(false), setEditing(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Rütbe Düzenle" : "Rütbe Ekle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rank-name">Rütbe Adı</Label>
              <Input
                id="rank-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Deputy Marshal"
              />
            </div>
            <div>
              <Label htmlFor="badge-prefix">Rozet Prefix (1-9)</Label>
              <Input
                id="badge-prefix"
                type="number"
                min={1}
                max={9}
                value={formPrefix}
                onChange={(e) => setFormPrefix(parseInt(e.target.value) || 5)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Bu rütbedeki personel {formPrefix}00-{formPrefix}99 arası rozet seçebilir.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-admin"
                checked={formAdmin}
                onChange={(e) => setFormAdmin(e.target.checked)}
                className="rounded border-primary/40 accent-primary"
              />
              <Label htmlFor="is-admin">Admin yetkisi (personel oluşturma, rütbe yönetimi)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => (setAdding(false), setEditing(null))}>
              İptal
            </Button>
            {editing ? (
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={!formName.trim() || updateMutation.isPending}
              >
                {updateMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
              </Button>
            ) : (
              <Button
                onClick={() => addMutation.mutate()}
                disabled={!formName.trim() || addMutation.isPending}
              >
                {addMutation.isPending ? "Ekleniyor..." : "Ekle"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
