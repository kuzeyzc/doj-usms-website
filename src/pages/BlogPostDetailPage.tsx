import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useBlogPost, useBlogData } from "@/hooks/useSiteData";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export default function BlogPostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: post, isLoading, error } = useBlogPost(id);
  const { data: allPosts = [] } = useBlogData(3, 0);

  const recentPosts = allPosts.slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-24 max-w-6xl">
            <div className="h-8 w-48 bg-surface-elevated rounded animate-pulse mb-8" />
            <div className="h-64 bg-surface-elevated rounded animate-pulse mb-8" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-surface-elevated rounded animate-pulse" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-24 text-center">
            <p className="text-muted-foreground font-body text-lg mb-6">
              {t("blog.notFound")}
            </p>
            <Link to="/blog">
              <Button
                variant="outline"
                className="gap-2 border-primary/60 text-primary hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("blog.backToList")}
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 lg:gap-16">
            {/* Main content - left */}
            <article>
              <Link to="/blog" className="inline-block mb-8">
                <motion.div
                  whileHover={{ x: -4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-primary/50 bg-primary/5 text-primary font-heading font-semibold text-base shadow-sm hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_20px_rgba(255,184,0,0.15)] transition-shadow"
                >
                  <ArrowLeft className="w-5 h-5" />
                  {t("blog.backToList")}
                </motion.div>
              </Link>

              <motion.header
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span
                    className="flex items-center gap-2 text-base font-bold font-heading"
                    style={{ color: "#FFB800" }}
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                    {post.author}
                  </span>
                  <span
                    className="flex items-center gap-2 text-base font-bold font-heading"
                    style={{ color: "#FFB800" }}
                  >
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    {format(new Date(post.created_at), "d MMMM yyyy", {
                      locale: tr,
                    })}
                  </span>
                </div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
                  {post.title}
                </h1>
                {post.image_url && (
                  <div className="aspect-video rounded-xl overflow-hidden mb-8 border border-border">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </motion.header>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="prose prose-invert prose-xl max-w-none blog-content text-foreground [&_p]:text-foreground [&_li]:text-foreground [&_span]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_p]:text-lg [&_li]:text-lg leading-normal [&_p]:my-0.5 [&_li]:my-0.5 [&_p:empty]:!my-0 [&_p:empty]:!min-h-0 [&_p:empty]:!hidden"
                dangerouslySetInnerHTML={{ __html: post.content || "" }}
              />
            </article>

            {/* Sidebar - right */}
            <aside className="lg:pt-12">
              <div className="sticky top-24">
                <h3 className="font-heading text-lg font-bold text-foreground mb-4 uppercase tracking-wider">
                  {t("blog.latestPosts")}
                </h3>
                <div className="space-y-4">
                  {recentPosts.map((p) => (
                    <Link
                      key={p.id}
                      to={`/blog/${p.id}`}
                      className="flex gap-3 p-3 rounded-xl bg-surface-elevated border border-border hover:border-primary/40 hover:bg-surface-elevated/80 transition-all group"
                    >
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 text-xs">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-body mb-1">
                          <Calendar className="w-3 h-3 flex-shrink-0 text-primary" />
                          {format(new Date(p.created_at), "d MMM yyyy", {
                            locale: tr,
                          })}
                        </p>
                        <p className="font-heading font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {p.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
