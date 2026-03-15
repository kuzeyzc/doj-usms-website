import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus } from "lucide-react";
import { fetchFaq, upsertFaqItem, deleteFaqItem } from "@/lib/supabase-cms";
import { isSupabaseEnabled } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";
import type { FaqItem } from "@/lib/supabase-cms";

export default function AdminFaq() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["faq"],
    queryFn: fetchFaq,
    enabled: isSupabaseEnabled,
  });

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("Soru ve cevap zorunludur.");
      return;
    }
    const id = await upsertFaqItem({
      id: editing?.id,
      question,
      answer,
      sort_order: editing?.sort_order ?? items.length,
    });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["faq"] });
      toast.success("Kaydedildi.");
      setEditing(null);
      setQuestion("");
      setAnswer("");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const ok = await deleteFaqItem(id);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["faq"] });
      toast.success("Silindi.");
    }
  };

  if (!isSupabaseEnabled) {
    return <div className="p-4 bg-muted/30 rounded-lg">Supabase yapılandırılmamış.</div>;
  }

  const handleAddNew = () => {
    setEditing(null);
    setQuestion("");
    setAnswer("");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Sıkça Sorulan Sorular</h1>
        <Button variant="outline" onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Soru
        </Button>
      </div>
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle>{editing ? "Düzenle" : "Yeni Soru"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Soru</Label>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} className="input-glow" placeholder="Soru metnini girin..." />
          </div>
          <div>
            <Label>Cevap</Label>
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} className="input-glow min-h-[120px]" rows={4} placeholder="Cevap metnini girin..." />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Kaydet</Button>
            {(editing || question || answer) && (
              <Button variant="outline" onClick={handleAddNew}>
                İptal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="p-4 bg-surface-elevated rounded-lg border border-primary/10">
            <p className="font-semibold">{item.question}</p>
            <p className="text-sm text-muted-foreground mt-1">{item.answer}</p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="ghost" onClick={() => { setEditing(item); setQuestion(item.question); setAnswer(item.answer); }}>
                <Pencil className="w-3 h-3 mr-1" /> Düzenle
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-3 h-3 mr-1" /> Sil
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
