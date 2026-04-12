"use client"

import { useState, useCallback, useEffect, useReducer } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
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
import { Plus, ListChecks, X, Star } from "lucide-react"
import { useRituals } from "@/hooks/use-rituals"
import { useActiveRitual } from "@/hooks/use-active-ritual"
import { RitualsList } from "./rituals-list"
import { ActiveRitualView } from "./active-ritual-view"
import dynamic from "next/dynamic"

const RitualFormDialog = dynamic(() =>
  import("./ritual-form-dialog").then((m) => m.RitualFormDialog)
)
const RitualCompleteDialog = dynamic(() =>
  import("./ritual-complete-dialog").then((m) => m.RitualCompleteDialog)
)
import type { Ritual } from "@/lib/actions/rituals"
import type { RitualStep } from "@/lib/validations/rituals"

interface FamilyChild {
  id: string
  displayName: string
}

interface RitualsPageClientProps {
  isAdult: boolean
  userId: string
  familyId: string
  familyChildren?: FamilyChild[]
}

// --- Overlay state machine via reducer (no effects / no refs during render) ---

type OverlayState = {
  showComplete: boolean
  showTimerAlarm: boolean
  /** The ritual status value we last processed. Used to detect transitions. */
  lastRitualStatus: string
  /** The timer status value we last processed. */
  lastTimerStatus: string
}

type OverlayAction =
  | { type: "RITUAL_STARTED" }
  | { type: "TIMER_EXPIRED" }
  | { type: "RITUAL_COMPLETED" }
  | { type: "DISMISS_TIMER_ALARM" }
  | { type: "DISMISS_COMPLETE" }
  | { type: "SYNC"; ritualStatus: string; timerStatus: string }

function overlayReducer(state: OverlayState, action: OverlayAction): OverlayState {
  switch (action.type) {
    case "RITUAL_STARTED":
      return {
        ...state,
        showComplete: false,
        showTimerAlarm: false,
        lastRitualStatus: "running",
        lastTimerStatus: "idle",
      }
    case "TIMER_EXPIRED":
      return { ...state, showTimerAlarm: true, lastTimerStatus: "finished" }
    case "RITUAL_COMPLETED":
      return { ...state, showComplete: true, lastRitualStatus: "completed" }
    case "DISMISS_TIMER_ALARM":
      return { ...state, showTimerAlarm: false }
    case "DISMISS_COMPLETE":
      return { ...state, showComplete: false }
    case "SYNC":
      return { ...state, lastRitualStatus: action.ritualStatus, lastTimerStatus: action.timerStatus }
    default:
      return state
  }
}

export function RitualsPageClient({ isAdult, userId, familyId, familyChildren = [] }: RitualsPageClientProps) {
  const t = useTranslations("rituals")
  const tc = useTranslations("common")
  const {
    rituals,
    loading,
    error: ritualsError,
    createRitual,
    updateRitual,
    deleteRitual,
  } = useRituals()

  const activeRitual = useActiveRitual({ familyId, rituals })

  const [formOpen, setFormOpen] = useState(false)
  const [editingRitual, setEditingRitual] = useState<Ritual | null>(null)
  const [deletingRitual, setDeletingRitual] = useState<Ritual | null>(null)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  // Child selection state for starting rituals with reward points
  const [pendingStartRitual, setPendingStartRitual] = useState<Ritual | null>(null)

  const [overlay, dispatchOverlay] = useReducer(overlayReducer, {
    showComplete: false,
    showTimerAlarm: false,
    lastRitualStatus: "idle",
    lastTimerStatus: "idle",
  })

  const isActive =
    activeRitual.state.status !== "idle" &&
    activeRitual.state.status !== "completed"

  // Detect ritual status transitions via effect (subscribing to external hook state)
  useEffect(() => {
    const currentRitualStatus = activeRitual.state.status
    const currentTimerStatus = activeRitual.timer.state.status

    // Detect: ritual just started (running from idle/completed)
    if (
      currentRitualStatus === "running" &&
      overlay.lastRitualStatus !== "running" &&
      overlay.lastRitualStatus !== "paused"
    ) {
      dispatchOverlay({ type: "RITUAL_STARTED" })
      return
    }

    // Detect: timer just expired (global or per-step)
    if (
      currentTimerStatus === "finished" &&
      overlay.lastTimerStatus !== "finished" &&
      currentRitualStatus !== "completed"
    ) {
      dispatchOverlay({ type: "TIMER_EXPIRED" })

      // Play alarm sound (external system — valid in effect)
      try {
        const audio = new Audio("/timer-alarm.mp3")
        audio.loop = false
        void audio.play().catch(() => {
          // Autoplay blocked
        })
      } catch {
        // Audio not available
      }
      return
    }

    // Detect: ritual just completed
    // Points are now awarded server-side in updateRitualSessionAction — no client-side award needed
    if (
      currentRitualStatus === "completed" &&
      overlay.lastRitualStatus !== "completed"
    ) {
      dispatchOverlay({ type: "RITUAL_COMPLETED" })
      return
    }

    // Keep sync for statuses we didn't handle above
    if (
      currentRitualStatus !== overlay.lastRitualStatus ||
      currentTimerStatus !== overlay.lastTimerStatus
    ) {
      dispatchOverlay({
        type: "SYNC",
        ritualStatus: currentRitualStatus,
        timerStatus: currentTimerStatus,
      })
    }
  }, [activeRitual.state.status, activeRitual.timer.state.status]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartRitual = useCallback(
    (ritual: Ritual) => {
      // If ritual has reward points, show child selection dialog
      if (ritual.rewardPoints && ritual.rewardPoints > 0 && familyChildren.length > 0) {
        setPendingStartRitual(ritual)
        return
      }
      // No points or no children → start directly
      activeRitual.startRitual(ritual)
    },
    [activeRitual, familyChildren.length]
  )

  const handleChildSelected = useCallback(
    (childId: string, childName: string) => {
      if (!pendingStartRitual) return
      activeRitual.startRitual(pendingStartRitual, childId, childName)
      setPendingStartRitual(null)
    },
    [activeRitual, pendingStartRitual]
  )

  const handleStartWithoutChild = useCallback(() => {
    if (!pendingStartRitual) return
    activeRitual.startRitual(pendingStartRitual)
    setPendingStartRitual(null)
  }, [activeRitual, pendingStartRitual])

  const handleEditRitual = useCallback((ritual: Ritual) => {
    setEditingRitual(ritual)
    setFormOpen(true)
  }, [])

  const handleDeleteRitual = useCallback((ritual: Ritual) => {
    setDeletingRitual(ritual)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deletingRitual) return
    await deleteRitual(deletingRitual.id)
    setDeletingRitual(null)
  }, [deletingRitual, deleteRitual])

  const handleFormSubmit = useCallback(
    async (data: {
      name: string
      description?: string
      steps: RitualStep[]
      timerDurationMinutes?: number | null
      rewardPoints?: number | null
    }): Promise<boolean> => {
      if (editingRitual) {
        return updateRitual({
          id: editingRitual.id,
          ...data,
        })
      }
      return createRitual(data)
    },
    [editingRitual, createRitual, updateRitual]
  )

  const handleFormOpenChange = useCallback((open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditingRitual(null)
    }
  }, [])

  const handleCancelRitual = useCallback(() => {
    setCancelConfirmOpen(true)
  }, [])

  const confirmCancel = useCallback(() => {
    activeRitual.cancelRitual()
    setCancelConfirmOpen(false)
  }, [activeRitual])

  const handleCompleteClose = useCallback(() => {
    dispatchOverlay({ type: "DISMISS_COMPLETE" })
    activeRitual.cancelRitual()
  }, [activeRitual])

  const handleCompleteRestart = useCallback(() => {
    dispatchOverlay({ type: "DISMISS_COMPLETE" })
    activeRitual.restartRitual()
  }, [activeRitual])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {t("pageTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("pageSubtitle")}
          </p>
        </div>
        {isAdult && !isActive && (
          <Button
            onClick={() => {
              setEditingRitual(null)
              setFormOpen(true)
            }}
            className="rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] font-bold text-white shadow-lg hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("newRitual")}
          </Button>
        )}
      </div>

      {/* Error message */}
      {ritualsError && (
        <div className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          {ritualsError}
        </div>
      )}

      {/* Active ritual view */}
      {isActive && activeRitual.state.ritual && (
        <div className="space-y-4">
          <div className="rounded-[2rem] bg-surface-container-low p-6 sm:p-8">
            <ActiveRitualView
              activeRitual={activeRitual}
              isAdult={isAdult}
            />
          </div>

          {/* Cancel button */}
          {isAdult && (
            <div className="flex justify-center">
              <Button
                onClick={handleCancelRitual}
                variant="ghost"
                className="rounded-full text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="mr-2 h-4 w-4" />
                {t("cancelButton")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Child: no active ritual message */}
      {!isActive && !isAdult && rituals.length > 0 && (
        <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-muted py-10 text-center">
          <ListChecks className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            {t("noActiveRitual")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("askParent")}
          </p>
        </div>
      )}

      {/* Rituals list (hidden when a ritual is active for children) */}
      {(!isActive || isAdult) && (
        <RitualsList
          rituals={rituals}
          loading={loading}
          isAdult={isAdult}
          isActiveRunning={isActive}
          onStart={handleStartRitual}
          onEdit={handleEditRitual}
          onDelete={handleDeleteRitual}
        />
      )}

      {/* Form dialog */}
      <RitualFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        ritual={editingRitual}
        onSubmit={handleFormSubmit}
      />

      {/* Child selection dialog for rituals with reward points */}
      <AlertDialog
        open={!!pendingStartRitual}
        onOpenChange={(open) => {
          if (!open) setPendingStartRitual(null)
        }}
      >
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {t("childSelect.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("childSelect.description", {
                ritual: pendingStartRitual?.name ?? "",
                points: pendingStartRitual?.rewardPoints ?? 0,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            {familyChildren.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => handleChildSelected(child.id, child.displayName)}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-primary/10"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Star className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-medium text-foreground">{child.displayName}</span>
              </button>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStartWithoutChild}
              className="rounded-full bg-transparent text-foreground hover:bg-muted"
            >
              {t("childSelect.withoutPoints")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingRitual}
        onOpenChange={(open) => {
          if (!open) setDeletingRitual(null)
        }}
      >
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {t("deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription", { name: deletingRitual?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel ritual confirmation */}
      <AlertDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
      >
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {t("cancelTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("cancelDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {tc("back")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("cancelButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Timer alarm overlay */}
      {overlay.showTimerAlarm && !overlay.showComplete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-label={t("timeUp")}
        >
          <div className="mx-4 flex max-w-sm flex-col items-center gap-6 rounded-[3rem] bg-card p-10 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 animate-pulse">
              <span className="text-4xl">&#9200;</span>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {t("timeUp")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("timeUpHint")}
              </p>
            </div>
            <Button
              onClick={() => dispatchOverlay({ type: "DISMISS_TIMER_ALARM" })}
              className="h-14 w-full rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-base font-bold text-white shadow-lg hover:opacity-90"
            >
              {t("timeUpConfirm")}
            </Button>
          </div>
        </div>
      )}

      {/* Completion dialog */}
      {overlay.showComplete && activeRitual.state.ritual && (
        <RitualCompleteDialog
          ritualName={activeRitual.state.ritual.name}
          rewardPoints={activeRitual.state.ritual.rewardPoints}
          assignedToName={activeRitual.state.assignedToName}
          isAssignedUser={activeRitual.state.assignedTo === userId}
          timeRemaining={
            activeRitual.timer.state.status !== "idle" &&
            activeRitual.timer.state.status !== "finished"
              ? activeRitual.timer.state.remainingSeconds
              : null
          }
          isAdult={isAdult}
          onRestart={handleCompleteRestart}
          onClose={handleCompleteClose}
        />
      )}
    </div>
  )
}
