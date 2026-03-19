"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Users } from "lucide-react"

import { AuthLayout } from "@/components/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { joinFamilySchema, type JoinFamilyFormValues } from "@/lib/validations/auth"

type OnboardingStep = "choose" | "create" | "join"

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>("choose")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [familyName, setFamilyName] = useState("")

  const joinForm = useForm<JoinFamilyFormValues>({
    resolver: zodResolver(joinFamilySchema),
    defaultValues: {
      familyCode: "",
    },
  })

  async function onCreateFamily() {
    if (!familyName.trim()) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      // TODO: Supabase wird im /backend Skill angebunden
      console.log("Create family:", familyName)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      // window.location.href = "/dashboard"
    } catch {
      setErrorMessage("Familie konnte nicht erstellt werden. Bitte versuche es erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  async function onJoinFamily(values: JoinFamilyFormValues) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // TODO: Supabase wird im /backend Skill angebunden
      console.log("Join family with code:", values.familyCode)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      // window.location.href = "/dashboard"
    } catch {
      setErrorMessage("Familien-Code ungueltig. Bitte pruefe den Code und versuche es erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "choose") {
    return (
      <AuthLayout
        title="Willkommen!"
        subtitle="Erstelle eine neue Familie oder tritt einer bestehenden bei."
      >
        <div className="flex w-full flex-col gap-4 md:flex-row">
          <Card
            className="flex-1 cursor-pointer shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
            onClick={() => setStep("create")}
            role="button"
            tabIndex={0}
            aria-label="Neue Familie erstellen"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setStep("create")
              }
            }}
          >
            <CardHeader className="items-center pb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Plus className="h-7 w-7" />
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <CardTitle className="mb-1 text-lg">Familie erstellen</CardTitle>
              <CardDescription>
                Starte eine neue Familiengruppe und lade Mitglieder ein.
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="flex-1 cursor-pointer shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
            onClick={() => setStep("join")}
            role="button"
            tabIndex={0}
            aria-label="Bestehender Familie beitreten"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setStep("join")
              }
            }}
          >
            <CardHeader className="items-center pb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/30 text-secondary-foreground">
                <Users className="h-7 w-7" />
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <CardTitle className="mb-1 text-lg">Familie beitreten</CardTitle>
              <CardDescription>
                Tritt mit einem Einladungs-Code einer bestehenden Familie bei.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    )
  }

  if (step === "create") {
    return (
      <AuthLayout
        title="Familie erstellen"
        subtitle="Gib deiner Familie einen Namen."
      >
        <Card className="w-full shadow-lg">
          <CardContent className="space-y-4 pt-6">
            {errorMessage && (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="familyName"
                className="text-sm font-medium leading-none"
              >
                Familienname
              </label>
              <Input
                id="familyName"
                type="text"
                placeholder="z.B. Familie Dula"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    onCreateFamily()
                  }
                }}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full text-base font-semibold"
              size="lg"
              disabled={isLoading || !familyName.trim()}
              onClick={onCreateFamily}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Erstellen...
                </>
              ) : (
                "Familie erstellen"
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep("choose")
                setErrorMessage(null)
              }}
              disabled={isLoading}
            >
              Zurueck
            </Button>
          </CardFooter>
        </Card>
      </AuthLayout>
    )
  }

  // step === "join"
  return (
    <AuthLayout
      title="Familie beitreten"
      subtitle="Gib den Einladungs-Code ein, den du erhalten hast."
    >
      <Card className="w-full shadow-lg">
        <Form {...joinForm}>
          <form onSubmit={joinForm.handleSubmit(onJoinFamily)}>
            <CardContent className="space-y-4 pt-6">
              {errorMessage && (
                <div
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {errorMessage}
                </div>
              )}

              <FormField
                control={joinForm.control}
                name="familyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Familien-Code</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="z.B. ABC123"
                        autoComplete="off"
                        disabled={isLoading}
                        className="text-center text-lg font-mono tracking-widest"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full text-base font-semibold"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Beitreten...
                  </>
                ) : (
                  "Familie beitreten"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("choose")
                  setErrorMessage(null)
                  joinForm.reset()
                }}
                disabled={isLoading}
              >
                Zurueck
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </AuthLayout>
  )
}
