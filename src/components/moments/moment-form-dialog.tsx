"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { ImagePlus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createMomentAction } from "@/lib/actions/moments"
import { toast } from "sonner"
import { useErrorTranslation } from "@/lib/use-error-translation"

interface MomentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function MomentFormDialog({
  open,
  onOpenChange,
  onCreated,
}: MomentFormDialogProps) {
  const t = useTranslations("moments")
  const tc = useTranslations("common")
  const te = useErrorTranslation()
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (selected.size > 5 * 1024 * 1024) {
      toast.error(t("fileTooLarge"))
      return
    }

    setFile(selected)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(selected)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    // Add file separately (the input might be cleared)
    if (file) {
      formData.set("photo", file)
    }

    startTransition(async () => {
      const result = await createMomentAction(formData)
      if ("error" in result) {
        toast.error(te(result.error))
        return
      }
      toast.success(t("created"))
      onOpenChange(false)
      resetForm()
      onCreated()
    })
  }

  function resetForm() {
    setPreview(null)
    setFile(null)
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) resetForm()
    onOpenChange(newOpen)
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-secondary">
            {t("formTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo upload */}
          <div className="space-y-2">
            <Label>{t("photoLabel")}</Label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative flex w-full items-center justify-center rounded-[2rem] bg-surface-container-low overflow-hidden transition-colors hover:bg-surface-container aspect-video"
            >
              {preview ? (
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm">{t("photoDrop")}</span>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">{t("photoHint")}</p>
            {preview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => {
                  setPreview(null)
                  setFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
              >
                {t("photoChange")}
              </Button>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="moment-title">{t("titleLabel")}</Label>
            <Input
              id="moment-title"
              name="title"
              required
              maxLength={80}
              placeholder={t("titlePlaceholder")}
              className="rounded-[1rem]"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="moment-description">{t("descriptionLabel")}</Label>
            <textarea
              id="moment-description"
              name="description"
              maxLength={500}
              rows={3}
              placeholder={t("descriptionPlaceholder")}
              className="flex w-full rounded-[1rem] bg-surface-container-lowest px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="moment-date">{t("dateLabel")}</Label>
            <Input
              id="moment-date"
              name="momentDate"
              type="date"
              required
              defaultValue={today}
              data-testid="moment-date"
              className="rounded-[1rem]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              className="rounded-full"
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white font-semibold"
            >
              {isPending ? t("saving") : tc("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
