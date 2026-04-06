"use client"

import { LocaleProvider } from "@/context/locale-context"

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LocaleProvider initialLocale="en">
      {children}
    </LocaleProvider>
  )
}
