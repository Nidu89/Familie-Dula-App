"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { leaveFamilyAction } from "@/lib/actions/family"

interface LeaveFamilySectionProps {
  isLastAdmin: boolean
}

export function LeaveFamilySection({ isLastAdmin }: LeaveFamilySectionProps) {
  const t = useTranslations("family.leave")
  const tc = useTranslations("common")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  async function handleLeave() {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      await leaveFamilyAction()
    } catch {
      // redirect() wirft eine NEXT_REDIRECT Exception
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-lg text-destructive">{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <div
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {errorMessage}
          </div>
        )}

        {isLastAdmin ? (
          <p className="text-sm text-muted-foreground">
            {t("lastAdminWarning")}
          </p>
        ) : (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <LogOut className="h-4 w-4" />
                {t("title")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("confirmTitle")}</DialogTitle>
                <DialogDescription>
                  {t("confirmDescription")}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  {tc("cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLeave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("leaving")}
                    </>
                  ) : (
                    t("confirmButton")
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}
