import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchRules, upsertRule, deleteRule } from "@/lib/supabase-cms";
import { Trash2 } from "lucide-react";
import { isSupabaseEnabled } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";
import type { RuleCategory } from "@/lib/supabase-cms";

export default function AdminRules() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<RuleCategory | null>(null);
  const [category, setCategory] = useState("");
  const [items, setItems] = useState<{ item_id: string; content: string }[]>([]);

  const { data: rules = [] } = useQuery({
    queryKey: ["rules"],
    queryFn: fetchRules,
    enabled: isSupabaseEnabled,
  });

  const loadForEdit = (r: RuleCategory) => {
    setEditing(r);
    setCategory(r.category);
    setItems((r.items ?? []).map((i) => ({ item_id: i.item_id, content: i.content })));
  };

  const handleSave = async () => {
    if (!category.trim()) {
      toast.error("Kategori adı zorunludur.");
      return;
    }
    const id = await upsertRule(
      { id: editing?.id, category, sort_order: editing?.sort_order ?? rules.length },
      items.filter((i) => i.content.trim())
    );
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      toast.success("Kaydedildi.");
      setEditing(null);
      setCategory("");
      setItems([]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kural kategorisini silmek istediğinize emin misiniz? Tüm maddeler de silinecektir.")) return;
    const ok = await deleteRule(id);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      toast.success("Kural silindi.");
      if (editing?.id === id) {
        setEditing(null);
        setCategory("");
        setItems([]);
      }
    } else {
      toast.error("Silme başarısız.");
    }
  };

  const addItem = () => {
    const n = items.length + 1;
    const cat = (editing?.category ?? category) || "genel";
    const prefix = cat === "general" ? "1" : cat === "uniform" ? "2" : cat === "operations" ? "3" : "4";
    setItems([...items, { item_id: `${prefix}.${n}`, content: "" }]);
  };

  if (!isSupabaseEnabled) {
    return <div className="p-4 bg-muted/30 rounded-lg">Supabase yapılandırılmamış.</div>;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Kurallar</h1>
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle>{editing ? "Kural Düzenle" : "Yeni Kategori"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Kategori Adı</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="örn: Genel Kurallar" className="input-glow" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Maddeler</Label>
              <Button size="sm" variant="outline" onClick={addItem}>+ Madde</Button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={it.item_id} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, item_id: e.target.value } : x))} placeholder="1.1" className="w-20 input-glow" />
                  <Input value={it.content} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, content: e.target.value } : x))} placeholder="Kural metni" className="flex-1 input-glow" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Kaydet</Button>
            {editing && <Button variant="outline" onClick={() => { setEditing(null); setCategory(""); setItems([]); }}>İptal</Button>}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {rules.map((r) => (
          <Card key={r.id} className="border-primary/15">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{r.category}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => loadForEdit(r)}>Düzenle</Button>
                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {(r.items ?? []).map((i) => (
                  <li key={i.id}><span className="text-primary font-mono">§{i.item_id}</span> {i.content}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
