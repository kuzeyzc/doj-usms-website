import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="icon"
                variant="outline"
                onClick={goPrev}
                disabled={page === 0}
                className="h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-heading tabular-nums min-w-[4ch]">
                {page + 1} / {pages}
              </span>
              <Button
                size="icon"
                variant="outline"
                onClick={goNext}
                disabled={page >= pages - 1}
                className="h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
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
