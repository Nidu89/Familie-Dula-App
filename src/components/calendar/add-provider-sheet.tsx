"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2, ExternalLink } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { connectICloudAction } from "@/lib/actions/calendar-integrations"

interface AddProviderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProviderAdded: () => void
  existingProviders: string[]
}

type Step = "select" | "icloud-form"

export function AddProviderSheet({
  open,
  onOpenChange,
  onProviderAdded,
  existingProviders,
}: AddProviderSheetProps) {
  const t = useTranslations("calendarIntegrations")
  const tc = useTranslations("common")
  const { toast } = useToast()

  const [step, setStep] = useState<Step>("select")
  const [appleId, setAppleId] = useState("")
  const [appPassword, setAppPassword] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)

  const googleConnected = existingProviders.includes("google")
  const icloudConnected = existingProviders.includes("icloud")

  function handleClose() {
    setStep("select")
    setAppleId("")
    setAppPassword("")
    onOpenChange(false)
  }

  function handleGoogleConnect() {
    // Redirect to Google OAuth — handled server-side
    window.location.href = "/api/calendar/google/auth"
  }

  async function handleICloudConnect() {
    if (!appleId.trim() || !appPassword.trim()) return
    setIsConnecting(true)
    try {
      const result = await connectICloudAction({
        appleId: appleId.trim(),
        appPassword: appPassword.trim(),
      })
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      toast({ description: t("icloudConnected") })
      onProviderAdded()
      handleClose()
    } catch {
      toast({
        title: tc("error"),
        description: t("connectionError"),
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-[2rem] pb-8">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-lg font-bold text-secondary">
            {step === "select" ? t("addProvider") : t("connectICloud")}
          </SheetTitle>
          <SheetDescription>
            {step === "select"
              ? t("addProviderDescription")
              : t("icloudDescription")}
          </SheetDescription>
        </SheetHeader>

        {step === "select" ? (
          <div className="mt-6 space-y-3">
            {/* Google Calendar */}
            <button
              type="button"
              onClick={handleGoogleConnect}
              disabled={googleConnected}
              className="flex w-full items-center gap-4 rounded-2xl bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container disabled:opacity-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white text-sm font-bold">
                G
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-foreground">
                  Google Calendar
                </p>
                <p className="text-xs text-muted-foreground">
                  {googleConnected ? t("alreadyConnected") : t("googleDescription")}
                </p>
              </div>
              {!googleConnected && (
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* iCloud */}
            <button
              type="button"
              onClick={() => setStep("icloud-form")}
              disabled={icloudConnected}
              className="flex w-full items-center gap-4 rounded-2xl bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container disabled:opacity-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
                iC
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-foreground">iCloud</p>
                <p className="text-xs text-muted-foreground">
                  {icloudConnected ? t("alreadyConnected") : t("icloudShortDescription")}
                </p>
              </div>
            </button>
          </div>
        ) : (
          /* iCloud connection form */
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apple-id">{t("appleIdLabel")}</Label>
              <Input
                id="apple-id"
                type="email"
                placeholder="name@icloud.com"
                value={appleId}
                onChange={(e) => setAppleId(e.target.value)}
                disabled={isConnecting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="app-password">{t("appPasswordLabel")}</Label>
              <Input
                id="app-password"
                type="password"
                placeholder="xxxx-xxxx-xxxx-xxxx"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                disabled={isConnecting}
              />
              <p className="text-[10px] text-muted-foreground">
                {t("appPasswordHint")}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setStep("select")}
                disabled={isConnecting}
                className="flex-1"
              >
                {tc("back")}
              </Button>
              <Button
                onClick={handleICloudConnect}
                disabled={isConnecting || !appleId.trim() || !appPassword.trim()}
                className="flex-1 gap-2"
              >
                {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("connect")}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
