"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
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
import {
  createFamilySchema,
  joinFamilyByCodeSchema,
  type CreateFamilyFormValues,
  type JoinFamilyByCodeFormValues,
} from "@/lib/validations/family"
import {
  createFamilyAction,
  joinFamilyByCodeAction,
} from "@/lib/actions/family"

type OnboardingStep = "choose" | "create" | "join"

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Willkommen!" subtitle="Laden...">
          <div className="flex w-full items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AuthLayout>
      }
    >
      <OnboardingContent />
    </Suspense>
  )
}

function OnboardingContent() {
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get("invite")

  const [step, setStep] = useState<OnboardingStep>("choose")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createForm = useForm<CreateFamilyFormValues>({
    resolver: zodResolver(createFamilySchema),
    defaultValues: {
      familyName: "",
    },
  })

  const joinForm = useForm<JoinFamilyByCodeFormValues>({
    resolver: zodResolver(joinFamilyByCodeSchema),
    defaultValues: {
      code: "",
    },
  })

  // Wenn ein Einladungscode in der URL steht, direkt zum Beitritts-Schritt
  useEffect(() => {
    if (inviteCode) {
      setStep("join")
      joinForm.setValue("code", inviteCode)
    }
  }, [inviteCode, joinForm])

  async function onCreateFamily(values: CreateFamilyFormValues) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await createFamilyAction(values.familyName)
      // redirect() wirft intern einen Fehler, deshalb kommt man hier nur bei error an
      if (result?.error) {
        setErrorMessage(result.error)
      }
    } catch {
      // redirect() wirft eine NEXT_REDIRECT Exception – das ist kein Fehler
    } finally {
      setIsLoading(false)
    }
  }

  async function onJoinFamily(values: JoinFamilyByCodeFormValues) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await joinFamilyByCodeAction(values.code)
      if (result?.error) {
        setErrorMessage(result.error)
      }
    } catch {
      // redirect() wirft eine NEXT_REDIRECT Exception
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
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateFamily)}>
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
                  control={createForm.control}
                  name="familyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Familienname</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="z.B. Familie Dula"
                          disabled={isLoading}
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
                      Erstellen...
                    </>
                  ) : (
                    "Familie erstellen"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("choose")
                    setErrorMessage(null)
                    createForm.reset()
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

  // step === "join"
  return (
    <AuthLayout
      title="Familie beitreten"
      subtitle="Gib den 6-stelligen Einladungs-Code ein, den du erhalten hast."
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
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Einladungs-Code</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="123456"
                        autoComplete="off"
                        maxLength={6}
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
