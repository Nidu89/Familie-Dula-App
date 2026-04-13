"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { HeartButton } from "@/components/moments/heart-button"
import { deleteMomentAction } from "@/lib/actions/moments"
import type { Moment } from "@/lib/actions/moments"
import { toast } from "sonner"

interface MomentDetailDialogProps {
  moment: Moment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId: string
  isAdmin: boolean
  onDeleted: (momentId: string) => void
}

export function MomentDetailDialog({
  moment,
  open,
  onOpenChange,
  currentUserId,
  isAdmin,
  onDeleted,
}: MomentDetailDialogProps) {
  const t = useTranslations("moments")
  const tc = useTranslations("common")
  const locale = useLocale()
  const [isDeleting, startDeleteTransition] = useTransition()

  if (!moment) return null

  const canDelete = moment.createdBy === currentUserId || isAdmin

  const formattedDate = new Date(moment.momentDate).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  function handleDelete() {
    if (!moment) return
    startDeleteTransition(async () => {
      const result = await deleteMomentAction({ momentId: moment.id })
      if ("error" in result) {
        toast.error(t("deleteError"))
        return
      }
      toast.success(t("deleted"))
      onDeleted(moment.id)
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[2rem] p-0 overflow-hidden">
        {/* Photo */}
        {moment.photoUrl && (
          <div className="relative aspect-video w-full bg-surface-container-low">
            <Image
              src={moment.photoUrl}
              alt={moment.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
          </div>
        )}

        <div className="px-7 pb-7 pt-5 space-y-4">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-foreground">
              {moment.title}
            </DialogTitle>
          </DialogHeader>

          {moment.description && (
            <p className="text-sm text-foreground/80 leading-relaxed">
              {moment.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
              <p className="text-xs text-muted-foreground">
                {t("by")} {moment.creatorName}
              </p>
            </div>

            <HeartButton
              momentId={moment.id}
              initialLiked={moment.likedByMe}
              initialCount={moment.heartCount}
            />
          </div>

          {/* Delete button */}
          {canDelete && (
            <div className="pt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    {tc("delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2rem]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteConfirmDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full">
                      {tc("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? tc("deleting") : tc("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
