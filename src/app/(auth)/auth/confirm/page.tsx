"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import type { EmailOtpType } from "@supabase/supabase-js"

import { AuthLayout } from "@/components/auth-layout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

type ConfirmState = "loading" | "success" | "error"

function ConfirmContent() {
  const [state, setState] = useState<ConfirmState>("loading")
  const searchParams = useSearchParams()

  useEffect(() => {
    async function confirm() {
      const token_hash = searchParams.get("token_hash")
      const type = searchParams.get("type") as EmailOtpType | null
      const error = searchParams.get("error")

      if (error) {
        setState("error")
        return
      }

      if (token_hash && type) {
        const supabase = createClient()
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type,
        })
        setState(verifyError ? "error" : "success")
        return
      }

      // Kein token_hash – pruefen ob Session bereits besteht
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setState(user ? "success" : "error")
    }

    confirm()
  }, [searchParams])

  return (
    <AuthLayout
      title={
        state === "loading"
          ? "E-Mail wird bestaetigt..."
          : state === "success"
            ? "E-Mail bestaetigt!"
            : "Bestaetigung fehlgeschlagen"
      }
    >
      <Card className="w-full shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          {state === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Bitte warte einen Moment...
              </p>
            </>
          )}

          {state === "success" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/30">
                <CheckCircle2 className="h-8 w-8 text-accent-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Deine E-Mail-Adresse wurde erfolgreich bestaetigt. Du
                kannst dich jetzt anmelden.
              </p>
            </>
          )}

          {state === "error" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">
                Der Bestaetigungslink ist ungueltig oder abgelaufen. Bitte
                fordere einen neuen Link an.
              </p>
            </>
          )}
        </CardContent>

        {state !== "loading" && (
          <CardFooter className="flex flex-col gap-2">
            <Button asChild className="w-full" size="lg">
              <Link href="/login">Zur Anmeldung</Link>
            </Button>
            {state === "error" && (
              <Button asChild variant="ghost" className="w-full">
                <Link href="/auth/resend-confirmation">
                  Neuen Bestaetigungslink anfordern
                </Link>
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </AuthLayout>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <AuthLayout title="E-Mail wird bestaetigt...">
        <div className="flex justify-center pt-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AuthLayout>
    }>
      <ConfirmContent />
    </Suspense>
  )
}
