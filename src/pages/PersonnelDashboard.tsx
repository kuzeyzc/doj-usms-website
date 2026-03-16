import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/auth";
import { FileText, Scale, Gavel } from "lucide-react";
import { fetchDocuments } from "@/lib/supabase";

export default function PersonnelDashboard() {
  const navigate = useNavigate();
  const { data: profile } = useQuery({
    queryKey: ["personnelProfile"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return null;
      return getProfile(user.id);
    },
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  const rank = profile?.rank as { rank_name?: string } | undefined;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-heading text-2xl font-bold mb-2">
          Hoş geldiniz, {profile?.ic_name ?? "Personel"}
        </h1>
        <p className="text-muted-foreground mb-8">
          Rozet #{profile?.badge_number} • {rank?.rank_name ?? "—"}
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card
            className="border-primary/15 hover:border-primary/30 transition-colors cursor-pointer"
            style={{
              background: "rgba(10, 10, 11, 0.5)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.2)",
            }}
            onClick={() => navigate("/documents")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Belgeler
              </CardTitle>
              <FileText className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{docs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Aktif belge
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card
            className="border-primary/15 hover:border-primary/30 transition-colors cursor-pointer"
            style={{
              background: "rgba(10, 10, 11, 0.5)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.2)",
            }}
            onClick={() => navigate("/warrant")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Adli Talep
              </CardTitle>
              <Scale className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Baskın, arama veya gözetleme talebi oluştur
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card
            className="border-primary/15 hover:border-primary/30 transition-colors cursor-pointer"
            style={{
              background: "rgba(10, 10, 11, 0.5)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.2)",
            }}
            onClick={() => navigate("/rules")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kurallar
              </CardTitle>
              <Gavel className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Birim kuralları ve prosedürleri
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
