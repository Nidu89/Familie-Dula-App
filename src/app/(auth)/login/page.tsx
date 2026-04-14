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
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth"
import { loginAction } from "@/lib/actions/auth"
import { useErrorTranslation } from "@/lib/use-error-translation"

export default function LoginPage() {
  const t = useTranslations("auth.login")
  const tc = useTranslations("common")
  const te = useErrorTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true)
    setErrorMessage(null)

    const result = await loginAction(values.email, values.password)
    if (result?.error) {
      setErrorMessage(te(result.error))
      setIsLoading(false)
    }
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
                    <FormLabel>{t("emailLabel")}</FormLabel>
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
                    <div className="flex items-center justify-between">
                      <FormLabel>{t("passwordLabel")}</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-primary hover:underline"
                        tabIndex={-1}
                      >
                        {t("forgotPassword")}
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={tc("passwordPlaceholder")}
                          autoComplete="current-password"
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
                {t("noAccount")}{" "}
                <Link
                  href="/register"
                  className="font-medium text-primary hover:underline"
                >
                  {t("register")}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </AuthLayout>
  )
}
