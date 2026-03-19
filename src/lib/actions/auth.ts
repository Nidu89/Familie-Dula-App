"use server"

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
} from '@/lib/validations/auth'

// In-Memory Rate-Limiting (per Serverinstanz; Supabase hat zusaetzlich API-seitiges Rate-Limiting)
const attempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false
  entry.count++
  return true
}

async function getIP(): Promise<string> {
  const headersList = await headers()
  // x-real-ip wird von Vercel/nginx gesetzt und ist zuverlaessiger als x-forwarded-for
  const realIP = headersList.get('x-real-ip')
  if (realIP) return realIP.trim()

  // Fallback: letzter Eintrag in x-forwarded-for (vom vertrauenswuerdigsten Proxy gesetzt)
  const forwarded = headersList.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',')
    return ips[ips.length - 1].trim()
  }

  return 'unknown'
}

export async function loginAction(email: string, password: string) {
  // BUG-10: Server-seitige Zod-Validierung
  const parsed = loginSchema.safeParse({ email, password })
  if (!parsed.success) {
    return { error: 'Ungueltige Eingaben.' }
  }

  const ip = await getIP()
  if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return { error: 'Zu viele Anmeldeversuche. Bitte versuche es spaeter erneut.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'Anmeldung fehlgeschlagen. Bitte pruefe deine Zugangsdaten.' }
  }

  redirect('/dashboard')
}

export async function registerAction(email: string, password: string, displayName: string) {
  // BUG-10: Server-seitige Zod-Validierung
  const parsed = registerSchema.safeParse({ email, password, confirmPassword: password, displayName })
  if (!parsed.success) {
    return { error: 'Ungueltige Eingaben.' }
  }

  const ip = await getIP()
  if (!checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: 'Zu viele Registrierungsversuche. Bitte versuche es spaeter erneut.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { displayName: parsed.data.displayName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    // BUG-3: Spezifische Fehlermeldung fuer bereits registrierte E-Mail
    if (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('registered')) {
      return { error: 'Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an.' }
    }
    return { error: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.' }
  }

  return { success: true }
}

export async function forgotPasswordAction(email: string) {
  // BUG-10: Server-seitige Zod-Validierung
  const parsed = forgotPasswordSchema.safeParse({ email })
  if (!parsed.success) {
    return { error: 'Bitte gib eine gueltige E-Mail-Adresse ein.' }
  }

  const ip = await getIP()
  if (!checkRateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: 'Zu viele Anfragen. Bitte versuche es spaeter erneut.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password`,
  })

  if (error) {
    return { error: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.' }
  }

  return { success: true }
}

export async function resendConfirmationAction(email: string) {
  // BUG-5: Echte Resend-Confirmation-Funktion
  const parsed = forgotPasswordSchema.safeParse({ email })
  if (!parsed.success) {
    return { error: 'Bitte gib eine gueltige E-Mail-Adresse ein.' }
  }

  const ip = await getIP()
  if (!checkRateLimit(`resend:${ip}`, 3, 60 * 60 * 1000)) {
    return { error: 'Zu viele Anfragen. Bitte versuche es spaeter erneut.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: 'E-Mail konnte nicht gesendet werden. Bitte versuche es erneut.' }
  }

  return { success: true }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
