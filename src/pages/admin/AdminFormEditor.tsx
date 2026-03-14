import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, GripVertical, ChevronUp, ChevronDown, Plus } from "lucide-react";
import {
  fetchFormConfig,
  fetchFormScenarioQuestions,
  updateFormConfig,
  insertFormScenarioQuestion,
  updateFormScenarioQuestion,
  softDeleteFormScenarioQuestion,
  reorderFormScenarioQuestions,
} from "@/lib/supabase-cms";
import { isSupabaseEnabled } from "@/lib/supabase";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import type { FormConfig, FormPersonalField, FormScenarioQuestion } from "@/lib/supabase-cms";

const PERSONAL_KEYS = ["name", "age", "discord", "hexId"] as const;
const PERSONAL_LABELS: Record<string, string> = {
  name: "İsim",
  age: "Yaş",
  discord: "Discord ID",
  hexId: "Hex ID",
};

export default function AdminFormEditor() {
  const queryClient = useQueryClient();
  const [personal, setPersonal] = useState<Record<string, FormPersonalField>>({});
  const [experience, setExperience] = useState({
    title: "",
    reasonLabel: "",
    reasonPlaceholder: "",
    experienceLabel: "",
    experienceOptions: [] as string[],
  });
  const [newQuestion, setNewQuestion] = useState({ text: "", minChars: 50 });
  const [editingQuestion, setEditingQuestion] = useState<FormScenarioQuestion | null>(null);

  const { data: config = {} } = useQuery({
    queryKey: ["formConfig"],
    queryFn: fetchFormConfig,
    enabled: isSupabaseEnabled,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["formScenarioQuestions"],
    queryFn: fetchFormScenarioQuestions,
    enabled: isSupabaseEnabled,
  });

  useEffect(() => {
    if (config.personal) setPersonal(config.personal);
    if (config.experience) {
      setExperience({
        title: config.experience.title ?? "",
        reasonLabel: config.experience.reasonLabel ?? "",
        reasonPlaceholder: config.experience.reasonPlaceholder ?? "",
        experienceLabel: config.experience.experienceLabel ?? "",
        experienceOptions: config.experience.experienceOptions ?? [],
      });
    }
  }, [config]);

  const savePersonal = async () => {
    const ok = await updateFormConfig("personal", personal);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["formConfig"] });
      toast.success("Kişisel alanlar kaydedildi.");
    } else toast.error("Kaydetme başarısız.");
  };

  const saveExperience = async () => {
    const ok = await updateFormConfig("experience", experience);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["formConfig"] });
      toast.success("Deneyim bölümü kaydedildi.");
    } else toast.error("Kaydetme başarısız.");
  };

  const togglePersonal = (key: string) => {
    const current = personal[key] ?? { enabled: true, label: PERSONAL_LABELS[key] ?? key, placeholder: "" };
    setPersonal((p) => ({ ...p, [key]: { ...current, enabled: !current.enabled } }));
  };

  const updatePersonalLabel = (key: string, label: string) => {
    setPersonal((p) => ({ ...p, [key]: { ...(p[key] ?? {}), label } }));
  };

  const updatePersonalPlaceholder = (key: string, placeholder: string) => {
    setPersonal((p) => ({ ...p, [key]: { ...(p[key] ?? {}), placeholder } }));
  };

  const addScenarioQuestion = async () => {
    if (!newQuestion.text.trim()) {
      toast.error("Soru metni zorunludur.");
      return;
    }
    const id = await insertFormScenarioQuestion({
      question_text: newQuestion.text.trim(),
      min_chars: Math.max(0, newQuestion.minChars),
      sort_order: questions.length,
    });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["formScenarioQuestions"] });
      toast.success("Senaryo sorusu eklendi.");
      setNewQuestion({ text: "", minChars: 50 });
    } else toast.error("Ekleme başarısız.");
  };

  const updateScenarioQuestion = async () => {
    if (!editingQuestion) return;
    const ok = await updateFormScenarioQuestion(editingQuestion.id, {
      question_text: editingQuestion.question_text,
      min_chars: editingQuestion.min_chars,
    });
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["formScenarioQuestions"] });
      toast.success("Soru güncellendi.");
      setEditingQuestion(null);
    }
  };

  const deleteScenarioQuestion = async (id: string) => {
    if (!confirm("Bu soruyu silmek istediğinize emin misiniz? Eski başvurulardaki cevaplar arşivde korunacaktır.")) return;
    const ok = await softDeleteFormScenarioQuestion(id);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["formScenarioQuestions"] });
      toast.success("Soru kaldırıldı.");
    } else toast.error("Silme başarısız.");
  };

  const moveQuestion = async (index: number, dir: 1 | -1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const reordered = [...questions];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    await reorderFormScenarioQuestions(reordered.map((q) => q.id));
    queryClient.invalidateQueries({ queryKey: ["formScenarioQuestions"] });
  };

  const updateExpOption = (i: number, val: string) => {
    const opts = [...experience.experienceOptions];
    opts[i] = val;
    setExperience((e) => ({ ...e, experienceOptions: opts }));
  };

  const addExpOption = () => {
    setExperience((e) => ({ ...e, experienceOptions: [...e.experienceOptions, ""] }));
  };

  const removeExpOption = (i: number) => {
    setExperience((e) => ({
      ...e,
      experienceOptions: e.experienceOptions.filter((_, idx) => idx !== i),
    }));
  };

  if (!isSupabaseEnabled) {
    return <div className="p-4 bg-muted/30 rounded-lg">Supabase yapılandırılmamış.</div>;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Form Editörü</h1>

      {/* Kişisel Bilgiler */}
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle>Kişisel Bilgiler</CardTitle>
          <p className="text-sm text-muted-foreground">Formda gösterilecek alanları açıp kapatın.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {PERSONAL_KEYS.map((key) => {
            const f = personal[key] ?? { enabled: true, label: PERSONAL_LABELS[key], placeholder: "" };
            return (
              <div key={key} className="flex items-center gap-4 p-3 bg-surface/50 rounded-lg">
                <Switch
                  checked={f.enabled}
                  onCheckedChange={() => togglePersonal(key)}
                />
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Etiket"
                    value={f.label}
                    onChange={(e) => updatePersonalLabel(key, e.target.value)}
                    className="input-glow"
                  />
                  <Input
                    placeholder="Placeholder"
                    value={f.placeholder}
                    onChange={(e) => updatePersonalPlaceholder(key, e.target.value)}
                    className="input-glow"
                  />
                </div>
              </div>
            );
          })}
          <Button onClick={savePersonal}>Kaydet</Button>
        </CardContent>
      </Card>

      {/* Deneyim & Motivasyon */}
      <Card className="border-primary/15 mb-6">
        <CardHeader>
          <CardTitle>Deneyim & Motivasyon</CardTitle>
          <p className="text-sm text-muted-foreground">Bölüm başlığı ve açıklamaları.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Bölüm Başlığı</Label>
            <Input
              value={experience.title}
              onChange={(e) => setExperience((e2) => ({ ...e2, title: e.target.value }))}
              className="input-glow"
            />
          </div>
          <div>
            <Label>Motivasyon Sorusu Etiketi</Label>
            <Input
              value={experience.reasonLabel}
              onChange={(e) => setExperience((e2) => ({ ...e2, reasonLabel: e.target.value }))}
              className="input-glow"
            />
          </div>
          <div>
            <Label>Motivasyon Placeholder</Label>
            <Input
              value={experience.reasonPlaceholder}
              onChange={(e) => setExperience((e2) => ({ ...e2, reasonPlaceholder: e.target.value }))}
              className="input-glow"
            />
          </div>
          <div>
            <Label>Deneyim Etiketi</Label>
            <Input
              value={experience.experienceLabel}
              onChange={(e) => setExperience((e2) => ({ ...e2, experienceLabel: e.target.value }))}
              className="input-glow"
            />
          </div>
          <div>
            <Label>Deneyim Seçenekleri</Label>
            <div className="space-y-2 mt-2">
              {experience.experienceOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => updateExpOption(i, e.target.value)}
                    className="input-glow"
                  />
                  <Button size="sm" variant="ghost" onClick={() => removeExpOption(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addExpOption}>
                Seçenek Ekle
              </Button>
            </div>
          </div>
          <Button onClick={saveExperience}>Kaydet</Button>
        </CardContent>
      </Card>

      {/* Senaryo Soruları */}
      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle>Senaryo Soruları</CardTitle>
          <p className="text-sm text-muted-foreground">Başvuru formundaki senaryo sorularını yönetin. Sıralama formdaki görünüm sırasını belirler.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Yeni Soru Ekle - Altın vurgulu */}
          <div className="p-4 rounded-lg border-2 border-amber-500/50 bg-amber-500/5">
            <h3 className="font-heading font-semibold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Yeni Soru Ekle
            </h3>
            <div className="space-y-2">
              <Textarea
                placeholder="Soru metni (örn: Rehine operasyonu sırasında...)"
                value={newQuestion.text}
                onChange={(e) => setNewQuestion((q) => ({ ...q, text: e.target.value }))}
                className="input-glow"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Label className="text-sm">Min. karakter:</Label>
                <Input
                  type="number"
                  min={0}
                  value={newQuestion.minChars}
                  onChange={(e) => setNewQuestion((q) => ({ ...q, minChars: parseInt(e.target.value) || 0 }))}
                  className="input-glow w-24"
                />
              </div>
              <Button
                onClick={addScenarioQuestion}
                className="bg-amber-600 hover:bg-amber-700 text-white border-amber-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Senaryo Sorusu Ekle
              </Button>
            </div>
          </div>

          {/* Mevcut sorular - sıralanabilir liste */}
          <div>
            <h3 className="font-heading font-semibold mb-3">Mevcut Sorular ({questions.length})</h3>
            {questions.length === 0 ? (
              <p className="text-muted-foreground text-sm">Henüz senaryo sorusu yok. Yukarıdan ekleyin.</p>
            ) : (
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-2 p-3 bg-surface-elevated rounded-lg border border-primary/10"
                  >
                    <div className="flex flex-col">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => moveQuestion(i, -1)}
                        disabled={i === 0}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => moveQuestion(i, 1)}
                        disabled={i === questions.length - 1}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      {editingQuestion?.id === q.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingQuestion.question_text}
                            onChange={(e) =>
                              setEditingQuestion((eq) => eq && { ...eq, question_text: e.target.value })
                            }
                            className="input-glow"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min={0}
                              value={editingQuestion.min_chars}
                              onChange={(e) =>
                                setEditingQuestion((eq) =>
                                  eq ? { ...eq, min_chars: parseInt(e.target.value) || 0 } : null
                                )
                              }
                              className="input-glow w-24"
                            />
                            <Button size="sm" onClick={updateScenarioQuestion}>
                              Kaydet
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingQuestion(null)}>
                              İptal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium">{q.question_text}</p>
                          <p className="text-xs text-muted-foreground">Min. {q.min_chars} karakter</p>
                        </>
                      )}
                    </div>
                    {editingQuestion?.id !== q.id && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingQuestion(q)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteScenarioQuestion(q.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
