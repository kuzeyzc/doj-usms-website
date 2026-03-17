import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, User, Calendar, Search } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useBlogData } from "@/hooks/useSiteData";
import { isAdminAuthenticated } from "@/lib/admin";
import type { BlogPost } from "@/lib/supabase-cms";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";

const POSTS_PER_PAGE = 9;
const SEARCH_FETCH_LIMIT = 100;
const GOLD = "#FFB800";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function filterPostsBySearch(posts: BlogPost[], query: string): BlogPost[] {
  if (!query.trim()) return posts;
  const q = query.trim().toLowerCase();
  return posts.filter((p) => {
    const title = (p.title || "").toLowerCase();
    const category = (p.category || "").toLowerCase();
    const author = (p.author || "").toLowerCase();
    const content = stripHtml(p.content || "").toLowerCase();
    return title.includes(q) || category.includes(q) || author.includes(q) || content.includes(q);
  });
}

function parseContentToBullets(html: string | null): { lines: string[]; hasMore: boolean } {
  if (!html?.trim()) return { lines: [], hasMore: false };
  const withNewlines = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/div>/gi, "\n");
  const text = withNewlines.replace(/<[^>]+>/g, "").trim();
  const allLines = text.split(/\n/).map((s) => s.trim()).filter(Boolean);
  const lines = allLines.slice(0, 8);
  const hasMore = allLines.length > 8;
  return { lines, hasMore };
}

function BlogCard({
  post,
  index,
}: {
  post: BlogPost;
  index: number;
}) {
  const { t } = useTranslation();
  const { lines: bullets, hasMore } = parseContentToBullets(post.content);

  return (
    <Link to={`/blog/${post.slug || post.id}`} className="block h-full">
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
        className="group flex flex-col h-full bg-surface-elevated border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/60 hover:shadow-[0_0_24px_rgba(255,184,0,0.15)] cursor-pointer"
      >
        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted rounded-t-xl">
          {/* Category badge - sağ üst, sarı tema */}
          {post.category && (
            <span
              className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-md font-heading font-bold text-xs uppercase tracking-wider text-black shadow-[0_2px_12px_rgba(255,184,0,0.4)] ring-1 ring-black/10"
              style={{ backgroundColor: GOLD }}
            >
              {post.category}
            </span>
          )}
          {post.image_url ? (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/80">
              <span className="text-muted-foreground text-xs font-heading uppercase tracking-widest">
                {t("blog.placeholder")}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 p-7">
          {/* Metadata: author left, date right */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className="flex items-center gap-1.5 text-base font-bold font-heading"
              style={{ color: GOLD }}
            >
              <User className="w-4 h-4 flex-shrink-0" />
              {post.author}
            </span>
            <span
              className="flex items-center gap-1.5 text-base font-bold font-heading"
              style={{ color: GOLD }}
            >
              <Calendar className="w-4 h-4 flex-shrink-0" />
              {format(new Date(post.created_at), "d MMMM yyyy", { locale: tr })}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-heading text-xl font-bold text-foreground mb-3 line-clamp-2">
            {post.title}
          </h3>

          {/* Content preview - first 8 lines */}
          {bullets.length > 0 && (
            <div className="space-y-1 mb-4 flex-1">
              {bullets.map((item, i) => (
                <p
                  key={i}
                  className="text-base text-muted-foreground font-body line-clamp-2"
                >
                  {item}
                </p>
              ))}
              {hasMore && (
                <p className="text-base text-muted-foreground/80 font-body italic">
                  ...
                </p>
              )}
            </div>
          )}

          {/* CTA - visual only, whole card is clickable */}
          <span
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-lg font-semibold font-heading uppercase tracking-wider text-base text-black transition-opacity group-hover:opacity-90"
            style={{ backgroundColor: GOLD }}
          >
            {t("blog.readMore")}
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </motion.article>
    </Link>
  );
}

export default function BlogPage() {
  const { t } = useTranslation();
  const isAdmin = isAdminAuthenticated();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = searchQuery.trim() ? SEARCH_FETCH_LIMIT : (page + 1) * POSTS_PER_PAGE;

  const { data: rawPosts = [], isLoading, isFetching } = useBlogData(limit, 0);
  const posts = filterPostsBySearch(rawPosts, searchQuery);
  const hasMore = !searchQuery.trim() && rawPosts.length === limit;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        {/* Header banner */}
        <section
          className="relative w-full py-24 md:py-32 overflow-hidden"
          style={{ minHeight: "280px" }}
        >
          <div className="absolute inset-0">
            <img
              src={heroBg}
              alt=""
              className="w-full h-full object-cover opacity-40 grayscale"
            />
            <div className="absolute inset-0 bg-background/70" />
          </div>
          <div className="relative container mx-auto px-4 flex items-center justify-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-heading text-4xl md:text-6xl font-bold text-foreground uppercase tracking-[0.2em]"
            >
              {t("blog.title")}
            </motion.h1>
          </div>
        </section>

        {/* Arama */}
        <section className="py-6">
          <div className="container mx-auto px-4 max-w-[1600px]">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-xl mx-auto"
            >
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none"
                strokeWidth={2}
              />
              <input
                type="text"
                placeholder={t("blog.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-surface-elevated border border-border rounded-xl font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm font-medium"
                >
                  ×
                </button>
              )}
            </motion.div>
          </div>
        </section>

        {/* Blog grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-[1600px]">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
                {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 rounded-xl bg-surface-elevated border border-border animate-pulse"
                />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="text-muted-foreground font-body text-lg">
                  {searchQuery.trim() ? t("blog.searchNoResults") : t("blog.empty")}
                </p>
                {isAdmin && (
                  <Link to="/admin/blog" className="inline-block mt-4">
                    <Button
                      style={{ backgroundColor: GOLD, color: "#000" }}
                      className="font-heading uppercase"
                    >
                      {t("blog.createFirst")}
                    </Button>
                  </Link>
                )}
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
                  {posts.map((post, i) => (
                    <BlogCard key={post.id} post={post} index={i} />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && posts.length >= POSTS_PER_PAGE && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center mt-16"
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      disabled={isFetching}
                      onClick={() => setPage((p) => p + 1)}
                      className="font-heading uppercase tracking-widest border-2 border-primary/60 text-primary hover:bg-primary/10 px-8 py-6"
                    >
                      {isFetching ? t("blog.loading") : t("blog.loadMore")}
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
