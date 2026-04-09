"use client"

import { useTranslations } from "next-intl"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface ImageLightboxProps {
  src: string | null
  onClose: () => void
}

export function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  const t = useTranslations("chat")

  return (
    <Dialog open={!!src} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">{t("imageFullView")}</DialogTitle>
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-foreground shadow-lg transition-colors hover:bg-surface-container-high"
            aria-label={t("closeImage")}
          >
            <X className="h-5 w-5" />
          </button>
          {src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={t("imageFullView")}
              className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
