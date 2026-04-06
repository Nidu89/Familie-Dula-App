"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Play,
  Pencil,
  Trash2,
  Clock,
  Star,
  ListChecks,
} from "lucide-react"
import type { Ritual } from "@/lib/actions/rituals"

interface RitualCardProps {
  ritual: Ritual
  isAdult: boolean
  isActiveRunning: boolean
  onStart: (ritual: Ritual) => void
  onEdit: (ritual: Ritual) => void
  onDelete: (ritual: Ritual) => void
}

export function RitualCard({
  ritual,
  isAdult,
  isActiveRunning,
  onStart,
  onEdit,
  onDelete,
}: RitualCardProps) {
  const t = useTranslations("rituals.card")
  const tc = useTranslations("common")

  return (
    <div className="rounded-[2rem] bg-card p-6 transition-shadow hover:shadow-md sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold text-foreground truncate">
            {ritual.name}
          </h3>
          {ritual.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {ritual.description}
            </p>
          )}
        </div>

        {ritual.isSystemTemplate && (
          <span className="shrink-0 rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
            {t("template")}
          </span>
        )}
      </div>

      {/* Meta info */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ListChecks className="h-3.5 w-3.5" />
          <span>{ritual.steps.length} {tc("steps")}</span>
        </div>

        {ritual.timerDurationMinutes !== null &&
          ritual.timerDurationMinutes > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{ritual.timerDurationMinutes} {tc("min")}</span>
            </div>
          )}

        {ritual.rewardPoints !== null && ritual.rewardPoints > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5" />
            <span>{ritual.rewardPoints} {tc("points")}</span>
          </div>
        )}
      </div>

      {/* Steps preview */}
      <div className="mt-4 space-y-1.5">
        {ritual.steps.slice(0, 3).map((step, i) => (
          <div
            key={step.id}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
              {i + 1}
            </div>
            <span className="truncate">{step.title}</span>
          </div>
        ))}
        {ritual.steps.length > 3 && (
          <p className="pl-7 text-xs text-muted-foreground">
            +{ritual.steps.length - 3} {t("moreSteps")}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        {isAdult && (
          <Button
            onClick={() => onStart(ritual)}
            disabled={isActiveRunning}
            className="flex-1 rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] font-bold text-white shadow-lg hover:opacity-90 disabled:opacity-50"
            aria-label={`Ritual "${ritual.name}" starten`}
          >
            <Play className="mr-2 h-4 w-4" />
            {t("start")}
          </Button>
        )}

        {isAdult && (
          <>
            <Button
              onClick={() => onEdit(ritual)}
              disabled={isActiveRunning}
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              aria-label={t("edit")}
              title={
                isActiveRunning
                  ? t("finishFirst")
                  : t("edit")
              }
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onDelete(ritual)}
              disabled={isActiveRunning}
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
              aria-label={t("delete")}
              title={
                isActiveRunning
                  ? t("finishFirst")
                  : t("delete")
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
