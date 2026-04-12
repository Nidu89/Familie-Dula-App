"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Clock, Pencil, Plus, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useTimerContext } from "@/context/timer-context"
import { TemplateFormDialog } from "./template-form-dialog"
import type { TimerTemplate } from "@/hooks/use-timer-templates"
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

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  return `${m} Min.`
}

export function TemplatesList() {
  const t = useTranslations("timer.templates")
  const tc = useTranslations("common")
  const {
    timer,
    templates,
    templatesLoading,
    templatesError,
    isAdult,
    deleteTemplate,
  } = useTimerContext()

  const [formOpen, setFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TimerTemplate | null>(
    null
  )
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmReplaceTemplate, setConfirmReplaceTemplate] =
    useState<TimerTemplate | null>(null)

  function handleTemplateClick(template: TimerTemplate) {
    if (!isAdult) return

    // If timer is running, ask for confirmation
    if (
      timer.state.status === "running" ||
      timer.state.status === "paused"
    ) {
      setConfirmReplaceTemplate(template)
      return
    }

    timer.start(template.durationSeconds)
  }

  function handleConfirmReplace() {
    if (!confirmReplaceTemplate) return
    timer.start(confirmReplaceTemplate.durationSeconds)
    setConfirmReplaceTemplate(null)
  }

  function handleEdit(template: TimerTemplate) {
    setEditingTemplate(template)
    setFormOpen(true)
  }

  async function handleDelete() {
    if (!confirmDeleteId) return
    await deleteTemplate(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  if (templatesLoading) {
    return (
      <section className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-36 shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>
    )
  }

  if (templatesError) {
    return (
      <section className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
        {templatesError}
      </section>
    )
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[10px] font-medium uppercase tracking-widest text-secondary">
          {t("title")}
        </h2>
        {isAdult && (
          <button
            type="button"
            onClick={() => {
              setEditingTemplate(null)
              setFormOpen(true)
            }}
            className="flex items-center gap-1 text-xs font-bold text-secondary transition-colors hover:text-secondary/80"
            aria-label={t("new")}
          >
            <Plus className="h-4 w-4" />
            {t("new")}
          </button>
        )}
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted py-8 text-center">
          <Clock className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {t("empty")}
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 hide-scrollbar max-w-full">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group relative flex shrink-0 flex-col items-start gap-1 rounded-2xl bg-card p-5 shadow-sm transition-all hover:shadow-md min-w-[9rem]"
            >
              <button
                type="button"
                onClick={() => handleTemplateClick(template)}
                disabled={!isAdult}
                className="w-full text-left"
                aria-label={`${template.name} starten (${formatDuration(template.durationSeconds)})`}
              >
                <p className="font-display text-sm font-bold text-foreground truncate max-w-[7rem]">
                  {template.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(template.durationSeconds)}
                </p>
              </button>

              {/* Edit / delete (adults only) — always visible on touch, hover-reveal on desktop */}
              {isAdult && !template.isSystemDefault && (
                <div className="absolute right-2 top-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleEdit(template)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`${template.name} bearbeiten`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(template.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`${template.name} loeschen`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* BUG-2: System default indicator */}
              {template.isSystemDefault && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {t("system")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Template form dialog */}
      <TemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        template={editingTemplate}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription")}
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
              {tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Replace timer confirmation */}
      <AlertDialog
        open={!!confirmReplaceTemplate}
        onOpenChange={(open) => !open && setConfirmReplaceTemplate(null)}
      >
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("replaceTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("replaceDescription", { name: confirmReplaceTemplate?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReplace}
              className="rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white hover:opacity-90"
            >
              {tc("continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
