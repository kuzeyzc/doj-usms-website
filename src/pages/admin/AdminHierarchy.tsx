import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus } from "lucide-react";
import { fetchChainOfCommand, upsertChainItem, deleteChainItem } from "@/lib/supabase-cms";
import { isSupabaseEnabled } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";
import type { ChainOfCommandItem } from "@/lib/supabase-cms";

export default function AdminHierarchy() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ChainOfCommandItem | null>(null);
  const [form, setForm] = useState({ rank: "", name: "—", description: "" });

  const { data: items = [] } = useQuery({
    queryKey: ["chainOfCommand"],
    queryFn: fetchChainOfCommand,
    enabled: isSupabaseEnabled,
  });

  const handleSave = async () => {
    if (!form.rank || !form.description) {
      toast.error("Rütbe ve açıklama zorunludur.");
      return;
    }
    const id = await upsertChainItem({
      id: editing?.id,
      rank: form.rank,
      name: form.name || "—",
      description: form.description,
      sort_order: editing ? (editing as ChainOfCommandItem).sort_order : items.length,
    });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["chainOfCommand"] });
      toast.success("Kaydedildi.");
      setEditing(null);
      setForm({ rank: "", name: "—", description: "" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const ok = await deleteChainItem(id);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["chainOfCommand"] });
      toast.success("Silindi.");
    }
  };

  if (!isSupabaseEnabled) {
    return <div className="p-4 bg-muted/30 rounded-lg">Supabase yapılandırılmamış.</div>;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Komuta Zinciri</h1>
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle>{editing ? "Düzenle" : "Yeni Ekle"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Rütbe</Label>
            <Input value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} className="input-glow" />
          </div>
          <div>
            <Label>İsim</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-glow" placeholder="—" />
          </div>
          <div>
            <Label>Açıklama</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-glow" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Kaydet</Button>
            {editing && <Button variant="outline" onClick={() => { setEditing(null); setForm({ rank: "", name: "—", description: "" }); }}>İptal</Button>}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg border border-primary/10">
            <div>
              <p className="font-semibold">{item.rank}</p>
              <p className="text-sm text-muted-foreground">{item.name}</p>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => { setEditing(item); setForm({ rank: item.rank, name: item.name, description: item.description }); }}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
