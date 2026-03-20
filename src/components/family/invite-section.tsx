"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Mail, Hash, Copy, RefreshCw, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import {
  inviteByEmailSchema,
  type InviteByEmailFormValues,
} from "@/lib/validations/family"
import {
  inviteByEmailAction,
  generateInviteCodeAction,
} from "@/lib/actions/family"

interface InviteSectionProps {
  existingCode?: string | null
  existingCodeExpiresAt?: string | null
}

export function InviteSection({
  existingCode,
  existingCodeExpiresAt,
}: InviteSectionProps) {
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isCodeLoading, setIsCodeLoading] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(existingCode ?? null)
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(
    existingCodeExpiresAt ?? null
  )
  const [copied, setCopied] = useState(false)

  const emailForm = useForm<InviteByEmailFormValues>({
    resolver: zodResolver(inviteByEmailSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onInviteByEmail(values: InviteByEmailFormValues) {
    setIsEmailLoading(true)
    setEmailSuccess(false)
    setEmailError(null)

    try {
      const result = await inviteByEmailAction(values.email)
      if (result?.error) {
        setEmailError(result.error)
      } else {
        setEmailSuccess(true)
        emailForm.reset()
      }
    } catch {
      setEmailError("Einladung konnte nicht gesendet werden.")
    } finally {
      setIsEmailLoading(false)
    }
  }

  async function onGenerateCode() {
    setIsCodeLoading(true)
    setCodeError(null)

    try {
      const result = await generateInviteCodeAction()
      if ("error" in result && result.error) {
        setCodeError(result.error as string)
      } else if (result.code) {
        setInviteCode(result.code)
        // Simuliert: 7 Tage ab jetzt
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)
        setCodeExpiresAt(expiresAt.toISOString())
      }
    } catch {
      setCodeError("Code konnte nicht generiert werden.")
    } finally {
      setIsCodeLoading(false)
    }
  }

  async function onCopyCode() {
    if (!inviteCode) return
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: nicht unterstuetzt
    }
  }

  function formatExpiryDate(isoDate: string): string {
    const date = new Date(isoDate)
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Mitglied einladen</CardTitle>
        <CardDescription>
          Lade neue Mitglieder per E-Mail oder Einladungscode ein.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* E-Mail-Einladung */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-primary" />
            Per E-Mail einladen
          </div>

          {emailError && (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {emailError}
            </div>
          )}

          {emailSuccess && (
            <div
              className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary"
              role="status"
              aria-live="polite"
            >
              Einladung wurde erfolgreich gesendet!
            </div>
          )}

          <Form {...emailForm}>
            <form
              onSubmit={emailForm.handleSubmit(onInviteByEmail)}
              className="flex items-start gap-2"
            >
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">E-Mail-Adresse</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@beispiel.de"
                        disabled={isEmailLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isEmailLoading}>
                {isEmailLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Einladen"
                )}
              </Button>
            </form>
          </Form>
        </div>

        <Separator />

        {/* Einladungscode */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Hash className="h-4 w-4 text-primary" />
            Einladungscode
          </div>

          {codeError && (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {codeError}
            </div>
          )}

          {inviteCode ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border bg-muted/50 px-4 py-3 text-center font-mono text-2xl tracking-widest">
                  {inviteCode}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onCopyCode}
                  aria-label="Code kopieren"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                {codeExpiresAt && (
                  <p className="text-xs text-muted-foreground">
                    Gueltig bis {formatExpiryDate(codeExpiresAt)}
                  </p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onGenerateCode}
                  disabled={isCodeLoading}
                  className="text-xs"
                >
                  {isCodeLoading ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1 h-3 w-3" />
                  )}
                  Neuen Code generieren
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                Generiere einen 6-stelligen Code, den Familienmitglieder beim
                Beitreten eingeben koennen.
              </p>
              <Button
                variant="outline"
                onClick={onGenerateCode}
                disabled={isCodeLoading}
              >
                {isCodeLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generieren...
                  </>
                ) : (
                  <>
                    <Hash className="mr-2 h-4 w-4" />
                    Code generieren
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
