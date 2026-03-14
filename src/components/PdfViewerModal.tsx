import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
}

/** PDF önizleme modalı - tarayıcı içinde görüntüleme */
export default function PdfViewerModal({ open, onOpenChange, url, title }: PdfViewerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-surface border-primary/20">
        <DialogHeader>
          <DialogTitle className="font-heading text-primary">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-muted/30">
          <iframe
            src={`${url}#toolbar=1`}
            title={title}
            className="w-full h-[70vh] border-0"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
