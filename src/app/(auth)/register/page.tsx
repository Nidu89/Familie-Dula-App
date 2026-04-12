"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { useTranslations } from "next-intl"

import { AuthLayout } from "@/components/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardFooter,
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
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validations/auth"
import { registerAction, resendConfirmationAction } from "@/lib/actions/auth"

export default function RegisterPage() {
  const t = useTranslations("auth.register")
  const tc = useTranslations("common")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState("")
  const [resendState, setResendState] = useState<"idle" | "loading" | "sent">("idle")

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true)
    setErrorMessage(null)

    const result = await registerAction(values.email, values.password, values.displayName)
    if (result?.error) {
      setErrorMessage(result.error)
      setIsLoading(false)
    } else {
      setSubmittedEmail(values.email)
      setIsSuccess(true)
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthLayout
        title={t("confirmTitle")}
        subtitle={t("confirmSubtitle")}
      >
        <Card className="w-full shadow-lg">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/30 text-3xl">
              <span role="img" aria-label={tc("email")}>
                &#x2709;&#xFE0F;
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("confirmText")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("noEmailReceived")}{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline disabled:opacity-50"
                disabled={resendState !== "idle"}
                onClick={async () => {
                  setResendState("loading")
                  await resendConfirmationAction(submittedEmail)
                  setResendState("sent")
                }}
              >
                {resendState === "loading"
                  ? t("resending")
                  : resendState === "sent"
                    ? t("resent")
                    : t("resend")}
              </button>
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">{t("backToLogin")}</Link>
            </Button>
          </CardFooter>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <Card className="w-full shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
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
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("displayNameLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={t("displayNamePlaceholder")}
                        autoComplete="name"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tc("email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={tc("emailPlaceholder")}
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tc("password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={tc("passwordPlaceholder")}
                          autoComplete="new-password"
                          disabled={isLoading}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword
                              ? tc("hidePassword")
                              : tc("showPassword")
                          }
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("confirmPasswordLabel")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder={t("confirmPasswordPlaceholder")}
                          autoComplete="new-password"
                          disabled={isLoading}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          aria-label={
                            showConfirmPassword
                              ? tc("hidePassword")
                              : tc("showPassword")
                          }
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex flex-col gap-2 md:gap-4">
              <Button
                type="submit"
                className="w-full text-base font-semibold"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("submitLoading")}
                  </>
                ) : (
                  t("submit")
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t("hasAccount")}{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  {t("login")}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </AuthLayout>
  )
}
