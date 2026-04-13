"use client"

import { useCallback, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Camera, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MomentCard } from "@/components/moments/moment-card"
import { MomentDetailDialog } from "@/components/moments/moment-detail-dialog"
import { MomentFormDialog } from "@/components/moments/moment-form-dialog"
import { getMomentsAction } from "@/lib/actions/moments"
import type { Moment } from "@/lib/actions/moments"

interface MomentsPageClientProps {
  currentUserId: string
  isAdmin: boolean
  initialMoments: Moment[]
  initialHasMore: boolean
}

export function MomentsPageClient({
  currentUserId,
  isAdmin,
  initialMoments,
  initialHasMore,
}: MomentsPageClientProps) {
  const t = useTranslations("moments")
  const [moments, setMoments] = useState<Moment[]>(initialMoments)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoadingMore, startLoadMore] = useTransition()
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const reloadMoments = useCallback(async () => {
    const result = await getMomentsAction({ limit: 12 })
    if ("moments" in result) {
      setMoments(result.moments)
      setHasMore(result.hasMore)
    }
  }, [])

  function handleLoadMore() {
    if (moments.length === 0) return
    const cursor = moments[moments.length - 1].createdAt

    startLoadMore(async () => {
      const result = await getMomentsAction({ cursor, limit: 12 })
      if ("moments" in result) {
        setMoments((prev) => [...prev, ...result.moments])
        setHasMore(result.hasMore)
      }
    })
  }

  function handleMomentDeleted(momentId: string) {
    setMoments((prev) => prev.filter((m) => m.id !== momentId))
  }

  function handleCardClick(moment: Moment) {
    setSelectedMoment(moment)
    setDetailOpen(true)
  }

  return (
    <div className="px-4 sm:px-6 md:px-10">
      {/* Header */}
      <header className="mb-8 pt-6 md:pt-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t("pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("pageDescription")}
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="shrink-0 rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white font-semibold shadow-lg"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {t("addMoment")}
        </Button>
      </header>

      {/* Gallery */}
      {moments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low mb-6">
            <Camera className="h-9 w-9 text-muted-foreground" />
          </div>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">
            {t("emptyTitle")}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {t("emptyDescription")}
          </p>
          <Button
            onClick={() => setFormOpen(true)}
            className="rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white font-semibold"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t("emptyAction")}
          </Button>
        </div>
      ) : (
        <>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="moments-gallery"
          >
            {moments.map((moment) => (
              <MomentCard
                key={moment.id}
                moment={moment}
                onClick={() => handleCardClick(moment)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                variant="ghost"
                className="rounded-full"
              >
                {isLoadingMore ? "..." : t("loadMore")}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Form dialog */}
      <MomentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={reloadMoments}
      />

      {/* Detail dialog */}
      <MomentDetailDialog
        moment={selectedMoment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onDeleted={handleMomentDeleted}
      />
    </div>
  )
}
