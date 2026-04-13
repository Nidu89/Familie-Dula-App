"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations, useLocale } from "next-intl"
import { ArrowUpCircle, ArrowDownCircle, RotateCcw } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  getJarHistoryAction,
  type JarTransaction,
} from "@/lib/actions/rewards"
import { useToast } from "@/hooks/use-toast"

interface JarHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jarId: string | null
  jarName: string
}

const SOURCE_TYPE_CONFIG = {
  task: {
    labelKey: "sourceTask" as const,
    icon: ArrowUpCircle,
    className: "text-chart-3",
  },
  manual: {
    labelKey: "sourceManual" as const,
    icon: ArrowUpCircle,
    className: "text-primary-foreground",
  },
  refund: {
    labelKey: "sourceRefund" as const,
    icon: RotateCcw,
    className: "text-destructive",
  },
}

export function JarHistorySheet({
  open,
  onOpenChange,
  jarId,
  jarName,
}: JarHistorySheetProps) {
  const { toast } = useToast()
  const t = useTranslations("rewards.jarHistory")
  const tc = useTranslations("common")
  const locale = useLocale()

  function formatDate(dateStr: string): string {
    const localeMap: Record<string, string> = { de: "de-DE", en: "en-US", fr: "fr-FR" }
    return new Date(dateStr).toLocaleDateString(localeMap[locale] || "de-DE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  const [transactions, setTransactions] = useState<JarTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchHistory = useCallback(async () => {
    if (!jarId) return
    setIsLoading(true)
    try {
      const result = await getJarHistoryAction(jarId)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      setTransactions(result.transactions)
    } catch {
      toast({
        title: tc("error"),
        description: t("loadError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [jarId, toast, tc, t])

  useEffect(() => {
    if (open && jarId) {
      fetchHistory()
    }
  }, [open, jarId, fetchHistory])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("title", { jarName })}</SheetTitle>
          <SheetDescription>
            {t("description", { jarName })}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ArrowDownCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("empty")}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {transactions.map((tx, index) => {
                const config = SOURCE_TYPE_CONFIG[tx.sourceType] || SOURCE_TYPE_CONFIG.task
                const Icon = tx.amount > 0 ? config.icon : ArrowDownCircle
                const isPositive = tx.amount > 0

                return (
                  <div key={tx.id}>
                    <div className="flex items-start gap-3 py-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ${isPositive ? config.className : "text-destructive"}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {t(config.labelKey)}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-xs font-semibold shrink-0 ${isPositive ? "border-chart-3/30 text-chart-3" : "border-destructive/30 text-destructive"}`}
                          >
                            {isPositive ? "+" : ""}
                            {tx.amount}
                          </Badge>
                        </div>
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          <span>{formatDate(tx.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {index < transactions.length - 1 && <Separator />}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
