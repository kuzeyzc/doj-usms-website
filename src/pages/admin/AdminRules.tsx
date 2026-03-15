import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchRules, upsertRule, deleteRule } from "@/lib/supabase-cms";
import { Pencil, Trash2, Plus } from "lucide-react";
import { isSupabaseEnabled } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";
import type { RuleCategory } from "@/lib/supabase-cms";

export default function AdminRules() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<RuleCategory | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: rules = [] } = useQuery({
    queryKey: ["rules"],
    queryFn: fetchRules,
    enabled: isSupabaseEnabled,
  });

  const loadForEdit = (r: RuleCategory) => {
    setEditing(r);
    setTitle(r.title ?? r.category ?? "");
    setContent(
      r.content ??
        (r.items ?? [])
          .map((i) => (i.item_id ? `${i.item_id} ${i.content}` : i.content))
          .join("\n\n") ??
        ""
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Başlık zorunludur.");
      return;
    }
    const id = await upsertRule({
      id: editing?.id,
      title: title.trim(),
      content: content.trim() || undefined,
      sort_order: editing?.sort_order ?? rules.length,
    });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      toast.success("Kaydedildi.");
      setEditing(null);
      setTitle("");
      setContent("");
    } else {
      toast.error("Kaydetme başarısız.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kuralı silmek istediğinize emin misiniz?")) return;
    const ok = await deleteRule(id);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      toast.success("Kural silindi.");
      if (editing?.id === id) {
        setEditing(null);
        setTitle("");
        setContent("");
      }
    } else {
      toast.error("Silme başarısız.");
    }
  };

  const handleAddNew = () => {
    setEditing(null);
    setTitle("");
    setContent("");
  };

  if (!isSupabaseEnabled) {
    return <div className="p-4 bg-muted/30 rounded-lg">Supabase yapılandırılmamış.</div>;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Kurallar</h1>
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle>{editing ? "Kural Düzenle" : "Yeni Kural"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Başlık</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="örn: 1 - USMS Nedir?"
              className="input-glow"
            />
          </div>
          <div>
            <Label>İçerik</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Kural metni... Satır sonları korunur. Alt maddeler için a., b., c. kullanın."
              className="input-glow min-h-[200px] font-mono text-sm"
              rows={12}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Kaydet</Button>
            {editing && (
              <Button variant="outline" onClick={handleAddNew}>
                Yeni Ekle
              </Button>
            )}
            {(editing || title || content) && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setTitle("");
                  setContent("");
                }}
              >
                İptal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Mevcut Kurallar</h2>
          <Button size="sm" variant="outline" onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-1" />
            Yeni Kural
          </Button>
        </div>
        {rules.map((r) => (
          <Card key={r.id} className="border-primary/15">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {r.title ?? r.category ?? "Başlıksız"}
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => loadForEdit(r)}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Düzenle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(r.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {r.content ? (
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                  {r.content}
                </pre>
              ) : (
                <ul className="space-y-1 text-sm">
                  {(r.items ?? []).map((i) => (
                    <li key={i.id}>
                      <span className="text-primary font-mono">{i.item_id}</span> {i.content}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
