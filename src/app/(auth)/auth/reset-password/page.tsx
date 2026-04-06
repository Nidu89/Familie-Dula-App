"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"
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
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const t = useTranslations("auth.resetPassword")
  const tc = useTranslations("common")
  const router = useRouter()
  const searchParams = useSearchParams()
  const isInvited = searchParams.get("invited") === "true"
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsLoading(true)
    setErrorMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: values.password })

    if (error) {
      setErrorMessage(t("error"))
      setIsLoading(false)
      return
    }

    setIsSuccess(true)
    setIsLoading(false)
    setTimeout(() => router.push(isInvited ? '/dashboard' : '/login'), 2000)
  }

  if (isSuccess) {
    return (
      <AuthLayout
        title={t("successTitle")}
        subtitle={isInvited ? t("successSubtitleInvited") : t("successSubtitle")}
      >
        <Card className="w-full shadow-lg">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/30">
              <CheckCircle2 className="h-8 w-8 text-accent-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isInvited
                ? t("successTextInvited")
                : t("successText")}
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" size="lg">
              <Link href={isInvited ? "/dashboard" : "/login"}>
                {isInvited ? t("toDashboard") : t("toLogin")}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={isInvited ? t("titleInvited") : t("title")}
      subtitle={isInvited ? t("subtitleInvited") : t("subtitle")}
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
                  <br />
                  <Link
                    href="/forgot-password"
                    className="mt-1 inline-block font-medium underline"
                  >
                    {t("requestNewLink")}
                  </Link>
                </div>
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("newPasswordLabel")}</FormLabel>
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
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

            <CardFooter>
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
            </CardFooter>
          </form>
        </Form>
      </Card>
    </AuthLayout>
  )
}
