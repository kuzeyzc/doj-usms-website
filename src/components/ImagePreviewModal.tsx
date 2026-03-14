import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
}

export default function ImagePreviewModal({ open, onOpenChange, url, title }: ImagePreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-surface border-primary/20">
        <DialogHeader>
          <DialogTitle className="font-heading text-primary">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 rounded-lg overflow-hidden">
          <img
            src={url}
            alt={title}
            className="w-full h-auto max-h-[75vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
