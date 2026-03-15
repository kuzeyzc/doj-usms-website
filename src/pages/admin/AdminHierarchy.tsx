import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { fetchChainOfCommand, upsertChainItem, deleteChainItem, updateChainOrder } from "@/lib/supabase-cms";
import { isSupabaseEnabled } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";
import type { ChainOfCommandItem } from "@/lib/supabase-cms";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableRankCard({
  item,
  onEdit,
  onDelete,
}: {
  item: ChainOfCommandItem;
  onEdit: (item: ChainOfCommandItem) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-surface-elevated rounded-lg border border-primary/10 ${isDragging ? "opacity-80 shadow-lg z-10" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors touch-none"
        aria-label="Sırayı değiştirmek için sürükle"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{item.rank}</p>
        <p className="text-sm text-muted-foreground">{item.name}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="icon" variant="ghost" onClick={() => onEdit(item)}>
          <Pencil className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onDelete(item.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminHierarchy() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ChainOfCommandItem | null>(null);
  const [form, setForm] = useState({ rank: "", name: "—", description: "" });

  const { data: items = [] } = useQuery({
    queryKey: ["chainOfCommand"],
    queryFn: fetchChainOfCommand,
    enabled: isSupabaseEnabled,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    const updates = reordered.map((item, idx) => ({ id: item.id, sort_order: idx }));

    const ok = await updateChainOrder(updates);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["chainOfCommand"] });
      toast.success("Sıra güncellendi.");
    } else {
      toast.error("Sıra güncellenirken hata oluştu.");
    }
  };

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
        <p className="text-sm text-muted-foreground mb-3">Rütbeleri sürükleyerek sıralayabilirsiniz.</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <SortableRankCard
                key={item.id}
                item={item}
                onEdit={(i) => { setEditing(i); setForm({ rank: i.rank, name: i.name, description: i.description }); }}
                onDelete={handleDelete}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
