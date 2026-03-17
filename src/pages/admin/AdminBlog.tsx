import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
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
import { Pencil, Trash2, Plus, ArrowLeft, Upload, X } from "lucide-react";
import {
  fetchBlogPosts,
  insertBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadBlogImage,
  type BlogPost,
} from "@/lib/supabase-cms";
import { isSupabaseEnabled } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const GOLD = "#FFB800";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

const emptyPost: Omit<BlogPost, "id" | "created_at" | "updated_at"> = {
  title: "",
  category: "",
  image_url: null,
  content: "",
  excerpt: null,
  author: "USMS",
};

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPost);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: posts = [] } = useQuery({
    queryKey: ["blogAdmin"],
    queryFn: () => fetchBlogPosts(100, 0),
    enabled: isSupabaseEnabled,
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyPost);
    setImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setModalOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      category: post.category,
      image_url: post.image_url,
      content: post.content,
      excerpt: post.excerpt,
      author: post.author,
    });
    setImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyPost);
    setImageFile(null);
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    setUploadingImage(true);
    const result = await uploadBlogImage(imageFile);
    if ("error" in result) {
      toast.error(result.error);
      setUploadingImage(false);
      return;
    }
    setForm({ ...form, image_url: result.url });
    setImageFile(null);
    setUploadingImage(false);
    toast.success("Görsel yüklendi.");
  };

  const clearImage = () => {
    setForm({ ...form, image_url: null });
    setImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Başlık zorunludur.");
      return;
    }
    let finalForm = { ...form };
    if (imageFile) {
      setUploadingImage(true);
      const result = await uploadBlogImage(imageFile);
      if ("error" in result) {
        toast.error(result.error);
        setUploadingImage(false);
        return;
      }
      finalForm = { ...finalForm, image_url: result.url };
      setUploadingImage(false);
    }
    setSaving(true);
    try {
      if (editingId) {
        const ok = await updateBlogPost(editingId, finalForm);
        if (ok) {
          queryClient.invalidateQueries({ queryKey: ["blog"] });
          queryClient.invalidateQueries({ queryKey: ["blogAdmin"] });
          queryClient.invalidateQueries({ queryKey: ["blogPost"] });
          toast.success("Blog güncellendi.");
          closeModal();
        } else {
          toast.error("Güncelleme başarısız.");
        }
      } else {
        const id = await insertBlogPost(finalForm);
        if (id) {
          queryClient.invalidateQueries({ queryKey: ["blog"] });
          queryClient.invalidateQueries({ queryKey: ["blogAdmin"] });
          toast.success("Blog oluşturuldu.");
          closeModal();
        } else {
          toast.error("Oluşturma başarısız.");
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu blog yazısını silmek istediğinize emin misiniz?")) return;
    const ok = await deleteBlogPost(id);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      queryClient.invalidateQueries({ queryKey: ["blogAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["blogPost"] });
      toast.success("Blog silindi.");
    } else {
      toast.error("Silme başarısız.");
    }
  };

  if (!isSupabaseEnabled) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg">
        Supabase yapılandırılmamış. blog_posts tablosu oluşturulmalı.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/blog"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {posts.length} Blog
          </Link>
          <h1 className="font-heading text-2xl font-bold">Blog Yönetimi</h1>
        </div>
        <Button
          onClick={openCreate}
          className="font-heading uppercase tracking-wider"
          style={{ backgroundColor: GOLD, color: "#000" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Blog Oluştur
        </Button>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card className="border-primary/15">
            <CardContent className="py-12 text-center text-muted-foreground">
              Henüz blog yazısı yok. Yeni blog oluşturmak için yukarıdaki butona
              tıklayın.
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card
              key={post.id}
              className="border-[#1A1A1A] bg-[#121212] border"
            >
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold text-white truncate">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {format(new Date(post.created_at), "d MMMM yyyy", {
                      locale: tr,
                    })}{" "}
                    • {post.category}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(post)}
                    className="gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                    className="text-destructive hover:text-destructive gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Sil
                  </Button>
                  <Link to={`/blog/${post.id}`} target="_blank">
                    <Button variant="ghost" size="sm">
                      Görüntüle
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#121212] border-[#1A1A1A]"
          style={{ color: "#D1D1D1" }}
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingId ? "Blog Düzenle" : "Yeni Blog Oluştur"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#888]">
                Başlık *
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Blog başlığı"
                className="mt-2 bg-black/50 border-[#1A1A1A] text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#888]">
                  Kategori
                </Label>
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="Örn: Duyuru, Protokol, Eğitim..."
                  className="mt-2 bg-black/50 border-[#1A1A1A] text-white"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#888]">
                  Yazar
                </Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="USMS"
                  className="mt-2 bg-black/50 border-[#1A1A1A] text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-[#888]">
                Görsel
              </Label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <div className="mt-2 flex gap-2 flex-wrap items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {imageFile ? imageFile.name : "Görsel Yükle"}
                </Button>
                {imageFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImageUpload}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? "Yükleniyor..." : "Yükle"}
                  </Button>
                )}
                {(form.image_url || imageFile) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {form.image_url && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={form.image_url}
                    alt="Önizleme"
                    className="h-20 w-auto rounded border border-border object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-[#888]">
                İçerik (Rich Text)
              </Label>
              <div className="mt-2 blog-editor [&_.ql-toolbar]:bg-gray-50 [&_.ql-toolbar]:border-gray-200 [&_.ql-container]:bg-gray-50 [&_.ql-container]:border-gray-200 [&_.ql-editor]:bg-white [&_.ql-editor]:text-gray-900 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-base">
                <ReactQuill
                  theme="snow"
                  value={form.content}
                  onChange={(v) => setForm({ ...form, content: v })}
                  modules={quillModules}
                  placeholder="Blog içeriği..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeModal}>
              İptal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ backgroundColor: GOLD, color: "#000" }}
            >
              {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
