"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import { NextIntlClientProvider } from "next-intl"
import { updateLocaleAction } from "@/lib/actions/family"

type Locale = "de" | "en" | "fr"

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

// Pre-import all message bundles (they're small JSON files)
import deMessages from "@/i18n/messages/de.json"
import enMessages from "@/i18n/messages/en.json"
import frMessages from "@/i18n/messages/fr.json"

const messages: Record<Locale, typeof deMessages> = {
  de: deMessages,
  en: enMessages,
  fr: frMessages,
}

interface LocaleProviderProps {
  children: ReactNode
  initialLocale: Locale
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  // Sync if initialLocale changes (e.g. session re-fetched)
  useEffect(() => {
    setLocaleState(initialLocale)
  }, [initialLocale])

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale)
    await updateLocaleAction(newLocale)
  }, [])

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider")
  }
  return context
}
