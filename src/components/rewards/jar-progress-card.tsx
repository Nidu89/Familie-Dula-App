"use client"

import { useTranslations } from "next-intl"
import {
  ShoppingCart,
  PiggyBank,
  Heart,
  Sparkles,
  History,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import type { SavingsJar } from "@/lib/actions/rewards"

interface JarProgressCardProps {
  jar: SavingsJar
  isAdultOrAdmin: boolean
  onEdit?: (jar: SavingsJar) => void
  onDelete?: (jar: SavingsJar) => void
  onShowHistory?: (jar: SavingsJar) => void
  onMoveUp?: (jar: SavingsJar) => void
  onMoveDown?: (jar: SavingsJar) => void
  isFirst?: boolean
  isLast?: boolean
}

const JAR_TYPE_CONFIG = {
  spend: {
    icon: ShoppingCart,
    colorClass: "text-chart-5",
    bgClass: "bg-chart-5/10",
  },
  save: {
    icon: PiggyBank,
    colorClass: "text-secondary",
    bgClass: "bg-secondary/10",
  },
  donate: {
    icon: Heart,
    colorClass: "text-chart-3",
    bgClass: "bg-chart-3/10",
  },
  custom: {
    icon: Sparkles,
    colorClass: "text-primary-foreground",
    bgClass: "bg-primary/10",
  },
}

export function JarProgressCard({
  jar,
  isAdultOrAdmin,
  onEdit,
  onDelete,
  onShowHistory,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: JarProgressCardProps) {
  const t = useTranslations("rewards.jars")

  const config = JAR_TYPE_CONFIG[jar.jarType] || JAR_TYPE_CONFIG.custom
  const Icon = config.icon

  const hasTarget = jar.targetAmount > 0
  const progress = hasTarget
    ? Math.min((jar.currentAmount / jar.targetAmount) * 100, 100)
    : 0
  const isGoalReached = hasTarget && jar.currentAmount >= jar.targetAmount

  // Progress bar color: <50% = muted, 50-99% = secondary, 100% = primary
  let progressBarClass = ""
  if (isGoalReached) {
    progressBarClass = "[&>div]:bg-primary"
  } else if (progress >= 50) {
    progressBarClass = "[&>div]:bg-secondary"
  }

  return (
    <Card
      className={`relative overflow-hidden transition-shadow hover:shadow-md ${
        isGoalReached ? "ring-2 ring-primary/30" : ""
      }`}
    >
      {/* Celebration sparkle effect for 100% */}
      {isGoalReached && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 right-3 text-primary animate-pulse text-lg">
            *
          </div>
          <div className="absolute top-4 right-8 text-primary/60 animate-pulse text-sm" style={{ animationDelay: "0.3s" }}>
            *
          </div>
          <div className="absolute bottom-3 left-4 text-primary/40 animate-pulse text-xs" style={{ animationDelay: "0.6s" }}>
            *
          </div>
        </div>
      )}

      <CardContent className="p-5">
        {/* Header: icon + name + actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgClass}`}
            >
              <Icon className={`h-5 w-5 ${config.colorClass}`} />
            </div>
            <div className="min-w-0">
              <h4 className="font-display font-bold text-sm truncate">{jar.name}</h4>
              <p className="text-xs text-muted-foreground">
                {t(`type.${jar.jarType}`)}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {isAdultOrAdmin && onMoveUp && !isFirst && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onMoveUp(jar)}
                aria-label={t("moveUp")}
              >
                <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
            {isAdultOrAdmin && onMoveDown && !isLast && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onMoveDown(jar)}
                aria-label={t("moveDown")}
              >
                <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
            {onShowHistory && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onShowHistory(jar)}
                aria-label={t("viewHistory")}
              >
                <History className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
            {isAdultOrAdmin && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onEdit(jar)}
                aria-label={t("editJar")}
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
            {isAdultOrAdmin && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:text-destructive"
                onClick={() => onDelete(jar)}
                aria-label={t("deleteJar")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Amount display */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${config.colorClass}`}>
              {jar.currentAmount}
            </span>
            {hasTarget && (
              <span className="text-sm text-muted-foreground">
                / {jar.targetAmount}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-1">
              {t("points")}
            </span>
          </div>
        </div>

        {/* Progress bar (only if target is set) */}
        {hasTarget && (
          <div className="space-y-1.5">
            <Progress value={progress} className={`h-2.5 ${progressBarClass}`} />
            <p className="text-[10px] text-muted-foreground">
              {isGoalReached
                ? t("goalReached")
                : t("remaining", { points: Math.max(0, jar.targetAmount - jar.currentAmount) })}
            </p>
          </div>
        )}

        {/* No target info */}
        {!hasTarget && (
          <p className="text-[10px] text-muted-foreground">
            {t("noTarget")}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
