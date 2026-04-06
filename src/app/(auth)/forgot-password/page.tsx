"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ArrowLeft } from "lucide-react"
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
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validations/auth"
import { forgotPasswordAction } from "@/lib/actions/auth"

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword")
  const tc = useTranslations("common")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsLoading(true)
    setErrorMessage(null)

    const result = await forgotPasswordAction(values.email)
    if (result?.error) {
      setErrorMessage(result.error)
      setIsLoading(false)
    } else {
      setIsSuccess(true)
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthLayout
        title={t("sentTitle")}
        subtitle={t("sentSubtitle")}
      >
        <Card className="w-full shadow-lg">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/30 text-3xl">
              <span role="img" aria-label={t("sentTitle")}>
                &#x1F4EC;
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("sentText")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("noEmailReceived")}{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => {
                  setIsSuccess(false)
                  form.reset()
                }}
              >
                {t("retry")}
              </button>
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("backToLogin")}
              </Link>
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
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
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

              <Button asChild variant="ghost" className="w-full">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("backToLogin")}
                </Link>
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </AuthLayout>
  )
}
