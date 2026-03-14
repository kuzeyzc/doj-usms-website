import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { fetchGallery, insertGalleryItem, deleteGalleryItem, uploadGalleryImage } from "@/lib/supabase-cms";
import { isSupabaseEnabled } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminGallery() {
  const queryClient = useQueryClient();
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["gallery"],
    queryFn: fetchGallery,
    enabled: isSupabaseEnabled,
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error("Dosya seçin.");
      return;
    }
    setUploading(true);
    const result = await uploadGalleryImage(file);
    if ("error" in result) {
      toast.error(result.error);
      setUploading(false);
      return;
    }
    const id = await insertGalleryItem({ image_url: result.url, description: desc || undefined, sort_order: items.length });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Yüklendi.");
      setFile(null);
      setDesc("");
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    const ok = await deleteGalleryItem(id);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Silindi.");
    }
  };

  if (!isSupabaseEnabled) {
    return <div className="p-4 bg-muted/30 rounded-lg">Supabase yapılandırılmamış. Storage'da &quot;gallery&quot; bucket oluşturun.</div>;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Galeri</h1>
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle>Görsel Yükle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Dosya</Label>
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <Label>Açıklama (isteğe bağlı)</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="input-glow" />
          </div>
          <Button onClick={handleUpload} disabled={uploading || !file}>{uploading ? "Yükleniyor..." : "Yükle"}</Button>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="relative group rounded-lg overflow-hidden border border-primary/10">
            <img src={item.image_url} alt={item.description ?? ""} className="aspect-video object-cover w-full" />
            {item.description && <p className="p-2 text-xs text-muted-foreground truncate">{item.description}</p>}
            <Button size="icon" variant="destructive" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(item.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
