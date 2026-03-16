import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import {
  fetchAdminRanks,
  fetchProfiles,
  createPersonnel,
  createProfileForUser,
} from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function AdminPersonnelPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rankId, setRankId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState("");
  const [manualRankId, setManualRankId] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const { data: ranks = [] } = useQuery({
    queryKey: ["adminRanks"],
    queryFn: fetchAdminRanks,
  });

  const { data: profiles = [], refetch } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !rankId) {
      toast({
        title: "Hata",
        description: "E-posta, şifre ve rütbe zorunludur.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Hata",
        description: "Şifre en az 6 karakter olmalıdır.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const result = await createPersonnel(email.trim().toLowerCase(), password, rankId);
    setSubmitting(false);
    if (result.success) {
      toast({
        title: "Personel oluşturuldu",
        description: `${email} adresine hesap oluşturuldu. İlk girişte rozet kaydı yapacak.`,
      });
      setEmail("");
      setPassword("");
      setRankId("");
      refetch();
    } else {
      toast({
        title: "Hata",
        description: result.error ?? "Personel oluşturulamadı.",
        variant: "destructive",
      });
    }
  };

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !manualRankId) {
      toast({
        title: "Hata",
        description: "Kullanıcı ID ve rütbe zorunludur.",
        variant: "destructive",
      });
      return;
    }
    setManualSubmitting(true);
    const result = await createProfileForUser(userId.trim(), manualRankId);
    setManualSubmitting(false);
    if (result.success) {
      toast({
        title: "Profil oluşturuldu",
        description: "Personel ilk girişte rozet kaydı yapacak.",
      });
      setUserId("");
      setManualRankId("");
      refetch();
    } else {
      toast({
        title: "Hata",
        description: result.error ?? "Profil oluşturulamadı.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Personel Oluştur</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-primary/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Yeni Personel Ekle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="personel@doj.gov"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="rank">Rütbe</Label>
                <Select value={rankId} onValueChange={setRankId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Rütbe seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {ranks.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.rank_name} (Prefix: {r.badge_prefix})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  "Personel Oluştur"
                )}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4">
              Edge Function deploy edilmediyse aşağıdaki "Manuel Ekleme" yöntemini kullanın.
            </p>

            <div className="mt-6 pt-6 border-t border-primary/15">
              <h4 className="font-medium mb-3">Manuel Ekleme (Edge Function olmadan)</h4>
              <p className="text-xs text-muted-foreground mb-3">
                1. Supabase Dashboard → Authentication → Users → Add user ile kullanıcı oluşturun<br />
                2. Oluşturulan kullanıcının UUID'sini kopyalayın<br />
                3. Aşağıya yapıştırıp rütbe seçin
              </p>
              <form onSubmit={handleManualCreate} className="space-y-4">
                <div>
                  <Label htmlFor="userId">Kullanıcı ID (UUID)</Label>
                  <Input
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="b5c95c93-c323-4688-963d-a39c3f5781e0"
                    className="mt-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="manualRank">Rütbe</Label>
                  <Select value={manualRankId} onValueChange={setManualRankId}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Rütbe seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {ranks.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.rank_name} (Prefix: {r.badge_prefix})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" variant="secondary" disabled={manualSubmitting}>
                  {manualSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Ekleniyor...
                    </>
                  ) : (
                    "Profil Oluştur"
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/15">
          <CardHeader>
            <CardTitle>Kayıtlı Personeller</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz personel yok.</p>
              ) : (
                profiles.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center py-2 border-b border-primary/10 last:border-0 text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        {p.ic_name || "—"} {p.badge_number && `#${p.badge_number}`}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {(p.rank as { rank_name?: string })?.rank_name ?? "—"}
                      </span>
                    </div>
                    <span
                      className={
                        p.is_registered
                          ? "text-green-600 dark:text-green-400"
                          : "text-amber-600 dark:text-amber-400"
                      }
                    >
                      {p.is_registered ? "Kayıtlı" : "Beklemede"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
