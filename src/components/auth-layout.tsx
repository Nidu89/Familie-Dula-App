"use client"

import { useTranslations } from "next-intl"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const tc = useTranslations("common")

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
      {/* Decorative background shapes */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-16 -right-16 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* Logo / Brand area */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl text-primary-foreground shadow-lg">
            <span role="img" aria-label={tc("family")}>
              &#x1F3E0;
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="text-center text-sm text-muted-foreground md:text-base">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  )
}
