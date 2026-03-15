import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urls: string[];
  title: string;
  resolveUrl: (url: string) => string;
  initialPage?: number;
}

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith(".pdf");
}

export default function DocumentPreviewModal({
  open,
  onOpenChange,
  urls,
  title,
  resolveUrl,
  initialPage = 0,
}: DocumentPreviewModalProps) {
  const [page, setPage] = useState(initialPage);
  const pages = urls?.length ?? 0;

  useEffect(() => {
    if (open) setPage(initialPage);
  }, [open, urls, initialPage]);
  const currentUrl = pages > 0 ? (urls[page] ?? urls[0]) : "";

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(pages - 1, p + 1));

  if (!currentUrl || pages === 0) return null;

  const resolved = resolveUrl(currentUrl);
  const isPdf = isPdfUrl(currentUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-surface border-primary/20">
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <DialogTitle className="font-heading text-primary truncate">
            {title}
          </DialogTitle>
          {pages > 1 && (
            <div className="flex items-center gap-1 shrink-0 rounded-lg bg-primary/10 border border-primary/25 p-1.5 shadow-sm">
              <button
                type="button"
                onClick={goPrev}
                disabled={page === 0}
                className="flex items-center justify-center w-10 h-10 rounded-md text-primary font-heading font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/20 hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                aria-label="Önceki sayfa"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-center min-w-[5rem] px-3 py-2">
                <span className="text-sm font-heading font-bold tabular-nums text-foreground">
                  {page + 1}
                </span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-sm font-heading font-semibold tabular-nums text-muted-foreground">
                  {pages}
                </span>
              </div>
              <button
                type="button"
                onClick={goNext}
                disabled={page >= pages - 1}
                className="flex items-center justify-center w-10 h-10 rounded-md text-primary font-heading font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/20 hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                aria-label="Sonraki sayfa"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </DialogHeader>
        <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-muted/30">
          {isPdf ? (
            <iframe
              src={`${resolved}#toolbar=1`}
              title={`${title} - Sayfa ${page + 1}`}
              className="w-full h-[70vh] border-0"
            />
          ) : (
            <img
              src={resolved}
              alt={`${title} - Sayfa ${page + 1}`}
              className="w-full h-auto max-h-[75vh] object-contain mx-auto"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
