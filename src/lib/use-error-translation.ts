"use client"

import { useTranslations } from "next-intl"

/**
 * Hook that returns a function to translate server-action error codes.
 *
 * Server actions return error codes like "auth.notLoggedIn" which map to
 * i18n keys under the "errors" namespace. This hook wraps that translation
 * with a safe fallback: if the key doesn't exist in the i18n file, the raw
 * code is returned instead of throwing.
 *
 * Usage:
 *   const te = useErrorTranslation()
 *   if ("error" in result) {
 *     toast({ description: te(result.error) })
 *   }
 */
export function useErrorTranslation() {
  const t = useTranslations("errors")

  return function translateError(code: string | null | undefined): string {
    if (!code) return ""
    try {
      return t(code as Parameters<typeof t>[0])
    } catch {
      return code
    }
  }
}
