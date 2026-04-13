"use client"

import { useState, useCallback, useEffect, startTransition } from "react"
import { useTranslations } from "next-intl"
import { PiggyBank, Plus, Coins } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { JarProgressCard } from "@/components/rewards/jar-progress-card"
import { JarFormDialog } from "@/components/rewards/jar-form-dialog"
import { JarHistorySheet } from "@/components/rewards/jar-history-sheet"
import { AllocatePointsDialog } from "@/components/rewards/allocate-points-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getJarsForChildAction,
  deleteJarAction,
  reorderJarsAction,
  type SavingsJar,
  type ChildPointsSummary,
} from "@/lib/actions/rewards"

interface JarsSectionProps {
  childProfiles: ChildPointsSummary[]
  isAdultOrAdmin: boolean
  currentUserId: string
}

export function JarsSection({
  childProfiles: children,
  isAdultOrAdmin,
  currentUserId,
}: JarsSectionProps) {
  const t = useTranslations("rewards.jars")
  const tc = useTranslations("common")
  const { toast } = useToast()

  // Selected child
  const defaultChildId = isAdultOrAdmin
    ? children[0]?.id || ""
    : currentUserId
  const [selectedChildId, setSelectedChildId] = useState(defaultChildId)

  // Data state
  const [jars, setJars] = useState<SavingsJar[]>([])
  const [unallocatedPoints, setUnallocatedPoints] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [editJar, setEditJar] = useState<SavingsJar | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyJarId, setHistoryJarId] = useState<string | null>(null)
  const [historyJarName, setHistoryJarName] = useState("")
  const [deleteJarTarget, setDeleteJarTarget] = useState<SavingsJar | null>(null)
  const [allocateOpen, setAllocateOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const selectedChild = children.find((c) => c.id === selectedChildId)

  const fetchJars = useCallback(async () => {
    if (!selectedChildId) return
    setIsLoading(true)
    try {
      const result = await getJarsForChildAction(selectedChildId)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      setJars(result.jars)
      setUnallocatedPoints(result.unallocatedPoints)
    } catch {
      toast({
        title: tc("error"),
        description: t("loadError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedChildId, toast, tc, t])

  useEffect(() => {
    startTransition(() => {
      void fetchJars()
    })
  }, [fetchJars])

  function handleEditJar(jar: SavingsJar) {
    setEditJar(jar)
    setFormOpen(true)
  }

  function handleNewJar() {
    setEditJar(null)
    setFormOpen(true)
  }

  function handleShowHistory(jar: SavingsJar) {
    setHistoryJarId(jar.id)
    setHistoryJarName(jar.name)
    setHistoryOpen(true)
  }

  function handleDeleteJar(jar: SavingsJar) {
    setDeleteJarTarget(jar)
  }

  async function confirmDeleteJar() {
    if (!deleteJarTarget) return
    setIsDeleting(true)
    try {
      const result = await deleteJarAction(deleteJarTarget.id)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: t("deleted"),
        description: result.refundedAmount > 0
          ? t("deletedWithRefund", { name: deleteJarTarget.name, points: result.refundedAmount })
          : t("deletedDescription", { name: deleteJarTarget.name }),
      })
      setDeleteJarTarget(null)
      fetchJars()
    } catch {
      toast({
        title: tc("error"),
        description: t("deleteError"),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleMoveJar(jar: SavingsJar, direction: "up" | "down") {
    const currentIndex = jars.findIndex((j) => j.id === jar.id)
    if (currentIndex < 0) return
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (swapIndex < 0 || swapIndex >= jars.length) return

    // Optimistic update
    const newJars = [...jars]
    ;[newJars[currentIndex], newJars[swapIndex]] = [newJars[swapIndex], newJars[currentIndex]]
    setJars(newJars)

    const result = await reorderJarsAction(newJars.map((j) => j.id))
    if ("error" in result) {
      toast({ title: tc("error"), description: result.error, variant: "destructive" })
      fetchJars()
    }
  }

  // No children to show
  if (children.length === 0) {
    return null
  }

  return (
    <section>
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
            <PiggyBank className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">{t("sectionTitle")}</h2>
            <p className="text-xs text-muted-foreground">{t("sectionSubtitle")}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {t("badge")}
        </Badge>
      </div>

      {/* Child selector (only for adults with multiple children) */}
      {isAdultOrAdmin && children.length > 1 && (
        <div className="mb-4">
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder={t("selectChild")} />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Unallocated points info */}
      {!isLoading && (
        <div className="flex items-center justify-between gap-3 mb-4 rounded-xl bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary-foreground" />
            <span className="text-sm font-medium">
              {t("unallocated")}: <span className="font-bold text-primary-foreground">{unallocatedPoints}</span>
            </span>
          </div>
          {unallocatedPoints > 0 && jars.length > 0 && (
            <Button
              size="sm"
              variant="default"
              className="gap-1.5"
              onClick={() => setAllocateOpen(true)}
            >
              <Coins className="h-3.5 w-3.5" />
              {t("allocateNow")}
            </Button>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : jars.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center gap-3 py-8 text-center rounded-xl bg-muted/30">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <PiggyBank className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-muted-foreground">
              {t("empty")}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {t("emptyDescription")}
            </p>
          </div>
          {isAdultOrAdmin && (
            <Button
              variant="default"
              className="mt-2 gap-1.5"
              onClick={handleNewJar}
            >
              <Plus className="h-4 w-4" />
              {t("createFirst")}
            </Button>
          )}
        </div>
      ) : (
        /* Jar cards grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jars.map((jar, index) => (
            <JarProgressCard
              key={jar.id}
              jar={jar}
              isAdultOrAdmin={isAdultOrAdmin}
              onEdit={handleEditJar}
              onDelete={handleDeleteJar}
              onShowHistory={handleShowHistory}
              onMoveUp={(j) => handleMoveJar(j, "up")}
              onMoveDown={(j) => handleMoveJar(j, "down")}
              isFirst={index === 0}
              isLast={index === jars.length - 1}
            />
          ))}

          {/* Add new jar card (adults only) */}
          {isAdultOrAdmin && (
            <button
              onClick={handleNewJar}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/20 p-6 text-muted-foreground transition-colors hover:border-secondary/40 hover:text-secondary min-h-[120px]"
              aria-label={t("addJar")}
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">{t("addJar")}</span>
            </button>
          )}
        </div>
      )}

      {/* Dialogs */}
      <JarFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editJar={editJar}
        childProfileId={selectedChildId}
        childName={selectedChild?.displayName || ""}
        onSuccess={fetchJars}
      />

      <JarHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        jarId={historyJarId}
        jarName={historyJarName}
      />

      <AllocatePointsDialog
        open={allocateOpen}
        onOpenChange={setAllocateOpen}
        pointsToAllocate={unallocatedPoints}
        jars={jars}
        onSuccess={fetchJars}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteJarTarget}
        onOpenChange={(open) => !open && setDeleteJarTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteJarTarget && deleteJarTarget.currentAmount > 0
                ? t("deleteConfirmWithPoints", {
                    name: deleteJarTarget.name,
                    points: deleteJarTarget.currentAmount,
                  })
                : t("deleteConfirmEmpty", {
                    name: deleteJarTarget?.name || "",
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteJar}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? tc("deleting") : tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
